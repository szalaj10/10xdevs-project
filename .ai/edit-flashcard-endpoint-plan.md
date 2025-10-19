# API Endpoint Implementation Plan: PATCH /api/flashcards/{id}

## 1. Przegląd punktu końcowego
Ten endpoint służy do edycji istniejącej fiszki. Użytkownik może zaktualizować pola: front, back i source. Endpoint również sprawdza podobieństwo nowej treści front z innymi fiszkami (detekcja duplikatów) i zwraca ostrzeżenia jeśli znajdzie podobne karty.

## 2. Szczegóły żądania
- Metoda HTTP: PATCH
- Ścieżka: `/api/flashcards/{id}`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `id` (number) - ID fiszki
- Request Body:
  ```json
  {
    "front": "string (max 200 chars, optional)",
    "back": "string (max 350 chars, optional)",
    "source": "string (optional)"
  }
  ```
- Parametry body:
  - Opcjonalne: `front` (string) - nowa treść przodu karty
  - Opcjonalne: `back` (string) - nowa treść tyłu karty
  - Opcjonalne: `source` (string) - nowe źródło
  - Przynajmniej jedno pole musi być podane
- Query Parameters: brak

## 3. Wykorzystywane typy
- Command: `EditFlashcardDTO` (Pick<TablesUpdate<"flashcards">, "front" | "back" | "source">)
- DTO:
  - `FlashcardDTO` (Tables<"flashcards">)
  - `GetFlashcardResponseDTO` ({ flashcard: FlashcardDTO })

## 4. Szczegóły odpowiedzi
- 200 OK
- Response Body:
  ```json
  {
    "flashcard": {
      "id": 1,
      "user_id": "uuid",
      "generation_id": 1,
      "front": "updated front",
      "back": "updated back",
      "source": "manual",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "warnings": [
      "Similar card found: 'Similar front text' (similarity: 0.93)"
    ]
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format danych, przekroczenie limitów znaków, brak pól do aktualizacji
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: fiszka o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametru `id` z `context.params`.
3. Parsowanie i walidacja body przy użyciu Zod (`EditFlashcardCommandSchema`).
4. Sprawdzenie czy przynajmniej jedno pole jest podane.
5. Wywołanie serwisu: `flashcardService.editFlashcard(userId, flashcardId, updateData)`.
6. W serwisie:
   - Pobranie fiszki z weryfikacją przynależności (.eq('id', flashcardId).eq('user_id', userId).single()).
   - Sprawdzenie czy fiszka istnieje (404 jeśli nie).
   - Jeśli `front` jest aktualizowane: sprawdzenie duplikatów (pg_trgm similarity > 0.9).
   - Przygotowanie warnings jeśli znaleziono podobne karty.
   - Przygotowanie danych do aktualizacji (tylko podane pola).
   - Update rekordu w `flashcards` (również updated_at).
   - Pobranie zaktualizowanego rekordu.
7. Zwrócenie zaktualizowanej fiszki i warnings.
8. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może modyfikować tylko swoje fiszki.
- Walidacja długości: front max 200 chars, back max 350 chars.
- Walidacja przynależności: fiszka musi należeć do użytkownika.
- Sanityzacja treści: filtrowanie niebezpiecznych znaków/skryptów.
- Detekcja duplikatów: ostrzeżenia o podobnych kartach.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format danych         | 400   | Zod zwraca szczegóły walidacji                              |
| Przekroczenie limitu znaków         | 400   | front > 200 lub back > 350 chars                            |
| Brak pól do aktualizacji            | 400   | Żadne pole nie zostało podane                               |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Fiszka nie istnieje                 | 404   | Brak rekordu dla podanego ID i user_id                      |
| Błąd przy zapisie do DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Pojedyncze zapytanie do pobrania i weryfikacji fiszki.
- Pojedyncze zapytanie update.
- Detekcja duplikatów tylko gdy front jest aktualizowane:
  - Wykorzystanie indeksu GIN(front gin_trgm_ops).
  - Limit zapytania similarity do 10 najbardziej podobnych.
- Supabase automatycznie aktualizuje `updated_at` (trigger lub default).
- Opcjonalnie: optimistic locking dla konkurencyjnych edycji.

## 9. Kroki implementacji
1. Plik `src/pages/api/flashcards/[id].ts` już istnieje (GET handler).
2. Dodać HTTP PATCH handler w tym samym pliku.
3. Zdefiniować Zod schema: `EditFlashcardCommandSchema`:
   ```ts
   z.object({
     front: z.string().max(200).optional(),
     back: z.string().max(350).optional(),
     source: z.string().optional()
   }).refine(data => 
     data.front !== undefined || 
     data.back !== undefined || 
     data.source !== undefined, 
     { message: "At least one field must be provided" }
   )
   ```
4. W PATCH handlerze:
   - Wyciągnąć `id` z `context.params` i zwalidować.
   - Sparsować body używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/flashcardService.ts` napisać funkcję `editFlashcard(userId: string, flashcardId: number, updateData: EditFlashcardDTO)`:
   - Pobrać fiszkę: `.select('*').eq('id', flashcardId).eq('user_id', userId).single()`.
   - Sprawdzić czy istnieje (404 jeśli nie).
   - Jeśli `updateData.front`:
     - Sprawdzić duplikaty: `SELECT *, similarity(front, $1) as sim FROM flashcards WHERE user_id = $2 AND id != $3 AND similarity(front, $1) > 0.9 ORDER BY sim DESC LIMIT 10`.
     - Przygotować warnings.
   - Przygotować dane do update (tylko podane pola).
   - Update: `.update(updateData).eq('id', flashcardId).select().single()`.
   - Zwrócić `{ flashcard: updatedFlashcard, warnings }`.
6. Obsłużyć błędy z odpowiednimi kodami HTTP.
7. Zwrócić odpowiedź 200 z zaktualizowaną fiszką i warnings.
8. Napisać testy integracyjne (happy path, exceed limits, duplicates, empty body, 404).
9. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

