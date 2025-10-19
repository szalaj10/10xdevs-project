# Plan implementacji widoku Logowania i Rejestracji

## 1. Przegląd
Widok umożliwia użytkownikowi logowanie się do aplikacji przy użyciu e-maila i hasła oraz rejestrację nowego konta. Wykorzystuje Supabase Auth do uwierzytelniania. Widok obsługuje również reset hasła i opcjonalnie weryfikację e-mail. Po pomyślnym logowaniu użytkownik jest przekierowywany do strony głównej lub poprzedniej strony (jeśli próbował uzyskać dostęp do chronionego zasobu). Widok komunikuje się z Supabase Auth API przez klienta Supabase.

## 2. Routing widoku
Ścieżki:
- `/login` - logowanie
- `/register` - rejestracja (lub tab w `/login`)
- `/reset-password` - reset hasła

W `src/pages/login.astro` osadzić wyspę React:
```astro
---
import AuthPage from '../components/AuthPage';
---
<AuthPage client:load />
```

Opcjonalnie oddzielne strony dla register i reset-password, lub obsługa w jednym komponencie z tabami/trybami.

## 3. Struktura komponentów

AuthPage  
├─ Logo/Brand  
├─ Tabs (lub stan mode: login/register/reset)  
│  ├─ Tab "Logowanie"  
│  └─ Tab "Rejestracja"  
├─ LoginForm (jeśli mode === 'login')  
│  ├─ Input email  
│  ├─ Input password (type="password")  
│  ├─ Link "Zapomniałeś hasła?" → reset mode  
│  └─ Button "Zaloguj się"  
├─ RegisterForm (jeśli mode === 'register')  
│  ├─ Input email  
│  ├─ Input password  
│  ├─ Input confirmPassword  
│  └─ Button "Zarejestruj się"  
├─ ResetPasswordForm (jeśli mode === 'reset')  
│  ├─ Input email  
│  └─ Button "Wyślij link resetujący"  
├─ SuccessMessage (po rejestracji/resetcie)  
├─ LoadingIndicator  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### AuthPage
- Opis: główny kontener widoku uwierzytelniania, zarządza stanem mode (login/register/reset), formularzami i komunikacją z Supabase Auth.
- Elementy: Logo, Tabs (lub przełącznik mode), LoginForm / RegisterForm / ResetPasswordForm w zależności od mode, SuccessMessage, LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onModeChange(mode) → zmień widoczny formularz.
  - onLogin(email, password) → `supabase.auth.signInWithPassword` → redirect do home lub poprzedniej strony.
  - onRegister(email, password) → `supabase.auth.signUp` → komunikat sukcesu (weryfikacja e-mail) lub redirect.
  - onResetPassword(email) → `supabase.auth.resetPasswordForEmail` → komunikat sukcesu.
- Walidacja:
  - Email: format e-mail (regex).
  - Password: minimum 8 znaków (lub zgodnie z polityką Supabase).
  - ConfirmPassword: musi być równe password.
- Typy używane:
  - `string` (email, password)
  - `'login' | 'register' | 'reset'` (mode)
- Props: brak (zarządza stanem wewnętrznie).

### LoginForm
- Opis: formularz logowania z polami email, password i linkiem do resetowania hasła.
- Elementy:
  - `<form onSubmit={handleSubmit}>`
    - `<Label htmlFor="email">E-mail</Label>`
    - `<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />`
    - `<Label htmlFor="password">Hasło</Label>`
    - `<Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />`
    - `<Link onClick={() => onModeChange('reset')}>Zapomniałeś hasła?</Link>`
    - `<Button type="submit" disabled={loading}>Zaloguj się</Button>`
  - `</form>`
  - `<p>Nie masz konta? <Link onClick={() => onModeChange('register')}>Zarejestruj się</Link></p>`
- Zdarzenia:
  - onSubmit → walidacja → wywołaj onLogin(email, password).
- Walidacja:
  - Email: required, format e-mail.
  - Password: required, minimum 8 znaków.
- Typy:
  - `string` (email, password)
