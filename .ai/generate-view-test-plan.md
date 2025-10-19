# Plan testowania widoku Generowania fiszek AI

## Przegląd
Ten dokument opisuje scenariusze testowe dla widoku `/generate/new`, który umożliwia użytkownikom generowanie fiszek AI.

## Wymagania wstępne
1. Serwer deweloperski uruchomiony (`npm run dev`)
2. Skonfigurowane zmienne środowiskowe:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY` lub `GROQ_API_KEY`
3. Konto użytkownika w Supabase (do testowania autoryzacji)

## Scenariusze testowe

### 1. Test Happy Path (Sukces)
**Cel**: Weryfikacja pełnego flow generowania fiszek

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Wpisz temat (np. "Stolice europejskie") - min 3 znaki, max 500
4. Kliknij "Generuj fiszki"
5. Obserwuj spinner z tekstem "Generuję fiszki, proszę czekać..."
6. Po sukcesie powinieneś zostać przekierowany do `/generate/{id}/review`

**Oczekiwany rezultat**:
- ✅ Formularz działa poprawnie
- ✅ Spinner pojawia się podczas ładowania
- ✅ Brak błędów w konsoli
- ✅ Przekierowanie do widoku recenzji po sukcesie
- ✅ Status 201 w Network tab

### 2. Test walidacji lokalnej - Za krótki temat
**Cel**: Sprawdzenie walidacji minimalnej długości

**Kroki**:
1. Przejdź do `/generate/new`
2. Wpisz temat "ab" (2 znaki)
3. Spróbuj kliknąć "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Przycisk "Generuj fiszki" jest disabled
- ✅ Licznik znaków pokazuje "2/500 znaków"
- ✅ Brak wywołania API

### 3. Test walidacji lokalnej - Za długi temat
**Cel**: Sprawdzenie walidacji maksymalnej długości

**Kroki**:
1. Przejdź do `/generate/new`
2. Wpisz temat dłuższy niż 500 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Wyświetla się komunikat błędu: "Temat może zawierać maksymalnie 500 znaków"
- ✅ Brak wywołania API
- ✅ Komunikat błędu w czerwonym boxie z ikoną alertu

### 4. Test walidacji backendowej (400 Bad Request)
**Cel**: Sprawdzenie obsługi błędów walidacji Zod z backendu

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Symuluj błąd backendu (np. modyfikując payload w DevTools)
4. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Status 400 w Network tab
- ✅ Wyświetla się komunikat błędu z szczegółami Zod
- ✅ Komunikat zawiera tekst "Błąd walidacji:"
- ✅ Spinner znika
- ✅ Możliwość ponowienia próby

### 5. Test braku autoryzacji (401 Unauthorized)
**Cel**: Sprawdzenie obsługi braku tokenu autoryzacyjnego

**Kroki**:
1. Wyloguj się lub usuń token z localStorage/cookies
2. Przejdź do `/generate/new`
3. Wpisz poprawny temat
4. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Automatyczne przekierowanie do `/login`
- ✅ Status 401 w Network tab (lub brak wywołania API jeśli token nie istnieje)

### 6. Test błędu serwera (500 Internal Server Error)
**Cel**: Sprawdzenie obsługi błędów serwera

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Wyłącz API klucz lub spowoduj błąd serwera
4. Wpisz poprawny temat
5. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Status 500 w Network tab
- ✅ Wyświetla się komunikat: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- ✅ Spinner znika
- ✅ Możliwość ponowienia próby

### 7. Test błędu sieciowego
**Cel**: Sprawdzenie obsługi braku połączenia

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Wyłącz połączenie sieciowe lub symuluj offline w DevTools
4. Wpisz poprawny temat
5. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Wyświetla się komunikat: "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."
- ✅ Spinner znika
- ✅ Możliwość ponowienia próby po przywróceniu połączenia

### 8. Test błędu parsowania JSON
**Cel**: Sprawdzenie obsługi nieprawidłowej odpowiedzi serwera

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Użyj proxy/mock aby zwrócić nieprawidłowy JSON
4. Wpisz poprawny temat
5. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- ✅ Wyświetla się komunikat: "Błąd komunikacji z serwerem. Spróbuj ponownie."
- ✅ Spinner znika

### 9. Test responsywności
**Cel**: Sprawdzenie poprawnego wyświetlania na różnych urządzeniach

**Kroki**:
1. Otwórz `/generate/new` w DevTools
2. Przetestuj widok na różnych breakpointach:
   - Mobile (320px, 375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)

**Oczekiwany rezultat**:
- ✅ Wszystkie elementy są widoczne i używalne
- ✅ Textarea skaluje się odpowiednio
- ✅ Przyciski są łatwo klikalne
- ✅ Teksty są czytelne
- ✅ Padding i spacing dostosowują się do rozmiaru ekranu

### 10. Test accessibility (A11y)
**Cel**: Weryfikacja dostępności dla użytkowników z niepełnosprawnościami

**Kroki**:
1. Użyj screen readera (NVDA/JAWS/VoiceOver)
2. Nawiguj po formularzu tylko klawiaturą (Tab/Shift+Tab/Enter)
3. Sprawdź ARIA attributes w DevTools

**Oczekiwany rezultat**:
- ✅ Label textarea jest powiązany z input (htmlFor/id)
- ✅ Spinner ma `role="status"` i `aria-live="polite"`
- ✅ Komunikat błędu ma `role="alert"` i `aria-live="assertive"`
- ✅ Przycisk jest focusable i może być aktywowany Enterem/Spacją
- ✅ Disabled button jest prawidłowo oznaczony
- ✅ Screen reader ogłasza wszystkie zmiany stanu

### 11. Test stanu ładowania
**Cel**: Sprawdzenie poprawnego działania stanu loading

**Kroki**:
1. Zaloguj się jako użytkownik
2. Przejdź do `/generate/new`
3. Wpisz poprawny temat
4. Kliknij "Generuj fiszki"
5. Obserwuj elementy UI podczas ładowania

**Oczekiwany rezultat**:
- ✅ Przycisk zmienia tekst na "Generowanie..."
- ✅ Przycisk jest disabled
- ✅ Textarea jest disabled
- ✅ Spinner jest widoczny z tekstem "Generuję fiszki, proszę czekać..."
- ✅ Brak możliwości ponownego submitu

### 12. Test licznika znaków
**Cel**: Weryfikacja poprawnego działania licznika

**Kroki**:
1. Przejdź do `/generate/new`
2. Wpisuj znaki w textarea
3. Obserwuj licznik

**Oczekiwany rezultat**:
- ✅ Licznik aktualizuje się w czasie rzeczywistym
- ✅ Format: "{aktualna_liczba}/500 znaków"
- ✅ Licznik jest widoczny i czytelny

## Checklist końcowy

### Funkcjonalność
- [ ] Formularz działa poprawnie
- [ ] Walidacja działa (min 3, max 500 znaków)
- [ ] API call zawiera poprawny Bearer token
- [ ] Obsługa wszystkich statusów HTTP (201, 400, 401, 500)
- [ ] Przekierowanie po sukcesie do `/generate/{id}/review`
- [ ] Przekierowanie przy braku autoryzacji do `/login`

### UI/UX
- [ ] Spinner pojawia się podczas ładowania
- [ ] Komunikaty błędów są czytelne i pomocne
- [ ] Responsywność na wszystkich urządzeniach
- [ ] Licznik znaków działa poprawnie
- [ ] Przyciski i textarea poprawnie disabled podczas ładowania

### Accessibility
- [ ] Poprawne ARIA attributes
- [ ] Nawigacja klawiaturą działa
- [ ] Screen reader compatibility
- [ ] Focus management

### Performance
- [ ] Brak memory leaks
- [ ] Brak niepotrzebnych re-renders
- [ ] Szybki initial load

### Błędy
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Brak błędów TypeScript
- [ ] Brak błędów ESLint
- [ ] Brak błędów accessibility w Lighthouse

## Znane ograniczenia
1. Brak retry mechanism dla failed requests
2. Brak progress bar podczas długiego generowania
3. Brak możliwości cancel ongoing request
4. Brak zapisywania draft tematu w localStorage

## Przyszłe usprawnienia
1. Dodać auto-save draft do localStorage
2. Dodać historię ostatnich tematów
3. Dodać przykłady tematów (suggestions)
4. Dodać progress bar lub estimated time
5. Dodać możliwość cancel request
6. Dodać debounce dla walidacji
7. Dodać analytics tracking

