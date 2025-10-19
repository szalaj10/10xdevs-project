import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { useSupabase } from "../lib/hooks/useSupabase";

export default function EmailVerificationResultPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const { supabase } = useSupabase();

  useEffect(() => {
    // Check URL parameters for verification result
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || "Weryfikacja nie powiodła się. Link mógł wygasnąć lub być nieprawidłowy.");
    } else if (type === "signup") {
      // Check if user is now authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStatus("success");
          setMessage("Twój e-mail został pomyślnie zweryfikowany! Możesz się teraz zalogować.");
        } else {
          setStatus("error");
          setMessage("Weryfikacja nie powiodła się. Spróbuj ponownie.");
        }
      });
    } else {
      // Default success message
      setStatus("success");
      setMessage("Twój e-mail został pomyślnie zweryfikowany! Możesz się teraz zalogować.");
    }
  }, [supabase]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">Weryfikacja e-mail</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Trwa weryfikacja Twojego adresu e-mail...</p>
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
            {status === "success" ? "Weryfikacja zakończona" : "Błąd weryfikacji"}
          </h2>
        </div>

        <Alert variant={status === "success" ? "default" : "destructive"} role="status">
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        <div className="text-center space-y-4">
          <Button asChild variant="default" className="w-full">
            <a href="/login">Przejdź do logowania</a>
          </Button>

          {status === "error" && (
            <p className="text-sm text-muted-foreground">
              Jeśli problem będzie się powtarzał,{" "}
              <a href="/login" className="text-primary hover:underline">
                spróbuj zarejestrować się ponownie
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
