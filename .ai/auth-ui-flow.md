# Przepływ UI Uwierzytelniania

## Mapa Komponentów

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION UI                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  /login          │  ← AuthPage.tsx (3 tryby)
│  (login.astro)   │
└────────┬─────────┘
         │
         ├─── [Login Mode]
         │    • Email + Password
         │    • Redirect to redirectTo
         │    • Error messages
         │
         ├─── [Register Mode]
         │    • Email + Password + Confirm
         │    • Validation (8+ chars)
         │    • Email verification flow
         │
         └─── [Reset Mode]
              • Email input
              • Send reset link
              └─→ Email sent
                  └─→ User clicks link
                      └─→ /reset-password/confirm

┌────────────────────────────────┐
│  /reset-password/confirm       │  ← ResetPasswordConfirmPage.tsx
│  (confirm.astro)               │
└────────────┬───────────────────┘
             │
             ├─── Check recovery session
             │    ├─ Valid → Show form
             │    └─ Invalid → Error + CTA to login
             │
             └─── New password form
                  • Password (8+ chars)
                  • Confirm password
                  • Update password
                  └─→ Success → Auto redirect to /login (3s)

┌────────────────────────────────┐
│  /verify-email                 │  ← EmailVerificationResultPage.tsx
│  (verify-email.astro)          │
└────────────┬───────────────────┘
             │
             ├─── Parse URL params
             │    • type=signup
             │    • error_description
             │
             ├─── Check session
             │    ├─ Verified → Success message
             │    └─ Error → Error message
             │
             └─── CTA to /login

┌────────────────────────────────┐
│  NavBar.tsx                    │  ← Dynamic auth state
└────────────┬───────────────────┘
             │
             ├─── Loading state
             │    • Show minimal nav
             │
             ├─── Authenticated
             │    • Show nav links
             │    • "Wyloguj" button
             │
             └─── Not authenticated
                  • "Zaloguj się" button
```

## Routing

```
/login
  ├─ ?redirectTo=/generate/new  ← Po loginie wraca tutaj
  └─ ?redirectTo=/flashcards    ← Whitelist validation

/reset-password/confirm
  ← Link z email (Supabase recovery token)

/verify-email
  ← Link z email (Supabase verification token)
  ?type=signup
  ?error_description=...
```

## Walidacje

### Client-side (Inline)

```typescript
// Email
isValidEmail(email) → /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password (Registration/Reset)
password.length >= 8

// Confirm Password
password === confirmPassword

// RedirectTo
- Must start with "/"
- No "://" or "//"
- Must match whitelist paths
```

### Whitelist Paths

```typescript
ALLOWED_REDIRECT_PATHS = [
  "/",
  "/generate/new",
  "/flashcards",
  "/sessions",
]
```

## Komunikaty Błędów

### Login
- ✅ "Podaj poprawny adres e-mail"
- ✅ "Nieprawidłowy e-mail lub hasło"
- ✅ "Twój e-mail nie został jeszcze zweryfikowany. Sprawdź skrzynkę."
- ✅ "Błąd logowania. Spróbuj ponownie."

### Register
- ✅ "Podaj poprawny adres e-mail"
- ✅ "Hasło musi mieć co najmniej 8 znaków"
- ✅ "Hasła nie są identyczne"
- ✅ "Użytkownik o tym adresie e-mail już istnieje. Zaloguj się."
- ✅ "Konto utworzone. Sprawdź e-mail, aby zweryfikować konto."

### Reset Password
- ✅ "Link do resetowania hasła został wysłany na Twój e-mail."
- ✅ "Błąd wysyłania linku. Spróbuj ponownie."
- ✅ "Link wygasł lub jest nieprawidłowy. Wyślij nowy link resetu."
- ✅ "Hasło zaktualizowane, zaloguj się."

## Stany UI

### AuthPage
```
┌─────────────┐
│   Initial   │
└──────┬──────┘
       │
       ├─ Already logged in? → Redirect
       │
       ├─ [Login Mode]
       │  ├─ Idle
       │  ├─ Loading (submitting)
       │  ├─ Error
       │  └─ Success → Redirect
       │
       ├─ [Register Mode]
       │  ├─ Idle
       │  ├─ Loading (submitting)
       │  ├─ Error
       │  ├─ Success (no session) → Show message
       │  └─ Success (with session) → Redirect
       │
       └─ [Reset Mode]
          ├─ Idle
          ├─ Loading (submitting)
          ├─ Error
          └─ Success → Show message
