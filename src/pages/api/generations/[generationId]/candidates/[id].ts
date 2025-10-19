import type { APIRoute } from "astro";
import { EditCandidateCardSchema } from "../../../../../lib/schemas";
import { editCandidate } from "../../../../../lib/services/candidateService";
import { requireAuth, parseNumericId, errorResponse, jsonResponse, handleError } from "../../../../../lib/apiHelpers";

export const prerender = false;

/**
 * PATCH /api/generations/:generationId/candidates/:id
 *
 * Updates a candidate card's front or back content.
 * Only candidates in 'pending' status can be edited.
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "front": "Updated front text",  // optional
 *   "back": "Updated back text"     // optional
 * }
 *
 * Response (200):
 * {
 *   "candidate_card": CandidateCardDTO
 * }
 *
 * Error responses:
 * - 400: Invalid request body, no fields to update, or candidate not pending
 * - 401: Unauthorized (no valid session)
 * - 404: Candidate card not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const generationId = parseNumericId(context.params.generationId, "generationId");
    const candidateId = parseNumericId(context.params.id, "id");

    // Step 3: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = EditCandidateCardSchema.safeParse(requestBody);

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

    const updateData = validationResult.data;

    // Step 4: Edit the candidate card
    const candidateCard = await editCandidate(context.locals.supabase, userId, generationId, candidateId, updateData);

    // Step 5: Return success response
    return jsonResponse({ candidate_card: candidateCard }, 200);
  } catch (error) {
    return handleError(error);
  }
};
