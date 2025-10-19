# Plan implementacji widoku Strony Głównej (Home)

## 1. Przegląd
Widok strony głównej jest pierwszym ekranem, który widzi zalogowany użytkownik. Wyświetla powitanie, szybki dostęp do kluczowych funkcji aplikacji (generowanie fiszek, przeglądanie fiszek, rozpoczęcie sesji nauki), oraz podstawowe statystyki użytkownika (liczba fiszek, liczba kart do powtórki dzisiaj, streak nauki). Widok jest przyjazny dla nowych użytkowników z onboardingiem "time to first deck" (TTFD < 5 minut zgodnie z PRD) oraz doświadczonych użytkowników z szybkim dostępem do najważniejszych akcji.

## 2. Routing widoku
Ścieżka: `/` (strona główna)

W `src/pages/index.astro` osadzić wyspę React:
```astro
---
import HomePage from '../components/HomePage';
---
<HomePage client:load />
```

## 3. Struktura komponentów

HomePage  
├─ NavBar (globalny)  
├─ WelcomeSection  
│  ├─ Greeting (Witaj, {userName}!)  
│  └─ CurrentDate  
├─ QuickActions  
│  ├─ ActionCard "Generuj fiszki AI"  
│  │  └─ Button → redirect do `/generate/new`  
│  ├─ ActionCard "Przeglądaj fiszki"  
│  │  └─ Button → redirect do `/flashcards`  
│  └─ ActionCard "Rozpocznij naukę"  
│     └─ Button → redirect do `/sessions`  
├─ UserStats  
│  ├─ StatCard "Twoje fiszki" (total count)  
│  ├─ StatCard "Do powtórki dziś" (due count)  
│  └─ StatCard "Streak" (dni z rzędu nauki)  
├─ RecentActivity (opcjonalnie w MVP)  
│  └─ Lista ostatnich generacji/sesji  
├─ EmptyState (jeśli użytkownik nie ma fiszek)  
│  ├─ Ilustracja/Icon  
│  ├─ Text "Zacznij od wygenerowania pierwszych fiszek!"  
│  └─ Button "Wygeneruj fiszki" → redirect do `/generate/new`  
├─ LoadingIndicator  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### HomePage
- Opis: główny kontener strony głównej, zarządza stanem statystyk użytkownika i aktywności.
- Elementy: NavBar, WelcomeSection, QuickActions, UserStats (lub EmptyState jeśli brak fiszek), LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onLoad → pobierz statystyki użytkownika (GET `/api/users/stats` lub oblicz z fiszek).
  - onNavigate(path) → redirect do ścieżki.
- Walidacja: brak.
- Typy używane:
  - `UserStatsDTO`
  - `HomePageVM` (ViewModel)
- Props: brak (pobiera dane z API).

### WelcomeSection
- Opis: sekcja powitalna z powitaniem użytkownika i aktualną datą.
- Elementy:
  - `<div>`
    - `<h1>Witaj{userName ? `, ${userName}` : ''}! 👋</h1>`
    - `<p>{formatDate(new Date())}</p>` (np. "Czwartek, 16 października 2025")
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string | null` (userName)
- Props:
  - `userName?: string | null`

### QuickActions
- Opis: sekcja z kartami szybkich akcji (główne funkcje aplikacji).
- Elementy:
  - `<div className="quick-actions-grid">`
    - `<ActionCard title="Generuj fiszki AI" description="Stwórz fiszki z tematu" icon="🤖" onClick={() => onNavigate('/generate/new')} />`
    - `<ActionCard title="Przeglądaj fiszki" description="Zobacz wszystkie fiszki" icon="📚" onClick={() => onNavigate('/flashcards')} />`
    - `<ActionCard title="Rozpocznij naukę" description="Sesja powtórek SRS" icon="🎯" badge={dueCount > 0 ? dueCount : null} onClick={() => onNavigate('/sessions')} />`
  - `</div>`
- Zdarzenia:
  - onClick ActionCard → wywołaj onNavigate z odpowiednią ścieżką.
- Walidacja: brak.
- Typy:
  - `number` (dueCount dla badge)
- Props:
  - `dueCount: number`
  - `onNavigate: (path: string) => void`

### ActionCard
- Opis: pojedyncza karta szybkiej akcji z ikoną, tytułem, opisem i opcjonalnym badge.
- Elementy:
  - `<div className="action-card" onClick={onClick}>`
    - `<div className="icon">{icon}</div>`
    - Jeśli badge: `<span className="badge">{badge}</span>`
    - `<h3>{title}</h3>`
    - `<p>{description}</p>`
  - `</div>`
- Zdarzenia:
  - onClick → wywołaj onClick callback.
- Walidacja: brak.
- Typy:
  - `string` (title, description, icon)
  - `number | null` (badge)
- Props:
  - `title: string`
  - `description: string`
  - `icon: string` (emoji lub class ikony)
  - `badge?: number | null`
  - `onClick: () => void`

### UserStats
- Opis: sekcja statystyk użytkownika.
- Elementy:
  - `<div className="user-stats-grid">`
    - `<StatCard label="Twoje fiszki" value={totalFlashcards} icon="📝" />`
    - `<StatCard label="Do powtórki dziś" value={dueToday} icon="⏰" highlight={dueToday > 0} />`
    - `<StatCard label="Streak" value={`${streak} dni`} icon="🔥" />`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `number` (totalFlashcards, dueToday, streak)
- Props:
  - `totalFlashcards: number`
  - `dueToday: number`
  - `streak: number`

### StatCard
- Opis: pojedyncza karta statystyki.
- Elementy:
  - `<div className={`stat-card ${highlight ? 'highlight' : ''}`}>`
    - `<div className="stat-icon">{icon}</div>`
    - `<p className="stat-label">{label}</p>`
    - `<p className="stat-value">{value}</p>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `string` (label, icon)
  - `string | number` (value)
  - `boolean` (highlight)
