import type { APIRoute } from "astro";
import { BulkAcceptCandidateCardsSchema } from "../../../../lib/schemas";

export const prerender = false;

/**
 * POST /api/generations/:id/accept
 *
 * Accepts candidate cards and converts them to flashcards.
 * Requires authentication.
 *
 * Request body:
 * {
 *   "ids": [1, 2, 3]
 * }
 *
 * Response (200):
 * {
 *   "message": "Flashcards created successfully",
 *   "count": 3
 * }
 *
 * Error responses:
 * - 400: Invalid request body (validation failed)
 * - 401: Unauthorized (no valid session)
 * - 404: Generation not found or no access
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  const { supabase } = context.locals;
  const generationId = Number(context.params.id);

  if (!generationId || isNaN(generationId)) {
    return new Response(JSON.stringify({ error: "Invalid generation ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 1: Extract user from Bearer token (or use mock user in development)
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  let userId: string;

  // In development without auth, use a mock user ID
  if (!token && import.meta.env.DEV) {
    userId = "0b4e8bb7-ceda-46a0-9760-672b856f2f4a"; // Mock user ID for development
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

  const validationResult = BulkAcceptCandidateCardsSchema.safeParse(requestBody);

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

  const { ids } = validationResult.data;

  try {
    // Step 3: Verify generation exists and belongs to user
    const { data: generation, error: genError } = await supabase
      .from("generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (genError || !generation) {
      return new Response(JSON.stringify({ error: "Generation not found or no access" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Fetch candidate cards to accept
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidate_cards")
      .select("*")
      .eq("generation_id", generationId)
      .eq("user_id", userId)
      .in("id", ids);

    if (candidatesError) {
      throw new Error(`Failed to fetch candidate cards: ${candidatesError.message}`);
    }

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No candidate cards found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Create flashcards from accepted candidates
    const flashcardsToInsert = candidates.map((card) => ({
      user_id: userId,
      front: card.front,
      back: card.back,
      source: null,
      generation_id: generationId,
    }));

    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (flashcardsError) {
      throw new Error(`Failed to create flashcards: ${flashcardsError.message}`);
    }

    // Step 6: Update candidate cards status to 'accepted'
    const { error: updateError } = await supabase.from("candidate_cards").update({ status: "accepted" }).in("id", ids);

    if (updateError) {
      // Don't fail the request if status update fails
    }

    // Step 7: Update generation statistics
    // Fetch current counts and increment
    const { data: genData } = await supabase
      .from("generations")
      .select("accepted_unedited_count")
      .eq("id", generationId)
      .single();

    if (genData) {
      const { error: statsError } = await supabase
        .from("generations")
        .update({
          accepted_unedited_count: genData.accepted_unedited_count + candidates.length,
        })
        .eq("id", generationId);

      if (statsError) {
        // Don't fail the request if stats update fails
      }
    }

    return new Response(
      JSON.stringify({
        message: "Flashcards created successfully",
        count: flashcards?.length || 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
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
