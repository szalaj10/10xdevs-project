# API Endpoint Implementation Plan: POST /api/generations/{generationId}/candidates/{id}/reject

## 1. Przegląd punktu końcowego
Ten endpoint służy do odrzucenia pojedynczej karty kandydata. Odrzucenie powoduje zmianę statusu kandydata na 'rejected', co oznacza, że nie zostanie on przekształcony w fiszkę. Odrzucone kandydaty mogą być wykorzystane do analityki i poprawy jakości generacji AI.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/generations/{generationId}/candidates/{id}/reject`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `generationId` (number) - ID generacji
  - Wymagane: `id` (number) - ID karty kandydata
- Request Body: brak
- Query Parameters: brak

## 3. Wykorzystywane typy
- DTO:
  - `CandidateCardDTO` (Tables<"candidate_cards">)

## 4. Szczegóły odpowiedzi
- 200 OK
- Response Body:
  ```json
  {
    "candidate_card": {
      "id": 1,
      "user_id": "uuid",
      "generation_id": 1,
      "front": "string",
      "back": "string",
      "status": "rejected",
      "expires_at": "timestamp",
      "created_at": "timestamp"
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format ID lub kandydat już przetworzony (zaakceptowany/odrzucony)
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: kandydat o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametrów `generationId` i `id` z `context.params`.
3. Konwersja na liczby i sprawdzenie poprawności.
4. Wywołanie serwisu: `candidateService.rejectCandidate(userId, generationId, candidateId)`.
5. W serwisie:
   - Pobranie kandydata z tabeli `candidate_cards` (.eq('id', candidateId).eq('user_id', userId).eq('generation_id', generationId).single()).
   - Sprawdzenie czy status === 'pending' (jeśli nie, zwrócić błąd 400).
   - Aktualizacja statusu kandydata na 'rejected'.
   - Pobranie zaktualizowanego rekordu.
6. Zwrócenie zaktualizowanego kandydata.
7. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może modyfikować tylko swoje kandydaty.
- Walidacja statusu: odrzucenie możliwe tylko dla kandydatów 'pending'.
- Walidacja przynależności: kandydat musi należeć do podanej generacji i użytkownika.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format ID             | 400   | ID nie jest liczbą                                          |
| Kandydat już przetworzony           | 400   | Status nie jest 'pending' (już zaakceptowany/odrzucony)     |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Kandydat nie istnieje               | 404   | Brak rekordu dla podanych ID i user_id                      |
| Błąd przy zapisie do DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Pojedyncze zapytanie do pobrania i weryfikacji kandydata.
- Pojedyncze zapytanie update.
- Wykorzystanie indeksów:
  - `candidate_cards(user_id, status)` - szybkie filtrowanie
  - `candidate_cards(generation_id)` - szybkie filtrowanie po generacji
- Operacja jest szybka i nie wymaga transakcji (brak powiązanych aktualizacji).

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations/[generationId]/candidates/[id]/reject.ts`.
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zaimportować middleware uwierzytelniania.
4. W handlerze:
   - Wyciągnąć `generationId` i `id` z `context.params`.
   - Zwalidować oba parametry (parseInt, sprawdzenie NaN).
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/candidateService.ts` napisać funkcję `rejectCandidate(userId: string, generationId: number, candidateId: number)`:
   - Pobrać kandydata: `.select('*').eq('id', candidateId).eq('user_id', userId).eq('generation_id', generationId).single()`.
   - Sprawdzić czy istnieje (404 jeśli nie).
   - Sprawdzić status === 'pending' (400 jeśli nie).
   - Update: `.update({ status: 'rejected' }).eq('id', candidateId).select().single()`.
   - Zwrócić zaktualizowany rekord.
6. Obsłużyć błędy z odpowiednimi kodami HTTP.
7. Zwrócić odpowiedź 200 z zaktualizowanym kandydatem.
8. Napisać testy integracyjne (happy path, duplicate reject, 404, unauthorized).
9. Opcjonalnie: rozważyć event tracking dla odrzuceń (analytics).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

