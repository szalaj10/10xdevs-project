# E2E Test Environment Variable Fix

## Problem

The E2E tests were failing with the error:
```
PUBLIC_SUPABASE_URL is not configured. For local development, add it to your .env file.
```

The test would timeout after 120 seconds because the Astro dev server couldn't start due to missing environment variables.

## Root Cause

In `playwright.config.ts`, the `webServer.env` configuration was incorrectly mapping environment variables:

```typescript
env: {
  PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || "",  // ❌ Wrong
  PUBLIC_SUPABASE_KEY: process.env.SUPABASE_PUBLIC_KEY || "",  // ❌ Wrong
}
```

The GitHub Actions workflow (`.github/workflows/pull-request.yml`) sets these variables as:
- `PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
- `PUBLIC_SUPABASE_KEY` (not `SUPABASE_PUBLIC_KEY`)

## Solution

Fixed the environment variable mapping in `playwright.config.ts`:

```typescript
env: {
  PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || "",  // ✅ Correct
  PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || "",  // ✅ Correct
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "",
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || "",
}
```

## Additional Changes

Updated `env.test.example` to include:
- Better comments explaining where to get the values
- Added optional GROQ API configuration for AI feature testing

## Testing

The fix ensures that:
1. **CI/CD**: GitHub Actions can pass the correct environment variables from secrets
2. **Local Development**: Developers can create a `.env.test` file with the correct variable names
3. **Consistency**: Variable names match between CI and local development

## For Local Development

To run E2E tests locally:

1. Copy the example file:
   ```bash
   cp env.test.example .env.test
   ```

2. Fill in your local Supabase credentials (get them with `supabase status`):
   ```env
   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   PUBLIC_SUPABASE_KEY=your-actual-anon-key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=test123456
   ```

3. Run the tests:
   ```bash
   npm run test:e2e
   ```

## Files Modified

- `playwright.config.ts` - Fixed environment variable mapping
- `env.test.example` - Added better documentation and GROQ variables

