# Dokument wymagań produktu (PRD) - fiszki
## 1. Przegląd produktu
Produkt: aplikacja web do tworzenia i nauki fiszek z wykorzystaniem prostego SRS oraz wsparciem AI do szybkiego generowania propozycji kart na podstawie tematu. MVP skupia się na minimalnym, szybkim przepływie: wpisz temat → otrzymaj 10–20 propozycji kart → zaakceptuj/edytuj/odrzuć → ucz się.

Cele MVP:
- Zmniejszyć czas i wysiłek potrzebny do stworzenia pierwszej talii i rozpoczęcia nauki.
- Zapewnić prosty i przewidywalny system powtórek (3 oceny, krótkie interwały).
- Umożliwić ręczne dodawanie i edycję kart oraz podstawową kontrolę jakości generacji AI.

Zakres platformy: tylko aplikacja web (MVP). Brak mobile native, brak offline/notification w MVP.

Interesariusze: uczniowie i studenci przygotowujący się do sprawdzianów/egzaminów; zespół 1 full‑stack (projekt po godzinach, horyzont 5 tygodni).

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek jest czasochłonne, co zniechęca do korzystania z metody spaced repetition. Istniejące narzędzia są „toporne” i nie przyspieszają procesu tworzenia talii, przez co użytkownicy szybko rezygnują przed zbudowaniem nawyku.

## 3. Wymagania funkcjonalne
3.1 Uwierzytelnianie i konto
- Rejestracja/logowanie e‑mailem i hasłem.
- Reset hasła; opcjonalna weryfikacja e‑mail.
- Usunięcie konta: twarde usunięcie wszystkich danych użytkownika w ≤24h.
- Sesje zabezpieczone cookie HTTP‑only (szczegóły techniczne poza PRD, do implementacji).

3.2 Flashcards
- Format: pytanie-odpowiedź
- Przykład: Temat "kardiologia ogólna" → Pytanie: "Jakie podstawowe funkcje pełni serce?" → Odpowiedź: "Serce jest głównym organem krwioobiegu..."
- Encja: `flashcards`
  - Atrybuty:
    - `id BIGSERIAL PRIMARY KEY`
    - `front TEXT NOT NULL CHECK (char_length(front) ≤ 200)` - zawiera pytanie
    - `back TEXT NOT NULL CHECK (char_length(back) ≤ 350)` - zawiera odpowiedź
    - `source TEXT`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - `generation_id BIGINT REFERENCES generations(id) ON DELETE SET NULL`
    - `user_id UUID REFERENCES users(id) ON DELETE CASCADE`

