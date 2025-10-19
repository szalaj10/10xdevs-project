import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// Generations & Candidate Cards
export interface CreateGenerationDTO {
  topic: string;
}
export type GenerationDTO = Tables<"generations">;
export type CandidateCardDTO = Tables<"candidate_cards">;
export interface GetGenerationResponseDTO {
  generation: GenerationDTO;
  candidate_cards: CandidateCardDTO[];
}
export interface BulkAcceptCandidateCardsDTO {
  ids: number[];
}
export type EditCandidateCardDTO = Pick<TablesUpdate<"candidate_cards">, "front" | "back">;

// Flashcards
export interface ListFlashcardsQueryDTO {
  search?: string;
  sort?: "created_at" | "due";
  page?: number;
  limit?: number;
}
export type FlashcardDTO = Tables<"flashcards">;
export interface ListFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
}
export type CreateFlashcardDTO = Pick<TablesInsert<"flashcards">, "front" | "back" | "source">;
export interface BulkCreateFlashcardsDTO {
  flashcards: CreateFlashcardDTO[];
}
export interface GetFlashcardResponseDTO {
  flashcard: FlashcardDTO;
}
export type EditFlashcardDTO = Pick<TablesUpdate<"flashcards">, "front" | "back" | "source">;

// Generation Error Logs & Analytics
export type GenerationErrorLogDTO = Tables<"generation_error_logs">;
export type CreateGenerationErrorLogDTO = Omit<TablesInsert<"generation_error_logs">, "id" | "created_at" | "user_id">;

// Events
export interface ListEventsQueryDTO {
  event_type?: string;
  user_id?: string;
  flashcard_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
export type EventDTO = Tables<"events">;
export type CreateEventDTO = Omit<TablesInsert<"events">, "id" | "created_at" | "user_id">;

// Sessions
export type SessionDTO = Tables<"sessions">;
export type SessionItemDTO = Tables<"session_items">;
export type CreateSessionDTO = Omit<TablesInsert<"sessions">, "id" | "user_id" | "started_at" | "ended_at">;
export type CreateSessionItemDTO = Omit<TablesInsert<"session_items">, "id" | "session_id">;
export interface UpdateSessionDTO {
  ended_at?: string;
}
export interface CreateSessionResponseDTO {
  session: SessionDTO;
  flashcards: FlashcardDTO[];
}
export interface GetSessionResponseDTO {
  session: SessionDTO;
  flashcards: FlashcardDTO[];
  session_items: SessionItemDTO[];
}
export interface SessionStatsDTO {
  dueCount: number;
  newCount: number;
}
export interface CreateSessionItemResponseDTO {
  session_item: SessionItemDTO;
  next_flashcard?: FlashcardDTO;
}

// User Stats (for Home view)
export interface UserStatsDTO {
  totalFlashcards: number;
  dueToday: number;
  streak: number;
}

// Activity Items (optional for Home view)
export interface ActivityItemDTO {
  type: "generation" | "session";
  date: string;
  count: number;
  id: number;
}

// Groq Service Types
export interface ModelParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export type ResponseFormat =
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    }
  | {
      type: "json_object";
    };

export interface GroqServiceOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultParams?: ModelParams;
}

export interface GroqResponse<T = Record<string, unknown>> {
  data: T;
  raw: Record<string, unknown>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ApiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
