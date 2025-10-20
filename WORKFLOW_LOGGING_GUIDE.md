# Przewodnik po logach workflow

## 📋 Zaktualizowany workflow z rozszerzonymi logami

Workflow `master.yml` został zaktualizowany o szczegółowe logi, które pomogą Ci zdiagnozować każdy problem z deploymentem.

---

## 🔍 Co zobaczysz w logach

### 1. **Sprawdzanie sekretów Cloudflare**

```
================================
🔍 CHECKING CLOUDFLARE SECRETS
================================

1️⃣ Checking CLOUDFLARE_API_TOKEN...
   ✅ CLOUDFLARE_API_TOKEN is set (length: 40 characters)

2️⃣ Checking CLOUDFLARE_ACCOUNT_ID...
   ✅ CLOUDFLARE_ACCOUNT_ID is set (length: 32 characters)

3️⃣ Checking CLOUDFLARE_PROJECT_NAME...
   ✅ CLOUDFLARE_PROJECT_NAME is set: '10xdevs-flashcards'

================================
✅ ALL SECRETS ARE CONFIGURED!
================================
```

**LUB jeśli coś brakuje:**

```
1️⃣ Checking CLOUDFLARE_API_TOKEN...
   ❌ CLOUDFLARE_API_TOKEN is NOT set
   📝 How to fix:
      - Go to: https://dash.cloudflare.com/profile/api-tokens
      - Create token with 'Cloudflare Pages: Edit' permission
      - Add to GitHub: Settings > Secrets > Actions > New secret
      - Name: CLOUDFLARE_API_TOKEN

================================
❌ MISSING 1 SECRET(S)!
================================

🔗 Quick link to add secrets:
   https://github.com/[user]/[repo]/settings/secrets/actions
```

---

### 2. **Weryfikacja buildu**

```
================================
🔍 VERIFYING BUILD OUTPUT
================================

✅ dist directory exists

📊 Build statistics:
   - Total files: 156
   - Total size: 2.3M

📁 Directory structure:
drwxr-xr-x  _astro/
drwxr-xr-x  _worker.js/
-rw-r--r--  favicon.png

🔍 Checking for critical files:
   ✅ _worker.js found (size: 45K)
   ✅ _astro directory found (35 files)

================================
✅ BUILD VERIFICATION COMPLETE
================================
```

**LUB jeśli build się nie powiódł:**

```
❌ ERROR: dist directory does not exist!

This means the build failed or generated files elsewhere.
Check the 'Build project' step above for errors.
```

---

### 3. **Przygotowanie deploymentu**

```
================================
🚀 PREPARING CLOUDFLARE DEPLOYMENT
================================

📦 Project: 10xdevs-flashcards
📁 Directory: dist
🌍 Target: Cloudflare Pages

Deployment will be available at:
https://10xdevs-flashcards.pages.dev

================================
```

---

### 4. **Podsumowanie deploymentu**

**Sukces:**

```
================================
✅ DEPLOYMENT SUCCESSFUL!
================================

🎉 Your application has been deployed to Cloudflare Pages!

🔗 URLs:
   Production: https://10xdevs-flashcards.pages.dev
   Dashboard: https://dash.cloudflare.com/

📊 Next steps:
   1. Visit your site to verify it works
   2. Check Cloudflare Dashboard for deployment details
   3. Configure custom domain (optional)

================================
```

**Błąd:**

```
================================
❌ DEPLOYMENT FAILED
================================

Common issues:

1️⃣ Invalid API Token
   - Check token has 'Cloudflare Pages: Edit' permission
   - Verify token hasn't expired

2️⃣ Wrong Account ID
   - Must be 32-character hash from Cloudflare Dashboard

3️⃣ Invalid Project Name
   - Only lowercase letters, numbers, and hyphens allowed
   - Current: 10xdevs-flashcards

4️⃣ Build output issues
   - Check if dist directory contains valid files

📚 Full troubleshooting guide:
   See CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md

🔗 Quick link to secrets:
   https://github.com/[user]/[repo]/settings/secrets/actions

================================
```

---

## 📖 Jak czytać logi w GitHub Actions

### Krok 1: Przejdź do Actions
1. Otwórz swoje repozytorium na GitHub
2. Kliknij zakładkę **Actions** u góry
3. Zobaczysz listę wszystkich uruchomionych workflow

### Krok 2: Wybierz workflow
1. Kliknij na konkretny run workflow (np. "Deploy to Cloudflare Pages")
2. Zobaczysz listę jobów (Lint, Unit tests, Deploy)

### Krok 3: Sprawdź logi
1. Kliknij na job **"Deploy to Cloudflare Pages"**
2. Zobaczysz wszystkie kroki:
   - ✅ Checkout
   - ✅ Setup Node and install
   - ❓ Check Cloudflare secrets ← **TUTAJ SPRAWDŹ NAJPIERW**
   - ❓ Build project
   - ❓ Verify build output
   - ❓ Prepare deployment info
   - ❓ Deploy to Cloudflare Pages
   - ❓ Deployment summary / Deployment failed

