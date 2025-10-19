### Minimalne CI/CD — 10xDevs Flashcards

Ten plik opisuje minimalny pipeline CI uruchamiany na GitHub Actions, który:
- uruchamia lint, testy jednostkowe (Vitest) oraz build produkcyjny (Astro),
- może opcjonalnie uruchomić testy E2E (Playwright),
- odpala się: ręcznie (workflow_dispatch) oraz automatycznie po pushu do gałęzi `master`.

#### Plik workflow
Zdefiniowany w: `.github/workflows/ci.yml`.

Jobs:
- Lint, Unit Tests, Build: `eslint`, `vitest --run`, `astro build` i upload artefaktu `dist/`.
- Playwright E2E (opcjonalny): uruchamiany wyłącznie przy ręcznym wywołaniu z parametrem `run-e2e=true`.

#### Wymagane wersje
- Node.js: 22 (actions/setup-node ustawia `node-version: 22`).

#### Sekrety/zmienne środowiskowe
Do działania builda i/lub E2E skonfiguruj w repo (Settings → Secrets and variables → Actions → New repository secret):
- `PUBLIC_SUPABASE_URL` — URL projektu Supabase (np. `https://xyz.supabase.co` lub lokalny `http://127.0.0.1:54321`).
- `PUBLIC_SUPABASE_KEY` — klucz anon (publiczny) Supabase.

Dodatkowo dla E2E (zalecane testowe konto użytkownika):
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Opcjonalne (jeśli testy dotykają AI):
- `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`

Uwaga: Build produkcyjny w jobie ma bezpieczne wartości domyślne, jeśli powyższe sekrety nie są ustawione. E2E wymagają realnych wartości.

#### Jak uruchomić
- Automatycznie: push do `master` uruchomi job „Lint, Unit Tests, Build”.
- Ręcznie: zakładka Actions → workflow „CI” → „Run workflow”.
  - Aby uruchomić E2E, ustaw input `run-e2e` na `true` przed startem.

#### Artefakty
- `dist/` z buildem produkcyjnym (do pobrania z zakładki run → Artifacts → `dist`).
- Raport Playwright (jeśli E2E uruchomione): Artifacts → `playwright-report`.


