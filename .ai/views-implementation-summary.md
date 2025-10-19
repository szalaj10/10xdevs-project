# Podsumowanie planów implementacji widoków

## Przegląd
Dokument zawiera listę wszystkich planów implementacji widoków dla aplikacji fiszek AI. Każdy plan jest szczegółowym przewodnikiem dla programisty frontendowego, zawierającym strukturę komponentów, typy, zarządzanie stanem, integrację API, walidację i kroki implementacji.

## Lista planów implementacji

### 1. Widok Strony Głównej (Home)
**Plik:** `.ai/home-view-implementation-plan.md`  
**Ścieżka:** `/`  
**Opis:** Strona główna aplikacji z powitalnym dashboard, szybkimi akcjami (generuj fiszki, przeglądaj, rozpocznij naukę) i statystykami użytkownika (liczba fiszek, karty do powtórki, streak).  
**Kluczowe komponenty:**
- WelcomeSection
- QuickActions (ActionCard)
- UserStats (StatCard)
- EmptyState (dla nowych użytkowników)

**Endpointy API:**
- GET `/api/users/stats` (do stworzenia)

---

### 2. Widok Logowania i Rejestracji
**Plik:** `.ai/login-view-implementation-plan.md`  
**Ścieżka:** `/login`, `/register`, `/reset-password`  
**Opis:** Uwierzytelnianie użytkownika przez Supabase Auth (logowanie, rejestracja, reset hasła).  
**Kluczowe komponenty:**
- AuthPage (zarządza trybami: login/register/reset)
- LoginForm
- RegisterForm
- ResetPasswordForm
- SuccessMessage

**Integracja:**
- Supabase Auth API (signInWithPassword, signUp, resetPasswordForEmail)

---

### 3. Widok Generowania Fiszek
**Plik:** `.ai/generations-view-implementation-plan.md`  
**Ścieżka:** `/generate/new`  
**Opis:** Formularz wpisania tematu i wywołania generacji AI.  
**Kluczowe komponenty:**
- GeneratePage
- TopicForm (Textarea + Button)
- LoadingIndicator
- ErrorMessage

**Endpointy API:**
- POST `/api/generations`

---

### 4. Widok Recenzji Kandydatów
**Plik:** `.ai/review-candidates-view-implementation-plan.md`  
**Ścieżka:** `/generate/:id/review`  
**Opis:** Przegląd i akceptacja/edycja/odrzucenie wygenerowanych propozycji fiszek.  
**Kluczowe komponenty:**
- ReviewCandidatesPage
- GenerationHeader (z akcjami zbiorczymi)
- CandidatesList
- CandidateCard (z inline edit, accept, reject)

**Endpointy API:**
- GET `/api/generations/:id`
- POST `/api/generations/:generationId/candidates/:id/accept`
- POST `/api/generations/:generationId/candidates/:id/reject`
- PATCH `/api/generations/:generationId/candidates/:id`
- POST `/api/generations/:generationId/candidates/accept-bulk`

---

### 5. Widok Listy Fiszek
**Plik:** `.ai/flashcards-list-view-implementation-plan.md`  
**Ścieżka:** `/flashcards`  
**Opis:** Lista wszystkich fiszek użytkownika z wyszukiwaniem, sortowaniem, paginacją, oraz możliwością dodawania, edycji i usuwania.  
**Kluczowe komponenty:**
- FlashcardsListPage
- PageHeader (SearchInput, SortSelect, Button "Dodaj")
- FlashcardsList (FlashcardItem)
- AddFlashcardDialog
- EditFlashcardDialog
- ConfirmDialog (delete)
- Pagination

**Endpointy API:**
- GET `/api/flashcards` (z query params: search, sort, page, limit)
- POST `/api/flashcards` (single/bulk)
- PATCH `/api/flashcards/:id`
- DELETE `/api/flashcards/:id`

---

### 6. Widok Sesji Nauki (SRS)
**Plik:** `.ai/session-study-view-implementation-plan.md`  
**Ścieżka:** `/sessions`, `/sessions/:id`  
**Opis:** Sesja powtórek SRS z wyświetlaniem fiszek, odkrywaniem odpowiedzi i oceną trudności (trudne/normalne/łatwe). Interwały: trudne = dziś, normalne = +2 dni, łatwe = +4 dni.  
**Kluczowe komponenty:**
- SessionStudyPage
- SessionStart (stats + przycisk start)
- SessionActive (ProgressBar, FlashcardView, RatingButtons)
- FlashcardView (front/back, przycisk "Pokaż odpowiedź")
- RatingButtons (3 przyciski oceny)

