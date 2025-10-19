import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "./ErrorMessage";
import { getAccessToken } from "@/lib/auth";

export function ManualFlashcardCreation() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (front.trim().length < 1) {
      setError("Pytanie nie może być puste");
      return;
    }

    if (back.trim().length < 1) {
      setError("Odpowiedź nie może być pusta");
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers,
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się utworzyć fiszki");
      }

      // Success
      setSuccess(true);
      setFront("");
      setBack("");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold">Utwórz fiszkę ręcznie</h2>
        <p className="text-sm text-muted-foreground">
          Wprowadź pytanie i odpowiedź, aby utworzyć własną fiszkę edukacyjną.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="manual-front" className="text-sm font-medium leading-none">
            Pytanie
          </label>
          <Textarea
            id="manual-front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="np. Jaka jest stolica Polski?"
            className="min-h-[100px] resize-none"
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="manual-back" className="text-sm font-medium leading-none">
            Odpowiedź
          </label>
          <Textarea
            id="manual-back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="np. Warszawa"
            className="min-h-[100px] resize-none"
            disabled={saving}
          />
        </div>

        {error && <ErrorMessage error={error} />}

        {success && (
          <div className="rounded-lg border border-green-500 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="size-5 text-green-500 shrink-0 mt-0.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-500">Sukces!</h3>
                <p className="mt-1 text-sm text-green-500/90">Fiszka została utworzona pomyślnie.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !front.trim() || !back.trim()} size="lg" className="flex-1">
            {saving ? "Zapisywanie..." : "Utwórz fiszkę"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setFront("");
              setBack("");
              setError(null);
              setSuccess(false);
            }}
            disabled={saving}
          >
            Wyczyść
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="size-5 text-muted-foreground shrink-0 mt-0.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Wskazówka</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Możesz również generować fiszki automatycznie za pomocą AI w zakładce &ldquo;Generuj AI&rdquo;. Po
              utworzeniu fiszki, znajdziesz ją na liście wszystkich fiszek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
