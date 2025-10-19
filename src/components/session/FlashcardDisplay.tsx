import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { FlashcardDTO } from "@/types";

interface FlashcardDisplayProps {
  flashcards: FlashcardDTO[];
  currentIndex: number;
  backRevealed: boolean;
  loading: boolean;
  onRevealBack: () => void;
  onRate: (rating: -1 | 0 | 1) => void;
}

export function FlashcardDisplay({
  flashcards,
  currentIndex,
  backRevealed,
  loading,
  onRevealBack,
  onRate,
}: FlashcardDisplayProps) {
  const progress = useMemo(() => (currentIndex / flashcards.length) * 100, [currentIndex, flashcards.length]);

  const currentFlashcard = useMemo(() => flashcards[currentIndex], [flashcards, currentIndex]);

  return (
    <div className="space-y-6" data-testid="session-active">
      <div className="space-y-2">
        <Progress value={progress} data-testid="session-progress" />
        <p className="text-center text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </p>
      </div>

      <Card className="min-h-[300px] flex flex-col justify-center" data-testid="session-flashcard-card">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{currentFlashcard.front}</h2>
          </div>

          {backRevealed ? (
            <div className="text-center border-t pt-6" data-testid="session-flashcard-back">
              <p className="text-lg text-muted-foreground">{currentFlashcard.back}</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button size="lg" onClick={onRevealBack} disabled={loading} data-testid="session-reveal-button">
                Pokaż odpowiedź <span className="ml-2 text-xs">(Spacja)</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {backRevealed && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="session-rating-buttons">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => onRate(-1)}
            disabled={loading}
            className="flex flex-col h-auto py-4"
            data-testid="session-rate-hard"
          >
            <span className="text-lg font-bold">Trudne</span>
            <span className="text-xs mt-1">Ponownie dziś (1)</span>
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => onRate(0)}
            disabled={loading}
            className="flex flex-col h-auto py-4"
            data-testid="session-rate-normal"
          >
            <span className="text-lg font-bold">Normalne</span>
            <span className="text-xs mt-1">Za 2 dni (2)</span>
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => onRate(1)}
            disabled={loading}
            className="flex flex-col h-auto py-4 bg-green-600 hover:bg-green-700"
            data-testid="session-rate-easy"
          >
            <span className="text-lg font-bold">Łatwe</span>
            <span className="text-xs mt-1">Za 4 dni (3)</span>
          </Button>
        </div>
      )}
    </div>
  );
}
