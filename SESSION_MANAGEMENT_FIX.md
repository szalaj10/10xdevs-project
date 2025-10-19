# Naprawa Zarządzania Sesją w Testach E2E

## Problem

4 testy E2E nie przechodziły z powodu problemów z zarządzaniem sesją:

1. **Breadcrumb Navigation** - sesja wygasała podczas nawigacji między stronami
2. **Mobile Navigation - open menu** - problem z widocznością przycisku wyloguj w menu mobilnym
3. **Back Button Navigation** - sesja wygasała przy użyciu przycisku wstecz
4. **Forward Button Navigation** - sesja wygasała przy użyciu przycisku do przodu

### Przyczyna

Główne przyczyny problemów:

1. **Race conditions przy równoległym wykonywaniu testów** - Playwright wykonywał testy równolegle (10 workerów), co powodowało konflikty w zarządzaniu cookies sesji Supabase
2. **Zbyt krótkie czasy oczekiwania** - Sesja nie była w pełni ustanawiana przed kolejnymi nawigacjami
3. **Brak cache control headers** - Strony były cachowane bez odpowiednich nagłówków, co powodowało problemy z odświeżaniem sesji
4. **Brak data-testid w menu mobilnym** - Przycisk wyloguj w menu mobilnym nie miał atrybutu testowego

## Rozwiązanie

### 1. Zaktualizowano `src/db/supabase.client.ts`

Dodano `maxAge` do opcji cookies, aby zapewnić ich trwałość:

```typescript
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: false,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 dni - zapewnia trwałość cookies
};
```

### 2. Zaktualizowano `src/middleware/index.ts`

Dodano cache control headers dla chronionych stron, aby zapobiec cachowaniu stron z nieaktualnymi sesjami:

```typescript
// Dla chronionych tras, dodaj nagłówki cache control
const response = await next();

if (isProtectedPath(url.pathname) && user) {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

return response;
```

### 3. Zaktualizowano `src/components/NavBar.tsx`

Dodano `data-testid` do przycisku wyloguj w menu mobilnym:

```typescript
<button
  onClick={handleLogout}
  className="..."
  data-testid="navbar-mobile-logout-button"  // NOWE
>
  Wyloguj
</button>
```

### 4. Zaktualizowano `e2e/fixtures/auth.fixture.ts`

Zwiększono czasy oczekiwania i dodano logowanie szczegółów cookies:

```typescript
// Zwiększono czas oczekiwania na przetworzenie logowania
await page.waitForTimeout(3000);

// Dodano logowanie szczegółów cookies dla debugowania
supabaseCookies.forEach(cookie => {
  console.log(`[Auth Fixture] Cookie: ${cookie.name}, expires: ${cookie.expires}, sameSite: ${cookie.sameSite}`);
});

// Dodatkowy czas na pełne utrwalenie cookies
await page.waitForTimeout(1000);
```

### 5. Zaktualizowano `e2e/navigation-protection.spec.ts`

Zwiększono czasy oczekiwania w testach, szczególnie dla nawigacji wstecz/do przodu:

```typescript
// Breadcrumb Navigation
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Zwiększono z 500ms

// Back/Forward Navigation
await page.goBack();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500); // Dodatkowy czas dla nawigacji przeglądarki
```

### 6. Zaktualizowano `playwright.config.ts`

Ograniczono równoległość wykonywania testów, aby uniknąć race conditions:

```typescript
// Wyłączono pełną równoległość
fullyParallel: false,

// Ograniczono liczbę workerów
workers: process.env.CI ? 1 : 3, // Zmniejszono z 10 do 3
```

### 7. Zaktualizowano `playwright.config.ts` - zmienne środowiskowe

Dodano przekazywanie zmiennych środowiskowych GROQ do serwera deweloperskiego:

```typescript
env: {
  PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || '',
  PUBLIC_SUPABASE_KEY: process.env.SUPABASE_PUBLIC_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || '',
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || '',
},
```

## Wyniki

### Przed naprawą ❌

```
4 failed
  [chromium] › navigation-protection.spec.ts:181 › Breadcrumb Navigation
  [chromium] › navigation-protection.spec.ts:245 › Mobile Navigation - open menu
  [chromium] › navigation-protection.spec.ts:264 › Back Button Navigation
  [chromium] › navigation-protection.spec.ts:278 › Forward Button Navigation
22 passed
```

### Po naprawie ✅

```
26 passed (3.3m)
```

Wszystkie testy przechodzą pomyślnie!

## Kluczowe Wnioski

1. **Równoległość testów** - Testy używające autentykacji powinny być wykonywane z ograniczoną równoległością, aby uniknąć konfliktów w zarządzaniu cookies
2. **Czasy oczekiwania** - Nawigacja przeglądarki (back/forward) wymaga dłuższych czasów oczekiwania niż zwykła nawigacja
3. **Cache control** - Strony chronione powinny mieć odpowiednie nagłówki cache control, aby zapobiec problemom z nieaktualnymi sesjami
4. **Cookies persistence** - Ustawienie `maxAge` w opcjach cookies zapewnia ich trwałość między nawigacjami

## Pliki Zmodyfikowane

1. `src/db/supabase.client.ts` - Dodano maxAge do cookies
2. `src/middleware/index.ts` - Dodano cache control headers
3. `src/components/NavBar.tsx` - Dodano data-testid do przycisku wyloguj w menu mobilnym
4. `e2e/fixtures/auth.fixture.ts` - Zwiększono czasy oczekiwania i dodano logowanie cookies
5. `e2e/navigation-protection.spec.ts` - Zwiększono czasy oczekiwania w testach
6. `playwright.config.ts` - Ograniczono równoległość i dodano zmienne środowiskowe

## Testowanie

Aby uruchomić testy:

```bash
# Wszystkie testy nawigacji
npx playwright test navigation-protection

# Z pojedynczym workerem (najstabilniejsze)
npx playwright test navigation-protection --workers=1

# W trybie debug
npx playwright test navigation-protection --debug
```

## Data naprawy

19 października 2025

