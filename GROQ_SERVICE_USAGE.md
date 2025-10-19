# Groq Service - Dokumentacja użycia

## Przegląd

`GroqService` to usługa pośrednicząca między aplikacją a API Groq, zapewniająca:
- Konfigurację i inicjalizację klienta API
- Budowanie i walidację wiadomości
- Formatowanie odpowiedzi zgodnie z JSON Schema
- Kompleksową obsługę błędów
- Zabezpieczenia i walidację danych wejściowych

## Instalacja

Wymagane zależności zostały już zainstalowane:
```bash
npm install groq-sdk
```

## Konfiguracja

### 1. Zmienne środowiskowe

Dodaj następujące zmienne do pliku `.env.local`:

```env
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile  # Opcjonalne
```

Aby uzyskać klucz API:
1. Odwiedź [console.groq.com](https://console.groq.com)
2. Zarejestruj się lub zaloguj
3. Wygeneruj nowy klucz API w sekcji "API Keys"

### 2. Dostępne modele

Groq wspiera następujące modele:
- `llama-3.3-70b-versatile` (domyślny) - Zbalansowany model ogólnego przeznaczenia
- `llama2-70b-4096` - Większy model z większą dokładnością
- `gemma-7b-it` - Szybszy model dla prostszych zadań

## Podstawowe użycie

### Proste zapytanie

```typescript
import { GroqService } from './lib/services/groqService';

// Inicjalizacja serwisu
const groqService = new GroqService({
  apiKey: import.meta.env.GROQ_API_KEY,
});

// Wysłanie prostego zapytania
const response = await groqService.send(
  'Jakie jest znaczenie życia?',
  {
    systemMessage: 'You are a helpful assistant.',
    params: {
      temperature: 0.7,
      maxTokens: 150,
    }
  }
);

console.log(response.data); // Odpowiedź od modelu
console.log(response.usage); // Informacje o użyciu tokenów
```

### Użycie pomocniczej funkcji

```typescript
import { createGroqService } from './lib/services/groqService';

// Tworzy instancję z domyślną konfiguracją ze zmiennych środowiskowych
const groqService = createGroqService();

const response = await groqService.send('Hello, world!');
```

## Zaawansowane użycie

### Structured Output (JSON Schema)

```typescript
// Definiuj schemat odpowiedzi
const responseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'FlashcardSchema',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        front: { type: 'string' },
        back: { type: 'string' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
      },
      required: ['front', 'back']
    }
  }
};

// Wyślij zapytanie z formatem
const response = await groqService.send<{
  front: string;
  back: string;
  difficulty?: string;
}>(
  'Generate a flashcard about photosynthesis',
  {
    systemMessage: 'You are a flashcard generator. Create educational flashcards.',
    responseFormat,
    params: {
      temperature: 0.5,
      maxTokens: 200,
    }
  }
);

// Odpowiedź jest automatycznie parsowana i walidowana
console.log(response.data.front);
console.log(response.data.back);
```

### Generowanie fiszek (Flashcards)

```typescript
interface Flashcard {
  front: string;
  back: string;
  tags: string[];
}

const responseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'FlashcardsResponse',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['front', 'back', 'tags']
          }
        }
      },
      required: ['flashcards']
    }
  }
};

const response = await groqService.send<{ flashcards: Flashcard[] }>(
  `Generate 5 flashcards about the topic: ${topic}`,
  {
    systemMessage: `You are an expert educator creating flashcards.
    Create clear, concise flashcards that test understanding.
    Front should be a question or prompt.
    Back should be the answer or explanation.`,
    responseFormat,
    params: {
      temperature: 0.7,
      maxTokens: 2000,
    }
  }
);

// Użyj wygenerowanych fiszek
for (const flashcard of response.data.flashcards) {
  console.log(`Q: ${flashcard.front}`);
  console.log(`A: ${flashcard.back}`);
  console.log(`Tags: ${flashcard.tags.join(', ')}`);
}
```

### Konfiguracja parametrów modelu

```typescript
const groqService = new GroqService({
  apiKey: import.meta.env.GROQ_API_KEY,
  defaultModel: 'llama2-70b-4096',
  defaultParams: {
    temperature: 0.5,      // 0.0 = deterministyczny, 1.0 = kreatywny
    maxTokens: 1024,       // Maksymalna długość odpowiedzi
    topP: 0.9,             // Nucleus sampling
    frequencyPenalty: 0.0, // Redukcja powtórzeń
    presencePenalty: 0.0,  // Zachęcanie do nowych tematów
    stop: ['\n\n']         // Sekwencje zatrzymania
  }
});

// Parametry można nadpisać dla konkretnego zapytania
const response = await groqService.send(
  'Write a short story',
  {
    params: {
      temperature: 0.9,  // Bardziej kreatywna odpowiedź
      maxTokens: 500
    }
  }
);
```

### Zmiana domyślnych ustawień

```typescript
const groqService = createGroqService();

// Zmień domyślny model
groqService.setDefaultModel('gemma-7b-it');

// Zmień domyślne parametry
groqService.setDefaultParams({
  temperature: 0.3,
  maxTokens: 512
});
```

## Obsługa błędów

### Typy błędów

Serwis definiuje następujące typy błędów:

```typescript
import {
  GroqError,           // Bazowy błąd
  AuthenticationError, // Nieprawidłowy klucz API (401)
  RateLimitError,      // Przekroczony limit żądań (429)
  ValidationError,     // Błąd walidacji danych
  NetworkError,        // Błąd połączenia sieciowego
  ServerError,         // Błąd serwera (5xx)
  TimeoutError,        // Timeout żądania
  InvalidFormatError,  // Nieprawidłowy format odpowiedzi
} from './lib/errors';
```

### Przykład obsługi błędów

```typescript
try {
  const response = await groqService.send('Hello!');
  console.log(response.data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key. Please check your credentials.');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded. Please try again later.');
  } else if (error instanceof ValidationError) {
    console.error('Invalid input or response format:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network connection failed:', error.message);
  } else if (error instanceof ServerError) {
    console.error('Server error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timed out:', error.message);
  } else if (error instanceof GroqError) {
    console.error('Groq error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Retry logic z exponential backoff

```typescript
async function sendWithRetry<T>(
  groqService: GroqService,
  message: string,
  options?: any,
  maxRetries = 3
): Promise<GroqResponse<T>> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await groqService.send<T>(message, options);
    } catch (error) {
      lastError = error as Error;
      
      // Retry tylko dla błędów przejściowych
      if (error instanceof RateLimitError || error instanceof ServerError || error instanceof TimeoutError) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Nie retry dla innych błędów
      throw error;
    }
  }
  
  throw lastError!;
}

