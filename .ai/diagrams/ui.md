<architecture_analysis>
1) Komponenty i elementy związane z autentykacją (z kodu i specyfikacji):
- Strony Astro: `login.astro` (istnieje), `reset-password/confirm.astro` (nowa), `verify-email.astro` (opcjonalna), `generate/new.astro`, `generate/[id]/review.astro`, layout `src/layouts/Layout.astro`.
- Komponenty React: `AuthPage.tsx` (login/rejestracja/reset link), `ResetPasswordConfirmPage.tsx` (nowy), `EmailVerificationResultPage.tsx` (opc.), `NavBar.tsx` (Wyloguj), `GeneratePage.tsx` (US‑003), `ReviewCandidatesPage.tsx` (US‑004).
- Hooki/stany: `useAuthGuard` (client-side guard), `useSupabase` (klient w przeglądarce).
- Lib: `lib/auth.ts` (`getAccessToken`), `lib/schemas.ts` (Zod – walidacje API domeny), usługi: `generationService.ts`, `candidateService.ts`.
- Middleware: `src/middleware/index.ts` (tworzenie klienta Supabase, bez SSR‑redirectów), plan SSR: `@supabase/ssr` (HTTP‑only cookies w PROD).
- API (Astro routes): Generations/Candidates (bez wpisywania URL węzłów w diagramie).
- Supabase: Auth, Postgres (RLS), sesje (cookies).

2) Główne strony i ich komponenty:
- `/login` → `login.astro` → montuje `AuthPage` (React).
- `/reset-password/confirm` → `reset-password/confirm.astro` → montuje `ResetPasswordConfirmPage` (React).
- (opc.) `/verify-email` → `verify-email.astro` → montuje `EmailVerificationResultPage` (React).
- `/generate/new` → `generate/new.astro` → montuje `GeneratePage` (React) + `useAuthGuard`.
- `/generate/[id]/review` → `generate/[id]/review.astro` → montuje `ReviewCandidatesPage` (React) + `useAuthGuard`.
- `Layout.astro` → zawiera `NavBar` (Wyloguj).

3) Przepływ danych:
- AuthPage → Supabase Auth (signIn/signUp/reset) → Sesja w cookies (w PROD HTTP‑only, server‑managed) → redirect do `redirectTo`.
- `useAuthGuard` → sprawdza sesję przez Supabase SDK → redirect do `/login` gdy brak.
- Generate/Review → wywołują API (fetch, opcjonalnie Bearer z `getAccessToken`) → Middleware dołącza supabase do `context.locals` → Services → DB → odpowiedź → UI.
- NavBar „Wyloguj” → `supabase.auth.signOut()` → redirect do `/login`.

4) Krótkie opisy funkcji komponentów:
- AuthPage: formularze login/rejestracja/reset link z walidacją i komunikatami; redirect po sukcesie.
- ResetPasswordConfirmPage: ustawienie nowego hasła w sesji recovery; powrót do logowania.
- EmailVerificationResultPage (opc.): informuje o wyniku weryfikacji i kieruje do logowania.
- useAuthGuard: chroni widoki; przekierowuje niezalogowanych na `/login` z `redirectTo`.
- GeneratePage: uruchamia generację, lokalna walidacja tematu, obsługa błędów; wymaga sesji.
- ReviewCandidatesPage: pobiera generację + kandydatów; akceptuje/odrzuca/edytuje; wymaga sesji.
- NavBar: linki nawigacji, akcja Wyloguj.
- Middleware: tworzy klienta Supabase, zarządza cookies; bez SSR‑redirectów (zapobiega pętli).
</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD

  %% Klasy stylów
  classDef updated fill:#eaf5ff,stroke:#1e88e5,stroke-width:2px;
  classDef optional fill:#f9f7e8,stroke:#c9a227,stroke-width:1.5px;
  classDef backend fill:#f3f3f3,stroke:#777,stroke-width:1.5px;
  classDef state fill:#eefbf2,stroke:#2e7d32,stroke-width:1.5px;

  %% Warstwa UI (Astro + React)
  subgraph UI["Warstwa UI (Astro + React)"]
    direction TB

    subgraph Pages["Strony Astro"]
      LoginPage["Login (login.astro)"]
      ResetConfirmPage["Reset Hasła (reset-password/confirm.astro)"]:::updated
      VerifyEmailPage["Weryfikacja E‑mail (verify-email.astro)"]:::optional
      GenerateNewPage["Generuj (generate/new.astro)"]
      ReviewPage["Recenzja (generate/[id]/review.astro)"]
      LayoutPage["Layout (Layout.astro)"]
    end

    subgraph Components["Komponenty React"]
      AuthPage["AuthPage (login/rejestracja/reset)"]
      ResetPasswordConfirmCmp["ResetPasswordConfirmPage"]:::updated
      EmailVerificationCmp["EmailVerificationResultPage"]:::optional
      NavBar["NavBar (Wyloguj)"]:::updated
      GenerateCmp["GeneratePage"]:::updated
      ReviewCmp["ReviewCandidatesPage"]:::updated
    end

    subgraph StateHooks["Hooki i stan"]
      useAuthGuard["useAuthGuard"]:::updated
      useSupabase["useSupabase"]
      getAccessToken["getAccessToken (lib/auth)"]
    end
  end

  %% Backend / SSR / Auth / DB
  subgraph Backend["Warstwa SSR/Backend"]
    direction TB
    Middleware["Middleware (middleware/index.ts)"]:::backend
    API_Generations["API: Generations"]:::backend
    API_Candidates["API: Candidates"]:::backend
    Services["Usługi domenowe (generation/candidate)"]:::backend
    DB["DB: Supabase Postgres (RLS)"]:::backend
  end

  subgraph Auth["Moduł Autentykacji"]
    direction TB
    SupabaseAuth(("Supabase Auth"))
    Session["Sesja (cookies)\nHTTP‑only w PROD"]:::state
  end

  %% Powiązania stron z komponentami
  LoginPage --> AuthPage
  ResetConfirmPage --> ResetPasswordConfirmCmp
  VerifyEmailPage --> EmailVerificationCmp
  GenerateNewPage --> GenerateCmp
  ReviewPage --> ReviewCmp
  LayoutPage --> NavBar

  %% Przepływy autentykacji
  AuthPage -- "signIn / signUp / reset link" --> SupabaseAuth
  SupabaseAuth -- "Set‑Cookie" --> Session
  useAuthGuard -. "getSession" .-> SupabaseAuth
  NavBar -- "signOut" --> SupabaseAuth
  AuthPage -- "redirect po sukcesie (redirectTo)" --> GenerateNewPage

  %% Ochrona widoków i nawigacja
  useAuthGuard -. "brak sesji → /login?redirectTo" .-> LoginPage
  GenerateCmp -. uses .-> useAuthGuard
  ReviewCmp -. uses .-> useAuthGuard

  %% Wywołania API z UI
  getAccessToken -. "Bearer (jeśli dostępny)" .-> GenerateCmp
  getAccessToken -. "Bearer (jeśli dostępny)" .-> ReviewCmp
  GenerateCmp -- "żądania (POST/GET)" --> API_Generations
  ReviewCmp -- "operacje (GET/PATCH/POST)" --> API_Candidates

  %% Backend przepływ
  Middleware --- API_Generations
  Middleware --- API_Candidates
  API_Generations --> Services
  API_Candidates --> Services
  Services --> DB

  %% Sesja a Backend
  Session --- Middleware

```
</mermaid_diagram>