### Krok 4: Rozwiń kroki
- Kliknij na każdy krok, aby zobaczyć szczegółowe logi
- Szukaj emoji i kolorowych komunikatów:
  - ✅ = wszystko OK
  - ❌ = problem
  - ⚠️ = ostrzeżenie
  - 🔍 = informacja diagnostyczna

---

## 🎯 Typowe scenariusze

### Scenariusz 1: Brak sekretów

**Co zobaczysz:**
```
❌ CLOUDFLARE_API_TOKEN is NOT set
```

**Co zrobić:**
1. Kliknij link w logach do dodania sekretów
2. Dodaj brakujące sekrety
3. Uruchom workflow ponownie (Re-run jobs)

---

### Scenariusz 2: Build się nie powiódł

**Co zobaczysz:**
```
❌ ERROR: dist directory does not exist!
```

**Co zrobić:**
1. Przewiń w górę do kroku "Build project"
2. Szukaj błędów kompilacji (czerwone komunikaty)
3. Napraw błędy w kodzie
4. Commituj i wypchnij zmiany

---

### Scenariusz 3: Niepoprawny token

**Co zobaczysz w kroku wrangler:**
```
✘ [ERROR] Authentication error
```

**Co zrobić:**
1. Sprawdź czy token ma odpowiednie uprawnienia
2. Wygeneruj nowy token w Cloudflare
3. Zaktualizuj sekret `CLOUDFLARE_API_TOKEN` w GitHub
4. Uruchom workflow ponownie

---

### Scenariusz 4: Wszystko działa!

**Co zobaczysz:**
```
✅ ALL SECRETS ARE CONFIGURED!
✅ BUILD VERIFICATION COMPLETE
✅ DEPLOYMENT SUCCESSFUL!
```

**Co zrobić:**
1. Kliknij link do swojej aplikacji: `https://[nazwa-projektu].pages.dev`
2. Ciesz się działającą aplikacją! 🎉

---

## 🔧 Debugowanie krok po kroku

### Jeśli workflow się nie powiedzie:

1. **Sprawdź pierwszy czerwony krok** ❌
   - To tam jest problem
   - Przeczytaj dokładnie komunikaty

2. **Sprawdź krok "Check Cloudflare secrets"**
   - Czy wszystkie 3 sekrety są ✅?
   - Jeśli nie, dodaj brakujące

3. **Sprawdź krok "Verify build output"**
   - Czy dist directory istnieje?
   - Czy zawiera pliki?
   - Jeśli nie, sprawdź "Build project"

4. **Sprawdź krok "Deploy to Cloudflare Pages"**
   - Przeczytaj komunikaty od wrangler
   - Szukaj słów: "error", "failed", "invalid"

5. **Sprawdź krok "Deployment failed"**
   - Przeczytaj sugestie
   - Kliknij linki do dokumentacji

---

## 📚 Dodatkowe zasoby

- **Pełna dokumentacja:** `CLOUDFLARE_DEPLOYMENT_SETUP.md`
- **Troubleshooting:** `CLOUDFLARE_DEPLOYMENT_TROUBLESHOOTING.md`
- **Checklist sekretów:** `.github/SECRETS_CHECKLIST.md`
- **Szybki start:** `CLOUDFLARE_SETUP_SUMMARY.md`

---

## 💡 Pro tips

1. **Używaj workflow_dispatch**
   - Możesz uruchomić workflow ręcznie bez commitowania
   - Actions > Deploy to Cloudflare Pages > Run workflow

2. **Re-run failed jobs**
   - Nie musisz commitować ponownie
   - Kliknij "Re-run failed jobs" po naprawieniu sekretów

3. **Pobierz logi**
   - Możesz pobrać pełne logi jako ZIP
   - Kliknij ikonę ⚙️ > Download log archive

4. **Obserwuj w czasie rzeczywistym**
   - Logi odświeżają się automatycznie podczas działania workflow
   - Nie musisz odświeżać strony

---

## 🎓 Nauka przez przykład

### Przykład 1: Brak CLOUDFLARE_API_TOKEN

```
1️⃣ Checking CLOUDFLARE_API_TOKEN...
   ❌ CLOUDFLARE_API_TOKEN is NOT set
   📝 How to fix:
      - Go to: https://dash.cloudflare.com/profile/api-tokens
      [...]

❌ MISSING 1 SECRET(S)!
```

**Akcja:** Dodaj sekret, uruchom ponownie → ✅

---

### Przykład 2: Wszystko OK, ale deployment failed

```
✅ ALL SECRETS ARE CONFIGURED!
✅ BUILD VERIFICATION COMPLETE
[...]
✘ [ERROR] Invalid project name
```

**Akcja:** Sprawdź format nazwy projektu (tylko małe litery, cyfry, myślniki)

---

Teraz masz pełną widoczność tego, co się dzieje w każdym kroku deploymentu! 🚀

