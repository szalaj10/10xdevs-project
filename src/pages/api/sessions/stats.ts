import type { APIRoute } from "astro";
import { getSessionStats } from "../../../lib/services/sessionService";
import { requireAuth, jsonResponse, handleError } from "../../../lib/apiHelpers";

export const prerender = false;

/**
 * GET /api/sessions/stats
 *
 * Retrieves statistics about available flashcards for a new session.
 * Returns counts of due and new flashcards.
 *
 * Requires authentication.
 *
 * Response (200):
 * {
 *   "dueCount": number,
 *   "newCount": number
 * }
 *
 * Error responses:
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Get session stats
    const stats = await getSessionStats(context.locals.supabase, userId);

    // Step 3: Return success response
    return jsonResponse(stats);
  } catch (error) {
    return handleError(error);
  }
};
