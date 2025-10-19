import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useSupabase } from "../lib/hooks/useSupabase";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onSwitchToReset?: () => void;
}

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

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function LoginForm({ onSuccess, onSwitchToSignup, onSwitchToReset }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (!isValidEmail(email)) {
      setError("Podaj poprawny adres e-mail");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Podaj hasło");
      setLoading(false);
      return;
    }

    try {
      console.log("[LoginForm] Attempting login...");

      // Login directly using Supabase client (browser)
      // This automatically sets cookies for SSR
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[LoginForm] Login response:", { data, error: signInError });

      if (signInError) {
        console.error("[LoginForm] Login error:", signInError);

        // Handle specific Supabase errors
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Nieprawidłowy e-mail lub hasło");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Twój e-mail nie został jeszcze zweryfikowany. Sprawdź swoją skrzynkę pocztową.");
        } else {
          setError(signInError.message || "Błąd podczas logowania. Spróbuj ponownie.");
        }
        setLoading(false);
        return;
      }

      // Handle successful login
      console.log("[LoginForm] Login successful, user:", data.user?.email);

      if (onSuccess) {
        onSuccess();
      }

      // Force full page reload to ensure server recognizes the session
      const params = new URLSearchParams(window.location.search);
      const redirectTo = validateRedirectTo(params.get("redirectTo"));

      console.log("[LoginForm] Redirecting to:", redirectTo);

      // Use window.location.href for full reload
      window.location.href = redirectTo;
    } catch (err) {
      console.error("Login error:", err);
      setError("Błąd połączenia z serwerem. Spróbuj ponownie.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" data-testid="login-form">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-foreground">Zaloguj się</h2>
        <p className="mt-2 text-sm text-muted-foreground">Wpisz swoje dane, aby kontynuować</p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert" className="mb-4" data-testid="login-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form-element">
        <div className="space-y-4">
          {/* Email field */}
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched({ ...touched, email: true })}
              className="mt-1"
              aria-invalid={touched.email && !isValidEmail(email)}
              aria-describedby={touched.email && !isValidEmail(email) ? "email-error" : undefined}
              disabled={loading}
              data-testid="login-email-input"
            />
            {touched.email && !isValidEmail(email) && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                Podaj poprawny adres e-mail
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              className="mt-1"
              disabled={loading}
              data-testid="login-password-input"
            />
          </div>
        </div>

        {onSwitchToReset && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSwitchToReset}
              className="text-sm text-primary hover:underline"
              disabled={loading}
              data-testid="login-forgot-password"
            >
              Zapomniałeś hasła?
            </button>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
          {loading ? "Logowanie..." : "Zaloguj się"}
        </Button>

        {onSwitchToSignup && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-primary hover:underline font-medium"
              disabled={loading}
              data-testid="login-switch-to-signup"
            >
              Zarejestruj się
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
