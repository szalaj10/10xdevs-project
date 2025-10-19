import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Flashcards List Page
 * Encapsulates flashcards management page elements and actions
 */
export class FlashcardsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addButton: Locator;
  readonly flashcardItems: Locator;
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("flashcards-heading");
    this.searchInput = page.getByTestId("flashcards-search-input");
    this.addButton = page.getByTestId("flashcards-add-button");
    this.flashcardItems = page.getByTestId("flashcard-item");
    this.editButtons = page.getByTestId("flashcard-edit-button");
    this.deleteButtons = page.getByTestId("flashcard-delete-button");
    this.errorMessage = page.getByTestId("flashcards-error");
  }

  /**
   * Navigate to flashcards page
   */
  async goto() {
    await this.page.goto("/flashcards");
  }

  /**
   * Search for flashcards
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce
    await this.page.waitForTimeout(500);
  }

  /**
   * Get number of flashcard items
   */
  async getFlashcardCount(): Promise<number> {
    return await this.flashcardItems.count();
  }

  /**
   * Click add flashcard button
   */
  async clickAdd() {
    await this.addButton.click();
  }

  /**
   * Edit flashcard by index
   */
  async editFlashcard(index = 0) {
    await this.editButtons.nth(index).click();
  }

  /**
   * Delete flashcard by index
   */
  async deleteFlashcard(index = 0) {
    await this.deleteButtons.nth(index).click();
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}
