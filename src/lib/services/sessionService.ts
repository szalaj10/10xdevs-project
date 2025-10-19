import type { SupabaseClient } from "../../db/supabase.client";
import type {
  SessionDTO,
  CreateSessionResponseDTO,
  FlashcardDTO,
  SessionStatsDTO,
  GetSessionResponseDTO,
  SessionItemDTO,
} from "../../types";
import { ApiError } from "../errors";

/**
 * Service for managing study sessions with spaced repetition logic
 */

/**
 * Get session statistics (due and new flashcard counts)
 */
export async function getSessionStats(supabase: SupabaseClient, userId: string): Promise<SessionStatsDTO> {
  // Get flashcards that are due today (or overdue)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const { data: flashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("id, due_at")
    .eq("user_id", userId);

  if (flashcardsError) {
    throw new ApiError("Failed to fetch flashcards for stats", 500, flashcardsError);
  }

  const dueFlashcards = flashcards.filter((f) => {
    if (!f.due_at) return true; // Cards with no due_at are considered new
    const dueDate = new Date(f.due_at);
    return dueDate <= today;
  });

  // Cards without due_at are "new" cards
  const newFlashcards = flashcards.filter((f) => !f.due_at);

  return {
    dueCount: dueFlashcards.length - newFlashcards.length, // Due but not new
    newCount: newFlashcards.length,
  };
}

/**
 * Create a new study session with flashcards
 * Session logic: 80% due, 20% new; cap at 30 total, max 10 new
 */
export async function createSession(supabase: SupabaseClient, userId: string): Promise<CreateSessionResponseDTO> {
  // Step 1: Get due and new flashcards
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const { data: allFlashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("due_at", { ascending: true, nullsFirst: false });

  if (flashcardsError) {
    throw new ApiError("Failed to fetch flashcards", 500, flashcardsError);
  }

  if (!allFlashcards || allFlashcards.length === 0) {
    throw new ApiError("No flashcards available for study", 400);
  }

  // Separate due and new flashcards
  const dueFlashcards: FlashcardDTO[] = [];
  const newFlashcards: FlashcardDTO[] = [];

  for (const card of allFlashcards) {
    if (!card.due_at) {
      newFlashcards.push(card);
    } else {
      const dueDate = new Date(card.due_at);
      if (dueDate <= today) {
        dueFlashcards.push(card);
      }
    }
  }

  // Step 2: Apply session logic: 80% due, 20% new; max 30 total, max 10 new
  const maxTotal = 30;
  const maxNew = 10;

  // Calculate how many of each type to include
  let numNew = Math.min(newFlashcards.length, maxNew);
  const numDue = Math.min(dueFlashcards.length, maxTotal - numNew);

  // If we have space and not enough due cards, adjust
  if (numDue + numNew < maxTotal && newFlashcards.length > numNew) {
    numNew = Math.min(newFlashcards.length, maxTotal - numDue);
  }

  // Select flashcards
  const selectedDue = dueFlashcards.slice(0, numDue);
  const selectedNew = newFlashcards.slice(0, numNew);
  const sessionFlashcards = [...selectedDue, ...selectedNew];

  // Shuffle to mix due and new cards
  for (let i = sessionFlashcards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sessionFlashcards[i], sessionFlashcards[j]] = [sessionFlashcards[j], sessionFlashcards[i]];
  }

  // Step 3: Create session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
    })
    .select()
    .single();

  if (sessionError) {
    throw new ApiError("Failed to create session", 500, sessionError);
  }

  return {
    session,
    flashcards: sessionFlashcards,
  };
}

/**
 * Get session details including flashcards and items
 */
