import type { APIRoute } from "astro";
import { rejectCandidate } from "../../../../../../lib/services/candidateService";
import {
  requireAuth,
  parseNumericId,
  errorResponse,
  jsonResponse,
  handleError,
} from "../../../../../../lib/apiHelpers";

export const prerender = false;

/**
 * POST /api/generations/:generationId/candidates/:id/reject
 *
 * Rejects a single candidate card by updating its status to 'rejected'.
 * Rejected candidates are kept for analytics but not converted to flashcards.
 *
 * Requires authentication.
 *
 * Response (200):
 * {
 *   "candidate_card": CandidateCardDTO
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

    // Step 3: Reject the candidate card
    const candidateCard = await rejectCandidate(context.locals.supabase, userId, generationId, candidateId);

    // Step 4: Return success response
    return jsonResponse({ candidate_card: candidateCard }, 200);
  } catch (error) {
    return handleError(error);
  }
};
