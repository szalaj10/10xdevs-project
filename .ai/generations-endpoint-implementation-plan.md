# API Endpoint Implementation Plan: POST /generations

## 1. Przegląd punktu końcowego
Ten endpoint służy do uruchomienia procesu generowania kart AI na podstawie zadanego tematu. Po pomyślnym stworzeniu generacji i kandydatów zwraca dane nowo utworzonej generacji oraz listę wygenerowanych kandydatów.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/generations`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Request Body:
  ```json
  {
    "topic": "string"
  }
  ```
- Parametry:
  - Wymagane: `topic` (string)
  - Opcjonalne: brak

## 3. Wykorzystywane typy
- Command: `CreateGenerationCommand` ( { topic: string } )
- DTO:
  - `GenerationDTO` (Tables<"generations">)
  - `CandidateCardDTO` (Tables<"candidate_cards">)
  - `GetGenerationResponseDTO` ({ generation: GenerationDTO; candidate_cards: CandidateCardDTO[] })

## 4. Szczegóły odpowiedzi
- 201 Created
- Response Body:
  ```json
  {
    "generation": { /* GenerationDTO */ },
    "candidate_cards": [ /* CandidateCardDTO[] */ ]
  }
  ```
- Kody błędów:
  - 400 Bad Request: błędy walidacji (Zod)
  - 401 Unauthorized: brak lub nieważna sesja
  - 500 Internal Server Error: błędy AI lub DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Parsowanie i walidacja ciała żądania przy użyciu Zod (`CreateGenerationCommandSchema`).
3. Wywołanie serwisu: `generationService.triggerGeneration(userId, topic)`.
4. W serwisie:
   - Call external AI API (OpenRouter) z backoff/retry.
   - W razie wyjątku: zapis do `generation_error_logs` i rzucenie błędu.
5. Insert do tabeli `generations` (supabase.from(...).insert).
6. Stworzenie tablicy `candidate_cards` na podstawie wygenerowanych danych.
7. Batch insert do `candidate_cards` (atomiczne w transakcji, jeśli wspierane).
8. Pobranie rekordów z bazy (lub użycie zwróconych danych insert).
9. Mapowanie wyników do DTO i zwrócenie odpowiedzi.

## 6. Względy bezpieczeństwa
- RLS: wiersze w `generations` i `candidate_cards` zabezpieczone politykami (tylko owner może czytać/wstawiać).
- Weryfikacja `topic` długości i formatu (max długość, brak niebezpiecznych znaków).
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowe dane wejściowe        | 400   | Zod zwraca szczegóły walidacji                              |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Błąd serwisu AI                     | 500   | Log do `generation_error_logs`, zwróć ogólny komunikat      |
| Błąd przy zapisie do DB             | 500   | Zweryfikować i obsłużyć specyficznie, log i zwrócić 500      |

## 8. Wydajność
- Rate limiting per-user w `generationService` (np. token bucket lub liczniki w Redis/Supabase).
- Batch insert `candidate_cards` zamiast pojedynczych wstawek.
- Indeks na `generations(user_id)` i `candidate_cards(generation_id)`.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations.ts` (Astro endpoint).
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zaimportować i zastosować middleware uwierzytelniania (z `src/middleware/index.ts`).
4. Zdefiniować Zod schema: `CreateGenerationCommandSchema`.
5. Wyciągnąć `userId` i `topic` z `context.locals` i `body`.
6. W `src/lib/services/generationService.ts` napisać funkcję `triggerGeneration(userId: string, topic: string)`:
   - Wywołanie OpenRouter z retry/backoff.
   - Obsługa wyjątku i zapis błędu do `generation_error_logs`.
   - Insert do `generations`, zwrócenie nowego rekordu.
   - Przygotowanie i insert `candidate_cards`.
   - Zwrot obiektów DTO.
7. W handlerze endpointu wywołać `triggerGeneration`, zwrócić status 201 i DTO.
8. Napisać testy integracyjne (happy path, walidacja, AI-error).
9. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).
