# Plan implementacji widoku Sesji Nauki (SRS)

## 1. Przegląd
Widok umożliwia przeprowadzenie sesji powtórek zgodnie z systemem SRS (Spaced Repetition System). Użytkownik przegląda fiszki, ocenia ich trudność (trudne/normalne/łatwe), a system oblicza nowe interwały powtórek. Sesja składa się z maksymalnie 30 kart (80% due, 20% nowych, max 10 nowych). Widok rozpoczyna sesję przez POST `/api/sessions`, wyświetla kolejne fiszki, rejestruje oceny przez POST `/api/sessions/:id/items`, kończy sesję przez PATCH `/api/sessions/:id` i przekierowuje do podsumowania. Interwały: trudne = dziś ponownie, normalne = +2 dni, łatwe = +4 dni.

## 2. Routing widoku
Ścieżki: 
- `/sessions` - rozpoczęcie nowej sesji i widok aktywnej sesji
- `/sessions/:id` - kontynuacja lub podgląd konkretnej sesji

W `src/pages/sessions/index.astro` osadzić wyspę React:
```astro
---
import SessionStudyPage from '../../components/SessionStudyPage';
---
<SessionStudyPage client:load />
```

W `src/pages/sessions/[id]/index.astro`:
```astro
---
import SessionStudyPage from '../../../components/SessionStudyPage';
---
<SessionStudyPage client:load />
```

## 3. Struktura komponentów

SessionStudyPage  
├─ NavBar (globalny)  
├─ SessionStart (przed rozpoczęciem)  
│  ├─ SessionStats (dostępne karty due/new)  
│  └─ Button "Rozpocznij naukę"  
├─ SessionActive (podczas sesji)  
│  ├─ ProgressBar (current/total cards)  
│  ├─ FlashcardView  
│  │  ├─ CardFront (zawsze widoczny)  
│  │  ├─ CardBack (odkrywany po kliknięciu "Pokaż odpowiedź")  
│  │  └─ Button "Pokaż odpowiedź"  
│  └─ RatingButtons (pokazane po odkryciu back)  
│     ├─ Button "Trudne" (rating: -1)  
│     ├─ Button "Normalne" (rating: 0)  
│     └─ Button "Łatwe" (rating: 1)  
├─ LoadingIndicator  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### SessionStudyPage
- Opis: główny kontener widoku sesji, zarządza stanem sesji, fiszek do nauki, postępem i ocenami.
- Elementy: NavBar, SessionStart (lub SessionActive w zależności od stanu), LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onLoad → sprawdź, czy istnieje aktywna sesja (ID w URL lub w localStorage); jeśli nie, pokaż SessionStart.
  - onStartSession → POST `/api/sessions` → pobierz listę fiszek do nauki → rozpocznij sesję.
  - onRevealBack → ustaw stan `backRevealed` na true, pokaż RatingButtons.
  - onRate(rating) → POST `/api/sessions/:id/items` z flashcard_id i rating → przejdź do następnej karty.
  - Po ostatniej karcie → PATCH `/api/sessions/:id` z ended_at → redirect do `/sessions/:id/summary`.
- Walidacja: rating musi być -1, 0 lub 1.
- Typy używane:
  - `SessionDTO`
  - `SessionItemDTO`
  - `FlashcardDTO`
  - `CreateSessionDTO`
  - `CreateSessionItemDTO`
  - `SessionStudyVM` (ViewModel)
- Props: brak (pobiera ID z URL params lub tworzy nową sesję).

### SessionStart
- Opis: ekran startowy przed rozpoczęciem sesji, pokazuje statystyki dostępnych kart.
- Elementy:
  - `<div>`
    - `<h2>Gotowy do nauki?</h2>`
    - `<p>Karty do powtórki: {dueCount}</p>`
    - `<p>Nowe karty: {newCount}</p>`
    - `<p>Dzisiaj przejrzysz maksymalnie 30 kart (80% due, 20% nowych, max 10 nowych).</p>`
    - `<Button onClick={onStartSession}>Rozpocznij naukę</Button>`
  - `</div>`
- Zdarzenia:
  - onClick "Rozpocznij naukę" → wywołaj onStartSession.
- Walidacja: brak.
- Typy:
  - `number` (dueCount, newCount)
- Props:
  - `dueCount: number`
  - `newCount: number`
  - `onStartSession: () => void`
  - `loading: boolean`

