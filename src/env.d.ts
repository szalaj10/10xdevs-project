/// <reference types="astro/client" />
/// <reference types="astro/env" />

import type { Database, SupabaseClient } from "./db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        email: string | undefined;
        id: string;
      };
    }
  }

  interface Window {
    __INITIAL_AUTH_STATE__?: boolean;
  }
}

// Environment variables are now managed by astro:env
// Import them using: import { PUBLIC_SUPABASE_URL, GROQ_API_KEY } from 'astro:env/client' or 'astro:env/server'
// The schema is defined in astro.config.mjs

// Legacy support for test environment variables
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
