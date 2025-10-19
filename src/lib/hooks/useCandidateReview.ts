import { useReducer, useCallback, useEffect } from "react";
import type { GenerationDTO, CandidateCardDTO, GetGenerationResponseDTO } from "@/types";
import { getAccessToken } from "@/lib/auth";

interface CandidateState {
  generation: GenerationDTO | null;
  candidates: CandidateCardDTO[];
  selectedIds: number[];
  editingId: number | null;
  editedFront: string;
  editedBack: string;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

type CandidateAction =
  | { type: "SET_GENERATION"; payload: { generation: GenerationDTO; candidates: CandidateCardDTO[] } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SELECT_ALL" }
  | { type: "DESELECT_ALL" }
  | { type: "TOGGLE_SELECT"; payload: number }
  | { type: "START_EDIT"; payload: { id: number; front: string; back: string } }
  | { type: "CANCEL_EDIT" }
  | { type: "UPDATE_EDIT_FIELD"; payload: { field: "front" | "back"; value: string } }
  | { type: "ACCEPT_CANDIDATE"; payload: number }
  | { type: "ACCEPT_BULK"; payload: number[] }
  | { type: "REJECT_CANDIDATE"; payload: number }
  | { type: "UPDATE_CANDIDATE"; payload: CandidateCardDTO };

const initialState: CandidateState = {
  generation: null,
  candidates: [],
  selectedIds: [],
  editingId: null,
  editedFront: "",
  editedBack: "",
  loading: true,
  actionLoading: false,
  error: null,
};

function candidateReducer(state: CandidateState, action: CandidateAction): CandidateState {
  switch (action.type) {
    case "SET_GENERATION":
      return {
        ...state,
        generation: action.payload.generation,
        candidates: action.payload.candidates,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SELECT_ALL":
      return {
        ...state,
        selectedIds: state.candidates.filter((c) => c.status === "pending").map((c) => c.id),
      };
    case "DESELECT_ALL":
      return { ...state, selectedIds: [] };
    case "TOGGLE_SELECT":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.payload)
          ? state.selectedIds.filter((id) => id !== action.payload)
          : [...state.selectedIds, action.payload],
      };
    case "START_EDIT":
      return {
        ...state,
        editingId: action.payload.id,
        editedFront: action.payload.front,
        editedBack: action.payload.back,
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        editingId: null,
        editedFront: "",
        editedBack: "",
      };
    case "UPDATE_EDIT_FIELD":
      return {
        ...state,
        [action.payload.field === "front" ? "editedFront" : "editedBack"]: action.payload.value,
      };
    case "ACCEPT_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.map((c) => (c.id === action.payload ? { ...c, status: "accepted" as const } : c)),
      };
    case "ACCEPT_BULK":
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          action.payload.includes(c.id) ? { ...c, status: "accepted" as const } : c
        ),
        selectedIds: [],
      };
    case "REJECT_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.map((c) => (c.id === action.payload ? { ...c, status: "rejected" as const } : c)),
      };
    case "UPDATE_CANDIDATE":
      return {
        ...state,
        candidates: state.candidates.map((c) => (c.id === action.payload.id ? action.payload : c)),
        editingId: null,
        editedFront: "",
        editedBack: "",
      };
    default:
      return state;
  }
}

export function useCandidateReview(generationId: string) {
  const [state, dispatch] = useReducer(candidateReducer, initialState);

  const fetchGeneration = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/generations/${generationId}`, {
        headers,
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (res.status === 404) {
        dispatch({ type: "SET_ERROR", payload: "Generacja nie została znaleziona" });
        return;
      }

      if (!res.ok) throw new Error("Błąd pobierania generacji");

      const data: GetGenerationResponseDTO = await res.json();
      dispatch({
        type: "SET_GENERATION",
        payload: { generation: data.generation, candidates: data.candidate_cards },
      });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message });
    }
  }, [generationId]);

  useEffect(() => {
    fetchGeneration();
  }, [fetchGeneration]);

  const handleSelectAll = useCallback(() => {
    dispatch({ type: "SELECT_ALL" });
  }, []);

  const handleDeselectAll = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const handleToggleSelect = useCallback((id: number) => {
    dispatch({ type: "TOGGLE_SELECT", payload: id });
  }, []);

  const handleBulkAccept = useCallback(async () => {
    if (state.selectedIds.length === 0) return;

    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const token = await getAccessToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`/api/generations/${generationId}/candidates/accept-bulk`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ ids: state.selectedIds }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Błąd akceptacji");
      }

      dispatch({ type: "ACCEPT_BULK", payload: state.selectedIds });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message });
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  }, [generationId, state.selectedIds]);

  const handleAccept = useCallback(
    async (candidateId: number) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const token = await getAccessToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}/accept`, {
          method: "POST",
          headers,
          credentials: "include",
        });

        if (!res.ok) throw new Error("Błąd akceptacji");

        dispatch({ type: "ACCEPT_CANDIDATE", payload: candidateId });
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [generationId]
  );

  const handleReject = useCallback(
    async (candidateId: number) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const token = await getAccessToken();
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}/reject`, {
          method: "POST",
          headers,
          credentials: "include",
        });

        if (!res.ok) throw new Error("Błąd odrzucenia");

        dispatch({ type: "REJECT_CANDIDATE", payload: candidateId });
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [generationId]
  );

  const handleStartEdit = useCallback((candidate: CandidateCardDTO) => {
    dispatch({
      type: "START_EDIT",
      payload: { id: candidate.id, front: candidate.front, back: candidate.back },
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    dispatch({ type: "CANCEL_EDIT" });
  }, []);

  const handleUpdateEditField = useCallback((field: "front" | "back", value: string) => {
    dispatch({ type: "UPDATE_EDIT_FIELD", payload: { field, value } });
  }, []);

  const handleSaveEdit = useCallback(
    async (candidateId: number) => {
      dispatch({ type: "SET_ACTION_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const token = await getAccessToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/generations/${generationId}/candidates/${candidateId}`, {
          method: "PATCH",
          headers,
          credentials: "include",
          body: JSON.stringify({ front: state.editedFront, back: state.editedBack }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Błąd edycji");
        }

        const data = await res.json();
        dispatch({ type: "UPDATE_CANDIDATE", payload: data.candidate_card });
      } catch (e: any) {
        dispatch({ type: "SET_ERROR", payload: e.message });
      } finally {
        dispatch({ type: "SET_ACTION_LOADING", payload: false });
      }
    },
    [generationId, state.editedFront, state.editedBack]
  );

  return {
    state,
    handleSelectAll,
    handleDeselectAll,
    handleToggleSelect,
    handleBulkAccept,
    handleAccept,
    handleReject,
    handleStartEdit,
    handleCancelEdit,
    handleUpdateEditField,
    handleSaveEdit,
  };
}
