# API Endpoint Implementation Plan: GET /api/generations/{id}

## 1. Przegląd punktu końcowego
Ten endpoint służy do pobrania szczegółów konkretnej generacji wraz z listą wszystkich powiązanych kandydatów kart. Pozwala użytkownikowi sprawdzić status generacji i przejrzeć wygenerowane karty kandydatów.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/generations/{id}`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `id` (number) - ID generacji
- Request Body: brak
- Query Parameters: brak

## 3. Wykorzystywane typy
- DTO:
  - `GenerationDTO` (Tables<"generations">)
  - `CandidateCardDTO` (Tables<"candidate_cards">)
  - `GetGenerationResponseDTO` ({ generation: GenerationDTO; candidate_cards: CandidateCardDTO[] })

## 4. Szczegóły odpowiedzi
- 200 OK
- Response Body:
  ```json
  {
    "generation": {
      "id": 1,
      "user_id": "uuid",
      "model": "string",
      "generated_count": 10,
      "accepted_unedited_count": 5,
      "accepted_edited_count": 2,
      "source_VARCHAR_hash": "hash",
      "source_VARCHAR_length": 100,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    "candidate_cards": [
      {
        "id": 1,
        "user_id": "uuid",
        "generation_id": 1,
        "front": "string",
        "back": "string",
        "status": "pending",
        "expires_at": "timestamp",
        "created_at": "timestamp"
      }
    ]
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format ID (nie jest liczbą)
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: generacja o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametru `id` z `context.params`.
3. Konwersja `id` na liczbę i sprawdzenie czy jest prawidłowe.
4. Wywołanie serwisu: `generationService.getGenerationById(userId, generationId)`.
5. W serwisie:
   - Query do tabeli `generations` z filtrem na `id` i `user_id`.
   - Jeśli brak wyniku: rzucenie błędu 404.
   - Query do tabeli `candidate_cards` z filtrem na `generation_id` i `user_id`.
6. Złożenie odpowiedzi z generation i candidate_cards.
7. Mapowanie wyników do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może czytać tylko swoje generacje i kandydatów.
- Walidacja ID: sprawdzenie czy parametr jest prawidłową liczbą.
- Filtrowanie po `user_id`: zawsze weryfikować przynależność zasobu do zalogowanego użytkownika.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format ID             | 400   | ID nie jest liczbą lub jest ujemne                          |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Generacja nie istnieje              | 404   | Brak rekordu dla podanego ID i user_id                      |
| Błąd przy odczycie z DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Wykorzystanie istniejących indeksów:
  - `generations(user_id)` - szybkie filtrowanie po użytkowniku
  - `candidate_cards(generation_id)` - szybkie pobieranie kandydatów
- Możliwość użycia pojedynczego zapytania z JOIN zamiast dwóch osobnych (opcjonalnie).
- Cache po stronie klienta (Cache-Control headers) dla niezmienialnych generacji.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations/[id].ts` (Astro endpoint).
2. Dodać `export const prerender = false;` i HTTP GET handler.
3. Zaimportować middleware uwierzytelniania (z `src/middleware/index.ts`).
4. W handlerze:
   - Wyciągnąć `id` z `context.params.id`.
   - Zwalidować czy `id` jest prawidłową liczbą (parseInt, sprawdzenie NaN).
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/generationService.ts` napisać funkcję `getGenerationById(userId: string, generationId: number)`:
   - Query do `generations` z filtrem `.eq('id', generationId).eq('user_id', userId).single()`.
   - Jeśli `error` lub brak `data`: rzucić błąd 404.
   - Query do `candidate_cards` z filtrem `.eq('generation_id', generationId).eq('user_id', userId)`.
   - Zwrócić obiekt `GetGenerationResponseDTO`.
6. W handlerze wywołać `getGenerationById`, obsłużyć błędy i zwrócić odpowiedź 200 z JSON.
7. Napisać testy integracyjne (happy path, 404, unauthorized access).
8. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

