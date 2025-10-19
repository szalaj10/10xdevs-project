# Tests Directory

This directory contains unit and integration tests for the 10xDevs Flashcards project.

## Structure

```
tests/
├── setup.ts          # Global test setup and mocks
├── unit/             # Unit tests for individual functions/modules
│   └── formatters.test.ts
└── integration/      # Integration tests for components and features
    └── auth.test.ts
```

## Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# Coverage report
npm run test:coverage
```

## Writing Tests

See [TESTING_SETUP.md](../TESTING_SETUP.md) for comprehensive guidelines.

### Quick Example

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

