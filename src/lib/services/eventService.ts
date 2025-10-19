import type { SupabaseClient } from "../../db/supabase.client";
import type { EventDTO, CreateEventDTO, ListEventsQueryDTO } from "../../types";

/**
 * Service for managing analytics events.
 */

interface ListEventsResult {
  events: EventDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Creates a new analytics event.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param data - Event data to create
 * @returns The created event
 * @throws Error if database error occurs
 */
export async function createEvent(supabase: SupabaseClient, userId: string, data: CreateEventDTO): Promise<EventDTO> {
  // Optionally verify flashcard ownership if flashcard_id is provided
  if (data.flashcard_id) {
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("id")
      .eq("id", data.flashcard_id)
      .eq("user_id", userId)
      .single();

    if (flashcardError || !flashcard) {
      throw new Error("Flashcard not found or does not belong to user");
    }
  }

  // Create the event
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      event_type: data.event_type,
      flashcard_id: data.flashcard_id || null,
      metadata: data.metadata || null,
    })
    .select()
    .single();

  if (error || !event) {
    throw new Error(`Failed to create event: ${error?.message || "Unknown error"}`);
  }

  return event as EventDTO;
}

/**
 * Lists events with optional filtering and pagination.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param query - Query parameters for filtering and pagination
 * @returns Paginated list of events
 * @throws Error if database error occurs or unauthorized access attempted
 */
export async function listEvents(
  supabase: SupabaseClient,
  userId: string,
  query: ListEventsQueryDTO
): Promise<ListEventsResult> {
  const { event_type, user_id, flashcard_id, from, to, page = 1, limit = 20 } = query;

  // Security check: ensure user can only access their own events
  // In MVP, no admin roles, so user_id must match current user
  if (user_id && user_id !== userId) {
    throw new Error("Access denied: cannot view other users' events");
  }

  // Build the base query
  let queryBuilder = supabase.from("events").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply optional filters
  if (event_type) {
    queryBuilder = queryBuilder.eq("event_type", event_type);
  }

  if (flashcard_id) {
    queryBuilder = queryBuilder.eq("flashcard_id", flashcard_id);
  }

  if (from) {
    queryBuilder = queryBuilder.gte("created_at", from);
  }

  if (to) {
    queryBuilder = queryBuilder.lte("created_at", to);
  }

  // Apply sorting (most recent first)
  queryBuilder = queryBuilder.order("created_at", { ascending: false });

  // Apply pagination
  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;
  queryBuilder = queryBuilder.range(fromIndex, toIndex);

  // Execute query
  const { data: events, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to list events: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    events: (events || []) as EventDTO[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
