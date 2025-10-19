## Moduł uwierzytelniania (rejestracja, logowanie, reset hasła) – specyfikacja architektoniczna

Kontekst: aplikacja Astro (+ React) z Supabase (DB + Auth). Celem jest zaprojektowanie modułu auth w sposób zgodny z istniejącym kodem i przepływami US‑003/US‑004 (generacja propozycji i ich przegląd/akceptacja), tak aby:
- chronić widoki generacji i przeglądu kandydatów przed gościem,
- zapewnić płynne przekierowania po udanym logowaniu/rejestracji z zachowaniem `redirectTo`,
- dostarczyć solidny reset hasła i (opcjonalnie) weryfikację e‑mail,
- nie naruszyć istniejącego działania aplikacji (SSR, middleware, usługi i endpointy),
- pozostać w zgodzie ze stackiem i uwagami z `@tech-stack.md`.

Odwołania do istniejącego kodu:
- Middleware: `src/middleware/index.ts` – dołączanie klienta Supabase do `context.locals.supabase` bez SSR‑redirectów.
- Klient Supabase (SSR/serwer): `src/db/supabase.client.ts`.
- Klient Supabase (przeglądarka): `src/lib/hooks/useSupabase.ts`.
- Hook strażnika: `src/lib/hooks/useAuthGuard.ts` – przekierowania client‑side, unikanie pętli.
- Strona logowania: `src/pages/login.astro` + komponent React `src/components/AuthPage.tsx` (obsługuje login, rejestrację, wysyłkę linku do resetu).
- Layout: `src/layouts/Layout.astro` – nawigacja globalna (do rozszerzenia o stan auth).


### 1) Architektura interfejsu użytkownika

Zakres zmian w UI jest minimalnie inwazyjny – wykorzystujemy istniejący `AuthPage.tsx` i uzupełniamy brakujące ekrany/stan, a strony wymagające logowania zabezpieczamy istniejącym `useAuthGuard()`.

1.1. Strony Astro (routing, SSR kontener, bez logiki formularzy)
- `src/pages/login.astro` (istnieje):
  - Zawiera wyłącznie kontener HTML i montuje `AuthPage` z `client:load`.
  - Obsługa parametru `?redirectTo=/ścieżka` – logika w komponencie.
- NOWA: `src/pages/reset-password/confirm.astro`:
  - Montuje React `ResetPasswordConfirmPage` (opis niżej) z `client:load`.
  - Ekran ustawienia nowego hasła po kliknięciu w link z e‑maila (Supabase `type=recovery`).
- NOWA (opcjonalna, jeśli weryfikacja e‑mail włączona): `src/pages/verify-email.astro`:
  - Montuje React `EmailVerificationResultPage` – pokazuje rezultat (zweryfikowano/niepowodzenie) i CTA „Przejdź do logowania”.

Uwaga: Strony właściwe dla US‑003/US‑004, tj. `src/pages/generate/new.astro` i `src/pages/generate/[id]/review.astro` (i/lub odpowiadające im komponenty React), nie zmieniają swojej struktury – dodajemy jedynie strażnika auth po stronie klienta (pkt 1.3).

1.2. Komponenty React (interaktywne formularze i logika UI)
- `src/components/AuthPage.tsx` (istnieje):
  - Tryby: `login`, `register`, `reset` – pozostają.
  - Walidacje formularzy po stronie klienta (doprecyzowanie):
    - E‑mail: `type="email"`, dodatkowo prosta walidacja regex i tryb „touched”.
    - Hasło (rejestracja): min. 8 znaków; potwierdzenie zgodności; komunikaty PL.
  - Mapowanie błędów Supabase → przyjazne komunikaty (już częściowo zaimplementowane; ujednolicić listę w pkt 1.4).
  - Po skutecznym `signInWithPassword`/`signUp`:
    - Odczytaj `redirectTo` z `URLSearchParams`; zastosuj whitelistę ścieżek (tylko lokalne względne, brak protokołu/hosta).
    - Domyślna ścieżka: `/` lub `/generate/new` (do decyzji produktowej; rekomendacja: jeśli w PRD celem MVP jest szybka generacja – kieruj na `/generate/new`).
