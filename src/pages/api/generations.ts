import type { APIRoute } from "astro";
import { CreateGenerationCommandSchema } from "../../lib/schemas";
import { triggerGeneration } from "../../lib/services/generationService";
import { createSupabaseServiceClient } from "../../db/supabase.client";

export const prerender = false;

/**
 * POST /api/generations
 *
 * Creates a new AI generation for flashcards based on the provided topic.
 * Requires authentication.
 *
 * Request body:
 * {
 *   "topic": "string"
 * }
 *
 * Response (201):
 * {
 *   "generation": GenerationDTO,
 *   "candidate_cards": CandidateCardDTO[]
 * }
 *
 * Error responses:
 * - 400: Invalid request body (validation failed)
 * - 401: Unauthorized (no valid session)
 * - 500: Internal server error (AI or database error)
 */
export const POST: APIRoute = async (context) => {
  let { supabase } = context.locals;

  // Step 1: Extract user from Bearer token (or use mock user in development)
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  let userId: string;

  // In development without auth, use a mock user ID and service role client
  if (!token && import.meta.env.DEV) {
    userId = "0b4e8bb7-ceda-46a0-9760-672b856f2f4a"; // Mock user ID for development
    console.warn("⚠️  Using mock user ID for development (no authentication)");
    console.warn("⚠️  Using service role client to bypass RLS in development");
    // Use service role client to bypass RLS when testing without auth
    try {
      supabase = createSupabaseServiceClient();
    } catch {
      return new Response(
        JSON.stringify({
          error:
            "Development mode requires SUPABASE_SERVICE_ROLE_KEY to be configured. Run 'supabase status' to get the service_role key and add it to your .env file.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } else if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    userId = user.id;
  }

  // Step 2: Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const validationResult = CreateGenerationCommandSchema.safeParse(requestBody);

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

  const { topic } = validationResult.data;

  // Step 3: Call the generation service
  try {
    const result = await triggerGeneration(supabase, userId, topic);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    if (import.meta.env.DEV) {
      console.error("Generation error:", error);
    }

    // Return a generic error message to avoid exposing internal details
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
