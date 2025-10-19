# Database Schema Plan (MVP)

## 1. Tables

**users** 
This table is managed by Supabase Auth.
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- email: VARCHAR NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- confirmed_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

**generations**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- model: VARCHAR NOT NULL
- generated_count: INT NOT NULL
- accepted_unedited_count: INT NOT NULL
- accepted_edited_count: INT NOT NULL
- source_VARCHAR_hash: VARCHAR NOT NULL
- source_VARCHAR_length: INT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

**flashcards**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- generation_id: BIGINT REFERENCES generations(id) ON DELETE SET NULL
- front: VARCHAR NOT NULL CHECK (char_length(front) <= 200) -- Pytanie (Question)
- back: VARCHAR NOT NULL CHECK (char_length(back) <= 350) -- Odpowiedź (Answer)
- source: VARCHAR
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

Format: Fiszki są w formacie pytanie-odpowiedź
Przykład: front = "Jakie podstawowe funkcje pełni serce?", back = "Serce jest głównym organem krwioobiegu..."

**generation_error_logs**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- model: VARCHAR NOT NULL
- source_VARCHAR_hash: VARCHAR NOT NULL
- source_VARCHAR_length: INT NOT NULL
- error_code: VARCHAR NOT NULL
- error_message: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

**candidate_cards**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- generation_id: BIGINT NOT NULL REFERENCES generations(id) ON DELETE CASCADE
- front: VARCHAR NOT NULL CHECK (char_length(front) <= 200) -- Pytanie (Question)
- back: VARCHAR NOT NULL CHECK (char_length(back) <= 350) -- Odpowiedź (Answer)
- status: candidate_status NOT NULL DEFAULT 'pending'
- expires_at: TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 day'
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

**sessions**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- started_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- ended_at: TIMESTAMPTZ

**session_items**
- id: BIGSERIAL PRIMARY KEY
- session_id: BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
- flashcard_id: BIGINT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE
- rating: SMALLINT NOT NULL CHECK (rating IN (-1,0,1))

**events**
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- flashcard_id: BIGINT NULL REFERENCES flashcards(id)
- event_type: VARCHAR NOT NULL
- metadata: JSONB
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relationships

- users (1) ➔ (N) generations
- users (1) ➔ (N) flashcards
- generations (1) ➔ (N) flashcards
- users (1) ➔ (N) generation_error_logs
- users (1) ➔ (N) candidate_cards
- generations (1) ➔ (N) candidate_cards
- users (1) ➔ (N) sessions
- sessions (1) ➔ (N) session_items
- users (1) ➔ (N) events
- flashcards (1) ➔ (N) events

## 3. Indexes

- CREATE EXTENSION IF NOT EXISTS pg_trgm;
- CREATE TYPE candidate_status AS ENUM ('pending','accepted','rejected');
- `flashcards`:
  - GIN(front gin_trgm_ops)
  - BTREE(user_id, created_at)
- `generations`:
  - BTREE(user_id)
- `candidate_cards`:
  - BTREE(user_id, status)
- `events`:
  - GIN(metadata)
  - BTREE(user_id, created_at)

## 4. PostgreSQL Policies (RLS)

Enable RLS on all tables containing `user_id`:
```
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY <table>_policy ON <table>
  USING (user_id = current_setting('request.jwt.claims.user_id')::UUID);
```
Apply for: users, generations, flashcards, generation_error_logs, candidate_cards, sessions, session_items, events.

## 5. Additional Notes

- TTL for `candidate_cards` is enforced via `expires_at` + pg_cron cleanup job.
- Partycjonowanie tabel `generation_error_logs` and `events` deferred until high volume.
- Consider materialized views for KPI dashboards (e.g., events aggregation).
- Ensure `pgcrypto` extension is available for `gen_random_uuid()`.
