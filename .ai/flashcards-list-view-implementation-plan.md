# Plan implementacji widoku Listy Fiszek

## 1. Przegląd
Widok umożliwia przeglądanie wszystkich fiszek użytkownika z możliwością wyszukiwania po froncie, sortowania (po dacie utworzenia lub terminie powtórki), edycji i usuwania kart. Widok pobiera listę fiszek przez GET `/api/flashcards` z opcjonalnymi parametrami query (search, sort, page, limit), umożliwia edycję przez PATCH `/api/flashcards/:id`, usuwanie przez DELETE `/api/flashcards/:id` oraz dodawanie nowych kart przez POST `/api/flashcards`. Dodatkowo widok obsługuje ręczne dodawanie fiszek z walidacją duplikatów.

## 2. Routing widoku
Ścieżka: `/flashcards`

W `src/pages/flashcards/index.astro` osadzić wyspę React:
```astro
---
import FlashcardsListPage from '../../components/FlashcardsListPage';
---
<FlashcardsListPage client:load />
```

## 3. Struktura komponentów

FlashcardsListPage  
├─ NavBar (globalny)  
├─ PageHeader  
│  ├─ SearchInput (wyszukiwanie po front)  
│  ├─ SortSelect (sortowanie: created_at, due)  
│  └─ Button "Dodaj fiszkę" (otwiera AddFlashcardDialog)  
├─ FlashcardsList  
│  └─ FlashcardItem (wielokrotnie)  
│     ├─ FlashcardContent (front/back)  
│     └─ FlashcardActions  
│        ├─ Button Edytuj (otwiera EditFlashcardDialog)  
│        └─ Button Usuń (otwiera ConfirmDialog)  
├─ Pagination (lub Infinite Scroll)  
├─ AddFlashcardDialog (Dialog shadcn/ui)  
│  ├─ Form  
│  │  ├─ Textarea front  
│  │  ├─ Textarea back  
│  │  └─ Input source (opcjonalny)  
│  └─ DuplicateWarning (jeśli wykryto podobny front)  
├─ EditFlashcardDialog (Dialog shadcn/ui)  
│  ├─ Form  
│  │  ├─ Textarea front  
│  │  ├─ Textarea back  
│  │  └─ Input source (opcjonalny)  
│  └─ MarkdownPreview  
├─ ConfirmDialog (Dialog shadcn/ui)  
├─ LoadingIndicator (Skeleton lub Spinner)  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### FlashcardsListPage
- Opis: główny kontener widoku, zarządza stanem listy fiszek, wyszukiwania, sortowania, paginacji oraz operacji CRUD.
- Elementy: NavBar, PageHeader, FlashcardsList, Pagination, AddFlashcardDialog, EditFlashcardDialog, ConfirmDialog, LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onLoad → pobierz fiszki przez GET `/api/flashcards` z parametrami query.
  - onSearch(searchTerm) → aktualizuj query params, pobierz fiszki.
  - onSortChange(sort) → aktualizuj query params, pobierz fiszki.
  - onPageChange(page) → aktualizuj query params, pobierz fiszki.
  - onAdd(flashcard) → POST `/api/flashcards`, dodaj do listy.
  - onEdit(id, flashcard) → PATCH `/api/flashcards/:id`, zaktualizuj w liście.
  - onDelete(id) → DELETE `/api/flashcards/:id`, usuń z listy.
- Walidacja: ID fiszki musi być liczbą, parametry query muszą być zgodne z schema.
- Typy używane:
  - `ListFlashcardsQueryDTO`
  - `ListFlashcardsResponseDTO`
  - `FlashcardDTO`
  - `CreateFlashcardDTO`
  - `EditFlashcardDTO`
  - `FlashcardsListVM` (ViewModel)
- Props: brak (zarządza stanem wewnętrznie).

### PageHeader
- Opis: nagłówek strony z wyszukiwaniem, sortowaniem i przyciskiem dodawania.
- Elementy:
  - `<Input type="search" placeholder="Szukaj po froncie..." value={search} onChange={onSearchChange} />`
  - `<Select value={sort} onValueChange={onSortChange}>`
    - `<option value="created_at">Data utworzenia</option>`
    - `<option value="due">Termin powtórki</option>`
  - `<Button onClick={onOpenAddDialog}>Dodaj fiszkę</Button>`
