# Architektura UI dla Aplikacji Fiszek AI

## 1. Przegląd struktury UI
Aplikacja składa się z modułów: uwierzytelnianie, generowanie fiszek AI, przegląd kandydatów, zarządzanie fiszkami, sesja SRS oraz profil użytkownika. Każdy moduł reprezentowany jest przez dedykowane widoki dostępne w `src/pages`, a stan aplikacji zarządzany jest przez React.

## 2. Lista widoków

### 2.1 Widok Logowania
- Ścieżka: `/login`  
- Cel: umożliwienie logowania użytkownika  
- Kluczowe informacje: pola e-mail, hasło, link “Zapomniałeś hasła?”  
- Kluczowe komponenty: `Input`, `Button`  
- UX/A11y/Sec: walidacja formularza z wyświetlaniem komunikatów o błędach inline, ARIA dla pól, zabezpieczenie CSRF, przekierowanie po sukcesie.

### 2.2 Widok Generowania fiszek
- Ścieżka: `/generate/new`  
- Cel: wpisanie tematu i wywołanie generacji fiszek  
- Kluczowe informacje: pole tekstowe topic, przycisk “Generuj”  
- Kluczowe komponenty: `Textarea`, `Button`, `Spinner`  
- UX/A11y/Sec: informacja o stanie ładowania, error handling, ARIA-live dla komunikatów.

### 2.3 Widok Przeglądu Kandydatów
- Ścieżka: `/generate/:id/review`  
- Cel: recenzja wygenerowanych fiszek (akceptuj/edytuj/odrzuć)  
- Kluczowe informacje: lista candidate_cards z front/back, przyciski akcji, licznik zatwierdzonych  
- Kluczowe komponenty: `ReviewCard`, `Dialog` (edycja), `Button`  
- UX/A11y/Sec: trap focus w modalu, ARIA dla przycisków, batch save z inline komunikatami o błędach i sukcesie, ochrona przed CSRF.

### 2.4 Widok Listy Fiszek
- Ścieżka: `/flashcards`  
- Cel: przegląd wszystkich fiszek użytkownika  
- Kluczowe informacje: infinite scroll, filtracja (search front, sort due), przyciski edit/delete  
- Kluczowe komponenty: `FlashcardList`, `FlashcardItem`, `ConfirmDialog` (delete), `Skeleton`  
- UX/A11y/Sec: responsywność listy, potwierdzenie usunięcia, dostępność klawiatury.

### 2.5 Modal Edycji Fiszki
- Komponent globalny, wywoływany z listy  
- Cel: edycja front/back z podglądem Markdown  
- Kluczowe komponenty: `Dialog`, `Textarea`, `Button`  
- UX/A11y/Sec: ARIA roles, trap focus, walidacja limitów długości.

### 2.6 Widok Dodawania Ręcznego
- Ścieżka: `/flashcards/new` (lub modal z listy)  
- Cel: szybkie dodanie fiszki bez duplikatów  
- Kluczowe informacje: pola front/back, komunikat o duplikacie  
- Kluczowe komponenty: `Form`, `Input`, `Button`  
- UX/A11y/Sec: blokada duplikatów, ARIA alert.

### 2.7 Widok Sesji SRS
- Ścieżka: `/sessions`  
- Cel: przeprowadzenie sesji powtórek (80% due, 20% nowych)  
- Kluczowe informacje: kolejna karta front→back, przyciski trudne/normalne/łatwe, pasek postępu  
- Kluczowe komponenty: `SessionCard`, `ProgressBar`, `Button`  
- UX/A11y/Sec: dostępność przycisków, keyboard shortcuts, ARIA-live dla wyników i inline komunikaty o błędach.

### 2.8 Widok Podsumowania Sesji
- Ścieżka: `/sessions/:id/summary`  
- Cel: prezentacja statystyk sesji (czas, liczba due/nowych, terminy)  
- Kluczowe informacje: wykresy/liczniki, przycisk “Nowa sesja”  
- Kluczowe komponenty: `StatsCard`, `Button`  
- UX/A11y/Sec: czytelne infografiki, ARIA dla danych tekstowych.

### 2.9 Widok Profilu Użytkownika
- Ścieżka: `/profile`  
- Cel: zarządzanie kontem, wylogowanie  
- Kluczowe informacje: e-mail, przycisk “Wyloguj się”  
- Kluczowe komponenty: `ProfileCard`, `Button`  
- UX/A11y/Sec: potwierdzenie wylogowania, ARIA dla formularzy.

## 3. Mapa podróży użytkownika
1. Użytkownik otwiera `/login`, loguje się.  
2. Redirect do `/generate/new`, wpisuje temat, klika “Generuj”.  
3. Po zakończeniu generacji przechodzi na `/generate/:id/review`, recenzuje propozycje.  
4. Użytkownik klika “Save All” lub “Save Approved”, wraca do `/flashcards`.  
5. Na stronie `/flashcards` przegląda, edytuje lub usuwa fiszki; może dodać nowe.  
6. Użytkownik rozpoczyna sesję `/sessions`, ocenia karty, przegląda podsumowanie.  
7. W każdej chwili może odwiedzić `/profile`.

## 4. Układ i struktura nawigacji
- Górny pasek nawigacji (desktop) / hamburger menu (mobile):  
  • Home (redirect do generowania)  
  • Flashcards  
  • Sessions  
  • Profile  
- Breadcrumbs na widokach `/generate/:id/review` i `/sessions/:id/summary`  
- Sticky action bar w modalu i podczas sesji.

## 5. Kluczowe komponenty
- `Dialog` / `ConfirmDialog` (Shadcn/ui) – modal edycji i potwierdzeń  
- `ReviewCard`, `FlashcardItem`, `SessionCard` – karty prezentujące dane  
- `Button`, `Input`, `Textarea` – komponenty formularzy  
- `Skeleton`, `Spinner` – feedback użytkownika  
- `ProgressBar`, `StatsCard` – wizualizacja postępów  
- `NavBar`, `Breadcrumbs` – nawigacja  
- `