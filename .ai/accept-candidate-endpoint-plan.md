# API Endpoint Implementation Plan: POST /api/generations/{generationId}/candidates/{id}/accept

## 1. Przegląd punktu końcowego
Ten endpoint służy do zaakceptowania pojedynczej karty kandydata. Akceptacja powoduje:
- Zmianę statusu kandydata na 'accepted'
- Utworzenie nowej fiszki (flashcard) na podstawie treści kandydata
- Zwiększenie licznika `accepted_unedited_count` w generacji
- Przekopiowanie danych `front` i `back` z candidate_card do flashcard

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/generations/{generationId}/candidates/{id}/accept`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `generationId` (number) - ID generacji
  - Wymagane: `id` (number) - ID karty kandydata
- Request Body: brak
- Query Parameters: brak

## 3. Wykorzystywane typy
- DTO:
  - `CandidateCardDTO` (Tables<"candidate_cards">)
  - `FlashcardDTO` (Tables<"flashcards">)
  - `GenerationDTO` (Tables<"generations">)
- Internal:
  - `CreateFlashcardDTO` (Pick<TablesInsert<"flashcards">, "front" | "back" | "source">)

## 4. Szczegóły odpowiedzi
- 201 Created
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
  - 400 Bad Request: nieprawidłowy format ID lub kandydat już zaakceptowany/odrzucony
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: kandydat o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametrów `generationId` i `id` z `context.params`.
3. Konwersja na liczby i sprawdzenie poprawności.
4. Wywołanie serwisu: `candidateService.acceptCandidate(userId, generationId, candidateId)`.
5. W serwisie (transakcja atomowa):
   - Pobranie kandydata z tabeli `candidate_cards` (.eq('id', candidateId).eq('user_id', userId).eq('generation_id', generationId).single()).
   - Sprawdzenie czy status === 'pending' (jeśli nie, zwrócić błąd 400).
   - Aktualizacja statusu kandydata na 'accepted'.
   - Utworzenie nowej fiszki z danymi:
     - front: candidate.front
     - back: candidate.back
     - source: 'ai_full'
     - generation_id: generationId
     - user_id: userId
   - Inkrementacja `accepted_unedited_count` w tabeli `generations`.
6. Zwrócenie utworzonej fiszki.
7. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 201.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może modyfikować tylko swoje kandydaty.
- Walidacja statusu: sprawdzenie czy kandydat jest w stanie 'pending'.
- Walidacja przynależności: weryfikacja że kandydat należy do podanej generacji i użytkownika.
- Atomowość: wszystkie operacje w transakcji (status update + flashcard insert + generation update).
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format ID             | 400   | ID nie jest liczbą                                          |
| Kandydat już przetworzony           | 400   | Status nie jest 'pending'                                   |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Kandydat nie istnieje               | 404   | Brak rekordu dla podanych ID i user_id                      |
| Błąd przy zapisie do DB             | 500   | Rollback transakcji, logowanie i zwrócenie błędu            |

## 8. Wydajność
- Wykorzystanie transakcji Supabase dla atomowości operacji.
- Wykorzystanie indeksów:
  - `candidate_cards(user_id, status)` - szybkie filtrowanie
  - `generations(user_id)` - szybka aktualizacja
- Pojedyncze zapytanie do pobrania i weryfikacji kandydata.
- Batch processing dla bulk accept (osobny endpoint).

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations/[generationId]/candidates/[id]/accept.ts`.
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zaimportować middleware uwierzytelniania.
4. W handlerze:
   - Wyciągnąć `generationId` i `id` z `context.params`.
   - Zwalidować oba parametry (parseInt, sprawdzenie NaN).
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/candidateService.ts` napisać funkcję `acceptCandidate(userId: string, generationId: number, candidateId: number)`:
   - Rozpocząć transakcję (lub użyć Supabase RPC function).
   - Pobrać kandydata z weryfikacją przynależności.
   - Sprawdzić status === 'pending'.
   - Update status na 'accepted'.
   - Insert do `flashcards` z danymi kandydata + source: 'ai_full'.
   - Update `accepted_unedited_count` w `generations` (increment).
   - Zwrócić utworzoną fiszkę.
6. Obsłużyć błędy z odpowiednimi kodami HTTP.
7. Zwrócić odpowiedź 201 z utworzoną fiszką.
8. Napisać testy integracyjne (happy path, duplicate accept, 404, unauthorized).
9. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