- Props:
  - `label: string`
  - `value: string | number`
  - `icon: string`
  - `highlight?: boolean`

### EmptyState
- Opis: stan pustej strony głównej dla nowych użytkowników (brak fiszek).
- Elementy:
  - `<div className="empty-state">`
    - `<div className="empty-illustration">📖</div>`
    - `<h2>Witaj w aplikacji fiszek!</h2>`
    - `<p>Zacznij od wygenerowania pierwszych fiszek z pomocą AI lub dodaj je ręcznie.</p>`
    - `<Button onClick={() => onNavigate('/generate/new')}>Wygeneruj fiszki AI</Button>`
    - `<Button variant="outline" onClick={() => onNavigate('/flashcards')}>Dodaj ręcznie</Button>`
  - `</div>`
- Zdarzenia:
  - onClick "Wygeneruj fiszki" → redirect do `/generate/new`.
  - onClick "Dodaj ręcznie" → redirect do `/flashcards` (gdzie jest przycisk "Dodaj fiszkę").
- Walidacja: brak.
- Typy: brak.
- Props:
  - `onNavigate: (path: string) => void`

### RecentActivity (opcjonalnie w MVP)
- Opis: lista ostatnich aktywności użytkownika (generacje, sesje).
- Elementy:
  - `<div>`
    - `<h3>Ostatnie aktywności</h3>`
    - `<ul>`
      - `<ActivityItem type="generation" date={...} count={...} />`
      - `<ActivityItem type="session" date={...} count={...} />`
    - `</ul>`
  - `</div>`
- Zdarzenia: brak.
- Walidacja: brak.
- Typy:
  - `ActivityItemDTO[]`
- Props:
  - `activities: ActivityItemDTO[]`

### LoadingIndicator
- Opis: pokazuje skeleton podczas ładowania statystyk.
- Elementy: `<Skeleton />` (dla kart statystyk)
- Zdarzenia: brak.
- Props: `loading: boolean`

### ErrorMessage
- Opis: region ARIA-live do komunikatów błędów.
- Elementy: `<div role="alert">{error}</div>`
- Zdarzenia: brak.
- Props: `error: string | null`

## 5. Typy

```ts
// DTO z backendu (nowy endpoint lub obliczone z istniejących)
export interface UserStatsDTO {
  totalFlashcards: number;
  dueToday: number;
  streak: number;
}

// Opcjonalnie: ostatnie aktywności
export interface ActivityItemDTO {
  type: 'generation' | 'session';
  date: string;
  count: number;
  id: number;
}

// ViewModel dla strony głównej
interface HomePageVM {
  userName: string | null;
  stats: UserStatsDTO | null;
  activities: ActivityItemDTO[];
  loading: boolean;
  error: string | null;
}
```

## 6. Zarządzanie stanem

W `HomePage` (React):
```ts
const navigate = useNavigate();
const [userName, setUserName] = useState<string | null>(null);
const [stats, setStats] = useState<UserStatsDTO | null>(null);
const [activities, setActivities] = useState<ActivityItemDTO[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// Pobranie danych użytkownika i statystyk
useEffect(() => {
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Pobierz profil użytkownika (z Supabase Auth lub z custom endpoint)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split('@')[0] || null); // lub user.user_metadata.name
      }
      
      // Pobierz statystyki
      const statsRes = await fetch('/api/users/stats', {
        credentials: 'include'
      });
      if (statsRes.status === 401) return navigate('/login');
      if (!statsRes.ok) throw new Error('Błąd pobierania statystyk');
      const statsData: UserStatsDTO = await statsRes.json();
      setStats(statsData);
      
      // Opcjonalnie: pobierz ostatnie aktywności
      // const activitiesRes = await fetch('/api/users/activities?limit=5', { credentials: 'include' });
      // const activitiesData = await activitiesRes.json();
      // setActivities(activitiesData.activities);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  
  fetchData();
}, []);

// Nawigacja
const handleNavigate = (path: string) => {
  navigate(path);
};
```

