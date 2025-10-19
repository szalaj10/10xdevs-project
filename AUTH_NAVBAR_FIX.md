# Naprawa wyświetlania stanu autoryzacji w NavBar

## Problem

Po zalogowaniu użytkownik nie był wyświetlany w NavBar, a przycisk "Wyloguj" nie pojawiał się. Zamiast tego cały czas widoczny był przycisk "Zaloguj się".

## Przyczyna

Problem był spowodowany przez kilka czynników:

1. **Nieprawidłowe kodowanie cookies** - W `useSupabase.ts` wartości cookies były kodowane przez `encodeURIComponent()`, co mogło powodować problemy z odczytem sesji przez Supabase
2. **Brak logowania diagnostycznego** - Nie było wystarczających logów aby zdiagnozować problem
3. **Nadpisywanie stanu serwera** - NavBar w `useEffect` sprawdzał sesję po stronie klienta i mógł nadpisać poprawny stan otrzymany z serwera

## Rozwiązanie

### 1. Poprawka w `src/lib/hooks/useSupabase.ts`

**Zmiana:** Usunięto `encodeURIComponent()` z ustawiania cookies, ponieważ Supabase sam zajmuje się kodowaniem wartości.

```typescript
// PRZED:
let cookie = `${name}=${encodeURIComponent(value)}`;

// PO:
let cookie = `${name}=${value}`;
```

**Dodano:** Szczegółowe logowanie operacji na cookies:
- Logowanie przy pobieraniu cookies (`getAll`)
- Logowanie przy ustawianiu cookies (`setAll`) z informacją o nazwie, długości wartości i `maxAge`

### 2. Poprawa w `src/components/NavBar.tsx`

**Zmiana:** Usunięto stan `loading` który był niepotrzebnie ustawiany na `true` i powodował migotanie UI.

```typescript
// PRZED:
const [loading, setLoading] = useState(!initialAuthenticated);

// PO:
const [loading, setLoading] = useState(false);
```

**Dodano:** Logowanie diagnostyczne w `useEffect`:
- Log przy sprawdzaniu sesji klienta
- Ostrzeżenie gdy stan serwera i klienta się nie zgadzają
- Log przy zmianie stanu autoryzacji

**Zmiana:** Dodano `initialAuthenticated` do dependency array w `useEffect` aby reagować na zmiany stanu początkowego.

```typescript
// PRZED:
}, [supabase]);

// PO:
}, [supabase, initialAuthenticated]);
```

## Przepływ autoryzacji

### Po zalogowaniu:

1. `LoginForm` wywołuje `supabase.auth.signInWithPassword()` po stronie klienta
2. Supabase ustawia cookies w przeglądarce przez `setAll()` w `useSupabase.ts`
3. `LoginForm` wykonuje `window.location.href = redirectTo` (pełne przeładowanie)
4. Middleware (`src/middleware/index.ts`) odczytuje cookies z nagłówka `Cookie`
5. Middleware ustawia `Astro.locals.user` na podstawie sesji
6. Layout (`src/layouts/Layout.astro`) pobiera stan z `Astro.locals.user`
7. Layout przekazuje `initialAuthenticated` i `initialUserEmail` do NavBar
8. NavBar wyświetla stan początkowy z serwera
9. NavBar w `useEffect` weryfikuje stan z klientem Supabase
10. Jeśli stany się zgadzają, UI pozostaje bez zmian

### Przy wylogowaniu:

1. NavBar wywołuje `/api/auth/logout` (server-side)
2. NavBar wywołuje `supabase.auth.signOut()` (client-side)
3. Cookies są usuwane
4. Przekierowanie do `/login` z pełnym przeładowaniem strony

## Testowanie

Aby przetestować naprawę:

1. Uruchom aplikację: `npm run dev`
2. Otwórz konsolę przeglądarki (F12)
3. Zaloguj się na konto testowe
4. Sprawdź logi w konsoli:
   - `[Supabase Client] setAll cookies:` - powinny być ustawione cookies
   - `[NavBar] Client session check:` - powinna być widoczna sesja
   - `[Middleware] Path: /, User: email@example.com` - middleware powinien rozpoznać użytkownika
5. Sprawdź czy w NavBar wyświetla się:
   - Email użytkownika: "Zalogowano: email@example.com"
   - Przycisk "Wyloguj"
6. Kliknij "Wyloguj" i sprawdź czy przekierowuje do `/login`

## Dodatkowe uwagi

- Wszystkie logi diagnostyczne są prefixowane odpowiednimi tagami: `[Supabase Client]`, `[NavBar]`, `[Middleware]`
- W produkcji można rozważyć usunięcie lub ograniczenie logowania
- Cookies są ustawiane z `SameSite=lax` i `Path=/` aby były dostępne w całej aplikacji
- W produkcji (HTTPS) cookies mają flagę `Secure`

