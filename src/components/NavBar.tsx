import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useSupabase } from "../lib/hooks/useSupabase";

export function NavBar({
  initialAuthenticated = false,
  initialUserEmail = null,
}: {
  initialAuthenticated?: boolean;
  initialUserEmail?: string | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail);
  const [isDark, setIsDark] = useState(false);
  const { supabase } = useSupabase();

  useEffect(() => {
    // Check initial auth state from client to sync with server state
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Update state based on client session
      const hasSession = !!session?.user;
      setIsAuthenticated(hasSession);
      setUserEmail(session?.user?.email ?? null);
    });

    // Check dark mode state
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem("theme");
    const isDarkMode = savedTheme === "dark" || htmlElement.classList.contains("dark");
    setIsDark(isDarkMode);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, initialAuthenticated]);

  const toggleDarkMode = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains("dark")) {
      htmlElement.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("theme", "dark");
    }
  };

  const handleLogout = async () => {
    try {
      // Call server-side logout endpoint for proper cookie cleanup
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Also sign out on client-side
      await supabase.auth.signOut();

      // Force server-side reload to clear session
      window.location.replace("/login");
    } catch {
      // Fallback: still try to redirect to login
      window.location.replace("/login");
    }
  };

  const navLinks = [
    { href: "/", label: "Strona główna" },
    { href: "/flashcards", label: "Fiszki" },
    { href: "/sessions", label: "Nauka" },
    { href: "/generate/new", label: "Generuj" },
  ];

  return (
    <nav className="bg-background border-b" role="navigation" aria-label="Główna nawigacja" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="text-xl font-bold text-foreground" data-testid="navbar-logo">
                Fiszki AI
              </a>
            </div>
            <div className="sm:ml-6 flex space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                  data-testid={`navbar-link-${link.href.replace(/\//g, "-")}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            {userEmail && (
              <span className="text-sm text-muted-foreground" aria-live="polite" data-testid="navbar-user-email">
                Zalogowano: {userEmail}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Przełącz tryb ciemny"
              data-testid="navbar-theme-toggle"
            >
              {isDark ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>
            {isAuthenticated ? (
              <Button variant="default" onClick={handleLogout} data-testid="navbar-logout-button">
                Wyloguj
              </Button>
            ) : (
              <Button asChild variant="default" data-testid="navbar-login-button">
                <a href="/login">Zaloguj się</a>
              </Button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
              aria-expanded={isMenuOpen}
              data-testid="navbar-mobile-menu-button"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  onClick={toggleDarkMode}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground"
                >
                  {isDark ? "Tryb jasny" : "Tryb ciemny"}
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground"
                  data-testid="navbar-mobile-logout-button"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleDarkMode}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground"
                >
                  {isDark ? "Tryb jasny" : "Tryb ciemny"}
                </button>
                <a
                  href="/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-primary hover:text-foreground"
                >
                  Zaloguj się
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
