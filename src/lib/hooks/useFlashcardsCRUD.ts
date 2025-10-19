import { useState, useCallback } from "react";
import type { FlashcardDTO, CreateFlashcardDTO, EditFlashcardDTO } from "@/types";
import { getAccessToken } from "@/lib/auth";

export function useFlashcardsCRUD() {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fetchFlashcards = useCallback(async (search: string, sort: "created_at" | "due", page: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", "20");

      const token = await getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/flashcards?${params.toString()}`, {
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return { flashcards: [], totalPages: 1 };
      }

      if (!res.ok) throw new Error("Błąd pobierania fiszek");

      const data = await res.json();
      setFlashcards(data.flashcards || []);
      return { flashcards: data.flashcards || [], totalPages: data.pagination?.totalPages || 1 };
    } catch (e: any) {
      setError(e.message);
      return { flashcards: [], totalPages: 1 };
    } finally {
      setLoading(false);
    }
  }, []);

  const addFlashcard = useCallback(async (data: CreateFlashcardDTO) => {
    setError(null);
    setWarnings([]);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Błąd dodawania fiszki");
      }

      const result = await res.json();
      if (result.warnings) setWarnings(result.warnings);

      return result;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const editFlashcard = useCallback(async (id: number, data: EditFlashcardDTO) => {
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Błąd edycji fiszki");
      }

      const result = await res.json();
      setFlashcards((prev) => prev.map((f) => (f.id === id ? result.flashcard : f)));
      return result.flashcard;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const deleteFlashcard = useCallback(async (id: number) => {
    setError(null);

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/flashcards/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Błąd usuwania fiszki");

      setFlashcards((prev) => prev.filter((f) => f.id !== id));
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  return {
    flashcards,
    loading,
    error,
    warnings,
    fetchFlashcards,
    addFlashcard,
    editFlashcard,
    deleteFlashcard,
  };
}
