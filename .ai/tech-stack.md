### Ocena stacku względem PRD

- 1) Szybkość dostarczenia MVP: dobra, ale można prościej
  - Astro + React + shadcn/ui + Supabase pozwolą szybko zbudować widoki i przepływy z PRD (logowanie, kandydaci, modal edycji, sesja SRS).
  - Ryzyko: Tailwind 4 i React 19 mogą być jeszcze świeże w ekosystemie; integracje, pluginy i przykłady częściej są stabilne dla Tailwind 3.4 i React 18.
  - Docker + DigitalOcean spowalnia start operacyjnie; Vercel + Supabase (zarządzane) zwykle skraca TTFM.

- 2) Skalowalność: wystarczająca dla MVP i wzrostu wczesnego
  - Supabase (Postgres + RLS) spokojnie obsłuży talie/karty/SRS; indeksy po deckId, dueAt i trigram dla duplikatów pokryją najważniejsze zapytania.
  - Astro z wyspami React skaluje się dobrze; interaktywność ograniczona do komponentów (sesja nauki, modale).
  - Wzrost AI: OpenRouter pozwala przełączać modele i limity; ewentualnie dodać kolejkę/retry na Edge Functions.

- 3) Koszt utrzymania/rozwoju: akceptowalny, można obniżyć
  - Supabase ma darmowy/przystępny próg, OpenRouter z limitami budżetowymi jest przewidywalny.
  - DigitalOcean + Docker to stały koszt i ops; dla MVP taniej i szybciej wyjdzie Vercel front + Supabase backend (bez własnej orkiestracji).
  - CI GitHub Actions ok, ale przy platformowym deployu często wystarczy minimalny pipeline (lint/test).

- 4) Złożoność: miejscami ponad potrzeby MVP
  - Astro + React jest ok; największa nadmiarowość to własny Docker/DO w stosunku do zarządzanych platform.
  - Tailwind 4 może wnieść tarcie; shadcn/ui + Tailwind 3.4 jest dziś bardziej bezproblemowe.

- 5) Prostszą alternatywą spełniającą PRD byłoby
  - Front: Next.js App Router + shadcn/ui + Tailwind 3.4 na Vercel (mniej klejenia SSR/CSR niż w Astro przy aplikacyjnych przepływach).
  - Backend: Supabase (Auth, DB, RLS) + Supabase Edge Functions (generacja AI, limity, TTL purge).
  - Hosting: zrezygnować z Dockera/DO na MVP; wrócić do tego dopiero przy potrzebie własnej infrastruktury.
  - Jeśli zostajemy przy Astro: zachować React 18 i Tailwind 3.4, żeby uniknąć problemów z zależnościami.

- 6) Bezpieczeństwo: możliwe do osiągnięcia, kilka uwag
  - Supabase Auth pokrywa login/hasło i reset; włączyć RLS na wszystkich tabelach (cards, decks, candidate_cards).
  - Trzymać klucze OpenRouter tylko po stronie serwera (Edge Functions); rate‑limit per user/IP; sanityzacja Markdown (np. DOMPurify) w UI.
  - Usunięcie konta ≤24h: job harmonogramu w Supabase do purge danych oraz polityka retencji backupów.
  - HTTP‑only cookies/sesje lub w pełni na JWT Supabase; wymusić silne hasła i blokady prób logowania.

### Zgodność stacku z wymaganiami PRD

- candidate_cards z TTL: Supabase cron lub Edge Function do czyszczenia >7 dni.
- Duplikaty frontu: Postgres pg_trgm + indeks GIN, porównanie similarity dla ostrzeżeń.
- SRS: kolumny dueAt i algorytm prostych interwałów w funkcji serwerowej, zapytania po dueAt.
- Analityka KPI: PostHog/Umami lub Supabase Analytics; zdarzenia dla TTFD, sesji, akceptacji/odrzuceń.
- Markdown: render + sanitizacja; limity znaków walidowane w UI i na serwerze.
- Retry/backoff AI: obsłużyć w Edge Function (exponential backoff, partial retry brakujących kart).

### Rekomendowane korekty stacku pod MVP (low‑risk)

- Zmienić Tailwind 4 → Tailwind 3.4; React 19 → React 18 (jeśli brak twardej potrzeby).
- Zrezygnować z Docker + DigitalOcean na MVP; wdrożyć front na Vercel, backend/DB na Supabase.
- Ustalić 1 model OpenRouter „small/mini” i limity kosztów; dodać retry/backoff + cache promptów.
- Dodać Supabase RLS, cron do TTL candidate_cards, pg_trgm dla duplikatów, Edge Function dla generacji/limitów.

### Wniosek

- Obecny stack jest w większości zgodny z PRD i pozwala szybko dostarczyć MVP, ale zawiera elementy, które spowolnią start (Docker/DO) i wprowadzają ryzyko (Tailwind 4, React 19). Drobne uproszczenia oraz oparcie się na Vercel + Supabase znacząco skrócą czas dostarczenia i koszty operacyjne przy zachowaniu skalowalności i bezpieczeństwa wymaganych przez PRD.
