import type { APIRoute } from "astro";
import { BulkAcceptCandidateCardsSchema } from "../../../../../lib/schemas";
import { bulkAcceptCandidates } from "../../../../../lib/services/candidateService";
import { requireAuth, parseNumericId, errorResponse, jsonResponse, handleError } from "../../../../../lib/apiHelpers";

export const prerender = false;

/**
 * POST /api/generations/:generationId/candidates/accept-bulk
 *
 * Accepts multiple candidate cards in a single atomic operation.
 * For each accepted candidate:
 * - Updates the candidate status to 'accepted'
 * - Creates a new flashcard with source 'ai_full'
 * - Increments the generation's accepted_unedited_count by the number of accepted candidates
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "ids": [1, 2, 3, 4, 5]  // Array of candidate card IDs (max 100)
 * }
 *
 * Response (201):
 * {
 *   "flashcards": FlashcardDTO[]
 * }
 *
 * Error responses:
 * - 400: Invalid request body, empty array, or some candidates already processed
 * - 401: Unauthorized (no valid session)
 * - 404: One or more candidate cards not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const generationId = parseNumericId(context.params.generationId, "generationId");

    // Step 3: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = BulkAcceptCandidateCardsSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { ids } = validationResult.data;

    // Step 4: Check for duplicate IDs in the array
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return errorResponse("Duplicate IDs found in the request", 400);
    }

    // Step 5: Accept all candidate cards
    const flashcards = await bulkAcceptCandidates(context.locals.supabase, userId, generationId, ids);

    // Step 6: Return success response
    return jsonResponse({ flashcards }, 201);
  } catch (error) {
    return handleError(error);
  }
};