- Zdarzenia:
  - onSearchChange → debounce 300ms, wywołaj onSearch.
  - onSortChange → wywołaj onSortChange z nową wartością.
  - onOpenAddDialog → otwórz AddFlashcardDialog.
- Walidacja: brak (search może być pusty).
- Typy:
  - `string` (search)
  - `"created_at" | "due"` (sort)
- Props:
  - `search: string`
  - `sort: "created_at" | "due"`
  - `onSearch: (search: string) => void`
  - `onSortChange: (sort: "created_at" | "due") => void`
  - `onOpenAddDialog: () => void`

### FlashcardsList
- Opis: lista wszystkich fiszek użytkownika.
- Elementy:
  - Mapowanie `flashcards.map(f => <FlashcardItem key={f.id} ... />)`
  - Jeśli lista pusta: `<div>Brak fiszek. Dodaj pierwszą fiszkę!</div>`
- Zdarzenia: brak (przekazuje callbacki do dzieci).
- Walidacja: brak.
- Typy:
  - `FlashcardDTO[]`
- Props:
  - `flashcards: FlashcardDTO[]`
  - `onEdit: (id: number) => void`
  - `onDelete: (id: number) => void`

### FlashcardItem
- Opis: pojedyncza fiszka na liście z akcjami.
- Elementy:
  - `<div>`
    - `<h3>{front}</h3>`
    - `<p>{back}</p>`
    - `<small>Źródło: {source || 'Ręczne'}</small>`
    - `<small>Utworzono: {formatDate(created_at)}</small>`
  - `</div>`
  - `<div>`
    - `<Button onClick={() => onEdit(id)}>Edytuj</Button>`
    - `<Button onClick={() => onDelete(id)} variant="destructive">Usuń</Button>`
  - `</div>`
- Zdarzenia:
  - onClick Edytuj → wywołaj onEdit(id).
  - onClick Usuń → wywołaj onDelete(id) (otwiera ConfirmDialog).
- Walidacja: brak.
- Typy:
  - `FlashcardDTO`
- Props:
  - `flashcard: FlashcardDTO`
  - `onEdit: (id: number) => void`
  - `onDelete: (id: number) => void`

### AddFlashcardDialog
- Opis: modal dodawania nowej fiszki z walidacją i wykrywaniem duplikatów.
- Elementy:
  - `<Dialog open={isOpen} onOpenChange={onClose}>`
  - `<DialogHeader>Dodaj nową fiszkę</DialogHeader>`
  - `<DialogContent>`
    - `<Form onSubmit={handleSubmit}>`
      - `<Label htmlFor="front">Front (max 200 znaków)</Label>`
      - `<Textarea id="front" value={front} onChange={e => setFront(e.target.value)} maxLength={200} required />`
      - `<Label htmlFor="back">Back (max 350 znaków)</Label>`
      - `<Textarea id="back" value={back} onChange={e => setBack(e.target.value)} maxLength={350} required />`
      - `<Label htmlFor="source">Źródło (opcjonalne)</Label>`
      - `<Input id="source" value={source} onChange={e => setSource(e.target.value)} />`
      - Jeśli `warnings.length > 0`: `<Alert variant="warning">{warnings.join(', ')}</Alert>`
      - `<Button type="submit" disabled={loading}>Dodaj</Button>`
      - `<Button type="button" onClick={onClose} variant="outline">Anuluj</Button>`
  - `</Dialog>`
- Zdarzenia:
  - onSubmit → walidacja długości → POST `/api/flashcards` → jeśli sukces, zamknij dialog i odśwież listę.
  - onChange front/back → walidacja długości inline.
  - Jeśli API zwraca warnings (duplikaty) → wyświetl alert, ale pozwól na dodanie.
- Walidacja:
  - front: 1-200 znaków.
  - back: 1-350 znaków.
  - source: opcjonalny, maksymalnie 100 znaków.
