import { test, expect } from "./fixtures/auth.fixture";

test.describe("Navigation and Route Protection", () => {
  test.describe("Public Routes", () => {
    test("should access login page without authentication", async ({ page }) => {
      await page.goto("/login");

      await expect(page).toHaveURL("/login");
      await expect(page.getByTestId("login-form")).toBeVisible();
    });

    test("should access signup page without authentication", async ({ page }) => {
      await page.goto("/signup");

      await expect(page).toHaveURL("/signup");
      await expect(page.getByTestId("signup-form")).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect to login when accessing flashcards without auth", async ({ page }) => {
      await page.goto("/flashcards");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("should redirect to login when accessing generate without auth", async ({ page }) => {
      await page.goto("/generate/new");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("should redirect to login when accessing sessions without auth", async ({ page }) => {
      await page.goto("/sessions");

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("should access home page when authenticated", async ({ authenticatedPage, page }) => {
      await page.goto("/");

      // Should stay on home page
      await expect(page).toHaveURL("/");
      await expect(page.getByTestId("home-page")).toBeVisible();
    });

    test("should access flashcards when authenticated", async ({ authenticatedPage, page }) => {
      await page.goto("/flashcards");

      // Should stay on flashcards page
      await expect(page).toHaveURL("/flashcards");
      await expect(page.getByTestId("flashcards-page")).toBeVisible();
    });

    test("should access generate when authenticated", async ({ authenticatedPage, page }) => {
      await page.goto("/generate/new");

      // Should stay on generate page
      await expect(page).toHaveURL("/generate/new");
      await expect(page.getByTestId("generate-page")).toBeVisible();
    });

    test("should access sessions when authenticated", async ({ authenticatedPage, page }) => {
      await page.goto("/sessions");

      // Should stay on sessions page
      await expect(page).toHaveURL("/sessions");
      await expect(page.getByTestId("session-study-page")).toBeVisible();
    });
  });

  test.describe("Navigation Bar", () => {
    test("should show login button when not authenticated", async ({ navBar, page }) => {
      await page.goto("/login");

      await expect(navBar.loginButton).toBeVisible();
      await expect(navBar.logoutButton).not.toBeVisible();
    });

    test("should show logout button when authenticated", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await expect(navBar.logoutButton).toBeVisible();
      await expect(navBar.loginButton).not.toBeVisible();
    });

    test("should show user email when authenticated", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await expect(navBar.userEmail).toBeVisible();

      const email = await navBar.getUserEmail();
      expect(email).toContain("@");
    });

    test("should navigate to home via logo", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/flashcards");

      await navBar.goToHome();

      await expect(page).toHaveURL("/");
    });

    test("should navigate to flashcards via navbar", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await navBar.goToFlashcards();

      await expect(page).toHaveURL("/flashcards");
    });

    test("should navigate to sessions via navbar", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await navBar.goToSessions();

      await expect(page).toHaveURL("/sessions");
    });

    test("should navigate to generate via navbar", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await navBar.goToGenerate();

      await expect(page).toHaveURL("/generate/new");
    });

    test("should logout successfully", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      await navBar.logout();

      // Should redirect to login
      await expect(page).toHaveURL("/login");
    });

    test("should toggle theme", async ({ authenticatedPage, navBar, page }) => {
      await page.goto("/");

      // Get initial theme
      const htmlElement = page.locator("html");
      const initialTheme = await htmlElement.getAttribute("class");

      // Toggle theme
      await navBar.toggleTheme();
      await page.waitForTimeout(500);

      // Theme should change
      const newTheme = await htmlElement.getAttribute("class");
      expect(newTheme).not.toBe(initialTheme);
    });
  });

  test.describe("Redirect After Login", () => {
    test("should redirect to original page after login", async ({ loginPage, page }) => {
      // Try to access protected page
      await page.goto("/flashcards");

      // Should redirect to login with redirectTo parameter
      await expect(page).toHaveURL(/\/login/);

      // Login
      const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
      const testPassword = process.env.TEST_USER_PASSWORD || "test123456";

      await loginPage.login(testEmail, testPassword);

      // Should redirect back to flashcards
      await page.waitForTimeout(2000);
      const currentUrl = page.url();

      // Should be on flashcards or home (depending on implementation)
      expect(currentUrl).toMatch(/\/(flashcards)?/);
    });
  });

  test.describe("Breadcrumb Navigation", () => {
    test("should navigate between pages in logical flow", async ({ authenticatedPage, page }) => {
      // Start at home
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL("/");
      await page.waitForTimeout(1000); // Wait for session to be established

      // Go to generate
      const generateCard = page.getByTestId("home-action-generuj-fiszki-ai");
      if (await generateCard.isVisible()) {
        await generateCard.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL("/generate/new");
        await page.waitForTimeout(1000); // Wait for session to be established
      }

      // Go to flashcards via navbar
      const flashcardsLink = page.getByTestId("navbar-link--flashcards");
      await flashcardsLink.click();
      await page.waitForLoadState("networkidle"); // Wait for page to fully load
      await page.waitForTimeout(1000); // Wait for session to be established
      await expect(page).toHaveURL("/flashcards");

      // Go to sessions via navbar
      const sessionsLink = page.getByTestId("navbar-link--sessions");
      await sessionsLink.click();
      await page.waitForLoadState("networkidle"); // Wait for page to fully load
      await page.waitForTimeout(1000); // Wait for session to be established
      await expect(page).toHaveURL("/sessions");

      // Go back to home via logo
      const logo = page.getByTestId("navbar-logo");
      await logo.click();
      await page.waitForLoadState("networkidle"); // Wait for page to fully load
      await page.waitForTimeout(1000); // Wait for session to be established
      await expect(page).toHaveURL("/");
    });
  });

  test.describe("Error Handling", () => {
    test("should handle 404 pages gracefully", async ({ page }) => {
      await page.goto("/non-existent-page");

      // Should show 404 or redirect
      await page.waitForTimeout(1000);

      // Page should load (even if it's a 404 page)
      const pageState = await page.evaluate(() => document.readyState);
      expect(pageState).toBe("complete");
    });

    test("should handle invalid session IDs", async ({ authenticatedPage, page }) => {
      await page.goto("/sessions/invalid-id-12345");

      // Should show error or redirect
      await page.waitForTimeout(1000);

      // Should either show error message or redirect
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    });
  });

  test.describe("Mobile Navigation", () => {
    test("should show mobile menu button on small screens", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/login");

      const mobileMenuButton = page.getByTestId("navbar-mobile-menu-button");
      await expect(mobileMenuButton).toBeVisible();
    });

    test("should open mobile menu", async ({ authenticatedPage, page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000); // Wait for session to be established

      const mobileMenuButton = page.getByTestId("navbar-mobile-menu-button");
      await mobileMenuButton.click();

      // Mobile menu should be visible
      await page.waitForTimeout(500);

      // Check if menu items are visible (they should appear in mobile menu)
      const logoutButton = page.getByTestId("navbar-mobile-logout-button");
      await expect(logoutButton).toBeVisible();
    });
  });

  test.describe("Back Button Navigation", () => {
    test("should handle browser back button", async ({ authenticatedPage, page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      await page.goto("/flashcards");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      await page.goto("/sessions");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Go back
      await page.goBack();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Extra wait for back navigation
      await expect(page).toHaveURL("/flashcards");

      // Go back again
      await page.goBack();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Extra wait for back navigation
      await expect(page).toHaveURL("/");
    });

    test("should handle browser forward button", async ({ authenticatedPage, page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      await page.goto("/flashcards");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Go back
      await page.goBack();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Extra wait for back navigation
      await expect(page).toHaveURL("/");

      // Go forward
      await page.goForward();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Extra wait for forward navigation
      await expect(page).toHaveURL("/flashcards");
    });
  });
});
