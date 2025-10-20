import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerationDTO, CandidateCardDTO, GetGenerationResponseDTO } from "../../types";
import { createHash } from "node:crypto";
import { createGroqService } from "./groqService";
import { GroqError } from "../errors";

interface AIGeneratedCard {
  front: string;
  back: string;
}

/**
 * Generate flashcards using Groq AI service
 */
async function callGroqAPI(topic: string): Promise<AIGeneratedCard[]> {
  try {
    // Initialize Groq service
    const groqService = createGroqService();

    // Define JSON response format (using simpler json_object for better compatibility)
    const responseFormat = {
      type: "json_object" as const,
    };

    // System message with instructions
    const systemMessage = `Jesteś ekspertem edukacyjnym tworzącym fiszki do nauki metodą powtórek rozłożonych w czasie (spaced repetition).

Zasady tworzenia fiszek:
- Używaj wyłącznie języka polskiego
- Pytania powinny być jasne, konkretne i związane z tematem
- Odpowiedzi powinny być zwięzłe ale informacyjne (2-3 zdania)
- Pytania powinny zaczynać się od słów pytających (Co, Jak, Kiedy, Gdzie, Dlaczego, Ile, itp.)
- Fiszki powinny testować zrozumienie, nie tylko zapamiętanie
- Każda fiszka powinna dotyczyć innego aspektu tematu
- Odpowiedzi powinny być kompletne i edukacyjne

Format odpowiedzi: JSON
- Front (pytanie): Jasne pytanie testujące wiedzę
- Back (odpowiedź): Szczegółowa odpowiedź z wyjaśnieniem`;

    // User prompt
    const userPrompt = `Wygeneruj dokładnie 5 edukacyjnych fiszek o następującym temacie: "${topic}"

WAŻNE: 
- Zwróć odpowiedź WYŁĄCZNIE w formacie JSON (bez żadnego dodatkowego tekstu)
- Użyj klucza "flashcards" zawierającego tablicę 5 obiektów
- Każdy obiekt musi mieć pola "front" i "back"

Wymagana struktura JSON (dokładnie taka):
{
  "flashcards": [
    {"front": "Pytanie 1?", "back": "Odpowiedź 1"},
    {"front": "Pytanie 2?", "back": "Odpowiedź 2"},
    {"front": "Pytanie 3?", "back": "Odpowiedź 3"},
    {"front": "Pytanie 4?", "back": "Odpowiedź 4"},
    {"front": "Pytanie 5?", "back": "Odpowiedź 5"}
  ]
}

Przykład poprawnej odpowiedzi dla tematu "kardiologia":
{
  "flashcards": [
    {
      "front": "Jakie podstawowe funkcje pełni serce?",
      "back": "Serce jest głównym organem krwioobiegu, pompuje krew do całego organizmu, dostarcza tlen i składniki odżywcze do tkanek oraz usuwa dwutlenek węgla i produkty przemiany materii."
    },
    {
      "front": "Co to jest częstoskurcz?",
      "back": "Częstoskurcz to stan, w którym serce bije szybciej niż normalnie, zazwyczaj powyżej 100 uderzeń na minutę w spoczynku."
    }
  ]
}

Teraz wygeneruj JSON z 5 fiszkami dla tematu: "${topic}"`;

    // Send request to Groq with retry logic built into the service
    const response = await groqService.send<{ flashcards: AIGeneratedCard[] }>(userPrompt, {
      systemMessage,
      responseFormat,
      params: {
        temperature: 0.7, // Balanced creativity for educational content
        maxTokens: 2000, // Enough for 5 flashcards
      },
    });

    // Validate response structure
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Invalid response from Groq: expected object");
    }

    const flashcards = response.data.flashcards;
    if (!flashcards) {
      throw new Error("Groq response missing 'flashcards' field");
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Groq returned empty flashcards array");
    }

    // Validate each flashcard
    for (const card of flashcards) {
      if (!card.front || !card.back || typeof card.front !== "string" || typeof card.back !== "string") {
        throw new Error("Invalid flashcard structure in Groq response");
      }
      if (card.front.trim().length === 0 || card.back.trim().length === 0) {
        throw new Error("Empty flashcard content in Groq response");
      }
    }

    return flashcards;
  } catch (error) {
    // Handle Groq-specific errors
    if (error instanceof GroqError) {
      throw new Error(`Groq AI error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Logs generation errors to the database for debugging and monitoring.
 */
async function logGenerationError(
  supabase: SupabaseClient,
  userId: string,
  topic: string,
  error: unknown
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  // Map error to a simple error code for analytics
  let errorCode = "AI_ERROR";
  if (errorMessage.includes("GROQ_API_KEY")) {
    errorCode = "CONFIG_MISSING";
  } else if (errorMessage.includes("Groq AI error")) {
    errorCode = "GROQ_ERROR";
  } else if (errorMessage.includes("Authentication")) {
    errorCode = "GROQ_AUTH_ERROR";
  } else if (errorMessage.includes("Rate limit")) {
    errorCode = "GROQ_RATE_LIMIT";
  }

  const sourceTextHash = createHash("sha256").update(topic).digest("hex");
  const sourceTextLength = topic.length;
  // Note: GROQ_MODEL will be injected by astro:env in production
  const modelName = import.meta.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    await supabase.from("generation_error_logs").insert({
      user_id: userId,
      model: modelName,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage,
    });
  } catch {
    // If logging fails, silently continue (error already occurred)
    // In production, we don't want to expose internal errors
  }
}

/**
 * Retrieves a generation by ID along with its candidate cards.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param generationId - ID of the generation to retrieve
 * @returns Generation data with candidate cards
 * @throws Error if generation not found or access denied
 */
export async function getGenerationById(
  supabase: SupabaseClient,
  userId: string,
  generationId: number
): Promise<GetGenerationResponseDTO> {
  // Fetch the generation
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .select("*")
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  if (generationError || !generation) {
    throw new Error("Generation not found");
  }

  // Fetch the candidate cards for this generation
  const { data: candidateCards, error: cardsError } = await supabase
    .from("candidate_cards")
    .select("*")
    .eq("generation_id", generationId)
    .eq("user_id", userId);

  if (cardsError) {
    throw new Error(`Failed to fetch candidate cards: ${cardsError.message}`);
  }

  return {
    generation: generation as GenerationDTO,
    candidate_cards: (candidateCards || []) as CandidateCardDTO[],
  };
}

/**
 * Triggers the AI generation process for flashcards based on the given topic.
 * Creates a generation record and associated candidate cards.
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param topic - Topic for which to generate flashcards
 * @returns Generation data with candidate cards
 * @throws Error if generation fails
 */
export async function triggerGeneration(
  supabase: SupabaseClient,
  userId: string,
  topic: string
): Promise<GetGenerationResponseDTO> {
  // Step 1: Generate flashcards using Groq AI
  let aiCards: AIGeneratedCard[];
  try {
    aiCards = await callGroqAPI(topic);
  } catch (error) {
    // Log the error
    await logGenerationError(supabase, userId, topic, error);

    // Rethrow the error instead of falling back to mock data
    throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Step 2: Insert generation record
  const sourceTextHash = createHash("sha256").update(topic).digest("hex");
  const sourceTextLength = topic.length;
  // Note: GROQ_MODEL will be injected by astro:env in production
  const modelName = import.meta.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model: modelName,
      generated_count: aiCards.length,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
    })
    .select()
    .single();

  if (generationError || !generation) {
    throw new Error(`Failed to create generation record: ${generationError?.message || "Unknown error"}`);
  }

  // Step 3: Prepare candidate cards for batch insert
  const candidateCardsToInsert = aiCards.map((card) => ({
    generation_id: generation.id,
    user_id: userId,
    front: card.front,
    back: card.back,
    status: "pending" as const,
  }));

  // Step 4: Batch insert candidate cards
  const { data: candidateCards, error: candidateCardsError } = await supabase
    .from("candidate_cards")
    .insert(candidateCardsToInsert)
    .select();

  if (candidateCardsError || !candidateCards) {
    throw new Error(`Failed to create candidate cards: ${candidateCardsError?.message || "Unknown error"}`);
  }

  // Step 5: Return the complete response
  return {
    generation: generation as GenerationDTO,
    candidate_cards: candidateCards as CandidateCardDTO[],
  };
}
