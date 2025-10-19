# Plan implementacji widoku Podsumowania Sesji

## 1. Przegląd
Widok wyświetla podsumowanie zakończonej sesji nauki, prezentując statystyki: czas trwania sesji, liczbę przejrzanych kart (due/nowych), rozkład ocen (trudne/normalne/łatwe), następne terminy powtórek. Użytkownik może rozpocząć nową sesję lub wrócić do listy fiszek. Widok pobiera szczegóły sesji przez GET `/api/sessions/:id` i wyświetla zgromadzone dane z session_items.

## 2. Routing widoku
Ścieżka: `/sessions/:id/summary`

W `src/pages/sessions/[id]/summary.astro` osadzić wyspę React:
```astro
---
import SessionSummaryPage from '../../../components/SessionSummaryPage';
---
<SessionSummaryPage client:load />
```

## 3. Struktura komponentów

SessionSummaryPage  
├─ NavBar (globalny)  
├─ SummaryHeader  
│  ├─ Title "Sesja zakończona!"  
│  └─ Emoji/Icon (sukces)  
├─ SessionStats  
│  ├─ StatCard "Czas sesji"  
│  ├─ StatCard "Przejrzane karty"  
│  ├─ StatCard "Karty due"  
│  ├─ StatCard "Nowe karty"  
│  └─ RatingDistribution (wykres/lista trudne/normalne/łatwe)  
├─ UpcomingReviews  
│  ├─ ReviewSchedule "Dziś" (liczba kart)  
│  ├─ ReviewSchedule "Za 2 dni" (liczba kart)  
│  └─ ReviewSchedule "Za 4 dni" (liczba kart)  
├─ ActionButtons  
│  ├─ Button "Nowa sesja" → redirect do `/sessions`  
│  └─ Button "Zobacz fiszki" → redirect do `/flashcards`  
├─ LoadingIndicator  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### SessionSummaryPage
- Opis: główny kontener widoku podsumowania, pobiera dane sesji i oblicza statystyki.
- Elementy: NavBar, SummaryHeader, SessionStats, UpcomingReviews, ActionButtons, LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onLoad → GET `/api/sessions/:id` → pobierz sesję, fiszki, session_items.
  - onNewSession → redirect do `/sessions`.
  - onViewFlashcards → redirect do `/flashcards`.
- Walidacja: ID sesji musi być liczbą, sesja musi być zakończona (ended_at != null).
- Typy używane:
  - `SessionDTO`
  - `SessionItemDTO`
  - `FlashcardDTO`
  - `SessionSummaryVM` (ViewModel)
- Props: brak (pobiera ID z URL params).

### SummaryHeader
- Opis: nagłówek z tytułem i ikoną sukcesu.
- Elementy:
  - `<div>`
    - `<h1>Sesja zakończona!</h1>`
    - `<span>🎉</span>` (lub icon z biblioteki)
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy: brak.
- Props: brak.

### SessionStats
- Opis: kluczowe statystyki sesji w formie kart.
- Elementy:
  - `<div className="stats-grid">`
    - `<StatCard label="Czas sesji" value={duration} />`
    - `<StatCard label="Przejrzane karty" value={totalCards} />`
    - `<StatCard label="Karty due" value={dueCards} />`
    - `<StatCard label="Nowe karty" value={newCards} />`
    - `<RatingDistribution ratings={{ hard, normal, easy }} />`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string` (duration w formacie MM:SS)
  - `number` (totalCards, dueCards, newCards)
  - `{ hard: number, normal: number, easy: number }`
- Props:
  - `duration: string`
  - `totalCards: number`
  - `dueCards: number`
  - `newCards: number`
  - `ratings: { hard: number, normal: number, easy: number }`

### StatCard
- Opis: pojedyncza karta statystyki.
- Elementy:
  - `<div className="stat-card">`
    - `<p className="stat-label">{label}</p>`
    - `<p className="stat-value">{value}</p>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string` (label)
  - `string | number` (value)
- Props:
  - `label: string`
  - `value: string | number`

### RatingDistribution
- Opis: rozkład ocen (trudne/normalne/łatwe) w formie wykresu lub listy.
- Elementy:
  - `<div>`
    - `<h3>Rozkład ocen</h3>`
    - `<div className="rating-bar">`
      - `<div className="rating-item hard">`
        - `<span>Trudne</span>`
        - `<span>{hard} ({hardPercent}%)</span>`
      - `</div>`
      - `<div className="rating-item normal">`
        - `<span>Normalne</span>`
        - `<span>{normal} ({normalPercent}%)</span>`
      - `</div>`
      - `<div className="rating-item easy">`
        - `<span>Łatwe</span>`
        - `<span>{easy} ({easyPercent}%)</span>`
      - `</div>`
    - `</div>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `{ hard: number, normal: number, easy: number }`
