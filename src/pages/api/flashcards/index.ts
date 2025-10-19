import type { APIRoute } from "astro";
import { ListFlashcardsQuerySchema, CreateFlashcardSchema, BulkCreateFlashcardsSchema } from "../../../lib/schemas";
import { listFlashcards, createFlashcard, createFlashcards } from "../../../lib/services/flashcardService";
import { requireAuth, errorResponse, jsonResponse, handleError } from "../../../lib/apiHelpers";

export const prerender = false;

/**
 * GET /api/flashcards
 *
 * Lists flashcards with optional filtering, sorting, and pagination.
 * Supports search by front text and sorting by created_at or due date.
 *
 * Requires authentication.
 *
 * Query parameters:
 * - search: string (optional) - Filter by front text
 * - sort: 'created_at' | 'due' (optional, default: 'created_at')
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20, max: 100)
 *
 * Response (200):
 * {
 *   "flashcards": FlashcardDTO[],
 *   "pagination": {
 *     "page": number,
 *     "limit": number,
 *     "total": number,
 *     "totalPages": number
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse and validate query parameters
    const searchParams = Object.fromEntries(context.url.searchParams);
    const validationResult = ListFlashcardsQuerySchema.safeParse(searchParams);

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

    // Step 3: List flashcards
    const result = await listFlashcards(context.locals.supabase, userId, query);

    // Step 4: Return success response
    return jsonResponse(result, 200);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST /api/flashcards
 *
 * Creates one or more flashcards. Supports both single and bulk creation.
 * Performs duplicate detection and returns warnings for similar cards.
 *
 * Requires authentication.
 *
 * Request body (single flashcard):
 * {
 *   "front": "string (max 2000 chars)",
 *   "back": "string (max 2000 chars)",
 *   "source": "string (optional)"
 * }
 *
 * Request body (bulk creation):
 * {
 *   "flashcards": [
 *     {
 *       "front": "string",
 *       "back": "string",
 *       "source": "string (optional)"
 *     }
 *   ]
 * }
 *
 * Response (201):
 * Single: { "flashcard": FlashcardDTO, "warnings": string[] }
 * Bulk: { "flashcards": FlashcardDTO[], "warnings": string[] }
 *
 * Error responses:
 * - 400: Invalid request body
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const userId = await requireAuth(context);

    // Step 2: Parse request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    // Step 3: Determine if it's single or bulk creation
    const isBulk = requestBody && typeof requestBody === "object" && "flashcards" in requestBody;

    if (isBulk) {
      // Bulk creation
      const validationResult = BulkCreateFlashcardsSchema.safeParse(requestBody);

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

      const { flashcards: flashcardsData } = validationResult.data;

      // Create flashcards
      const result = await createFlashcards(context.locals.supabase, userId, flashcardsData);

      return jsonResponse(result, 201);
    } else {
      // Single flashcard creation
      const validationResult = CreateFlashcardSchema.safeParse(requestBody);

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

      const flashcardData = validationResult.data;

      // Create flashcard
      const result = await createFlashcard(context.locals.supabase, userId, flashcardData);

      return jsonResponse(result, 201);
    }
  } catch (error) {
    return handleError(error);
  }
};
