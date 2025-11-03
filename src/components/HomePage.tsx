import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { formatDate } from "../lib/formatters";
import { useSupabase } from "../lib/hooks/useSupabase";
import type { UserStatsDTO } from "../types";

export default function HomePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Get user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          // Extract username from email (part before @)
          const username = user.email.split("@")[0];
          setUserName(username);
        }

        // Get stats - for now we'll use a simple count from flashcards
        // In production, this should call GET /api/users/stats
        const { data: flashcards, error: flashcardsError } = await supabase.from("flashcards").select("id, due_at");

        if (flashcardsError) throw flashcardsError;

        const totalFlashcards = flashcards?.length || 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueToday =
          flashcards?.filter((f) => {
            if (!f.due_at) return false;
            const dueDate = new Date(f.due_at);
            return dueDate <= today;
          }).length || 0;

        // For streak, we'd need sessions data - simplified to 0 for now
        const streak = 0;

        setStats({ totalFlashcards, dueToday, streak });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </main>
    );
  }

  const hasFlashcards = stats && stats.totalFlashcards > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="home-page">
      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" data-testid="home-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground" data-testid="home-welcome-heading">
          Witaj{userName ? `, ${userName}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">{formatDate(new Date())}</p>
      </div>

      {hasFlashcards ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ActionCard
              title="Generuj fiszki AI"
              description="Stwórz fiszki z tematu"
              icon="🤖"
              onClick={() => (window.location.href = "/generate/new")}
            />
            <ActionCard
              title="Przeglądaj fiszki"
              description="Zobacz wszystkie fiszki"
              icon="📚"
              onClick={() => (window.location.href = "/flashcards")}
            />
            <ActionCard
              title="Rozpocznij naukę"
              description="Sesja powtórek SRS"
              icon="🎯"
              badge={stats!.dueToday}
              onClick={() => (window.location.href = "/sessions")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Twoje fiszki" value={stats!.totalFlashcards} icon="📝" />
            <StatCard label="Do powtórki dziś" value={stats!.dueToday} icon="⏰" highlight={stats!.dueToday > 0} />
            <StatCard label="Streak" value={`${stats!.streak} dni`} icon="🔥" />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}

function ActionCard({
  title,
  description,
  icon,
  badge,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  badge?: number;
  onClick: () => void;
}) {
  const testId = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={onClick}
      data-testid={`home-action-${testId}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="text-4xl">{icon}</div>
          {badge !== undefined && badge > 0 && (
            <span className="bg-primary text-primary-foreground text-sm font-medium px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  const testId = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <Card className={highlight ? "border-primary" : ""} data-testid={`home-stat-${testId}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="home-empty-state">
      <div className="text-6xl mb-6">📖</div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Witaj w aplikacji fiszek!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Zacznij od wygenerowania pierwszych fiszek z pomocą AI lub dodaj je ręcznie.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => (window.location.href = "/generate/new")} data-testid="home-empty-generate-button">
          Wygeneruj fiszki AI
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/flashcards")}
          data-testid="home-empty-manual-button"
        >
          Dodaj ręcznie
        </Button>
      </div>
    </div>
  );
}
