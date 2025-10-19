# API Endpoint Implementation Plan: GET /api/events

## 1. Przegląd punktu końcowego
Ten endpoint służy do pobrania listy zdarzeń (events) z systemu analitycznego. Wspiera zaawansowane filtrowanie po typie zdarzenia, użytkowniku, fiszce, oraz zakresie czasowym. Używany głównie do analityki, raportowania i monitorowania aktywności użytkowników.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Ścieżka: `/api/events`
- Autoryzacja: wymagane uwierzytelnienie przez Supabase Auth (middleware sprawdza sesję)
- Parametry URL: brak
- Request Body: brak
- Query Parameters:
  - Opcjonalne: `event_type` (string) - filtrowanie po typie zdarzenia (np. 'card_viewed', 'card_edited')
  - Opcjonalne: `user_id` (uuid string) - filtrowanie po użytkowniku (tylko dla adminów, normalnie zawsze current user)
  - Opcjonalne: `flashcard_id` (number) - filtrowanie po konkretnej fiszce
  - Opcjonalne: `from` (ISO datetime string) - początek zakresu czasowego
  - Opcjonalne: `to` (ISO datetime string) - koniec zakresu czasowego
  - Opcjonalne: `page` (number) - numer strony, domyślnie 1
  - Opcjonalne: `limit` (number) - liczba wyników na stronę, domyślnie 50, max 200

## 3. Wykorzystywane typy
- Query: `ListEventsQueryDTO` ({ event_type?: string; user_id?: string; flashcard_id?: number; from?: string; to?: string; page?: number; limit?: number })
- DTO:
  - `EventDTO` (Tables<"events">)

## 4. Szczegóły odpowiedzi
- 200 OK
- Response Body:
  ```json
  {
    "events": [
      {
        "id": 1,
        "user_id": "uuid",
        "flashcard_id": 1,
        "event_type": "card_viewed",
        "metadata": { "duration_ms": 5000 },
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "totalPages": 20
    }
  }
  ```
- Kody błędów:
  - 400 Bad Request: nieprawidłowe parametry query (np. invalid datetime, limit > 200)
  - 401 Unauthorized: brak lub nieważna sesja
  - 403 Forbidden: próba dostępu do wydarzeń innego użytkownika (jeśli user_id != current user)
  - 500 Internal Server Error: błędy DB

## 5. Przepływ danych
1. Middleware Astro: weryfikacja sesji, dołączenie `supabase` i `user.id` w `context.locals`.
2. Parsowanie query parameters z `context.url.searchParams`.
3. Walidacja parametrów przy użyciu Zod (`ListEventsQuerySchema`):
   - Konwersja stringów na odpowiednie typy.
   - Walidacja formatów datetime (ISO 8601).
   - Walidacja zakresu wartości.
   - Ustawienie wartości domyślnych.
4. Sprawdzenie uprawnień: jeśli `user_id` w query != current user -> zwrócić 403 (MVP, bez ról admin).
5. Wywołanie serwisu: `eventService.listEvents(userId, queryParams)`.
6. W serwisie:
   - Budowanie query do tabeli `events` z filtrem na `user_id`.
   - Zastosowanie filtrów opcjonalnych:
     - `event_type`: `.eq('event_type', queryParams.event_type)`
     - `flashcard_id`: `.eq('flashcard_id', queryParams.flashcard_id)`
     - `from`: `.gte('created_at', queryParams.from)`
     - `to`: `.lte('created_at', queryParams.to)`
   - Sortowanie według `created_at DESC`.
   - Zastosowanie paginacji: `.range(from, to)`.
   - Osobne query dla zliczenia total z tymi samymi filtrami.
7. Zwrócenie listy wydarzeń i danych paginacji.
8. Mapowanie wyników do DTO i zwrócenie odpowiedzi 200.

## 6. Względy bezpieczeństwa
- RLS: polityki zapewniają, że użytkownik widzi tylko swoje wydarzenia.
- Walidacja user_id: blokada dostępu do wydarzeń innych użytkowników (MVP).
- Walidacja datetime: sprawdzenie formatów i zakresu (np. from <= to).
- Limit max: ograniczenie do 200 events per request dla ochrony przed abuse.
- Indeksowanie dla wydajności filtrowania (user_id, created_at, event_type).
- Supabase Auth: HTTP-only cookies.

