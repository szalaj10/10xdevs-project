/// <reference types="astro/client" />

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

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MOCK?: string;
  readonly GROQ_API_KEY: string;
  readonly GROQ_MODEL?: string;
  readonly GROQ_BASE_URL?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
