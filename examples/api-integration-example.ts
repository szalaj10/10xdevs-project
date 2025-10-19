/**
 * Example: Integrating GroqService with Astro API Routes
 *
 * This file demonstrates how to create API endpoints that use
 * the GroqService to generate flashcards for the application.
 */

import type { APIRoute } from "astro";
import { createGroqService } from "../src/lib/services/groqService";
import type { GroqResponse } from "../src/types";
import { AuthenticationError, RateLimitError, ValidationError, NetworkError } from "../src/lib/errors";

/**
 * Example API Route: Generate Flashcards
 *
 * POST /api/generate-flashcards
 * Body: { topic: string }
 * Response: { flashcards: Array<{ front: string, back: string }> }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Topic is required and must be a non-empty string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize topic (additional layer beyond GroqService sanitization)
    const sanitizedTopic = topic.trim().substring(0, 200);

    // Initialize Groq service
    const groqService = createGroqService();

    // Define the response schema
    const responseFormat = {
      type: "json_schema" as const,
      json_schema: {
        name: "FlashcardsResponse",
        strict: true,
        schema: {
          type: "object",
          properties: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  front: {
                    type: "string",
                    description: "The question or prompt on the front of the flashcard",
                  },
                  back: {
                    type: "string",
                    description: "The answer or explanation on the back",
                  },
                },
                required: ["front", "back"],
              },
              minItems: 3,
              maxItems: 10,
            },
          },
          required: ["flashcards"],
        },
      },
    };

    // System message with instructions
    const systemMessage = `You are an expert educator specializing in creating effective educational flashcards.
    
Your flashcards should:
- Test understanding, not just memorization
- Be clear, concise, and unambiguous
- Use simple, accessible language
- Focus on key concepts and principles
- Be suitable for spaced repetition learning

Format guidelines:
- Front: A clear question or concept prompt (20-100 characters)
- Back: A comprehensive but concise answer (50-200 characters)
- Ensure each flashcard tests a different aspect of the topic`;

    // User prompt
    const userPrompt = `Generate 5 high-quality educational flashcards about the following topic:

Topic: "${sanitizedTopic}"

Requirements:
1. Create exactly 5 flashcards
2. Cover different aspects of the topic
3. Ensure progressive difficulty (easy to moderate)
4. Make them suitable for active recall practice
5. Keep language clear and precise`;

    // Send request to Groq
    const response: GroqResponse<{
      flashcards: { front: string; back: string }[];
    }> = await groqService.send(userPrompt, {
      systemMessage,
      responseFormat,
      params: {
        temperature: 0.7,
        maxTokens: 2000,
      },
    });

    // Log usage for monitoring
    console.log("[GroqService] Generated flashcards:", {
      topic: sanitizedTopic,
      count: response.data.flashcards.length,
      tokensUsed: response.usage?.totalTokens,
    });

    // Return successful response
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging
    console.error("[GroqService] Error generating flashcards:", error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input or response format",
          message: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof AuthenticationError) {
      return new Response(
        JSON.stringify({
          error: "API authentication failed",
          message: "Service configuration error. Please contact support.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again in a few moments.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60", // Suggest retry after 60 seconds
          },
        }
      );
    }

    if (error instanceof NetworkError) {
      return new Response(
        JSON.stringify({
          error: "Network error",
          message: "Unable to connect to AI service. Please try again.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Example: How to use this endpoint from the frontend
 *
 * ```typescript
 * async function generateFlashcards(topic: string) {
 *   try {
 *     const response = await fetch('/api/generate-flashcards', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ topic })
 *     });
 *
 *     if (!response.ok) {
 *       const error = await response.json();
 *       throw new Error(error.message || 'Failed to generate flashcards');
 *     }
 *
 *     const data = await response.json();
 *     return data.flashcards;
 *   } catch (error) {
 *     console.error('Error:', error);
 *     throw error;
 *   }
 * }
 *
 * // Usage in React component
 * const handleGenerate = async () => {
 *   try {
 *     setLoading(true);
 *     const flashcards = await generateFlashcards('Machine Learning');
 *     setFlashcards(flashcards);
 *   } catch (error) {
 *     setError(error.message);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */

/**
 * Example API Route with Retry Logic
 *
 * POST /api/generate-flashcards-with-retry
 * Body: { topic: string, maxRetries?: number }
 */
export const POST_WITH_RETRY: APIRoute = async ({ request }) => {
  const { maxRetries = 3 } = await request.json();

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Reuse the main POST logic
      const result = await POST({ request } as Parameters<typeof POST>[0]);
      return result;
    } catch (error) {
      lastError = error as Error;

      // Only retry on transient errors
      if (
        error instanceof RateLimitError ||
        error instanceof NetworkError ||
        ((error as Error & { statusCode?: number }).statusCode !== undefined &&
          (error as Error & { statusCode: number }).statusCode >= 500)
      ) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[Retry] Attempt ${attempt}/${maxRetries}, waiting ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Don't retry for other errors
      throw error;
    }
  }

  // All retries failed
  console.error("[GroqService] All retry attempts failed:", lastError);
  return new Response(
    JSON.stringify({
      error: "Service temporarily unavailable",
      message: "Failed after multiple retry attempts. Please try again later.",
    }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
};

/**
 * Example: Stream Response (Advanced)
 *
 * Note: This is a conceptual example. Groq SDK may support streaming
 * in the future, which would allow real-time flashcard generation.
 */
export const POST_STREAM: APIRoute = async ({ request }) => {
  // This would require streaming support from Groq SDK
  // For now, we return regular response
  return POST({ request } as Parameters<typeof POST>[0]);
};
