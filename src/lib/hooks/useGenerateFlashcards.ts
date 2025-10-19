import { useState, useCallback } from "react";
import type { GetGenerationResponseDTO, CandidateCardDTO } from "@/types";
import { getAccessToken } from "@/lib/auth";

export interface FlashcardWithStatus extends CandidateCardDTO {
  localStatus: "pending" | "editing" | "rejected";
  editedFront?: string;
  editedBack?: string;
}

export function useGenerateFlashcards() {
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationData, setGenerationData] = useState<GetGenerationResponseDTO | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardWithStatus[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  const generate = useCallback(async (topicValue: string) => {
    setError(null);
    setLoading(true);
    setGenerationData(null);
    setFlashcards([]);

    try {
      const token = await getAccessToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({ topic: topicValue }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        throw new Error("Błąd komunikacji z serwerem. Spróbuj ponownie.");
      }

      if (res.status === 400) {
        const errorData = data as { error?: string; details?: { message: string }[] };
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((d) => d.message).join(", ");
          throw new Error(`Błąd walidacji: ${errorMessages}`);
        }
        throw new Error(errorData.error || "Nieprawidłowe dane wejściowe");
      }

      if (res.status === 500) {
        throw new Error("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
      }

      if (!res.ok) {
        const errorData = data as { error?: string };
        throw new Error(errorData.error || "Nieznany błąd podczas generowania");
      }

      const responseData = data as GetGenerationResponseDTO;
      setGenerationData(responseData);
      setFlashcards(
        responseData.candidate_cards.map((card) => ({
          ...card,
          localStatus: "pending" as const,
        }))
      );
    } catch (e) {
      if (e instanceof TypeError && e.message.includes("fetch")) {
        setError("Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe.");
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReject = useCallback((id: number) => {
    setFlashcards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, localStatus: "rejected" as const } : card))
    );
  }, []);

  const handleEdit = useCallback((id: number) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            localStatus: "editing" as const,
            editedFront: card.editedFront ?? card.front,
            editedBack: card.editedBack ?? card.back,
          };
        }
        return card;
      })
    );
  }, []);

  const handleCancelEdit = useCallback((id: number) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            localStatus: "pending" as const,
            editedFront: undefined,
            editedBack: undefined,
          };
        }
        return card;
      })
    );
  }, []);

  const handleSaveEdit = useCallback((id: number) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id && card.editedFront && card.editedBack) {
          return {
            ...card,
            front: card.editedFront,
            back: card.editedBack,
            localStatus: "pending" as const,
            editedFront: undefined,
            editedBack: undefined,
          };
        }
        return card;
      })
    );
  }, []);

  const handleUpdateField = useCallback((id: number, field: "front" | "back", value: string) => {
    setFlashcards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          return {
            ...card,
            [field === "front" ? "editedFront" : "editedBack"]: value,
          };
        }
        return card;
      })
    );
  }, []);

  const handleSaveAll = useCallback(async () => {
    const acceptedCards = flashcards.filter((card) => card.localStatus === "pending");

    if (acceptedCards.length === 0) {
      setError("Nie ma fiszek do zapisania. Zaakceptuj przynajmniej jedną fiszkę.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Update edited cards first
      for (const card of acceptedCards) {
        if (card.front !== card.front || card.back !== card.back) {
          const res = await fetch(`/api/generations/${card.generation_id}/candidates/${card.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              front: card.front,
              back: card.back,
            }),
          });

          if (!res.ok) {
            throw new Error("Nie udało się zaktualizować fiszki");
          }
        }
      }

      // Accept all pending cards and convert to flashcards
      const res = await fetch(`/api/generations/${generationData?.generation.id}/accept`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ids: acceptedCards.map((card) => card.id),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się zapisać fiszek");
      }

      // Success - redirect to flashcards list
      window.location.href = "/flashcards";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [flashcards, generationData]);

  const handleStartOver = useCallback(() => {
    setGenerationData(null);
    setFlashcards([]);
    setTopic("");
    setError(null);
  }, []);

  return {
    topic,
    setTopic,
    loading,
    error,
    setError,
    generationData,
    flashcards,
    saving,
    generate,
    handleReject,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleUpdateField,
    handleSaveAll,
    handleStartOver,
  };
}