- Typy:
  - `CreateFlashcardDTO`
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onAdd: (flashcard: CreateFlashcardDTO) => Promise<void>`

### EditFlashcardDialog
- Opis: modal edycji istniejącej fiszki z podglądem Markdown.
- Elementy:
  - `<Dialog open={isOpen} onOpenChange={onClose}>`
  - `<DialogHeader>Edytuj fiszkę</DialogHeader>`
  - `<DialogContent>`
    - `<Form onSubmit={handleSubmit}>`
      - `<Label htmlFor="front">Front</Label>`
      - `<Textarea id="front" value={front} onChange={e => setFront(e.target.value)} maxLength={200} required />`
      - `<MarkdownPreview content={front} />`
      - `<Label htmlFor="back">Back</Label>`
      - `<Textarea id="back" value={back} onChange={e => setBack(e.target.value)} maxLength={350} required />`
      - `<MarkdownPreview content={back} />`
      - `<Label htmlFor="source">Źródło</Label>`
      - `<Input id="source" value={source} onChange={e => setSource(e.target.value)} />`
      - `<Button type="submit" disabled={loading}>Zapisz</Button>`
      - `<Button type="button" onClick={onClose} variant="outline">Anuluj</Button>`
  - `</Dialog>`
- Zdarzenia:
  - onSubmit → walidacja → PATCH `/api/flashcards/:id` → zamknij dialog i zaktualizuj listę.
  - onChange front/back → aktualizacja podglądu Markdown.
- Walidacja:
  - front: 1-200 znaków.
  - back: 1-350 znaków.
  - source: opcjonalny.
- Typy:
  - `EditFlashcardDTO`
- Props:
  - `flashcard: FlashcardDTO | null`
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onEdit: (id: number, data: EditFlashcardDTO) => Promise<void>`

### ConfirmDialog
- Opis: modal potwierdzenia usunięcia fiszki.
- Elementy:
  - `<AlertDialog open={isOpen} onOpenChange={onClose}>`
  - `<AlertDialogHeader>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogHeader>`
  - `<AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>`
  - `<AlertDialogFooter>`
    - `<Button onClick={onConfirm} variant="destructive">Usuń</Button>`
    - `<Button onClick={onClose} variant="outline">Anuluj</Button>`
  - `</AlertDialogFooter>`
  - `</AlertDialog>`
- Zdarzenia:
  - onConfirm → wywołaj DELETE `/api/flashcards/:id`, zamknij dialog, usuń z listy.
  - onClose → zamknij dialog bez usuwania.
- Walidacja: brak.
- Typy: brak.
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => void`

### Pagination
- Opis: nawigacja między stronami wyników.
- Elementy:
  - `<div>`
    - `<Button onClick={() => onPageChange(page - 1)} disabled={page === 1}>Poprzednia</Button>`
    - `<span>Strona {page} z {totalPages}</span>`
    - `<Button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Następna</Button>`
  - `</div>`
- Zdarzenia:
  - onPageChange(page) → aktualizuj query params, pobierz fiszki.
- Walidacja: page musi być >= 1 i <= totalPages.
- Typy: `number`
- Props:
  - `page: number`
  - `totalPages: number`
  - `onPageChange: (page: number) => void`

### LoadingIndicator
- Opis: pokazuje skeleton lub spinner podczas ładowania listy.
- Elementy: `<Skeleton />` lub `<Spinner />`
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
import type { 
  ListFlashcardsQueryDTO, 
  ListFlashcardsResponseDTO, 
  FlashcardDTO, 
  CreateFlashcardDTO, 
  EditFlashcardDTO 
} from '@/types';

// ViewModel dla widoku listy fiszek
interface FlashcardsListVM {
  flashcards: FlashcardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  search: string;
  sort: "created_at" | "due";
  loading: boolean;
  error: string | null;
}

// Stan dialogów
interface DialogState {
  addDialog: boolean;
  editDialog: boolean;
  confirmDialog: boolean;
  editingFlashcard: FlashcardDTO | null;
  deletingFlashcardId: number | null;
}

// Response z API dla create/edit (może zawierać warnings)
interface FlashcardActionResponse {
  flashcard?: FlashcardDTO;
  flashcards?: FlashcardDTO[];
  warnings?: string[];
}
```

