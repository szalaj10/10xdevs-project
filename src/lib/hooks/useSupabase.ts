import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../db/database.types";

// Support both PUBLIC_ prefixed and non-prefixed env vars (for testing)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_PUBLIC_KEY || "";

if (!supabaseUrl) {
  throw new Error(
    "PUBLIC_SUPABASE_URL is not configured. " +
      "For local development, add it to your .env file. " +
      "Example: PUBLIC_SUPABASE_URL=http://127.0.0.1:54321"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "PUBLIC_SUPABASE_KEY is not configured. " +
      "For local development, run 'supabase status' to get your anon key, " +
      "then add it to your .env file as PUBLIC_SUPABASE_KEY"
  );
}

// Create browser client with SSR support for cookie synchronization
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      // Guard against server-side rendering
      if (typeof document === "undefined") {
        return [];
      }
      const cookies = document.cookie
        .split("; ")
        .filter((c) => c)
        .map((cookie) => {
          const [name, ...rest] = cookie.split("=");
          return { name, value: rest.join("=") };
        });
      return cookies;
    },
    setAll(cookies) {
      // Guard against server-side rendering
      if (typeof document === "undefined") {
        return;
      }
      cookies.forEach(({ name, value, options }) => {
        // Build cookie string - value should NOT be encoded as Supabase handles this
        let cookie = `${name}=${value}`;
        if (options?.maxAge) {
          cookie += `; Max-Age=${options.maxAge}`;
        }
        // Ensure cookies are available across the whole site
        cookie += `; Path=${options?.path ?? "/"}`;
        // Use sameSite from options or default to lax
        const sameSite = options?.sameSite ?? "lax";
        cookie += `; SameSite=${sameSite}`;
        // Only set secure flag in production (HTTPS)
        if (options?.secure && window.location.protocol === "https:") {
          cookie += "; Secure";
        }
        document.cookie = cookie;
      });
    },
  },
});

export function useSupabase() {
  return { supabase };
}
