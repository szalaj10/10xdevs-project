import { test, expect } from "./fixtures/auth.fixture";

test.describe("Flashcards Management", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ authenticatedPage }) => {
    // Ensure user is authenticated before each test
    await authenticatedPage;
  });

  test.describe("Generate Flashcards", () => {
    test("should navigate to generate page", async ({ homePage, page }) => {
      await homePage.goto();
      await homePage.goToGenerate();

      await expect(page).toHaveURL("/generate");
    });

    test("should display generation form", async ({ page }) => {
      await page.goto("/generate");

      const topicInput = page.getByLabel(/topic/i);
      const generateButton = page.getByRole("button", { name: /generate/i });

      await expect(topicInput).toBeVisible();
      await expect(generateButton).toBeVisible();
    });

    test("should generate flashcard candidates", async ({ page }) => {
      await page.goto("/generate");

      const topicInput = page.getByLabel(/topic/i);
      const generateButton = page.getByRole("button", { name: /generate/i });

      await topicInput.fill("JavaScript basics");
      await generateButton.click();

      // Wait for candidates to be generated
      await page.waitForSelector('[data-testid="candidate-card"]', { timeout: 30000 });

      const candidates = page.locator('[data-testid="candidate-card"]');
      await expect(candidates).toHaveCount(10, { timeout: 30000 });
    });

    test("should accept flashcard candidate", async ({ page }) => {
      await page.goto("/generate");

      // Generate candidates first
      await page.getByLabel(/topic/i).fill("TypeScript");
      await page.getByRole("button", { name: /generate/i }).click();

      await page.waitForSelector('[data-testid="candidate-card"]', { timeout: 30000 });

      // Accept first candidate
      const acceptButton = page.locator('[data-testid="accept-candidate"]').first();
      await acceptButton.click();

      // Should show success message
      await expect(page.getByText(/accepted/i)).toBeVisible();
    });

    test("should reject flashcard candidate", async ({ page }) => {
      await page.goto("/generate");

      // Generate candidates first
      await page.getByLabel(/topic/i).fill("React");
      await page.getByRole("button", { name: /generate/i }).click();

      await page.waitForSelector('[data-testid="candidate-card"]', { timeout: 30000 });

      // Reject first candidate
      const rejectButton = page.locator('[data-testid="reject-candidate"]').first();
      await rejectButton.click();

      // Candidate should be removed
      const candidates = page.locator('[data-testid="candidate-card"]');
      await expect(candidates).toHaveCount(9);
    });
  });

  test.describe("Flashcards List", () => {
    test("should display flashcards list", async ({ page }) => {
      await page.goto("/flashcards");

      const flashcardsList = page.getByRole("list", { name: /flashcards/i });
      await expect(flashcardsList).toBeVisible();
    });

    test("should search flashcards", async ({ page }) => {
      await page.goto("/flashcards");

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill("JavaScript");

      // Wait for filtered results
      await page.waitForTimeout(500);

      const flashcards = page.locator('[data-testid="flashcard-item"]');
      const count = await flashcards.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
