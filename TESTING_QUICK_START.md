# Testing Quick Start Guide

Szybki przewodnik po uruchomieniu testów w projekcie 10xDevs Flashcards.

## 🚀 Szybki Start

### 1. Sprawdź instalację

Wszystkie zależności powinny być już zainstalowane. Jeśli nie, uruchom:

```bash
npm install
```

### 2. Uruchom testy jednostkowe

```bash
# Pojedyncze uruchomienie
npm run test

# Tryb watch (automatyczne ponowne uruchamianie)
npm run test:watch

# Tryb UI (wizualny interfejs)
npm run test:ui
```

### 3. Uruchom testy E2E

```bash
# Upewnij się, że serwer dev działa
npm run dev

# W nowym terminalu:
npm run test:e2e

# Lub w trybie UI
npm run test:e2e:ui
```

## 📁 Struktura Testów

```
10xdevs-project/
├── tests/                    # Testy jednostkowe i integracyjne
│   ├── setup.ts             # Konfiguracja globalna
│   ├── unit/                # Testy jednostkowe
│   └── integration/         # Testy integracyjne
├── e2e/                     # Testy E2E
│   ├── fixtures/            # Fixtures (np. auth)
│   ├── pages/               # Page Object Models
│   └── *.spec.ts           # Pliki testowe
├── vitest.config.ts         # Konfiguracja Vitest
└── playwright.config.ts     # Konfiguracja Playwright
```

## 🧪 Dostępne Komendy

### Testy Jednostkowe (Vitest)

| Komenda | Opis |
|---------|------|
| `npm run test` | Uruchom wszystkie testy jednostkowe |
| `npm run test:watch` | Tryb watch - automatyczne ponowne uruchamianie |
| `npm run test:ui` | Wizualny interfejs do przeglądania testów |
| `npm run test:coverage` | Generuj raport pokrycia kodu |

### Testy E2E (Playwright)

| Komenda | Opis |
|---------|------|
| `npm run test:e2e` | Uruchom wszystkie testy E2E |
| `npm run test:e2e:ui` | Tryb UI - interaktywne uruchamianie testów |
| `npm run test:e2e:debug` | Tryb debug - krok po kroku |
| `npm run test:e2e:report` | Pokaż ostatni raport z testów |

## 📝 Pisanie Testów

### Test Jednostkowy (Vitest)

```typescript
// tests/unit/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Test Komponentu React

```typescript
// tests/integration/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Test E2E (Playwright)

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
  await page.goto('/');
  
  await page.getByRole('button', { name: /start/i }).click();
  
  await expect(page).toHaveURL('/next-page');
  await expect(page.getByText('Success')).toBeVisible();
});
```

## 🔧 Konfiguracja

### Zmienne Środowiskowe dla Testów E2E

Skopiuj `env.test.example` do `.env.test` i uzupełnij:

```bash
# .env.test
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=your-anon-key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test123456
BASE_URL=http://localhost:4321
```

### Tworzenie Użytkownika Testowego

```bash
# Uruchom Supabase lokalnie
supabase start

# Utwórz użytkownika testowego (możesz użyć setup-test-user.js)
node setup-test-user.js
```

## 🐛 Debugowanie

### Vitest

```bash
# Tryb UI - wizualne debugowanie
npm run test:ui

# Filtrowanie testów
npm run test -- -t "nazwa testu"

# Uruchom konkretny plik
npm run test -- tests/unit/myFile.test.ts
```

### Playwright

```bash
# Tryb debug - krok po kroku
npm run test:e2e:debug

# Uruchom konkretny plik
npm run test:e2e -- e2e/auth.spec.ts

# Uruchom konkretny test
npm run test:e2e -- -g "should login"

# Pokaż trace viewer
npx playwright show-trace test-results/.../trace.zip
```

## 📊 Pokrycie Kodu

```bash
# Generuj raport pokrycia
npm run test:coverage

# Otwórz raport HTML
# Windows:
start coverage/index.html

# macOS:
open coverage/index.html

# Linux:
xdg-open coverage/index.html
```

Raport pokrycia pokazuje:
- **Lines**: Pokrycie linii kodu
- **Functions**: Pokrycie funkcji
- **Branches**: Pokrycie gałęzi (if/else)
- **Statements**: Pokrycie instrukcji

**Cel**: ≥70% pokrycia dla krytycznych modułów

## 🎯 Best Practices

### Testy Jednostkowe
1. ✅ Testuj jedną rzecz na raz
2. ✅ Używaj opisowych nazw testów
3. ✅ Mockuj zależności zewnętrzne
4. ✅ Testuj przypadki brzegowe
5. ✅ Używaj Arrange-Act-Assert

### Testy E2E
1. ✅ Używaj Page Object Model
2. ✅ Testuj krytyczne ścieżki użytkownika
3. ✅ Używaj semantycznych lokatorów (role, label)
4. ✅ Izoluj testy (każdy test niezależny)
5. ✅ Używaj fixtures dla setupu

## 🚨 Rozwiązywanie Problemów

### Problem: "Module not found"
```bash
# Sprawdź aliasy w vitest.config.ts
# Upewnij się, że ścieżki w tsconfig.json są poprawne
```

### Problem: "Timeout" w testach E2E
```bash
# Zwiększ timeout w teście:
test.setTimeout(60000);

# Lub w konfiguracji playwright.config.ts
```

### Problem: Testy przechodzą lokalnie, ale nie na CI
```bash
# Sprawdź zmienne środowiskowe
# Upewnij się, że dane testowe są deterministyczne
# Sprawdź konfigurację CI w .github/workflows/tests.yml
```

## 📚 Więcej Informacji

- [TESTING_SETUP.md](./TESTING_SETUP.md) - Kompletny przewodnik
- [tests/README.md](./tests/README.md) - Testy jednostkowe
- [e2e/README.md](./e2e/README.md) - Testy E2E
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)

## ✅ Checklist Przed Commitem

- [ ] Wszystkie testy przechodzą: `npm run test`
- [ ] Testy E2E działają: `npm run test:e2e`
- [ ] Linter nie zgłasza błędów: `npm run lint`
- [ ] Kod jest sformatowany: `npm run format`
- [ ] Pokrycie kodu ≥70% dla zmienionych plików

---

**Gotowy do testowania! 🎉**

