# Cloudflare Pages - Quick Start Guide

## 🚀 Szybki start (5 minut)

### 1. Uzyskaj Cloudflare Credentials

#### API Token
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **My Profile** > **API Tokens** > **Create Token**
3. Użyj szablonu **Edit Cloudflare Workers** lub stwórz własny z uprawnieniami:
   - `Account > Cloudflare Pages > Edit`
4. Skopiuj token (będzie widoczny tylko raz!)

#### Account ID
1. W Cloudflare Dashboard przejdź do **Workers & Pages**
2. Account ID znajdziesz w prawej kolumnie

### 2. Utwórz projekt w Cloudflare Pages

1. W Cloudflare Dashboard: **Workers & Pages** > **Create application** > **Pages**
2. Wybierz **Direct Upload**
3. Podaj nazwę projektu (np. `10xdevs-project`)
4. Kliknij **Create project**

### 3. Skonfiguruj GitHub Secrets

W repozytorium GitHub: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Dodaj następujące secrets:

```
CLOUDFLARE_API_TOKEN=<twój-token-z-kroku-1>
CLOUDFLARE_ACCOUNT_ID=<twój-account-id-z-kroku-1>
CLOUDFLARE_PROJECT_NAME=10xdevs-project
PUBLIC_SUPABASE_URL=<twój-supabase-url>
PUBLIC_SUPABASE_KEY=<twój-supabase-anon-key>
GROQ_API_KEY=<twój-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 4. Skonfiguruj zmienne środowiskowe w Cloudflare

W projekcie Cloudflare Pages: **Settings** > **Environment variables** > **Add variables**

Dla środowiska **Production** dodaj:

```
PUBLIC_SUPABASE_URL=<twój-supabase-url>
PUBLIC_SUPABASE_KEY=<twój-supabase-anon-key>
GROQ_API_KEY=<twój-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

### 5. Deploy!

```bash
git add .
git commit -m "Configure Cloudflare Pages deployment"
git push origin master
```

Gotowe! 🎉

Deployment będzie widoczny w:
- GitHub Actions: `https://github.com/<user>/<repo>/actions`
- Cloudflare Dashboard: **Workers & Pages** > twój projekt > **Deployments**

---

## 📋 Checklist

- [ ] Utworzono Cloudflare API Token
- [ ] Uzyskano Cloudflare Account ID
- [ ] Utworzono projekt w Cloudflare Pages
- [ ] Skonfigurowano GitHub Secrets (8 secrets)
- [ ] Skonfigurowano zmienne środowiskowe w Cloudflare (5 zmiennych)
- [ ] Wykonano push do gałęzi `master`
- [ ] Zweryfikowano deployment w Cloudflare Dashboard

---

## 🔧 Troubleshooting

### Deployment fails z błędem "Missing script: buil"

**Problem**: W Cloudflare Dashboard jest błędna komenda buildu.

**Rozwiązanie**: 
1. Cloudflare Dashboard > twój projekt > **Settings** > **Builds and deployments**
2. Zmień **Build command** na: `npm run build` (nie `npm run buil`)

### Deployment fails z błędem "Invalid binding SESSION"

**Problem**: Cloudflare próbuje użyć KV binding, którego nie skonfigurowałeś.

**Rozwiązanie**: To tylko ostrzeżenie, możesz je zignorować. Sesje będą działać bez KV.

### Environment variables nie działają

**Problem**: Zmienne nie są dostępne w runtime.

**Rozwiązanie**: Upewnij się, że zmienne są ustawione zarówno w:
- GitHub Secrets (dla procesu buildu)
- Cloudflare Dashboard > Settings > Environment variables (dla runtime)

---

## 📚 Więcej informacji

- **Pełna dokumentacja**: `CLOUDFLARE_DEPLOYMENT.md`
- **Podsumowanie zmian**: `CLOUDFLARE_SETUP_SUMMARY.md`
- **Workflow CI/CD**: `.github/workflows/master.yml`

