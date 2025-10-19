import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardWithStatus } from "@/lib/hooks/useGenerateFlashcards";

interface FlashcardItemProps {
  card: FlashcardWithStatus;
  onReject: (id: number) => void;
  onEdit: (id: number) => void;
  onCancelEdit: (id: number) => void;
  onSaveEdit: (id: number) => void;
  onUpdateField: (id: number, field: "front" | "back", value: string) => void;
}

export const FlashcardItem = memo(
  function FlashcardItem({ card, onReject, onEdit, onCancelEdit, onSaveEdit, onUpdateField }: FlashcardItemProps) {
    const isRejected = card.localStatus === "rejected";
    const isEditing = card.localStatus === "editing";

    return (
      <div
        className={`rounded-lg border bg-card p-4 transition-all ${
          isRejected ? "opacity-50 border-destructive/50" : "border-border"
        }`}
        data-testid="generate-candidate-card"
      >
        <div className="space-y-3">
          {isEditing ? (
            <>
              {/* Editing Mode */}
              <div className="space-y-2">
                <label htmlFor={`front-${card.id}`} className="text-xs font-medium text-muted-foreground">
                  Pytanie
                </label>
                <Textarea
                  id={`front-${card.id}`}
                  value={card.editedFront ?? card.front}
                  onChange={(e) => onUpdateField(card.id, "front", e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Wpisz pytanie..."
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={`back-${card.id}`} className="text-xs font-medium text-muted-foreground">
                  Odpowiedź
                </label>
                <Textarea
                  id={`back-${card.id}`}
                  value={card.editedBack ?? card.back}
                  onChange={(e) => onUpdateField(card.id, "back", e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Wpisz odpowiedź..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onSaveEdit(card.id)}
                  size="sm"
                  disabled={!card.editedFront?.trim() || !card.editedBack?.trim()}
                >
                  Zapisz zmiany
                </Button>
                <Button onClick={() => onCancelEdit(card.id)} size="sm" variant="outline">
                  Anuluj
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Display Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Pytanie</p>
                  <p className="text-sm">{card.front}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Odpowiedź</p>
                  <p className="text-sm">{card.back}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {!isRejected ? (
                  <>
                    <Button
                      onClick={() => onEdit(card.id)}
                      size="sm"
                      variant="outline"
                      data-testid="generate-edit-candidate"
                    >
                      <svg
                        className="size-4 mr-1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edytuj
                    </Button>
                    <Button
                      onClick={() => onReject(card.id)}
                      size="sm"
                      variant="destructive"
                      data-testid="generate-reject-candidate"
                    >
                      <svg
                        className="size-4 mr-1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Odrzuć
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <svg
                      className="size-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Odrzucona
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.localStatus === nextProps.card.localStatus &&
    prevProps.card.front === nextProps.card.front &&
    prevProps.card.back === nextProps.card.back &&
    prevProps.card.editedFront === nextProps.card.editedFront &&
    prevProps.card.editedBack === nextProps.card.editedBack
);
