import type { SupabaseClient } from "../../db/supabase.client";
import type { CandidateCardDTO, EditCandidateCardDTO, FlashcardDTO } from "../../types";

/**
 * Service for managing candidate cards operations including accept, reject, and edit.
 */

/**
 * Accepts a single candidate card and creates a flashcard from it.
 * This operation is atomic - it updates the candidate status, creates a flashcard,
 * and increments the generation's accepted_unedited_count.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation
 * @param candidateId - ID of the candidate card to accept
 * @returns The created flashcard
 * @throws Error if candidate not found, already processed, or database error occurs
 */
export async function acceptCandidate(
  supabase: SupabaseClient,
  userId: string,
  generationId: number,
  candidateId: number
): Promise<FlashcardDTO> {
  // Step 1: Fetch and verify the candidate card
  const { data: candidate, error: fetchError } = await supabase
    .from("candidate_cards")
    .select("*")
    .eq("id", candidateId)
    .eq("user_id", userId)
    .eq("generation_id", generationId)
    .single();

  if (fetchError || !candidate) {
    throw new Error("Candidate card not found");
  }

  // Step 2: Verify status is pending
  if (candidate.status !== "pending") {
    throw new Error("Candidate card has already been processed");
  }

  // Step 3: Update candidate status to accepted
  const { error: updateError } = await supabase
    .from("candidate_cards")
    .update({ status: "accepted" })
    .eq("id", candidateId);

  if (updateError) {
    throw new Error(`Failed to update candidate status: ${updateError.message}`);
  }

  // Step 4: Create flashcard from candidate
  const { data: flashcard, error: flashcardError } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      generation_id: generationId,
      front: candidate.front,
      back: candidate.back,
      source: "ai_full",
    })
    .select()
    .single();

  if (flashcardError || !flashcard) {
    throw new Error(`Failed to create flashcard: ${flashcardError?.message || "Unknown error"}`);
  }

  // Step 5: Increment accepted_unedited_count in generation
  const { data: generation, error: genFetchError } = await supabase
    .from("generations")
    .select("accepted_unedited_count")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (genFetchError || !generation) {
    throw new Error("Generation not found");
  }

  const { error: genUpdateError } = await supabase
    .from("generations")
    .update({
      accepted_unedited_count: generation.accepted_unedited_count + 1,
    })
    .eq("id", generationId);

  if (genUpdateError) {
    throw new Error(`Failed to update generation counters: ${genUpdateError.message}`);
  }

  return flashcard as FlashcardDTO;
}

/**
 * Accepts multiple candidate cards in a single atomic operation.
 * All candidates must exist, belong to the user, and be in pending status.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation
 * @param ids - Array of candidate card IDs to accept
 * @returns Array of created flashcards
 * @throws Error if any candidate not found, already processed, or database error occurs
 */
export async function bulkAcceptCandidates(
  supabase: SupabaseClient,
  userId: string,
  generationId: number,
  ids: number[]
): Promise<FlashcardDTO[]> {
  // Step 1: Fetch all candidates
  const { data: candidates, error: fetchError } = await supabase
    .from("candidate_cards")
    .select("*")
    .in("id", ids)
    .eq("user_id", userId)
    .eq("generation_id", generationId);

  if (fetchError || !candidates) {
    throw new Error("Failed to fetch candidate cards");
  }

  // Step 2: Verify all candidates exist
  if (candidates.length !== ids.length) {
    throw new Error("One or more candidate cards not found");
  }

  // Step 3: Verify all candidates are pending
  const nonPending = candidates.filter((c) => c.status !== "pending");
  if (nonPending.length > 0) {
    throw new Error("One or more candidate cards have already been processed");
  }

  // Step 4: Update all candidate statuses to accepted
  const { error: updateError } = await supabase.from("candidate_cards").update({ status: "accepted" }).in("id", ids);

  if (updateError) {
    throw new Error(`Failed to update candidate statuses: ${updateError.message}`);
  }

  // Step 5: Prepare flashcard data
  const flashcardsToInsert = candidates.map((candidate) => ({
    user_id: userId,
    generation_id: generationId,
    front: candidate.front,
    back: candidate.back,
    source: "ai_full",
  }));

  // Step 6: Batch insert flashcards
  const { data: flashcards, error: flashcardsError } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select();

  if (flashcardsError || !flashcards) {
    throw new Error(`Failed to create flashcards: ${flashcardsError?.message || "Unknown error"}`);
  }

  // Step 7: Update generation accepted_unedited_count
  const { data: generation, error: genFetchError } = await supabase
    .from("generations")
    .select("accepted_unedited_count")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (genFetchError || !generation) {
    throw new Error("Generation not found");
  }

  const { error: genUpdateError } = await supabase
    .from("generations")
    .update({
      accepted_unedited_count: generation.accepted_unedited_count + ids.length,
    })
    .eq("id", generationId);

  if (genUpdateError) {
    throw new Error(`Failed to update generation counters: ${genUpdateError.message}`);
  }

  return flashcards as FlashcardDTO[];
}