export async function getSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: number
): Promise<GetSessionResponseDTO> {
  // Get session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError) {
    if (sessionError.code === "PGRST116") {
      throw new ApiError("Session not found", 404);
    }
    throw new ApiError("Failed to fetch session", 500, sessionError);
  }

  // Get session items
  const { data: sessionItems, error: itemsError } = await supabase
    .from("session_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });

  if (itemsError) {
    throw new ApiError("Failed to fetch session items", 500, itemsError);
  }

  // Get flashcard IDs from session items
  const flashcardIds = sessionItems?.map((item) => item.flashcard_id) || [];

  // Get flashcards (if any)
  let flashcards: FlashcardDTO[] = [];
  if (flashcardIds.length > 0) {
    const { data: flashcardsData, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .in("id", flashcardIds);

    if (flashcardsError) {
      throw new ApiError("Failed to fetch flashcards", 500, flashcardsError);
    }

    // Sort flashcards in the order they appear in session items
    const flashcardMap = new Map(flashcardsData?.map((f) => [f.id, f]) || []);
    flashcards = flashcardIds.map((id) => flashcardMap.get(id)).filter(Boolean) as FlashcardDTO[];
  }

  return {
    session,
    flashcards,
    session_items: sessionItems || [],
  };
}

/**
 * Update session (e.g., mark as ended)
 */
export async function updateSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: number,
  updates: { ended_at?: string }
): Promise<SessionDTO> {
  const { data: session, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new ApiError("Session not found", 404);
    }
    throw new ApiError("Failed to update session", 500, error);
  }

  return session;
}

/**
 * Create a session item (flashcard rating)
 * Updates flashcard's SRS fields (interval, ease_factor, due_at)
 */
export async function createSessionItem(
  supabase: SupabaseClient,
  userId: string,
  sessionId: number,
  flashcardId: number,
  rating: -1 | 0 | 1
): Promise<SessionItemDTO> {
  // Step 1: Verify session belongs to user
  const { error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (sessionError) {
    if (sessionError.code === "PGRST116") {
      throw new ApiError("Session not found", 404);
    }
    throw new ApiError("Failed to verify session", 500, sessionError);
  }

  // Step 2: Get flashcard to update SRS fields
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (flashcardError) {
    if (flashcardError.code === "PGRST116") {
      throw new ApiError("Flashcard not found", 404);
    }
    throw new ApiError("Failed to fetch flashcard", 500, flashcardError);
  }

  // Step 3: Calculate new SRS values
  const currentInterval = flashcard.interval_days || 0;
  const currentEaseFactor = flashcard.ease_factor || 2.5;
  const currentRepetitions = flashcard.repetitions || 0;

  let newInterval: number;
  let newEaseFactor = currentEaseFactor;
  let newRepetitions = currentRepetitions;
  let newDueAt: Date;

  switch (rating) {
    case -1: // Incorrect - reset
      newInterval = 0;
      newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
      newRepetitions = 0; // Reset repetition count
      newDueAt = new Date(); // Due today (reset)
      break;
    case 0: // Partial - small increase
      newInterval = Math.max(1, Math.round(currentInterval * 1.2));
      newRepetitions = currentRepetitions; // Keep repetitions as is
      newDueAt = new Date();
      newDueAt.setDate(newDueAt.getDate() + 2); // +2 days
      break;
    case 1: // Correct - normal increase
      if (currentInterval === 0) {
        newInterval = 1;
      } else {
        newInterval = Math.round(currentInterval * currentEaseFactor);
      }
      newEaseFactor = Math.min(2.5, currentEaseFactor + 0.1); // Cap at 2.5
      newRepetitions = currentRepetitions + 1; // Increment successful reviews
      newDueAt = new Date();
      newDueAt.setDate(newDueAt.getDate() + Math.max(4, newInterval)); // +4 days minimum
      break;
  }

  // Step 4: Update flashcard
  const { error: updateError } = await supabase
    .from("flashcards")
    .update({
      interval_days: newInterval,
      ease_factor: newEaseFactor,
      repetitions: newRepetitions,
      due_at: newDueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", flashcardId)
    .eq("user_id", userId);

  if (updateError) {
    throw new ApiError("Failed to update flashcard SRS fields", 500, updateError);
  }

  // Step 5: Create session item
  const { data: sessionItem, error: itemError } = await supabase
    .from("session_items")
    .insert({
      session_id: sessionId,
      flashcard_id: flashcardId,
      rating,
    })
    .select()
    .single();

  if (itemError) {
    throw new ApiError("Failed to create session item", 500, itemError);
  }

  return sessionItem;
}
