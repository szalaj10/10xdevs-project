-- =====================================================================================
-- Migration: Create Flashcards Application Schema (MVP)
-- =====================================================================================
-- Purpose: Initialize database schema for flashcard generation and learning system
-- Tables: generations, flashcards, generation_error_logs, candidate_cards, 
--         sessions, session_items, events
-- Extensions: pg_trgm for text search
-- RLS: Enabled on all tables with user-scoped policies
-- =====================================================================================

-- =====================================================================================
-- Extensions
-- =====================================================================================

-- Enable pg_trgm extension for fuzzy text search on flashcard content
create extension if not exists pg_trgm;

-- Enable pgcrypto for UUID generation (if not already enabled)
create extension if not exists pgcrypto;

-- =====================================================================================
-- Custom Types
-- =====================================================================================

-- Enum for candidate card status tracking
-- pending: newly generated, awaiting user review
-- accepted: user approved and converted to flashcard
-- rejected: user dismissed the candidate
create type candidate_status as enum ('pending', 'accepted', 'rejected');

-- =====================================================================================
-- Tables
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Table: generations
-- -------------------------------------------------------------------------------------
-- Purpose: Track AI-powered flashcard generation requests and their outcomes
-- Stores metadata about each generation session including model used, acceptance rates,
-- and source material characteristics for analytics and optimization
create table generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count int not null check (generated_count >= 0),
  accepted_unedited_count int not null default 0 check (accepted_unedited_count >= 0),
  accepted_edited_count int not null default 0 check (accepted_edited_count >= 0),
  source_text_hash varchar not null,
  source_text_length int not null check (source_text_length >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table generations is 'Tracks AI flashcard generation sessions with acceptance metrics';
comment on column generations.model is 'AI model identifier used for generation (e.g., gpt-4, claude-3)';
comment on column generations.generated_count is 'Total number of flashcards generated in this session';
comment on column generations.accepted_unedited_count is 'Count of generated cards accepted without modifications';
comment on column generations.accepted_edited_count is 'Count of generated cards accepted after user edits';
comment on column generations.source_text_hash is 'Hash of source material to detect duplicate generation requests';
comment on column generations.source_text_length is 'Character count of source material for analytics';

-- -------------------------------------------------------------------------------------
-- Table: flashcards
-- -------------------------------------------------------------------------------------
-- Purpose: Store user's permanent flashcard collection
-- Each flashcard represents a question-answer pair with optional source reference
-- Format: front = pytanie (question), back = odpowiedź (answer)
-- Example: front = "Jakie podstawowe funkcje pełni serce?", 
--          back = "Serce jest głównym organem krwioobiegu..."
-- Constraints ensure content length limits for optimal UX
create table flashcards (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id bigint references generations(id) on delete set null,
  front varchar not null check (char_length(front) <= 200),
  back varchar not null check (char_length(back) <= 350),
  source varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table flashcards is 'User flashcard collection in question-answer format';
comment on column flashcards.front is 'Question (pytanie) - max 200 chars';
comment on column flashcards.back is 'Answer (odpowiedź) - max 350 chars';
comment on column flashcards.source is 'Optional reference to source material';
comment on column flashcards.generation_id is 'Links to generation session (nullable for manual cards)';

-- -------------------------------------------------------------------------------------
-- Table: generation_error_logs
-- -------------------------------------------------------------------------------------
-- Purpose: Capture and track AI generation failures for debugging and monitoring
-- Helps identify patterns in failures and improve generation quality
create table generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length int not null check (source_text_length >= 0),
  error_code varchar not null,
  error_message varchar not null,
  created_at timestamptz not null default now()
);

comment on table generation_error_logs is 'Logs AI generation failures for monitoring and debugging';
comment on column generation_error_logs.error_code is 'Standardized error code for categorization';
comment on column generation_error_logs.error_message is 'Detailed error message from AI provider';

-- -------------------------------------------------------------------------------------
-- Table: candidate_cards
-- -------------------------------------------------------------------------------------
-- Purpose: Temporary storage for AI-generated flashcard suggestions awaiting user review
-- Format: front = pytanie (question), back = odpowiedź (answer)
-- Cards expire after 24 hours (enforced via expires_at and cleanup job)
-- Status tracks user decision: pending, accepted (converted to flashcard), or rejected
create table candidate_cards (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id bigint not null references generations(id) on delete cascade,
  front varchar not null check (char_length(front) <= 200),
  back varchar not null check (char_length(back) <= 350),
  status candidate_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '1 day',
  created_at timestamptz not null default now()
);

comment on table candidate_cards is 'Temporary holding area for AI-generated question-answer flashcards awaiting user review';
comment on column candidate_cards.front is 'Question (pytanie) - max 200 chars';
comment on column candidate_cards.back is 'Answer (odpowiedź) - max 350 chars';
comment on column candidate_cards.status is 'User decision status: pending, accepted, or rejected';
comment on column candidate_cards.expires_at is 'Automatic expiration timestamp (24h TTL)';

-- -------------------------------------------------------------------------------------
-- Table: sessions
-- -------------------------------------------------------------------------------------
-- Purpose: Track individual study/review sessions
-- A session represents a single study period with start and optional end time
create table sessions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

comment on table sessions is 'Individual study session tracking';
comment on column sessions.ended_at is 'Session end time (null for active sessions)';

-- -------------------------------------------------------------------------------------
-- Table: session_items
-- -------------------------------------------------------------------------------------
-- Purpose: Store individual flashcard reviews within a study session
-- Rating captures user's self-assessment: -1 (incorrect), 0 (partial), 1 (correct)
create table session_items (
  id bigserial primary key,
  session_id bigint not null references sessions(id) on delete cascade,
  flashcard_id bigint not null references flashcards(id) on delete cascade,
  rating smallint not null check (rating in (-1, 0, 1))
);

comment on table session_items is 'Individual flashcard reviews within study sessions';
comment on column session_items.rating is 'User rating: -1 (incorrect), 0 (partial), 1 (correct)';

-- -------------------------------------------------------------------------------------
-- Table: events
-- -------------------------------------------------------------------------------------
-- Purpose: General event logging for analytics and user behavior tracking
-- Flexible JSONB metadata field allows capturing diverse event types without schema changes
create table events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id bigint references flashcards(id) on delete set null,
  event_type varchar not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table events is 'General purpose event log for analytics and behavior tracking';
comment on column events.event_type is 'Event category identifier (e.g., card_viewed, generation_started)';
comment on column events.metadata is 'Flexible JSON field for event-specific data';

-- =====================================================================================
-- Indexes
-- =====================================================================================

-- Flashcards: Enable fuzzy text search on front field (pytanie/question)
-- Uses trigram similarity for "search as you type" functionality
-- Example: searching "serce" will find "Jakie podstawowe funkcje pełni serce?"
create index flashcards_front_trgm_idx on flashcards using gin (front gin_trgm_ops);

-- Flashcards: Optimize user timeline queries (filtering + sorting)
create index flashcards_user_created_idx on flashcards using btree (user_id, created_at);

-- Generations: Fast lookups by user for analytics dashboards
create index generations_user_idx on generations using btree (user_id);

-- Candidate cards: Optimize filtering by user and status (pending review queries)
create index candidate_cards_user_status_idx on candidate_cards using btree (user_id, status);

-- Events: Enable fast JSONB queries on metadata field
create index events_metadata_idx on events using gin (metadata);

-- Events: Optimize user event timeline queries
create index events_user_created_idx on events using btree (user_id, created_at);

-- =====================================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- RLS: generations
-- -------------------------------------------------------------------------------------
alter table generations enable row level security;

-- Allow authenticated users to view their own generation records
create policy generations_select_own
  on generations
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create generation records
create policy generations_insert_own
  on generations
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own generation records
create policy generations_update_own
  on generations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete their own generation records
create policy generations_delete_own
  on generations
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS: flashcards
-- -------------------------------------------------------------------------------------
alter table flashcards enable row level security;

-- Allow authenticated users to view their own flashcards
create policy flashcards_select_own
  on flashcards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create flashcards
create policy flashcards_insert_own
  on flashcards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own flashcards
create policy flashcards_update_own
  on flashcards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete their own flashcards
create policy flashcards_delete_own
  on flashcards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS: generation_error_logs
-- -------------------------------------------------------------------------------------
alter table generation_error_logs enable row level security;

-- Allow authenticated users to view their own error logs
create policy generation_error_logs_select_own
  on generation_error_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create error log entries
create policy generation_error_logs_insert_own
  on generation_error_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Note: No update/delete policies for error logs (immutable audit trail)

-- -------------------------------------------------------------------------------------
-- RLS: candidate_cards
-- -------------------------------------------------------------------------------------
alter table candidate_cards enable row level security;

-- Allow authenticated users to view their own candidate cards
create policy candidate_cards_select_own
  on candidate_cards
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create candidate cards
create policy candidate_cards_insert_own
  on candidate_cards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own candidate cards (for status changes)
create policy candidate_cards_update_own
  on candidate_cards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete their own candidate cards
create policy candidate_cards_delete_own
  on candidate_cards
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS: sessions
-- -------------------------------------------------------------------------------------
alter table sessions enable row level security;

-- Allow authenticated users to view their own study sessions
create policy sessions_select_own
  on sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create study sessions
create policy sessions_insert_own
  on sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to update their own sessions (e.g., set ended_at)
create policy sessions_update_own
  on sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow authenticated users to delete their own sessions
create policy sessions_delete_own
  on sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- -------------------------------------------------------------------------------------
-- RLS: session_items
-- -------------------------------------------------------------------------------------
alter table session_items enable row level security;

-- Allow authenticated users to view session items from their own sessions
-- Uses subquery to verify session ownership
create policy session_items_select_own
  on session_items
  for select
  to authenticated
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_items.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create session items in their own sessions
create policy session_items_insert_own
  on session_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions
      where sessions.id = session_items.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Allow authenticated users to update session items from their own sessions
create policy session_items_update_own
  on session_items
  for update
  to authenticated
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_items.session_id
      and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      where sessions.id = session_items.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Allow authenticated users to delete session items from their own sessions
create policy session_items_delete_own
  on session_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_items.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------------------
-- RLS: events
-- -------------------------------------------------------------------------------------
alter table events enable row level security;

-- Allow authenticated users to view their own events
create policy events_select_own
  on events
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create event records
create policy events_insert_own
  on events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Note: No update/delete policies for events (immutable audit trail)

-- =====================================================================================
-- Triggers
-- =====================================================================================

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables with updated_at column
create trigger update_generations_updated_at
  before update on generations
  for each row
  execute function update_updated_at_column();

create trigger update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

-- =====================================================================================
-- Notes
-- =====================================================================================
-- 1. TTL for candidate_cards enforced via expires_at + pg_cron cleanup job (to be created)
-- 2. Consider partitioning generation_error_logs and events tables when volume increases
-- 3. Consider materialized views for KPI dashboards (events aggregation) in future
-- 4. Users table managed by Supabase Auth (auth.users schema)
-- =====================================================================================

