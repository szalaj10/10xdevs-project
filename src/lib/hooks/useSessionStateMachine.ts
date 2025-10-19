import { useState, useCallback } from "react";
import type { SessionDTO, FlashcardDTO, SessionStatsDTO, CreateSessionResponseDTO } from "@/types";
import { getAccessToken } from "@/lib/auth";

type SessionState = "not_started" | "active" | "completed";

export function useSessionStateMachine(sessionId?: string) {
  const [sessionState, setSessionState] = useState<SessionState>("not_started");
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [backRevealed, setBackRevealed] = useState(false);
  const [stats, setStats] = useState<SessionStatsDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/sessions/stats", {
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Błąd pobierania statystyk");

      const data: SessionStatsDTO = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;

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

      if (!res.ok) throw new Error("Błąd ładowania sesji");

      const data = await res.json();
      setSession(data.session);
      setFlashcards(data.flashcards);
      setSessionState(data.session.ended_at ? "completed" : "active");

      if (data.session.ended_at) {
        window.location.href = `/sessions/${sessionId}/summary`;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Błąd rozpoczęcia sesji");
      }

      const data: CreateSessionResponseDTO = await res.json();
      setSession(data.session);
      setFlashcards(data.flashcards);
      setSessionState("active");
      setCurrentIndex(0);
      setBackRevealed(false);

      window.history.pushState({}, "", `/sessions/${data.session.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const revealBack = useCallback(() => {
    setBackRevealed(true);
  }, []);

  const rateFlashcard = useCallback(
    async (rating: -1 | 0 | 1) => {
      if (!session) return;

      setLoading(true);
      setError(null);

      try {
        const currentFlashcard = flashcards[currentIndex];
        const token = await getAccessToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/sessions/${session.id}/items`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            flashcard_id: currentFlashcard.id,
            rating,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Błąd zapisu oceny");
        }

        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setBackRevealed(false);
        } else {
          await endSession();
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [session, currentIndex, flashcards]
  );

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ ended_at: new Date().toISOString() }),
      });

      if (!res.ok) throw new Error("Błąd zakończenia sesji");

      setSessionState("completed");
      window.location.href = `/sessions/${session.id}/summary`;
    } catch (e: any) {
      setError(e.message);
    }
  }, [session]);

  return {
    sessionState,
    session,
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
  };
}
