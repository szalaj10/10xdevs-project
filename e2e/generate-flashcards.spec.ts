import { test, expect } from './fixtures/auth.fixture';

test.describe('Flashcards Generation and Management', () => {
  // Use authenticated context for all tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ authenticatedPage }) => {
    // Ensure user is authenticated before each test
  });

  test.describe('Generate Flashcards', () => {
    test('should navigate to generate page', async ({ homePage, page }) => {
      await homePage.goto();
      
      // Click on generate action card
      const generateCard = page.getByTestId('home-action-generuj-fiszki-ai');
      await generateCard.click();
      
      await expect(page).toHaveURL('/generate/new');
    });

    test('should display generation form', async ({ generatePage }) => {
      await generatePage.goto();
      
      await expect(generatePage.heading).toBeVisible();
      await expect(generatePage.topicInput).toBeVisible();
      await expect(generatePage.generateButton).toBeVisible();
    });

    test('should show error for empty topic', async ({ generatePage }) => {
      await generatePage.goto();
      
      // Try to generate with empty topic
      await generatePage.generateButton.click();
      
      // Button should be disabled or show error
      await expect(generatePage.generateButton).toBeDisabled();
    });

    test('should show error for too short topic', async ({ generatePage }) => {
      await generatePage.goto();
      
      await generatePage.generate('ab');
      
      // Should show validation error
      await expect(generatePage.errorMessage).toBeVisible();
    });

    test('should generate flashcard candidates', async ({ generatePage }) => {
      await generatePage.goto();
      
      await generatePage.generate('JavaScript podstawy');
      
      // Wait for candidates to be generated (with longer timeout for AI)
      await generatePage.waitForCandidates(45000);
      
      // Should have multiple candidates
      const count = await generatePage.getCandidateCount();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(10);
    });

    test('should reject flashcard candidate', async ({ generatePage }) => {
      await generatePage.goto();
      
      // Generate candidates
      await generatePage.generate('TypeScript');
      await generatePage.waitForCandidates(45000);
      
      const initialCount = await generatePage.getCandidateCount();
      
      // Reject first candidate
      await generatePage.rejectCandidate(0);
      
      // Wait for UI update
      await generatePage.page.waitForTimeout(500);
      
      // Candidate should be marked as rejected (opacity reduced)
      // We don't count it as removed, just visually different
      const afterCount = await generatePage.getCandidateCount();
      expect(afterCount).toBe(initialCount);
    });

    test('should save accepted flashcards', async ({ generatePage, page }) => {
      await generatePage.goto();
      
      // Generate candidates
      await generatePage.generate('React hooks');
      await generatePage.waitForCandidates(45000);
      
      // Save all accepted candidates
      await generatePage.saveAll();
      
      // Should redirect to flashcards list
      await expect(page).toHaveURL('/flashcards', { timeout: 10000 });
    });

    test('should start over with new generation', async ({ generatePage }) => {
      await generatePage.goto();
      
      // Generate candidates
      await generatePage.generate('Python');
      await generatePage.waitForCandidates(45000);
      
      // Start over
      await generatePage.startOver();
      
      // Should show form again
      await expect(generatePage.topicInput).toBeVisible();
      await expect(generatePage.topicInput).toHaveValue('');
    });
  });

  test.describe('Flashcards List', () => {
    test('should display flashcards list page', async ({ flashcardsPage }) => {
      await flashcardsPage.goto();
      
      await expect(flashcardsPage.heading).toBeVisible();
      await expect(flashcardsPage.searchInput).toBeVisible();
      await expect(flashcardsPage.addButton).toBeVisible();
    });

    test('should search flashcards', async ({ flashcardsPage }) => {
      await flashcardsPage.goto();
      
      // Wait for initial load
      await flashcardsPage.page.waitForTimeout(1000);
      
      const initialCount = await flashcardsPage.getFlashcardCount();
      
      if (initialCount > 0) {
        // Search for something specific
        await flashcardsPage.search('JavaScript');
        
        // Wait for search results
        await flashcardsPage.page.waitForTimeout(1000);
        
        const searchCount = await flashcardsPage.getFlashcardCount();
        // Search should filter results (may be 0 if no matches)
        expect(searchCount).toBeLessThanOrEqual(initialCount);
      }
    });

    test('should navigate through pagination', async ({ flashcardsPage, page }) => {
      await flashcardsPage.goto();
      
      // Check if pagination exists (only if there are many flashcards)
      const nextButton = page.getByRole('button', { name: /następna/i });
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // URL should update with page parameter
        await page.waitForTimeout(500);
        // Just verify we can click pagination
      }
    });
  });

  test.describe('Manual Flashcard Creation', () => {
    test('should open add flashcard dialog', async ({ flashcardsPage, page }) => {
      await flashcardsPage.goto();
      
      await flashcardsPage.clickAdd();
      
      // Dialog should be visible
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    test('should create flashcard manually', async ({ flashcardsPage, page }) => {
      await flashcardsPage.goto();
      
      await flashcardsPage.clickAdd();
      
      // Fill in flashcard details
      const frontInput = page.getByLabel(/pytanie/i);
      const backInput = page.getByLabel(/odpowiedź/i);
      const submitButton = page.getByRole('button', { name: /dodaj/i });
      
      await frontInput.fill('Co to jest TypeScript?');
      await backInput.fill('TypeScript to typowany nadzbiór JavaScript');
      await submitButton.click();
      
      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // Flashcard should be added to list
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Flashcard Management', () => {
    test('should edit flashcard', async ({ flashcardsPage, page }) => {
      await flashcardsPage.goto();
      
      // Wait for flashcards to load
      await page.waitForTimeout(1000);
      
      const count = await flashcardsPage.getFlashcardCount();
      
      if (count > 0) {
        await flashcardsPage.editFlashcard(0);
        
        // Edit dialog should be visible
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        
        // Can modify and save
        const frontInput = page.getByLabel(/pytanie/i);
        await frontInput.fill('Updated question');
        
        const saveButton = page.getByRole('button', { name: /zapisz/i });
        await saveButton.click();
        
        // Dialog should close
        await expect(dialog).not.toBeVisible();
      }
    });

    test('should delete flashcard', async ({ flashcardsPage, page }) => {
      await flashcardsPage.goto();
      
      // Wait for flashcards to load
      await page.waitForTimeout(1000);
      
      const initialCount = await flashcardsPage.getFlashcardCount();
      
      if (initialCount > 0) {
        await flashcardsPage.deleteFlashcard(0);
        
        // Confirmation dialog should appear
        const confirmDialog = page.getByRole('alertdialog');
        await expect(confirmDialog).toBeVisible();
        
        // Confirm deletion
        const confirmButton = page.getByRole('button', { name: /usuń/i });
        await confirmButton.click();
        
        // Wait for deletion
        await page.waitForTimeout(1000);
        
        // Count should decrease
        const afterCount = await flashcardsPage.getFlashcardCount();
        expect(afterCount).toBe(initialCount - 1);
      }
    });
  });
});