```

### ResetPasswordConfirmPage
```
┌─────────────┐
│   Initial   │
└──────┬──────┘
       │
       ├─ Check session
       │  ├─ No session → Error state
       │  └─ Has session → Form state
       │
       ├─ [Form State]
       │  ├─ Idle
       │  ├─ Loading (submitting)
       │  ├─ Error
       │  └─ Success → Auto redirect (3s)
       │
       └─ [Error State]
          └─ Show error + CTA to login
```

### EmailVerificationResultPage
```
┌─────────────┐
│   Loading   │ ← Parse URL params
└──────┬──────┘
       │
       ├─ Success → Show success message
       └─ Error → Show error message
```

### NavBar
```
┌─────────────┐
│   Loading   │ ← Check session
└──────┬──────┘
       │
       ├─ Authenticated
       │  ├─ Show nav links
       │  └─ "Wyloguj" button
       │
       └─ Not Authenticated
          └─ "Zaloguj się" button
```

## Touched State Pattern

```typescript
// Prevents showing errors before user interacts
const [touched, setTouched] = useState({
  email: false,
  password: false,
  confirmPassword: false
});

// Show error only if:
// 1. Field was touched (onBlur)
// 2. Field has value
// 3. Validation fails

{touched.email && !isValidEmail(email) && (
  <p className="text-sm text-destructive mt-1">
    Podaj poprawny adres e-mail
  </p>
)}
```

## Accessibility (ARIA)

```html
<!-- Invalid field -->
<Input
  aria-invalid={touched.email && !isValidEmail(email)}
/>

<!-- Error alert -->
<Alert variant="destructive" role="alert">
  <AlertDescription>{error}</AlertDescription>
</Alert>

<!-- Success alert -->
<Alert role="status">
  <AlertDescription>{successMessage}</AlertDescription>
</Alert>

<!-- Loading spinner -->
<div role="status" aria-label="Ładowanie">
  <div className="animate-spin ..."></div>
</div>

<!-- Navigation -->
<nav role="navigation" aria-label="Główna nawigacja">
  ...
</nav>

<!-- Menu button -->
<Button
  aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
  aria-expanded={isMenuOpen}
>
  ...
</Button>
```

## Responsive Design

```css
/* Mobile first */
.space-y-4           /* Vertical spacing */
.px-4                /* Padding mobile */

/* Tablet and up */
sm:px-6              /* Padding tablet */
sm:flex              /* Show desktop nav */
sm:hidden            /* Hide mobile menu */

/* Desktop */
lg:px-8              /* Padding desktop */
```

## Dark Mode Support

Wszystkie komponenty używają semantic colors:
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `text-muted-foreground`
- `text-destructive`
- `border` (automatic contrast)

## Integration Points

### Existing Hooks
```typescript
// Already implemented
import { useSupabase } from "../lib/hooks/useSupabase";
import { useAuthGuard } from "../lib/hooks/useAuthGuard";

// Usage in protected pages
function GeneratePage() {
  useAuthGuard(false); // Redirect to login if not authenticated
  // ... rest of component
}
```

### Supabase Methods Used
```typescript
// Auth
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password })
supabase.auth.resetPasswordForEmail(email, { redirectTo })
supabase.auth.updateUser({ password })
supabase.auth.signOut()

// Session
supabase.auth.getSession()
supabase.auth.onAuthStateChange((event, session) => {})
```

## Testing Checklist

### Manual Testing
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new account
- [ ] Register with existing email
- [ ] Password too short validation
- [ ] Password mismatch validation
- [ ] Email format validation
- [ ] Reset password flow
- [ ] Verify email flow
- [ ] Logout functionality
- [ ] RedirectTo parameter
- [ ] Invalid redirectTo blocked
- [ ] Mobile menu works
- [ ] Dark mode works
- [ ] Screen reader navigation

### Edge Cases
- [ ] Expired recovery token
- [ ] Invalid verification link
- [ ] Already logged in → auto redirect
- [ ] Session expires during use
- [ ] Network errors
- [ ] Slow connection (loading states)

