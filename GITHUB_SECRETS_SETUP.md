# GitHub Secrets Setup Guide

## Overview

The E2E tests require GitHub Secrets to be configured in your repository. Without these secrets, the E2E tests will be automatically skipped in CI/CD.

## Current Status

✅ **Workflow Updated**: The CI workflow now gracefully skips E2E tests when secrets are not configured.

⚠️ **Secrets Required**: To enable E2E tests in CI, you need to configure the following secrets.

## Required Secrets

### 1. Supabase Configuration

You need a **hosted Supabase project** (not local) for CI/CD testing.

**Steps:**
1. Go to [supabase.com](https://supabase.com) and create a project (or use existing)
2. Navigate to Project Settings → API
3. Copy the following values:

| Secret Name | Value | Where to Find |
|------------|-------|---------------|
| `PUBLIC_SUPABASE_URL` | Your project URL | Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_KEY` | Your anon/public key | Project Settings → API → Project API keys → `anon` `public` |

### 2. Test User Credentials

You need a test user in your Supabase database.

**Steps:**
1. Go to your Supabase project → Authentication → Users
2. Create a new user (or use existing test user)
3. Note the credentials:

| Secret Name | Value | Example |
|------------|-------|---------|
| `TEST_USER_EMAIL` | Test user email | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password | `SecureTestPass123!` |

### 3. GROQ API Configuration (Optional)

Required only if testing AI features.

**Steps:**
1. Get API key from [console.groq.com](https://console.groq.com)
2. Configure these secrets:

| Secret Name | Value | Default |
|------------|-------|---------|
| `GROQ_API_KEY` | Your GROQ API key | (required if testing AI) |
| `GROQ_MODEL` | Model to use | `llama-3.3-70b-versatile` |
| `GROQ_BASE_URL` | API base URL | `https://api.groq.com/openai/v1` |

## How to Add Secrets to GitHub

### For Repository Owners

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret one by one:
   - Name: `PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Click **Add secret**
5. Repeat for all required secrets

### For Contributors

If you're a contributor without access to repository secrets:
- E2E tests will be skipped in your PRs
- This is expected behavior
- Repository maintainers will run E2E tests when reviewing your PR

## Verifying Setup

After adding secrets, the next PR or workflow run should:

1. ✅ Run lint checks
2. ✅ Run unit tests
3. ✅ Run E2E tests (if secrets are configured)
4. ✅ Post a status comment

If secrets are not configured:
1. ✅ Run lint checks
2. ✅ Run unit tests
3. ⚠️ Skip E2E tests
4. ✅ Post a status comment (noting E2E tests were skipped)

## Local Development

For local E2E testing, you don't need GitHub Secrets. Instead:

1. Copy the example file:
   ```bash
   cp env.test.example .env.test
   ```

2. Fill in your **local** Supabase credentials:
   ```bash
   supabase status  # Get your local credentials
   ```

3. Update `.env.test`:
   ```env
   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   PUBLIC_SUPABASE_KEY=your-local-anon-key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=test123456
   ```

4. Run tests:
   ```bash
   npm run test:e2e
   ```

## Troubleshooting

### E2E tests still failing after adding secrets

1. **Check secret names**: They must match exactly (case-sensitive)
2. **Check Supabase project**: Must be accessible from GitHub Actions runners
3. **Check test user**: Must exist in the Supabase project's auth users
4. **Check workflow logs**: Look for specific error messages

### E2E tests skipped but secrets are configured

1. **Verify secret value**: Make sure `PUBLIC_SUPABASE_URL` is not empty
2. **Re-run workflow**: Sometimes GitHub needs a moment to propagate secrets
3. **Check workflow file**: Ensure the `if` condition is correct

### Local tests work but CI tests fail

1. **Environment mismatch**: Local uses `127.0.0.1:54321`, CI needs hosted Supabase
2. **User credentials**: Test user must exist in the hosted Supabase project
3. **Network access**: Ensure Supabase project allows connections from GitHub IPs

## Security Notes

- ✅ Secrets are encrypted and not visible in logs
- ✅ Secrets are only available to workflows in the main repository
- ✅ Forks don't have access to secrets (by design)
- ⚠️ Don't commit `.env.test` file (it's in `.gitignore`)
- ⚠️ Use a dedicated test user, not production credentials

## Next Steps

1. **For Repository Owners**: Add the required secrets following the guide above
2. **For Contributors**: Continue developing - E2E tests will be skipped in your PRs
3. **For Everyone**: Local E2E testing works with `.env.test` file

---

**Questions?** Check the [Playwright documentation](https://playwright.dev/) or [Supabase documentation](https://supabase.com/docs).

