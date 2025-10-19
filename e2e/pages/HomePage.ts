import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Home Page
 * Encapsulates home page elements and actions
 */
export class HomePage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly generateButton: Locator;
  readonly flashcardsLink: Locator;
  readonly sessionsLink: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole("heading", { name: /welcome/i });
    this.generateButton = page.getByRole("button", { name: /generate/i });
    this.flashcardsLink = page.getByRole("link", { name: /flashcards/i });
    this.sessionsLink = page.getByRole("link", { name: /sessions/i });
    this.userMenu = page.getByRole("button", { name: /user menu/i });
    this.logoutButton = page.getByRole("button", { name: /logout/i });
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.userMenu.isVisible();
  }

  /**
   * Navigate to generate page
   */
  async goToGenerate() {
    await this.generateButton.click();
  }

  /**
   * Navigate to flashcards page
   */
  async goToFlashcards() {
    await this.flashcardsLink.click();
  }

  /**
   * Navigate to sessions page
   */
  async goToSessions() {
    await this.sessionsLink.click();
  }

  /**
   * Perform logout
   */
  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }
}
