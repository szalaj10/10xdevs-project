import type { APIRoute } from "astro";
import { z } from "zod";
import { getSession, updateSession } from "../../../../lib/services/sessionService";
import { requireAuth, parseNumericId, errorResponse, jsonResponse, handleError } from "../../../../lib/apiHelpers";

export const prerender = false;

// Validation schema for updating a session
const UpdateSessionSchema = z.object({
  ended_at: z.string().datetime({ message: "ended_at must be a valid ISO 8601 datetime string" }).optional(),
});

/**
 * GET /api/sessions/:id
 *
 * Retrieves session details including flashcards and session items.
 *
 * Requires authentication.
 *
 * Response (200):
 * {
 *   "session": SessionDTO,
 *   "flashcards": FlashcardDTO[],
 *   "session_items": SessionItemDTO[]
 * }
 *
 * Error responses:
 * - 401: Unauthorized (no valid session)
 * - 404: Session not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate session ID
    const sessionId = parseNumericId(context.params.id, "session ID");

    // Step 3: Get session details
    const sessionData = await getSession(context.locals.supabase, userId, sessionId);

    // Step 4: Return success response
    return jsonResponse(sessionData);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PATCH /api/sessions/:id
 *
 * Updates a session (typically to mark it as ended).
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "ended_at": "ISO 8601 datetime string" (optional)
 * }
 *
 * Response (200):
 * {
 *   "session": SessionDTO
 * }
 *
 * Error responses:
 * - 400: Invalid request body or validation failed
 * - 401: Unauthorized (no valid session)
 * - 404: Session not found
 * - 500: Internal server error
 */
export const PATCH: APIRoute = async (context) => {
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

    const validationResult = UpdateSessionSchema.safeParse(requestBody);

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

    const updates = validationResult.data;

    // Ensure at least one field is provided
    if (Object.keys(updates).length === 0) {
      return errorResponse("At least one field must be provided for update", 400);
    }

    // Step 4: Update session
    const updatedSession = await updateSession(context.locals.supabase, userId, sessionId, updates);

    // Step 5: Return success response
    return jsonResponse({ session: updatedSession });
  } catch (error) {
    return handleError(error);
  }
};
