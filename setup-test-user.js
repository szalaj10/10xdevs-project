#!/usr/bin/env node
/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Setup Test User
 *
 * This script creates a test user in the local Supabase instance
 * using the Supabase Admin API (service role key).
 *
 * Email: mszalajko@manufacturo.com
 * Password: Pracownik123
 * User ID: 0b4e8bb7-ceda-46a0-9760-672b856f2f4a
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Create admin client using service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testUser = {
  id: "0b4e8bb7-ceda-46a0-9760-672b856f2f4a",
  email: "mszalajko@manufacturo.com",
  password: "Pracownik123",
};

async function setupTestUser() {
  console.log("🔧 Setting up test user...\n");
  console.log(`Email: ${testUser.email}`);
  console.log(`Password: ${testUser.password}`);
  console.log(`User ID: ${testUser.id}\n`);

  try {
    // First, check if user already exists
    console.log("🔍 Checking if user already exists...");
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    let existingUser = null;
    if (!listError) {
      existingUser = users.find((u) => u.email === testUser.email);
    }

    if (existingUser) {
      console.log("ℹ️  User already exists\n");
      console.log(`User ID: ${existingUser.id}\n`);

      // Try to update the password
      console.log("🔄 Ensuring password is correct...");
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: testUser.password,
      });

      if (updateError) {
        console.log("⚠️  Could not update password:", updateError.message);
      } else {
        console.log("✅ Password updated successfully!\n");
      }

      testUser.id = existingUser.id; // Update the ID for login test
    } else {
      // Create user using Admin API
      console.log("📝 Creating new user...");
      const { data, error } = await supabase.auth.admin.createUser({
        user_metadata: {},
        email: testUser.email,
        password: testUser.password,
        email_confirm: true, // Auto-confirm email for local dev
        id: testUser.id,
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes("already exists") || error.message.includes("already registered")) {
          console.log("ℹ️  User already exists\n");

          // Try to list users to get the ID
          console.log("🔍 Looking up existing user...");
          const {
            data: { users },
            error: listError,
          } = await supabase.auth.admin.listUsers();

          if (!listError) {
            const existingUser = users.find((u) => u.email === testUser.email);
            if (existingUser) {
              console.log(`✅ Found user: ${existingUser.id}\n`);

              // Try to update the password
              console.log("🔄 Ensuring password is correct...");
              const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { password: testUser.password }
              );

              if (updateError) {
                console.log("⚠️  Could not update password:", updateError.message);
              } else {
                console.log("✅ Password updated successfully!\n");
              }

              testUser.id = existingUser.id; // Update the ID for login test
            }
          }
        } else {
          throw error;
        }
      } else {
        console.log("✅ Test user created successfully!\n");
        console.log(`User ID: ${data.user.id}`);
        console.log(`Email: ${data.user.email}\n`);
      }
    }

    // Test login
    console.log("🧪 Testing login...");
    const loginClient = createClient(
      supabaseUrl,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    );

    const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (loginError) {
      console.log("❌ Login test failed:", loginError.message);
      process.exit(1);
    }

    console.log("✅ Login test successful!");
    console.log("\n📋 Access Token:");
    console.log(loginData.session.access_token);
    console.log("\n✨ Setup complete! You can now use these credentials to login.\n");
  } catch (error) {
    console.error("❌ Error setting up test user:");
    console.error(error.message);
    if (error.details) console.error("Details:", error.details);
    process.exit(1);
  }
}

setupTestUser();
