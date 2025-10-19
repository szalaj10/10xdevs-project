import { test, expect } from "./fixtures/auth.fixture";

test.describe("Authentication Flow", () => {
  test.describe("Signup", () => {
    test("should display signup form", async ({ signupPage }) => {
      await signupPage.goto();

      await expect(signupPage.emailInput).toBeVisible();
      await expect(signupPage.passwordInput).toBeVisible();
      await expect(signupPage.confirmPasswordInput).toBeVisible();
      await expect(signupPage.signUpButton).toBeVisible();
    });

    test("should show error for invalid email", async ({ signupPage }) => {
      await signupPage.goto();

      await signupPage.signup("invalid-email", "password123", "password123");

      // Should show validation error
      await expect(signupPage.errorMessage).toBeVisible();
    });

    test("should show error for password mismatch", async ({ signupPage }) => {
      await signupPage.goto();

      await signupPage.signup("test@example.com", "password123", "different123");

      await expect(signupPage.errorMessage).toBeVisible();
      const errorText = await signupPage.getErrorMessage();
      expect(errorText).toContain("identyczne");
    });

    test("should show error for weak password", async ({ signupPage }) => {
      await signupPage.goto();

      await signupPage.signup("test@example.com", "weak", "weak");

      await expect(signupPage.errorMessage).toBeVisible();
      const errorText = await signupPage.getErrorMessage();
      expect(errorText).toContain("8 znaków");
    });

    test("should navigate to login page", async ({ signupPage, page }) => {
      await signupPage.goto();

      await signupPage.goToLogin();

      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Login", () => {
    test("should display login form", async ({ loginPage }) => {
      await loginPage.goto();

      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.signInButton).toBeVisible();
    });

    test("should show error for invalid credentials", async ({ loginPage }) => {
      await loginPage.goto();

      await loginPage.login("invalid@example.com", "wrongpassword");

      await expect(loginPage.errorMessage).toBeVisible();
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).toContain("Invalid");
    });

    test("should successfully login with valid credentials", async ({ loginPage, page }) => {
      await loginPage.goto();

      const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
      const testPassword = process.env.TEST_USER_PASSWORD || "test123456";

      await loginPage.login(testEmail, testPassword);

      // Should redirect to home page
      await expect(page).toHaveURL("/");
    });

    test("should navigate to sign up page", async ({ loginPage, page }) => {
      await loginPage.goto();

      await loginPage.goToSignUp();

      await expect(page).toHaveURL("/signup");
    });

    test("should navigate to reset password page", async ({ loginPage, page }) => {
      await loginPage.goto();

      await loginPage.goToResetPassword();

      await expect(page).toHaveURL(/reset-password/);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when not authenticated", async ({ page }) => {
      await page.goto("/flashcards");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("should access protected route when authenticated", async ({ _authenticatedPage, page }) => {
      await page.goto("/flashcards");

      // Should stay on flashcards page
      await expect(page).toHaveURL("/flashcards");
    });
  });

  test.describe("Logout", () => {
    test("should successfully logout", async ({ _authenticatedPage, homePage, page }) => {
      await homePage.goto();

      await homePage.logout();

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });
  });
});
