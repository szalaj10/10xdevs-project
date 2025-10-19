import type { APIRoute } from "astro";
import { createSession } from "../../../lib/services/sessionService";
import { requireAuth, errorResponse, jsonResponse, handleError } from "../../../lib/apiHelpers";

export const prerender = false;

/**
 * POST /api/sessions
 *
 * Creates a new study session with flashcards selected based on SRS logic.
 * Session logic: 80% due cards, 20% new cards; max 30 total, max 10 new.
 *
 * Requires authentication.
 *
 * Request body: {} (empty object)
 *
 * Response (201):
 * {
 *   "session": SessionDTO,
 *   "flashcards": FlashcardDTO[]
 * }
 *
 * Error responses:
 * - 400: No flashcards available for study
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Create session with flashcards
    const sessionData = await createSession(context.locals.supabase, userId);

    // Step 3: Return success response
    return jsonResponse(sessionData, 201);
  } catch (error) {
    return handleError(error);
  }
};
