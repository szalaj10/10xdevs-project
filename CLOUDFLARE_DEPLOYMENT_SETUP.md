# Cloudflare Pages Deployment Setup

## Wprowadzone zmiany

### 1. Konfiguracja Astro dla Cloudflare Pages

Plik `astro.config.mjs` został zaktualizowany, aby używać adaptera Cloudflare zamiast Node.js:

```javascript
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  // ... pozostała konfiguracja
});
```

**Uwaga:** Adapter `@astrojs/cloudflare` jest już zainstalowany jako devDependency w projekcie.

### 2. GitHub Actions Workflow dla Deploymentu

Utworzono nowy workflow `.github/workflows/master.yml`, który automatycznie wdraża aplikację na Cloudflare Pages po każdym pushu do gałęzi `master`.

#### Workflow składa się z trzech jobów:

1. **Lint** - Sprawdza jakość kodu za pomocą ESLint
2. **Unit Tests** - Uruchamia testy jednostkowe z pokryciem kodu (Vitest)
3. **Deploy** - Buduje i wdraża aplikację na Cloudflare Pages

### 3. Aktualizacja wersji akcji GitHub

Zaktualizowano composite action `.github/actions/node-setup/action.yml`:
- `actions/setup-node` z v4 na v6 (najnowsza wersja)

Workflow używa najnowszych wersji akcji:
- `actions/checkout@v5`
- `actions/setup-node@v6` (w composite action)
- `actions/upload-artifact@v4`
- `cloudflare/wrangler-action@v3`

## Wymagane GitHub Secrets

Aby deployment działał poprawnie, musisz skonfigurować następujące sekrety w ustawieniach repozytorium GitHub:

### Sekrety Cloudflare (wymagane)

1. **CLOUDFLARE_API_TOKEN**
   - Token API z uprawnieniami do wdrażania na Cloudflare Pages
   - Jak wygenerować:
     1. Zaloguj się do Cloudflare Dashboard
     2. Przejdź do **My Profile** > **API Tokens**
     3. Kliknij **Create Token**
     4. Użyj szablonu **Edit Cloudflare Workers** lub stwórz custom token z uprawnieniami:
        - Account.Cloudflare Pages: Edit
     5. Skopiuj wygenerowany token

2. **CLOUDFLARE_ACCOUNT_ID**
   - Identyfikator Twojego konta Cloudflare
   - Jak znaleźć:
     1. Zaloguj się do Cloudflare Dashboard
     2. Wybierz swoją domenę
     3. Account ID znajduje się w prawym panelu bocznym (Overview)

3. **CLOUDFLARE_PROJECT_NAME**
   - Nazwa projektu na Cloudflare Pages
   - To jest nazwa, którą nadałeś projektowi podczas jego tworzenia w Cloudflare Pages
   - Jeśli projekt jeszcze nie istnieje, zostanie utworzony automatycznie podczas pierwszego deploymentu

### Sekrety Supabase (wymagane dla aplikacji)

4. **PUBLIC_SUPABASE_URL**
   - URL Twojej instancji Supabase
   - Format: `https://your-project.supabase.co`

5. **PUBLIC_SUPABASE_KEY**
   - Publiczny klucz API (anon key) Supabase
   - Znajdziesz go w: Supabase Dashboard > Settings > API

### Sekrety GROQ API (wymagane dla funkcji AI)

6. **GROQ_API_KEY**
   - Klucz API dla GROQ
   - Uzyskaj go z: https://console.groq.com/

7. **GROQ_MODEL** (opcjonalny)
   - Model GROQ do użycia
   - Domyślnie: `llama-3.3-70b-versatile`

8. **GROQ_BASE_URL** (opcjonalny)
   - Bazowy URL dla API GROQ
   - Domyślnie: `https://api.groq.com/openai/v1`

## Jak dodać sekrety do GitHub

1. Przejdź do repozytorium na GitHub
2. Kliknij **Settings** > **Secrets and variables** > **Actions**
3. Kliknij **New repository secret**
4. Wprowadź nazwę sekretu (np. `CLOUDFLARE_API_TOKEN`)
5. Wklej wartość
6. Kliknij **Add secret**
7. Powtórz dla wszystkich wymaganych sekretów

## Konfiguracja zmiennych środowiskowych w Cloudflare Pages

Dodatkowo, musisz skonfigurować zmienne środowiskowe bezpośrednio w Cloudflare Pages:

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **Workers & Pages**
3. Wybierz swój projekt
4. Przejdź do **Settings** > **Environment variables**
5. Dodaj następujące zmienne:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_KEY`
   - `SUPABASE_URL` (ta sama wartość co PUBLIC_SUPABASE_URL)
   - `SUPABASE_KEY` (ta sama wartość co PUBLIC_SUPABASE_KEY)
   - `GROQ_API_KEY`
   - `GROQ_MODEL` (opcjonalnie)
   - `GROQ_BASE_URL` (opcjonalnie)

## Proces Deploymentu

### Automatyczny deployment

Po skonfigurowaniu sekretów, każdy push do gałęzi `master` automatycznie:

1. Uruchomi linting kodu
2. Uruchomi testy jednostkowe
3. Zbuduje aplikację
4. Wdroży ją na Cloudflare Pages

### Ręczny deployment

Możesz również uruchomić deployment ręcznie:

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Wybierz workflow **Deploy to Cloudflare Pages**
3. Kliknij **Run workflow**
4. Wybierz gałąź `master`
5. Kliknij **Run workflow**

## Weryfikacja Deploymentu

Po zakończeniu deploymentu:

1. Przejdź do zakładki **Actions** w GitHub
2. Sprawdź status workflow - powinien być zielony ✅
3. Przejdź do Cloudflare Dashboard > Workers & Pages
4. Znajdź swój projekt i kliknij na niego
5. Sprawdź ostatni deployment - powinien być oznaczony jako "Active"
6. Kliknij na URL deploymentu, aby zobaczyć działającą aplikację

## Rozwiązywanie problemów

### Błąd: "Missing script: buil"

Jeśli widzisz błąd `npm error Missing script: "buil"`, oznacza to, że w ustawieniach Cloudflare Pages jest literówka w komendzie budowania.

**Rozwiązanie:**
1. Przejdź do Cloudflare Dashboard > Workers & Pages > Twój projekt
2. Przejdź do **Settings** > **Builds & deployments**
3. Zmień **Build command** z `npm run buil` na `npm run build`
4. Zapisz zmiany

### Błąd: "Unauthorized" podczas deploymentu

Sprawdź czy:
- Token API ma odpowiednie uprawnienia
- Account ID jest poprawny
- Sekrety są poprawnie skonfigurowane w GitHub

### Aplikacja nie działa po deploymencie

Sprawdź czy:
- Wszystkie zmienne środowiskowe są skonfigurowane w Cloudflare Pages
- Wartości zmiennych są poprawne
- Sprawdź logi w Cloudflare Dashboard > Workers & Pages > Twój projekt > Logs

## Dodatkowe informacje

### Różnice między Node.js a Cloudflare adapter

Cloudflare Pages używa Cloudflare Workers do renderowania po stronie serwera, co oznacza:
- Środowisko wykonawcze V8 zamiast Node.js
- Niektóre Node.js API mogą nie być dostępne
- Lepsze performance dzięki globalnej sieci Edge

### Limity Cloudflare Pages (darmowy plan)

- 500 buildów miesięcznie
- Nielimitowana przepustowość
- Nielimitowane requesty
- 100 custom domains na projekt

### Przydatne linki

- [Dokumentacja Astro + Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Dokumentacja Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)

