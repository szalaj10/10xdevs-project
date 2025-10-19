import type { APIRoute } from "astro";
import { ListEventsQuerySchema, CreateEventSchema } from "../../../lib/schemas";
import { listEvents, createEvent } from "../../../lib/services/eventService";
import { requireAuth, errorResponse, jsonResponse, handleError } from "../../../lib/apiHelpers";

export const prerender = false;

/**
 * GET /api/events
 *
 * Lists analytics events with optional filtering and pagination.
 * Supports filtering by event type, flashcard, and date range.
 *
 * Requires authentication.
 *
 * Query parameters:
 * - event_type: string (optional) - Filter by event type
 * - user_id: string (optional) - Filter by user (must match current user in MVP)
 * - flashcard_id: number (optional) - Filter by flashcard
 * - from: ISO datetime string (optional) - Start of date range
 * - to: ISO datetime string (optional) - End of date range
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 50, max: 200)
 *
 * Response (200):
 * {
 *   "events": EventDTO[],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "total": number,
 *     "totalPages": number
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid query parameters or date range
 * - 401: Unauthorized (no valid session)
 * - 403: Forbidden (attempting to access other user's events)
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate query parameters
    const searchParams = Object.fromEntries(context.url.searchParams);
    const validationResult = ListEventsQuerySchema.safeParse(searchParams);

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

    const query = validationResult.data;

    // Step 3: List events (service handles authorization check)
    const result = await listEvents(context.locals.supabase, userId, query);

    // Step 4: Return success response
    return jsonResponse(result, 200);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST /api/events
 *
 * Creates a new analytics event to track user interactions.
 * Used for analytics, monitoring, and UX optimization.
 *
 * Requires authentication.
 *
 * Request body:
 * {
 *   "event_type": "string (max 100 chars)",
 *   "flashcard_id": number (optional),
 *   "metadata": object (optional)
 * }
 *
 * Response (201):
 * {
 *   "event": EventDTO
 * }
 *
 * Error responses:
 * - 400: Invalid request body or metadata too large
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    const validationResult = CreateEventSchema.safeParse(requestBody);

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

    const eventData = validationResult.data;

    // Step 3: Create the event
    const event = await createEvent(context.locals.supabase, userId, eventData);

    // Step 4: Return success response
    return jsonResponse({ event }, 201);
  } catch (error) {
    return handleError(error);
  }
};
