# Konfiguracja GROQ API

## Problem
```
"Invalid API Key" - Groq AI error: 401
```

Ten błąd oznacza, że brakuje poprawnego klucza GROQ API lub klucz jest nieprawidłowy.

## Rozwiązanie

### Krok 1: Uzyskaj klucz GROQ API

1. **Przejdź do konsoli GROQ:**
   https://console.groq.com/keys

2. **Zaloguj się lub zarejestruj:**
   - Możesz użyć konta Google, GitHub lub email
   - Rejestracja jest darmowa

3. **Utwórz nowy API key:**
   - Kliknij "Create API Key"
   - Nadaj nazwę (np. "10xdevs-flashcards")
   - Skopiuj wygenerowany klucz (zaczyna się od `gsk_`)
   - ⚠️ **WAŻNE:** Zapisz klucz - nie będziesz mógł go ponownie zobaczyć!

### Krok 2: Dodaj klucz do pliku `.env`

1. **Otwórz plik `.env`** w głównym katalogu projektu

2. **Znajdź linię:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Zamień na swój klucz:**
   ```env
   GROQ_API_KEY=gsk_twoj_prawdziwy_klucz_tutaj
   ```

   Przykład:
   ```env
   GROQ_API_KEY=gsk_1234567890abcdefghijklmnopqrstuvwxyz
   ```

4. **Zapisz plik**

### Krok 3: Restart aplikacji

1. **Zatrzymaj serwer deweloperski:**
   - Naciśnij `Ctrl+C` w terminalu

2. **Uruchom ponownie:**
   ```bash
   npm run dev
   ```

3. **Sprawdź czy działa:**
   - Przejdź do `/generate/new`
   - Spróbuj wygenerować fiszki

## Weryfikacja

### Sprawdź czy klucz jest załadowany

W pliku `.env` powinieneś mieć:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

# Groq API
GROQ_API_KEY=gsk_twoj_prawdziwy_klucz_tutaj  # ← To musi być prawdziwy klucz!
```

### Test generowania fiszek

1. Zaloguj się do aplikacji
2. Przejdź do `/generate/new`
3. Wprowadź temat (np. "Stolice Europy")
4. Kliknij "Generuj fiszki"
5. Powinny pojawić się wygenerowane fiszki

## Częste problemy

### "Invalid API Key" mimo dodania klucza

**Przyczyny:**
- Klucz został skopiowany z błędami (spacje, nowe linie)
- Nie zrestartowałeś serwera po dodaniu klucza
- Klucz został usunięty w konsoli GROQ

**Rozwiązanie:**
1. Sprawdź czy klucz w `.env` nie ma spacji na początku/końcu
2. Upewnij się że klucz zaczyna się od `gsk_`
3. Zrestartuj serwer: `Ctrl+C` → `npm run dev`
4. Jeśli nadal nie działa, wygeneruj nowy klucz w konsoli GROQ

### "Rate limit exceeded"

**Przyczyna:** Przekroczono limit darmowych zapytań

**Rozwiązanie:**
- Poczekaj chwilę (limity resetują się co godzinę)
- Rozważ upgrade planu w GROQ (jeśli potrzebujesz więcej)

### "Model not found"

**Przyczyna:** Nieprawidłowa konfiguracja modelu

**Rozwiązanie:**
Sprawdź plik `src/lib/services/groqService.ts` - domyślnie używamy `llama-3.3-70b-versatile`

## Limity darmowego planu GROQ

GROQ oferuje hojny darmowy plan:
- **30 zapytań na minutę**
- **14,400 zapytań dziennie**
- **Brak opłat** za podstawowe użycie

To powinno wystarczyć do rozwoju i testowania aplikacji.

## Alternatywa: OpenRouter

Jeśli wolisz użyć OpenRouter zamiast GROQ:

1. Zarejestruj się na: https://openrouter.ai/
2. Uzyskaj API key
3. Dodaj do `.env`:
   ```env
   OPENROUTER_API_KEY=twoj_klucz_openrouter
   ```
4. Zmodyfikuj kod aby używał OpenRouter zamiast GROQ

## Bezpieczeństwo

⚠️ **NIGDY nie commituj pliku `.env` do Git!**

Plik `.env` jest już w `.gitignore`, ale upewnij się:

```bash
# Sprawdź czy .env jest ignorowany
git status
```

Jeśli widzisz `.env` w liście zmian:
```bash
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

## Produkcja

W produkcji (np. Vercel, Netlify):

1. Nie używaj pliku `.env`
2. Dodaj zmienne środowiskowe w panelu hostingu:
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Environment variables
3. Dodaj `GROQ_API_KEY` z wartością klucza

## Pomoc

Jeśli nadal masz problemy:

1. **Sprawdź logi serwera** - powinny pokazać dokładny błąd
2. **Sprawdź konsolę przeglądarki** (F12) - może być więcej informacji
3. **Sprawdź dokumentację GROQ:** https://console.groq.com/docs
4. **Sprawdź status GROQ:** https://status.groq.com/

## Gotowe!

Po dodaniu klucza GROQ API, powinieneś móc:
- ✅ Generować fiszki z dowolnego tematu
- ✅ Używać AI do tworzenia pytań i odpowiedzi
- ✅ Tworzyć talie fiszek automatycznie

Powodzenia! 🚀