## 6. Zarządzanie stanem

W `FlashcardsListPage` (React):
```ts
const navigate = useNavigate();
const [searchParams, setSearchParams] = useSearchParams();

// Query params z URL
const search = searchParams.get('search') || '';
const sort = (searchParams.get('sort') as "created_at" | "due") || 'created_at';
const page = Number(searchParams.get('page')) || 1;
const limit = Number(searchParams.get('limit')) || 20;

// Stan listy fiszek
const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

// Stan dialogów
const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);
const [deletingFlashcardId, setDeletingFlashcardId] = useState<number | null>(null);
const [warnings, setWarnings] = useState<string[]>([]);

// Pobranie fiszek z API
const fetchFlashcards = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const queryParams = new URLSearchParams();
    if (search) queryParams.set('search', search);
    queryParams.set('sort', sort);
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    const res = await fetch(`/api/flashcards?${queryParams.toString()}`, {
      credentials: 'include'
    });
    
    if (res.status === 401) return navigate('/login');
    if (!res.ok) throw new Error('Błąd pobierania fiszek');
    
    const data = await res.json();
    setFlashcards(data.flashcards);
    setPagination(data.pagination);
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setLoading(false);
  }
}, [search, sort, page, limit]);

useEffect(() => {
  fetchFlashcards();
}, [fetchFlashcards]);

// Debounced search
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('search', value);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1'); // Reset do pierwszej strony
      return newParams;
    });
  }, 300),
  []
);

const handleSearchChange = (value: string) => {
  debouncedSearch(value);
};

const handleSortChange = (newSort: "created_at" | "due") => {
  setSearchParams(prev => {
    const newParams = new URLSearchParams(prev);
    newParams.set('sort', newSort);
    newParams.set('page', '1');
    return newParams;
  });
};

const handlePageChange = (newPage: number) => {
  setSearchParams(prev => {
    const newParams = new URLSearchParams(prev);
    newParams.set('page', String(newPage));
    return newParams;
  });
};

// Dodawanie fiszki
const handleAdd = async (data: CreateFlashcardDTO) => {
  setError(null);
  setWarnings([]);
  try {
    const res = await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd dodawania fiszki');
    }
    
    const result: FlashcardActionResponse = await res.json();
    if (result.warnings) setWarnings(result.warnings);
    
    // Odśwież listę
    await fetchFlashcards();
    setIsAddDialogOpen(false);
  } catch (e) {
    setError((e as Error).message);
  }
};

// Edycja fiszki
const handleEdit = async (id: number, data: EditFlashcardDTO) => {
  setError(null);
  try {
    const res = await fetch(`/api/flashcards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Błąd edycji fiszki');
    }
    
    const result = await res.json();
    setFlashcards(prev => prev.map(f => f.id === id ? result.flashcard : f));
    setIsEditDialogOpen(false);
    setEditingFlashcard(null);
  } catch (e) {
    setError((e as Error).message);
  }
};