- Props:
  - `onLogin: (email: string, password: string) => void`
  - `onModeChange: (mode: 'register' | 'reset') => void`
  - `loading: boolean`

### RegisterForm
- Opis: formularz rejestracji z polami email, password, confirmPassword.
- Elementy:
  - `<form onSubmit={handleSubmit}>`
    - `<Label htmlFor="email">E-mail</Label>`
    - `<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />`
    - `<Label htmlFor="password">Hasło (min. 8 znaków)</Label>`
    - `<Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />`
    - `<Label htmlFor="confirmPassword">Potwierdź hasło</Label>`
    - `<Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />`
    - `<Button type="submit" disabled={loading}>Zarejestruj się</Button>`
  - `</form>`
  - `<p>Masz już konto? <Link onClick={() => onModeChange('login')}>Zaloguj się</Link></p>`
- Zdarzenia:
  - onSubmit → walidacja (hasła się zgadzają) → wywołaj onRegister(email, password).
- Walidacja:
  - Email: required, format e-mail.
  - Password: required, minimum 8 znaków.
  - ConfirmPassword: required, musi być równe password.
  - Jeśli hasła nie pasują: komunikat "Hasła nie są identyczne".
- Typy:
  - `string` (email, password, confirmPassword)
- Props:
  - `onRegister: (email: string, password: string) => void`
  - `onModeChange: (mode: 'login') => void`
  - `loading: boolean`

### ResetPasswordForm
- Opis: formularz resetowania hasła z polem email.
- Elementy:
  - `<form onSubmit={handleSubmit}>`
    - `<Label htmlFor="email">E-mail</Label>`
    - `<Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />`
    - `<Button type="submit" disabled={loading}>Wyślij link resetujący</Button>`
  - `</form>`
  - `<Link onClick={() => onModeChange('login')}>Wróć do logowania</Link>`
- Zdarzenia:
  - onSubmit → walidacja → wywołaj onResetPassword(email).
- Walidacja:
  - Email: required, format e-mail.
- Typy:
  - `string` (email)
- Props:
  - `onResetPassword: (email: string) => void`
  - `onModeChange: (mode: 'login') => void`
  - `loading: boolean`

### SuccessMessage
- Opis: komunikat sukcesu po rejestracji lub resetowaniu hasła.
- Elementy:
  - `<div role="status" className="success-message">`
    - `<p>{message}</p>`
  - `</div>`
- Przykłady komunikatów:
  - Po rejestracji: "Konto zostało utworzone! Sprawdź swoją skrzynkę e-mail, aby zweryfikować konto."
  - Po resetcie: "Link do resetowania hasła został wysłany na Twój e-mail."
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string` (message)
- Props:
  - `message: string | null`

### LoadingIndicator
- Opis: pokazuje spinner podczas operacji uwierzytelniania.
- Elementy: `<Spinner />`
- Zdarzenia: brak.
- Props: `loading: boolean`

### ErrorMessage
- Opis: region ARIA-live do komunikatów błędów.
- Elementy: `<div role="alert">{error}</div>`
- Zdarzenia: brak.
- Props: `error: string | null`

## 5. Typy

```ts
// Auth mode
type AuthMode = 'login' | 'register' | 'reset';

// Auth form data
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormData {
  email: string;
}

// ViewModel dla widoku auth
interface AuthVM {
  mode: AuthMode;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}
```

## 6. Zarządzanie stanem

W `AuthPage` (React):
```ts
const navigate = useNavigate();
const location = useLocation();
const [searchParams] = useSearchParams();

// Sprawdź, czy użytkownik już jest zalogowany
const [user, setUser] = useState(null);
const { supabase } = useSupabase(); // custom hook do dostępu do supabase client

useEffect(() => {
  // Sprawdź aktualną sesję
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      // Użytkownik już zalogowany, przekieruj
      const redirectTo = searchParams.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
    }
  });
}, []);

// Stan formularzy
const [mode, setMode] = useState<AuthMode>('login');
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

