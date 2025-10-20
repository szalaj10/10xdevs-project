import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * POST /api/auth/login
 * Authenticates a user with email and password
 *
 * Request body:
 * - email: string (valid email format)
 * - password: string
 *
 * Returns:
 * - 200: Login successful
 * - 400: Invalid credentials or validation error
 * - 500: Internal server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    // Attempt to sign in the user
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("Invalid login credentials")) {
        return new Response(
          JSON.stringify({
            code: "INVALID_CREDENTIALS",
            message: "Nieprawidłowy e-mail lub hasło",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("Email not confirmed")) {
        return new Response(
          JSON.stringify({
            code: "EMAIL_NOT_CONFIRMED",
            message: "Twój e-mail nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          code: "LOGIN_ERROR",
          message: "Błąd podczas logowania",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Session is automatically set via cookies by the Supabase client
    // The middleware's createSupabaseServerInstance handles cookie setting
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
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
