// @ts-check
import { defineConfig, envField } from "astro/config";
import process from "node:process";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 4321 },

  // Configure environment variables with astro:env
  // This ensures proper handling in Cloudflare Workers and other serverless environments
  env: {
    schema: {
      // Public variables - accessible in client and server
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      PUBLIC_SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),

      // Server-only variables - only accessible on server
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true, // Optional for local development
      }),
      GROQ_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      GROQ_MODEL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "llama-3.3-70b-versatile",
      }),
      GROQ_BASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),

      // Test environment variables
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_PUBLIC_KEY: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      // Make test env vars available in browser (for e2e tests)
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL || ""),
      "import.meta.env.SUPABASE_PUBLIC_KEY": JSON.stringify(process.env.SUPABASE_PUBLIC_KEY || ""),
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
