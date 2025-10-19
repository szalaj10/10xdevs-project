# Authentication Setup

## Overview

The application uses Supabase Auth for user authentication with email/password sign-in.

## Test User Credentials

For development and testing, use the following credentials:

- **Email:** `mszalajko@manufacturo.com`
- **Password:** `Pracownik123`
- **User ID:** `0b4e8bb7-ceda-46a0-9760-672b856f2f4a`

## Quick Start

### 1. Ensure Supabase is Running

```bash
npx supabase status
```

If not running, start it with:
```bash
npx supabase start
```

### 2. Setup Test User

The test user is automatically pre-filled in the login form. To verify or reset the password:

```bash
node setup-test-user.js
```

This script will:
- Check if the user exists
- Update the password to `Pracownik123`
- Test the login
- Display the access token

### 3. Login to the Application

Navigate to `http://localhost:3000/login` and the form will be pre-filled with the test credentials. Click "Zaloguj się" (Login) to authenticate.

## API Authentication

### Getting an Access Token

**Using the Web UI:**
1. Go to `http://localhost:3000/login`
2. Login with the credentials above
3. The token will be stored in the browser session

**Using the Test Script:**
```bash
node test-auth.js
```

**Using the Test Page:**
Open `test-auth.html` in your browser and click "Test Login" to see the full authentication flow and access token.

### Using the Access Token

Include the access token in the `Authorization` header for API requests:

```javascript
const response = await fetch('http://localhost:3000/api/flashcards', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
```

### Example with cURL

```bash
# Get access token
curl -X POST http://127.0.0.1:54321/auth/v1/token \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "email": "mszalajko@manufacturo.com",
    "password": "Pracownik123",
    "gotrue_meta_security": {}
  }' \
  --data-urlencode "grant_type=password"

# Use the token in API calls
curl http://localhost:3000/api/flashcards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment Variables

The following environment variables are configured in `.env.local`:

```env
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Public keys for client-side code
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service role key for admin operations
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Authentication Helpers

The application provides several helper functions in `src/lib/auth.ts`:

```typescript
// Create a Supabase client for browser use
const supabase = createBrowserSupabaseClient();

// Sign in with email and password
const { data, error } = await signInWithPassword(email, password);

// Get the current access token
const token = await getAccessToken();

// Get the current session
const session = await getCurrentSession();

// Sign out
await signOut();
```

## Troubleshooting

### Error: "supabaseKey is required"

This error occurs when the environment variables are not loaded. Solution:
1. Ensure `.env.local` exists and contains the Supabase configuration
2. Restart your development server after modifying `.env.local`
3. Check that there's no BOM (Byte Order Mark) at the beginning of `.env.local`

### Error: "Invalid login credentials"

Solution:
1. Run `node setup-test-user.js` to reset the password
2. Verify the Supabase instance is running with `npx supabase status`
3. Check that email confirmations are disabled in `supabase/config.toml` (line 176: `enable_confirmations = false`)

### Token Expired

Access tokens expire after 1 hour (configurable in `supabase/config.toml`). To refresh:
1. Re-login through the web UI
2. Or use the refresh token with Supabase's `refreshSession()` method

## Development Tools

### Test Scripts

- **test-auth.js** - Node.js script to test authentication
- **test-auth.html** - Browser-based UI for testing authentication
- **setup-test-user.js** - Script to create/update the test user

### Supabase Studio

Access the Supabase admin panel at: `http://127.0.0.1:54323`

From here you can:
- View and manage users
- Browse database tables
- Test SQL queries
- View authentication logs

## Production Deployment

For production deployment:

1. Create a Supabase project at https://supabase.com
2. Update environment variables with production values:
   - `SUPABASE_URL` - Your project URL
   - `SUPABASE_KEY` - Your project anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (keep secret!)
3. Enable email confirmations in Supabase dashboard
4. Configure SMTP for sending emails
5. Remove or secure the test user credentials


