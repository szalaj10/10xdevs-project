# API Endpoint Implementation Plan: GET /api/flashcards/{id}

## 1. Przegląd punktu końcowego
Ten endpoint służy do pobrania szczegółów pojedynczej fiszki na podstawie jej ID. Zwraca pełne dane fiszki, w tym informacje o powiązanej generacji (jeśli istnieje).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/flashcards/{id}`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `id` (number) - ID fiszki
- Request Body: brak
- Query Parameters: brak

## 3. Wykorzystywane typy
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
      "front": "string",
      "back": "string",
      "source": "ai_full",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format ID (nie jest liczbą)
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: fiszka o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametru `id` z `context.params`.
3. Konwersja `id` na liczbę i sprawdzenie czy jest prawidłowe.
4. Wywołanie serwisu: `flashcardService.getFlashcardById(userId, flashcardId)`.
5. W serwisie:
   - Query do tabeli `flashcards` z filtrem na `id` i `user_id`.
   - Użycie `.single()` dla pobrania jednego rekordu.
   - Jeśli brak wyniku lub error: rzucenie błędu 404.
6. Zwrócenie fiszki.
7. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może czytać tylko swoje fiszki.
- Walidacja ID: sprawdzenie czy parametr jest prawidłową liczbą.
- Filtrowanie po `user_id`: zawsze weryfikować przynależność zasobu do zalogowanego użytkownika.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format ID             | 400   | ID nie jest liczbą lub jest ujemne                          |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Fiszka nie istnieje                 | 404   | Brak rekordu dla podanego ID i user_id                      |
| Błąd przy odczycie z DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Wykorzystanie primary key index dla szybkiego lookup po ID.
- Pojedyncze zapytanie do bazy danych.
- Cache po stronie klienta (Cache-Control headers) dla niezmienialnych fiszek.
- Opcjonalnie: ETag dla cache validation.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/flashcards/[id].ts` (Astro endpoint).
2. Dodać `export const prerender = false;` i HTTP GET handler.
3. Zaimportować middleware uwierzytelniania (z `src/middleware/index.ts`).
4. W handlerze:
   - Wyciągnąć `id` z `context.params.id`.
   - Zwalidować czy `id` jest prawidłową liczbą (parseInt, sprawdzenie NaN).
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/flashcardService.ts` napisać funkcję `getFlashcardById(userId: string, flashcardId: number)`:
   - Query: `supabase.from('flashcards').select('*').eq('id', flashcardId).eq('user_id', userId).single()`.
   - Sprawdzić `error` lub brak `data`: rzucić błąd 404.
   - Zwrócić `{ flashcard: data }`.
6. W handlerze wywołać `getFlashcardById`, obsłużyć błędy i zwrócić odpowiedź 200 z JSON.
7. Napisać testy integracyjne (happy path, 404, unauthorized access).
8. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

