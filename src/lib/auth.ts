import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY || "";

/**
 * Creates a Supabase client for browser use with SSR cookie support
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split("; ").map((cookie) => {
          const [name, ...rest] = cookie.split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          let cookie = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`;
          }
          // Ensure cookies are available across the whole site
          cookie += `; Path=${options?.path ?? "/"}`;
          // Default to Lax if not specified
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
}

/**
 * Gets the current user's access token for API calls
 * @returns The access token or null if not authenticated
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || null;
}

/**
 * Signs in with email and password
 * @param email User email
 * @param password User password
 * @returns Authentication response with session and user data
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Gets the current session
 * @returns The current session or null if not authenticated
 */
export async function getCurrentSession() {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Signs out the current user
 */
export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  return await supabase.auth.signOut();
}
