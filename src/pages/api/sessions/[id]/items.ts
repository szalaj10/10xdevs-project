import type { APIRoute } from "astro";
import { z } from "zod";
import { createSessionItem } from "../../../../lib/services/sessionService";
import { requireAuth, parseNumericId, errorResponse, jsonResponse, handleError } from "../../../../lib/apiHelpers";

export const prerender = false;

// Validation schema for creating a session item
const CreateSessionItemSchema = z.object({
  flashcard_id: z.number().int().positive("Flashcard ID must be a positive integer"),
  rating: z.union([z.literal(-1), z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: "Rating must be -1, 0, or 1" }),
  }),
});

/**
 * POST /api/sessions/:id/items
 *
 * Records a flashcard rating in an active session.
 * Updates the flashcard's SRS fields (interval, ease_factor, due_at).
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "flashcard_id": number,
 *   "rating": -1 | 0 | 1
 * }
 *
 * Response (201):
 * {
 *   "session_item": SessionItemDTO
 * }
 *
 * Error responses:
 * - 400: Invalid request body or validation failed
 * - 401: Unauthorized (no valid session)
 * - 404: Session or flashcard not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate session ID
    const sessionId = parseNumericId(context.params.id, "session ID");

    // Step 3: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = CreateSessionItemSchema.safeParse(requestBody);

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

    const { flashcard_id, rating } = validationResult.data;

    // Step 4: Create session item and update flashcard SRS
    const sessionItem = await createSessionItem(context.locals.supabase, userId, sessionId, flashcard_id, rating);

    // Step 5: Return success response
    return jsonResponse({ session_item: sessionItem }, 201);
  } catch (error) {
    return handleError(error);
  }
};
