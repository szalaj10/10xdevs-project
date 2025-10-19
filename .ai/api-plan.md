# REST API Plan

## 1. Resources
- **User** (`users`)
- **Generation** (`generations`)
- **Candidate Card** (`candidate_cards`)
- **Flashcard** (`flashcards`)
- **Session** (`sessions`)
- **Session Item** (`session_items`)
- **Generation Error Log** (`generation_error_logs`)
- **Event** (`events`)

## 2. Endpoints



### 2.2 Generations & Candidate Cards
- POST /generations
  - Trigger AI generation
  - Request: { topic: string }
  - Response: { generation: { id, model, generated_count, ... }, candidate_cards: [ ... ] }
- GET /generations/{id}
  - Retrieve generation details & candidates
- POST /candidate_cards/{id}/accept
  - Accept a single candidate (creates flashcard)
- POST /generations/{generationId}/candidate_cards/accept_bulk
  - Bulk accept multiple
  - Request: { ids: [candidate_card_id] }
- PATCH /candidate_cards/{id}
  - Edit candidate content
  - Request: { front, back }
- POST /candidate_cards/{id}/reject
  - Reject a candidate

### 2.3 Flashcards
- GET /flashcards
  - List flashcards (filter by deck, search front)
  - Query: ?search=&sort=(created_at|due)&page=&limit=
- POST /flashcards
  - Utwórz jedną lub wiele fiszek manualnie lub przez AI (full, edited)
  - Request:
    - Dla pojedynczej: { front, back, source? }
    - Dla wielu: { flashcards: [ { front, back, source? }, ... ] }
  - Response:
    - Dla pojedynczej: { flashcard }
    - Dla wielu: { flashcards: [ ... ] }
- GET /flashcards/{id}
- PATCH /flashcards/{id}
  - Edit saved card
  - Request: { front, back, source? }
- DELETE /flashcards/{id}


### 2.5 Error Logs & Analytics
- GET /generation_error_logs
- POST /generation_error_logs
  - Internal: log AI errors
- GET /events
  - Query: ?event_type=&user_id=&flashcard_id=&from=&to=&page=&limit=
- POST /events
  - Track user actions
  - Request: { event_type, flashcard_id?, metadata }

## 3. Authentication & Authorization
- Use Supabase Auth with HTTP-only cookies or JWT
- Enforce RLS on all tables containing user_id (secure by row policies)
- Middleware verifies session and sets current user context

## 4. Validation & Business Logic
- Validate `front` ≤ 200 chars, `back` ≤ 350 chars
- Enforce rating ∈ {-1,0,1}
- Enforce status enum on candidate_cards
- Duplicate detection on manual add/edit via pg_trgm similarity; warn if similarity>0.9
- Rate-limit /generations endpoint (per-user quotas)
- Bulk accept adjusts generation counts and creates flashcards atomically
- Session logic: mix 80% due, 20% new; cap 30 total, ≤10 new
- Interval calculation server-side: today (for -1), +2 days (0), +4 days (1)
