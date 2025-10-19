import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Sessions Page
 * Encapsulates study session page elements and actions
 */
export class SessionsPage {
  readonly page: Page;
  readonly startCard: Locator;
  readonly startButton: Locator;
  readonly flashcardCard: Locator;
  readonly revealButton: Locator;
  readonly flashcardBack: Locator;
  readonly rateHardButton: Locator;
  readonly rateNormalButton: Locator;
  readonly rateEasyButton: Locator;
  readonly progress: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startCard = page.getByTestId('session-start-card');
    this.startButton = page.getByTestId('session-start-button');
    this.flashcardCard = page.getByTestId('session-flashcard-card');
    this.revealButton = page.getByTestId('session-reveal-button');
    this.flashcardBack = page.getByTestId('session-flashcard-back');
    this.rateHardButton = page.getByTestId('session-rate-hard');
    this.rateNormalButton = page.getByTestId('session-rate-normal');
    this.rateEasyButton = page.getByTestId('session-rate-easy');
    this.progress = page.getByTestId('session-progress');
    this.errorMessage = page.getByTestId('session-error');
  }

  /**
   * Navigate to sessions page
   */
  async goto() {
    await this.page.goto('/sessions');
  }

  /**
   * Start a new study session
   */
  async startSession() {
    await this.startButton.click();
  }

  /**
   * Reveal the back of the flashcard
   */
  async revealAnswer() {
    await this.revealButton.click();
  }

  /**
   * Rate the flashcard as hard
   */
  async rateHard() {
    await this.rateHardButton.click();
  }

  /**
   * Rate the flashcard as normal
   */
  async rateNormal() {
    await this.rateNormalButton.click();
  }

  /**
   * Rate the flashcard as easy
   */
  async rateEasy() {
    await this.rateEasyButton.click();
  }

  /**
   * Complete a flashcard review (reveal + rate)
   */
  async reviewFlashcard(rating: 'hard' | 'normal' | 'easy' = 'normal') {
    await this.revealAnswer();
    await this.page.waitForTimeout(500); // Wait for animation

    switch (rating) {
      case 'hard':
        await this.rateHard();
        break;
      case 'easy':
        await this.rateEasy();
        break;
      default:
        await this.rateNormal();
    }
  }

  /**
   * Check if session is active
   */
  async isSessionActive(): Promise<boolean> {
    return await this.flashcardCard.isVisible();
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
    return await this.errorMessage.textContent() || '';
  }
}

