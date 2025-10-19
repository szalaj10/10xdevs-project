# API Endpoint Implementation Plan: POST /api/events

## 1. Przegląd punktu końcowego
Ten endpoint służy do rejestrowania zdarzeń użytkownika w systemie analitycznym. Używany do trackowania interakcji użytkownika z aplikacją, takich jak przeglądanie kart, edycje, sesje nauki, etc. Dane te są wykorzystywane do analityki i optymalizacji UX.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/events`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Request Body:
  ```json
  {
    "event_type": "card_viewed",
    "flashcard_id": 123,
    "metadata": {
      "duration_ms": 5000,
      "device": "mobile"
    }
  }
  ```
- Parametry body:
  - Wymagane: `event_type` (string) - typ zdarzenia
  - Opcjonalne: `flashcard_id` (number) - ID powiązanej fiszki
  - Opcjonalne: `metadata` (object) - dodatkowe dane w formacie JSON

## 3. Wykorzystywane typy
- Command: `CreateEventDTO` (Omit<TablesInsert<"events">, "id" | "created_at" | "user_id">)
- DTO:
  - `EventDTO` (Tables<"events">)

## 4. Szczegóły odpowiedzi
- 201 Created
- Response Body:
  ```json
  {
    "event": {
      "id": 1,
      "user_id": "uuid",
      "flashcard_id": 123,
      "event_type": "card_viewed",
      "metadata": { "duration_ms": 5000 },
      "created_at": "timestamp"
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowy format danych, brakujący event_type
  - 401 Unauthorized: brak lub nieważna sesja
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Parsowanie i walidacja body przy użyciu Zod (`CreateEventCommandSchema`).
3. Wywołanie serwisu: `eventService.createEvent(userId, eventData)`.
4. W serwisie:
   - Przygotowanie danych do insert (dodanie user_id z context).
   - Opcjonalna walidacja flashcard_id (czy fiszka istnieje i należy do użytkownika).
   - Insert do tabeli `events`.
   - Pobranie utworzonego rekordu.
5. Zwrócenie utworzonego wydarzenia.
6. Mapowanie wyniku do DTO i zwrócenie odpowiedzi 201.

## 6. Względy bezpieczeństwa
- RLS: user_id jest automatycznie ustawiany na zalogowanego użytkownika.
- Walidacja event_type: opcjonalnie enum dla dozwolonych typów.
- Walidacja flashcard_id: sprawdzenie przynależności fiszki do użytkownika.
- Walidacja metadata: limit rozmiaru JSON (np. max 10KB).
- Rate limiting: ograniczenie liczby eventów per user per minute.
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowy format danych         | 400   | Zod zwraca szczegóły walidacji                              |
| Brakujący event_type                | 400   | event_type jest wymagane                                    |
| Metadata zbyt duże                  | 400   | Metadata przekracza dozwolony rozmiar                       |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Błąd przy zapisie do DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Asynchroniczne logowanie (fire-and-forget) dla nie blokowania UI.
- Batch insert dla wielu eventów jednocześnie (opcjonalnie).
- Indeksy:
  - `events(user_id, created_at)` - szybkie zapytania analityczne
  - `events(metadata)` GIN - szybkie wyszukiwanie w JSONB
- Partycjonowanie tabeli po created_at dla długoterminowego przechowywania.
- Queue system (np. RabbitMQ) dla high-volume scenarios.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/events/index.ts`.
2. Dodać `export const prerender = false;` i HTTP POST handler.
3. Zdefiniować Zod schema: `CreateEventCommandSchema`:
   ```ts
   z.object({
     event_type: z.string().min(1).max(100),
     flashcard_id: z.number().int().positive().optional(),
     metadata: z.record(z.any()).optional()
   })
   ```
4. W handlerze:
   - Sparsować body używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
5. W `src/lib/services/eventService.ts` napisać funkcję `createEvent(userId: string, data: CreateEventDTO)`:
   - Opcjonalnie: jeśli `data.flashcard_id`, zweryfikować przynależność fiszki.
   - Insert: `.insert({ ...data, user_id: userId }).select().single()`.
   - Zwrócić utworzone wydarzenie.
6. Obsłużyć błędy z odpowiednimi kodami HTTP.
7. Zwrócić odpowiedź 201 z utworzonym wydarzeniem.
8. Napisać testy integracyjne (happy path, validation, metadata).
9. Dodać dokumentację w README.