## 7. Integracja API

### GET /api/users/stats (nowy endpoint)
- Request: brak
- Response (200): `UserStatsDTO`
  ```ts
  {
    totalFlashcards: number;
    dueToday: number;
    streak: number;
  }
  ```
- Opis: zwraca statystyki użytkownika.
  - `totalFlashcards`: liczba wszystkich fiszek użytkownika.
  - `dueToday`: liczba fiszek z due_at <= dziś.
  - `streak`: liczba dni z rzędu, w których użytkownik miał sesję nauki (obliczone z sessions).
- Kody błędów: 401, 500.

### Alternatywnie: oblicz na frontendzie
- GET `/api/flashcards?limit=1` → pagination.total → totalFlashcards.
- GET `/api/flashcards?sort=due&limit=100` → policz karty z due_at <= dziś.
- Streak: GET `/api/sessions?limit=30` → oblicz streak z dat sesji.

### GET /api/users/activities (opcjonalnie)
- Request: query params `?limit=5`
- Response (200):
  ```ts
  {
    activities: ActivityItemDTO[];
  }
  ```
- Opis: zwraca ostatnie aktywności użytkownika (generacje, sesje).
- Kody błędów: 401, 500.

## 8. Interakcje użytkownika

1. **Wejście na `/`:**
   - Sprawdzenie autoryzacji (middleware przekierowuje do login jeśli niezalogowany).
   - Pobranie danych użytkownika i statystyk.
   - Wyświetlenie skeleton podczas ładowania.

2. **Wyświetlenie strony:**
   - Jeśli użytkownik ma fiszki (totalFlashcards > 0):
     - WelcomeSection z powitaniem.
     - QuickActions z 3 kartami akcji.
     - UserStats z totalFlashcards, dueToday, streak.
     - Opcjonalnie: RecentActivity z ostatnimi generacjami/sesjami.
   - Jeśli użytkownik nie ma fiszek (totalFlashcards === 0):
     - WelcomeSection z powitaniem.
     - EmptyState z zachętą do wygenerowania pierwszych fiszek.

3. **Szybkie akcje:**
   - Klik "Generuj fiszki AI" → redirect do `/generate/new`.
   - Klik "Przeglądaj fiszki" → redirect do `/flashcards`.
   - Klik "Rozpocznij naukę" → redirect do `/sessions`.
     - Badge na "Rozpocznij naukę" pokazuje liczbę kart do powtórki (dueToday).

4. **Statystyki:**
   - Karta "Do powtórki dziś" jest podświetlona (highlight), jeśli dueToday > 0.
   - Karta "Streak" pokazuje liczbę dni z rzędu nauki (lub 0 jeśli brak sesji).

5. **EmptyState (nowi użytkownicy):**
   - Klik "Wygeneruj fiszki AI" → redirect do `/generate/new`.
   - Klik "Dodaj ręcznie" → redirect do `/flashcards` (gdzie mogą dodać fiszkę ręcznie).

## 9. Warunki i walidacja

### Walidacja frontendowa:
- Brak specjalnej walidacji, strona główna tylko wyświetla dane.

### Walidacja backendowa:
- Endpoint `/api/users/stats` wymaga autoryzacji (401 jeśli brak sesji).

### Logika warunkowa:
- **EmptyState vs Normal State:**
  - Jeśli `stats.totalFlashcards === 0` → pokaż EmptyState.
  - Jeśli `stats.totalFlashcards > 0` → pokaż QuickActions + UserStats.
- **Badge na "Rozpocznij naukę":**
  - Jeśli `stats.dueToday > 0` → pokaż badge z liczbą.
  - Jeśli `stats.dueToday === 0` → brak badge (lub badge "0").
- **Highlight na "Do powtórki dziś":**
  - Jeśli `stats.dueToday > 0` → dodaj klasę `highlight` (np. border/background color).

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Brak autoryzacji (401):**
   - Middleware powinien przekierować do `/login` przed renderowaniem.
   - Jeśli mimo to wystąpi 401 w fetch: przekieruj do `/login`.

