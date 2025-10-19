import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Encapsulates login page elements and actions
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpLink: Locator;
  readonly resetPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.signInButton = page.getByTestId("login-submit-button");
    this.signUpLink = page.getByRole("link", { name: /zarejestruj|sign up/i });
    this.resetPasswordLink = page.getByRole("link", { name: /zapomnia|forgot password/i });
    this.errorMessage = page.getByRole("alert");
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    // Wait for form to be ready
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    // Submit the form by pressing Enter or clicking button
    await this.signInButton.waitFor({ state: "visible" });
    // Use Promise.all to wait for navigation
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {}),
      this.signInButton.click(),
    ]);
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

  /**
   * Navigate to sign up page
   */
  async goToSignUp() {
    await this.signUpLink.click();
  }

  /**
   * Navigate to reset password page
   */
  async goToResetPassword() {
    await this.resetPasswordLink.click();
  }
}
