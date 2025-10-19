# API Endpoints Implementation Summary

This document provides an overview of all implemented REST API endpoints for the flashcards application.

## Implementation Status

All planned endpoints have been successfully implemented with:
- ✅ Service layer for business logic separation
- ✅ Zod schema validation for all inputs
- ✅ Consistent error handling and HTTP status codes
- ✅ Authentication and authorization checks
- ✅ Proper TypeScript typing throughout
- ✅ Clean architecture following project guidelines

## Service Layer

### 1. `candidateService.ts`
Handles candidate card operations:
- `acceptCandidate()` - Accepts a single candidate and creates a flashcard
- `bulkAcceptCandidates()` - Accepts multiple candidates atomically
- `editCandidate()` - Edits candidate card content (pending only)
- `rejectCandidate()` - Rejects a candidate card

### 2. `flashcardService.ts`
Manages flashcard CRUD operations:
- `getFlashcardById()` - Retrieves a single flashcard
- `listFlashcards()` - Lists flashcards with filtering, sorting, and pagination
- `createFlashcard()` - Creates a single flashcard with duplicate detection
- `createFlashcards()` - Bulk creates flashcards
- `editFlashcard()` - Updates flashcard content with duplicate detection
- `deleteFlashcard()` - Deletes a flashcard

### 3. `eventService.ts`
Handles analytics events:
- `createEvent()` - Creates a new event
- `listEvents()` - Lists events with filtering and pagination

### 4. `generationService.ts`
Extended with:
- `getGenerationById()` - Retrieves generation with candidate cards

### 5. `apiHelpers.ts`
Utility functions for API endpoints:
- `requireAuth()` - Authentication helper
- `parseNumericId()` - ID validation helper
- `errorResponse()` - Standardized error responses
- `jsonResponse()` - Standardized success responses
- `handleError()` - Centralized error handling

## API Endpoints

### Candidate Cards

#### 1. POST `/api/generations/:generationId/candidates/:id/accept`
**Purpose:** Accepts a single candidate card and creates a flashcard.

**Request:**
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- URL Params: `generationId` (number), `id` (number)

