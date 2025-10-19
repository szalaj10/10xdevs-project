import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardWithStatus } from "@/lib/hooks/useGenerateFlashcards";

interface FlashcardsReviewProps {
  flashcards: FlashcardWithStatus[];
  onReject: (id: number) => void;
  onEdit: (id: number) => void;
  onCancelEdit: (id: number) => void;
  onSaveEdit: (id: number) => void;
  onUpdateField: (id: number, field: "front" | "back", value: string) => void;
}

export function FlashcardsReview({
  flashcards,
  onReject,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateField,
}: FlashcardsReviewProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold">Wygenerowane fiszki</h2>
        <p className="text-sm text-muted-foreground">
          Przejrzyj fiszki, edytuj je lub odrzuć. Następnie zapisz zaakceptowane fiszki.
        </p>
      </div>

      <div className="space-y-3">
        {flashcards.map((card) => (
          <FlashcardItem
            key={card.id}
            card={card}
            onReject={onReject}
            onEdit={onEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onUpdateField={onUpdateField}
          />
        ))}
      </div>
    </div>
  );
}
