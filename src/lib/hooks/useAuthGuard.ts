import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./useSupabase";

/**
 * Hook to protect pages - redirects to login if not authenticated
 * @param redirectOnAuth - If true, redirects authenticated users away (for login page)
 */
export function useAuthGuard(redirectOnAuth = false) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      // Prefer SSR state passed via Layout to avoid client-side redirect loops
      const ssrAuthenticated = (window as { __INITIAL_AUTH_STATE__?: boolean }).__INITIAL_AUTH_STATE__ === true;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const hasSession = !!session || ssrAuthenticated;
      setIsAuthenticated(hasSession);

      if (redirectOnAuth && hasSession) {
        // Redirect authenticated users away from login page
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirectTo") || "/";
        window.location.replace(redirectTo);
        return;
      }

      // Do NOT redirect unauthenticated users here; rely on SSR guards
      // to avoid races. Just finish loading state for client components.
      setIsLoading(false);
    } catch {
      // Avoid client-side redirects on error to prevent loops
      setIsLoading(false);
    }
  }, [redirectOnAuth, supabase.auth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { isLoading, isAuthenticated };
}
