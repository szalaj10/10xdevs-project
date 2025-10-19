import { z } from "zod";

// Generations & Candidate Cards
export const CreateGenerationCommandSchema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters long")
    .max(500, "Topic must not exceed 500 characters")
    .trim(),
});

export const BulkAcceptCandidateCardsSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1, "At least one ID is required")
    .max(100, "Cannot accept more than 100 candidates at once"),
});

export const EditCandidateCardSchema = z
  .object({
    front: z.string().min(1).max(2000).optional(),
    back: z.string().min(1).max(2000).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

// Flashcards
export const ListFlashcardsQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["created_at", "due"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(2000),
  source: z.string().max(500).nullable().optional(),
});

export const BulkCreateFlashcardsSchema = z.object({
  flashcards: z
    .array(CreateFlashcardSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot create more than 100 flashcards at once"),
});

export const EditFlashcardSchema = z
  .object({
    front: z.string().min(1).max(2000).optional(),
    back: z.string().min(1).max(2000).optional(),
    source: z.string().max(500).nullable().optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined || data.source !== undefined, {
    message: "At least one field must be provided",
  });

// Events
export const ListEventsQuerySchema = z
  .object({
    event_type: z.string().optional(),
    user_id: z.string().uuid().optional(),
    flashcard_id: z.coerce.number().int().positive().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
  })
  .refine((data) => !data.from || !data.to || new Date(data.from) <= new Date(data.to), {
    message: "from must be before or equal to to",
  });

export const CreateEventSchema = z.object({
  event_type: z.string().min(1).max(100),
  flashcard_id: z.number().int().positive().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
