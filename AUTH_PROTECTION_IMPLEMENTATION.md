# Authentication Protection Implementation

## Overview

This document describes the universal authentication protection mechanism implemented for the 10xdevs Flashcards application. The implementation follows Supabase SSR best practices and provides defense-in-depth security.

## Architecture

### Two-Layer Protection Strategy

The authentication system uses a **defense-in-depth** approach with two layers of protection:

1. **Middleware Layer (First Line of Defense)**
   - Intercepts all requests before they reach page handlers
   - Validates user session using Supabase SSR
   - Redirects unauthenticated users to `/login` for protected routes
   - Provides centralized authentication logic

2. **Page-Level Guards (Second Line of Defense)**
   - Additional server-side checks in each protected page
   - Ensures security even if middleware is bypassed
   - Provides explicit protection at the component level

## Implementation Details

### 1. Middleware Configuration

**File:** `src/middleware/index.ts`

The middleware implements:

- **Public Paths**: Routes accessible without authentication
  - `/` - Home page
  - `/login` - Login page
  - `/reset-password/confirm` - Password reset confirmation
  - `/verify-email` - Email verification
  - `/api/auth/logout` - Logout endpoint

- **Protected Paths**: Routes requiring authentication
  - `/generate` - All generation-related pages
  - `/flashcards` - Flashcard management
  - `/sessions` - Study sessions

**Key Features:**

```typescript
// Path checking functions
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((protectedPath) =>
    pathname.startsWith(protectedPath)
  );
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}
```

**Authentication Flow:**

1. Create Supabase server instance with SSR cookie handling
2. Get user session using `auth.getUser()`
3. Store user info in `Astro.locals` if authenticated
4. Skip auth check for public paths and API routes
5. Redirect to `/login` if accessing protected route without authentication

### 2. Page-Level Guards

Each protected page includes a server-side authentication guard:

```astro
---
// Server-side authentication guard
const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/login");
}
---
```

**Protected Pages:**

- `src/pages/generate/new.astro` - Create new flashcard generation
- `src/pages/generate/[id]/review.astro` - Review generated candidates
- `src/pages/flashcards/index.astro` - Flashcard list
- `src/pages/sessions/index.astro` - Sessions list
- `src/pages/sessions/[id]/index.astro` - Active study session
- `src/pages/sessions/[id]/summary.astro` - Session summary

### 3. Parameter Validation

Pages with dynamic parameters include additional validation:

```astro
---
const { id } = Astro.params;

if (!id) {
  return Astro.redirect("/appropriate-fallback");
}
---
```

This prevents TypeScript errors and handles edge cases where parameters might be undefined.

## Security Best Practices

### ✅ Implemented

1. **SSR Cookie Handling**: Using `@supabase/ssr` with proper `getAll`/`setAll` methods
2. **Server-Side Validation**: All authentication checks happen on the server
3. **Defense in Depth**: Multiple layers of protection
4. **Secure Cookie Options**: `httpOnly`, `secure`, `sameSite: 'lax'`
5. **Early Returns**: Guard clauses at the beginning of functions
6. **Type Safety**: Proper TypeScript types for user and session data

### 🔒 Security Considerations

- **Never expose Supabase keys** in client-side code
- **Always validate user input** server-side
- **Use proper error handling** without exposing sensitive information
- **Keep authentication logic centralized** in middleware and guards

## Adding New Protected Routes

To protect a new route:

1. **If it's a new path prefix**, add it to `PROTECTED_PATHS` in middleware:
   ```typescript
   const PROTECTED_PATHS = [
     "/generate",
     "/flashcards",
     "/sessions",
     "/your-new-path", // Add here
   ];
   ```

2. **Add page-level guard** to the Astro page:
   ```astro
   ---
   // Server-side authentication guard
   const { user } = Astro.locals;

   if (!user) {
     return Astro.redirect("/login");
   }
   ---
   ```

3. **Validate dynamic parameters** if applicable:
   ```astro
   ---
   const { id } = Astro.params;

   if (!id) {
     return Astro.redirect("/fallback-route");
   }
   ---
   ```

## Making Routes Public

To make a route public (accessible without authentication):

1. Add the exact path to `PUBLIC_PATHS` in middleware:
   ```typescript
   const PUBLIC_PATHS = [
     "/",
     "/login",
     "/your-public-path", // Add here
   ];
   ```

2. Remove any page-level authentication guards from the page

## Testing Authentication

### Manual Testing Checklist

- [ ] Unauthenticated users are redirected to `/login` when accessing protected routes
- [ ] Authenticated users can access all protected routes
- [ ] Public routes are accessible without authentication
- [ ] Logout properly clears session and redirects
- [ ] Session persists across page refreshes
- [ ] Invalid/expired sessions redirect to login

### Test Scenarios

1. **Unauthenticated Access**
   - Try to access `/generate/new` → Should redirect to `/login`
   - Try to access `/flashcards` → Should redirect to `/login`
   - Try to access `/sessions` → Should redirect to `/login`

2. **Authenticated Access**
   - Login successfully
   - Access all protected routes → Should work
   - Refresh page → Session should persist

3. **Public Access**
   - Access `/` → Should work without login
   - Access `/login` → Should work without login

## Troubleshooting

### Common Issues

1. **Redirect Loops**
   - Ensure `/login` is in `PUBLIC_PATHS`
   - Check that API routes start with `/api/`

2. **Session Not Persisting**
   - Verify cookie options are set correctly
   - Check that `getAll`/`setAll` are used (not individual cookie methods)

3. **TypeScript Errors**
   - Ensure `Astro.locals.user` type is defined in `src/env.d.ts`
   - Validate dynamic parameters before use

## References

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware Documentation](https://docs.astro.build/en/guides/middleware/)
- Project Rule: `.cursor/rules/supabase-auth.mdc`

## Changelog

- **2025-10-18**: Initial implementation with two-layer protection strategy
  - Implemented middleware-based authentication
  - Added page-level guards to all protected routes
  - Added parameter validation for dynamic routes


