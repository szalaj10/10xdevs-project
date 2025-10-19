import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Signup Page
 * Encapsulates signup page elements and actions
 */
export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly signUpButton: Locator;
  readonly switchToLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('signup-email-input');
    this.passwordInput = page.getByTestId('signup-password-input');
    this.confirmPasswordInput = page.getByTestId('signup-confirm-password-input');
    this.signUpButton = page.getByTestId('signup-submit-button');
    this.switchToLoginButton = page.getByTestId('signup-switch-to-login');
    this.errorMessage = page.getByTestId('signup-error');
    this.successMessage = page.getByTestId('signup-success');
  }

  /**
   * Navigate to signup page
   */
  async goto() {
    await this.page.goto('/signup');
  }

  /**
   * Perform signup with credentials
   */
  async signup(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword || password);
    await this.signUpButton.click();
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

  /**
   * Check if success message is visible
   */
  async hasSuccess(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    await this.switchToLoginButton.click();
  }
}

