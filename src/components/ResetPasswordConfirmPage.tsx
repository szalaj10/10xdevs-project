import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { useSupabase } from "../lib/hooks/useSupabase";

export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [touched, setTouched] = useState({ newPassword: false, confirmNewPassword: false });
  const { supabase } = useSupabase();

  useEffect(() => {
    // Check if we have a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasRecoverySession(true);
      } else {
        setError("Link wygasł lub jest nieprawidłowy. Wyślij nowy link resetu.");
      }
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (e: any) {
      if (e.message.includes("Auth session missing")) {
        setError("Link wygasł lub jest nieprawidłowy. Wyślij nowy link resetu.");
      } else {
        setError("Błąd aktualizacji hasła. Spróbuj ponownie.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasRecoverySession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Resetowanie hasła
            </h2>
          </div>

          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="text-center">
            <Button asChild variant="default">
              <a href="/login">Wróć do logowania</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Hasło zaktualizowane
            </h2>
          </div>

          <Alert role="status">
            <AlertDescription>
              Hasło zostało pomyślnie zaktualizowane. Za chwilę zostaniesz przekierowany do strony logowania...
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Button asChild variant="default">
              <a href="/login">Przejdź do logowania</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Ustaw nowe hasło
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Wprowadź nowe hasło dla swojego konta
          </p>
        </div>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nowe hasło (min. 8 znaków)</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, newPassword: true })}
                className="mt-1"
                aria-invalid={touched.newPassword && newPassword.length > 0 && newPassword.length < 8}
              />
              {touched.newPassword && newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-sm text-destructive mt-1">Hasło musi mieć co najmniej 8 znaków</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Potwierdź nowe hasło</Label>
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirmNewPassword: true })}
                className="mt-1"
                aria-invalid={
                  touched.confirmNewPassword &&
                  confirmNewPassword.length > 0 &&
                  newPassword !== confirmNewPassword
                }
              />
              {touched.confirmNewPassword &&
                confirmNewPassword.length > 0 &&
                newPassword !== confirmNewPassword && (
                  <p className="text-sm text-destructive mt-1">Hasła nie są identyczne</p>
                )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aktualizacja..." : "Zaktualizuj hasło"}
          </Button>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Wróć do logowania
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
