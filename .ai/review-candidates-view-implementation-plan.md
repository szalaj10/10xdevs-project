# Plan implementacji widoku Recenzji Kandydatów

## 1. Przegląd
Widok umożliwia przegląd wygenerowanych przez AI propozycji fiszek (kandydatów) z możliwością ich akceptacji, edycji lub odrzucenia. Po zakończeniu recenzji użytkownik zatwierdza wybrane karty, które trafiają do jego kolekcji jako fiszki. Widok pobiera dane generacji wraz z listą kandydatów przez GET `/api/generations/:id`, umożliwia edycję kandydatów przez PATCH `/api/generations/:generationId/candidates/:id`, akceptację pojedynczą przez POST `/api/generations/:generationId/candidates/:id/accept`, odrzucenie przez POST `/api/generations/:generationId/candidates/:id/reject` oraz zbiorczą akceptację przez POST `/api/generations/:generationId/candidates/accept-bulk`.

## 2. Routing widoku
Ścieżka: `/generate/:id/review`

W `src/pages/generate/[id]/review.astro` osadzić wyspę React:
```astro
---
import ReviewCandidatesPage from '../../../components/ReviewCandidatesPage';
---
<ReviewCandidatesPage client:load />
```

## 3. Struktura komponentów

ReviewCandidatesPage  
├─ NavBar (globalny)  
├─ Breadcrumbs  
├─ GenerationHeader  
│  ├─ GenerationStats (model, liczba wygenerowanych, data)  
│  └─ BulkActions (zaznacz wszystkie, odznacz wszystkie, zaakceptuj zaznaczone)  
├─ CandidatesList  
│  └─ CandidateCard (wielokrotnie)  
│     ├─ Checkbox (zaznaczenie do bulk accept)  
│     ├─ CardContent (front/back, edytowalne inline)  
│     ├─ CardActions  
│     │  ├─ Button Akceptuj  
│     │  ├─ Button Odrzuć  
│     │  └─ Button Edytuj (toggle trybu edycji)  
│     └─ ThumbsRating (opcjonalnie, kciuk góra/dół)  
├─ LoadingIndicator  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### ReviewCandidatesPage
- Opis: główny kontener widoku, zarządza stanem generacji, kandydatów, zaznaczenia, edycji i operacji API.
- Elementy: NavBar, Breadcrumbs, GenerationHeader, CandidatesList, LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onLoad → pobierz generację i kandydatów przez GET `/api/generations/:id`.
  - onBulkAccept → POST `/api/generations/:generationId/candidates/accept-bulk` z listą zaznaczonych IDs.
  - onSingleAccept(candidateId) → POST `/api/generations/:generationId/candidates/:id/accept`.
  - onSingleReject(candidateId) → POST `/api/generations/:generationId/candidates/:id/reject`.
  - onEdit(candidateId, front?, back?) → PATCH `/api/generations/:generationId/candidates/:id`.
  - Po zakończeniu wszystkich operacji → redirect do `/flashcards` lub `/generate/new`.
- Walidacja: ID generacji musi być liczbą, kandydaci muszą istnieć.
- Typy używane:
  - `GetGenerationResponseDTO`
  - `CandidateCardDTO`
  - `EditCandidateCardDTO`
  - `BulkAcceptCandidateCardsDTO`
  - `ReviewCandidatesVM` (ViewModel)
- Props: brak (pobiera ID z URL params).

### GenerationHeader
- Opis: wyświetla metadane generacji i akcje zbiorcze.
- Elementy:
  - `<div>Model: {model}, Wygenerowano: {generatedCount}, Data: {createdAt}</div>`
  - `<Button onClick={onSelectAll}>Zaznacz wszystkie</Button>`
  - `<Button onClick={onDeselectAll}>Odznacz wszystkie</Button>`
  - `<Button onClick={onBulkAccept} disabled={selectedCount === 0}>Akceptuj zaznaczone ({selectedCount})</Button>`
- Zdarzenia:
  - onSelectAll → ustaw wszystkie IDs kandydatów w pending jako zaznaczone.
  - onDeselectAll → wyczyść zaznaczenia.
  - onBulkAccept → wywołaj bulk accept dla zaznaczonych.
- Walidacja: co najmniej jeden kandydat musi być zaznaczony do bulk accept.
- Typy:
  - `GenerationDTO`
  - `number[]` (selectedIds)
- Props:
  - `generation: GenerationDTO`
  - `selectedIds: number[]`
  - `onSelectAll: () => void`
  - `onDeselectAll: () => void`
  - `onBulkAccept: () => void`
  - `loading: boolean`

