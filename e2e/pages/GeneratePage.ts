import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Generate Page
 * Encapsulates flashcard generation page elements and actions
 */
export class GeneratePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly topicInput: Locator;
  readonly generateButton: Locator;
  readonly errorMessage: Locator;
  readonly candidateCards: Locator;
  readonly editCandidateButton: Locator;
  readonly rejectCandidateButton: Locator;
  readonly saveAllButton: Locator;
  readonly startOverButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByTestId("generate-heading");
    this.topicInput = page.getByTestId("generate-topic-input");
    this.generateButton = page.getByTestId("generate-submit-button");
    this.errorMessage = page.getByTestId("generate-error");
    this.candidateCards = page.getByTestId("generate-candidate-card");
    this.editCandidateButton = page.getByTestId("generate-edit-candidate");
    this.rejectCandidateButton = page.getByTestId("generate-reject-candidate");
    this.saveAllButton = page.getByTestId("generate-save-all-button");
    this.startOverButton = page.getByTestId("generate-start-over-button");
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await this.page.goto("/generate/new");
  }

  /**
   * Generate flashcards from topic
   */
  async generate(topic: string) {
    await this.topicInput.fill(topic);
    await this.generateButton.click();
  }

  /**
   * Wait for candidates to be generated
   */
  async waitForCandidates(timeout = 30000) {
    await this.candidateCards.first().waitFor({ timeout });
  }

  /**
   * Get number of candidate cards
   */
  async getCandidateCount(): Promise<number> {
    return await this.candidateCards.count();
  }

  /**
   * Reject candidate by index
   */
  async rejectCandidate(index = 0) {
    await this.rejectCandidateButton.nth(index).click();
  }

  /**
   * Edit candidate by index
   */
  async editCandidate(index = 0) {
    await this.editCandidateButton.nth(index).click();
  }

  /**
   * Save all accepted candidates
   */
  async saveAll() {
    await this.saveAllButton.click();
  }

  /**
   * Start over with new generation
   */
  async startOver() {
    await this.startOverButton.click();
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
