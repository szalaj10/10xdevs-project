/**
 * Example usage of GroqService for flashcard generation
 *
 * This file demonstrates how to use the GroqService to generate
 * educational flashcards from a given topic.
 */

import { createGroqService } from "../src/lib/services/groqService";
import type { GroqResponse } from "../src/types";
import { AuthenticationError, RateLimitError, ValidationError } from "../src/lib/errors";

// Define the structure of a flashcard
interface Flashcard {
  front: string;
  back: string;
  tags: string[];
}

interface FlashcardsResponse {
  flashcards: Flashcard[];
}

/**
 * Generate flashcards for a given topic
 */
async function generateFlashcards(topic: string): Promise<Flashcard[]> {
  // Validate input
  if (!topic || topic.trim().length === 0) {
    throw new Error("Topic cannot be empty");
  }

  // Create Groq service instance
  const groqService = createGroqService();

  // Define the response format schema
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
                front: { type: "string", description: "The question or prompt" },
                back: { type: "string", description: "The answer or explanation" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Relevant tags for categorization",
                },
              },
              required: ["front", "back", "tags"],
            },
          },
        },
        required: ["flashcards"],
      },
    },
  };

  try {
    // Send request to Groq
    const response: GroqResponse<FlashcardsResponse> = await groqService.send(
      `Generate 5 educational flashcards about the topic: "${topic}".
      
      Requirements:
      - Front should be a clear question or prompt
      - Back should provide a comprehensive answer
      - Tags should be relevant keywords (2-4 tags per card)
      - Ensure flashcards test different aspects of the topic
      - Make them suitable for spaced repetition learning`,
      {
        systemMessage: `You are an expert educator specializing in creating effective flashcards.
        Your flashcards should:
        - Test understanding, not just memorization
        - Be clear and unambiguous
        - Use simple language
        - Focus on key concepts`,
        responseFormat,
        params: {
          temperature: 0.7, // Balanced creativity
          maxTokens: 2000, // Enough for 5 flashcards
        },
      }
    );

    // Log token usage for monitoring
    console.log("Token usage:", response.usage);

    return response.data.flashcards;
  } catch (error) {
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      console.error("Authentication failed. Please check your GROQ_API_KEY.");
      throw new Error("Invalid API credentials");
    } else if (error instanceof RateLimitError) {
      console.error("Rate limit exceeded. Please try again later.");
      throw new Error("Service temporarily unavailable");
    } else if (error instanceof ValidationError) {
      console.error("Validation error:", error.message);
      throw new Error("Invalid input or response format");
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}

/**
 * Generate flashcards with retry logic
 */
async function generateFlashcardsWithRetry(topic: string, maxRetries = 3): Promise<Flashcard[]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      return await generateFlashcards(topic);
    } catch (error) {
      lastError = error as Error;

      // Only retry on rate limit or server errors
      if (
        error instanceof RateLimitError ||
        ((error as Error & { statusCode?: number }).statusCode !== undefined &&
          (error as Error & { statusCode: number }).statusCode >= 500)
      ) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Don't retry for other errors
      throw error;
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Main function to demonstrate usage
 */
async function main() {
  const topics = ["Photosynthesis", "JavaScript Promises", "World War II Timeline"];

  console.log("=== Groq Service Flashcard Generation Example ===\n");

  for (const topic of topics) {
    try {
      console.log(`\nGenerating flashcards for: ${topic}`);
      console.log("─".repeat(50));

      const flashcards = await generateFlashcardsWithRetry(topic);

      console.log(`Generated ${flashcards.length} flashcards:\n`);

      flashcards.forEach((card, index) => {
        console.log(`${index + 1}. Front: ${card.front}`);
        console.log(`   Back: ${card.back}`);
        console.log(`   Tags: ${card.tags.join(", ")}`);
        console.log();
      });
    } catch (error) {
      console.error(`Failed to generate flashcards for "${topic}":`, error);
    }
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Export functions for use in other modules
export { generateFlashcards, generateFlashcardsWithRetry };
