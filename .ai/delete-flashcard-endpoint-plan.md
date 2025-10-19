# API Endpoint Implementation Plan: DELETE /api/flashcards/{id}

## 1. Przegląd punktu końcowego
Ten endpoint służy do usunięcia pojedynczej fiszki. Operacja jest nieodwracalna i usuwa fiszkę wraz z wszystkimi powiązanymi danymi (np. event logs przez CASCADE). Przed usunięciem weryfikowana jest przynależność fiszki do użytkownika.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- Ścieżka: `/api/flashcards/{id}`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL:
  - Wymagane: `id` (number) - ID fiszki
- Request Body: brak
- Query Parameters: brak

## 3. Wykorzystywane typy
- Brak specjalnych typów DTO (operacja usuwania zwraca 204 No Content)

## 4. Szczegóły odpowiedzi
- 204 No Content (sukces, brak body w odpowiedzi)
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format ID (nie jest liczbą)
  - 401 Unauthorized: brak lub nieważna sesja
  - 404 Not Found: fiszka o podanym ID nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Wyciągnięcie i walidacja parametru `id` z `context.params`.
3. Konwersja `id` na liczbę i sprawdzenie czy jest prawidłowe.
4. Wywołanie serwisu: `flashcardService.deleteFlashcard(userId, flashcardId)`.
5. W serwisie:
   - Pobranie fiszki z weryfikacją przynależności (.eq('id', flashcardId).eq('user_id', userId).single()).
   - Sprawdzenie czy fiszka istnieje (404 jeśli nie).
   - Delete z tabeli `flashcards` (.eq('id', flashcardId).eq('user_id', userId).delete()).
   - Weryfikacja czy delete był successful (affected rows > 0).
6. Zwrócenie pustej odpowiedzi.
7. Zwrócenie odpowiedzi 204 No Content.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik może usuwać tylko swoje fiszki.
- Walidacja ID: sprawdzenie czy parametr jest prawidłową liczbą.
- Filtrowanie po `user_id`: zawsze weryfikować przynależność zasobu.
- CASCADE delete: powiązane rekordy (events, session_items) będą automatycznie usunięte.
- Soft delete (opcjonalnie): rozważyć flagę `deleted_at` zamiast hard delete dla możliwości przywrócenia.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format ID             | 400   | ID nie jest liczbą lub jest ujemne                          |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Fiszka nie istnieje                 | 404   | Brak rekordu dla podanego ID i user_id                      |
| Błąd przy usuwaniu z DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Wykorzystanie primary key index dla szybkiego lookup po ID.
- Pojedyncze zapytanie do weryfikacji + pojedyncze delete.
- CASCADE delete dla powiązanych rekordów (automatyczne przez DB).
- Opcjonalnie: batch delete endpoint dla usuwania wielu fiszek jednocześnie.

## 9. Kroki implementacji
1. Plik `src/pages/api/flashcards/[id].ts` już istnieje (GET i PATCH handlers).
2. Dodać HTTP DELETE handler w tym samym pliku.
3. W DELETE handlerze:
   - Wyciągnąć `id` z `context.params.id`.
   - Zwalidować czy `id` jest prawidłową liczbą (parseInt, sprawdzenie NaN).
   - Wyciągnąć `userId` z `context.locals.user.id`.
4. W `src/lib/services/flashcardService.ts` napisać funkcję `deleteFlashcard(userId: string, flashcardId: number)`:
   - Pobrać fiszkę dla weryfikacji: `.select('id').eq('id', flashcardId).eq('user_id', userId).single()`.
   - Sprawdzić czy istnieje (404 jeśli nie).
   - Delete: `supabase.from('flashcards').delete().eq('id', flashcardId).eq('user_id', userId)`.
   - Sprawdzić `error` i obsłużyć.
   - Zwrócić void lub success indicator.
5. W handlerze wywołać `deleteFlashcard`, obsłużyć błędy.
6. Zwrócić odpowiedź 204 No Content (bez body).
7. Napisać testy integracyjne (happy path, 404, unauthorized, cascade delete verification).
8. Opcjonalnie: rozważyć soft delete (dodanie pola `deleted_at` i filtrowanie w queries).
9. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

