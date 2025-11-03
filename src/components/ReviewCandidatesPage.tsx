import { useMemo } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { useCandidateReview } from "../lib/hooks/useCandidateReview";
import { CandidateCard } from "./review/CandidateCard";
import { BulkActionsBar } from "./review/BulkActionsBar";

interface Props {
  generationId: string;
}

export default function ReviewCandidatesPage({ generationId }: Props) {
  const {
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
  } = useCandidateReview(generationId);

  const pendingCount = useMemo(() => state.candidates.filter((c) => c.status === "pending").length, [state.candidates]);

  if (state.loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {state.error && (
        <Alert variant="destructive" className="mb-6" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Recenzja kandydatów</h1>

        {state.generation && (
          <BulkActionsBar
            generation={state.generation}
            pendingCount={pendingCount}
            selectedCount={state.selectedIds.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkAccept={handleBulkAccept}
            actionLoading={state.actionLoading}
          />
        )}
      </div>

      <div className="space-y-4">
        {state.candidates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Brak kandydatów do recenzji</div>
        ) : (
          state.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={state.selectedIds.includes(candidate.id)}
              isEditing={state.editingId === candidate.id}
              editedFront={state.editedFront}
              editedBack={state.editedBack}
              onToggleSelect={handleToggleSelect}
              onEdit={handleStartEdit}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancelEdit={handleCancelEdit}
              onSaveEdit={handleSaveEdit}
              onUpdateField={handleUpdateEditField}
              actionLoading={state.actionLoading}
            />
          ))
        )}
      </div>

      {state.candidates.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button onClick={() => (window.location.href = "/flashcards")}>Zakończ recenzję</Button>
        </div>
      )}
    </main>
  );
}