**Response (201):**
```json
{
  "flashcard": {
    "id": 1,
    "user_id": "uuid",
    "generation_id": 1,
    "front": "string",
    "back": "string",
    "source": "ai_full",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Errors:** 400, 401, 404, 500

---

#### 2. POST `/api/generations/:generationId/candidates/accept-bulk`
**Purpose:** Accepts multiple candidate cards in one atomic operation.

**Request:**
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- URL Params: `generationId` (number)
- Body:
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**Response (201):**
```json
{
  "flashcards": [...]
}
```

**Errors:** 400, 401, 404, 500

---

#### 3. PATCH `/api/generations/:generationId/candidates/:id`
**Purpose:** Edits candidate card content (pending only).

**Request:**
- Method: `PATCH`
- Headers: `Authorization: Bearer <token>`
- URL Params: `generationId` (number), `id` (number)
- Body:
```json
{
  "front": "Updated front text",
  "back": "Updated back text"
}
```

**Response (200):**
```json
{
  "candidate_card": {...}
}
```

**Errors:** 400, 401, 404, 500

---

#### 4. POST `/api/generations/:generationId/candidates/:id/reject`
**Purpose:** Rejects a candidate card.

**Request:**
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- URL Params: `generationId` (number), `id` (number)

**Response (200):**
```json
{
  "candidate_card": {...}
}
```

**Errors:** 400, 401, 404, 500

---

### Generations

#### 5. GET `/api/generations/:id`
**Purpose:** Retrieves generation details with all candidate cards.

**Request:**
- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- URL Params: `id` (number)

**Response (200):**
```json
{
  "generation": {
    "id": 1,
    "user_id": "uuid",
    "model": "string",
    "generated_count": 10,
    "accepted_unedited_count": 5,
    "accepted_edited_count": 2,
    "source_text_hash": "hash",
    "source_text_length": 100,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "candidate_cards": [...]
}
```

**Errors:** 400, 401, 404, 500

---

### Flashcards

#### 6. GET `/api/flashcards`
**Purpose:** Lists flashcards with filtering, sorting, and pagination.

**Request:**
- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- Query Params:
  - `search` (optional): Filter by front text
  - `sort` (optional): `created_at` | `due` (default: `created_at`)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20, max: 100)

**Response (200):**
```json
{
  "flashcards": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Errors:** 400, 401, 500

---

#### 7. GET `/api/flashcards/:id`
**Purpose:** Retrieves a single flashcard by ID.

**Request:**
- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- URL Params: `id` (number)

**Response (200):**
```json
{
  "flashcard": {...}
}
```

**Errors:** 400, 401, 404, 500

---

#### 8. POST `/api/flashcards`
**Purpose:** Creates flashcard(s) with duplicate detection.

**Request (Single):**
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "front": "string (max 2000 chars)",
  "back": "string (max 2000 chars)",
  "source": "string (optional)"
}
```

**Request (Bulk):**
```json
{
  "flashcards": [
    {
      "front": "string",
      "back": "string",
      "source": "string (optional)"
    }
  ]
}
```

**Response (201):**
Single:
```json
{
  "flashcard": {...},
  "warnings": ["Similar card found: '...'"]
}
```

Bulk:
```json
{
  "flashcards": [...],
  "warnings": [...]
}
```

**Errors:** 400, 401, 500

---

#### 9. PATCH `/api/flashcards/:id`
**Purpose:** Updates flashcard content with duplicate detection.

**Request:**
- Method: `PATCH`
- Headers: `Authorization: Bearer <token>`
- URL Params: `id` (number)
- Body:
```json
{
  "front": "string (optional)",
  "back": "string (optional)",
  "source": "string (optional)"
}
```

**Response (200):**
```json
{
  "flashcard": {...},
  "warnings": [...]
}
```

**Errors:** 400, 401, 404, 500

---

#### 10. DELETE `/api/flashcards/:id`
**Purpose:** Deletes a flashcard permanently.

**Request:**
- Method: `DELETE`
- Headers: `Authorization: Bearer <token>`
- URL Params: `id` (number)

**Response:** 204 No Content

**Errors:** 400, 401, 404, 500

---

### Events

#### 11. GET `/api/events`
**Purpose:** Lists analytics events with filtering and pagination.

**Request:**
- Method: `GET`
- Headers: `Authorization: Bearer <token>`
- Query Params:
  - `event_type` (optional): Filter by event type
  - `user_id` (optional): Must match current user
  - `flashcard_id` (optional): Filter by flashcard
  - `from` (optional): ISO datetime start
  - `to` (optional): ISO datetime end
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 50, max: 200)

**Response (200):**
```json
{
  "events": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

**Errors:** 400, 401, 403, 500

---

#### 12. POST `/api/events`
**Purpose:** Creates a new analytics event.

**Request:**
- Method: `POST`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "event_type": "card_viewed",
  "flashcard_id": 123,
  "metadata": {
    "duration_ms": 5000,
    "device": "mobile"
  }
}
```

**Response (201):**
```json
{
  "event": {
    "id": 1,
    "user_id": "uuid",
    "flashcard_id": 123,
    "event_type": "card_viewed",
    "metadata": {...},
    "created_at": "timestamp"
  }
}
```

**Errors:** 400, 401, 500

---

## Validation Schemas

All Zod schemas have been updated in `src/lib/schemas.ts`:

1. **BulkAcceptCandidateCardsSchema** - With max 100 limit and refinement
2. **EditCandidateCardSchema** - With "at least one field" refinement
3. **ListFlashcardsQuerySchema** - With coercion and defaults
4. **CreateFlashcardSchema** - String length validation
5. **BulkCreateFlashcardsSchema** - With min/max array size
6. **EditFlashcardSchema** - With "at least one field" refinement
7. **ListEventsQuerySchema** - With date range validation and refinement
8. **CreateEventSchema** - Event type and metadata validation

## Error Handling

All endpoints follow consistent error handling patterns:

- **400 Bad Request**: Invalid input, validation errors, business logic violations
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Attempting to access resources of other users
- **404 Not Found**: Resource doesn't exist or no access
- **500 Internal Server Error**: Unexpected errors (logged)

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": {...}  // Optional, for validation errors
}
```

## Security Features

1. **Authentication**: All endpoints require valid Supabase session
2. **Authorization**: RLS policies + explicit user_id checks
3. **Input Validation**: Zod schemas for all inputs
4. **SQL Injection Protection**: Parameterized queries via Supabase
5. **Rate Limiting**: Max limits on batch operations (100 items)
6. **Data Ownership**: All queries filter by user_id

## Testing Recommendations

### Unit Tests
- Service functions with mocked Supabase client
- Validation schemas with various inputs
- Error handling edge cases

### Integration Tests
Each endpoint should test:
1. Happy path (200/201 responses)
2. Authentication failures (401)
3. Authorization failures (403/404)
4. Validation errors (400)
5. Edge cases (empty arrays, duplicates, etc.)

### Example Test Cases

**Accept Candidate:**
- ✓ Accept pending candidate successfully
- ✓ Reject already accepted candidate (400)
- ✓ Reject candidate from other user (404)
- ✓ Invalid candidate ID (400)

**Bulk Accept:**
- ✓ Accept multiple pending candidates
- ✓ Reject if one is already processed (400)
- ✓ Reject if some don't exist (404)
- ✓ Handle duplicate IDs in request (400)

**Create Flashcard:**
- ✓ Create with valid data
- ✓ Detect similar/duplicate cards (warnings)
- ✓ Reject too long text (400)
- ✓ Handle bulk creation (max 100)

**List Flashcards:**
- ✓ List with pagination
- ✓ Search by front text
- ✓ Sort by created_at/due
- ✓ Validate limit bounds (max 100)

**Events:**
- ✓ Create event with metadata
- ✓ List with date range filter
- ✓ Validate date range (from <= to)
- ✓ Reject access to other user's events (403)

## Performance Considerations

1. **Pagination**: All list endpoints support pagination to avoid large data transfers
2. **Indexing**: Database indexes on frequently queried columns (user_id, created_at)
3. **Batch Operations**: Bulk endpoints use single queries instead of loops
4. **Duplicate Detection**: Uses database-level similarity checks (ready for pg_trgm)
5. **Atomic Operations**: Critical operations (accept, bulk accept) maintain data consistency

## Next Steps

1. **Add comprehensive tests** for all endpoints
2. **Implement rate limiting** middleware
3. **Add API documentation** (OpenAPI/Swagger)
4. **Implement caching** for read-heavy endpoints
5. **Add monitoring/logging** for production
6. **Optimize similarity search** with pg_trgm indices
7. **Add soft delete** option for flashcards (deleted_at column)
8. **Implement pagination cursors** for better performance

## File Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── candidateService.ts     ✅ New
│   │   ├── flashcardService.ts     ✅ New
│   │   ├── eventService.ts         ✅ New
│   │   └── generationService.ts    ✅ Updated
│   ├── apiHelpers.ts               ✅ New
│   └── schemas.ts                  ✅ Updated
└── pages/
    └── api/
        ├── generations/
        │   ├── [generationId]/
        │   │   └── candidates/
        │   │       ├── [id]/
        │   │       │   ├── accept.ts     ✅ New
        │   │       │   └── reject.ts     ✅ New
        │   │       ├── [id].ts           ✅ Updated (PATCH)
        │   │       └── accept-bulk.ts    ✅ New
        │   └── [id]/
        │       └── index.ts              ✅ New (GET)
        ├── flashcards/
        │   ├── index.ts                  ✅ New (GET, POST)
        │   └── [id].ts                   ✅ New (GET, PATCH, DELETE)
        └── events/
            └── index.ts                  ✅ New (GET, POST)
```

All implementations follow the project's coding standards and architectural guidelines.


