-- =====================================================================================
-- Migration: Add Spaced Repetition Fields to Flashcards
-- =====================================================================================
-- Purpose: Add columns to support spaced repetition algorithm (SM-2)
-- Affected Tables: flashcards
-- Fields Added: due_at, interval_days, ease_factor, repetitions, last_reviewed_at
-- =====================================================================================

-- Add spaced repetition fields to flashcards table
alter table flashcards 
  add column if not exists due_at timestamptz,
  add column if not exists interval_days int not null default 0,
  add column if not exists ease_factor decimal(3,2) not null default 2.50,
  add column if not exists repetitions int not null default 0,
  add column if not exists last_reviewed_at timestamptz;

-- Add comments for the new columns
comment on column flashcards.due_at is 'Next review date (null for never reviewed)';
comment on column flashcards.interval_days is 'Days until next review (0 for new cards)';
comment on column flashcards.ease_factor is 'SM-2 ease factor (default 2.50, range 1.30-2.50)';
comment on column flashcards.repetitions is 'Number of successful reviews in current learning phase';
comment on column flashcards.last_reviewed_at is 'Timestamp of last review (null if never reviewed)';

-- Create index for efficient due date queries
create index if not exists flashcards_user_due_idx on flashcards using btree (user_id, due_at)
  where due_at is not null;

-- Add constraint to ensure ease_factor stays within reasonable bounds
alter table flashcards 
  add constraint flashcards_ease_factor_bounds 
  check (ease_factor >= 1.30 and ease_factor <= 2.50);

-- Add constraint to ensure interval_days is non-negative
alter table flashcards 
  add constraint flashcards_interval_days_positive 
  check (interval_days >= 0);

-- Add constraint to ensure repetitions is non-negative
alter table flashcards 
  add constraint flashcards_repetitions_positive 
  check (repetitions >= 0);