// Użycie
try {
  const response = await sendWithRetry(groqService, 'Generate flashcards...');
} catch (error) {
  console.error('Failed after retries:', error);
}
```

## Integracja z Astro API routes

### Przykład endpoint do generowania fiszek

```typescript
// src/pages/api/generate-flashcards.ts
import type { APIRoute } from 'astro';
import { createGroqService } from '../../lib/services/groqService';
import { ValidationError } from '../../lib/errors';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { topic } = await request.json();
    
    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const groqService = createGroqService();
    
    const responseFormat = {
      type: 'json_schema' as const,
      json_schema: {
        name: 'FlashcardsResponse',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            flashcards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  front: { type: 'string' },
                  back: { type: 'string' }
                },
                required: ['front', 'back']
              }
            }
          },
          required: ['flashcards']
        }
      }
    };
    
    const response = await groqService.send(
      `Generate 5 educational flashcards about: ${topic}`,
      {
        systemMessage: 'You are an expert educator creating flashcards.',
        responseFormat,
        params: { temperature: 0.7, maxTokens: 2000 }
      }
    );
    
    return new Response(
      JSON.stringify(response.data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error generating flashcards:', error);
    
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

## Best Practices

### 1. Zarządzanie kluczem API

```typescript
// ✅ DOBRZE - używaj zmiennych środowiskowych
const groqService = new GroqService({
  apiKey: import.meta.env.GROQ_API_KEY
});

// ❌ ŹLE - nie hardcoduj klucza w kodzie
const groqService = new GroqService({
  apiKey: 'gsk_...'  // NIGDY!
});
```

### 2. Walidacja danych wejściowych

```typescript
// ✅ DOBRZE - waliduj przed wysłaniem
function sanitizeTopic(topic: string): string {
  if (!topic || topic.trim().length === 0) {
    throw new Error('Topic cannot be empty');
  }
  if (topic.length > 500) {
    throw new Error('Topic too long');
  }
  return topic.trim();
}

const topic = sanitizeTopic(userInput);
const response = await groqService.send(`Generate flashcards about: ${topic}`);
```

### 3. Używanie structured outputs

```typescript
// ✅ DOBRZE - definiuj schema dla przewidywalnych odpowiedzi
const responseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'Response',
    strict: true,
    schema: { /* ... */ }
  }
};

// ❌ UNIKAJ - parsowania manualnego
const response = await groqService.send('...');
const parsed = JSON.parse(response.data); // Może się nie udać
```

### 4. Obsługa błędów

```typescript
// ✅ DOBRZE - obsługuj konkretne typy błędów
try {
  const response = await groqService.send('...');
} catch (error) {
  if (error instanceof RateLimitError) {
    // Poczekaj i spróbuj ponownie
  } else if (error instanceof ValidationError) {
    // Pokaż użytkownikowi komunikat
  }
}

// ❌ UNIKAJ - ignorowania błędów
try {
  await groqService.send('...');
} catch (error) {
  console.log('error'); // Za mało informacji
}
```

### 5. Monitorowanie użycia

```typescript
// ✅ DOBRZE - śledź użycie tokenów
const response = await groqService.send('...');
console.log('Tokens used:', response.usage?.totalTokens);

// Możesz zapisać do analytics/loggera
trackAPIUsage({
  model: 'llama-3.3-70b-versatile',
  tokens: response.usage?.totalTokens,
  timestamp: new Date()
});
```

## Limity i ograniczenia

### Rate Limits
- Groq stosuje rate limiting na poziomie API
- Domyślnie: 30 żądań na minutę (zależne od planu)
- Użyj retry logic z exponential backoff

### Token Limits
- `llama-3.3-70b-versatile`: max 128,000 tokenów context
- `llama2-70b-4096`: max 4,096 tokenów context
- Pamiętaj: długość prompt + completion < max tokens

### Response Time
- Groq jest bardzo szybki (< 1s dla większości zapytań)
- Dla dużych odpowiedzi może zająć więcej czasu
- Ustaw odpowiedni timeout w produkcji

## Testowanie

### Unit testy

```typescript
import { describe, it, expect, vi } from 'vitest';
import { GroqService } from './groqService';

describe('GroqService', () => {
  it('should throw error if API key is missing', () => {
    expect(() => new GroqService({ apiKey: '' })).toThrow();
  });
  
  it('should sanitize input', async () => {
    const service = new GroqService({ apiKey: 'test' });
    // Mock the client
    // Test sanitization logic
  });
});
```

### Mock dla development

```typescript
class MockGroqService extends GroqService {
  async send(message: string, options?: any) {
    // Zwróć mockowane dane
    return {
      data: { flashcards: [{ front: 'Mock', back: 'Data' }] },
      raw: {},
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
  }
}

// Użyj w środowisku dev
const groqService = import.meta.env.DEV 
  ? new MockGroqService({ apiKey: 'mock' })
  : createGroqService();
```

## Troubleshooting

### Problem: "Authentication failed"
**Rozwiązanie:** Sprawdź czy `GROQ_API_KEY` jest poprawnie ustawiony w `.env.local`

### Problem: "Rate limit exceeded"
**Rozwiązanie:** Zaimplementuj retry logic lub poczekaj przed kolejnym zapytaniem

### Problem: "Response is not valid JSON"
**Rozwiązanie:** Upewnij się, że używasz `responseFormat` z `json_schema` dla structured outputs

### Problem: "Request timed out"
**Rozwiązanie:** Zwiększ `maxTokens` lub podziel zadanie na mniejsze części

## Przykłady z życia

Zobacz katalog `examples/` dla więcej przykładów:
- `examples/basic-usage.ts` - Podstawowe użycie
- `examples/flashcard-generation.ts` - Generowanie fiszek
- `examples/error-handling.ts` - Obsługa błędów
- `examples/api-integration.ts` - Integracja z API routes

## Wsparcie

- Dokumentacja Groq: https://console.groq.com/docs
- Issues: Zgłoś problem w repozytorium projektu
- API Status: https://status.groq.com

---

**Uwaga:** Pamiętaj o bezpiecznym przechowywaniu kluczy API i nie commituj ich do repozytorium!

