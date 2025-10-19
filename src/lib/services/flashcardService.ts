import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardDTO, CreateFlashcardDTO, EditFlashcardDTO, ListFlashcardsQueryDTO } from "../../types";

/**
 * Service for managing flashcards CRUD operations and similarity checks.
 */

interface CreateFlashcardResult {
  flashcard: FlashcardDTO;
  warnings: string[];
}

interface ListFlashcardsResult {
  flashcards: FlashcardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Retrieves a single flashcard by ID.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param flashcardId - ID of the flashcard to retrieve
 * @returns The flashcard data
 * @throws Error if flashcard not found or database error occurs
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number
): Promise<FlashcardDTO> {
  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (error || !flashcard) {
    throw new Error("Flashcard not found");
  }

  return flashcard as FlashcardDTO;
}

/**
 * Lists flashcards with optional filtering, sorting, and pagination.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param query - Query parameters for filtering, sorting, and pagination
 * @returns Paginated list of flashcards
 * @throws Error if database error occurs
 */
export async function listFlashcards(
  supabase: SupabaseClient,
  userId: string,
  query: ListFlashcardsQueryDTO
): Promise<ListFlashcardsResult> {
  const { search, sort = "created_at", page = 1, limit = 20 } = query;

  // Build the base query
  let queryBuilder = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply search filter if provided
  if (search) {
    queryBuilder = queryBuilder.ilike("front", `%${search}%`);
  }

  // Apply sorting
  if (sort === "created_at") {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  } else if (sort === "due") {
    queryBuilder = queryBuilder.order("created_at", { ascending: true }); // Due date logic TBD
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  // Execute query
  const { data: flashcards, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to list flashcards: ${error.message}`);
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    flashcards: (flashcards || []) as FlashcardDTO[],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Checks for similar flashcards using text similarity.
 * Returns warnings for cards with similarity > 0.9.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param frontText - Front text to check for similarities
 * @param excludeId - Optional flashcard ID to exclude from similarity check
 * @returns Array of warning messages for similar cards
 */
async function checkSimilarFlashcards(
  supabase: SupabaseClient,
  userId: string,
  frontText: string,
  excludeId?: number
): Promise<string[]> {
  // Note: This is a simplified implementation.
  // For production, use pg_trgm similarity function with proper index
  let query = supabase
    .from("flashcards")
    .select("front")
    .eq("user_id", userId)
    .ilike("front", `%${frontText}%`)
    .limit(10);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data: similarCards } = await query;

  const warnings: string[] = [];
  if (similarCards && similarCards.length > 0) {
    for (const card of similarCards) {
      // Simple similarity check (in production, use actual similarity score)
      if (card.front.toLowerCase() === frontText.toLowerCase()) {
        warnings.push(`Duplicate card found: '${card.front}'`);
      } else if (
        card.front.toLowerCase().includes(frontText.toLowerCase()) ||
        frontText.toLowerCase().includes(card.front.toLowerCase())
      ) {
        warnings.push(`Similar card found: '${card.front}'`);
      }
    }
  }

  return warnings;
}

/**
 * Creates a single flashcard with duplicate detection.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param data - Flashcard data to create
 * @returns Created flashcard and any warnings about similar cards
 * @throws Error if database error occurs
 */
export async function createFlashcard(
  supabase: SupabaseClient,
  userId: string,
  data: CreateFlashcardDTO
): Promise<CreateFlashcardResult> {
  // Check for similar flashcards
  const warnings = await checkSimilarFlashcards(supabase, userId, data.front);

  // Create the flashcard
  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      front: data.front,
      back: data.back,
      source: data.source || "manual",
      generation_id: null,
    })
    .select()
    .single();

  if (error || !flashcard) {
    throw new Error(`Failed to create flashcard: ${error?.message || "Unknown error"}`);
  }

  return {
    flashcard: flashcard as FlashcardDTO,
    warnings,
  };
}

/**
 * Creates multiple flashcards in a single operation with duplicate detection.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param flashcardsData - Array of flashcard data to create
 * @returns Created flashcards and any warnings about similar cards
 * @throws Error if database error occurs
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  flashcardsData: CreateFlashcardDTO[]
): Promise<{ flashcards: FlashcardDTO[]; warnings: string[] }> {
  const warnings: string[] = [];

  // Check for duplicates across the batch
  for (const data of flashcardsData) {
    const cardWarnings = await checkSimilarFlashcards(supabase, userId, data.front);
    warnings.push(...cardWarnings);
  }

  // Prepare flashcards for insert
  const flashcardsToInsert = flashcardsData.map((data) => ({
    user_id: userId,
    front: data.front,
    back: data.back,
    source: data.source || "manual",
    generation_id: null,
  }));

  // Batch insert
  const { data: flashcards, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

  if (error || !flashcards) {
    throw new Error(`Failed to create flashcards: ${error?.message || "Unknown error"}`);
  }

  return {
    flashcards: flashcards as FlashcardDTO[],
    warnings,
  };
}

/**
 * Updates a flashcard's content with duplicate detection.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param flashcardId - ID of the flashcard to update
 * @param updateData - Partial data to update
 * @returns Updated flashcard and any warnings about similar cards
 * @throws Error if flashcard not found or database error occurs
 */
export async function editFlashcard(
  supabase: SupabaseClient,
  userId: string,
  flashcardId: number,
  updateData: EditFlashcardDTO
): Promise<CreateFlashcardResult> {
  // Verify flashcard exists
  const { data: existingFlashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingFlashcard) {
    throw new Error("Flashcard not found");
  }

  // Check for similar flashcards if front is being updated
  let warnings: string[] = [];
  if (updateData.front) {
    warnings = await checkSimilarFlashcards(supabase, userId, updateData.front, flashcardId);
  }

  // Update the flashcard
  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", flashcardId)
    .select()
    .single();

  if (error || !flashcard) {
    throw new Error(`Failed to update flashcard: ${error?.message || "Unknown error"}`);
  }

  return {
    flashcard: flashcard as FlashcardDTO,
    warnings,
  };
}

/**
 * Deletes a flashcard.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param flashcardId - ID of the flashcard to delete
 * @throws Error if flashcard not found or database error occurs
 */
export async function deleteFlashcard(supabase: SupabaseClient, userId: string, flashcardId: number): Promise<void> {
  // Verify flashcard exists
  const { data: existingFlashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select("id")
    .eq("id", flashcardId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existingFlashcard) {
    throw new Error("Flashcard not found");
  }

  // Delete the flashcard
  const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }
}
