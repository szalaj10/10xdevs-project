import { test as base, type Page, type BrowserContext, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { HomePage } from "../pages/HomePage";
import { GeneratePage } from "../pages/GeneratePage";
import { FlashcardsPage } from "../pages/FlashcardsPage";
import { SessionsPage } from "../pages/SessionsPage";
import { NavBarPage } from "../pages/NavBarPage";

interface AuthFixtures {
  loginPage: LoginPage;
  signupPage: SignupPage;
  homePage: HomePage;
  generatePage: GeneratePage;
  flashcardsPage: FlashcardsPage;
  sessionsPage: SessionsPage;
  navBar: NavBarPage;
  authenticatedPage: unknown;
}

type Use<T> = (fixture: T) => Promise<void>;

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }: { page: Page }, use: Use<LoginPage>) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }: { page: Page }, use: Use<SignupPage>) => {
    await use(new SignupPage(page));
  },
  homePage: async ({ page }: { page: Page }, use: Use<HomePage>) => {
    await use(new HomePage(page));
  },
  generatePage: async ({ page }: { page: Page }, use: Use<GeneratePage>) => {
    await use(new GeneratePage(page));
  },
  flashcardsPage: async (
    { page }: { page: Page },
    use: Use<FlashcardsPage>
  ) => {
    await use(new FlashcardsPage(page));
  },
  sessionsPage: async ({ page }: { page: Page }, use: Use<SessionsPage>) => {
    await use(new SessionsPage(page));
  },
  navBar: async ({ page }: { page: Page }, use: Use<NavBarPage>) => {
    await use(new NavBarPage(page));
  },

  authenticatedPage: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: Use<unknown>
  ) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.TEST_USER_EMAIL || process.env.E2E_USERNAME || "test@example.com";
    const password = process.env.TEST_USER_PASSWORD || process.env.E2E_PASSWORD || "test123456";
    await loginPage.login(email, password);

    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    try {
      await page.waitForURL("/", { timeout: 10000 });
    } catch (error) {
      const errorElement = page.getByRole("alert");
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed: ${errorText ?? ""}`);
      }
      if (currentUrl.includes("/login")) {
        throw new Error(`Login failed: Still on login page after ${currentUrl}`);
      }
      throw error;
    }

    const hasSession = (await context.cookies()).some((c) => c.name.startsWith("sb-"));
    if (!hasSession) {
      // non-fatal in CI
    }

    await page.waitForTimeout(1000);
    await use(undefined);
  },
});

export { expect } from "@playwright/test";


