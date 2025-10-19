import type { APIRoute } from "astro";
import { acceptCandidate } from "../../../../../../lib/services/candidateService";
import {
  requireAuth,
  parseNumericId,
  jsonResponse,
  handleError,
} from "../../../../../../lib/apiHelpers";

export const prerender = false;

/**
 * POST /api/generations/:generationId/candidates/:id/accept
 *
 * Accepts a single candidate card and creates a flashcard from it.
 * This operation:
 * - Updates the candidate status to 'accepted'
 * - Creates a new flashcard with source 'ai_full'
 * - Increments the generation's accepted_unedited_count
 *
 * Requires authentication.
 *
 * Response (201):
 * {
 *   "flashcard": FlashcardDTO
 * }
 *
 * Error responses:
 * - 400: Invalid ID format or candidate already processed
 * - 401: Unauthorized (no valid session)
 * - 404: Candidate card not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const generationId = parseNumericId(context.params.generationId, "generationId");
    const candidateId = parseNumericId(context.params.id, "id");

    // Step 3: Accept the candidate card
    const flashcard = await acceptCandidate(context.locals.supabase, userId, generationId, candidateId);

    // Step 4: Return success response
    return jsonResponse({ flashcard }, 201);
  } catch (error) {
    return handleError(error);
  }
};