**Endpointy API:**
- GET `/api/sessions/stats` (do stworzenia)
- POST `/api/sessions` (do stworzenia)
- GET `/api/sessions/:id` (do stworzenia)
- POST `/api/sessions/:id/items` (do stworzenia)
- PATCH `/api/sessions/:id` (do stworzenia)

**Keyboard shortcuts:**
- Spacja → odkryj back
- 1/2/3 → rate trudne/normalne/łatwe

---

### 7. Widok Podsumowania Sesji
**Plik:** `.ai/session-summary-view-implementation-plan.md`  
**Ścieżka:** `/sessions/:id/summary`  
**Opis:** Podsumowanie zakończonej sesji ze statystykami (czas, liczba kart, rozkład ocen, harmonogram powtórek).  
**Kluczowe komponenty:**
- SessionSummaryPage
- SummaryHeader (tytuł + emoji sukcesu)
- SessionStats (StatCard, RatingDistribution)
- UpcomingReviews (ReviewSchedule)
- ActionButtons ("Nowa sesja", "Zobacz fiszki")

**Endpointy API:**
- GET `/api/sessions/:id`
- GET `/api/sessions/upcoming-reviews` (opcjonalnie, do stworzenia)

---

## Kolejność implementacji (zalecana)

### Etap 1: Uwierzytelnianie i podstawy
1. **Login View** - aby użytkownicy mogli się logować
2. **Home View** - strona główna po zalogowaniu
3. **Middleware** - ochrona chronionych stron, przekierowanie do login

### Etap 2: Generowanie fiszek (TTFD < 5 min)
4. **Generate View** - formularz generowania
5. **Review Candidates View** - recenzja propozycji AI
6. **Flashcards List View** - przegląd utworzonych fiszek (+ add/edit)

### Etap 3: System powtórek SRS
7. **Session Study View** - sesja nauki z oceną fiszek
8. **Session Summary View** - podsumowanie sesji

## Globalne komponenty (współdzielone)

### NavBar
- Logo/brand
- Nawigacja: Home, Fiszki, Sesje, Profil
- Wylogowanie
- Responsywny (hamburger menu na mobile)

### Layout
- Główny layout z NavBar
- Container dla content
- Footer (opcjonalnie)

### UI Components (shadcn/ui)
Wykorzystywane w wielu widokach:
- Button
- Input / Textarea
- Dialog / AlertDialog
- Card
- Select
- Progress
- Skeleton
- Alert

## Wymagane typy (src/types.ts)

### Już zdefiniowane:
- `GenerationDTO`, `CandidateCardDTO`, `CreateGenerationDTO`, `GetGenerationResponseDTO`
- `FlashcardDTO`, `CreateFlashcardDTO`, `EditFlashcardDTO`, `ListFlashcardsQueryDTO`, `ListFlashcardsResponseDTO`
- `EventDTO`, `CreateEventDTO`, `ListEventsQueryDTO`
- `GenerationErrorLogDTO`, `CreateGenerationErrorLogDTO`
- `EditCandidateCardDTO`, `BulkAcceptCandidateCardsDTO`

### Do dodania:
- `SessionDTO`, `SessionItemDTO`, `CreateSessionDTO`, `CreateSessionItemDTO`, `UpdateSessionDTO`
- `CreateSessionResponseDTO`, `SessionStatsDTO`, `CreateSessionItemResponseDTO`
- `UserStatsDTO` (dla home view)
- `ActivityItemDTO` (opcjonalnie dla home view)

## Wymagane endpointy API (do stworzenia)

### Sesje:
- GET `/api/sessions/stats` - statystyki przed rozpoczęciem sesji (due/new count)
- POST `/api/sessions` - utworzenie nowej sesji, zwraca listę fiszek do nauki
- GET `/api/sessions/:id` - szczegóły sesji (fiszki, oceny)
- POST `/api/sessions/:id/items` - zapisanie oceny fiszki w sesji
- PATCH `/api/sessions/:id` - aktualizacja sesji (ended_at)
- GET `/api/sessions/upcoming-reviews` - harmonogram powtórek (opcjonalnie)