- Props:
  - `ratings: { hard: number, normal: number, easy: number }`

### UpcomingReviews
- Opis: harmonogram najbliższych powtórek (ile kart przypada na poszczególne dni).
- Elementy:
  - `<div>`
    - `<h3>Najbliższe powtórki</h3>`
    - `<ReviewSchedule date="Dziś" count={todayCount} />`
    - `<ReviewSchedule date="Jutro" count={tomorrowCount} />`
    - `<ReviewSchedule date="Za 2 dni" count={in2DaysCount} />`
    - `<ReviewSchedule date="Za 3 dni" count={in3DaysCount} />`
    - `<ReviewSchedule date="Za 4 dni" count={in4DaysCount} />`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `{ [date: string]: number }` (mapa dat na liczby kart)
- Props:
  - `upcomingReviews: { today: number, tomorrow: number, in2Days: number, in3Days: number, in4Days: number }`

### ReviewSchedule
- Opis: pojedynczy wiersz harmonogramu powtórek.
- Elementy:
  - `<div className="review-schedule-item">`
    - `<span>{date}</span>`
    - `<span>{count} {count === 1 ? 'karta' : 'kart'}</span>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string` (date)
  - `number` (count)
- Props:
  - `date: string`
  - `count: number`

### ActionButtons
- Opis: przyciski akcji po zakończeniu sesji.
- Elementy:
  - `<div>`
    - `<Button onClick={onNewSession}>Nowa sesja</Button>`
    - `<Button onClick={onViewFlashcards} variant="outline">Zobacz fiszki</Button>`
  - `</div>`
- Zdarzenia:
  - onClick "Nowa sesja" → redirect do `/sessions`.
  - onClick "Zobacz fiszki" → redirect do `/flashcards`.
- Walidacja: brak.
- Typy: brak.
- Props:
  - `onNewSession: () => void`
  - `onViewFlashcards: () => void`

### LoadingIndicator
- Opis: pokazuje spinner podczas ładowania danych sesji.
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
// DTO z backendu (istniejące/dodane w types.ts)
import type { SessionDTO, SessionItemDTO, FlashcardDTO } from '@/types';

// Response z API
export interface GetSessionResponseDTO {
  session: SessionDTO;
  flashcards: FlashcardDTO[];
  session_items: SessionItemDTO[];
}

// ViewModel dla widoku podsumowania
interface SessionSummaryVM {
  session: SessionDTO;
  stats: SessionStatsVM;
  upcomingReviews: UpcomingReviewsVM;
  loading: boolean;
  error: string | null;
}

interface SessionStatsVM {
  duration: string;  // "MM:SS"
  totalCards: number;
  dueCards: number;
  newCards: number;
  ratings: {
    hard: number;
    normal: number;
    easy: number;
  };
}

interface UpcomingReviewsVM {
  today: number;
  tomorrow: number;
  in2Days: number;
  in3Days: number;
  in4Days: number;
}
```

## 6. Zarządzanie stanem

W `SessionSummaryPage` (React):
```ts
const { id: sessionIdParam } = useParams();
const sessionId = Number(sessionIdParam);
const navigate = useNavigate();

