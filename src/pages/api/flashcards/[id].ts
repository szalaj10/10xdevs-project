import type { APIRoute } from "astro";
import { EditFlashcardSchema } from "../../../lib/schemas";
import { getFlashcardById, editFlashcard, deleteFlashcard } from "../../../lib/services/flashcardService";
import { requireAuth, parseNumericId, errorResponse, jsonResponse, handleError } from "../../../lib/apiHelpers";

export const prerender = false;

/**
 * GET /api/flashcards/:id
 *
 * Retrieves a single flashcard by ID.
 *
 * Requires authentication.
 *
 * Response (200):
 * {
 *   "flashcard": FlashcardDTO
 * }
 *
 * Error responses:
 * - 400: Invalid flashcard ID format
 * - 401: Unauthorized (no valid session)
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const flashcardId = parseNumericId(context.params.id, "id");

    // Step 3: Fetch the flashcard
    const flashcard = await getFlashcardById(context.locals.supabase, userId, flashcardId);

    // Step 4: Return success response
    return jsonResponse({ flashcard }, 200);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PATCH /api/flashcards/:id
 *
 * Updates a flashcard's content. Performs duplicate detection if front is updated.
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "front": "string (max 2000 chars, optional)",
 *   "back": "string (max 2000 chars, optional)",
 *   "source": "string (optional)"
 * }
 *
 * Response (200):
 * {
 *   "flashcard": FlashcardDTO,
 *   "warnings": string[]
 * }
 *
 * Error responses:
 * - 400: Invalid request body or no fields to update
 * - 401: Unauthorized (no valid session)
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const flashcardId = parseNumericId(context.params.id, "id");

    // Step 3: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = EditFlashcardSchema.safeParse(requestBody);

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

    // Step 4: Update the flashcard
    const result = await editFlashcard(context.locals.supabase, userId, flashcardId, updateData);

    // Step 5: Return success response
    return jsonResponse(result, 200);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * DELETE /api/flashcards/:id
 *
 * Deletes a flashcard. This operation is permanent and also removes
 * associated data (events, session items) via CASCADE.
 *
 * Requires authentication.
 *
 * Response (204 No Content)
 *
 * Error responses:
 * - 400: Invalid flashcard ID format
 * - 401: Unauthorized (no valid session)
 * - 404: Flashcard not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate URL parameters
    const flashcardId = parseNumericId(context.params.id, "id");

    // Step 3: Delete the flashcard
    await deleteFlashcard(context.locals.supabase, userId, flashcardId);

    // Step 4: Return success response (204 No Content)
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
};
