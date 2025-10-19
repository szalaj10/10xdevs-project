import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Validation schema for signup request
const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków").max(72, "Hasło może mieć maksymalnie 72 znaki"),
});

/**
 * POST /api/auth/signup
 * Registers a new user with email and password
 *
 * Request body:
 * - email: string (valid email format)
 * - password: string (min 8 characters)
 *
 * Returns:
 * - 201: User created successfully (email verification required)
 * - 400: Validation error or user already exists
 * - 500: Internal server error
 *
 * Note: Supabase will send a confirmation email to the user.
 * The user must verify their email before they can log in.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          code: "VALIDATION_ERROR",
          message: "Błąd walidacji danych",
          errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt to sign up the user
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/login`,
      },
    });

    if (error) {
      console.error("Signup error:", error);

      // Handle specific Supabase errors
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({
            code: "USER_EXISTS",
            message: "Użytkownik o tym adresie e-mail już istnieje",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("Password should be at least")) {
        return new Response(
          JSON.stringify({
            code: "WEAK_PASSWORD",
            message: "Hasło jest zbyt słabe",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          code: "SIGNUP_ERROR",
          message: "Błąd podczas rejestracji",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email confirmation is required
    const requiresEmailConfirmation = data.user && !data.session;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        requiresEmailConfirmation,
        message: requiresEmailConfirmation
          ? "Konto utworzone. Sprawdź swoją skrzynkę e-mail i kliknij link weryfikacyjny, aby aktywować konto."
          : "Konto utworzone pomyślnie",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected signup error:", error);
    return new Response(
      JSON.stringify({
        code: "INTERNAL_ERROR",
        message: "Nieoczekiwany błąd serwera",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
