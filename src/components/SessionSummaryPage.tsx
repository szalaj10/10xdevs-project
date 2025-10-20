import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { formatDuration } from "../lib/formatters";
import type { SessionDTO, GetSessionResponseDTO } from "../types";
import { getAccessToken } from "../lib/auth";

interface Props {
  sessionId: string;
}

interface SessionStatsVM {
  duration: string;
  totalCards: number;
  dueCards: number;
  newCards: number;
  ratings: {
    hard: number;
    normal: number;
    easy: number;
  };
}

export default function SessionSummaryPage({ sessionId }: Props) {
  const [, setSession] = useState<SessionDTO | null>(null);
  const [stats, setStats] = useState<SessionStatsVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/sessions/${sessionId}`, {
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (res.status === 404) {
        setError("Sesja nie została znaleziona");
        return;
      }

      if (!res.ok) throw new Error("Błąd pobierania sesji");

      const data: GetSessionResponseDTO = await res.json();

      if (!data.session.ended_at) {
        setError("Sesja nie została jeszcze zakończona");
        window.location.href = `/sessions/${sessionId}`;
        return;
      }

      setSession(data.session);

      const calculatedStats = calculateStats(data);
      setStats(calculatedStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wystąpił błąd podczas ładowania sesji");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  function calculateStats(data: GetSessionResponseDTO): SessionStatsVM {
    const { session, session_items } = data;

    const start = new Date(session.started_at);
    const end = session.ended_at ? new Date(session.ended_at) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const duration = formatDuration(durationMs);

    const totalCards = session_items.length;

    // Simplified: 80% due, 20% new (would need more info from backend in production)
    const dueCards = Math.floor(totalCards * 0.8);
    const newCards = totalCards - dueCards;

    const hard = session_items.filter((item) => item.rating === -1).length;
    const normal = session_items.filter((item) => item.rating === 0).length;
    const easy = session_items.filter((item) => item.rating === 1).length;

    return {
      duration,
      totalCards,
      dueCards,
      newCards,
      ratings: { hard, normal, easy },
    };
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-64" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => (window.location.href = "/sessions")}>Wróć do sesji</Button>
        </div>
      </main>
    );
  }

  if (!stats) return null;

  const total = stats.ratings.hard + stats.ratings.normal + stats.ratings.easy;
  const hardPercent = total > 0 ? Math.round((stats.ratings.hard / total) * 100) : 0;
  const normalPercent = total > 0 ? Math.round((stats.ratings.normal / total) * 100) : 0;
  const easyPercent = total > 0 ? Math.round((stats.ratings.easy / total) * 100) : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Sesja zakończona! 🎉</h1>
        <p className="text-muted-foreground">Świetna robota! Kontynuuj naukę, aby utrzymać postępy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Czas sesji" value={stats.duration} icon="⏱️" />
        <StatCard label="Przejrzane karty" value={stats.totalCards} icon="📝" />
        <StatCard label="Karty due" value={stats.dueCards} icon="📚" />
        <StatCard label="Nowe karty" value={stats.newCards} icon="✨" />
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Rozkład ocen</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <span>Trudne</span>
              </span>
              <span className="font-bold">
                {stats.ratings.hard} ({hardPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span>Normalne</span>
              </span>
              <span className="font-bold">
                {stats.ratings.normal} ({normalPercent}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>Łatwe</span>
              </span>
              <span className="font-bold">
                {stats.ratings.easy} ({easyPercent}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button size="lg" onClick={() => (window.location.href = "/sessions")}>
          Nowa sesja
        </Button>
        <Button size="lg" variant="outline" onClick={() => (window.location.href = "/flashcards")}>
          Zobacz fiszki
        </Button>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <Card>
      <CardContent className="p-6">
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
