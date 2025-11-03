import type { APIContext } from "astro";
import { ApiError } from "./errors";

/**
 * Helper functions for API endpoints.
 */

/**
 * Extracts and validates the user ID from the Supabase session.
 *
 * @param context - Astro API context
 * @returns User ID if authenticated
 * @throws Error if not authenticated
 */
export async function requireAuth(context: APIContext): Promise<string> {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}

/**
 * Validates and parses a numeric ID from URL params.
 *
 * @param value - The parameter value to parse
 * @param paramName - Name of the parameter (for error messages)
 * @returns Parsed number
 * @throws Error if invalid
 */
export function parseNumericId(value: string | undefined, paramName: string): number {
  if (!value) {
    throw new Error(`Missing ${paramName} parameter`);
  }

  const id = parseInt(value, 10);
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid ${paramName}: must be a positive integer`);
  }

  return id;
}

/**
 * Creates a standardized JSON error response.
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Response object
 */
export function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Creates a standardized JSON success response.
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns Response object
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Handles errors and returns appropriate HTTP response.
 *
 * @param error - The error to handle
 * @returns Response object
 */
export function handleError(error: unknown): Response {
  console.error("API Error:", error);

  // Handle ApiError with explicit status code
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("unauthorized") || message.includes("not authenticated")) {
      return errorResponse("Unauthorized", 401);
    }

    if (message.includes("not found")) {
      return errorResponse(error.message, 404);
    }

    if (
      message.includes("already been processed") ||
      message.includes("at least one field") ||
      message.includes("invalid") ||
      message.includes("must be")
    ) {
      return errorResponse(error.message, 400);
    }

    if (message.includes("access denied") || message.includes("forbidden")) {
      return errorResponse(error.message, 403);
    }

    return errorResponse(error.message, 500);
  }

  return errorResponse("Internal server error", 500);
}