// Logowanie
const handleLogin = async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) throw authError;
    
    // Przekieruj do poprzedniej strony lub home
    const redirectTo = searchParams.get('redirectTo') || '/';
    navigate(redirectTo, { replace: true });
  } catch (e: any) {
    setError(e.message || 'Błąd logowania. Sprawdź swoje dane.');
  } finally {
    setLoading(false);
  }
};

// Rejestracja
const handleRegister = async (email: string, password: string) => {
  setLoading(true);
  setError(null);
  setSuccessMessage(null);
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${window.location.origin}/auth/callback` // opcjonalnie
      }
    });
    
    if (authError) throw authError;
    
    // Sprawdź, czy wymagana jest weryfikacja e-mail
    if (data.user && !data.session) {
      setSuccessMessage('Konto zostało utworzone! Sprawdź swoją skrzynkę e-mail, aby zweryfikować konto.');
    } else {
      // Auto-login po rejestracji (jeśli weryfikacja e-mail jest wyłączona)
      const redirectTo = searchParams.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
    }
  } catch (e: any) {
    setError(e.message || 'Błąd rejestracji. Spróbuj ponownie.');
  } finally {
    setLoading(false);
  }
};

// Reset hasła
const handleResetPassword = async (email: string) => {
  setLoading(true);
  setError(null);
  setSuccessMessage(null);
  try {
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`
    });
    
    if (authError) throw authError;
    
    setSuccessMessage('Link do resetowania hasła został wysłany na Twój e-mail.');
  } catch (e: any) {
    setError(e.message || 'Błąd wysyłania linku. Spróbuj ponownie.');
  } finally {
    setLoading(false);
  }
};

// Zmiana trybu
const handleModeChange = (newMode: AuthMode) => {
  setMode(newMode);
  setError(null);
  setSuccessMessage(null);
};
```

## 7. Integracja API

### Supabase Auth API (przez klienta Supabase)

#### signInWithPassword (logowanie)
- Metoda: `supabase.auth.signInWithPassword({ email, password })`
- Response:
  ```ts
  {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: AuthError | null;
  }
  ```
- Kody błędów:
  - `Invalid login credentials` → nieprawidłowy e-mail lub hasło.
  - `Email not confirmed` → e-mail nie został zweryfikowany.

#### signUp (rejestracja)
- Metoda: `supabase.auth.signUp({ email, password, options })`
- Response:
  ```ts
  {
    data: {
      user: User | null;
      session: Session | null;
    };
    error: AuthError | null;
  }
  ```
- Kody błędów:
  - `User already registered` → użytkownik już istnieje.
  - `Password should be at least 6 characters` → hasło za krótkie.

#### resetPasswordForEmail (reset hasła)
- Metoda: `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- Response:
  ```ts
  {
    data: {};
    error: AuthError | null;
  }
  ```
- Kody błędów:
  - Brak szczególnych błędów, zawsze zwraca sukces (ze względów bezpieczeństwa, nie informuje, czy e-mail istnieje).

#### getSession (sprawdzenie aktualnej sesji)
- Metoda: `supabase.auth.getSession()`
- Response:
  ```ts
  {
    data: {
      session: Session | null;
    };
    error: AuthError | null;
  }
  ```

## 8. Interakcje użytkownika

1. **Wejście na `/login`:**
   - Sprawdzenie, czy użytkownik już jest zalogowany (getSession).
   - Jeśli tak: przekierowanie do `/` lub poprzedniej strony (redirectTo z query params).
   - Jeśli nie: wyświetlenie LoginForm.

2. **Logowanie:**
   - Użytkownik wpisuje e-mail i hasło.
   - Klik "Zaloguj się" → walidacja frontendowa → signInWithPassword.
   - Po sukcesie: przekierowanie do home lub redirectTo.
   - Po błędzie: wyświetlenie komunikatu (np. "Nieprawidłowy e-mail lub hasło").

