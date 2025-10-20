# Rozwiązywanie problemów z deploymentem Cloudflare Pages

## ⚠️ Błąd: "Project not found" [code: 8000007]

**To jest najczęstszy błąd przy pierwszym deploymencie!**

### Komunikat błędu:
```
✘ [ERROR] A request to the Cloudflare API (/accounts/***/pages/projects/***) failed.

  Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

### Przyczyna:
Projekt Cloudflare Pages **nie istnieje** jeszcze w Twoim koncie Cloudflare. Wrangler nie tworzy automatycznie projektów - musisz utworzyć projekt ręcznie przed pierwszym deploymentem.

### Rozwiązanie:
**Zobacz szczegółowe instrukcje w pliku: `CLOUDFLARE_PROJECT_CREATION_FIX.md`**

Krótka wersja:
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages**
3. Kliknij **Create application** > **Pages** > **Upload assets**
4. Wprowadź nazwę projektu (musi być identyczna z `CLOUDFLARE_PROJECT_NAME` w GitHub Secrets)
5. Kliknij **Create project**
6. Skonfiguruj zmienne środowiskowe i KV binding
7. Uruchom ponownie GitHub Action

---

## Błąd: "The process '/opt/hostedtoolcache/node/22.14.0/x64/bin/npx' failed with exit code 1"

Ten błąd oznacza, że `wrangler` (narzędzie Cloudflare) nie może wykonać deploymentu. Poniżej znajdziesz kroki diagnostyczne.

---

## Krok 1: Sprawdź czy sekrety są skonfigurowane

### Jak sprawdzić:

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** > **Secrets and variables** > **Actions**
3. Sprawdź czy masz następujące sekrety:
   - ✅ `CLOUDFLARE_API_TOKEN`
   - ✅ `CLOUDFLARE_ACCOUNT_ID`
   - ✅ `CLOUDFLARE_PROJECT_NAME`

### Jeśli brakuje sekretów:

Zaktualizowany workflow automatycznie sprawdzi czy sekrety są skonfigurowane i wyświetli komunikat:
- ❌ `CLOUDFLARE_API_TOKEN is not set`
- ❌ `CLOUDFLARE_ACCOUNT_ID is not set`
- ❌ `CLOUDFLARE_PROJECT_NAME is not set`

**Rozwiązanie:** Dodaj brakujące sekrety zgodnie z instrukcjami w `CLOUDFLARE_DEPLOYMENT_SETUP.md`

---

## Krok 2: Sprawdź poprawność CLOUDFLARE_API_TOKEN

### Typowe problemy:

1. **Token nie ma odpowiednich uprawnień**
   - Token musi mieć uprawnienia: `Account.Cloudflare Pages: Edit`
   
2. **Token wygasł**
   - Sprawdź w Cloudflare Dashboard czy token jest aktywny

3. **Skopiowano token z białymi znakami**
   - Upewnij się, że nie ma spacji na początku/końcu tokena

### Jak wygenerować poprawny token:

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **My Profile** > **API Tokens**
3. Kliknij **Create Token**
4. Wybierz szablon **Edit Cloudflare Workers** lub stwórz custom token:
   - **Permissions:**
     - Account → Cloudflare Pages → Edit
   - **Account Resources:**
     - Include → Twoje konto
   - **Zone Resources:** (opcjonalnie)
     - All zones
5. Kliknij **Continue to summary** > **Create Token**
6. **WAŻNE:** Skopiuj token natychmiast (nie będziesz mógł go zobaczyć ponownie)
7. Dodaj token do GitHub Secrets jako `CLOUDFLARE_API_TOKEN`

---

## Krok 3: Sprawdź CLOUDFLARE_ACCOUNT_ID

### Jak znaleźć Account ID:

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz dowolną domenę (lub przejdź do Workers & Pages)
3. W prawym panelu bocznym znajdziesz **Account ID**
4. Skopiuj wartość (format: 32-znakowy hash, np. `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

**Uwaga:** To jest ID konta, nie ID projektu!

---

## Krok 4: Sprawdź CLOUDFLARE_PROJECT_NAME

### Wymagania:

- Nazwa projektu może zawierać tylko:
  - Małe litery (a-z)
  - Cyfry (0-9)
  - Myślniki (-)
- Nie może zawierać:
  - Wielkich liter
  - Spacji
  - Znaków specjalnych (_, @, !, itp.)

### Przykłady:

✅ Poprawne:
- `10xdevs-flashcards`
- `flashcards-app`
- `my-project-123`

❌ Niepoprawne:
- `10xDevs-Flashcards` (wielkie litery)
- `flashcards_app` (podkreślnik)
- `my project` (spacja)

### Czy projekt musi istnieć?

**TAK!** Projekt musi istnieć w Cloudflare Pages **przed** pierwszym deploymentem z GitHub Actions.

**WAŻNE:** Wbrew wcześniejszym informacjom, wrangler **nie tworzy** automatycznie projektu. Musisz utworzyć go ręcznie w Cloudflare Dashboard lub za pomocą Wrangler CLI.

**Jeśli widzisz błąd:**
```
Project not found. The specified project name does not match any of your existing projects. [code: 8000007]
```

**Rozwiązanie:** Zobacz szczegółowe instrukcje w `CLOUDFLARE_PROJECT_CREATION_FIX.md`

---

## Krok 5: Sprawdź czy build się powiódł

Zaktualizowany workflow dodaje krok weryfikacji buildu:

