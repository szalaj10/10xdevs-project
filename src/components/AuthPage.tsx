import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSupabase } from "../lib/hooks/useSupabase";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { ResetPasswordForm } from "./auth/ResetPasswordForm";

type AuthMode = "login" | "register" | "reset";

// Whitelist of allowed redirect paths
const ALLOWED_REDIRECT_PATHS = ["/", "/generate/new", "/flashcards", "/sessions"];

// Validate and sanitize redirectTo parameter
function validateRedirectTo(redirectTo: string | null): string {
  if (!redirectTo) return "/";

  // Only allow relative paths starting with /
  if (!redirectTo.startsWith("/")) return "/";

  // Prevent protocol or host in path
  if (redirectTo.includes("://") || redirectTo.includes("//")) return "/";

  // Check if path starts with an allowed path
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (allowed) => redirectTo === allowed || redirectTo.startsWith(allowed + "/")
  );

  return isAllowed ? redirectTo : "/";
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const { supabase } = useSupabase();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = validateRedirectTo(params.get("redirectTo"));
        window.location.replace(redirectTo);
      }
    });
  }, [supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">Fiszki AI</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === "login" && "Zaloguj się do swojego konta"}
            {mode === "register" && "Utwórz nowe konto"}
            {mode === "reset" && "Zresetuj hasło"}
          </p>
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Logowanie</TabsTrigger>
            <TabsTrigger value="register">Rejestracja</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <LoginForm onSwitchToSignup={() => setMode("register")} onSwitchToReset={() => setMode("reset")} />
          </TabsContent>

          <TabsContent value="register" className="mt-6">
            <SignupForm onSwitchToLogin={() => setMode("login")} />
          </TabsContent>

          <TabsContent value="reset" className="mt-6">
            <ResetPasswordForm onSwitchToLogin={() => setMode("login")} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
