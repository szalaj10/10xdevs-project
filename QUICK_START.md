# Szybki Start - Uwierzytelnianie

## 🚀 Uruchomienie w 3 krokach

### 1. Uruchom Supabase

```bash
supabase start
```

Zapisz klucze z outputu (anon key i service_role key).

### 2. Skonfiguruj zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu:

```bash
# Skopiuj klucze z poprzedniego kroku
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=twój_anon_key_tutaj
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=twój_anon_key_tutaj
SUPABASE_SERVICE_ROLE_KEY=twój_service_role_key_tutaj

# Groq API (opcjonalnie, dla generowania fiszek)
GROQ_API_KEY=twój_groq_key_tutaj
```

### 3. Uruchom aplikację

```bash
npm run dev
```

Otwórz http://localhost:4321/login

## ✅ Gotowe!

Teraz możesz:
- ✨ Zarejestrować nowe konto
- 🔐 Zalogować się
- 🔑 Zresetować hasło
- 📧 Zweryfikować email (jeśli włączone)

## 📚 Więcej informacji

- **Szczegółowa konfiguracja:** `AUTH_SETUP_GUIDE.md`
- **Dokumentacja implementacji:** `AUTH_UI_IMPLEMENTATION.md`
- **Przepływy UI:** `.ai/auth-ui-flow.md`

## ❓ Problemy?

### "supabaseUrl is required"
→ Sprawdź czy plik `.env` istnieje i zawiera poprawne klucze

### "Failed to fetch"
→ Sprawdź czy Supabase jest uruchomiony: `supabase status`

### Inne problemy
→ Zobacz `AUTH_SETUP_GUIDE.md` sekcja "Częste Problemy"

