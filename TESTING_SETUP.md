# Testing Setup Guide

This document provides comprehensive information about the testing environment for the 10xDevs Flashcards project.

## Table of Contents

1. [Overview](#overview)
2. [Unit & Integration Tests (Vitest)](#unit--integration-tests-vitest)
3. [E2E Tests (Playwright)](#e2e-tests-playwright)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

---

## Overview

The project uses two testing frameworks:

- **Vitest** - Fast, modern test runner for unit and integration tests
- **Playwright** - Reliable E2E testing framework for browser automation

### Tech Stack

- Vitest 3.x
- @testing-library/react 16.x
- @testing-library/user-event 14.x
- @testing-library/jest-dom 6.x
- jsdom 27.x
- Playwright 1.x

---

## Unit & Integration Tests (Vitest)

### Configuration

Configuration is located in `vitest.config.ts`:

- **Environment**: jsdom (for DOM testing)
- **Setup file**: `tests/setup.ts` (global mocks and configurations)
- **Coverage**: v8 provider with 70% threshold
- **Globals**: Enabled for convenient test writing

### Directory Structure

```
tests/
├── setup.ts              # Global test setup
├── unit/                 # Unit tests
│   └── formatters.test.ts
└── integration/          # Integration tests
    └── auth.test.ts
```

### Key Features

1. **Global Mocks**: Pre-configured mocks for:
   - window.matchMedia
   - IntersectionObserver
   - ResizeObserver
   - Supabase environment variables

2. **Path Aliases**: Configured to match project structure
   - `@/` → `./src/`
   - `@/components` → `./src/components/`
   - `@/lib` → `./src/lib/`
   - `@/db` → `./src/db/`

3. **Coverage Reporting**: HTML, JSON, LCOV, and text formats

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/formatters';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
```

### Example Integration Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/LoginForm';

vi.mock('@/db/supabase.client', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  })),
}));

describe('LoginForm', () => {
  it('should render form fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

---

## E2E Tests (Playwright)

### Configuration

Configuration is located in `playwright.config.ts`:

- **Browser**: Chromium only (as per guidelines)
- **Base URL**: http://localhost:4321
- **Parallel execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Trace**: On first retry
- **Screenshots**: On failure only
- **Video**: Retain on failure

### Directory Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts    # Reusable test fixtures
├── pages/
│   ├── LoginPage.ts       # Login page object
│   └── HomePage.ts        # Home page object
├── auth.spec.ts           # Authentication tests
└── flashcards.spec.ts     # Flashcards tests
```

### Page Object Model

All E2E tests use the Page Object Model pattern for maintainability:

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
```

### Test Fixtures

Reusable fixtures for common scenarios:

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: void;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  authenticatedPage: async ({ page }, use) => {
    // Perform login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    await use();
  },
});
```

### Example E2E Test

```typescript
import { test, expect } from './fixtures/auth.fixture';

test.describe('Authentication', () => {
  test('should login successfully', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    await expect(page).toHaveURL('/');
  });
  
  test('should access protected route when authenticated', async ({ authenticatedPage, page }) => {
    await page.goto('/flashcards');
    await expect(page).toHaveURL('/flashcards');
  });
});
```

---

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm run test

# Watch mode (for development)
npm run test:watch

# UI mode (visual interface)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# UI mode (interactive)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Environment Variables

For E2E tests, you can set test user credentials:

```bash
# .env or .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test123456
BASE_URL=http://localhost:4321
```

---

## Writing Tests

### Unit Test Guidelines

1. **Use descriptive test names**: `it('should validate email format', ...)`
2. **Follow Arrange-Act-Assert pattern**
3. **Mock external dependencies**: Use `vi.mock()` for Supabase, API calls
4. **Test edge cases**: Empty inputs, invalid data, error states
5. **Use Testing Library queries**: Prefer `getByRole`, `getByLabelText`

### Integration Test Guidelines

1. **Test user interactions**: Use `@testing-library/user-event`
2. **Mock API responses**: Mock Supabase client methods
3. **Test component integration**: Multiple components working together
4. **Verify side effects**: State updates, API calls, navigation

### E2E Test Guidelines

1. **Use Page Object Model**: Encapsulate page logic
2. **Use semantic locators**: `getByRole`, `getByLabel` over CSS selectors
3. **Wait for elements**: Use `waitFor`, `expect().toBeVisible()`
4. **Test critical user flows**: Login, generate cards, study session
5. **Use fixtures for setup**: Reuse authentication, test data
6. **Isolate tests**: Each test should be independent

---

## Best Practices

### Vitest Best Practices

1. **Leverage `vi` object**: Use `vi.fn()`, `vi.spyOn()`, `vi.mock()`
2. **Use inline snapshots**: `expect(value).toMatchInlineSnapshot()`
3. **Configure coverage thresholds**: Ensure critical code is tested
4. **Use setup files**: Global mocks and configurations
5. **Enable TypeScript strict mode**: Catch type errors in tests
6. **Clear mocks between tests**: Use `beforeEach(() => vi.clearAllMocks())`

### Playwright Best Practices

1. **Use browser contexts**: Isolate test environments
2. **Implement Page Object Model**: Maintainable, reusable code
3. **Use resilient locators**: Role-based, label-based selectors
4. **Leverage trace viewer**: Debug test failures
5. **Use fixtures**: Reusable setup and teardown
6. **Parallel execution**: Faster test runs
7. **Visual comparison**: `expect(page).toHaveScreenshot()` for UI tests

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Coverage Thresholds

Current thresholds (70% for critical modules):
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

### Pre-commit Hooks

Tests are NOT run in pre-commit hooks to maintain fast commit times. However, you can add them if desired:

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "vitest related --run"
  ]
}
```

---

## Troubleshooting

### Common Issues

1. **Vitest: Module not found**
   - Check path aliases in `vitest.config.ts`
   - Ensure `tsconfig.json` paths match

2. **Playwright: Timeout errors**
   - Increase timeout: `test.setTimeout(60000)`
   - Check if dev server is running
   - Verify BASE_URL in config

3. **Tests fail in CI but pass locally**
   - Check environment variables
   - Ensure deterministic test data
   - Review CI-specific configuration

4. **Coverage not generated**
   - Run `npm run test:coverage`
   - Check `coverage/` directory
   - Verify `vitest.config.ts` coverage settings

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Next Steps

1. ✅ Set up testing environment
2. ⬜ Write unit tests for services (`lib/services/`)
3. ⬜ Write integration tests for React components
4. ⬜ Write E2E tests for critical user flows:
   - Authentication (login, signup, logout)
   - Flashcard generation
   - Study session (SRS)
   - Flashcard management
5. ⬜ Add tests to CI/CD pipeline
6. ⬜ Set up code coverage reporting
7. ⬜ Implement visual regression testing (optional)

---

**Happy Testing! 🧪**


