# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego
Ten endpoint służy do pobrania listy fiszek użytkownika z możliwością filtrowania i sortowania. Wspiera wyszukiwanie pełnotekstowe po treści przodu karty (front), sortowanie według daty utworzenia lub daty powtórki (due), oraz paginację wyników.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/flashcards`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL: brak
- Request Body: brak
- Query Parameters:
  - Opcjonalne: `search` (string) - wyszukiwanie pełnotekstowe w polu front
  - Opcjonalne: `sort` (enum: 'created_at' | 'due') - sposób sortowania, domyślnie 'created_at'
  - Opcjonalne: `page` (number) - numer strony, domyślnie 1
  - Opcjonalne: `limit` (number) - liczba wyników na stronę, domyślnie 20, max 100

## 3. Wykorzystywane typy
- Query: `ListFlashcardsQueryDTO` ({ search?: string; sort?: "created_at" | "due"; page?: number; limit?: number })
- DTO:
  - `FlashcardDTO` (Tables<"flashcards">)
  - `ListFlashcardsResponseDTO` ({ flashcards: FlashcardDTO[] })

## 4. Szczegóły odpowiedzi
- 200 OK
- Response Body:
  ```json
  {
    "flashcards": [
      {
        "id": 1,
        "user_id": "uuid",
        "generation_id": 1,
        "front": "string",
        "back": "string",
        "source": "ai_full",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowe parametry query (np. ujemna strona, limit > 100)
  - 401 Unauthorized: brak lub nieważna sesja
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Parsowanie query parameters z `context.url.searchParams`.
3. Walidacja parametrów przy użyciu Zod (`ListFlashcardsQuerySchema`):
   - Konwersja stringów na liczby dla page i limit.
   - Walidacja zakresu wartości.
   - Ustawienie wartości domyślnych.
4. Wywołanie serwisu: `flashcardService.listFlashcards(userId, queryParams)`.
5. W serwisie:
   - Budowanie query do tabeli `flashcards` z filtrem na `user_id`.
   - Jeśli `search`: dodanie filtra `ilike` lub użycie pg_trgm similarity search.
   - Sortowanie według `sort` parameter (created_at DESC lub due ASC).
   - Zastosowanie paginacji: `.range(from, to)` gdzie from = (page-1)*limit, to = from+limit-1.
   - Opcjonalnie: osobne query dla zliczenia total (lub użycie count w Supabase).
6. Zwrócenie listy fiszek i danych paginacji.
7. Mapowanie wyników do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik widzi tylko swoje fiszki.
- Walidacja parametrów: ograniczenie max limit (100), walidacja typu sort.
- Sanityzacja search query: zabezpieczenie przed SQL injection (Supabase parametryzuje zapytania).
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowe parametry query       | 400   | Zod zwraca szczegóły walidacji                              |
| Limit przekracza 100                | 400   | Limit musi być <= 100                                       |
| Ujemna strona lub limit             | 400   | Page i limit muszą być > 0                                  |
| Nieprawidłowa wartość sort          | 400   | Sort musi być 'created_at' lub 'due'                        |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Błąd przy odczycie z DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Wykorzystanie indeksów:
  - `flashcards(user_id, created_at)` - szybkie sortowanie i filtrowanie
  - `flashcards(front gin_trgm_ops)` - szybkie wyszukiwanie pełnotekstowe
- Paginacja server-side dla uniknięcia przesyłania dużych zbiorów.
- Cache headers (ETag, Last-Modified) dla niezmienialnych wyników.
- Opcjonalnie: cache po stronie serwera dla popularnych zapytań (Redis).
- Limit max 100 dla przewidywalności wydajności.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/flashcards/index.ts` (lub `src/pages/api/flashcards.ts`).
2. Dodać `export const prerender = false;` i HTTP GET handler.
3. Zaimportować middleware uwierzytelniania.
4. Zdefiniować Zod schema: `ListFlashcardsQuerySchema`:
   ```ts
   z.object({
     search: z.string().optional(),
     sort: z.enum(['created_at', 'due']).default('created_at'),
     page: z.coerce.number().int().positive().default(1),
     limit: z.coerce.number().int().positive().max(100).default(20)
   })
   ```
5. W handlerze:
   - Wyciągnąć query parameters z `context.url.searchParams`.
   - Sparsować używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
6. W `src/lib/services/flashcardService.ts` napisać funkcję `listFlashcards(userId: string, query: ListFlashcardsQueryDTO)`:
   - Rozpocząć query: `supabase.from('flashcards').select('*', { count: 'exact' }).eq('user_id', userId)`.
   - Jeśli `query.search`: dodać `.ilike('front', `%${query.search}%`)` lub `.textSearch('front', query.search)`.
   - Dodać sortowanie: `.order(query.sort, { ascending: query.sort === 'due' })`.
   - Dodać paginację: `.range((query.page-1)*query.limit, query.page*query.limit-1)`.
   - Wykonać query i pobrać `data` i `count`.
   - Przygotować obiekt paginacji: `{ page, limit, total: count, totalPages: Math.ceil(count/limit) }`.
   - Zwrócić `{ flashcards: data, pagination }`.
7. Obsłużyć błędy z odpowiednimi kodami HTTP.
8. Zwrócić odpowiedź 200 z listą fiszek i paginacją.
9. Napisać testy integracyjne (happy path, search, pagination, sort, edge cases).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