3.3 Generations
- Encja: `generations`
  - Atrybuty:
    - `id BIGSERIAL PRIMARY KEY`
    - `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
    - `model TEXT NOT NULL`
    - `generated_count INT NOT NULL`
    - `accepted_unedited_count INT NOT NULL`
    - `accepted_edited_count INT NOT NULL`
    - `source_text_hash TEXT NOT NULL`
    - `source_text_length INT NOT NULL`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

3.4 Generation Error Logs
- Encja: `generation_error_logs`
  - Atrybuty:
    - `id BIGSERIAL PRIMARY KEY`
    - `user_id UUID REFERENCES users(id) ON DELETE CASCADE`
    - `model TEXT NOT NULL`
    - `source_text_hash TEXT NOT NULL`
    - `source_text_length INT NOT NULL`
    - `error_code TEXT NOT NULL`
    - `error_message TEXT NOT NULL`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

3.3 Generowanie AI (z tematu)
- Użytkownik podaje temat w wolnym tekście (np. "kardiologia ogólna", "historia Polski", "programowanie w Python").
- System generuje 10–20 propozycji fiszek w formacie pytanie-odpowiedź jako kandydaty.
- Każda fiszka składa się z:
  - Pytania (front) - np. "Jakie podstawowe funkcje pełni serce?"
  - Odpowiedzi (back) - np. "Serce jest głównym organem krwioobiegu, pompuje krew do całego organizmu, dostarcza tlen i składniki odżywcze do tkanek"
- Propozycje trafiają do candidate_cards (tymczasowe), użytkownik przegląda i dla każdej wybiera: zaakceptuj/edytuj/odrzuć.
- Do stałej talii zapisują się wyłącznie zaakceptowane (po ewentualnej edycji) karty.
- Odrzucone propozycje nie są zapisywane trwale (przepadają). Dopuszczalne minimalne logi metadanych do poprawy jakości (bez treści jawnej) – szczegóły poniżej w granicach.

3.4 Zarządzanie kandydatami
- Przegląd propozycji z akcjami: akceptuj, edytuj inline, odrzuć.
- Kciuk w górę/w dół jako sygnał jakości dla tuningu generacji i sortowania propozycji.
- Zapis do talii wykonuje się zbiorczo po przeglądzie (bulk accept po edycjach) lub per karta.

3.5 Nauka i SRS
- Skala ocen: trudne / normalne / łatwe.
- Interwały: trudne = dziś ponownie; normalne = +2 dni; łatwe = +4 dni.
- Dzienny limit nauki: 30 kart; maksymalnie 10 nowych kart/dzień (w ramach limitu).
- Miks sesji: 80% kart due / 20% kart nowych.
- Widok sesji: front → odkryj back → wybór oceny; podsumowanie sesji na końcu (czas, liczba due/nowych, następne terminy) – szczegóły UX w granicach do doprecyzowania.

3.6 Wyszukiwanie i listy
- Lista talii i lista kart w obrębie talii.
- Wyszukiwanie po froncie w obrębie talii; sortowanie po createdAt, opcja „due first”.
- Paginacja lub infinite scroll (jedna z opcji, decyzja implementacyjna).

3.7 Jakość i edycja
- Szybka edycja inline w przeglądzie kandydatów i modal edycji kart zapisanych.
- Walidacja limitów znaków i podstawowego Markdown.
- Kciuki ↑/↓ nie wpływają na harmonogram powtórek; służą wyłącznie jakości generacji/sortowania.

3.8 Analityka i zdarzenia (MVP)
- Utworzenie talii, rozpoczęcie i zakończenie generacji, akceptacja/odrzucenie karty, dodanie ręczne, start/koniec sesji nauki.
- Liczniki zaakceptowanych kart per talia/użytkownik oraz czas do pierwszej talii.

## 4. Granice produktu
W zakresie
- Web‑only (desktop i mobile web, responsywnie).
- Generowanie fiszek w formacie pytanie-odpowiedź wyłącznie z tematu (wolny tekst). Brak „Utwórz z tekstu" w MVP.
- Prosty SRS z trzema ocenami i stałymi krótkimi interwałami.
- Basic Markdown w kartach, limity znaków pytanie (200) / odpowiedź (350).

Poza zakresem MVP
- Import/eksport zaawansowany (APKG, integracje Anki/Notion/Quizlet).
- PDF/URL/AV ekstrakcja treści.
- Tagowanie, łączenie talii, udostępnianie i współpraca.
- Powiadomienia push, tryb offline, aplikacje natywne.
- Złożone algorytmy SRS (FSRS/SM‑2 tuning), personalizacja interwałów.

Założenia i kwestie do doprecyzowania
- Wybór modelu/dostawcy AI, limity kosztów i retry/backoff – do decyzji.
- Limity generacji per użytkownik i globalne (anty‑abuse) – do decyzji.
- TTL dla candidate_cards oraz zakres metadanych logowanych dla odrzuceń (bez treści) – do decyzji.
- Reguła wykrywania duplikatów (normalizacja, próg podobieństwa) – do decyzji.
- Detale UX sesji (skróty klawiaturowe, ekran podsumowania, koniec limitu) – do decyzji.
- Zasady nazewnictwa talii (unikalność, emoji/znaki PL) – do decyzji.
- Finalna lista KPI i mapowanie zdarzeń analityki – do decyzji.
- Polityka backupów i retencji a „Usuń konto ≤24h” – do decyzji.

## 5. Historyjki użytkowników
US‑001
Tytuł: Rejestracja i logowanie
Opis: Jako użytkownik chcę założyć konto i logować się e‑mailem i hasłem, aby korzystać z aplikacji i zapisywać moje talie i postępy.
Kryteria akceptacji:
- Użytkownik może utworzyć konto podając e‑mail i hasło, otrzymuje potwierdzenie.
- Użytkownik może zalogować się poprawnymi danymi, błędne dane zwracają komunikat.
- Użytkownik może zainicjować reset hasła i ustawić nowe hasło.
- Opcjonalna weryfikacja e‑mail może być włączona/wyłączona konfiguracyjnie.

US‑002
Tytuł: Usunięcie konta i danych
Opis: Jako użytkownik chcę usunąć swoje konto, aby moje dane zostały nieodwracalnie skasowane.
Kryteria akceptacji:
- Akcja „Usuń konto” wymaga potwierdzenia (np. ponowne wpisanie frazy).
- Po potwierdzeniu konto jest deaktywowane natychmiast, a usunięcie danych realizowane w ≤24h.
- Po usunięciu użytkownik nie może się zalogować, a wszystkie talie/karty są niedostępne.

US‑003
Tytuł: Utworzenie talii z tematu
Opis: Jako uczeń chcę wpisać temat i otrzymać propozycje fiszek w formacie pytanie-odpowiedź, aby szybko zbudować pierwszą talię.
Kryteria akceptacji:
- Użytkownik wpisuje wolny tekst tematu (np. "kardiologia ogólna") i uruchamia generację.
- System zwraca 10–20 propozycji fiszek w formacie pytanie-odpowiedź w candidate_cards.
- Każda propozycja zawiera sensowne pytanie i odpowiedź związaną z tematem.
- Błędy generacji wyświetlają czytelny komunikat i możliwość ponowienia.

US‑004
Tytuł: Przegląd i akceptacja propozycji
Opis: Jako uczeń chcę szybko akceptować, edytować lub odrzucać propozycje, aby kontrolować zawartość talii.
Kryteria akceptacji:
- Każda propozycja ma akcje: akceptuj, edytuj inline, odrzuć.
- Zapis do talii obejmuje wyłącznie zaakceptowane propozycje (po edycji).
- Odrzucone propozycje nie są trwale zapisywane.
- Kciuk ↑/↓ jest dostępny jako feedback jakości (nie wpływa na SRS).

US‑005
Tytuł: Ręczne dodawanie kart (quick‑add)
Opis: Jako uczeń chcę szybko dodawać karty ręcznie, aby uzupełnić talię.
Kryteria akceptacji:
- Formularz front/back dostępny w widoku talii.
- Walidacja limitów znaków i pustych pól.
- Ostrzeżenie o potencjalnym duplikacie frontu w obrębie talii.

US‑006
Tytuł: Edycja kart w modalu
Opis: Jako użytkownik chcę edytować zapisane karty w modalu z podglądem Markdown, aby poprawiać treści.
Kryteria akceptacji:
- Modal pokazuje front i back z podglądem Markdown.
- Walidacja limitów znaków i zachowanie formatowania.
- Zmiany zapisują się w DB i są widoczne na liście kart.

US‑007
Tytuł: Lista talii i kart
Opis: Jako użytkownik chcę przeglądać listę talii i kart oraz wyszukiwać po froncie, aby szybko znaleźć treści.
Kryteria akceptacji:
- Lista talii z nazwą i statusem (liczba kart, due).
- W obrębie talii lista kart z wyszukiwaniem po froncie i sortem createdAt/due first.
- Paginacja lub infinite scroll działa stabilnie.

US‑008
Tytuł: Nauka z SRS (sesja dzienna)
Opis: Jako użytkownik chcę codziennie uczyć się w sesjach z limitem 30 kart, oceniając trudność, aby utrzymać rytm nauki.
Kryteria akceptacji:
- Sesja składa się w 80% z kart due i 20% nowych, nie więcej niż 10 nowych.
- Dla każdej karty użytkownik widzi front, może odkryć back i wybrać ocenę: trudne/normalne/łatwe.
- Po sesji wyświetla się podsumowanie (czas, liczba due/nowych, kolejne terminy).

US‑009
Tytuł: Interwały powtórek
Opis: Jako użytkownik oczekuję prostych i przewidywalnych interwałów, aby nie komplikować nauki.
Kryteria akceptacji:
- trudne = dziś ponownie
- normalne = +2 dni
- łatwe = +4 dni
- Zapis interwałów jest deterministyczny i widoczny w podsumowaniu.

US‑010
Tytuł: Informacja o błędach generacji i retry
Opis: Jako użytkownik chcę wiedzieć, które propozycje nie zostały wygenerowane i móc ponowić generację braków.
Kryteria akceptacji:
- W przypadku częściowego niepowodzenia system pokazuje listę wygenerowanych i brakujących.
- Dostępna akcja ponów wyłącznie dla brakujących, bez dublowania już zaakceptowanych.

US‑011
Tytuł: Zmiana nazwy talii
Opis: Jako użytkownik chcę zmienić nazwę talii, aby lepiej odzwierciedlała temat.
Kryteria akceptacji:
- Edycja nazwy w widoku talii; weryfikacja dozwolonych znaków.
- Zmiana jest zapisana i odświeża się na liście talii.

US‑012
Tytuł: Podstawowa analityka
Opis: Jako właściciel produktu chcę mierzyć kluczowe zdarzenia, aby ocenić sukces MVP.
Kryteria akceptacji:
- Zdarzenia: utworzenie talii, start/koniec generacji, akceptacja/odrzucenie, dodanie ręczne, start/koniec sesji.
- Dostępne proste dashboardy/liczniki (np. w narzędziu analitycznym) dla KPI z sekcji 6.

US‑013
Tytuł: Weryfikacja i reset hasła
Opis: Jako użytkownik chcę móc zresetować hasło i opcjonalnie zweryfikować e‑mail, aby zabezpieczyć dostęp.
Kryteria akceptacji:
- Link resetu hasła działa i wymusza ustawienie silnego hasła.
- Weryfikacja e‑mail (jeśli włączona) blokuje logowanie do czasu potwierdzenia.

US‑014
Tytuł: Ostrzeżenie o duplikacie
Opis: Jako użytkownik chcę być ostrzegany o potencjalnym duplikacie frontu, aby nie zaśmiecać talii.
Kryteria akceptacji:
- Dodawanie/edycja frontu wyzwala sprawdzenie duplikatu w obrębie talii.
- Komunikat ostrzegawczy z opcją „dodaj mimo to”.

US‑015
Tytuł: Kciuk w górę/w dół dla propozycji
Opis: Jako użytkownik chcę szybko ocenić propozycje AI, aby system uczył się preferencji jakościowych.
Kryteria akceptacji:
- Każda propozycja posiada akcję kciuk ↑/↓.
- Oceny są rejestrowane i mogą wpływać na ranking przyszłych propozycji (nie na SRS).

US‑016
Tytuł: Edycja propozycji przed akceptacją
Opis: Jako użytkownik chcę poprawić generowane propozycje przed zapisaniem, aby zwiększyć ich jakość.
Kryteria akceptacji:
- Edycja inline front/back dla kandydata w przeglądzie.
- Zmieniona treść trafia do talii po akceptacji.

## 6. Metryki sukcesu
Metryki produktu (MVP)
- Czas do pierwszej talii (TTFD) < 5 minut od rejestracji.
- Co najmniej 1 sesja powtórek w ciągu 48 godzin od rejestracji.
- Co najmniej 20 zaakceptowanych kart w ciągu 7 dni od rejestracji.
- Podstawowy wskaźnik nauki: średni udział ocen „łatwe/normalne” po 7 dniach.

Metryki jakości systemu
- Współczynnik powodzenia generacji AI i p95 czasu generacji.
- Stabilność sesji nauki (brak błędów blokujących, p95 czasu renderu widoku sesji).
- Skuteczność resetu hasła (odsetek udanych resetów bez wsparcia).

Uwagi dotyczące pomiaru
- Wdrożyć zdarzenia analityczne opisane w US‑012.
- Zmapować KPI do dashboardu i raportować tygodniowo w trakcie 5‑tygodniowego cyklu MVP.


