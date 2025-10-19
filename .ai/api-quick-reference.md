# API Quick Reference Guide

Quick reference for all implemented REST API endpoints.

## Authentication

All endpoints require authentication via Authorization header:
```
Authorization: Bearer <access_token>
```

## Candidate Cards

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/generations/:generationId/candidates/:id/accept` | Accept single candidate |
| `POST` | `/api/generations/:generationId/candidates/accept-bulk` | Accept multiple candidates |
| `PATCH` | `/api/generations/:generationId/candidates/:id` | Edit candidate content |
| `POST` | `/api/generations/:generationId/candidates/:id/reject` | Reject candidate |

## Generations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/generations/:id` | Get generation with candidates |

## Flashcards

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/flashcards` | List flashcards (paginated) |
| `GET` | `/api/flashcards/:id` | Get single flashcard |
| `POST` | `/api/flashcards` | Create flashcard(s) |
| `PATCH` | `/api/flashcards/:id` | Update flashcard |
| `DELETE` | `/api/flashcards/:id` | Delete flashcard |

## Events

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/events` | List events (paginated) |
| `POST` | `/api/events` | Create event |

## HTTP Status Codes

- `200 OK` - Successful GET/PATCH/POST (non-create)
- `201 Created` - Successful POST (create)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Service Functions

### candidateService.ts
```typescript
acceptCandidate(supabase, userId, generationId, candidateId): Promise<FlashcardDTO>
bulkAcceptCandidates(supabase, userId, generationId, ids[]): Promise<FlashcardDTO[]>
editCandidate(supabase, userId, generationId, candidateId, updateData): Promise<CandidateCardDTO>
rejectCandidate(supabase, userId, generationId, candidateId): Promise<CandidateCardDTO>
```

### flashcardService.ts
```typescript
getFlashcardById(supabase, userId, flashcardId): Promise<FlashcardDTO>
listFlashcards(supabase, userId, query): Promise<ListFlashcardsResult>
createFlashcard(supabase, userId, data): Promise<CreateFlashcardResult>
createFlashcards(supabase, userId, flashcardsData[]): Promise<{flashcards, warnings}>
editFlashcard(supabase, userId, flashcardId, updateData): Promise<CreateFlashcardResult>
deleteFlashcard(supabase, userId, flashcardId): Promise<void>
```

### eventService.ts
```typescript
createEvent(supabase, userId, data): Promise<EventDTO>
listEvents(supabase, userId, query): Promise<ListEventsResult>
```

### generationService.ts
```typescript
getGenerationById(supabase, userId, generationId): Promise<GetGenerationResponseDTO>
triggerGeneration(supabase, userId, topic): Promise<GetGenerationResponseDTO>
```

## Helper Functions

### apiHelpers.ts
```typescript
requireAuth(context): Promise<string>              // Returns userId
parseNumericId(value, paramName): number           // Validates and parses ID
errorResponse(message, status): Response           // Creates error response
jsonResponse(data, status): Response               // Creates JSON response
handleError(error): Response                       // Handles errors
```

## Validation Schemas

All in `src/lib/schemas.ts`:

- `BulkAcceptCandidateCardsSchema` - {ids: number[]}
- `EditCandidateCardSchema` - {front?, back?}
- `ListFlashcardsQuerySchema` - {search?, sort?, page?, limit?}
- `CreateFlashcardSchema` - {front, back, source?}
- `BulkCreateFlashcardsSchema` - {flashcards: []}
- `EditFlashcardSchema` - {front?, back?, source?}
- `ListEventsQuerySchema` - {event_type?, user_id?, flashcard_id?, from?, to?, page?, limit?}
- `CreateEventSchema` - {event_type, flashcard_id?, metadata?}

## Common Patterns

### Endpoint Structure
```typescript
export const METHOD: APIRoute = async (context) => {
  try {
    const userId = await requireAuth(context);
    const id = parseNumericId(context.params.id, "id");
    // ... business logic with service layer
    return jsonResponse(data, statusCode);
  } catch (error) {
    return handleError(error);
  }
};
```

### Service Function Structure
```typescript
export async function serviceFunction(
  supabase: SupabaseClient,
  userId: string,
  ...params
): Promise<ReturnType> {
  // 1. Fetch and verify resource ownership
  // 2. Validate business rules
  // 3. Perform database operations
  // 4. Return typed result
}
```

## Testing Checklist

For each endpoint:
- [ ] Happy path works
- [ ] Returns correct status code
- [ ] Validates authentication (401)
- [ ] Validates authorization (403/404)
- [ ] Validates input (400)
- [ ] Handles database errors (500)
- [ ] Returns correct response structure
- [ ] Enforces business rules

## Development Tips

1. **Use mock user in dev**: Check `import.meta.env.DEV` for development mode
2. **Check RLS policies**: Ensure database policies match service layer checks
3. **Test with invalid IDs**: Negative, zero, non-numeric, very large
4. **Test edge cases**: Empty arrays, null values, missing optional fields
5. **Monitor performance**: Use pagination, avoid N+1 queries
6. **Log errors**: Console errors in dev, proper logging in production

## Example cURL Commands

### Accept Candidate
```bash
curl -X POST \
  http://localhost:4321/api/generations/1/candidates/5/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bulk Accept
```bash
curl -X POST \
  http://localhost:4321/api/generations/1/candidates/accept-bulk \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'
```

### Create Flashcard
```bash
curl -X POST \
  http://localhost:4321/api/flashcards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"front": "Jakie podstawowe funkcje pełni serce?", "back": "Serce jest głównym organem krwioobiegu, pompuje krew do całego organizmu."}'
```

Note: Flashcards use question-answer format (front = question, back = answer)

### List Flashcards
```bash
curl -X GET \
  "http://localhost:4321/api/flashcards?page=1&limit=20&search=dog" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Event
```bash
curl -X POST \
  http://localhost:4321/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "card_viewed", "flashcard_id": 5, "metadata": {"duration_ms": 3000}}'
```


