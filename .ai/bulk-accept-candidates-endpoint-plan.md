# API Endpoint Implementation Plan: POST /api/generations/{generationId}/candidates/accept-bulk

## 1. Przegląd punktu końcowego
Ten endpoint służy do masowego zaakceptowania wielu kart kandydatów jednocześnie. Operacja jest atomowa - wszystkie kandydaty są przetwarzane w ramach jednej transakcji. Dla każdego zaakceptowanego kandydata:
- Zmienia status na 'accepted'
- Tworzy nową fiszkę (flashcard)
- Inkrementuje licznik `accepted_unedited_count` w generacji

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/generations/{generationId}/candidates/accept-bulk`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `generationId` (number) - ID generacji
- Request Body:
  ```json
  {
    "ids": [1, 2, 3, 4, 5]
  }
  ```
- Parametry body:
  - Wymagane: `ids` (array of numbers) - tablica ID kart kandydatów do zaakceptowania
- Query Parameters: brak

## 3. Wykorzystywane typy
- Command: `BulkAcceptCandidateCardsDTO` ({ ids: number[] })
- DTO:
  - `CandidateCardDTO` (Tables<"candidate_cards">)
  - `FlashcardDTO` (Tables<"flashcards">)
  - `ListFlashcardsResponseDTO` ({ flashcards: FlashcardDTO[] })

## 4. Szczegóły odpowiedzi
- 201 Created
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
    ]
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format danych, pusta tablica IDs, lub niektóre kandydaty już przetworzone
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: jeden lub więcej kandydatów nie istnieje lub nie należy do użytkownika/generacji
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametru `generationId` z `context.params`.
3. Parsowanie i walidacja body przy użyciu Zod (`BulkAcceptCandidateCardsCommandSchema`).
4. Sprawdzenie czy tablica `ids` nie jest pusta i zawiera unikalne wartości.
5. Wywołanie serwisu: `candidateService.bulkAcceptCandidates(userId, generationId, ids)`.
6. W serwisie (transakcja atomowa):
   - Pobranie wszystkich kandydatów z tabeli `candidate_cards` (.in('id', ids).eq('user_id', userId).eq('generation_id', generationId)).
   - Sprawdzenie czy liczba pobranych kandydatów === ids.length (wszystkie istnieją).
   - Weryfikacja że wszystkie mają status 'pending'.
   - Batch update statusów na 'accepted'.
   - Przygotowanie tablicy danych do wstawienia do `flashcards` (map z kandydatów).
   - Batch insert do `flashcards`.
   - Update `accepted_unedited_count` w `generations` (increment o ids.length).
7. Zwrócenie tablicy utworzonych fiszek.
8. Mapowanie wyników do DTO i zwrócenie odpowiedzi 201.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może modyfikować tylko swoje kandydaty.
- Walidacja tablicy IDs: sprawdzenie unikalności, niepustości, prawidłowych typów.
- Walidacja statusów: wszystkie kandydaty muszą być 'pending'.
- Walidacja przynależności: wszystkie kandydaty muszą należeć do podanej generacji i użytkownika.
- Atomowość: wszystkie operacje w transakcji (rollback w razie błędu).
- Limit rozmiaru: opcjonalnie ograniczyć maksymalną liczbę IDs (np. 50-100).
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format danych         | 400   | Zod zwraca szczegóły walidacji (IDs nie są tablicą/liczbami)|
| Pusta tablica IDs                   | 400   | Tablica ids jest pusta                                      |
| Niektóre kandydaty przetworzone     | 400   | Jeden lub więcej kandydatów ma status != 'pending'         |
| Przekroczenie limitu                | 400   | Zbyt wiele IDs w jednym request (opcjonalnie)               |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Kandydaty nie istnieją              | 404   | Liczba znalezionych < ids.length                            |
| Błąd przy zapisie do DB             | 500   | Rollback transakcji, logowanie i zwrócenie błędu            |

## 8. Wydajność
- Batch operations: pojedyncze zapytania dla wielu rekordów zamiast pętli.
- Wykorzystanie transakcji dla atomowości.
- Indeksy:
  - `candidate_cards(user_id, status)` - szybkie filtrowanie
  - `candidate_cards(generation_id)` - szybkie filtrowanie po generacji
- Limit rozmiaru batch (np. max 100 IDs) dla przewidywalnej wydajności.
- Opcjonalnie: queue system dla bardzo dużych batch'y.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations/[generationId]/candidates/accept-bulk.ts`.
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zaimportować middleware uwierzytelniania.
4. Zdefiniować Zod schema: `BulkAcceptCandidateCardsCommandSchema`:
   ```ts
   z.object({
     ids: z.array(z.number().int().positive()).min(1).max(100)
   })
   ```
5. W handlerze:
   - Wyciągnąć `generationId` z `context.params` i zwalidować.
   - Sparsować body używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
   - Sprawdzić unikalność IDs (opcjonalnie: new Set(ids).size === ids.length).
6. W `src/lib/services/candidateService.ts` napisać funkcję `bulkAcceptCandidates(userId: string, generationId: number, ids: number[])`:
   - Rozpocząć transakcję (lub użyć Supabase RPC function).
   - Pobrać wszystkie kandydaty: `.select('*').in('id', ids).eq('user_id', userId).eq('generation_id', generationId)`.
   - Sprawdzić: `candidates.length === ids.length` (404 jeśli nie).
   - Sprawdzić: `candidates.every(c => c.status === 'pending')` (400 jeśli nie).
   - Batch update: `.update({ status: 'accepted' }).in('id', ids)`.
   - Przygotować dane dla flashcards: `candidates.map(c => ({ front: c.front, back: c.back, source: 'ai_full', generation_id: generationId }))`.
   - Batch insert: `supabase.from('flashcards').insert(flashcardsData)`.
   - Update generation: `.update({ accepted_unedited_count: generation.accepted_unedited_count + ids.length })`.
   - Zwrócić utworzone fiszki.
7. Obsłużyć błędy z odpowiednimi kodami HTTP.
8. Zwrócić odpowiedź 201 z utworzonymi fiszkami.
9. Napisać testy integracyjne (happy path, partial already accepted, 404, empty array, duplicates).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