3. **Rejestracja:**
   - Klik na link "Zarejestruj się" lub tab "Rejestracja" → zmiana mode na 'register'.
   - Użytkownik wpisuje e-mail, hasło, potwierdza hasło.
   - Walidacja: hasła muszą się zgadzać.
   - Klik "Zarejestruj się" → signUp.
   - Po sukcesie:
     - Jeśli wymagana weryfikacja e-mail: wyświetlenie komunikatu "Sprawdź swoją skrzynkę e-mail".
     - Jeśli auto-login: przekierowanie do home.
   - Po błędzie: wyświetlenie komunikatu (np. "Użytkownik już istnieje").

4. **Reset hasła:**
   - Klik na link "Zapomniałeś hasła?" → zmiana mode na 'reset'.
   - Użytkownik wpisuje e-mail.
   - Klik "Wyślij link resetujący" → resetPasswordForEmail.
   - Po sukcesie: wyświetlenie komunikatu "Link został wysłany".
   - Użytkownik otrzymuje e-mail z linkiem do resetowania hasła.
   - Klik w link → przekierowanie do `/reset-password/confirm` z tokenem → formularz ustawienia nowego hasła (do zaimplementowania oddzielnie).

5. **Zmiana trybu:**
   - Przełączanie między login/register/reset przez linki lub taby.
   - Wyczyść error i successMessage przy zmianie trybu.

## 9. Warunki i walidacja