- NOWY: `src/components/ResetPasswordConfirmPage.tsx`:
  - Formularz: `newPassword`, `confirmNewPassword`; walidacja min. 8, zgodność.
  - Po montażu: `supabase.auth.getSession()` + `supabase.auth.updateUser({ password })` dla sesji recovery (Supabase przekierowuje z tokenem); w razie braku sesji – komunikat i CTA powrotu do logowania.
  - Po sukcesie: komunikat „Hasło zaktualizowane, zaloguj się” + link do `/login` (lub automatyczny redirect po 2–3 s).
- NOWY (opcjonalny): `src/components/EmailVerificationResultPage.tsx`:
  - Odczyt parametrów z URL; komunikat o powodzeniu/niepowodzeniu; CTA do `/login`.

1.3. Strażnik dostępu (client‑side) dla widoków US‑003/US‑004
- Używamy istniejącego `useAuthGuard(false)` wewnątrz komponentów React renderowanych na stronach:
  - `src/components/GeneratePage.tsx`
  - `src/components/ReviewCandidatesPage.tsx`
  - (Analogicznie w widokach list/edycji, jeśli wymagają auth)
- Zachowanie:
  - Brak sesji → redirect do `/login?redirectTo=<obecna_ścieżka>`.
  - Jest sesja → renderuj stronę.
  - Błąd sprawdzania sesji → ostrożnie: dla stron chronionych kieruj do `/login`, dla stron publicznych wyświetl UI (zgodnie z implementacją hooka).
- Uzasadnienie: SSR‑redirecty bywają źródłem pętli (zostało już naprawione w middleware); pozostajemy przy client‑side guard zgodnie z obecnym wzorcem.

1.4. Walidacje i komunikaty błędów
- E‑mail: „Podaj poprawny adres e‑mail”.
- Hasło (rejestracja/reset): „Hasło musi mieć co najmniej 8 znaków”.
- Potwierdzenie hasła: „Hasła nie są identyczne”.
- Logowanie:
  - „Nieprawidłowy e‑mail lub hasło” (mapowanie Supabase: `Invalid login credentials`).
  - „Twój e‑mail nie został jeszcze zweryfikowany. Sprawdź skrzynkę.” (gdy włączona weryfikacja i Supabase raportuje blokadę).
  - „Błąd logowania. Spróbuj ponownie.” (domyślne).
- Rejestracja:
  - „Użytkownik o tym adresie e‑mail już istnieje. Zaloguj się.” (`User already registered`).
  - „Hasło musi mieć co najmniej 8 znaków”.
  - Po sukcesie i braku sesji: „Konto utworzone. Sprawdź e‑mail, aby zweryfikować konto.”
- Reset hasła (wysyłka linku):
  - Po sukcesie: „Link do resetowania hasła został wysłany na Twój e‑mail.”
  - Po błędzie: „Błąd wysyłania linku. Spróbuj ponownie.”
- Reset hasła (potwierdzenie):
  - Sukces: „Hasło zaktualizowane, zaloguj się.”
  - Błąd sesji recovery: „Link wygasł lub jest nieprawidłowy. Wyślij nowy link resetu.”

1.5. Scenariusze kluczowe (powiązanie z US‑003/US‑004)
- Gość wchodzi na `/generate/new` → redirect do `/login?redirectTo=/generate/new` → login → powrót do `/generate/new` (US‑003 start).
- Użytkownik generuje propozycje, przechodzi na `/generate/[id]/review` → jeśli sesja wygasła, guard kieruje do logowania i po nim wraca (US‑004 przegląd/akceptacja).
- Rejestracja tuż przed generacją → po potwierdzeniu e‑mail (jeśli włączone) lub od razu przy aktywnej sesji → redirect do `redirectTo` i kontynuacja.
- Reset hasła w trakcie – nie psuje flow: po ustawieniu nowego hasła użytkownik wraca do logowania i może dokończyć proces.


