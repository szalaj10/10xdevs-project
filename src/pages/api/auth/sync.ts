import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const schema = z.object({
  access_token: z.string().min(10),
  refresh_token: z.string().min(10),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ code: "VALIDATION_ERROR", message: "Invalid tokens" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { access_token, refresh_token } = parsed.data;

    const { error } = await locals.supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return new Response(JSON.stringify({ code: "SET_SESSION_ERROR", message: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ code: "INTERNAL_ERROR", message: "Unexpected server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
