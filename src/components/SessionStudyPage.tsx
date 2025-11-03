import { useEffect, useMemo, useCallback } from "react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { useSessionStateMachine } from "../lib/hooks/useSessionStateMachine";
import { useKeyboardShortcuts } from "../lib/hooks/useKeyboardShortcuts";
import { SessionStartCard } from "./session/SessionStartCard";
import { FlashcardDisplay } from "./session/FlashcardDisplay";

interface Props {
  sessionId?: string;
}

export default function SessionStudyPage({ sessionId }: Props) {
  const {
    sessionState,
    flashcards,
    currentIndex,
    backRevealed,
    stats,
    loading,
    error,
    fetchStats,
    loadSession,
    startSession,
    revealBack,
    rateFlashcard,
  } = useSessionStateMachine(sessionId);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      fetchStats();
    }
  }, [sessionId, loadSession, fetchStats]);

  // Keyboard shortcuts for reveal
  const revealHandlers = useMemo(
    () => ({
      " ": revealBack,
    }),
    [revealBack]
  );

  // Keyboard shortcuts for rating
  const ratingHandlers = useMemo(
    () => ({
      "1": () => rateFlashcard(-1),
      "2": () => rateFlashcard(0),
      "3": () => rateFlashcard(1),
    }),
    [rateFlashcard]
  );

  useKeyboardShortcuts(sessionState === "active" && !backRevealed, revealHandlers);
  useKeyboardShortcuts(sessionState === "active" && backRevealed, ratingHandlers);

  const handleStartSession = useCallback(() => {
    startSession();
  }, [startSession]);

  if (loading && sessionState === "not_started") {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-64" />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="session-study-page">
      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" data-testid="session-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sessionState === "not_started" && stats && (
        <SessionStartCard stats={stats} loading={loading} onStart={handleStartSession} />
      )}

      {sessionState === "active" && flashcards.length > 0 && (
        <FlashcardDisplay
          flashcards={flashcards}
          currentIndex={currentIndex}
          backRevealed={backRevealed}
          loading={loading}
          onRevealBack={revealBack}
          onRate={rateFlashcard}
        />
      )}
    </main>
  );
}