const [session, setSession] = useState<SessionDTO | null>(null);
const [stats, setStats] = useState<SessionStatsVM | null>(null);
const [upcomingReviews, setUpcomingReviews] = useState<UpcomingReviewsVM | null>(null);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// Pobranie danych sesji
useEffect(() => {
  async function fetchSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        credentials: 'include'
      });
      
      if (res.status === 401) return navigate('/login');
      if (res.status === 404) {
        setError('Sesja nie została znaleziona');
        return;
      }
      if (!res.ok) throw new Error('Błąd pobierania sesji');
      
      const data: GetSessionResponseDTO = await res.json();
      
      // Sprawdź, czy sesja jest zakończona
      if (!data.session.ended_at) {
        setError('Sesja nie została jeszcze zakończona');
        navigate(`/sessions/${sessionId}`);
        return;
      }
      
      setSession(data.session);
      
      // Oblicz statystyki
      const calculatedStats = calculateStats(data);
      setStats(calculatedStats);
      
      // Oblicz najbliższe powtórki
      const reviews = await fetchUpcomingReviews();
      setUpcomingReviews(reviews);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  
  fetchSession();
}, [sessionId]);

// Obliczenie statystyk z danych sesji
function calculateStats(data: GetSessionResponseDTO): SessionStatsVM {
  const { session, session_items, flashcards } = data;
  
  // Czas trwania sesji
  const start = new Date(session.started_at);
  const end = new Date(session.ended_at!);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  const duration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
  
  // Liczba kart
  const totalCards = session_items.length;
  
  // Karty due vs nowe (zakładamy, że fiszki z generation_id != null to nowe, reszta due)
  // Alternatywnie: sprawdź, czy to była pierwsza ocena (brak wcześniejszych session_items dla tej fiszki)
  // W MVP: uproszczenie - policzymy z flagą w flashcards lub zakładamy, że wszystkie z sesji to due
  // Dla dokładności potrzebujemy dodatkowej informacji z backendu lub logiki w API
  // Zakładam, że API zwróci tę informację w session_items lub flashcards
  const dueCards = session_items.filter(item => {
    const flashcard = flashcards.find(f => f.id === item.flashcard_id);
    // Logika: jeśli fiszka miała due_at w przeszłości, to była due, inaczej nowa
    // Wymaga due_at w FlashcardDTO lub dodatkowej flagi
    // Dla MVP: zakładamy że 80% to due, 20% nowe (proporcja z algorytmu)
    return true; // TODO: doprecyzować logikę
  }).length;
  
  // Uproszczone: zakładamy proporcje 80/20
  const dueCardsEstimate = Math.floor(totalCards * 0.8);
  const newCardsEstimate = totalCards - dueCardsEstimate;
  
  // Rozkład ocen
  const hard = session_items.filter(item => item.rating === -1).length;
  const normal = session_items.filter(item => item.rating === 0).length;
  const easy = session_items.filter(item => item.rating === 1).length;
  
  return {
    duration,
    totalCards,
    dueCards: dueCardsEstimate,
    newCards: newCardsEstimate,
    ratings: { hard, normal, easy }
  };
}

