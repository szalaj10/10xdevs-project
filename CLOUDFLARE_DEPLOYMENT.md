# Cloudflare Pages Deployment Guide

## Przegląd

Projekt jest skonfigurowany do automatycznego wdrożenia na Cloudflare Pages przy każdym pushu do gałęzi `master`.

## Architektura

- **Framework**: Astro 5 z adapterem Cloudflare
- **Rendering**: Server-Side Rendering (SSR) na Cloudflare Workers
- **Hosting**: Cloudflare Pages z globalnym CDN
- **CI/CD**: GitHub Actions

## Konfiguracja początkowa

### 1. Utworzenie projektu Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages** > **Create application** > **Pages**
3. Wybierz **Connect to Git** lub **Direct Upload**
4. Dla Direct Upload: podaj nazwę projektu (np. `10xdevs-project`)

### 2. Konfiguracja GitHub Secrets

W repozytorium GitHub przejdź do **Settings** > **Secrets and variables** > **Actions** i dodaj następujące secrets:

#### Wymagane secrets dla Cloudflare:

```
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
CLOUDFLARE_PROJECT_NAME=<your-cloudflare-project-name>
```

#### Wymagane secrets dla aplikacji:

```
PUBLIC_SUPABASE_URL=<your-supabase-url>
PUBLIC_SUPABASE_KEY=<your-supabase-anon-key>
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 3. Jak uzyskać Cloudflare credentials

#### CLOUDFLARE_API_TOKEN

1. W Cloudflare Dashboard przejdź do **My Profile** > **API Tokens**
2. Kliknij **Create Token**
3. Użyj szablonu **Edit Cloudflare Workers** lub stwórz własny z uprawnieniami:
   - Account > Cloudflare Pages > Edit
4. Skopiuj wygenerowany token

#### CLOUDFLARE_ACCOUNT_ID

1. W Cloudflare Dashboard przejdź do **Workers & Pages**
2. Account ID znajdziesz w prawej kolumnie lub w URL dashboardu

#### CLOUDFLARE_PROJECT_NAME

- Nazwa projektu Cloudflare Pages (np. `10xdevs-project`)

### 4. Konfiguracja zmiennych środowiskowych w Cloudflare

W Cloudflare Dashboard dla swojego projektu:

1. Przejdź do **Settings** > **Environment variables**
2. Dodaj następujące zmienne dla środowiska **Production**:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_KEY`
   - `GROQ_API_KEY`
   - `GROQ_MODEL`
   - `GROQ_BASE_URL`

**Uwaga**: Zmienne ustawione w GitHub Actions są używane podczas buildu, ale zmienne w Cloudflare są dostępne w runtime.

## Proces wdrożenia

### Automatyczne wdrożenie

Każdy push do gałęzi `master` automatycznie uruchamia workflow `.github/workflows/master.yml`:

1. **Lint** - sprawdzenie jakości kodu (ESLint)
2. **Unit Tests** - uruchomienie testów jednostkowych (Vitest)
3. **Build** - kompilacja projektu Astro
4. **Deploy** - wdrożenie na Cloudflare Pages

### Ręczne wdrożenie

Możesz również uruchomić deployment ręcznie:

1. W GitHub przejdź do **Actions** > **Master CI/CD**
2. Kliknij **Run workflow** > wybierz gałąź `master` > **Run workflow**

### Lokalne testowanie buildu Cloudflare

```bash
# Build projektu
npm run build

# Podgląd lokalny z Wrangler (opcjonalnie)
npx wrangler pages dev dist
```

## Struktura plików

```
.
├── astro.config.mjs          # Konfiguracja Astro z adapterem Cloudflare
├── wrangler.toml             # Konfiguracja Cloudflare Workers/Pages
├── .github/
│   ├── workflows/
│   │   ├── master.yml        # CI/CD dla produkcji
│   │   └── pull-request.yml  # CI dla PR (bez deploymentu)
│   └── actions/
│       └── node-setup/       # Reusable action dla setup Node.js
└── dist/                     # Output buildu (generowany)
```

## Kluczowe zmiany w projekcie

### 1. astro.config.mjs

Zmieniono adapter z `@astrojs/node` na `@astrojs/cloudflare`:

```javascript
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
```

### 2. wrangler.toml

Dodano plik konfiguracyjny dla Cloudflare:

```toml
name = "10xdevs-project"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./dist"
```

### 3. GitHub Actions Workflow

Utworzono `master.yml` z krokami:
- Lint i testy jednostkowe
- Build projektu
- Deploy przez `cloudflare/wrangler-action@v3`

## Różnice między środowiskami

### Pull Request (pull-request.yml)

- Uruchamia: Lint, Unit Tests, E2E Tests
- **Nie** deployuje aplikacji
- Tworzy komentarz z wynikami testów

### Master (master.yml)

- Uruchamia: Lint, Unit Tests
- **Deployuje** na Cloudflare Pages
- **Nie** uruchamia E2E testów (aby przyspieszyć deployment)

## Monitorowanie i debugging

### Logi deployment

1. W GitHub Actions: **Actions** > wybierz workflow run
2. W Cloudflare: **Workers & Pages** > wybierz projekt > **Deployments**

### Cloudflare Analytics

W Cloudflare Dashboard możesz monitorować:
- Ruch i wydajność
- Błędy i logi Workers
- Wykorzystanie zasobów

### Rollback

Jeśli deployment zawiera błędy:

1. W Cloudflare Dashboard przejdź do **Deployments**
2. Znajdź poprzedni, działający deployment
3. Kliknij **Rollback to this deployment**

## Troubleshooting

### Problem: "Missing script: buil"

**Rozwiązanie**: W Cloudflare Dashboard > Settings > Builds and deployments > Build command, upewnij się że jest `npm run build` (nie `npm run buil`).

### Problem: Build timeout

**Rozwiązanie**: 
- Sprawdź czy `node_modules` nie są commitowane do repo
- Upewnij się że `.nvmrc` zawiera poprawną wersję Node.js (22.14.0)

### Problem: Environment variables nie działają

**Rozwiązanie**:
- Zmienne używane podczas buildu: ustaw w GitHub Secrets
- Zmienne używane w runtime: ustaw w Cloudflare Dashboard > Settings > Environment variables

### Problem: SSR nie działa

**Rozwiązanie**:
- Upewnij się że `output: "server"` w `astro.config.mjs`
- Sprawdź czy adapter Cloudflare jest poprawnie skonfigurowany
- Zweryfikuj czy `@astrojs/cloudflare` jest zainstalowany

## Limity Cloudflare Pages (Free Plan)

- **Builds**: 500 builds/miesiąc
- **Bandwidth**: Unlimited
- **Requests**: 100,000/dzień
- **Build time**: 20 minut/build
- **Workers CPU time**: 10ms/request

Dla większych projektów rozważ plan **Pages Pro** ($20/miesiąc).

## Następne kroki

1. ✅ Skonfiguruj GitHub Secrets
2. ✅ Utwórz projekt w Cloudflare Pages
3. ✅ Ustaw zmienne środowiskowe w Cloudflare
4. ✅ Push do gałęzi `master` aby uruchomić pierwszy deployment
5. ✅ Zweryfikuj deployment w Cloudflare Dashboard
6. ✅ Skonfiguruj custom domain (opcjonalnie)

## Przydatne linki

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions - Cloudflare](https://github.com/cloudflare/wrangler-action)

