# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Przegląd punktu końcowego
Ten endpoint służy do tworzenia fiszek manualnie przez użytkownika. Wspiera dwa tryby:
1. **Pojedyncza fiszka**: tworzenie jednej fiszki z podanymi front (pytanie), back (odpowiedź) i opcjonalnym source.
2. **Wiele fiszek**: bulk creation - tworzenie wielu fiszek w jednym request.

**Format fiszek**: Pytanie-Odpowiedź
- front = pytanie (np. "Jakie podstawowe funkcje pełni serce?")
- back = odpowiedź (np. "Serce jest głównym organem krwioobiegu...")

Endpoint wykonuje również detekcję duplikatów używając pg_trgm similarity dla pola front.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/flashcards`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL: brak
- Request Body (wariant 1 - pojedyncza fiszka):
  ```json
  {
    "front": "string (max 200 chars) - pytanie",
    "back": "string (max 350 chars) - odpowiedź",
    "source": "string (optional)"
  }
  ```
  Przykład:
  ```json
  {
    "front": "Jakie podstawowe funkcje pełni serce?",
    "back": "Serce jest głównym organem krwioobiegu, pompuje krew do całego organizmu, dostarcza tlen i składniki odżywcze do tkanek.",
    "source": "Kardiologia - podręcznik"
  }
  ```
- Request Body (wariant 2 - wiele fiszek):
  ```json
  {
    "flashcards": [
      {
        "front": "string (max 200 chars)",
        "back": "string (max 350 chars)",
        "source": "string (optional)"
      }
    ]
  }
  ```
- Query Parameters: brak

## 3. Wykorzystywane typy
- Command:
  - `CreateFlashcardDTO` (Pick<TablesInsert<"flashcards">, "front" | "back" | "source">)
  - `BulkCreateFlashcardsDTO` ({ flashcards: CreateFlashcardDTO[] })
- DTO:
  - `FlashcardDTO` (Tables<"flashcards">)
  - `GetFlashcardResponseDTO` ({ flashcard: FlashcardDTO })
  - `ListFlashcardsResponseDTO` ({ flashcards: FlashcardDTO[] })

## 4. Szczegóły odpowiedzi
- 201 Created
- Response Body (pojedyncza fiszka):
  ```json
  {
    "flashcard": {
      "id": 1,
      "user_id": "uuid",
      "generation_id": null,
      "front": "string",
      "back": "string",
      "source": "manual",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "warnings": [
      "Similar card found: 'Similar front text' (similarity: 0.92)"
    ]
  }
  ```
- Response Body (wiele fiszek):
  ```json
  {
    "flashcards": [ /* array of FlashcardDTO */ ],
    "warnings": [ /* array of similarity warnings */ ]
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format danych, przekroczenie limitów znaków, pusta tablica
  - 401 Unauthorized: brak lub nieważna sesja
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Parsowanie body i określenie trybu (single vs bulk) na podstawie struktury.
3. Walidacja przy użyciu Zod (różne schematy dla single i bulk).
4. Wywołanie odpowiedniej funkcji serwisu:
   - Single: `flashcardService.createFlashcard(userId, flashcardData)`
   - Bulk: `flashcardService.createFlashcards(userId, flashcardsData)`
5. W serwisie (dla single):
   - Sprawdzenie duplikatów: query z pg_trgm similarity_threshold > 0.9.
   - Przygotowanie warnings jeśli znaleziono podobne karty.
   - Insert do tabeli `flashcards` (bez generation_id, source defaultuje do 'manual').
   - Zwrócenie utworzonej fiszki i warnings.
6. W serwisie (dla bulk):
   - Dla każdej fiszki sprawdzenie duplikatów (opcjonalnie: batch).
   - Batch insert do `flashcards`.
   - Przygotowanie zbiorczych warnings.
   - Zwrócenie utworzonych fiszek i warnings.
7. Mapowanie wyników do DTO i zwrócenie odpowiedzi 201.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że user_id jest automatycznie ustawiany na zalogowanego użytkownika.
- Walidacja długości: front max 200 chars, back max 350 chars.
- Walidacja treści: sanityzacja HTML/skryptów jeśli używany Markdown.
- Limit bulk: maksymalnie np. 50-100 fiszek w jednym request.
- Rate limiting: ograniczenie liczby tworzonych fiszek per user per day.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format danych         | 400   | Zod zwraca szczegóły walidacji                              |
| Przekroczenie limitu znaków         | 400   | front > 200 lub back > 350 chars                            |
| Pusta tablica flashcards            | 400   | Tablica flashcards jest pusta w bulk mode                   |
| Przekroczenie limitu bulk           | 400   | Zbyt wiele fiszek w jednym request                          |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Błąd przy zapisie do DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Detekcja duplikatów:
  - Wykorzystanie indeksu GIN(front gin_trgm_ops).
  - Limit zapytania similarity do np. 10 najbardziej podobnych.
  - Opcjonalnie: cache wyników similarity dla recent cards.
- Batch insert dla bulk mode zamiast pętli.
- Limit rozmiaru bulk (max 100) dla przewidywalnej wydajności.
- Indeks na `flashcards(user_id, created_at)` dla szybkich insertów.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/flashcards/index.ts` (lub `src/pages/api/flashcards.ts`).
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zaimportować middleware uwierzytelniania.
4. Zdefiniować Zod schemas:
   ```ts
   const CreateFlashcardSchema = z.object({
     front: z.string().min(1).max(200),
     back: z.string().min(1).max(350),
     source: z.string().optional()
   });
   
   const BulkCreateFlashcardsSchema = z.object({
     flashcards: z.array(CreateFlashcardSchema).min(1).max(100)
   });
   ```
5. W handlerze:
   - Sparsować body jako JSON.
   - Określić tryb: jeśli body.flashcards istnieje -> bulk, inaczej -> single.
   - Zwalidować używając odpowiedniego schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
6. W `src/lib/services/flashcardService.ts` napisać funkcje:
   - `createFlashcard(userId: string, data: CreateFlashcardDTO)`:
     - Sprawdzić duplikaty: `SELECT *, similarity(front, $1) as sim FROM flashcards WHERE user_id = $2 AND similarity(front, $1) > 0.9 ORDER BY sim DESC LIMIT 10`.
     - Przygotować warnings jeśli similarity > 0.9.
     - Insert: `.insert({ ...data, user_id: userId, source: data.source || 'manual' }).select().single()`.
     - Zwrócić `{ flashcard, warnings }`.
   - `createFlashcards(userId: string, data: BulkCreateFlashcardsDTO)`:
     - Dla każdej fiszki sprawdzić duplikaty (lub batch query).
     - Przygotować tablicę do insert z user_id.
     - Batch insert: `.insert(flashcardsWithUserId).select()`.
     - Zwrócić `{ flashcards, warnings }`.
7. Obsłużyć błędy z odpowiednimi kodami HTTP.
8. Zwrócić odpowiedź 201 z utworzonymi fiszkami i warnings.
9. Napisać testy integracyjne (single, bulk, duplicates, limits, validation).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

