import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FlashcardDTO, EditFlashcardDTO } from "@/types";

interface EditFlashcardDialogProps {
  flashcard: FlashcardDTO;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number, data: EditFlashcardDTO) => Promise<void>;
}

export function EditFlashcardDialog({ flashcard, isOpen, onClose, onEdit }: EditFlashcardDialogProps) {
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [source, setSource] = useState(flashcard.source || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onEdit(flashcard.id, { front, back, source: source || undefined });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-front">Pytanie</Label>
              <textarea
                id="edit-front"
                className="w-full p-2 border rounded-md mt-1"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                maxLength={200}
                required
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-back">Odpowiedź</Label>
              <textarea
                id="edit-back"
                className="w-full p-2 border rounded-md mt-1"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                maxLength={350}
                required
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-source">Źródło</Label>
              <Input id="edit-source" value={source} onChange={(e) => setSource(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              Zapisz
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