### SessionActive
- Opis: aktywna sesja nauki z fiszkami i ocenami.
- Elementy: ProgressBar, FlashcardView, RatingButtons (jeśli back odkryty).
- Zdarzenia: brak (przekazuje callbacki do dzieci).
- Walidacja: brak.
- Typy:
  - `FlashcardDTO`
  - `number` (currentIndex, totalCards)
- Props:
  - `currentFlashcard: FlashcardDTO`
  - `currentIndex: number`
  - `totalCards: number`
  - `backRevealed: boolean`
  - `onRevealBack: () => void`
  - `onRate: (rating: -1 | 0 | 1) => void`

### ProgressBar
- Opis: pasek postępu sesji.
- Elementy:
  - `<div>`
    - `<progress value={currentIndex} max={totalCards} />`
    - `<span>{currentIndex} / {totalCards}</span>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy: `number`
- Props:
  - `currentIndex: number`
  - `totalCards: number`

### FlashcardView
- Opis: wyświetlanie fiszki (front zawsze widoczny, back odkrywany).
- Elementy:
  - `<div>`
    - `<div className="card-front">`
      - `<MarkdownRenderer content={front} />`
    - `</div>`
    - Jeśli `backRevealed`:
      - `<div className="card-back">`
        - `<MarkdownRenderer content={back} />`
      - `</div>`
    - Jeśli nie `backRevealed`:
      - `<Button onClick={onRevealBack}>Pokaż odpowiedź</Button>`
  - `</div>`
- Zdarzenia:
  - onClick "Pokaż odpowiedź" → wywołaj onRevealBack.
- Walidacja: brak.
- Typy:
  - `FlashcardDTO`
- Props:
  - `flashcard: FlashcardDTO`
  - `backRevealed: boolean`
  - `onRevealBack: () => void`

### RatingButtons
- Opis: przyciski oceny trudności fiszki (pokazane po odkryciu back).
- Elementy:
  - `<div>`
    - `<Button onClick={() => onRate(-1)} variant="destructive">Trudne</Button>`
    - `<span>Ponownie dziś</span>`
    - `<Button onClick={() => onRate(0)} variant="default">Normalne</Button>`
    - `<span>Za 2 dni</span>`
    - `<Button onClick={() => onRate(1)} variant="success">Łatwe</Button>`
    - `<span>Za 4 dni</span>`
  - `</div>`
- Zdarzenia:
  - onClick "Trudne" → wywołaj onRate(-1).
  - onClick "Normalne" → wywołaj onRate(0).
  - onClick "Łatwe" → wywołaj onRate(1).
- Walidacja: brak (wartości -1, 0, 1 są stałe).
- Typy: `-1 | 0 | 1`
- Props:
  - `onRate: (rating: -1 | 0 | 1) => void`
  - `disabled: boolean`

### LoadingIndicator
- Opis: pokazuje spinner podczas operacji API.
- Elementy: `<Spinner />`
- Zdarzenia: brak.
- Props: `loading: boolean`

### ErrorMessage
- Opis: region ARIA-live do komunikatów błędów.
- Elementy: `<div role="alert">{error}</div>`
- Zdarzenia: brak.
- Props: `error: string | null`

## 5. Typy

```ts
// DTO z backendu (do dodania w types.ts)
import type { Tables, TablesInsert } from "./db/database.types";

export type SessionDTO = Tables<"sessions">;
export type SessionItemDTO = Tables<"session_items">;
export type CreateSessionDTO = Omit<TablesInsert<"sessions">, "id" | "user_id" | "started_at" | "ended_at">;
export type CreateSessionItemDTO = Omit<TablesInsert<"session_items">, "id" | "session_id">;
export interface UpdateSessionDTO {
  ended_at?: string;
}

// Response types
export interface CreateSessionResponseDTO {
  session: SessionDTO;
  flashcards: FlashcardDTO[];
}

export interface SessionStatsDTO {
  dueCount: number;
  newCount: number;
}

export interface CreateSessionItemResponseDTO {
  session_item: SessionItemDTO;
  next_flashcard?: FlashcardDTO;
}

// ViewModel dla widoku sesji
interface SessionStudyVM {
  session: SessionDTO | null;
  flashcards: FlashcardDTO[];
  currentIndex: number;
  backRevealed: boolean;
  loading: boolean;
  error: string | null;
  stats: SessionStatsDTO | null;
}