### Użytkownicy:
- GET `/api/users/stats` - statystyki użytkownika (totalFlashcards, dueToday, streak)
- GET `/api/users/activities` - ostatnie aktywności (opcjonalnie)

## Notatki implementacyjne

### Dostępność (A11y)
Wszystkie widoki muszą spełniać:
- ARIA labels i roles
- Focus management (trap focus w dialogach)
- Keyboard navigation (tab order, shortcuts w sesji)
- ARIA-live regions dla błędów i komunikatów
- Semantic HTML

### Walidacja
- Frontend: walidacja inline przed wysłaniem do API
- Backend: walidacja przez Zod schemas
- Mapowanie błędów Zod na przyjazne komunikaty użytkownika

### Obsługa błędów
Wspólne kody błędów we wszystkich widokach:
- 401 → przekierowanie do `/login`
- 400 → wyświetlenie szczegółów walidacji
- 404 → komunikat "Nie znaleziono"
- 500 → komunikat ogólny + opcja retry

### Responsywność
- Mobile-first design
- Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- Hamburger menu na mobile w NavBar
- Grid layouts: 1 kolumna mobile, 2-3 kolumny desktop

### Analityka
Zdarzenia do logowania (POST `/api/events`):
- `view_home`, `view_generate`, `view_flashcards`, `view_session`, `view_summary`
- `generation_started`, `generation_completed`, `candidate_accepted`, `candidate_rejected`
- `flashcard_created`, `flashcard_edited`, `flashcard_deleted`
- `session_started`, `session_completed`, `flashcard_rated`
- `login_success`, `register_success`, `reset_password_request`

### Stylowanie
- Tailwind CSS 4 (zgodnie z tech stack)
- Shadcn/ui komponenty (variant "new-york", color "neutral")
- Zmienne CSS dla motywu (light/dark mode w przyszłości)
- Konsystentne spacing, typography, colors

## Wsparcie dla programistów

Każdy plan implementacji zawiera:
1. **Przegląd** - cel widoku
2. **Routing** - ścieżki URL
3. **Struktura komponentów** - drzewo komponentów
4. **Szczegóły komponentów** - props, zdarzenia, walidacja, typy
5. **Typy** - szczegółowe definicje TypeScript
6. **Zarządzanie stanem** - hooks, state management
7. **Integracja API** - endpointy, request/response types
8. **Interakcje użytkownika** - przepływy UX
9. **Warunki i walidacja** - reguły walidacji frontend/backend
10. **Obsługa błędów** - scenariusze i handling
11. **Kroki implementacji** - checklist do realizacji

## Status implementacji

- [x] Home View - plan gotowy
- [x] Login View - plan gotowy
- [x] Generate View - plan gotowy
- [x] Review Candidates View - plan gotowy
- [x] Flashcards List View - plan gotowy
- [x] Session Study View - plan gotowy
- [x] Session Summary View - plan gotowy
- [ ] Implementacja widoków - do wykonania
- [ ] Implementacja brakujących endpointów API - do wykonania
- [ ] Testy E2E - do wykonania

## Następne kroki

1. Przejrzeć wszystkie plany implementacji
2. Zaimplementować brakujące endpointy API (sesje, users/stats)
3. Dodać brakujące typy do `src/types.ts`
4. Rozpocząć implementację widoków zgodnie z kolejnością w sekcji "Kolejność implementacji"
5. Testować każdy widok po implementacji
6. Upewnić się, że dostępność (A11y) i responsywność są spełnione
7. Dodać logowanie zdarzeń analitycznych
8. Review code i optymalizacja

## Kontakt i wsparcie

W przypadku pytań lub niejasności dotyczących planów implementacji:
- Sprawdź odpowiedni plik `.md` w folderze `.ai/`
- Przejrzyj PRD (`.ai/prd.md`), UI Plan (`.ai/ui-plan.md`), API Plan (`.ai/api-plan.md`)
- Przejrzyj istniejące implementacje jako wzorzec (np. `generations-view-implementation-plan.md`)