### CandidatesList
- Opis: lista wszystkich kandydatów z generacji.
- Elementy:
  - Mapowanie `candidates.map(c => <CandidateCard key={c.id} ... />)`
  - Jeśli lista pusta: `<div>Brak kandydatów do recenzji</div>`
- Zdarzenia: brak (przekazuje callbacki do dzieci).
- Walidacja: brak.
- Typy:
  - `CandidateCardDTO[]`
- Props:
  - `candidates: CandidateCardDTO[]`
  - `selectedIds: number[]`
  - `onToggleSelect: (id: number) => void`
  - `onAccept: (id: number) => void`
  - `onReject: (id: number) => void`
  - `onEdit: (id: number, front: string, back: string) => void`

### CandidateCard
- Opis: pojedyncza karta kandydata z możliwością edycji inline, akceptacji, odrzucenia i zaznaczenia.
- Elementy:
  - `<Checkbox checked={isSelected} onChange={() => onToggleSelect(id)} />`
  - `<div contentEditable={isEditing} suppressContentEditableWarning>{front}</div>`
  - `<div contentEditable={isEditing} suppressContentEditableWarning>{back}</div>`
  - `<Button onClick={handleEdit}>{isEditing ? 'Zapisz' : 'Edytuj'}</Button>`
  - `<Button onClick={() => onAccept(id)} disabled={status !== 'pending'}>Akceptuj</Button>`
  - `<Button onClick={() => onReject(id)} disabled={status !== 'pending'}>Odrzuć</Button>`
  - Opcjonalnie: kciuk góra/dół (do przyszłych wersji).
- Zdarzenia:
  - onToggleSelect(id) → dodaj/usuń z selectedIds.
  - onClick Edit → toggle trybu edycji; jeśli zapisujesz → wywołaj onEdit z nowymi wartościami.
  - onClick Akceptuj → wywołaj onAccept(id).
  - onClick Odrzuć → wywołaj onReject(id).
- Walidacja:
  - front: minimalnie 1 znak, maksymalnie 200 znaków.
  - back: minimalnie 1 znak, maksymalnie 350 znaków.
  - Tylko kandydaci w statusie 'pending' mogą być edytowani, akceptowani lub odrzucani.
- Typy:
  - `CandidateCardDTO`
- Props:
  - `candidate: CandidateCardDTO`
  - `isSelected: boolean`
  - `onToggleSelect: (id: number) => void`
  - `onAccept: (id: number) => void`
  - `onReject: (id: number) => void`
  - `onEdit: (id: number, front: string, back: string) => void`

### LoadingIndicator
- Opis: pokazuje spinner podczas operacji API (load, accept, reject, edit).
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
// DTO z backendu (istniejące w types.ts)
import type { GenerationDTO, CandidateCardDTO, EditCandidateCardDTO, BulkAcceptCandidateCardsDTO, GetGenerationResponseDTO } from '@/types';

// ViewModel dla widoku recenzji
interface ReviewCandidatesVM {
  generation: GenerationDTO;
  candidates: CandidateCardVM[];
  selectedIds: number[];
  loading: boolean;
  error: string | null;
}

interface CandidateCardVM extends CandidateCardDTO {
  isEditing: boolean;
  editedFront: string;
  editedBack: string;
}

// Typy dla stanu komponentu
interface CandidateEditState {
  [candidateId: number]: {
    isEditing: boolean;
    front: string;
    back: string;
  };
}
```

## 6. Zarządzanie stanem

W `ReviewCandidatesPage` (React):
```ts
const { id: generationIdParam } = useParams();
const generationId = Number(generationIdParam);
const navigate = useNavigate();

const [generation, setGeneration] = useState<GenerationDTO | null>(null);
const [candidates, setCandidates] = useState<CandidateCardDTO[]>([]);
const [selectedIds, setSelectedIds] = useState<number[]>([]);
const [editStates, setEditStates] = useState<CandidateEditState>({});
const [loading, setLoading] = useState<boolean>(true);
const [actionLoading, setActionLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Pobranie danych generacji i kandydatów
useEffect(() => {
  async function fetchGeneration() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generations/${generationId}`, {
        credentials: 'include'
      });
      if (res.status === 401) return navigate('/login');
      if (res.status === 404) {
        setError('Generacja nie została znaleziona');
        return;
      }
      if (!res.ok) throw new Error('Błąd pobierania generacji');
      const data: GetGenerationResponseDTO = await res.json();
      setGeneration(data.generation);
      setCandidates(data.candidate_cards);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  fetchGeneration();
}, [generationId]);

// Akcje zaznaczania
const handleSelectAll = () => {
  const pendingIds = candidates.filter(c => c.status === 'pending').map(c => c.id);
  setSelectedIds(pendingIds);
};
const handleDeselectAll = () => setSelectedIds([]);
const handleToggleSelect = (id: number) => {
  setSelectedIds(prev => 
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
};

// Bulk accept
const handleBulkAccept = async () => {
  if (selectedIds.length === 0) return;
  setActionLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/generations/${generationId}/candidates/accept-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: selectedIds })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd akceptacji');
    }
    // Usuń zaakceptowane z listy lub oznacz jako accepted
    setCandidates(prev => prev.map(c => 
      selectedIds.includes(c.id) ? { ...c, status: 'accepted' } : c
    ));
    setSelectedIds([]);
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setActionLoading(false);
  }
};

// Single accept
const handleAccept = async (candidateId: number) => {
  setActionLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}/accept`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Błąd akceptacji');
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, status: 'accepted' } : c
    ));
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setActionLoading(false);
  }
};

