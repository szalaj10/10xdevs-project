import type { APIRoute } from "astro";
import { getGenerationById } from "../../../../lib/services/generationService";
import { requireAuth, parseNumericId, jsonResponse, handleError } from "../../../../lib/apiHelpers";

export const prerender = false;

/**
 * GET /api/generations/:id
 *
 * Retrieves a generation by ID along with all its candidate cards.
 * Allows users to check the status of a generation and review generated candidates.
 *
 * Requires authentication.
 *
 * Response (200):
 * {
 *   "generation": GenerationDTO,
 *   "candidate_cards": CandidateCardDTO[]
 * }
 *
 * Error responses:
 * - 400: Invalid generation ID format
 * - 401: Unauthorized (no valid session)
 * - 404: Generation not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const generationId = parseNumericId(context.params.id, "id");

    // Step 3: Fetch the generation with candidate cards
    const generationData = await getGenerationById(context.locals.supabase, userId, generationId);

    // Step 4: Return success response
    return jsonResponse(generationData, 200);
  } catch (error) {
    return handleError(error);
  }
};