### 2) Logika backendowa

2.1. Struktura endpointów API (minimalna, zgodna z obecnym wzorcem)
- Supabase Auth jest wykonywany z klienta (SDK); nie tworzymy serwera auth z własnym przechowywaniem haseł.
- Opcjonalne, pomocnicze endpointy (jeśli potrzebne dla porządku ciasteczek lub przyszłego rozszerzenia):
  - `POST /api/auth/logout` – czyści sesję po stronie serwera (wywołanie `context.locals.supabase.auth.signOut()` + wyczyszczenie ciasteczek). W obecnym UI wystarczy `supabase.auth.signOut()` w przeglądarce, ale endpoint bywa przydatny w SSR‑first.
  - `GET /api/auth/session` – zwraca anonimowo status „zalogowany/niezalogowany” (opcjonalnie, jeśli chcemy wyrenderować różny SSR navbar). Aktualnie można pobierać sesję w przeglądarce lub z `context.locals.supabase` w Astro.

2.2. Modele danych
- Nie przechowujemy haseł ani profili lokalnie – korzystamy z wbudowanych tabel Supabase Auth.
- Istniejące modele domenowe (np. `generations`, `candidate_cards`, `flashcards`) pozostają bez zmian; uprawnienia realizowane przez RLS (po stronie DB) i filtrację po `user_id`.

2.3. Walidacja danych wejściowych
- Warstwa UI (React) – walidacje formularzy (opis w 1.4).
- Warstwa API (jeśli dodamy endpointy pomocnicze) – `zod` w `src/lib/schemas.ts`:
  - Schematy: `EmailSchema = z.string().email()`, `PasswordSchema = z.string().min(8)` (lokalne do endpointów auth; nie dodajemy globalnie, by nie mieszać z istniejącymi schematami domenowymi).

2.4. Obsługa wyjątków
- Mapowanie komunikatów Supabase na komunikaty PL (opis w 1.4) – spójne między trybami login/register/reset.
- Endpointy (jeśli powstaną):
  - Format błędów JSON `{ code, message }`, statusy 400 (walidacja), 401 (brak sesji), 500 (błąd wewnętrzny).
  - Logowanie błędów po stronie serwera w `console` w DEV; w PROD rozważyć prosty logger.

2.5. SSR i `astro.config.mjs`
- `output: "server"` + adapter `@astrojs/node` (standalone) ⇒ możemy używać middleware i `context.locals` na każdej trasie.
- Middleware `src/middleware/index.ts` już tworzy `context.locals.supabase` z tokenem z `Authorization` i ciasteczkami – zachować wzorzec, bez SSR‑redirectów (eliminuje pętle).
- Renderowanie server‑side wybranych stron (np. navbar w `Layout.astro`):
  - Dopuszczalne pobranie sesji z `Astro.locals.supabase` do zmiany stanu nawigacji (pokazanie „Zaloguj” vs „Wyloguj”).
  - Nie wykonywać SSR‑redirectów zależnych od sesji; ochronę zostawić po stronie klienta (hook).


### 3) System autentykacji (Supabase Auth + Astro)

3.1. Rejestracja (`supabase.auth.signUp`)
- UI: tryb `register` w `AuthPage.tsx` – e‑mail, hasło, potwierdzenie hasła.
- Po sukcesie:
  - Jeśli weryfikacja e‑mail jest włączona w Supabase: brak aktywnej sesji, komunikat o konieczności weryfikacji; po kliknięciu linku użytkownik przechodzi przez stronę `verify-email` i następnie loguje się.
  - Jeśli weryfikacja wyłączona: sesja aktywna; redirect do `redirectTo`.