```
✅ dist directory exists
📁 Contents of dist:
```

### Jeśli widzisz błąd:

```
❌ dist directory does not exist
```

**Przyczyna:** Build się nie powiódł lub Astro generuje pliki w innym katalogu.

**Rozwiązanie:**
1. Sprawdź logi z kroku "Build project"
2. Upewnij się, że `astro.config.mjs` używa adaptera Cloudflare
3. Sprawdź czy nie ma błędów kompilacji

---

## Krok 6: Sprawdź logi wrangler

W logach GitHub Actions znajdź sekcję "Deploy to Cloudflare Pages" i poszukaj szczegółowych komunikatów błędów:

### Typowe błędy:

#### "Authentication error" / "Unauthorized"
```
Error: Authentication error
```
**Rozwiązanie:** Sprawdź czy `CLOUDFLARE_API_TOKEN` jest poprawny (Krok 2)

#### "Account not found"
```
Error: Account not found
```
**Rozwiązanie:** Sprawdź czy `CLOUDFLARE_ACCOUNT_ID` jest poprawny (Krok 3)

#### "Invalid project name"
```
Error: Invalid project name
```
**Rozwiązanie:** Sprawdź format `CLOUDFLARE_PROJECT_NAME` (Krok 4)

#### "Rate limit exceeded"
```
Error: Rate limit exceeded
```
**Rozwiązanie:** Poczekaj kilka minut i spróbuj ponownie. Cloudflare ma limity API.

#### "Build output is too large"
```
Error: Build output exceeds maximum size
```
**Rozwiązanie:** 
- Sprawdź rozmiar katalogu `dist`
- Usuń niepotrzebne pliki z buildu
- Zoptymalizuj zasoby (obrazy, fonty)

---

## Krok 7: Testowanie lokalne

Możesz przetestować deployment lokalnie przed pushem do GitHub:

### Zainstaluj Wrangler:
```bash
npm install -g wrangler
```

### Zaloguj się do Cloudflare:
```bash
wrangler login
```

### Zbuduj projekt:
```bash
npm run build
```

### Przetestuj deployment:
```bash
wrangler pages deploy dist --project-name=your-project-name
```

Jeśli to działa lokalnie, ale nie w GitHub Actions, problem jest w sekretach.

---

## Krok 8: Weryfikacja zmiennych środowiskowych

Upewnij się, że zmienne środowiskowe potrzebne do buildu są dostępne:

### W workflow master.yml:
```yaml
env:
  PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
  PUBLIC_SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
  GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
  # ... inne zmienne
```

### Jeśli build wymaga tych zmiennych:
Dodaj je do GitHub Secrets (nawet jeśli są publiczne, dla spójności).

---

## Checklist debugowania

Użyj tej checklisty, aby systematycznie sprawdzić wszystkie możliwe przyczyny:

- [ ] Sekrety są skonfigurowane w GitHub (Settings > Secrets and variables > Actions)
- [ ] `CLOUDFLARE_API_TOKEN` ma odpowiednie uprawnienia (Account.Cloudflare Pages: Edit)
- [ ] `CLOUDFLARE_ACCOUNT_ID` jest poprawny (32-znakowy hash)
- [ ] `CLOUDFLARE_PROJECT_NAME` ma poprawny format (małe litery, cyfry, myślniki)
- [ ] Build się powiódł (katalog `dist` istnieje)
- [ ] Adapter Cloudflare jest skonfigurowany w `astro.config.mjs`
- [ ] Wszystkie wymagane zmienne środowiskowe są dostępne
- [ ] Token nie wygasł
- [ ] Nie przekroczono limitów API Cloudflare

---

## Nadal nie działa?

### Sprawdź pełne logi:

1. Przejdź do zakładki **Actions** w GitHub
2. Kliknij na nieudany workflow
3. Kliknij na job "Deploy to Cloudflare Pages"
4. Rozwiń wszystkie kroki i przeczytaj dokładnie komunikaty błędów

### Dodatkowe kroki diagnostyczne:

Dodaj tymczasowy krok do workflow, aby sprawdzić środowisko:

```yaml
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    echo "Dist contents:"
    ls -la dist || echo "dist not found"
```

### Skontaktuj się ze wsparciem:

Jeśli wszystko powyższe jest poprawne, ale nadal nie działa:

1. Sprawdź [Cloudflare Community](https://community.cloudflare.com/)
2. Sprawdź [GitHub Issues dla wrangler-action](https://github.com/cloudflare/wrangler-action/issues)
3. Sprawdź [Status Cloudflare](https://www.cloudflarestatus.com/) - może być przerwa w działaniu

---

## Najczęstsze rozwiązania (TL;DR)

### 90% przypadków to jeden z tych problemów:

1. **Brak sekretów w GitHub** → Dodaj sekrety w Settings > Secrets and variables > Actions
2. **Niepoprawny token** → Wygeneruj nowy token z odpowiednimi uprawnieniami
3. **Niepoprawna nazwa projektu** → Użyj tylko małych liter, cyfr i myślników
4. **Build się nie powiódł** → Sprawdź logi buildu i napraw błędy kompilacji

### Szybki test:

Uruchom workflow ręcznie (workflow_dispatch) i obserwuj logi krok po kroku:
1. GitHub Actions > Deploy to Cloudflare Pages > Run workflow
2. Sprawdź każdy krok po kolei
3. Pierwszy krok, który się nie powiedzie, wskaże na problem