// Stan sesji
type SessionState = "not_started" | "active" | "completed";
```

## 6. Zarządzanie stanem

W `SessionStudyPage` (React):
```ts
const { id: sessionIdParam } = useParams();
const navigate = useNavigate();

// Stan sesji
const [sessionState, setSessionState] = useState<SessionState>("not_started");
const [session, setSession] = useState<SessionDTO | null>(null);
const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
const [currentIndex, setCurrentIndex] = useState<number>(0);
const [backRevealed, setBackRevealed] = useState<boolean>(false);
const [stats, setStats] = useState<SessionStatsDTO | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Pobranie statystyk przed rozpoczęciem sesji
useEffect(() => {
  async function fetchStats() {
    try {
      const res = await fetch('/api/sessions/stats', {
        credentials: 'include'
      });
      if (res.status === 401) return navigate('/login');
      if (!res.ok) throw new Error('Błąd pobierania statystyk');
      const data: SessionStatsDTO = await res.json();
      setStats(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  
  if (!sessionIdParam && sessionState === "not_started") {
    fetchStats();
  }
}, [sessionIdParam, sessionState]);

// Załadowanie istniejącej sesji (jeśli ID w URL)
useEffect(() => {
  async function loadSession() {
    if (!sessionIdParam) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionIdParam}`, {
        credentials: 'include'
      });
      if (res.status === 401) return navigate('/login');
      if (res.status === 404) {
        setError('Sesja nie została znaleziona');
        return;
      }
      if (!res.ok) throw new Error('Błąd ładowania sesji');
      const data = await res.json();
      setSession(data.session);
      setFlashcards(data.flashcards);
      setSessionState(data.session.ended_at ? "completed" : "active");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  loadSession();
}, [sessionIdParam]);

// Rozpoczęcie nowej sesji
const handleStartSession = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({})
    });
    if (res.status === 401) return navigate('/login');
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd rozpoczęcia sesji');
    }
    const data: CreateSessionResponseDTO = await res.json();
    setSession(data.session);
    setFlashcards(data.flashcards);
    setSessionState("active");
    setCurrentIndex(0);
    setBackRevealed(false);
    // Opcjonalnie: aktualizuj URL do /sessions/:id
    navigate(`/sessions/${data.session.id}`, { replace: true });
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setLoading(false);
  }
};

// Odkrycie back
const handleRevealBack = () => {
  setBackRevealed(true);
};

// Ocena fiszki
const handleRate = async (rating: -1 | 0 | 1) => {
  if (!session) return;
  setLoading(true);
  setError(null);
  try {
    const currentFlashcard = flashcards[currentIndex];
    const res = await fetch(`/api/sessions/${session.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        flashcard_id: currentFlashcard.id,
        rating
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd zapisu oceny');
    }
    
    // Przejdź do następnej karty
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setBackRevealed(false);
    } else {
      // Zakończ sesję
      await endSession();
    }
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setLoading(false);
  }
};

// Zakończenie sesji
const endSession = async () => {
  if (!session) return;
  try {
    const res = await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ended_at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('Błąd zakończenia sesji');
    
    setSessionState("completed");
    navigate(`/sessions/${session.id}/summary`);
  } catch (e) {
    setError((e as Error).message);
  }
};

// Skróty klawiaturowe
useEffect(() => {
  if (sessionState !== "active") return;
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!backRevealed && e.key === ' ') {
      e.preventDefault();
      handleRevealBack();
    } else if (backRevealed) {
      if (e.key === '1') handleRate(-1);
      else if (e.key === '2') handleRate(0);
      else if (e.key === '3') handleRate(1);
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [sessionState, backRevealed, currentIndex]);
```

## 7. Integracja API

### GET /api/sessions/stats
- Request: brak
- Response (200):
  ```ts
  {
    dueCount: number;
    newCount: number;
  }
  ```
- Opis: zwraca liczbę dostępnych kart due i nowych przed rozpoczęciem sesji.
- Kody błędów: 401, 500.

### POST /api/sessions
- Request: `CreateSessionDTO` (pusty obiekt w MVP)
  ```ts
  {}
  ```
- Response (201): `CreateSessionResponseDTO`
  ```ts
  {
    session: SessionDTO;
    flashcards: FlashcardDTO[];  // maksymalnie 30 kart (80% due, 20% new, max 10 new)
  }
  ```
- Opis: tworzy nową sesję i zwraca listę fiszek do nauki (algorytm wyboru: 80% due, 20% new, limit 30 total, max 10 new).
- Kody błędów: 401, 400 → brak dostępnych kart, 500.

### GET /api/sessions/:id
- Request: brak
- Response (200):
  ```ts
  {
    session: SessionDTO;
    flashcards: FlashcardDTO[];
    session_items: SessionItemDTO[];  // dotychczasowe oceny
  }
  ```
- Opis: zwraca szczegóły sesji z fiszkami i ocenami (do kontynuacji lub podglądu).
- Kody błędów: 401, 404, 500.

### POST /api/sessions/:id/items
- Request: `CreateSessionItemDTO`
  ```ts
  {
    flashcard_id: number;
    rating: -1 | 0 | 1;
  }
  ```
- Response (201): `CreateSessionItemResponseDTO`
  ```ts
  {
    session_item: SessionItemDTO;
    next_flashcard?: FlashcardDTO;
  }
  ```
- Opis: zapisuje ocenę dla fiszki w sesji, aktualizuje interwał fiszki (due_at), opcjonalnie zwraca następną fiszkę.
- Kody błędów: 400 → walidacja rating, 401, 404, 500.

### PATCH /api/sessions/:id
- Request: `UpdateSessionDTO`
  ```ts
  {
    ended_at?: string;  // ISO datetime
  }
  ```
- Response (200):
  ```ts
  {
    session: SessionDTO;
  }
  ```
- Opis: aktualizuje sesję (głównie ended_at na zakończenie).
- Kody błędów: 400, 401, 404, 500.

## 8. Interakcje użytkownika

1. **Wejście na `/sessions`:**
   - Widok sprawdza, czy użytkownik ma aktywną sesję.
   - Jeśli nie: wyświetla SessionStart ze statystykami (due/new).
   - Jeśli tak: kontynuuje aktywną sesję lub przekierowuje do `/sessions/:id`.

2. **Rozpoczęcie sesji:**
   - Klik "Rozpocznij naukę" → POST `/api/sessions`.
   - Backend zwraca sesję z listą fiszek (max 30).
   - Wyświetlenie pierwszej fiszki (front).
   - ProgressBar pokazuje 1/N.

3. **Odkrycie odpowiedzi:**
   - Klik "Pokaż odpowiedź" (lub spacja na klawiaturze) → odkryj back.
   - Pokazanie RatingButtons.

4. **Ocena fiszki:**
   - Klik "Trudne" / "Normalne" / "Łatwe" (lub 1/2/3 na klawiaturze) → POST rating.
   - Backend aktualizuje due_at fiszki:
     - Trudne (-1): due_at = dziś (samo powtórzenie w tej samej sesji lub następna sesja tego dnia).
     - Normalne (0): due_at = dziś + 2 dni.
     - Łatwe (1): due_at = dziś + 4 dni.
   - Przejście do następnej fiszki, ProgressBar aktualizuje się.

5. **Ostatnia fiszka:**
   - Po ocenie ostatniej fiszki → PATCH `/api/sessions/:id` z ended_at.
   - Redirect do `/sessions/:id/summary`.

6. **Przerwanie sesji:**
   - Użytkownik może opuścić widok w dowolnym momencie.
   - Sesja pozostaje w stanie "active" (ended_at = null).
   - Użytkownik może wrócić do `/sessions/:id` i kontynuować.

## 9. Warunki i walidacja

### Walidacja frontendowa:
- **Rating:**
  - Wartości: -1 (trudne), 0 (normalne), 1 (łatwe).
  - Brak możliwości wysłania innej wartości (przyciski z fixed values).
- **Odkrycie back przed oceną:**
  - RatingButtons są disabled/niewidoczne, dopóki back nie jest odkryty.

### Walidacja backendowa:
- **Rating:**
  - Musi być -1, 0 lub 1.
  - Komunikat: "Rating musi być -1, 0 lub 1".
- **Flashcard_id:**
  - Musi istnieć i należeć do użytkownika.
  - Musi być w liście fiszek sesji.
- **Brak dostępnych kart:**
  - Jeśli użytkownik nie ma kart due ani nowych, POST `/api/sessions` zwraca 400.
  - Komunikat: "Brak kart do nauki. Dodaj nowe fiszki lub poczekaj na kolejne powtórki".

### Algorytm wyboru fiszek (backend):
1. Pobierz karty due (due_at <= dziś), sortowane po due_at ASC.
2. Pobierz karty nowe (nigdy nie ocenione lub due_at = null), losowo.
3. Wymieszaj: 80% due, 20% nowych.
4. Limit 30 kart total, maksymalnie 10 nowych.
5. Zwróć listę fiszek do sesji.

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Brak autoryzacji (401):**
   - Automatyczne przekierowanie do `/login`.

2. **Sesja nie znaleziona (404):**
   - Komunikat: "Sesja nie została znaleziona".
   - Opcja powrotu do `/sessions`.

3. **Brak kart do nauki (400):**
   - Komunikat: "Brak kart do nauki. Dodaj nowe fiszki lub poczekaj na kolejne powtórki".
   - Przycisk "Dodaj fiszki" → redirect do `/flashcards` lub `/generate/new`.

4. **Błąd walidacji rating (400):**
   - Komunikat: "Nieprawidłowa ocena. Spróbuj ponownie".

5. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem".
   - Opcja retry.

6. **Błąd serwera (500):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później".
   - Opcja retry.

7. **Sesja już zakończona:**
   - Jeśli użytkownik próbuje kontynuować zakończoną sesję (ended_at != null), przekieruj do summary.

### Handling w kodzie:
```ts
try {
  // operacja API
} catch (error) {
  if (error.response?.status === 401) {
    navigate('/login');
  } else if (error.response?.status === 404) {
    setError('Sesja nie została znaleziona');
  } else if (error.response?.status === 400) {
    const errorData = await error.response.json();
    if (errorData.error.includes('Brak kart')) {
      setError('Brak kart do nauki. Dodaj nowe fiszki!');
    } else {
      setError(errorData.error || 'Błąd walidacji');
    }
  } else {
    setError('Wystąpił nieoczekiwany błąd');
  }
}
```

## 11. Kroki implementacji

1. Dodać typy sesji do `src/types.ts`: `SessionDTO`, `SessionItemDTO`, `CreateSessionDTO`, `CreateSessionItemDTO`, `UpdateSessionDTO`, response types.
2. Utworzyć endpoints API (nie objęte tym planem, ale wymagane):
   - GET `/api/sessions/stats`
   - POST `/api/sessions`
   - GET `/api/sessions/:id`
   - POST `/api/sessions/:id/items`
   - PATCH `/api/sessions/:id`
3. Utworzyć `src/pages/sessions/index.astro`, osadzić `<SessionStudyPage client:load />`.
4. Utworzyć `src/pages/sessions/[id]/index.astro`, osadzić `<SessionStudyPage client:load />`.
5. W `src/components/SessionStudyPage.tsx` zainicjować stan: sessionState, session, flashcards, currentIndex, backRevealed, stats, loading, error.
6. Zaimplementować hook `useEffect` do:
   - Pobrania statystyk przed rozpoczęciem sesji.
   - Załadowania istniejącej sesji (jeśli ID w URL).
7. Zaimplementować komponenty potomne:
   - `SessionStart` z statystykami i przyciskiem start.
   - `SessionActive` jako kontener aktywnej sesji.
   - `ProgressBar` z current/total.
   - `FlashcardView` z front/back i przyciskiem "Pokaż odpowiedź".
   - `RatingButtons` z trzema przyciskami i opisami interwałów.
8. Dodać logikę `handleStartSession`: POST `/api/sessions`, ustaw state, navigate do `/sessions/:id`.
9. Dodać logikę `handleRevealBack`: ustaw backRevealed na true.
10. Dodać logikę `handleRate`: POST rating, przejdź do następnej karty lub zakończ sesję.
11. Dodać logikę `endSession`: PATCH ended_at, redirect do summary.
12. Zaimplementować skróty klawiaturowe:
    - Spacja → odkryj back.
    - 1/2/3 → rate trudne/normalne/łatwe.
13. Stylować komponenty używając Tailwind + shadcn/ui (Button, Progress).
14. Dodać walidację frontendową (rating, back revealed przed oceną).
15. Zaimplementować obsługę błędów: 401 → redirect, 404 → komunikat, 400 → brak kart, 500 → retry.
16. Dodać LoadingIndicator i ErrorMessage z ARIA-live.
17. Dodać MarkdownRenderer dla front/back (obsługa podstawowego Markdown).
18. Przetestować wszystkie ścieżki: start, reveal, rate, finish, błędy, keyboard shortcuts.
19. Upewnić się, że dostępność ARIA jest spełniona (aria-labels, roles, focus management).
20. Dodać logowanie zdarzeń analitycznych: start sesji, end sesji, rating.
21. Review code, poprawić lintery, commit.


