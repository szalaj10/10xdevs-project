# Groq Service Implementation Plan

## 1. Opis usługi
`GroqService` to usługa pośrednicząca między aplikacją a API modelu językowego groq. Zapewnia:
- Konfigurację i inicjalizację klienta API
- Budowanie i walidację wiadomości (system/user)
- Formatowanie odpowiedzi zgodnie z JSON Schema
- Obsługę parametrów modelu i błędów

## 2. Konstruktor
### Signature
```ts
constructor(options: GroqServiceOptions)
```
### Parametry
- `apiKey: string` – klucz dostępu do API groq
- `baseUrl?: string` – opcjonalny URL endpointu (domyślnie z env)
- `defaultModel?: string` – domyślny nazwamodelu
- `defaultParams?: ModelParams` – domyślne parametry (temperature, maxTokens itp.)

### Implementacja
- Inicjalizuje klienta HTTP z nagłówkami (API key)
- Ustawia domyślne pola na instancji

## 3. Publiczne metody i pola

### 3.1 send(
```ts
send(
  userMessage: string,
  options?: {
    systemMessage?: string,
    responseFormat?: ResponseFormat,
    model?: string,
    params?: ModelParams
  }
): Promise<GroqResponse>
```
#### Funkcjonalność
- Łączy `systemMessage` i `userMessage` w tablicę wiadomości zgodnie z API
- Nakłada `responseFormat`, `model`, `params` (priorytet nad domyślnymi)
- Wysyła zapytanie do API
- Parsuje i waliduje odpowiedź zgodnie z `responseFormat`

### 3.2 setDefaultModel(model: string): void
- Ustawia domyślny model
### 3.3 setDefaultParams(params: ModelParams): void
- Ustawia domyślne parametry modelu

## 4. Prywatne metody i pola

### 4.1 buildMessages(
```ts
private buildMessages(
  systemMessage: string,
  userMessage: string
): ApiMessage[]
```
- Konwertuje wejścia na strukturę wymaganej przez groq API

### 4.2 formatResponse(
```ts
private formatResponse(
  raw: any,
  format: ResponseFormat
): GroqResponse
```
- Parsuje `raw` JSON z API
- Waliduje względem `format.json_schema`

### 4.3 handleError(
```ts
private handleError(error: any): never
```
- Mapuje błędy HTTP i parsing na wyjątki z przyjaznymi komunikatami

## 5. Obsługa błędów

### Scenariusze błędów
1. Brak połączenia / timeout
2. Nieprawidłowy klucz API (401)
3. Przekroczony limit żądań (429)
4. Błędy walidacji odpowiedzi (schema mismatch)
5. Błędy serwera (5xx)
6. Nieprawidłowy format JSON w `responseFormat`

### Przykładowe wyjątki
```ts
class GroqError extends Error {}
class AuthenticationError extends GroqError {}
class RateLimitError extends GroqError {}
class ValidationError extends GroqError {}
```

## 6. Kwestie bezpieczeństwa
1. Przechowywać `apiKey` w zmiennych środowiskowych
2. Używać HTTPS i weryfikować certyfikaty
3. Ograniczać zapisywanie surowych odpowiedzi w logach
4. Ustawiać limity wielkości wiadomości (maxTokens)
5. Sanityzować wejście użytkownika przed wysłaniem

## 7. Plan wdrożenia krok po kroku

1. Instalacja zależności:
```bash
npm install axios ajv
```
2. Utworzenie pliku `src/lib/groqService.ts`
3. Zaimplementowanie klasy `GroqService` wg specyfikacji
4. Dodanie typów w `src/types.ts`:
```ts
type ModelParams = { temperature?: number; maxTokens?: number; }
interface ResponseFormat { type: 'json_schema'; json_schema: { name: string; strict: boolean; schema: object }; }
```
5. Dodanie wyjątków w `src/lib/errors.ts`
6. Zaimplementowanie testów jednostkowych dla:
   - Budowania wiadomości
   - Walidacji `responseFormat`
   - Obsługi błędów
7. Skonfigurowanie zmiennych środowiskowych w `.env`:
```
GROQ_API_KEY=...
GROQ_BASE_URL=https://api.groq.com/v1
```
8. Dodanie integracji w miejscu wywołania:
```ts
const service = new GroqService({ apiKey: process.env.GROQ_API_KEY! });
const result = await service.send(
  'Jakie jest znaczenie życia?',
  {
    systemMessage: 'You are a helpful assistant.',
    responseFormat: { type: 'json_schema', json_schema: { name: 'AnswerSchema', strict: true, schema: { answer: { type: 'string' } } } },
    model: 'groq-1',
    params: { temperature: 0.7, maxTokens: 150 }
  }
);
```
9. Przegląd kodu, dodanie do CI
10. Wdrażanie na produkcję (Vercel/Supabase Edge Functions)

---
*Plan wdrożenia dostosowany do Astro 5, TypeScript 5, React 19, Tailwind 4 i Shadcn/ui.*
