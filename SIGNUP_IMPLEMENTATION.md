# Signup & Login Implementation

## Overview

This document describes the authentication implementation for the Fiszki AI application, including signup, login, and the email verification flow.

## Architecture

The authentication system consists of:

1. **Backend API Endpoints** - Server-side authentication handlers
2. **Frontend Components** - React forms for user interaction
3. **Middleware Integration** - Route protection and session management
4. **Email Verification Flow** - Supabase email confirmation

## Implementation Details

### 1. Backend API Endpoints

#### Signup Endpoint: `/api/auth/signup.ts`

**Purpose:** Registers new users with email and password.

**Features:**
- ✅ Server-side validation using Zod schemas
- ✅ Email format validation
- ✅ Password strength validation (8-72 characters)
- ✅ Duplicate user detection
- ✅ Email verification flow integration
- ✅ Comprehensive error handling

**Request:**
```typescript
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "requiresEmailConfirmation": true,
  "message": "Konto utworzone. Sprawdź swoją skrzynkę e-mail..."
}
```

**Response (Error - 400):**
```json
{
  "code": "USER_EXISTS",
  "message": "Użytkownik o tym adresie e-mail już istnieje"
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `USER_EXISTS` - Email already registered
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `SIGNUP_ERROR` - Generic signup error
- `INTERNAL_ERROR` - Server error

#### Login Endpoint: `/api/auth/login.ts`

**Purpose:** Authenticates existing users.

**Features:**
- ✅ Server-side validation using Zod schemas
- ✅ Email format validation
- ✅ Session creation with cookies
- ✅ Email verification status check
- ✅ Comprehensive error handling

**Request:**
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `INVALID_CREDENTIALS` - Wrong email or password
- `EMAIL_NOT_CONFIRMED` - Email not verified yet
- `LOGIN_ERROR` - Generic login error
- `INTERNAL_ERROR` - Server error

### 2. Frontend Components

#### SignupForm Component (`src/components/SignupForm.tsx`)

**Features:**
- ✅ Email validation with real-time feedback
- ✅ Password strength validation (8-72 characters)
- ✅ Password confirmation matching
- ✅ Accessible form with ARIA attributes
- ✅ Loading states and error handling
- ✅ Success message with email verification instructions
- ✅ Link to switch to login form

**Props:**
```typescript
interface SignupFormProps {
  onSuccess?: () => void;           // Called after successful signup
  onSwitchToLogin?: () => void;     // Called when user clicks "Login" link
}
```

**Validation Rules:**
- Email: Valid email format (RFC 5322)
- Password: 8-72 characters
- Confirm Password: Must match password

**User Experience:**
1. User fills out the form
2. Client-side validation provides immediate feedback
3. On submit, API call is made to `/api/auth/signup`
4. Success: Shows green alert with email verification instructions
5. Error: Shows red alert with specific error message

#### LoginForm Component (`src/components/LoginForm.tsx`)

**Features:**
- ✅ Email validation with real-time feedback
- ✅ Secure redirect handling (whitelist-based)
- ✅ Accessible form with ARIA attributes
- ✅ Loading states and error handling
- ✅ Links to signup and password reset
- ✅ Automatic redirect after successful login

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;           // Called after successful login
  onSwitchToSignup?: () => void;    // Called when user clicks "Signup" link
  onSwitchToReset?: () => void;     // Called when user clicks "Reset password"
}
```

**Redirect Whitelist:**
- `/` - Home page
- `/generate/new` - Generate flashcards
- `/flashcards` - Flashcard list
- `/sessions` - Study sessions

**Security Features:**
- Validates `redirectTo` parameter to prevent open redirect vulnerabilities
- Only allows relative paths starting with `/`
- Blocks protocol and host injection attempts
- Defaults to `/generate/new` for invalid redirects

### 3. Pages

#### Signup Page (`src/pages/signup.astro`)

**Route:** `/signup`

**Features:**
- ✅ Server-side rendering disabled (`prerender: false`)
- ✅ No navigation bar (clean signup experience)
- ✅ Centered layout with responsive design
- ✅ Link to switch to login page

**Access:** Public (no authentication required)

#### Login Page (`src/pages/login.astro`)

**Route:** `/login`

**Features:**
- Uses `AuthPage` component (combined login/signup/reset)
- Alternative to separate `LoginForm` component
- Provides all authentication modes in one place

**Note:** The application has two approaches:
1. **Combined approach:** `AuthPage` component with mode switching
2. **Separate approach:** Individual `LoginForm` and `SignupForm` components

Both approaches are valid and can coexist. The separate approach provides better code organization and easier customization per form.

### 4. Middleware Integration

The middleware (`src/middleware/index.ts`) includes `/signup` in the public paths:

```typescript
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",        // ← Added
  "/reset-password/confirm",
  "/verify-email",
  "/api/auth/logout",
];
```

This ensures unauthenticated users can access the signup page.

## Email Verification Flow

### How It Works

1. **User Signs Up**
   - User submits signup form
   - Backend creates user account in Supabase
   - Account is created with `email_confirmed_at: null`

