# Naprawa Synchronizacji Cookies - Problem z Autoryzacją w Zakładkach

## Problem

Po kliknięciu w zakładki nawigacyjne (Fiszki, Nauka, Generuj) użytkownik otrzymywał błąd **401 Unauthorized**:

```
API Error: Error: Unauthorized
    at requireAuth (src/lib/apiHelpers.ts:15:11)
    at async Module.GET (src/pages/api/flashcards/index.ts:12:20)
```

### Przyczyna

**Brak synchronizacji między localStorage a cookies:**

1. **Logowanie** - Gdy użytkownik logował się przez `AuthPage`, klient Supabase (`@supabase/supabase-js`) zapisywał sesję **tylko w localStorage**
2. **API Calls** - Gdy React komponenty wywoływały API endpoints, middleware próbował odczytać sesję z **cookies** (używając `@supabase/ssr`)
3. **Rezultat** - Cookies były puste, więc middleware nie widział sesji i zwracał 401 Unauthorized

### Diagram Problemu

```
┌─────────────────┐
│  AuthPage       │
│  (Login)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ @supabase/supabase-js   │
│ createClient()          │
│                         │
│ ✅ Zapisuje w localStorage
│ ❌ NIE zapisuje w cookies
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User klika zakładkę     │
│ → API Call              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Middleware              │
│ @supabase/ssr           │
│ createServerClient()    │
│                         │
│ ❌ Szuka w cookies
│ ❌ Cookies puste
│ ❌ Zwraca 401
└─────────────────────────┘
```

## Rozwiązanie

Zastąpienie `@supabase/supabase-js` przez `@supabase/ssr` z `createBrowserClient` po stronie klienta, który **automatycznie synchronizuje sesję między localStorage a cookies**.

### 1. Zaktualizowano `src/lib/hooks/useSupabase.ts`

**PRZED:**
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
```

**PO:**
```typescript
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return document.cookie.split("; ").map((cookie) => {
        const [name, ...rest] = cookie.split("=");
        return { name, value: rest.join("=") };
      });
    },
    setAll(cookies) {
      cookies.forEach(({ name, value, options }) => {
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`;
        }
        if (options?.path) {
          cookie += `; path=${options.path}`;
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`;
        }
        if (options?.secure) {
          cookie += "; secure";
        }
        document.cookie = cookie;
      });
    },
  },
});
```

### 2. Zaktualizowano `src/lib/auth.ts`

Zastosowano tę samą zmianę w funkcji `createBrowserSupabaseClient()`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { /* ... */ },
      setAll(cookies) { /* ... */ },
    },
  });
}
```

## Jak To Działa Teraz

### Diagram Rozwiązania

```
┌─────────────────┐
│  AuthPage       │
│  (Login)        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ @supabase/ssr           │
│ createBrowserClient()   │
│                         │
│ ✅ Zapisuje w localStorage
│ ✅ Zapisuje w cookies
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ User klika zakładkę     │
│ → API Call              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Middleware              │
│ @supabase/ssr           │
│ createServerClient()    │
│                         │
│ ✅ Odczytuje z cookies
│ ✅ Znajduje sesję
│ ✅ Zwraca 200 OK
└─────────────────────────┘
```

### Flow Autoryzacji

1. **Logowanie:**
   - Użytkownik wpisuje email i hasło
   - `createBrowserClient` wywołuje `supabase.auth.signInWithPassword()`
   - Sesja jest zapisywana **zarówno** w localStorage **jak i** w cookies
   - Redirect do strony głównej

2. **Nawigacja:**
   - Użytkownik klika zakładkę (np. "Fiszki")
   - React komponent ładuje się i wywołuje API endpoint (np. `/api/flashcards`)

3. **API Request:**
   - Browser automatycznie wysyła cookies z requestem
   - Middleware odczytuje sesję z cookies przez `createServerClient`
   - `requireAuth()` znajduje użytkownika i zwraca `userId`
   - Endpoint zwraca dane

## Kluczowe Różnice

### `@supabase/supabase-js` vs `@supabase/ssr`

| Aspekt | `@supabase/supabase-js` | `@supabase/ssr` |
|--------|------------------------|-----------------|
| **Storage** | Tylko localStorage | localStorage + Cookies |
| **SSR Support** | ❌ Nie | ✅ Tak |
| **Cookie Sync** | ❌ Nie | ✅ Automatyczna |
| **Middleware** | ❌ Nie działa | ✅ Działa |
| **API Calls** | ❌ Wymaga Bearer token | ✅ Automatyczne cookies |

### Cookie Methods

`createBrowserClient` używa **nowego API** z `getAll/setAll`:

```typescript
interface CookieMethodsBrowser {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => void;
}
```

**NIE** starego API z `get/set/remove`:

```typescript
// ❌ STARE API - nie działa z createBrowserClient
interface CookieMethodsBrowserDeprecated {
  get: (name: string) => string | null;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
}
```

## Testowanie

### Przed Naprawą ❌

1. Zaloguj się
2. Kliknij "Fiszki" → **401 Unauthorized**
3. Kliknij "Nauka" → **401 Unauthorized**
4. Kliknij "Generuj" → **401 Unauthorized**

### Po Naprawie ✅

1. Zaloguj się
2. Kliknij "Fiszki" → ✅ Lista fiszek
3. Kliknij "Nauka" → ✅ Sesja nauki
4. Kliknij "Generuj" → ✅ Formularz generowania

### Weryfikacja Cookies

Otwórz DevTools → Application → Cookies:

**Przed naprawą:**
```
(puste lub tylko localStorage)
```

**Po naprawie:**
```
sb-<project-id>-auth-token
sb-<project-id>-auth-token.0
sb-<project-id>-auth-token.1
...
```

## Pliki Zmodyfikowane

1. **src/lib/hooks/useSupabase.ts**
   - Zmieniono `createClient` → `createBrowserClient`
   - Dodano obsługę cookies przez `getAll/setAll`

2. **src/lib/auth.ts**
   - Zmieniono `createClient` → `createBrowserClient`
   - Dodano obsługę cookies przez `getAll/setAll`

## Dodatkowe Korzyści

1. **Bezpieczeństwo** - Cookies mogą być HttpOnly (w produkcji)
2. **SSR** - Pełna kompatybilność z Server-Side Rendering
3. **Automatyzacja** - Nie trzeba ręcznie zarządzać tokenami
4. **Spójność** - Jedna biblioteka (`@supabase/ssr`) dla klienta i serwera

## Uwagi Techniczne

### Cookie Options w Produkcji

W produkcji należy ustawić `secure: true` w `cookieOptions`:

```typescript
// src/db/supabase.client.ts
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,  // ✅ W produkcji z HTTPS
  httpOnly: true,
  sameSite: "lax",
};
```

### Kompatybilność Wsteczna

`@supabase/ssr` jest w pełni kompatybilny z `@supabase/supabase-js` - wszystkie metody auth działają tak samo:

```typescript
// ✅ Wszystkie te metody działają identycznie
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
await supabase.auth.getSession();
await supabase.auth.getUser();
```

## Podsumowanie

✅ **Problem rozwiązany** - Zakładki nawigacyjne działają poprawnie
✅ **Sesja synchronizowana** - localStorage + Cookies
✅ **API endpoints autoryzowane** - Middleware odczytuje sesję z cookies
✅ **Build działa** - Wszystkie komponenty kompilują się poprawnie
✅ **Zgodność z SSR** - Pełna obsługa Server-Side Rendering

Aplikacja jest teraz gotowa do użycia! 🎉

