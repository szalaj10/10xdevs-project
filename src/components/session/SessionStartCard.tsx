import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionStatsDTO } from "@/types";

interface SessionStartCardProps {
  stats: SessionStatsDTO;
  loading: boolean;
  onStart: () => void;
}

export function SessionStartCard({ stats, loading, onStart }: SessionStartCardProps) {
  const hasCards = stats.dueCount > 0 || stats.newCount > 0;

  return (
    <Card data-testid="session-start-card">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Gotowy do nauki?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg">
            📚 Karty do powtórki: <strong>{stats.dueCount}</strong>
          </p>
          <p className="text-lg">
            ✨ Nowe karty: <strong>{stats.newCount}</strong>
          </p>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Dzisiaj przejrzysz maksymalnie 30 kart (80% due, 20% nowych, max 10 nowych).
        </p>
        <div className="flex justify-center">
          <Button size="lg" onClick={onStart} disabled={loading || !hasCards} data-testid="session-start-button">
            Rozpocznij naukę
          </Button>
        </div>
        {!hasCards && (
          <p className="text-center text-muted-foreground">
            Brak kart do nauki. Dodaj nowe fiszki lub poczekaj na kolejne powtórki.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