// Pobranie najbliższych powtórek (z wszystkich fiszek użytkownika)
async function fetchUpcomingReviews(): Promise<UpcomingReviewsVM> {
  try {
    const res = await fetch('/api/sessions/upcoming-reviews', {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Błąd pobierania harmonogramu');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Błąd pobierania harmonogramu powtórek:', e);
    return { today: 0, tomorrow: 0, in2Days: 0, in3Days: 0, in4Days: 0 };
  }
}

// Akcje
const handleNewSession = () => {
  navigate('/sessions');
};

const handleViewFlashcards = () => {
  navigate('/flashcards');
};
```

## 7. Integracja API

### GET /api/sessions/:id
- Request: brak
- Response (200): `GetSessionResponseDTO`
  ```ts
  {
    session: SessionDTO;
    flashcards: FlashcardDTO[];
    session_items: SessionItemDTO[];
  }
  ```
- Opis: zwraca szczegóły sesji wraz z fiszkami i ocenami.
- Kody błędów: 401, 404 → sesja nie znaleziona, 500.

### GET /api/sessions/upcoming-reviews (nowy endpoint, opcjonalny)
- Request: brak
- Response (200): `UpcomingReviewsVM`
  ```ts
  {
    today: number;
    tomorrow: number;
    in2Days: number;
    in3Days: number;
    in4Days: number;
  }
  ```
- Opis: zwraca liczbę kart do powtórki na kolejne dni.
- Alternatywnie: oblicz na frontendzie na podstawie wszystkich fiszek użytkownika (wymaga GET `/api/flashcards` z filtrem due).
- Kody błędów: 401, 500.

## 8. Interakcje użytkownika

1. **Wejście na `/sessions/:id/summary`:**
   - Widok pobiera dane sesji przez GET `/api/sessions/:id`.
   - Sprawdzenie, czy sesja jest zakończona (ended_at != null).
   - Jeśli nie zakończona: redirect do `/sessions/:id` lub komunikat błędu.
   - Wyświetlenie spinnera podczas ładowania.

2. **Wyświetlenie statystyk:**
   - Po załadowaniu danych: wyświetlenie SummaryHeader z tytułem i ikoną.
   - SessionStats pokazuje:
     - Czas trwania sesji (obliczony z started_at i ended_at).
     - Liczba przejrzanych kart (totalCards = session_items.length).
     - Karty due i nowe (obliczone z danych lub proporcje 80/20).
     - RatingDistribution z liczbą i procentem ocen trudne/normalne/łatwe.

3. **Wyświetlenie harmonogramu:**
   - UpcomingReviews pokazuje liczby kart do powtórki na kolejne dni.
   - Obliczone z due_at wszystkich fiszek użytkownika lub z dedykowanego endpointu.

4. **Akcje:**
   - Klik "Nowa sesja" → redirect do `/sessions` (rozpoczęcie nowej sesji).
   - Klik "Zobacz fiszki" → redirect do `/flashcards` (przegląd wszystkich fiszek).

5. **Opcjonalnie:**
   - Udostępnienie sesji (link do `/sessions/:id/summary`).
   - Eksport statystyk (do zaimplementowania w przyszłości).

## 9. Warunki i walidacja

### Walidacja frontendowa:
- **ID sesji:**
  - Musi być liczbą.
  - Jeśli nieprawidłowe: komunikat "Nieprawidłowy ID sesji".
- **Sesja zakończona:**
  - Jeśli ended_at = null: redirect do `/sessions/:id` lub komunikat "Sesja nie została jeszcze zakończona".

### Walidacja backendowa:
- **Sesja musi istnieć i należeć do użytkownika.**
- **Sesja musi być zakończona (ended_at != null).**
  - Jeśli nie: zwróć 400 z komunikatem "Sesja nie została jeszcze zakończona".

### Obliczenia statystyk:
- **Czas trwania:**
  - ended_at - started_at, format MM:SS.
  - Jeśli sesja trwała < 1 min: "0:XX".
  - Jeśli > 60 min: "MM:SS" (bez limitu).
- **Rozkład ocen:**
  - Procenty obliczone jako (count / totalCards) * 100, zaokrąglone do 1 miejsca po przecinku.
  - Suma procentów powinna wynosić ~100% (możliwe drobne różnice przez zaokrąglenia).
- **Harmonogram powtórek:**
  - Oblicz na podstawie due_at wszystkich fiszek użytkownika.
  - Grupowanie po dniach: today, tomorrow, in2Days, in3Days, in4Days, in5Days+.

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Brak autoryzacji (401):**
   - Automatyczne przekierowanie do `/login`.

2. **Sesja nie znaleziona (404):**
   - Komunikat: "Sesja nie została znaleziona".
   - Przycisk "Wróć do sesji" → redirect do `/sessions`.

3. **Sesja nie zakończona:**
   - Komunikat: "Sesja nie została jeszcze zakończona. Dokończ sesję, aby zobaczyć podsumowanie".
   - Przycisk "Kontynuuj sesję" → redirect do `/sessions/:id`.

4. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem".
   - Opcja retry.

5. **Błąd serwera (500):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później".
   - Opcja retry.

6. **Błąd pobierania harmonogramu:**
   - Jeśli GET `/api/sessions/upcoming-reviews` zwraca błąd: wyświetl sekcję UpcomingReviews z placeholder "Brak danych o harmonogramie" lub ukryj sekcję.

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
    if (errorData.error.includes('nie została jeszcze zakończona')) {
      setError('Sesja nie została jeszcze zakończona');
      navigate(`/sessions/${sessionId}`);
    } else {
      setError(errorData.error || 'Błąd walidacji');
    }
  } else {
    setError('Wystąpił nieoczekiwany błąd');
  }
}
```

## 11. Kroki implementacji

1. Utworzyć `src/pages/sessions/[id]/summary.astro`, osadzić `<SessionSummaryPage client:load />`.
2. W `src/components/SessionSummaryPage.tsx` zainicjować stan: session, stats, upcomingReviews, loading, error.
3. Zaimplementować hook `useEffect` do pobrania danych sesji przez GET `/api/sessions/:id`.
4. Dodać walidację: czy sesja jest zakończona (ended_at != null), jeśli nie → redirect do `/sessions/:id`.
5. Zaimplementować funkcję `calculateStats` do obliczenia:
   - Czasu trwania sesji (duration).
   - Liczby kart (totalCards, dueCards, newCards).
   - Rozkładu ocen (hard, normal, easy z procentami).
6. Zaimplementować funkcję `fetchUpcomingReviews` do pobrania harmonogramu powtórek (GET `/api/sessions/upcoming-reviews` lub oblicz z fiszek).
7. Zaimplementować komponenty potomne:
   - `SummaryHeader` z tytułem i ikoną.
   - `SessionStats` z kartami StatCard i RatingDistribution.
   - `StatCard` do wyświetlenia pojedynczej statystyki.
   - `RatingDistribution` z rozkładem ocen (lista lub wykres).
   - `UpcomingReviews` z harmonogramem powtórek.
   - `ReviewSchedule` do wyświetlenia pojedynczego dnia harmonogramu.
   - `ActionButtons` z przyciskami "Nowa sesja" i "Zobacz fiszki".
8. Dodać logikę `handleNewSession`: redirect do `/sessions`.
9. Dodać logikę `handleViewFlashcards`: redirect do `/flashcards`.
10. Stylować komponenty używając Tailwind + shadcn/ui (Card, Button).
11. Dodać ikony/emoji dla sukcesu (🎉) i poszczególnych ocen (❌ trudne, ✅ normalne, ⭐ łatwe).
12. Zaimplementować responsywność (grid stats na mobile/desktop).
13. Dodać animacje wejścia (fade-in) dla płynniejszego UX.
14. Zaimplementować obsługę błędów: 401 → redirect, 404 → komunikat, 400 → sesja niezakończona, 500 → retry.
15. Dodać LoadingIndicator (Skeleton) i ErrorMessage z ARIA-live.
16. Przetestować wszystkie ścieżki: load, brak sesji, sesja niezakończona, błędy, akcje.
17. Upewnić się, że dostępność ARIA jest spełniona (aria-labels, semantic HTML).
18. Dodać logowanie zdarzenia analitycznego: view_session_summary.
19. Opcjonalnie: dodać możliwość udostępnienia sesji (share button z linkiem).
20. Review code, poprawić lintery, commit.


