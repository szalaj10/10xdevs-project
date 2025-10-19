# E2E Testing with Playwright

Kompleksowe testy E2E dla aplikacji Fiszki AI wykorzystujące Playwright i wzorzec Page Object Model.

## 📋 Spis treści

- [Wymagania](#wymagania)
- [Konfiguracja](#konfiguracja)
- [Uruchamianie testów](#uruchamianie-testów)
- [Struktura testów](#struktura-testów)
- [Page Object Models](#page-object-models)
- [Selektory data-testid](#selektory-data-testid)
- [Najlepsze praktyki](#najlepsze-praktyki)

## Wymagania

- Node.js 18+
- Playwright (zainstalowany automatycznie przez npm)
- Działająca aplikacja na `http://localhost:4321`
- Użytkownik testowy w bazie danych

## Konfiguracja

### 1. Zainstaluj zależności

```bash
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

Skopiuj `.env.test.example` do `.env.test` i uzupełnij danymi:

```bash
cp env.test.example .env.test
```

Edytuj `.env.test`:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=twój-klucz-anon

# Test User Credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test123456

# Base URL
BASE_URL=http://localhost:4321
```

### 3. Utwórz użytkownika testowego

Upewnij się, że użytkownik testowy istnieje w bazie danych. Możesz użyć skryptu:

```bash
node setup-test-user.js
```

### 4. Zainstaluj przeglądarki Playwright

```bash
npx playwright install chromium
```

## Uruchamianie testów

### Uruchom wszystkie testy

```bash
npm run test:e2e
```

### Uruchom testy w trybie UI (interaktywnym)

```bash
npm run test:e2e:ui
```

### Uruchom testy w trybie debug

```bash
npm run test:e2e:debug
```

### Uruchom konkretny plik testów

```bash
npx playwright test e2e/auth.spec.ts
```

### Uruchom konkretny test

```bash
npx playwright test -g "should display login form"
```

### Zobacz raport z testów

```bash
npm run test:e2e:report
```

## Struktura testów

```
e2e/
├── fixtures/
│   └── auth.fixture.ts          # Fixture z Page Objects i autentykacją
├── pages/
│   ├── LoginPage.ts             # POM dla strony logowania
│   ├── SignupPage.ts            # POM dla strony rejestracji
│   ├── HomePage.ts              # POM dla strony głównej
│   ├── GeneratePage.ts          # POM dla generowania fiszek
│   ├── FlashcardsPage.ts        # POM dla listy fiszek
│   ├── SessionsPage.ts          # POM dla sesji nauki
│   └── NavBarPage.ts            # POM dla nawigacji
├── auth.spec.ts                 # Testy autentykacji
├── generate-flashcards.spec.ts  # Testy generowania i zarządzania fiszkami
├── study-sessions.spec.ts       # Testy sesji nauki
└── navigation-protection.spec.ts # Testy nawigacji i ochrony tras
```

## Page Object Models

Wszystkie testy wykorzystują wzorzec Page Object Model dla lepszej maintainability:

### Przykład użycia

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('should login successfully', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  
  await expect(page).toHaveURL('/');
});
```

### Dostępne Page Objects

- **LoginPage** - logowanie użytkownika
- **SignupPage** - rejestracja nowego użytkownika
- **HomePage** - strona główna z statystykami
- **GeneratePage** - generowanie fiszek AI
- **FlashcardsPage** - lista i zarządzanie fiszkami
- **SessionsPage** - sesje nauki i system powtórek
- **NavBarPage** - nawigacja w aplikacji

## Selektory data-testid

Wszystkie komponenty mają dodane selektory `data-testid` dla stabilnych testów:

### Przykłady

```typescript
// LoginForm
page.getByTestId('login-email-input')
page.getByTestId('login-password-input')
page.getByTestId('login-submit-button')
page.getByTestId('login-error')

// GeneratePage
page.getByTestId('generate-topic-input')
page.getByTestId('generate-submit-button')
page.getByTestId('generate-candidate-card')
page.getByTestId('generate-save-all-button')

// SessionsPage
page.getByTestId('session-start-button')
page.getByTestId('session-reveal-button')
page.getByTestId('session-rate-hard')
page.getByTestId('session-rate-normal')
page.getByTestId('session-rate-easy')

// NavBar
page.getByTestId('navbar-logo')
page.getByTestId('navbar-logout-button')
page.getByTestId('navbar-link--flashcards')
```

## Najlepsze praktyki

### 1. Używaj Page Object Models

✅ **Dobrze:**
```typescript
await loginPage.login(email, password);
```

❌ **Źle:**
```typescript
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type="submit"]');
```

### 2. Używaj data-testid zamiast selektorów CSS

✅ **Dobrze:**
```typescript
page.getByTestId('login-submit-button')
```

❌ **Źle:**
```typescript
page.locator('button.submit-btn')
```

### 3. Czekaj na elementy zamiast używać timeoutów

✅ **Dobrze:**
```typescript
await expect(page.getByTestId('flashcard-item')).toBeVisible();
```

❌ **Źle:**
```typescript
await page.waitForTimeout(5000);
```

### 4. Używaj fixtures dla wspólnego setup

✅ **Dobrze:**
```typescript
test('test name', async ({ authenticatedPage, flashcardsPage }) => {
  // Użytkownik już zalogowany
  await flashcardsPage.goto();
});
```

### 5. Grupuj testy logicznie

```typescript
test.describe('Feature Name', () => {
  test.describe('Specific Scenario', () => {
    test('should do something', async () => {
      // test
    });
  });
});
```

### 6. Używaj znaczących nazw testów

✅ **Dobrze:**
```typescript
test('should show error message when password is too short', async () => {
```

❌ **Źle:**
```typescript
test('test 1', async () => {
```

## Debugowanie testów

### 1. Tryb headed (z widoczną przeglądarką)

```bash
npx playwright test --headed
```

### 2. Tryb debug

```bash
npx playwright test --debug
```

### 3. Playwright Inspector

```bash
npx playwright test --debug
```

### 4. Trace Viewer

Po uruchomieniu testów z `--trace on`:

```bash
npx playwright show-trace trace.zip
```

## Continuous Integration

Testy są skonfigurowane do działania w CI:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Troubleshooting

### Problem: Testy nie mogą się połączyć z aplikacją

**Rozwiązanie:** Upewnij się, że aplikacja działa na `http://localhost:4321`

```bash
npm run dev
```

### Problem: Użytkownik testowy nie istnieje

**Rozwiązanie:** Utwórz użytkownika testowego:

```bash
node setup-test-user.js
```

### Problem: Testy timeout

**Rozwiązanie:** Zwiększ timeout w `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 sekund
}
```

### Problem: Testy działają lokalnie, ale nie w CI

**Rozwiązanie:** Sprawdź zmienne środowiskowe i upewnij się, że baza danych jest dostępna.

## Dodatkowe zasoby

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
