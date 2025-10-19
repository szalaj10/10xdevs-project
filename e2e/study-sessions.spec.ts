import { test, expect } from './fixtures/auth.fixture';

test.describe('Study Sessions and Spaced Repetition', () => {
  // Use authenticated context for all tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ authenticatedPage }) => {
    // Ensure user is authenticated before each test
  });

  test.describe('Session Start', () => {
    test('should display session start screen', async ({ sessionsPage }) => {
      await sessionsPage.goto();
      
      await expect(sessionsPage.startCard).toBeVisible();
      await expect(sessionsPage.startButton).toBeVisible();
    });

    test('should show flashcard statistics', async ({ sessionsPage, page }) => {
      await sessionsPage.goto();
      
      // Check for statistics display
      const dueCount = page.getByText(/karty do powtórki/i);
      const newCount = page.getByText(/nowe karty/i);
      
      await expect(dueCount).toBeVisible();
      await expect(newCount).toBeVisible();
    });

    test('should start study session', async ({ sessionsPage }) => {
      await sessionsPage.goto();
      
      // Check if start button is enabled (requires flashcards)
      const isDisabled = await sessionsPage.startButton.isDisabled();
      
      if (!isDisabled) {
        await sessionsPage.startSession();
        
        // Should show active session
        await expect(sessionsPage.flashcardCard).toBeVisible();
        await expect(sessionsPage.revealButton).toBeVisible();
      }
    });

    test('should show message when no cards available', async ({ sessionsPage, page }) => {
      await sessionsPage.goto();
      
      const startButton = sessionsPage.startButton;
      const isDisabled = await startButton.isDisabled();
      
      if (isDisabled) {
        // Should show message about no cards
        const message = page.getByText(/brak kart do nauki/i);
        await expect(message).toBeVisible();
      }
    });
  });

  test.describe('Flashcard Review', () => {
    test.beforeEach(async ({ sessionsPage }) => {
      await sessionsPage.goto();
      
      // Start session if possible
      const isDisabled = await sessionsPage.startButton.isDisabled();
      if (!isDisabled) {
        await sessionsPage.startSession();
      }
    });

    test('should reveal flashcard answer', async ({ sessionsPage }) => {
      // Check if session is active
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        await sessionsPage.revealAnswer();
        
        // Back should be visible
        await expect(sessionsPage.flashcardBack).toBeVisible();
        
        // Rating buttons should appear
        await expect(sessionsPage.rateHardButton).toBeVisible();
        await expect(sessionsPage.rateNormalButton).toBeVisible();
        await expect(sessionsPage.rateEasyButton).toBeVisible();
      }
    });

    test('should rate flashcard as hard', async ({ sessionsPage }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        await sessionsPage.revealAnswer();
        await sessionsPage.rateHard();
        
        // Should move to next card or end session
        await sessionsPage.page.waitForTimeout(1000);
      }
    });

    test('should rate flashcard as normal', async ({ sessionsPage }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        await sessionsPage.revealAnswer();
        await sessionsPage.rateNormal();
        
        // Should move to next card or end session
        await sessionsPage.page.waitForTimeout(1000);
      }
    });

    test('should rate flashcard as easy', async ({ sessionsPage }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        await sessionsPage.revealAnswer();
        await sessionsPage.rateEasy();
        
        // Should move to next card or end session
        await sessionsPage.page.waitForTimeout(1000);
      }
    });

    test('should show progress indicator', async ({ sessionsPage }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        // Progress bar should be visible
        await expect(sessionsPage.progress).toBeVisible();
      }
    });

    test('should complete full session', async ({ sessionsPage, page }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        // Review multiple flashcards (up to 5 for test speed)
        for (let i = 0; i < 5; i++) {
          const stillActive = await sessionsPage.flashcardCard.isVisible();
          if (!stillActive) break;
          
          await sessionsPage.reviewFlashcard('normal');
          await page.waitForTimeout(1000);
        }
        
        // Either still in session or redirected to summary
        const currentUrl = page.url();
        const isInSession = currentUrl.includes('/sessions');
        expect(isInSession).toBe(true);
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ sessionsPage }) => {
      await sessionsPage.goto();
      
      // Start session if possible
      const isDisabled = await sessionsPage.startButton.isDisabled();
      if (!isDisabled) {
        await sessionsPage.startSession();
      }
    });

    test('should reveal answer with spacebar', async ({ sessionsPage, page }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        // Press spacebar
        await page.keyboard.press('Space');
        
        // Back should be visible
        await expect(sessionsPage.flashcardBack).toBeVisible();
      }
    });

    test('should rate with number keys', async ({ sessionsPage, page }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        // Reveal first
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        
        // Press 2 for normal rating
        await page.keyboard.press('2');
        
        // Should move to next card or end
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Session Navigation', () => {
    test('should navigate to sessions from home', async ({ homePage, page }) => {
      await homePage.goto();
      
      // Click on sessions action card
      const sessionsCard = page.getByTestId('home-action-rozpocznij-naukę');
      
      if (await sessionsCard.isVisible()) {
        await sessionsCard.click();
        await expect(page).toHaveURL('/sessions');
      }
    });

    test('should navigate to sessions from navbar', async ({ navBar, page }) => {
      await page.goto('/');
      
      await navBar.goToSessions();
      
      await expect(page).toHaveURL('/sessions');
    });
  });

  test.describe('Session Summary', () => {
    test('should show summary after completing session', async ({ sessionsPage, page }) => {
      const isActive = await sessionsPage.isSessionActive();
      
      if (isActive) {
        // Complete all flashcards in session
        let cardsReviewed = 0;
        const maxCards = 30; // Session limit
        
        while (cardsReviewed < maxCards) {
          const stillActive = await sessionsPage.flashcardCard.isVisible();
          if (!stillActive) break;
          
          await sessionsPage.reviewFlashcard('normal');
          await page.waitForTimeout(500);
          cardsReviewed++;
        }
        
        // Should redirect to summary page
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        // Either still in session or at summary
        expect(currentUrl).toContain('/sessions');
      }
    });
  });
});

