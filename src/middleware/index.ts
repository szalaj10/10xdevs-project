import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/signup", "/reset-password/confirm", "/verify-email", "/api/auth/logout"];

// Protected paths that require authentication
const PROTECTED_PATHS = ["/generate", "/flashcards", "/sessions"];

/**
 * Checks if a path requires authentication
 * @param pathname - The URL pathname to check
 * @returns true if the path is protected and requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  // Check if path starts with any protected path prefix
  return PROTECTED_PATHS.some((protectedPath) => pathname.startsWith(protectedPath));
}

/**
 * Checks if a path is public and doesn't require authentication
 * @param pathname - The URL pathname to check
 * @returns true if the path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Create Supabase server client with proper SSR cookie handling
  context.locals.supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await context.locals.supabase.auth.getUser();

  if (user) {
    context.locals.user = {
      email: user.email,
      id: user.id,
    };
  }

  // Skip auth check for public paths and API routes
  if (isPublicPath(url.pathname) || url.pathname.startsWith("/api/")) {
    return next();
  }

  // Redirect to login for protected routes if user is not authenticated
  if (isProtectedPath(url.pathname) && !user) {
    return redirect("/login");
  }

  // For protected routes, add cache control headers to prevent stale sessions
  const response = await next();

  if (isProtectedPath(url.pathname) && user) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
});
