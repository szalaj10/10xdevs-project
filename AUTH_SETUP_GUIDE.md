# Przewodnik Konfiguracji Uwierzytelniania

## Problem: "supabaseUrl is required"

Ten błąd oznacza, że brakuje konfiguracji zmiennych środowiskowych dla Supabase.

## Rozwiązanie

### 1. Uruchom lokalną instancję Supabase

```bash
supabase start
```

Po uruchomieniu otrzymasz output z kluczami:

```
API URL: http://127.0.0.1:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Utwórz/Zaktualizuj plik `.env`

W głównym katalogu projektu utwórz plik `.env` z następującymi zmiennymi:

```env
# Supabase Configuration (Local Development)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # anon key z supabase start
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # anon key z supabase start
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # service_role key z supabase start

# Groq API (for flashcard generation)
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Restart serwera deweloperskiego

```bash
npm run dev
```

## Zmienne Środowiskowe - Wyjaśnienie

### Dla Client-Side (React Components)
- `PUBLIC_SUPABASE_URL` - URL do API Supabase (dostępny w przeglądarce)
- `PUBLIC_SUPABASE_KEY` - Anon key (dostępny w przeglądarce, bezpieczny do publicznego użycia)

### Dla Server-Side (Astro SSR, API Routes)
- `SUPABASE_URL` - URL do API Supabase
- `SUPABASE_KEY` - Anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (NIGDY nie udostępniaj w przeglądarce!)

## Konfiguracja dla Produkcji

### Supabase Cloud

1. Utwórz projekt na [supabase.com](https://supabase.com)
2. Przejdź do Settings → API
3. Skopiuj:
   - Project URL → `PUBLIC_SUPABASE_URL` i `SUPABASE_URL`
   - anon/public key → `PUBLIC_SUPABASE_KEY` i `SUPABASE_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Zmienne środowiskowe w `.env`

```env
# Supabase Configuration (Production)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq API
GROQ_API_KEY=your_groq_api_key_here
```

### Konfiguracja redirect URLs w Supabase

W Supabase Dashboard → Authentication → URL Configuration, dodaj:

**Site URL:**
```
http://localhost:4321  # Development
https://your-domain.com  # Production
```

**Redirect URLs:**
```
http://localhost:4321/reset-password/confirm
http://localhost:4321/verify-email
https://your-domain.com/reset-password/confirm
https://your-domain.com/verify-email
```

## Konfiguracja Email Templates (Opcjonalnie)

### Lokalne (Supabase Local)

Edytuj `supabase/config.toml`:

```toml
[auth]
site_url = "http://localhost:4321"
additional_redirect_urls = ["http://localhost:4321/reset-password/confirm", "http://localhost:4321/verify-email"]

[auth.email]
enable_confirmations = false  # true jeśli chcesz weryfikację email
```

### Production (Supabase Dashboard)

1. Przejdź do Authentication → Email Templates
2. Dostosuj szablony dla:
   - **Confirm signup** - weryfikacja email
   - **Reset password** - reset hasła
   - **Magic Link** - logowanie bez hasła (opcjonalnie)

Przykładowy redirect URL w szablonie:
```
{{ .ConfirmationURL }}  # dla confirm signup
{{ .ConfirmationURL }}  # dla reset password
```

## Weryfikacja Konfiguracji

### 1. Sprawdź czy Supabase działa

```bash
supabase status
```

Powinno pokazać:
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
```

### 2. Sprawdź czy zmienne są załadowane

W komponencie React dodaj tymczasowo:

```typescript
console.log('Supabase URL:', import.meta.env.PUBLIC_SUPABASE_URL);
console.log('Has Key:', !!import.meta.env.PUBLIC_SUPABASE_KEY);
```

### 3. Test połączenia

Otwórz konsolę przeglądarki na `/login` i sprawdź czy nie ma błędów.

## Częste Problemy

### "supabaseUrl is required"
**Przyczyna:** Brak zmiennych środowiskowych  
**Rozwiązanie:** Utwórz plik `.env` z poprawnymi wartościami

### "Invalid API key"
**Przyczyna:** Nieprawidłowy klucz anon  
**Rozwiązanie:** Skopiuj klucz z `supabase status` lub Supabase Dashboard

### "Failed to fetch"
**Przyczyna:** Supabase nie jest uruchomiony  
**Rozwiązanie:** Uruchom `supabase start`

### "CORS error"
**Przyczyna:** Nieprawidłowy URL lub konfiguracja CORS  
**Rozwiązanie:** Sprawdź czy `PUBLIC_SUPABASE_URL` jest poprawny

### "Session not found" po kliknięciu linku resetującego
**Przyczyna:** Nieprawidłowy redirect URL w Supabase  
**Rozwiązanie:** Dodaj URL do listy dozwolonych w Supabase Dashboard

## Migracje Bazy Danych

Jeśli to pierwsza konfiguracja, uruchom migracje:

```bash
supabase db reset
```

To utworzy wszystkie tabele i uruchomi seed data.

## Testowe Konto

Po uruchomieniu `supabase db reset`, możesz utworzyć testowe konto przez UI lub przez SQL:

```sql
-- W Supabase Studio (http://127.0.0.1:54323)
-- lub przez psql

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

Lub użyj UI rejestracji na `/login`.

## Następne Kroki

Po poprawnej konfiguracji:

1. ✅ Przetestuj rejestrację na `/login`
2. ✅ Przetestuj logowanie
3. ✅ Przetestuj reset hasła
4. ✅ Sprawdź czy NavBar pokazuje poprawny stan
5. ✅ Sprawdź czy przekierowania działają

## Pomoc

Jeśli nadal masz problemy:

1. Sprawdź logi serwera deweloperskiego
2. Sprawdź konsolę przeglądarki (F12)
3. Sprawdź logi Supabase: `supabase logs`
4. Sprawdź dokumentację: https://supabase.com/docs