// Usuwanie fiszki
const handleDelete = async () => {
  if (!deletingFlashcardId) return;
  setError(null);
  try {
    const res = await fetch(`/api/flashcards/${deletingFlashcardId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!res.ok) throw new Error('Błąd usuwania fiszki');
    
    setFlashcards(prev => prev.filter(f => f.id !== deletingFlashcardId));
    setIsConfirmDialogOpen(false);
    setDeletingFlashcardId(null);
  } catch (e) {
    setError((e as Error).message);
  }
};

// Otwieranie dialogów
const openEditDialog = (flashcard: FlashcardDTO) => {
  setEditingFlashcard(flashcard);
  setIsEditDialogOpen(true);
};

const openDeleteConfirm = (id: number) => {
  setDeletingFlashcardId(id);
  setIsConfirmDialogOpen(true);
};
```

## 7. Integracja API

### GET /api/flashcards
- Request: query params
  ```ts
  {
    search?: string;
    sort?: "created_at" | "due";
    page?: number;
    limit?: number;
  }
  ```
- Response (200): 
  ```ts
  {
    flashcards: FlashcardDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  ```
- Kody błędów: 400 → walidacja query params, 401 → redirect `/login`, 500 → komunikat ogólny.

### POST /api/flashcards
- Request: `CreateFlashcardDTO`
  ```ts
  {
    front: string;  // max 200
    back: string;   // max 350
    source?: string;
  }
  ```
- Response (201):
  ```ts
  {
    flashcard: FlashcardDTO;
    warnings?: string[];  // ostrzeżenia o duplikatach
  }
  ```
- Kody błędów: 400 → walidacja Zod, 401, 500.

### PATCH /api/flashcards/:id
- Request: `EditFlashcardDTO`
  ```ts
  {
    front?: string;
    back?: string;
    source?: string;
  }
  ```
- Response (200):
  ```ts
  {
    flashcard: FlashcardDTO;
  }
  ```
- Kody błędów: 400, 401, 404 → fiszka nie znaleziona, 500.

### DELETE /api/flashcards/:id
- Request: brak body
- Response (200):
  ```ts
  {
    message: "Flashcard deleted successfully"
  }
  ```
- Kody błędów: 401, 404, 500.

## 8. Interakcje użytkownika

1. **Ładowanie widoku:**
   - Użytkownik wchodzi na `/flashcards`.
   - Widok pobiera fiszki z domyślnymi parametrami (sort: created_at, page: 1, limit: 20).
   - Wyświetlenie skeleton podczas ładowania.
   - Po sukcesie: lista fiszek z paginacją.

2. **Wyszukiwanie:**
   - Użytkownik wpisuje tekst w polu search.
   - Po 300ms debounce → aktualizacja URL query params → pobranie fiszek z filtrem.
   - Lista odświeża się automatycznie.

3. **Sortowanie:**
   - Użytkownik wybiera opcję z dropdown (Data utworzenia / Termin powtórki).
   - Aktualizacja URL query params → pobranie fiszek z nowym sortowaniem.
   - Reset do strony 1.

4. **Paginacja:**
   - Użytkownik klika "Następna" lub "Poprzednia".
   - Aktualizacja URL query params → pobranie fiszek dla nowej strony.

5. **Dodawanie fiszki:**
   - Klik "Dodaj fiszkę" → otwiera AddFlashcardDialog.
   - Użytkownik wypełnia pola front, back, opcjonalnie source.
   - Walidacja długości inline.
   - Klik "Dodaj" → POST → jeśli sukces, zamknij dialog i odśwież listę.
   - Jeśli API zwraca warnings (duplikaty) → wyświetl alert, ale dodaj fiszkę.

6. **Edycja fiszki:**
   - Klik "Edytuj" przy fiszce → otwiera EditFlashcardDialog z danymi fiszki.
   - Użytkownik modyfikuje pola, podgląd Markdown aktualizuje się na bieżąco.
   - Klik "Zapisz" → PATCH → jeśli sukces, zamknij dialog i zaktualizuj fiszkę w liście.

7. **Usuwanie fiszki:**
   - Klik "Usuń" przy fiszce → otwiera ConfirmDialog.
   - Użytkownik potwierdza → DELETE → fiszka znika z listy.
   - Użytkownik anuluje → zamknij dialog bez zmian.

## 9. Warunki i walidacja

### Walidacja frontendowa:
- **Search:**
  - Brak ograniczeń, może być pusty.
- **Sort:**
  - Wartości: `"created_at"` lub `"due"`.
  - Domyślnie: `"created_at"`.
- **Page:**
  - Minimum 1, maksimum totalPages.
- **Limit:**
  - Wartości: 10, 20, 50, 100.
  - Domyślnie: 20.
- **Front (add/edit):**
  - Minimum 1 znak (po trim), maksimum 200 znaków.
  - Komunikat: "Front musi zawierać od 1 do 200 znaków".
- **Back (add/edit):**
  - Minimum 1 znak (po trim), maksimum 350 znaków.
  - Komunikat: "Back musi zawierać od 1 do 350 znaków".
- **Source:**
  - Opcjonalny, maksimum 100 znaków.

### Walidacja backendowa:
- Błędy Zod (400) mapować na komunikaty:
  - "front" → szczegóły błędu dla front.
  - "back" → szczegóły błędu dla back.
- Warnings (duplikaty) → wyświetl jako alert, ale nie blokuj dodania.

## 10. Obsługa błędów

### Scenariusze błędów:
1. **Brak autoryzacji (401):**
   - Automatyczne przekierowanie do `/login`.

2. **Fiszka nie znaleziona (404):**
   - Komunikat: "Fiszka nie została znaleziona".
   - Odśwież listę.

3. **Błąd walidacji (400):**
   - Wyświetl szczegóły błędu Zod inline w formularzu.
   - Użytkownik może poprawić dane i ponowić operację.

4. **Błąd sieciowy:**
   - Komunikat: "Brak połączenia z serwerem".
   - Opcja retry.

5. **Błąd serwera (500):**
   - Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później".
   - Opcja retry.

6. **Duplikaty (warnings):**
   - Wyświetl alert: "Znaleziono podobną fiszkę: [front]. Czy na pewno chcesz dodać?"
   - Pozwól na kontynuację (nie blokuj).

### Handling w kodzie:
```ts
try {
  // operacja API
} catch (error) {
  if (error.response?.status === 401) {
    navigate('/login');
  } else if (error.response?.status === 404) {
    setError('Fiszka nie została znaleziona');
    fetchFlashcards(); // odśwież listę
  } else if (error.response?.status === 400) {
    const errorData = await error.response.json();
    setError(errorData.error || 'Błąd walidacji');
  } else {
    setError('Wystąpił nieoczekiwany błąd');
  }
}
```

## 11. Kroki implementacji

1. Utworzyć `src/pages/flashcards/index.astro`, osadzić `<FlashcardsListPage client:load />`.
2. W `src/components/FlashcardsListPage.tsx` zainicjować stan: flashcards, pagination, search, sort, loading, error, dialogs.
3. Zaimplementować hook `useEffect` do pobrania fiszek na podstawie query params z URL.
4. Zaimplementować `fetchFlashcards` jako useCallback z zależnościami od search, sort, page, limit.
5. Zaimplementować komponenty potomne:
   - `PageHeader` z search input, sort select, przyciskiem "Dodaj".
   - `FlashcardsList` jako kontener.
   - `FlashcardItem` z akcjami Edit/Delete.
   - `Pagination` z przyciskami Poprzednia/Następna.
6. Zaimplementować `AddFlashcardDialog` z formularzem i walidacją długości.
7. Zaimplementować `EditFlashcardDialog` z formularzem, walidacją i podglądem Markdown.
8. Zaimplementować `ConfirmDialog` do potwierdzenia usunięcia.
9. Dodać logikę search z debounce 300ms.
10. Dodać logikę sortowania i paginacji (aktualizacja URL query params).
11. Dodać logikę CRUD: handleAdd, handleEdit, handleDelete.
12. Stylować komponenty używając Tailwind + shadcn/ui (Dialog, Button, Input, Textarea, Select, Alert).
13. Dodać walidację frontendową (limity znaków, required fields).
14. Zaimplementować obsługę błędów: 401 → redirect, 404 → komunikat, 400 → szczegóły Zod, 500 → retry.
15. Dodać LoadingIndicator (Skeleton) i ErrorMessage z ARIA-live.
16. Zaimplementować wykrywanie duplikatów (warnings z API) i wyświetlanie alertu.
17. Przetestować wszystkie ścieżki: load, search, sort, pagination, add, edit, delete, błędy.
18. Upewnić się, że dostępność ARIA jest spełniona (labels, roles, focus management w dialogach).
19. Dodać logowanie zdarzeń analitycznych (opcjonalnie): dodanie, edycja, usunięcie.
20. Review code, poprawić lintery, commit.


