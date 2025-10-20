import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from "astro:env/client";
import { SUPABASE_SERVICE_ROLE_KEY } from "astro:env/server";

import type { Database } from "./database.types";

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_KEY;
const supabaseServiceKey = SUPABASE_SERVICE_ROLE_KEY;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // Only secure in production (HTTPS)
  httpOnly: false, // Must be false so browser JavaScript can read the session
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days - ensure cookies persist
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client for SSR with proper cookie handling
 * Uses @supabase/ssr with getAll/setAll pattern for security
 */
export function createSupabaseServerInstance(context: {
  headers: Headers;
  cookies: AstroCookies;
}): SupabaseClient<Database> {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
}

/**
 * Creates a Supabase client with service role privileges.
 * This bypasses RLS and should only be used in server-side code.
 * In development, this allows testing without authentication.
 */
export function createSupabaseServiceClient(): SupabaseClient<Database> {
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "For local development, run 'supabase status' to get your service_role key, " +
        "then add it to your .env.local file."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type { Database, SupabaseClient };