- Bezpieczeństwo: zasady haseł min. 8 znaków po stronie UI; dodatkowo reguły w Supabase Auth (polityki haseł).

3.2. Logowanie (`supabase.auth.signInWithPassword`)
- UI: tryb `login` w `AuthPage.tsx`.
- Po sukcesie: redirect do `redirectTo` (z whitelistą lokalnych ścieżek).
- Po błędzie: mapowanie komunikatów (1.4).

3.3. Wylogowanie (`supabase.auth.signOut`)
- UI: akcja „Wyloguj” w nawigacji (do dodania w `NavBar.tsx` lub innym komponencie headera w `Layout.astro`).
- Opcjonalnie udostępnić `/api/auth/logout` dla przypadków SSR‑first.

3.4. Reset hasła
- Wysłanie linku: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password/confirm })` – już zaimplementowane w `AuthPage.tsx`.
- Ustawienie nowego hasła (po kliknięciu linku): na stronie `reset-password/confirm.astro` montujemy `ResetPasswordConfirmPage`:
  - Pobranie sesji recovery (Supabase ustawia sesję tymczasową);
  - `supabase.auth.updateUser({ password: newPassword })`;
  - Po sukcesie – komunikat i link/redirect do `/login`.

3.5. Weryfikacja e‑mail (opcjonalna, sterowana konfiguracją Supabase)
- Jeśli włączona: po `signUp` blokuj logowanie do czasu potwierdzenia.
- Strona `verify-email.astro` + `EmailVerificationResultPage` może wyświetlać wynik i pozwolić przejść do logowania.

- 3.6. Ciasteczka, sesje, bezpieczeństwo
- Stan obecny (zgodny z kodem): `createSupabaseClient(..., cookies)` używa custom storage z `httpOnly: false` (ułatwia integrację SDK w przeglądarce w DEV).
- Zgodność z PRD (docelowo w PROD): wdrażamy ścisłe HTTP‑only z wykorzystaniem `@supabase/ssr` (server‑managed cookies).
  - Middleware (`src/middleware/index.ts`) tworzy klienta przez `createServerClient` i zarządza sesją via `Astro.cookies` wyłącznie po stronie serwera (Set‑Cookie, `httpOnly: true`, `secure: true`, `sameSite: "lax"|"strict"`).
  - Formularze pozostają w React (CSR), ale akcje auth mogą wykorzystywać wywołania SDK, które skutkują odpowiedzią serwera z Set‑Cookie (httpOnly), lub cienkie endpointy `/api/auth/*` (proxy) jeśli wymagane przez konfigurację domen/cookies.
  - W trybie DEV dopuszczamy obecny model (nie‑httpOnly) dla szybkości iteracji; w PROD włączamy tryb SSR cookies i wyłączamy custom client‑storage.
- Walidacja `redirectTo`: zezwalaj tylko na ścieżki względne zaczynające się od `/`; w innych przypadkach ignoruj i użyj `/`.

3.7. Uprawnienia i RLS
- Wszystkie operacje domenowe (generations/candidate_cards/flashcards) filtrują po `user_id` – zgodnie z istniejącymi usługami. RLS musi być włączony i poprawnie skonfigurowany w Supabase.

3.8. Usunięcie konta i danych (US‑002, zgodnie z PRD ≤24h) – zarys integracji
- Zakres poza modułem login/rejestracja/reset, ale architektonicznie powiązany:
  - Endpoint `DELETE /api/account` (wymaga sesji): oznacza konto do usunięcia i natychmiast unieważnia sesję.
  - Job w Supabase (cron/edge function) usuwa dane użytkownika (tabele powiązane) w ≤24h; tabele mają `ON DELETE CASCADE`, co ułatwia pełne czyszczenie.
  - Po wykonaniu użytkownik nie może się zalogować; UI pokazuje potwierdzenie i ewentualny czas realizacji.

 


### Integracja z US‑003 i US‑004 (wymagania funkcjonalne)
- US‑003 (Utworzenie talii z tematu): strona generacji dostępna tylko dla zalogowanych; po logowaniu – redirect do `/generate/new` (jeśli było wymuszone wejście). Błędy generacji (AI) nie są częścią auth – komunikaty wyświetla UI generacji.
- US‑004 (Przegląd i akceptacja propozycji): strona przeglądu kandydatów `/generate/[id]/review` wymaga sesji; guard przenosi do `/login` i z powrotem.
- Spójność UX: nav i CTA prowadzące do generacji zachowują `redirectTo` w łańcuchu, by skrócić czas do pierwszej talii (TTFD < 5 min).


### Wymagane/zalecane zmiany w kodzie (wysoki poziom)
Bez wdrożenia (tylko wskazanie miejsc i kontraktów):
- Dodać strony:
  - `src/pages/reset-password/confirm.astro` (montuje `ResetPasswordConfirmPage`).
  - (opcjonalnie) `src/pages/verify-email.astro` (montuje `EmailVerificationResultPage`).
- Dodać komponenty React:
  - `src/components/ResetPasswordConfirmPage.tsx` (formularz nowego hasła, wywołuje `supabase.auth.updateUser`).
  - (opcjonalnie) `src/components/EmailVerificationResultPage.tsx`.
- W `NavBar.tsx`/`Layout.astro` pokazać stan auth i akcję „Wyloguj” (wywołuje `supabase.auth.signOut()` + redirect do `/login`).
- W `GeneratePage.tsx` i `ReviewCandidatesPage.tsx` użyć `useAuthGuard()` (jeśli nieużyty) lub upewnić się, że jest wywołany na wejściu.
- Walidacja `redirectTo` w `AuthPage.tsx`: dopuścić tylko bezpieczne ścieżki.


### Kontrakty i interfejsy (skrót)
- Wejścia formularzy:
  - Login: `{ email: string; password: string }`.
  - Rejestracja: `{ email: string; password: string; confirmPassword: string }`.
  - Reset (wysyłka): `{ email: string }`.
  - Reset (potwierdzenie): `{ newPassword: string; confirmNewPassword: string }`.
- Wyjścia (UI): jednolite komunikaty PL z listy w 1.4.
- Endpointy opcjonalne:
  - `POST /api/auth/logout` → 204 No Content.


### Ryzyka i decyzje
- SSR‑redirecty a pętle: pozostajemy przy guardzie client‑side (jak obecnie) – mniejsze ryzyko regresji.
- HTTP‑only cookies: zgodnie z PRD to preferowane docelowo; na MVP utrzymujemy obecny model ze względu na istniejący kod i szybkość dostawy. Plan migracji do `@supabase/ssr` można przygotować oddzielnie.
- Whitelist `redirectTo`: konieczna dla bezpieczeństwa (open redirect).


### Kryteria akceptacji modułu auth (wycinek, powiązane z PRD)
- Użytkownik może stworzyć konto, zalogować się, zainicjować i dokończyć reset hasła.
- Widoki US‑003/US‑004 są dostępne wyłącznie dla zalogowanych; po logowaniu użytkownik wraca do poprzedniego miejsca.
- Brak pętli przekierowań; błędy auth są komunikowane po polsku.
- `redirectTo` jest walidowane; brak otwartych przekierowań.


—
Dokument zgodny z bieżącym kodem i układem katalogów:
- `./src` – główny kod,
- `./src/pages` – strony Astro (login, reset‑password/confirm, verify‑email opcjonalnie),
- `./src/components` – komponenty React (`AuthPage.tsx`, nowe ekrany),
- `./src/lib` – hooki i serwisy,
- `./src/middleware/index.ts` – wstępne przygotowanie klienta Supabase dla SSR/API.


