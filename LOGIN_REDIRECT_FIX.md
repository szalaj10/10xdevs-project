# Naprawa Problemu z Logowaniem - Ciągły Redirect do `/login`

## Problem

Po próbie zalogowania:
1. Użytkownik był przekierowywany z powrotem do strony logowania
2. Zakładki nawigacyjne (Fiszki, Nauka, Generuj) nie były widoczne
3. Próba wejścia na chronione strony kończyła się przekierowaniem do `/login`

## Przyczyna

Ktoś zmienił logowanie z **klienta przeglądarki** na **API endpoint** (`/api/auth/login`). To spowodowało problem z synchronizacją sesji:

### Co się działo:
```
1. Użytkownik wypełnia formularz logowania
2. LoginForm wywołuje POST /api/auth/login
3. API endpoint loguje użytkownika przez locals.supabase (serwer)
4. Supabase ustawia sesję po stronie serwera (teoretycznie)
5. ❌ Ciasteczka NIE są synchronizowane z przeglądarką
6. Przeglądarka przekierowuje użytkownika
7. NavBar sprawdza sesję przez supabase.auth.getSession() (klient)
8. ❌ Klient NIE widzi sesji (brak ciasteczek)
9. ❌ Zakładki nie są wyświetlane
10. Middleware sprawdza sesję przy próbie wejścia na /flashcards
11. ❌ Middleware NIE widzi sesji
12. ❌ Przekierowanie do /login
```

### Dlaczego wcześniej działało?

Wcześniej logowanie odbywało się **bezpośrednio przez klienta przeglądarki** (`createBrowserClient`), który:
- ✅ Automatycznie ustawiał ciasteczka w przeglądarce
- ✅ Synchronizował sesję między localStorage a cookies
- ✅ Middleware mógł odczytać sesję z cookies
- ✅ NavBar widział sesję i wyświetlał zakładki

## Rozwiązanie

Przywrócono logowanie po stronie klienta, jak było wcześniej (zgodnie z `COOKIE_SYNC_FIX.md`).

### Zmodyfikowane pliki:

#### 1. `src/components/LoginForm.tsx`
```typescript
// PRZED (nie działało):
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

// PO (działa):
const { supabase } = useSupabase();
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

#### 2. `src/components/SignupForm.tsx`
```typescript
// PRZED (nie działało):
const response = await fetch("/api/auth/signup", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

// PO (działa):
const { supabase } = useSupabase();
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/login`,
  },
});
```

## Jak to działa teraz

### Flow logowania:
```
1. Użytkownik wypełnia formularz logowania
2. LoginForm wywołuje supabase.auth.signInWithPassword() (klient)
3. createBrowserClient ustawia ciasteczka w przeglądarce
4. ✅ Sesja jest zapisana w cookies + localStorage
5. Przeglądarka przekierowuje użytkownika
6. NavBar sprawdza sesję przez supabase.auth.getSession()
7. ✅ Klient widzi sesję (ciasteczka są ustawione)
8. ✅ Zakładki są wyświetlane
9. Middleware sprawdza sesję przy próbie wejścia na /flashcards
10. ✅ Middleware widzi sesję (odczytuje z cookies)
11. ✅ Dostęp do strony
```

### Diagram:
```
┌─────────────────┐
│  LoginForm      │
│  (Browser)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ @supabase/ssr           │
│ createBrowserClient()   │
│ signInWithPassword()    │
│                         │
│ ✅ Ustawia cookies      │
│ ✅ Ustawia localStorage │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ NavBar sprawdza sesję   │
│ ✅ Widzi sesję          │
│ ✅ Wyświetla zakładki   │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User klika "Fiszki"     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Middleware              │
│ ✅ Odczytuje cookies    │
│ ✅ Widzi sesję          │
│ ✅ Przepuszcza request  │
└─────────────────────────┘
```

## Kluczowe różnice

| Aspekt | API Endpoint (nie działa) | Client Browser (działa) |
|--------|---------------------------|-------------------------|
| **Gdzie logowanie** | Serwer (`/api/auth/login`) | Klient (`createBrowserClient`) |
| **Ustawienie cookies** | ❌ Tylko po stronie serwera | ✅ W przeglądarce |
| **Synchronizacja** | ❌ Brak | ✅ Automatyczna |
| **NavBar widzi sesję** | ❌ Nie | ✅ Tak |
| **Middleware widzi sesję** | ❌ Nie | ✅ Tak |
| **Zakładki widoczne** | ❌ Nie | ✅ Tak |

## Dlaczego API endpoint nie działa?

Problem polega na tym, że:
1. `locals.supabase` (serwer) wywołuje `signInWithPassword()`
2. Supabase SSR **powinien** wywołać callback `setAll()` do ustawienia ciasteczek
3. Astro **powinien** automatycznie dodać te ciasteczka do odpowiedzi HTTP
4. Ale w praktyce **ciasteczka nie są propagowane do przeglądarki**

Możliwe przyczyny:
- Supabase SSR 0.7.0 może mieć bug z ustawianiem ciasteczek w API routes
- Astro może nie propagować ciasteczek ustawionych przez `context.cookies.set()` w niektórych przypadkach
- Timing issue - ciasteczka są ustawiane po zwróceniu odpowiedzi

## Wnioski

**NIE ZMIENIAJ logowania z powrotem na API endpoint!**

Logowanie **MUSI** odbywać się po stronie klienta (`createBrowserClient`), aby:
- ✅ Ciasteczka były poprawnie ustawiane w przeglądarce
- ✅ Sesja była synchronizowana między localStorage a cookies
- ✅ NavBar i middleware widziały sesję
- ✅ Zakładki były widoczne
- ✅ Chronione strony były dostępne

## Pliki zmodyfikowane

1. **src/components/LoginForm.tsx** - Przywrócono logowanie przez `supabase.auth.signInWithPassword()`
2. **src/components/SignupForm.tsx** - Przywrócono rejestrację przez `supabase.auth.signUp()`

## Testowanie

1. Zaloguj się na `/login`
2. ✅ Powinny być widoczne zakładki: Strona główna, Fiszki, Nauka, Generuj
3. ✅ Kliknięcie na "Fiszki" powinno pokazać listę fiszek (nie przekierowanie do `/login`)
4. ✅ Kliknięcie na "Nauka" powinno pokazać sesje nauki
5. ✅ Kliknięcie na "Generuj" powinno pokazać formularz generowania

## Status

✅ **Problem rozwiązany** - Logowanie działa poprawnie
✅ **Zakładki widoczne** - NavBar wyświetla wszystkie zakładki
✅ **Chronione strony dostępne** - Brak przekierowań do `/login`
✅ **Sesja utrzymywana** - Po odświeżeniu strony użytkownik nadal jest zalogowany