## 7. Obsługa błędów
| Scenario                            | Kod   | Opis                                                         |
|-------------------------------------|-------|--------------------------------------------------------------|
| Nieprawidłowe parametry query       | 400   | Zod zwraca szczegóły walidacji                              |
| Nieprawidłowy format datetime       | 400   | from/to nie są w formacie ISO 8601                          |
| from > to                           | 400   | Zakres czasowy jest nieprawidłowy                           |
| Limit przekracza 200                | 400   | Limit musi być <= 200                                       |
| Brak lub nieważna sesja             | 401   | Middleware odrzuca request                                   |
| Dostęp do wydarzeń innego user      | 403   | user_id w query != current user (MVP)                       |
| Błąd przy odczycie z DB             | 500   | Logowanie błędu i zwrócenie ogólnego komunikatu             |

## 8. Wydajność
- Wykorzystanie indeksów:
  - `events(user_id, created_at)` - szybkie filtrowanie i sortowanie
  - `events(event_type)` - szybkie filtrowanie po typie (opcjonalnie)
  - `events(flashcard_id)` - szybkie filtrowanie po fiszce (opcjonalnie)
  - `events(metadata)` GIN - szybkie zapytania po metadanych JSONB
- Paginacja server-side dla uniknięcia przesyłania dużych zbiorów.
- Partycjonowanie tabeli events po created_at dla bardzo dużych wolumenów (przyszłość).
- Cache dla popularnych zapytań analitycznych (Redis).
- Limit max 200 dla przewidywalności wydajności.

## 9. Kroki implementacji
1. Utworzyć plik `src/pages/api/events/index.ts` (lub `src/pages/api/events.ts`).
2. Dodać `export const prerender = false;` i HTTP GET handler.
3. Zaimportować middleware uwierzytelniania.
4. Zdefiniować Zod schema: `ListEventsQuerySchema`:
   ```ts
   z.object({
     event_type: z.string().optional(),
     user_id: z.string().uuid().optional(),
     flashcard_id: z.coerce.number().int().positive().optional(),
     from: z.string().datetime().optional(),
     to: z.string().datetime().optional(),
     page: z.coerce.number().int().positive().default(1),
     limit: z.coerce.number().int().positive().max(200).default(50)
   }).refine(data => !data.from || !data.to || new Date(data.from) <= new Date(data.to), {
     message: "from must be before or equal to to"
   })
   ```
5. W handlerze:
   - Wyciągnąć query parameters z `context.url.searchParams`.
   - Sparsować używając Zod schema.
   - Wyciągnąć `userId` z `context.locals.user.id`.
   - Sprawdzić: jeśli `query.user_id` i `query.user_id !== userId` -> zwrócić 403.
6. W `src/lib/services/eventService.ts` napisać funkcję `listEvents(userId: string, query: ListEventsQueryDTO)`:
   - Rozpocząć query: `supabase.from('events').select('*', { count: 'exact' }).eq('user_id', userId)`.
   - Zastosować filtry opcjonalne:
     - Jeśli `query.event_type`: `.eq('event_type', query.event_type)`.
     - Jeśli `query.flashcard_id`: `.eq('flashcard_id', query.flashcard_id)`.
     - Jeśli `query.from`: `.gte('created_at', query.from)`.
     - Jeśli `query.to`: `.lte('created_at', query.to)`.
   - Dodać sortowanie: `.order('created_at', { ascending: false })`.
   - Dodać paginację: `.range((query.page-1)*query.limit, query.page*query.limit-1)`.
   - Wykonać query i pobrać `data` i `count`.
   - Przygotować obiekt paginacji: `{ page, limit, total: count, totalPages: Math.ceil(count/limit) }`.
   - Zwrócić `{ events: data, pagination }`.
7. Obsłużyć błędy z odpowiednimi kodami HTTP.
8. Zwrócić odpowiedź 200 z listą wydarzeń i paginacją.
9. Napisać testy integracyjne (happy path, filters, date range, pagination, 403).
10. Dodać dokumentację w README lub OpenAPI spec (opcjonalnie).

