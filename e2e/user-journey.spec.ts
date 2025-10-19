import { test, expect } from "./fixtures/auth.fixture";
import { faker } from "@faker-js/faker";

/**
 * Kompleksowy test E2E - Pełna ścieżka użytkownika
 *
 * Ten test symuluje rzeczywiste użycie aplikacji przez nowego użytkownika:
 * 1. Rejestracja nowego konta
 * 2. Logowanie
 * 3. Generowanie fiszek AI
 * 4. Przeglądanie i zarządzanie fiszkami
 * 5. Rozpoczęcie sesji nauki
 * 6. Ocenianie fiszek
 * 7. Wylogowanie
 */
test.describe("Complete User Journey", () => {
  // Generuj unikalne dane dla każdego uruchomienia testu
  const testUser = {
    email: faker.internet.email().toLowerCase(),
    password: "TestPassword123!",
  };

  test("should complete full user journey from signup to study session", async ({
    page,
    signupPage,
    loginPage,
    homePage,
    generatePage,
    flashcardsPage,
    sessionsPage,
    navBar,
  }) => {
    test.setTimeout(120000); // 2 minuty na cały flow

    // ==========================================
    // KROK 1: Rejestracja nowego użytkownika
    // ==========================================
    // step info

    await signupPage.goto();
    await expect(page).toHaveURL("/signup");

    // Wypełnij formularz rejestracji
    await signupPage.signup(testUser.email, testUser.password, testUser.password);

    // Poczekaj na komunikat o sukcesie lub błąd
    await page.waitForTimeout(2000);

    // Sprawdź czy rejestracja się powiodła
    const hasSuccess = await signupPage.hasSuccess();
    const hasError = await signupPage.hasError();

    if (hasError) {
      const errorMsg = await signupPage.getErrorMessage();
      // log error message only in debug

      // Jeśli użytkownik już istnieje, użyj istniejącego
      if (errorMsg.includes("już istnieje")) {
        // continue if user exists
      } else {
        throw new Error(`Rejestracja nie powiodła się: ${errorMsg}`);
      }
    } else if (hasSuccess) {
      // success
    }

    // ==========================================
    // KROK 2: Logowanie
    // ==========================================
    // logging in

    await loginPage.goto();
    await expect(page).toHaveURL("/login");

    // Zaloguj się
    await loginPage.login(testUser.email, testUser.password);

    // Poczekaj na przekierowanie
    await page.waitForTimeout(3000);

    // Sprawdź czy jesteśmy zalogowani
    await expect(page).toHaveURL("/");
    await expect(homePage.welcomeHeading).toBeVisible();

    // ok

    // ==========================================
    // KROK 3: Sprawdzenie strony głównej
    // ==========================================
    // home check

    // Sprawdź czy navbar pokazuje zalogowanego użytkownika
    const isLoggedIn = await navBar.isLoggedIn();
    expect(isLoggedIn).toBe(true);

    const userEmail = await navBar.getUserEmail();
    expect(userEmail).toContain(testUser.email);

    // ok

    // ==========================================
    // KROK 4: Generowanie fiszek AI
    // ==========================================
    // generating cards

    // Przejdź do strony generowania
    await navBar.goToGenerate();
    await expect(page).toHaveURL("/generate/new");

    // Wygeneruj fiszki na temat TypeScript
    const topic = "TypeScript podstawy - typy, interfejsy, klasy";
    // topic info

    await generatePage.generate(topic);

    // Poczekaj na wygenerowanie kandydatów (AI może zająć czas)
    // waiting for AI
    await generatePage.waitForCandidates(60000); // 60 sekund timeout

    // Sprawdź ile fiszek zostało wygenerowanych
    const candidateCount = await generatePage.getCandidateCount();
    // generated count
    expect(candidateCount).toBeGreaterThan(0);
    expect(candidateCount).toBeLessThanOrEqual(10);

    // Odrzuć pierwszą fiszkę (symulacja selekcji)
    if (candidateCount > 1) {
      // reject first
      await generatePage.rejectCandidate(0);
      await page.waitForTimeout(500);
    }

    // Zapisz zaakceptowane fiszki
    // saving
    await generatePage.saveAll();

    // Poczekaj na przekierowanie do listy fiszek
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL("/flashcards");

    // ok

    // ==========================================
    // KROK 5: Przeglądanie listy fiszek
    // ==========================================
    // list view

    await expect(flashcardsPage.heading).toBeVisible();

    // Sprawdź ile fiszek mamy na liście
    await page.waitForTimeout(1000);
    const flashcardCount = await flashcardsPage.getFlashcardCount();
    // count info
    expect(flashcardCount).toBeGreaterThan(0);

    // Wyszukaj fiszki po słowie kluczowym
    // search
    await flashcardsPage.search("Type");
    await page.waitForTimeout(1000);

    await flashcardsPage.getFlashcardCount();
    // search results

    // Wyczyść wyszukiwanie
    await flashcardsPage.search("");
    await page.waitForTimeout(1000);

    // ok

    // ==========================================
    // KROK 6: Dodanie ręcznej fiszki
    // ==========================================
    // manual add

    await flashcardsPage.clickAdd();

    // Poczekaj na dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Wypełnij formularz
    const frontInput = page.getByLabel(/pytanie/i);
    const backInput = page.getByLabel(/odpowiedź/i);

    await frontInput.fill("Co to jest TypeScript?");
    await backInput.fill("TypeScript to typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript");

    // Zapisz fiszkę
    const submitButton = page.getByRole("button", { name: /dodaj/i });
    await submitButton.click();

    // Dialog powinien się zamknąć
    await expect(dialog).not.toBeVisible();
    await page.waitForTimeout(1000);

    // ok

    // ==========================================
    // KROK 7: Rozpoczęcie sesji nauki
    // ==========================================
    // start session

    // Przejdź do sesji
    await navBar.goToSessions();
    await expect(page).toHaveURL("/sessions");

    // Sprawdź czy przycisk start jest dostępny
    const startButton = sessionsPage.startButton;
    const isStartDisabled = await startButton.isDisabled();

    if (isStartDisabled) {
      // skip if none
    } else {
      // starting
      await sessionsPage.startSession();

      // Poczekaj na załadowanie sesji
      await page.waitForTimeout(2000);

      // Sprawdź czy sesja się rozpoczęła
      const isActive = await sessionsPage.isSessionActive();
      expect(isActive).toBe(true);

      // ok

      // ==========================================
      // KROK 8: Ocenianie fiszek
      // ==========================================
      // rating

      // Przejrzyj 3 fiszki
      for (let i = 0; i < 3; i++) {
        const stillActive = await sessionsPage.flashcardCard.isVisible();
        if (!stillActive) {
          // session done
          break;
        }

        // step card index

        // Odkryj odpowiedź
        await sessionsPage.revealAnswer();
        await expect(sessionsPage.flashcardBack).toBeVisible();

        // Oceń fiszkę (rotacja: hard, normal, easy)
        const ratings: ("hard" | "normal" | "easy")[] = ["hard", "normal", "easy"];
        const rating = ratings[i % 3];

        // rating label

        if (rating === "hard") {
          await sessionsPage.rateHard();
        } else if (rating === "easy") {
          await sessionsPage.rateEasy();
        } else {
          await sessionsPage.rateNormal();
        }

        // Poczekaj na przejście do następnej fiszki
        await page.waitForTimeout(1500);
      }

      // ok
    }

    // ==========================================
    // KROK 9: Test skrótów klawiszowych
    // ==========================================
    // shortcuts

    const stillInSession = await sessionsPage.flashcardCard.isVisible();
    if (stillInSession) {
      // space shortcut

      // Użyj spacji do odkrycia odpowiedzi
      await page.keyboard.press("Space");
      await page.waitForTimeout(500);

      // Sprawdź czy odpowiedź jest widoczna
      const backVisible = await sessionsPage.flashcardBack.isVisible();
      if (backVisible) {
        // ok

        // Użyj klawisza 2 do oceny
        // numeric shortcut
        await page.keyboard.press("2");
        await page.waitForTimeout(1500);

        // ok
      }
    }

    // ==========================================
    // KROK 10: Nawigacja po aplikacji
    // ==========================================
    // navigation

    // Przejdź do strony głównej przez logo
    await navBar.goToHome();
    await expect(page).toHaveURL("/");
    // ok

    // Przejdź do fiszek
    await navBar.goToFlashcards();
    await expect(page).toHaveURL("/flashcards");

    // Wróć do strony głównej
    await navBar.goToHome();
    await expect(page).toHaveURL("/");

    // ==========================================
    // KROK 11: Przełączenie motywu
    // ==========================================
    // theme

    const htmlElement = page.locator("html");
    const initialTheme = await htmlElement.getAttribute("class");

    await navBar.toggleTheme();
    await page.waitForTimeout(500);

    const newTheme = await htmlElement.getAttribute("class");
    expect(newTheme).not.toBe(initialTheme);

    // ok

    // ==========================================
    // KROK 12: Wylogowanie
    // ==========================================
    // logout

    await navBar.logout();

    // Poczekaj na przekierowanie
    await page.waitForTimeout(2000);

    // Sprawdź czy zostaliśmy przekierowani do logowania
    await expect(page).toHaveURL("/login");

    // Sprawdź czy navbar nie pokazuje już użytkownika
    const isStillLoggedIn = await navBar.isLoggedIn();
    expect(isStillLoggedIn).toBe(false);

    // ==========================================
    // PODSUMOWANIE
    // ==========================================
    // summary
  });
});