// Single reject
const handleReject = async (candidateId: number) => {
  setActionLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}/reject`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Błąd odrzucenia');
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, status: 'rejected' } : c
    ));
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setActionLoading(false);
  }
};

// Edit candidate
const handleEdit = async (candidateId: number, front: string, back: string) => {
  setActionLoading(true);
  setError(null);
  try {
    const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ front, back })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd edycji');
    }
    const data = await res.json();
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? data.candidate_card : c
    ));
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setActionLoading(false);
  }
};
```

## 7. Integracja API

### GET /api/generations/:id
- Request: brak body, ID w URL
- Response (200): `GetGenerationResponseDTO`
  ```ts
  {
    generation: GenerationDTO;
    candidate_cards: CandidateCardDTO[];
  }
  ```
- Kody błędów: 401 → redirect `/login`, 404 → "Generacja nie znaleziona", 500 → komunikat ogólny.

### POST /api/generations/:generationId/candidates/:id/accept
- Request: brak body
- Response (201): `{ flashcard: FlashcardDTO }`
- Kody błędów: 400 → kandydat już przetworzony, 401 → unauthorized, 404 → nie znaleziono, 500 → błąd serwera.

### POST /api/generations/:generationId/candidates/:id/reject
- Request: brak body
- Response (200): `{ candidate_card: CandidateCardDTO }`
- Kody błędów: 400, 401, 404, 500 (jak wyżej).

### PATCH /api/generations/:generationId/candidates/:id
- Request: `EditCandidateCardDTO`
  ```ts
  {
    front?: string;
    back?: string;
  }
  ```
- Response (200): `{ candidate_card: CandidateCardDTO }`
- Kody błędów: 400 → walidacja Zod lub kandydat nie pending, 401, 404, 500.

### POST /api/generations/:generationId/candidates/accept-bulk
- Request: `BulkAcceptCandidateCardsDTO`
  ```ts
  {
    ids: number[];  // max 100
  }
  ```
- Response (201): `{ flashcards: FlashcardDTO[] }`
- Kody błędów: 400 → pusta lista lub duplikaty IDs, 401, 404, 500.

## 8. Interakcje użytkownika

1. **Ładowanie widoku:**
   - Użytkownik wchodzi na `/generate/:id/review`.
   - Widok pobiera dane generacji i kandydatów.
   - Wyświetlenie spinnera podczas ładowania.
   - Po sukcesie: lista kandydatów, statystyki generacji.

2. **Zaznaczanie kandydatów:**
   - Użytkownik może zaznaczyć checkbox przy każdym kandydacie.
   - Przycisk "Zaznacz wszystkie" zaznacza wszystkie kandydaty w statusie `pending`.
   - Przycisk "Odznacz wszystkie" czyści zaznaczenia.
   - Licznik zaznaczonych wyświetlany w przycisku "Akceptuj zaznaczone".

3. **Edycja inline:**
   - Klik "Edytuj" przy kandydacie → pola front/back stają się edytowalne (contentEditable lub input).
   - Użytkownik modyfikuje treść.
   - Klik "Zapisz" → PATCH do API, aktualizacja stanu lokalnego.
   - Walidacja długości przed wysłaniem.

4. **Akceptacja pojedyncza:**
   - Klik "Akceptuj" → POST accept → kandydat zmienia status na `accepted`.
   - Przycisk "Akceptuj" staje się nieaktywny (disabled).

5. **Odrzucenie pojedyncze:**
   - Klik "Odrzuć" → POST reject → kandydat zmienia status na `rejected`.
   - Przycisk "Odrzuć" staje się nieaktywny.

6. **Akceptacja zbiorcza:**
   - Klik "Akceptuj zaznaczone" → POST bulk accept → wszystkie zaznaczone kandydaty zmieniają status na `accepted`.
   - Zaznaczenia zostają wyczyszczone.

7. **Zakończenie recenzji:**
   - Po zakończeniu recenzji (wszystkie kandydaty przetworzone lub użytkownik decyduje) → opcja "Zakończ" lub automatyczne przekierowanie do `/flashcards`.

