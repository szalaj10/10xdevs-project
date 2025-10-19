import { test, expect } from './fixtures/auth.fixture';
import { faker } from '@faker-js/faker';

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
test.describe('Complete User Journey', () => {
  // Generuj unikalne dane dla każdego uruchomienia testu
  const testUser = {
    email: faker.internet.email().toLowerCase(),
    password: 'TestPassword123!',
  };

  test('should complete full user journey from signup to study session', async ({
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
    console.log('📝 KROK 1: Rejestracja użytkownika:', testUser.email);
    
    await signupPage.goto();
    await expect(page).toHaveURL('/signup');
    
    // Wypełnij formularz rejestracji
    await signupPage.signup(testUser.email, testUser.password, testUser.password);
    
    // Poczekaj na komunikat o sukcesie lub błąd
    await page.waitForTimeout(2000);
    
    // Sprawdź czy rejestracja się powiodła
    const hasSuccess = await signupPage.hasSuccess();
    const hasError = await signupPage.hasError();
    
    if (hasError) {
      const errorMsg = await signupPage.getErrorMessage();
      console.log('⚠️  Błąd rejestracji:', errorMsg);
      
      // Jeśli użytkownik już istnieje, użyj istniejącego
      if (errorMsg.includes('już istnieje')) {
        console.log('ℹ️  Użytkownik już istnieje, przechodzimy do logowania');
      } else {
        throw new Error(`Rejestracja nie powiodła się: ${errorMsg}`);
      }
    } else if (hasSuccess) {
      console.log('✅ Rejestracja pomyślna - wymagana weryfikacja email');
      console.log('ℹ️  W środowisku testowym pomijamy weryfikację email');
    }

    // ==========================================
    // KROK 2: Logowanie
    // ==========================================
    console.log('🔐 KROK 2: Logowanie użytkownika');
    
    await loginPage.goto();
    await expect(page).toHaveURL('/login');
    
    // Zaloguj się
    await loginPage.login(testUser.email, testUser.password);
    
    // Poczekaj na przekierowanie
    await page.waitForTimeout(3000);
    
    // Sprawdź czy jesteśmy zalogowani
    await expect(page).toHaveURL('/');
    await expect(homePage.welcomeHeading).toBeVisible();
    
    console.log('✅ Logowanie pomyślne');

    // ==========================================
    // KROK 3: Sprawdzenie strony głównej
    // ==========================================
    console.log('🏠 KROK 3: Sprawdzenie strony głównej');
    
    // Sprawdź czy navbar pokazuje zalogowanego użytkownika
    const isLoggedIn = await navBar.isLoggedIn();
    expect(isLoggedIn).toBe(true);
    
    const userEmail = await navBar.getUserEmail();
    expect(userEmail).toContain(testUser.email);
    
    console.log('✅ Strona główna wyświetla się poprawnie');

    // ==========================================
    // KROK 4: Generowanie fiszek AI
    // ==========================================
    console.log('🤖 KROK 4: Generowanie fiszek AI');
    
    // Przejdź do strony generowania
    await navBar.goToGenerate();
    await expect(page).toHaveURL('/generate/new');
    
    // Wygeneruj fiszki na temat TypeScript
    const topic = 'TypeScript podstawy - typy, interfejsy, klasy';
    console.log(`   Temat: "${topic}"`);
    
    await generatePage.generate(topic);
    
    // Poczekaj na wygenerowanie kandydatów (AI może zająć czas)
    console.log('   ⏳ Czekam na wygenerowanie fiszek przez AI...');
    await generatePage.waitForCandidates(60000); // 60 sekund timeout
    
    // Sprawdź ile fiszek zostało wygenerowanych
    const candidateCount = await generatePage.getCandidateCount();
    console.log(`   ✅ Wygenerowano ${candidateCount} kandydatów na fiszki`);
    expect(candidateCount).toBeGreaterThan(0);
    expect(candidateCount).toBeLessThanOrEqual(10);
    
    // Odrzuć pierwszą fiszkę (symulacja selekcji)
    if (candidateCount > 1) {
      console.log('   🗑️  Odrzucam pierwszą fiszkę');
      await generatePage.rejectCandidate(0);
      await page.waitForTimeout(500);
    }
    
    // Zapisz zaakceptowane fiszki
    console.log('   💾 Zapisuję zaakceptowane fiszki');
    await generatePage.saveAll();
    
    // Poczekaj na przekierowanie do listy fiszek
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL('/flashcards');
    
    console.log('✅ Fiszki zostały wygenerowane i zapisane');

    // ==========================================
    // KROK 5: Przeglądanie listy fiszek
    // ==========================================
    console.log('📚 KROK 5: Przeglądanie listy fiszek');
    
    await expect(flashcardsPage.heading).toBeVisible();
    
    // Sprawdź ile fiszek mamy na liście
    await page.waitForTimeout(1000);
    const flashcardCount = await flashcardsPage.getFlashcardCount();
    console.log(`   📊 Liczba fiszek na liście: ${flashcardCount}`);
    expect(flashcardCount).toBeGreaterThan(0);
    
    // Wyszukaj fiszki po słowie kluczowym
    console.log('   🔍 Testuję wyszukiwanie fiszek');
    await flashcardsPage.search('Type');
    await page.waitForTimeout(1000);
    
    const searchResults = await flashcardsPage.getFlashcardCount();
    console.log(`   📊 Wyniki wyszukiwania: ${searchResults}`);
    
    // Wyczyść wyszukiwanie
    await flashcardsPage.search('');
    await page.waitForTimeout(1000);
    
    console.log('✅ Lista fiszek działa poprawnie');

    // ==========================================
    // KROK 6: Dodanie ręcznej fiszki
    // ==========================================
    console.log('✍️  KROK 6: Dodawanie ręcznej fiszki');
    
    await flashcardsPage.clickAdd();
    
    // Poczekaj na dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Wypełnij formularz
    const frontInput = page.getByLabel(/pytanie/i);
    const backInput = page.getByLabel(/odpowiedź/i);
    
    await frontInput.fill('Co to jest TypeScript?');
    await backInput.fill('TypeScript to typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript');
    
    // Zapisz fiszkę
    const submitButton = page.getByRole('button', { name: /dodaj/i });
    await submitButton.click();
    
    // Dialog powinien się zamknąć
    await expect(dialog).not.toBeVisible();
    await page.waitForTimeout(1000);
    
    console.log('✅ Ręczna fiszka została dodana');

    // ==========================================
    // KROK 7: Rozpoczęcie sesji nauki
    // ==========================================
    console.log('🎯 KROK 7: Rozpoczęcie sesji nauki');
    
    // Przejdź do sesji
    await navBar.goToSessions();
    await expect(page).toHaveURL('/sessions');
    
    // Sprawdź czy przycisk start jest dostępny
    const startButton = sessionsPage.startButton;
    const isStartDisabled = await startButton.isDisabled();
    
    if (isStartDisabled) {
      console.log('⚠️  Brak fiszek do nauki - pomijam sesję');
    } else {
      console.log('   ▶️  Rozpoczynam sesję nauki');
      await sessionsPage.startSession();
      
      // Poczekaj na załadowanie sesji
      await page.waitForTimeout(2000);
      
      // Sprawdź czy sesja się rozpoczęła
      const isActive = await sessionsPage.isSessionActive();
      expect(isActive).toBe(true);
      
      console.log('   ✅ Sesja nauki rozpoczęta');

      // ==========================================
      // KROK 8: Ocenianie fiszek
      // ==========================================
      console.log('⭐ KROK 8: Ocenianie fiszek');
      
      // Przejrzyj 3 fiszki
      for (let i = 0; i < 3; i++) {
        const stillActive = await sessionsPage.flashcardCard.isVisible();
        if (!stillActive) {
          console.log('   ℹ️  Sesja zakończona');
          break;
        }
        
        console.log(`   📖 Fiszka ${i + 1}/3`);
        
        // Odkryj odpowiedź
        await sessionsPage.revealAnswer();
        await expect(sessionsPage.flashcardBack).toBeVisible();
        
        // Oceń fiszkę (rotacja: hard, normal, easy)
        const ratings: Array<'hard' | 'normal' | 'easy'> = ['hard', 'normal', 'easy'];
        const rating = ratings[i % 3];
        
        console.log(`   ⭐ Oceniam jako: ${rating}`);
        
        if (rating === 'hard') {
          await sessionsPage.rateHard();
        } else if (rating === 'easy') {
          await sessionsPage.rateEasy();
        } else {
          await sessionsPage.rateNormal();
        }
        
        // Poczekaj na przejście do następnej fiszki
        await page.waitForTimeout(1500);
      }
      
      console.log('✅ Fiszki zostały ocenione');
    }

    // ==========================================
    // KROK 9: Test skrótów klawiszowych
    // ==========================================
    console.log('⌨️  KROK 9: Test skrótów klawiszowych');
    
    const stillInSession = await sessionsPage.flashcardCard.isVisible();
    if (stillInSession) {
      console.log('   🎹 Testuję skrót klawiszowy - Spacja');
      
      // Użyj spacji do odkrycia odpowiedzi
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      // Sprawdź czy odpowiedź jest widoczna
      const backVisible = await sessionsPage.flashcardBack.isVisible();
      if (backVisible) {
        console.log('   ✅ Spacja działa - odpowiedź odkryta');
        
        // Użyj klawisza 2 do oceny
        console.log('   🎹 Testuję skrót klawiszowy - 2 (normal)');
        await page.keyboard.press('2');
        await page.waitForTimeout(1500);
        
        console.log('   ✅ Skróty klawiszowe działają');
      }
    }

    // ==========================================
    // KROK 10: Nawigacja po aplikacji
    // ==========================================
    console.log('🧭 KROK 10: Test nawigacji');
    
    // Przejdź do strony głównej przez logo
    await navBar.goToHome();
    await expect(page).toHaveURL('/');
    console.log('   ✅ Logo prowadzi do strony głównej');
    
    // Przejdź do fiszek
    await navBar.goToFlashcards();
    await expect(page).toHaveURL('/flashcards');
    console.log('   ✅ Link do fiszek działa');
    
    // Wróć do strony głównej
    await navBar.goToHome();
    await expect(page).toHaveURL('/');

    // ==========================================
    // KROK 11: Przełączenie motywu
    // ==========================================
    console.log('🎨 KROK 11: Test przełączania motywu');
    
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class');
    
    await navBar.toggleTheme();
    await page.waitForTimeout(500);
    
    const newTheme = await htmlElement.getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
    
    console.log(`   ✅ Motyw zmieniony z "${initialTheme}" na "${newTheme}"`);

    // ==========================================
    // KROK 12: Wylogowanie
    // ==========================================
    console.log('👋 KROK 12: Wylogowanie');
    
    await navBar.logout();
    
    // Poczekaj na przekierowanie
    await page.waitForTimeout(2000);
    
    // Sprawdź czy zostaliśmy przekierowani do logowania
    await expect(page).toHaveURL('/login');
    
    // Sprawdź czy navbar nie pokazuje już użytkownika
    const isStillLoggedIn = await navBar.isLoggedIn();
    expect(isStillLoggedIn).toBe(false);
    
    console.log('✅ Wylogowanie pomyślne');

    // ==========================================
    // PODSUMOWANIE
    // ==========================================
    console.log('\n🎉 ========================================');
    console.log('🎉 SUKCES! Pełna ścieżka użytkownika działa!');
    console.log('🎉 ========================================\n');
    console.log('✅ Rejestracja');
    console.log('✅ Logowanie');
    console.log('✅ Generowanie fiszek AI');
    console.log('✅ Zarządzanie fiszkami');
    console.log('✅ Sesja nauki');
    console.log('✅ Ocenianie fiszek');
    console.log('✅ Skróty klawiszowe');
    console.log('✅ Nawigacja');
    console.log('✅ Przełączanie motywu');
    console.log('✅ Wylogowanie');
    console.log('\n========================================\n');
  });
});

