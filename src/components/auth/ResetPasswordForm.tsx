import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { useAuthValidation } from "@/lib/hooks/useAuthValidation";

interface ResetPasswordFormProps {
  onSwitchToLogin?: () => void;
}

export function ResetPasswordForm({ onSwitchToLogin }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false });
  const { supabase } = useSupabase();
  const { validateEmail } = useAuthValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (!validateEmail(email)) {
      setError("Podaj poprawny adres e-mail");
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (authError) throw authError;

      setSuccessMessage("Link do resetowania hasła został wysłany na Twój e-mail.");
    } catch (e: any) {
      setError("Błąd wysyłania linku. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-foreground">Resetuj hasło</h2>
        <p className="mt-2 text-sm text-muted-foreground">Wyślemy Ci link do resetowania hasła</p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert role="status" className="mb-4">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            aria-invalid={touched.email && !validateEmail(email)}
            disabled={loading}
          />
          {touched.email && !validateEmail(email) && (
            <p className="text-sm text-destructive mt-1">Podaj poprawny adres e-mail</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>

        {onSwitchToLogin && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">
              Wróć do logowania
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
