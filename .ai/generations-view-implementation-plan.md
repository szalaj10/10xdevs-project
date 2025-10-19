# Plan implementacji widoku Generowania fiszek AI

## 1. Przegląd
Widok umożliwia wpisanie tematu (wolny tekst), wywołanie generacji AI poprzez POST `/api/generations`, pokazanie stanu ładowania i komunikatów o błędach, a po sukcesie przekierowanie do widoku recenzji kandydatów.

## 2. Routing widoku
Ścieżka: `/generate/new`

W `src/pages/generate/new.astro` osadzić wyspę React:
```astro
---
import GeneratePage from '../../components/GeneratePage';
---
<GeneratePage client:load />
```

## 3. Struktura komponentów

GeneratePage  
├─ NavBar (globalny)  
├─ Breadcrumbs (opcjonalnie)  
├─ TopicForm  
│  ├─ Textarea (`shadcn/ui`)  
│  └─ Button (`shadcn/ui`)  
├─ LoadingIndicator (`Spinner`)  
└─ ErrorMessage (ARIA-live)

## 4. Szczegóły komponentów

### GeneratePage
- Opis: wrapper, zarządza stanem topic|loading|error, wywołuje hook `useGenerate`.
- Elementy: NavBar, Breadcrumbs, TopicForm, LoadingIndicator, ErrorMessage.
- Zdarzenia:
  - onSubmit z TopicForm → wywołanie `generate(topic)`.
  - onSuccess → redirect do `/generate/${id}/review`.
  - onError → setError.
- Walidacja: topic przed wysłaniem minimalnie 3, maks. 500 znaków.
- Typy używane:
  - `CreateGenerationDTO`
  - `GenerationResponseVM`
- Props: brak.

### TopicForm
- Opis: formularz wpisania tematu.
- Elementy:
  - `<Textarea value={topic} onChange={...}/>`
  - `<Button disabled={loading}>Generuj</Button>`
- Zdarzenia:
  - onChange → ustaw `topic`
  - onClick → walidacja długości → onSubmit(topic)
- Walidacja:
  - topic.trim().length <3 → “Minimalnie 3 znaki”
  - >500 → “Maksymalnie 500 znaków”
- Typy:
  - `string`
- Props:
  - `topic: string`
  - `onSubmit: (topic: string) => void`
  - `loading: boolean`

### LoadingIndicator
- Opis: pokazuje spinner podczas fetch.
- Elementy: `<Spinner />`
- Zdarzenia: brak
- Props: `loading: boolean`

### ErrorMessage
- Opis: region ARIA-live do komunikatów błędów.
- Elementy: `<div role="alert">{error}</div>`
- Zdarzenia: brak
- Props: `error: string | null`

## 5. Typy

```ts
// DTO request/response z back-endu
interface CreateGenerationDTO {
  topic: string;
}
interface GenerationDTO { /* Tables<"generations"> */ }
interface CandidateCardDTO { /* Tables<"candidate_cards"> */ }
interface GetGenerationResponseDTO {
  generation: GenerationDTO;
  candidate_cards: CandidateCardDTO[];
}

// ViewModel wykorzystywany w UI
interface GenerationResponseVM {
  generationId: number;
  model: string;
  generatedCount: number;
  createdAt: string;
  candidateCards: Array<{ id: number; front: string; back: string }>;
}
```

## 6. Zarządzanie stanem

W `GeneratePage` (React):
```ts
const [topic, setTopic] = useState<string>('');
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string|null>(null);
const navigate = useNavigate();
async function generate(topic: string) {
  setError(null);
  setLoading(true);
  try {
    const res = await fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      credentials: 'include',
      body: JSON.stringify({ topic })
    });
    if (res.status === 401) return navigate('/login');
    const data: GetGenerationResponseDTO = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nieznany błąd');
    navigate(`/generate/${data.generation.id}/review`);
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setLoading(false);
  }
}
```

## 7. Integracja API
- Endpoint: POST `/api/generations`
- Request: `CreateGenerationDTO`
- Response: `GetGenerationResponseDTO`
- Fetch: `credentials: 'include'`
- Obsługa kodów: 201 → OK, 400 → wyświetl szczegóły Zod, 401 → redirect do login, 500 → komunikat ogólny.

## 8. Interakcje użytkownika
1. Użytkownik wpisuje temat.
2. Klik “Generuj”:
   - lokalna walidacja.
   - wyświetlenie spinnera.
3. Po sukcesie: automatyczne przejście do recenzji.
4. W przypadku błędu: wyświetlenie komunikatu + możliwość ponowienia.

## 9. Warunki i walidacja
- Min 3 znaki, max 500 (frontend + back-end).
- Błędy Zod z backendu (400) mapować na formę.
- 401 → redirect `/login`.
- 500 → “Wystąpił błąd serwera, spróbuj ponownie”.

## 10. Obsługa błędów
- Walidacja klienta przed fetch.
- parse error JSON → “Błąd komunikacji”.
- fetch error sieciowy → “Brak połączenia”.
- API error 400 → pokazanie `details` z Zod.
- 500 → ogólny alert i retry.
- 401 → redirect.

## 11. Kroki implementacji
1. Utworzyć `src/pages/generate/new.astro`, osadzić `<GeneratePage client:load />`.
2. W `src/components/GeneratePage.tsx` zainicjować stan i hooki.
3. Zaimplementować `TopicForm`, `LoadingIndicator`, `ErrorMessage`.
4. Dodać walidację długości w `TopicForm`.
5. Napisać logikę `generate(topic)` wewnątrz `GeneratePage`.
6. Stylować komponenty przy użyciu Tailwind + shadcn/ui.
7. Przetestować wszystkie ścieżki: success, walidacja, unauthorized, server error.
8. Upewnić się, że dostępność ARIA jest spełniona.
9. Dodać logowanie zdarzenia generacji (opcjonalnie analytics).
10. Review code, popraw lintery i commit.