## 9. Warunki i walidacja

### Walidacja frontendowa (przed wysłaniem do API):
- **front:**
  - Minimum 1 znak (po trim), maksimum 200 znaków.
  - Komunikat: "Front musi zawierać od 1 do 200 znaków".
- **back:**
  - Minimum 1 znak (po trim), maksimum 350 znaków.
  - Komunikat: "Back musi zawierać od 1 do 350 znaków".
- **Bulk accept:**
  - Co najmniej jeden kandydat musi być zaznaczony.
  - Komunikat: "Zaznacz przynajmniej jeden kandydat".
- **Status kandydata:**
  - Tylko kandydaci w statusie `pending` mogą być edytowani, akceptowani lub odrzucani.
  - Przyciski są disabled dla statusów `accepted` lub `rejected`.

### Walidacja backendowa (zwracana przez API):
- Błędy Zod z API (400) mapować na komunikaty użytkownika:
  - "front" → "Błąd walidacji pola 'front': [szczegóły]"
  - "back" → "Błąd walidacji pola 'back': [szczegóły]"
- 404 → "Kandydat nie został znaleziony".
- 400 (już przetworzony) → "Kandydat został już przetworzony".

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Generacja nie znaleziona (404):**
   - Wyświetlenie komunikatu: "Generacja nie została znaleziona".
   - Opcja powrotu do `/generate/new`.

2. **Brak autoryzacji (401):**
   - Automatyczne przekierowanie do `/login`.

3. **Błąd walidacji (400):**
   - Wyświetlenie szczegółów błędu Zod inline przy odpowiednim polu lub w ErrorMessage.
   - Użytkownik może poprawić dane i ponowić operację.

4. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem. Sprawdź połączenie internetowe."
   - Opcja ponowienia operacji (retry).

5. **Błąd serwera (500):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
   - Opcja ponowienia operacji.

6. **Kandydat już przetworzony (400):**
   - Komunikat: "Kandydat został już przetworzony i nie może być ponownie zaakceptowany/odrzucony."
   - Odświeżenie listy kandydatów.

7. **Duplicate IDs w bulk accept (400):**
   - Komunikat: "Wystąpił błąd w zaznaczeniach. Odśwież stronę."

### Handling w kodzie:
```ts
try {
  // operacja API
} catch (error) {
  if (error.response?.status === 401) {
    navigate('/login');
  } else if (error.response?.status === 404) {
    setError('Kandydat nie został znaleziony');
  } else if (error.response?.status === 400) {
    const errorData = await error.response.json();
    setError(errorData.error || 'Błąd walidacji');
  } else {
    setError('Wystąpił nieoczekiwany błąd');
  }
}
```

## 11. Kroki implementacji

1. Utworzyć `src/pages/generate/[id]/review.astro`, osadzić `<ReviewCandidatesPage client:load />`.
2. W `src/components/ReviewCandidatesPage.tsx` zainicjować stan: generation, candidates, selectedIds, editStates, loading, error.
3. Zaimplementować hook `useEffect` do pobrania danych generacji i kandydatów przy montowaniu komponentu.
4. Zaimplementować komponenty potomne:
   - `GenerationHeader` z akcjami zbiorczymi.
   - `CandidatesList` jako kontener.
   - `CandidateCard` z obsługą zaznaczania, edycji inline, akceptacji, odrzucenia.
5. Dodać logikę zaznaczania: `handleSelectAll`, `handleDeselectAll`, `handleToggleSelect`.
6. Dodać logikę akceptacji zbiorczej: `handleBulkAccept` z wywołaniem POST bulk accept.
7. Dodać logikę akceptacji pojedynczej: `handleAccept` z wywołaniem POST accept.
8. Dodać logikę odrzucenia: `handleReject` z wywołaniem POST reject.
9. Dodać logikę edycji: `handleEdit` z wywołaniem PATCH, walidacja długości przed wysłaniem.
10. Stylować komponenty używając Tailwind + shadcn/ui (Button, Checkbox, Card).
11. Dodać walidację frontendową (limity znaków, status kandydata).
12. Zaimplementować obsługę błędów: 401 → redirect, 404 → komunikat, 400 → szczegóły Zod, 500 → retry.
13. Dodać LoadingIndicator i ErrorMessage z ARIA-live.
14. Przetestować wszystkie ścieżki: load, select, edit, accept, reject, bulk accept, błędy.
15. Upewnić się, że dostępność ARIA jest spełniona (aria-labels, roles, focus management).
16. Dodać logowanie zdarzeń analitycznych (opcjonalnie): akceptacja, odrzucenie, edycja.
17. Review code, poprawić lintery, commit.