2. **Błąd pobierania statystyk (500):**
   - Komunikat: "Wystąpił błąd podczas pobierania statystyk. Spróbuj odświeżyć stronę."
   - Opcja retry (przycisk "Odśwież").

3. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."
   - Opcja retry.

4. **Brak danych użytkownika:**
   - Jeśli `supabase.auth.getUser()` zwraca null: przekieruj do `/login`.

### Handling w kodzie:
```ts
try {
  // operacja API
} catch (error) {
  if (error.response?.status === 401) {
    navigate('/login');
  } else if (error.response?.status === 500) {
    setError('Wystąpił błąd podczas pobierania statystyk');
  } else {
    setError('Wystąpił nieoczekiwany błąd');
  }
}
```

## 11. Kroki implementacji

1. Utworzyć endpoint `/api/users/stats` (backend):
   - Oblicz `totalFlashcards` z tabeli `flashcards` (COUNT).
   - Oblicz `dueToday` z `flashcards` WHERE `due_at <= CURRENT_DATE`.
   - Oblicz `streak` z tabeli `sessions`:
     - Pobierz sesje użytkownika, posortowane po dacie.
     - Oblicz streak: ile kolejnych dni (od dziś wstecz) użytkownik miał sesję.
   - Zwróć `UserStatsDTO`.
2. Dodać typy do `src/types.ts`: `UserStatsDTO`, `ActivityItemDTO` (opcjonalnie).
3. Utworzyć `src/pages/index.astro`, osadzić `<HomePage client:load />`.
4. W `src/components/HomePage.tsx` zainicjować stan: userName, stats, activities, loading, error.
5. Zaimplementować hook `useEffect` do:
   - Pobrania danych użytkownika (supabase.auth.getUser).
   - Pobrania statystyk (GET `/api/users/stats`).
   - Opcjonalnie: pobrania ostatnich aktywności.
6. Zaimplementować komponenty potomne:
   - `WelcomeSection` z powitaniem i datą.
   - `QuickActions` z 3 kartami akcji (`ActionCard`).
   - `UserStats` z 3 kartami statystyk (`StatCard`).
   - `EmptyState` dla nowych użytkowników.
   - Opcjonalnie: `RecentActivity`.
7. Dodać logikę warunkową:
   - Jeśli `stats.totalFlashcards === 0` → pokaż EmptyState.
   - Jeśli `stats.totalFlashcards > 0` → pokaż QuickActions + UserStats.
8. Dodać badge na "Rozpocznij naukę" jeśli `dueToday > 0`.
9. Dodać highlight na "Do powtórki dziś" jeśli `dueToday > 0`.
10. Stylować komponenty używając Tailwind + shadcn/ui (Card, Button).
11. Dodać responsywność (grid 1 kolumna mobile, 3 kolumny desktop dla QuickActions i UserStats).
12. Zaimplementować obsługę błędów: 401 → redirect, 500 → komunikat + retry.
13. Dodać LoadingIndicator (Skeleton dla kart) i ErrorMessage z ARIA-live.
14. Dodać funkcję `formatDate` do wyświetlania aktualnej daty (np. "Czwartek, 16 października 2025").
15. Przetestować wszystkie ścieżki: load, błędy, EmptyState, navigacja, badge, highlight.
16. Upewnić się, że dostępność ARIA jest spełniona (semantic HTML, aria-labels).
17. Dodać logowanie zdarzenia analitycznego: view_home.
18. Opcjonalnie: dodać animacje wejścia (fade-in) dla płynniejszego UX.
19. Opcjonalnie: dodać sekcję RecentActivity z ostatnimi generacjami/sesjami.
20. Review code, poprawić lintery, commit.

## Dodatkowe uwagi

### Streak calculation (backend)
```ts
// Pseudokod obliczenia streak
function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  
  // Sortuj sesje po dacie (najnowsze pierwsze)
  const sortedSessions = sessions.sort((a, b) => 
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // reset do początku dnia
  
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.started_at);
    sessionDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (diffDays > streak) {
      break; // przerwa w streak
    }
  }
  
  return streak;
}
```

### Onboarding dla nowych użytkowników
- EmptyState powinien być bardzo zachęcający i jasny.
- Priorytet: użytkownik powinien wygenerować pierwszą talię w < 5 minut (TTFD z PRD).
- Rozważyć dodanie tooltips lub mini-tutorial przy pierwszym wejściu.

### Future enhancements (poza MVP)
- Wykresy statystyk (przejrzane karty w czasie).
- Kalendarz nauki (heatmap dni z sesjami).
- Achievements/badges za milestones (100 fiszek, 7-dniowy streak, etc).
- Personalizowane wskazówki ("Masz 10 kart do powtórki, zacznij naukę!").


