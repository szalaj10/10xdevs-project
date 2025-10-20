import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out the user by clearing the Supabase session
 * Returns 204 No Content on success
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          code: "LOGOUT_ERROR",
          message: "Błąd podczas wylogowania",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Clear all Supabase-related cookies
    const cookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

    cookieNames.forEach((name) => {
      cookies.delete(name, { path: "/" });
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
