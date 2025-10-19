import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Navigation Bar
 * Encapsulates navbar elements and actions
 */
export class NavBarPage {
  readonly page: Page;
  readonly navbar: Locator;
  readonly logo: Locator;
  readonly homeLink: Locator;
  readonly flashcardsLink: Locator;
  readonly sessionsLink: Locator;
  readonly generateLink: Locator;
  readonly userEmail: Locator;
  readonly themeToggle: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly mobileMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.getByTestId('navbar');
    this.logo = page.getByTestId('navbar-logo');
    this.homeLink = page.getByTestId('navbar-link--');
    this.flashcardsLink = page.getByTestId('navbar-link--flashcards');
    this.sessionsLink = page.getByTestId('navbar-link--sessions');
    this.generateLink = page.getByTestId('navbar-link--generate-new');
    this.userEmail = page.getByTestId('navbar-user-email');
    this.themeToggle = page.getByTestId('navbar-theme-toggle');
    this.loginButton = page.getByTestId('navbar-login-button');
    this.logoutButton = page.getByTestId('navbar-logout-button');
    this.mobileMenuButton = page.getByTestId('navbar-mobile-menu-button');
  }

  /**
   * Navigate to home page via logo
   */
  async goToHome() {
    await this.logo.click();
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
   * Navigate to generate page
   */
  async goToGenerate() {
    await this.generateLink.click();
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Perform logout
   */
  async logout() {
    await this.logoutButton.click();
  }

  /**
   * Toggle theme (dark/light mode)
   */
  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.logoutButton.isVisible();
  }

  /**
   * Get logged in user email
   */
  async getUserEmail(): Promise<string> {
    return await this.userEmail.textContent() || '';
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu() {
    await this.mobileMenuButton.click();
  }
}