2. **Supabase Sends Email**
   - Supabase automatically sends verification email
   - Email contains a magic link with token
   - Link is valid for 24 hours by default

3. **User Clicks Link**
   - Link redirects to `/login` (configured in signup endpoint)
   - Supabase verifies the token
   - Sets `email_confirmed_at` to current timestamp
   - User can now log in

4. **User Logs In**
   - User enters credentials
   - If email not confirmed: Shows error message
   - If email confirmed: Login succeeds

### Configuration

Email verification is configured in Supabase:

```typescript
await locals.supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${new URL(request.url).origin}/login`,
  },
});
```

### User Messages

**After Signup:**
```
Konto utworzone! Sprawdź swoją skrzynkę e-mail i kliknij link 
weryfikacyjny, aby aktywować konto. Link jest ważny przez 24 godziny.
```

**Login with Unverified Email:**
```
Twój e-mail nie został jeszcze zweryfikowany. 
Sprawdź swoją skrzynkę pocztową.
```

### Troubleshooting Email Verification

**Email Not Received:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Supabase email settings
4. Ensure SMTP is configured in Supabase

**Link Expired:**
1. User can request new signup
2. Or implement "Resend verification email" feature (future enhancement)

**Email Already Verified:**
1. User can proceed to login
2. No action needed

## Security Best Practices

### ✅ Implemented

1. **Input Validation**
   - Server-side validation with Zod
   - Client-side validation for UX
   - Email format validation
   - Password strength requirements

2. **Error Handling**
   - Generic error messages (don't leak info)
   - Specific error codes for client handling
   - Comprehensive logging for debugging

3. **Redirect Security**
   - Whitelist-based redirect validation
   - Prevents open redirect attacks
   - Only allows relative paths

4. **Session Management**
   - HTTPOnly cookies
   - Secure flag in production
   - SameSite: Lax
   - Automatic session refresh

5. **Password Security**
   - Minimum 8 characters
   - Maximum 72 characters (bcrypt limit)
   - Hashed by Supabase (bcrypt)
   - Never logged or exposed

### 🔒 Additional Recommendations

1. **Rate Limiting** (Future Enhancement)
   - Limit signup attempts per IP
   - Limit login attempts per email
   - Prevents brute force attacks

2. **CAPTCHA** (Future Enhancement)
   - Add reCAPTCHA to signup form
   - Prevents automated bot signups

3. **Password Strength Meter** (Future Enhancement)
   - Visual feedback on password strength
   - Encourage stronger passwords

4. **Two-Factor Authentication** (Future Enhancement)
   - Optional 2FA for enhanced security
   - TOTP or SMS-based

## Testing

### Manual Testing Checklist

#### Signup Flow
- [ ] Valid signup creates account
- [ ] Duplicate email shows error
- [ ] Invalid email format shows error
- [ ] Weak password shows error
- [ ] Password mismatch shows error
- [ ] Success message displays correctly
- [ ] Verification email is sent
- [ ] Form clears after successful signup

#### Login Flow
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error
- [ ] Unverified email shows specific error
- [ ] Redirect to intended page works
- [ ] Invalid redirect defaults to /generate/new
- [ ] Session persists across page refreshes

#### Email Verification
- [ ] Verification link works
- [ ] Expired link shows error
- [ ] Already verified link works
- [ ] Can login after verification

### Test Accounts

Create test accounts with different states:
1. **Verified account** - Can login
2. **Unverified account** - Cannot login
3. **Non-existent account** - Shows error

## API Documentation

### Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/signup` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Authenticate user |
| `/api/auth/logout` | POST | Yes | Sign out user |

### Request/Response Examples

See individual endpoint sections above for detailed examples.

## Integration with Existing Code

### Using SignupForm

```tsx
import SignupForm from "@/components/SignupForm";

<SignupForm
  onSuccess={() => console.log("Signup successful!")}
  onSwitchToLogin={() => window.location.href = "/login"}
/>
```

### Using LoginForm

```tsx
import LoginForm from "@/components/LoginForm";

<LoginForm
  onSuccess={() => console.log("Login successful!")}
  onSwitchToSignup={() => window.location.href = "/signup"}
  onSwitchToReset={() => window.location.href = "/reset-password"}
/>
```

### Creating Custom Auth Pages

```astro
---
import Layout from "../layouts/Layout.astro";
import SignupForm from "../components/SignupForm";

export const prerender = false;
---

<Layout title="Join Us" showNav={false}>
  <SignupForm client:load />
</Layout>
```

## Changelog

- **2025-10-18**: Initial implementation
  - Created signup and login API endpoints
  - Created SignupForm and LoginForm components
  - Created signup page
  - Integrated with middleware
  - Implemented email verification flow
  - Added comprehensive documentation

## Related Documentation

- [Authentication Protection Implementation](./AUTH_PROTECTION_IMPLEMENTATION.md)
- [Supabase Auth Guide](./.cursor/rules/supabase-auth.mdc)
- [Frontend Implementation](./FRONTEND_IMPLEMENTATION.md)


