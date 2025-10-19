import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { HomePage } from "../pages/HomePage";
import { GeneratePage } from "../pages/GeneratePage";
import { FlashcardsPage } from "../pages/FlashcardsPage";
import { SessionsPage } from "../pages/SessionsPage";
import { NavBarPage } from "../pages/NavBarPage";

/**
 * Test fixtures for authentication
 * Provides reusable page objects and authenticated contexts
 */
interface AuthFixtures {
  loginPage: LoginPage;
  signupPage: SignupPage;
  homePage: HomePage;
  generatePage: GeneratePage;
  flashcardsPage: FlashcardsPage;
  sessionsPage: SessionsPage;
  navBar: NavBarPage;
  authenticatedPage: void;
}

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  signupPage: async ({ page }, use) => {
    const signupPage = new SignupPage(page);
    await use(signupPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  generatePage: async ({ page }, use) => {
    const generatePage = new GeneratePage(page);
    await use(generatePage);
  },

  flashcardsPage: async ({ page }, use) => {
    const flashcardsPage = new FlashcardsPage(page);
    await use(flashcardsPage);
  },

  sessionsPage: async ({ page }, use) => {
    const sessionsPage = new SessionsPage(page);
    await use(sessionsPage);
  },

  navBar: async ({ page }, use) => {
    const navBar = new NavBarPage(page);
    await use(navBar);
  },

  authenticatedPage: async ({ page, context }, use) => {
    // Set up authenticated state
    // This can be done by:
    // 1. Using API to create session
    // 2. Setting cookies/localStorage
    // 3. Or performing login via UI

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use test credentials
    const testEmail = process.env.TEST_USER_EMAIL || process.env.E2E_USERNAME || "mszalajko@manufacturo.com";
    const testPassword = process.env.TEST_USER_PASSWORD || process.env.E2E_PASSWORD || "Pracownik123";

    console.log(`[Auth Fixture] Attempting login with: ${testEmail}`);
    console.log(`[Auth Fixture] Password length: ${testPassword.length}`);
    await loginPage.login(testEmail, testPassword);

    // Wait a bit for the login to process and cookies to be set
    await page.waitForTimeout(3000);

    // Check current URL
    const currentUrl = page.url();
    console.log(`[Auth Fixture] Current URL after login: ${currentUrl}`);

    // Wait for navigation to complete or error message
    try {
      await page.waitForURL("/", { timeout: 10000 });
      console.log("[Auth Fixture] Successfully navigated to home page");
    } catch (error) {
      // Check if there's an error message on the login page
      const errorElement = page.getByRole("alert");
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      // Check if still on login page
      if (currentUrl.includes("/login")) {
        throw new Error(`Login failed: Still on login page after ${currentUrl}`);
      }
      // If no error message, throw the original timeout error
      throw error;
    }

    // Get all cookies after successful login to verify session cookies are set
    const cookies = await context.cookies();
    const supabaseCookies = cookies.filter((c) => c.name.startsWith("sb-"));
    console.log(`[Auth Fixture] Session cookies set: ${supabaseCookies.length} Supabase cookies found`);

    // Verify we have the necessary session cookies
    if (supabaseCookies.length === 0) {
      console.warn("[Auth Fixture] Warning: No Supabase session cookies found after login");
    } else {
      // Log cookie details for debugging
      supabaseCookies.forEach((cookie) => {
        console.log(`[Auth Fixture] Cookie: ${cookie.name}, expires: ${cookie.expires}, sameSite: ${cookie.sameSite}`);
      });
    }

    // Wait a bit more to ensure cookies are fully persisted
    await page.waitForTimeout(1000);

    await use();
  },
});

export { expect } from "@playwright/test";