### Walidacja frontendowa:
- **Email:**
  - Required.
  - Format e-mail (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
  - Komunikat: "Podaj prawidłowy adres e-mail".
- **Password (login):**
  - Required.
  - Minimum 6 znaków (zgodnie z domyślną polityką Supabase).
  - Komunikat: "Hasło musi mieć co najmniej 6 znaków".
- **Password (register):**
  - Required.
  - Minimum 8 znaków (zalecana polityka).
  - Komunikat: "Hasło musi mieć co najmniej 8 znaków".
- **ConfirmPassword (register):**
  - Required.
  - Musi być równe password.
  - Komunikat: "Hasła nie są identyczne".

### Walidacja backendowa (Supabase):
- **Email:**
  - Unikalny (przy rejestracji).
  - Komunikat: "Użytkownik o tym adresie e-mail już istnieje".
- **Password:**
  - Minimum 6 znaków (domyślnie w Supabase).
  - Komunikat: "Password should be at least 6 characters".
- **Logowanie:**
  - E-mail i hasło muszą być poprawne.
  - Komunikat: "Invalid login credentials".
- **Weryfikacja e-mail (opcjonalnie):**
  - Jeśli włączona: użytkownik musi potwierdzić e-mail przed logowaniem.
  - Komunikat: "Email not confirmed".

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Nieprawidłowe dane logowania:**
   - Komunikat: "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie."

2. **Użytkownik już istnieje (rejestracja):**
   - Komunikat: "Użytkownik o tym adresie e-mail już istnieje. Zaloguj się."

3. **E-mail nie zweryfikowany:**
   - Komunikat: "Twój e-mail nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową."

4. **Hasła nie pasują (rejestracja):**
   - Komunikat: "Hasła nie są identyczne. Spróbuj ponownie."

5. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."

6. **Błąd serwera (Supabase):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."

7. **Słabe hasło:**
   - Komunikat: "Hasło jest za słabe. Użyj co najmniej 8 znaków, w tym wielkich liter, cyfr i znaków specjalnych." (opcjonalnie rozszerzona walidacja).

### Handling w kodzie:
```ts
try {
  // operacja auth
} catch (error: any) {
  const errorMessage = error.message || 'Wystąpił nieoczekiwany błąd';
  
  if (errorMessage.includes('Invalid login credentials')) {
    setError('Nieprawidłowy e-mail lub hasło');
  } else if (errorMessage.includes('User already registered')) {
    setError('Użytkownik o tym adresie e-mail już istnieje');
  } else if (errorMessage.includes('Email not confirmed')) {
    setError('Twój e-mail nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową');
  } else if (errorMessage.includes('Password should be at least')) {
    setError('Hasło musi mieć co najmniej 6 znaków');
  } else {
    setError(errorMessage);
  }
}
```

## 11. Kroki implementacji

1. Utworzyć `src/pages/login.astro`, osadzić `<AuthPage client:load />`.
2. Opcjonalnie utworzyć `src/pages/register.astro` i `src/pages/reset-password.astro` (lub obsłużyć w jednym komponencie z mode).
3. W `src/components/AuthPage.tsx` zainicjować stan: mode, loading, error, successMessage.
4. Zaimplementować hook `useEffect` do sprawdzenia, czy użytkownik już jest zalogowany (getSession).
5. Jeśli zalogowany: przekieruj do home lub redirectTo z query params.
6. Zaimplementować komponenty potomne:
   - `LoginForm` z polami email, password, linkiem do resetu.
   - `RegisterForm` z polami email, password, confirmPassword.
   - `ResetPasswordForm` z polem email.
   - `SuccessMessage` do wyświetlenia komunikatów sukcesu.
7. Dodać logikę `handleLogin`: signInWithPassword → redirect lub błąd.
8. Dodać logikę `handleRegister`: signUp → komunikat weryfikacji lub redirect.
9. Dodać logikę `handleResetPassword`: resetPasswordForEmail → komunikat sukcesu.
10. Dodać logikę `handleModeChange`: zmiana mode, reset error i successMessage.
11. Dodać walidację frontendową:
    - Email: format regex, required.
    - Password: minimum znaków, required.
    - ConfirmPassword: równość z password.
12. Mapować błędy Supabase na przyjazne komunikaty użytkownika.
13. Stylować komponenty używając Tailwind + shadcn/ui (Form, Input, Button, Alert).
14. Dodać logo/brand aplikacji w nagłówku widoku.
15. Dodać responsywność (formularz wyśrodkowany, max-width na mobile/desktop).
16. Zaimplementować obsługę błędów: walidacja, Supabase errors, sieciowe.
17. Dodać LoadingIndicator i ErrorMessage z ARIA-live.
18. Przetestować wszystkie ścieżki: login, register, reset, błędy, redirectTo, już zalogowany.
19. Upewnić się, że dostępność ARIA jest spełniona (labels, roles, focus management).
20. Opcjonalnie: dodać logowanie przez OAuth (Google, GitHub) używając `supabase.auth.signInWithOAuth`.
21. Dodać logowanie zdarzeń analitycznych: login_success, register_success, reset_password_request.
22. Review code, poprawić lintery, commit.

## Dodatkowe uwagi

### Weryfikacja e-mail
- Jeśli włączona w Supabase: użytkownik otrzymuje e-mail z linkiem weryfikacyjnym.
- Link przekierowuje do `/auth/callback` (Astro API endpoint) → `supabase.auth.exchangeCodeForSession(code)` → redirect do home.
- Utworzyć endpoint: `src/pages/auth/callback.ts` (lub `callback.astro`).

### Reset hasła - formularz potwierdzenia
- Po kliknięciu w link z e-maila użytkownik trafia na `/reset-password/confirm?token=...`.
- Utworzyć widok `src/pages/reset-password/confirm.astro` z formularzem nowego hasła.
- Formularz: pole `newPassword`, `confirmPassword`, przycisk "Resetuj hasło".
- Logika: `supabase.auth.updateUser({ password: newPassword })` → komunikat sukcesu → redirect do login.

### Middleware dla chronionych stron
- W `src/middleware/index.ts` dodać sprawdzenie sesji: jeśli brak sesji i strona wymaga auth → redirect do `/login?redirectTo={currentPath}`.
- Przykład:
  ```ts
  export const onRequest = defineMiddleware(async (context, next) => {
    const { data: { session } } = await context.locals.supabase.auth.getSession();
    
    const protectedPaths = ['/flashcards', '/sessions', '/generate'];
    const isProtected = protectedPaths.some(path => context.url.pathname.startsWith(path));
    
    if (isProtected && !session) {
      return context.redirect(`/login?redirectTo=${encodeURIComponent(context.url.pathname)}`);
    }
    
    return next();
  });
  ```


