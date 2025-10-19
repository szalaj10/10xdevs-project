import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useSupabase } from "../lib/hooks/useSupabase";

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Hasło musi mieć co najmniej 8 znaków");
  }

  if (password.length > 72) {
    errors.push("Hasło może mieć maksymalnie 72 znaki");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!isValidEmail(email)) {
      setError("Podaj poprawny adres e-mail");
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }

    try {
      // Signup directly using Supabase client (browser)
      // This automatically sets cookies for SSR
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);

        // Handle specific Supabase errors
        if (signUpError.message.includes("User already registered")) {
          setError("Użytkownik o tym adresie e-mail już istnieje. Zaloguj się.");
        } else if (signUpError.message.includes("Password should be at least")) {
          setError("Hasło jest zbyt słabe");
        } else {
          setError(signUpError.message || "Błąd podczas rejestracji. Spróbuj ponownie.");
        }
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      const requiresEmailConfirmation = data.user && !data.session;

      // Handle successful signup
      if (requiresEmailConfirmation) {
        setSuccessMessage(
          "Konto utworzone! Sprawdź swoją skrzynkę e-mail i kliknij link weryfikacyjny, aby aktywować konto. Link jest ważny przez 24 godziny."
        );
        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setTouched({ email: false, password: false, confirmPassword: false });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Auto-login after signup (if email confirmation is disabled)
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Błąd połączenia z serwerem. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);
  const showPasswordError = touched.password && password.length > 0 && !passwordValidation.isValid;
  const showConfirmPasswordError =
    touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="w-full max-w-md mx-auto" data-testid="signup-form">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-foreground">Utwórz konto</h2>
        <p className="mt-2 text-sm text-muted-foreground">Zarejestruj się, aby rozpocząć naukę z Fiszki AI</p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert" className="mb-4" data-testid="signup-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert
          role="status"
          className="mb-4 border-green-500 bg-green-50 dark:bg-green-950"
          data-testid="signup-success"
        >
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="signup-form-element">
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
              disabled={loading || !!successMessage}
              data-testid="signup-email-input"
            />
            {touched.email && !isValidEmail(email) && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                Podaj poprawny adres e-mail
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <Label htmlFor="password">Hasło (min. 8 znaków)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              className="mt-1"
              aria-invalid={showPasswordError}
              aria-describedby={showPasswordError ? "password-error" : undefined}
              disabled={loading || !!successMessage}
              data-testid="signup-password-input"
            />
            {showPasswordError && (
              <p id="password-error" className="text-sm text-destructive mt-1">
                {passwordValidation.errors[0]}
              </p>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              className="mt-1"
              aria-invalid={showConfirmPasswordError}
              aria-describedby={showConfirmPasswordError ? "confirm-password-error" : undefined}
              disabled={loading || !!successMessage}
              data-testid="signup-confirm-password-input"
            />
            {showConfirmPasswordError && (
              <p id="confirm-password-error" className="text-sm text-destructive mt-1">
                Hasła nie są identyczne
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !!successMessage}
          data-testid="signup-submit-button"
        >
          {loading ? "Rejestracja..." : "Zarejestruj się"}
        </Button>

        {onSwitchToLogin && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
              disabled={loading}
              data-testid="signup-switch-to-login"
            >
              Zaloguj się
            </button>
          </p>
        )}
      </form>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Ważne:</strong> Po rejestracji otrzymasz e-mail z linkiem weryfikacyjnym. Kliknij w link, aby
          aktywować swoje konto i móc się zalogować.
        </p>
      </div>
    </div>
  );
}