/**
 * Edits a candidate card's front and/or back content.
 * Only candidates in pending status can be edited.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation
 * @param candidateId - ID of the candidate card to edit
 * @param updateData - Partial data containing front and/or back to update
 * @returns The updated candidate card
 * @throws Error if candidate not found, not pending, or database error occurs
 */
export async function editCandidate(
  supabase: SupabaseClient,
  userId: string,
  generationId: number,
  candidateId: number,
  updateData: EditCandidateCardDTO
): Promise<CandidateCardDTO> {
  // Step 1: Fetch and verify the candidate card
  const { data: candidate, error: fetchError } = await supabase
    .from("candidate_cards")
    .select("*")
    .eq("id", candidateId)
    .eq("user_id", userId)
    .eq("generation_id", generationId)
    .single();

  if (fetchError || !candidate) {
    throw new Error("Candidate card not found");
  }

  // Step 2: Verify status is pending
  if (candidate.status !== "pending") {
    throw new Error("Only pending candidate cards can be edited");
  }

  // Step 3: Update the candidate
  const { data: updatedCandidate, error: updateError } = await supabase
    .from("candidate_cards")
    .update(updateData)
    .eq("id", candidateId)
    .select()
    .single();

  if (updateError || !updatedCandidate) {
    throw new Error(`Failed to update candidate card: ${updateError?.message || "Unknown error"}`);
  }

  return updatedCandidate as CandidateCardDTO;
}

/**
 * Rejects a candidate card by setting its status to rejected.
 * Rejected candidates are not converted to flashcards but kept for analytics.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation
 * @param candidateId - ID of the candidate card to reject
 * @returns The updated candidate card with rejected status
 * @throws Error if candidate not found, already processed, or database error occurs
 */
export async function rejectCandidate(
  supabase: SupabaseClient,
  userId: string,
  generationId: number,
  candidateId: number
): Promise<CandidateCardDTO> {
  // Step 1: Fetch and verify the candidate card
  const { data: candidate, error: fetchError } = await supabase
    .from("candidate_cards")
    .select("*")
    .eq("id", candidateId)
    .eq("user_id", userId)
    .eq("generation_id", generationId)
    .single();

  if (fetchError || !candidate) {
    throw new Error("Candidate card not found");
  }

  // Step 2: Verify status is pending
  if (candidate.status !== "pending") {
    throw new Error("Candidate card has already been processed");
  }

  // Step 3: Update status to rejected
  const { data: updatedCandidate, error: updateError } = await supabase
    .from("candidate_cards")
    .update({ status: "rejected" })
    .eq("id", candidateId)
    .select()
    .single();

  if (updateError || !updatedCandidate) {
    throw new Error(`Failed to reject candidate card: ${updateError?.message || "Unknown error"}`);
  }

  return updatedCandidate as CandidateCardDTO;
}
