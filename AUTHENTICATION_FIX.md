# Naprawa Autoryzacji - Problem z Przekierowaniem do Strony Głównej

## Problem

Klikając w dowolny przycisk lub zakładkę (oprócz "Generuj"), użytkownik był przekierowywany na stronę główną z błędem 401 (Unauthorized). Działa tylko zakładka "Generuj".

## Przyczyna

1. **Brak obsługi cookies w middleware** - Middleware tworzył klienta Supabase bez dostępu do cookies, więc nie mógł odczytać sesji użytkownika przechowywanej w cookies przeglądarki.

2. **Brak sprawdzania sesji** - Middleware nie sprawdzał sesji dla chronionych tras, więc każda strona próbowała działać bez uwierzytelnienia.

3. **Nieprawidłowa konfiguracja klienta Supabase** - Klient był tworzony bez mechanizmu odczytu/zapisu cookies, co uniemożliwiało zarządzanie sesją.

## Rozwiązanie

### 1. Zaktualizowano `src/db/supabase.client.ts`

Dodano obsługę cookies do funkcji `createSupabaseClient`:

```typescript
export function createSupabaseClient(
  accessToken?: string,
  cookies?: AstroCookies  // NOWE: Obsługa cookies
): SupabaseClient<Database> {
  const options: any = {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,  // Utrzymuj sesję w cookies
    },
  };

  // Konfiguracja storage dla cookies (SSR)
  if (cookies) {
    options.auth.storage = {
      getItem: (key: string) => cookies.get(key)?.value ?? null,
      setItem: (key: string, value: string) => {
        cookies.set(key, value, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365, // 1 rok
          sameSite: 'lax',
          secure: false, // true w produkcji z HTTPS
        });
      },
      removeItem: (key: string) => cookies.delete(key, { path: '/' }),
    };
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, options);
}
```

### 2. Zaktualizowano `src/middleware/index.ts`

Dodano:
- Przekazywanie cookies do klienta Supabase
- Sprawdzanie sesji dla chronionych tras
- Przekierowanie do `/login` gdy brak sesji

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  
  // Tworzenie klienta z obsługą cookies
  context.locals.supabase = createSupabaseClient(token, context.cookies);
  
  // Definicja chronionych tras
  const protectedPaths = ['/flashcards', '/sessions', '/generate'];
  const isProtectedRoute = protectedPaths.some(path => 
    context.url.pathname.startsWith(path)
  );
  
  // Pomijanie sprawdzania dla login i API
  if (context.url.pathname === '/login' || context.url.pathname.startsWith('/api/')) {
    return next();
  }
  
  // Sprawdzanie sesji dla chronionych tras
  if (isProtectedRoute) {
    const { data: { session } } = await context.locals.supabase.auth.getSession();
    
    if (!session) {
      // Przekierowanie do logowania z URL powrotu
      return context.redirect(`/login?redirectTo=${encodeURIComponent(context.url.pathname)}`);
    }
  }
  
  return next();
});
```

## Co teraz działa

✅ **Cookies są zarządzane przez Supabase** - Sesja jest przechowywana i odczytywana z cookies przeglądarki

✅ **Middleware sprawdza autoryzację** - Chroni trasy `/flashcards`, `/sessions`, `/generate`

✅ **Automatyczne przekierowania** - Niezalogowani użytkownicy są przekierowywani do `/login` z zachowaniem URL powrotu

✅ **Zachowanie sesji** - Po zalogowaniu sesja jest utrzymywana między odświeżeniami strony

✅ **API routes działają** - Endpointy API nadal mogą używać Bearer tokens

## Jak to testować

1. **Wyloguj się** (jeśli jesteś zalogowany):
   ```javascript
   // W konsoli przeglądarki:
   const { supabase } = await import('./src/lib/hooks/useSupabase.ts');
   await supabase.auth.signOut();
   ```

2. **Spróbuj wejść na chronioną stronę** (np. `/flashcards`):
   - Powinno przekierować do `/login?redirectTo=/flashcards`

3. **Zaloguj się**:
   - Email: `mszalajko@manufacturo.com`
   - Password: `Pracownik123`

4. **Po zalogowaniu**:
   - Zostaniesz przekierowany na `/flashcards` (lub inną stronę, którą próbowałeś odwiedzić)
   - Wszystkie zakładki powinny działać poprawnie
   - Sesja powinna być utrzymana po odświeżeniu strony

## Chronione trasy

Następujące trasy wymagają autoryzacji:
- `/flashcards` - Lista fiszek
- `/flashcards/*` - Szczegóły fiszek
- `/sessions` - Sesje nauki
- `/sessions/*` - Szczegóły sesji
- `/generate` - Generowanie fiszek
- `/generate/*` - Przegląd wygenerowanych fiszek

## Niechronione trasy

Następujące trasy są dostępne bez logowania:
- `/` - Strona główna
- `/login` - Strona logowania
- `/api/*` - Endpointy API (używają Bearer tokens)

## Dalsze kroki

Po restarcie serwera deweloperskiego, wszystkie funkcje powinny działać poprawnie:

```bash
# Zatrzymaj serwer (Ctrl+C)
# Uruchom ponownie:
npm run dev
```

## Troubleshooting

### Problem: Nadal przekierowuje do strony głównej

**Rozwiązanie:**
1. Wyczyść cookies przeglądarki dla `localhost:3000`
2. Zrestartuj serwer deweloperski
3. Zaloguj się ponownie

### Problem: Sesja nie jest zachowywana po odświeżeniu

**Rozwiązanie:**
1. Sprawdź, czy cookies są ustawiane (DevTools → Application → Cookies)
2. Upewnij się, że nie masz rozszerzeń blokujących cookies
3. Sprawdź konsolę przeglądarki dla błędów

### Problem: API zwraca 401

**Rozwiązanie:**
- API routes używają Bearer tokens, nie cookies
- Upewnij się, że przekazujesz nagłówek `Authorization: Bearer <token>`
- Token możesz uzyskać z `getAccessToken()` w `src/lib/auth.ts`


