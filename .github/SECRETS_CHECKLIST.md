# GitHub Secrets Checklist

## Wymagane sekrety dla deploymentu na Cloudflare Pages

Przed uruchomieniem workflow `master.yml` upewnij się, że wszystkie poniższe sekrety są skonfigurowane w **Settings** > **Secrets and variables** > **Actions**:

### Cloudflare (3 sekrety)

- [ ] **CLOUDFLARE_API_TOKEN**
  - Opis: Token API z uprawnieniami do Cloudflare Pages
  - Jak uzyskać: Cloudflare Dashboard > My Profile > API Tokens > Create Token
  - Wymagane uprawnienia: Account.Cloudflare Pages: Edit

- [ ] **CLOUDFLARE_ACCOUNT_ID**
  - Opis: Identyfikator konta Cloudflare
  - Jak uzyskać: Cloudflare Dashboard > wybierz domenę > Account ID w prawym panelu

- [ ] **CLOUDFLARE_PROJECT_NAME**
  - Opis: Nazwa projektu na Cloudflare Pages
  - Przykład: `10xdevs-flashcards`
  - Uwaga: Jeśli projekt nie istnieje, zostanie utworzony automatycznie

### Supabase (2 sekrety)

- [ ] **PUBLIC_SUPABASE_URL**
  - Opis: URL instancji Supabase
  - Format: `https://your-project.supabase.co`
  - Jak uzyskać: Supabase Dashboard > Settings > API > Project URL

- [ ] **PUBLIC_SUPABASE_KEY**
  - Opis: Publiczny klucz API (anon key)
  - Jak uzyskać: Supabase Dashboard > Settings > API > Project API keys > anon public

### GROQ API (1-3 sekrety)

- [ ] **GROQ_API_KEY** *(wymagany)*
  - Opis: Klucz API dla GROQ
  - Jak uzyskać: https://console.groq.com/ > API Keys

- [ ] **GROQ_MODEL** *(opcjonalny)*
  - Opis: Model GROQ do użycia
  - Wartość domyślna: `llama-3.3-70b-versatile`
  - Inne opcje: sprawdź dokumentację GROQ

- [ ] **GROQ_BASE_URL** *(opcjonalny)*
  - Opis: Bazowy URL dla API GROQ
  - Wartość domyślna: `https://api.groq.com/openai/v1`

## Dodatkowa konfiguracja w Cloudflare Pages

Po pierwszym deploymencie, skonfiguruj również zmienne środowiskowe bezpośrednio w Cloudflare Pages:

**Cloudflare Dashboard** > **Workers & Pages** > Twój projekt > **Settings** > **Environment variables**

- [ ] PUBLIC_SUPABASE_URL
- [ ] PUBLIC_SUPABASE_KEY
- [ ] SUPABASE_URL (ta sama wartość co PUBLIC_SUPABASE_URL)
- [ ] SUPABASE_KEY (ta sama wartość co PUBLIC_SUPABASE_KEY)
- [ ] GROQ_API_KEY
- [ ] GROQ_MODEL (opcjonalnie)
- [ ] GROQ_BASE_URL (opcjonalnie)

## Weryfikacja

Po skonfigurowaniu wszystkich sekretów:

1. Wykonaj push do gałęzi `master` lub uruchom workflow ręcznie
2. Sprawdź status w zakładce **Actions**
3. Jeśli wszystko jest zielone ✅ - gratulacje! 🎉
4. Jeśli są błędy ❌ - sprawdź logi i upewnij się, że wszystkie sekrety są poprawne

## Bezpieczeństwo

⚠️ **Nigdy nie commituj sekretów do repozytorium!**

- Sekrety powinny być przechowywane tylko w GitHub Secrets
- Nie dodawaj plików `.env` z prawdziwymi wartościami do repozytorium
- Używaj `.env.example` jako szablonu bez rzeczywistych wartości

