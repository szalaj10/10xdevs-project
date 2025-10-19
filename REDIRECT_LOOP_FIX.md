# Naprawa Pętli Przekierowań

## Problem

Po poprzedniej próbie naprawy autoryzacji, aplikacja wpadła w **nieskończoną pętlę przekierowań**:
- `/login` → `/flashcards` → `/login` → `/flashcards` → ...

W logach widoczne było:
```
[302] /login 2ms
[302] /flashcards 1ms  
[302] /login 2ms
[302] /flashcards 0ms
...
```

## Przyczyna

1. **Middleware sprawdzał sesję na serwerze** - Przekierowywał niezalogowanych użytkowników z `/flashcards` → `/login`

2. **Komponent React również sprawdzał sesję** - `AuthPage` przekierowywał zalogowanych użytkowników z `/login` → `/flashcards`

3. **Problem z cookies** - Supabase client nie odczytywał poprawnie sesji z cookies, więc:
   - Middleware myślał, że użytkownik NIE jest zalogowany
   - React (po załadowaniu) widział sesję i myślał, że użytkownik JEST zalogowany
   - To tworzyło nieskończoną pętlę

## Rozwiązanie

### 1. Uproszczono Middleware (`src/middleware/index.ts`)

**PRZED:** Middleware sprawdzał sesję i przekierowywał
```typescript
if (isProtectedRoute) {
  const { data: { session } } = await context.locals.supabase.auth.getSession();
  if (!session) {
    return context.redirect(`/login?redirectTo=...`);
  }
}
```

**PO:** Middleware tylko tworzy klienta Supabase, nie sprawdza autoryzacji
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  
  // Create Supabase client with cookies (for non-API routes)
  const shouldUseCookies = !context.url.pathname.startsWith('/api/');
  context.locals.supabase = createSupabaseClient(
    token, 
    shouldUseCookies ? context.cookies : undefined
  );
  
  // Don't do server-side auth checks - let React components handle redirects
  return next();
});
```

**Dlaczego to działa:**
- ✅ Eliminuje server-side sprawdzanie sesji
- ✅ Pozwala React komponentom zarządzać przekierowaniami client-side
- ✅ Unika konfliktów między SSR a CSR

### 2. Utworzono Hook `useAuthGuard`

**Plik:** `src/lib/hooks/useAuthGuard.ts`

Hook, który chroni strony i zarządza przekierowaniami w React:

```typescript
export function useAuthGuard(redirectOnAuth = false) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      const hasSession = !!session;
      setIsAuthenticated(hasSession);

      if (redirectOnAuth && hasSession) {
        // Redirect authenticated users away from login page
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get('redirectTo') || '/';
        window.location.href = redirectTo;
      } else if (!redirectOnAuth && !hasSession) {
        // Redirect unauthenticated users to login
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
      } else {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [redirectOnAuth]);

  return { isLoading, isAuthenticated };
}
```

**Użycie:**
```typescript
// W chronionych komponentach (Flashcards, Sessions):
export default function FlashcardsListPage() {
  const { isLoading: authLoading } = useAuthGuard();
  
  if (authLoading) {
    return <LoadingScreen />;
  }
  
  // Komponent renderuje się tylko dla zalogowanych użytkowników
  return <div>...</div>;
}

// W komponencie logowania:
export default function AuthPage() {
  const { isLoading } = useAuthGuard(true); // redirectOnAuth = true
  
  // Zalogowani użytkownicy są automatycznie przekierowywani
}
```

### 3. Zaktualizowano `FlashcardsListPage`

Dodano `useAuthGuard()` na początku komponentu:

```typescript
export default function FlashcardsListPage() {
  const { isLoading: authLoading } = useAuthGuard();
  
  // Pokaż loading screen podczas sprawdzania auth
  if (authLoading) {
    return <LoadingScreen />;
  }
  
  // Reszta komponentu...
}
```

### 4. Poprawiono Cookie Handling

Dodano error handling i `httpOnly: false` w `src/db/supabase.client.ts`:

```typescript
setItem: (key: string, value: string) => {
  try {
    cookies.set(key, value, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: false,
      httpOnly: false, // Must be false for client-side access
    });
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}
```

## Strategia Autoryzacji

### Server-Side (Middleware)
- ✅ Tworzy klienta Supabase z dostępem do cookies
- ✅ Nie sprawdza autoryzacji
- ✅ Nie przekierowuje

### Client-Side (React)
- ✅ Sprawdza sesję w `useEffect`
- ✅ Przekierowuje na podstawie stanu autoryzacji
- ✅ Pokazuje loading screen podczas sprawdzania

### API Routes
- ✅ Sprawdzają autoryzację przez `requireAuth(context)`
- ✅ Zwracają 401 dla niezalogowanych użytkowników
- ✅ Komponenty obsługują 401 i przekierowują do `/login`

## Co Teraz Działa

✅ **Brak pętli przekierowań** - Tylko React zarządza przekierowaniami  
✅ **Strona główna (`/`)** - Dostępna dla wszystkich  
✅ **Login (`/login`)** - Przekierowuje zalogowanych użytkowników  
✅ **Flashcards (`/flashcards`)** - Wymaga logowania  
✅ **Sessions (`/sessions`)** - Wymaga logowania  
✅ **Generate (`/generate`)** - Obsługiwane przez komponent React  
✅ **API Routes** - Zwracają 401, komponenty przekierowują  

## Następne Kroki

### Dodaj `useAuthGuard` do innych chronionych komponentów:

1. **SessionStudyPage** - `/sessions/[id]`
2. **SessionSummaryPage** - `/sessions/[id]/summary`
3. **GeneratePage** - `/generate/new`
4. **ReviewCandidatesPage** - `/generate/[id]/review`

### Przykład:

```typescript
import { useAuthGuard } from '../lib/hooks/useAuthGuard';

export default function SessionStudyPage({ sessionId }: Props) {
  const { isLoading: authLoading } = useAuthGuard();
  
  if (authLoading) {
    return <LoadingScreen />;
  }
  
  // Reszta komponentu...
}
```

## Testowanie

1. **Wyloguj się** (w konsoli przeglądarki):
   ```javascript
   const supabase = window.supabase || (await import('/src/lib/hooks/useSupabase.ts')).supabase;
   await supabase.auth.signOut();
   location.reload();
   ```

2. **Spróbuj wejść na `/flashcards`**:
   - Powinno przekierować do `/login?redirectTo=/flashcards`
   - **NIE POWINNO** być pętli przekierowań

3. **Zaloguj się**:
   - Email: `mszalajko@manufacturo.com`
   - Password: `Pracownik123`

4. **Po zalogowaniu**:
   - Powinieneś być przekierowany na `/flashcards`
   - Wszystkie zakładki powinny działać

## Troubleshooting

### Nadal widzę pętlę przekierowań

1. **Wyczyść cookies** (DevTools → Application → Cookies → Clear all)
2. **Hard refresh** (Ctrl+Shift+R lub Cmd+Shift+R)
3. **Zrestartuj serwer deweloperski**

### Komponent nie przekierowuje

1. Sprawdź, czy `useAuthGuard()` jest wywołany na początku komponentu
2. Sprawdź konsolę przeglądarki dla błędów
3. Upewnij się, że `redirectOnAuth` ma właściwą wartość

### API zwraca 401 ale nie ma przekierowania

Dodaj obsługę 401 w wywołaniach fetch:

```typescript
const res = await fetch('/api/flashcards');
if (res.status === 401) {
  window.location.href = '/login?redirectTo=' + window.location.pathname;
  return;
}
```


