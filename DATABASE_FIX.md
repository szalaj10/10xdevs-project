# Database Schema Fix - Spaced Repetition Fields

## Issue

The application was failing with the following error:

```json
{
    "code": "42703",
    "details": null,
    "hint": null,
    "message": "column flashcards.due_at does not exist"
}
```

This error occurred because the `flashcards` table was missing the columns required for the spaced repetition algorithm.

## Solution

### Created Migration

**File:** `supabase/migrations/20251016171155_add_spaced_repetition_fields.sql`

This migration adds the following columns to the `flashcards` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `due_at` | `timestamptz` | `null` | Next review date (null for never reviewed cards) |
| `interval_days` | `int` | `0` | Days until next review (0 for new cards) |
| `ease_factor` | `decimal(3,2)` | `2.50` | SM-2 ease factor (range: 1.30-2.50) |
| `repetitions` | `int` | `0` | Number of successful reviews in current learning phase |
| `last_reviewed_at` | `timestamptz` | `null` | Timestamp of last review |

### Constraints Added

- `ease_factor` must be between 1.30 and 2.50
- `interval_days` must be non-negative (>= 0)
- `repetitions` must be non-negative (>= 0)

### Indexes Created

- `flashcards_user_due_idx` - Composite index on `(user_id, due_at)` for efficient due date queries

## Applied Changes

1. ✅ Created migration file
2. ✅ Reset database with `npx supabase db reset`
3. ✅ Recreated test user
4. ✅ Regenerated TypeScript types with `npx supabase gen types typescript --local`
5. ✅ Updated seed file to avoid foreign key errors

## Database Schema Now Supports

- ✅ Spaced repetition algorithm (SM-2)
- ✅ Tracking card review history
- ✅ Calculating next review dates
- ✅ Querying due cards efficiently
- ✅ Learning progress tracking

## How to Apply (If Starting Fresh)

If you need to reset your local database:

```bash
# 1. Reset the database (applies all migrations)
npx supabase db reset

# 2. Recreate the test user
node setup-test-user.js

# 3. (Optional) Regenerate types if needed
npx supabase gen types typescript --local > src/db/database.types.ts
```

## TypeScript Types

The generated types in `src/db/database.types.ts` now include:

```typescript
flashcards: {
  Row: {
    id: number
    user_id: string
    generation_id: number | null
    front: string
    back: string
    source: string | null
    created_at: string
    updated_at: string
    // Spaced repetition fields
    due_at: string | null
    interval_days: number
    ease_factor: number
    repetitions: number
    last_reviewed_at: string | null
  }
  // ... Insert and Update types
}
```

## Next Steps

All database operations involving flashcards should now work correctly, including:

- ✅ Listing flashcards
- ✅ Creating flashcards
- ✅ Updating flashcards
- ✅ Sorting by due date
- ✅ Study sessions
- ✅ Spaced repetition algorithm

The application should now be fully functional!


