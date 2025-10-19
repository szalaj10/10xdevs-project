# Integration Tests

Testy integracyjne dla komponentów React i ich interakcji.

## Przykład Testu Integracyjnego

```typescript
// tests/integration/MyComponent.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

// Mock external dependencies
vi.mock('@/db/supabase.client', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

describe('MyComponent Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## Uwagi

- Używaj `getByRole`, `getByLabelText` dla dostępnych selektorów
- Mockuj zależności zewnętrzne (Supabase, API)
- Testuj interakcje użytkownika z `@testing-library/user-event`
- Używaj `waitFor` dla asynchronicznych operacji
- Pamiętaj o polskich tekstach w komponentach!

