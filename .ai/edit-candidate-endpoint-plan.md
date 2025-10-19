# API Endpoint Implementation Plan: PATCH /api/generations/{generationId}/candidates/{id}

## 1. Przegląd punktu końcowego
Ten endpoint służy do edycji treści karty kandydata (front i back) przed jej zaakceptowaniem. Edycja jest możliwa tylko dla kandydatów w statusie 'pending'. Po edycji, kandydat pozostaje w statusie 'pending' i może zostać zaakceptowany, co utworzy fiszkę ze zmodyfikowaną treścią i oznaczy źródło jako 'ai_edited'.

## 2. Szczegóły żądania
- Metoda HTTP: PATCH
- Ścieżka: `/api/generations/{generationId}/candidates/{id}`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `generationId` (number) - ID generacji
  - Wymagane: `id` (number) - ID karty kandydata
- Request Body:
  ```json
  {
    "front": "string (max 200 chars)",
    "back": "string (max 350 chars)"
  }
  ```
- Parametry body:
  - Opcjonalne: `front` (string) - nowa treść przodu karty
  - Opcjonalne: `back` (string) - nowa treść tyłu karty
  - Przynajmniej jedno pole musi być podane
- Query Parameters: brak

## 3. Wykorzystywane typy
- Command: `EditCandidateCardDTO` (Pick<TablesUpdate<"candidate_cards">, "front" | "back">)
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
      "front": "updated front",
      "back": "updated back",
      "status": "pending",
      "expires_at": "timestamp",
      "created_at": "timestamp"
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format danych, przekroczenie limitu znaków, brak pól do aktualizacji, lub kandydat nie jest w statusie 'pending'
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: kandydat o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametrów `generationId` i `id` z `context.params`.
3. Parsowanie i walidacja body przy użyciu Zod (`EditCandidateCardCommandSchema`).
4. Sprawdzenie czy przynajmniej jedno pole (front lub back) jest podane.
5. Wywołanie serwisu: `candidateService.editCandidate(userId, generationId, candidateId, updateData)`.
6. W serwisie:
   - Pobranie kandydata z weryfikacją przynależności (.eq('id', candidateId).eq('user_id', userId).eq('generation_id', generationId).single()).
   - Sprawdzenie czy status === 'pending' (400 jeśli nie).
   - Przygotowanie danych do aktualizacji (tylko podane pola).
   - Update rekordu w `candidate_cards`.
   - Pobranie zaktualizowanego rekordu.
7. Zwrócenie zaktualizowanego kandydata.
8. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może modyfikować tylko swoje kandydaty.
- Walidacja długości: front max 200 chars, back max 350 chars.
- Walidacja statusu: edycja możliwa tylko dla kandydatów 'pending'.
- Walidacja przynależności: kandydat musi należeć do podanej generacji i użytkownika.
- Sanityzacja treści: filtrowanie niebezpiecznych znaków/skryptów.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format danych         | 400   | Zod zwraca szczegóły walidacji                              |
| Przekroczenie limitu znaków         | 400   | front > 200 lub back > 350 chars                            |
| Brak pól do aktualizacji            | 400   | Ani front, ani back nie zostały podane                      |
| Kandydat nie jest 'pending'         | 400   | Status jest 'accepted' lub 'rejected'                       |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Kandydat nie istnieje               | 404   | Brak rekordu dla podanych ID i user_id                      |
| Błąd przy zapisie do DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Pojedyncze zapytanie do pobrania i weryfikacji kandydata.
- Pojedyncze zapytanie update.
- Wykorzystanie indeksów:
  - `candidate_cards(user_id, status)` - szybkie filtrowanie
  - `candidate_cards(generation_id)` - szybkie filtrowanie po generacji
- Opcjonalnie: optimistic locking (wersjonowanie) dla konkurencyjnych edycji.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/generations/[generationId]/candidates/[id].ts`.
2. Dodać `export const prerender = false;` i HTTP PATCH handler.
3. Zaimportować middleware uwierzytelniania.
4. Zdefiniować Zod schema: `EditCandidateCardCommandSchema`:
   ```ts
   z.object({
     front: z.string().max(200).optional(),
     back: z.string().max(350).optional()
   }).refine(data => data.front !== undefined || data.back !== undefined, {
     message: "At least one field (front or back) must be provided"
   })
   ```
5. W handlerze:
   - Wyciągnąć `generationId` i `id` z `context.params` i zwalidować.
   - Sparsować body używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
6. W `src/lib/services/candidateService.ts` napisać funkcję `editCandidate(userId: string, generationId: number, candidateId: number, updateData: EditCandidateCardDTO)`:
   - Pobrać kandydata: `.select('*').eq('id', candidateId).eq('user_id', userId).eq('generation_id', generationId).single()`.
   - Sprawdzić czy istnieje (404 jeśli nie).
   - Sprawdzić status === 'pending' (400 jeśli nie).
   - Przygotować dane do update (tylko podane pola).
   - Update: `.update(updateData).eq('id', candidateId).select().single()`.
   - Zwrócić zaktualizowany rekord.
7. Obsłużyć błędy z odpowiednimi kodami HTTP.
8. Zwrócić odpowiedź 200 z zaktualizowanym kandydatem.
9. Napisać testy integracyjne (happy path, exceed limits, already accepted, empty body, 404).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

