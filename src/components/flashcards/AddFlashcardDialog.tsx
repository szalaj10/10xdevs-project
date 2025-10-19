import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreateFlashcardDTO } from "@/types";

interface AddFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CreateFlashcardDTO) => Promise<void>;
}

export function AddFlashcardDialog({ isOpen, onClose, onAdd }: AddFlashcardDialogProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd({ front, back, source: source || undefined });
      setFront("");
      setBack("");
      setSource("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>Wprowadź pytanie i odpowiedź</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="front">Pytanie (max 200 znaków)</Label>
              <textarea
                id="front"
                className="w-full p-2 border rounded-md mt-1"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                maxLength={200}
                required
                rows={2}
                placeholder="np. Jakie podstawowe funkcje pełni serce?"
              />
            </div>
            <div>
              <Label htmlFor="back">Odpowiedź (max 350 znaków)</Label>
              <textarea
                id="back"
                className="w-full p-2 border rounded-md mt-1"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                maxLength={350}
                required
                rows={3}
                placeholder="np. Serce jest głównym organem krwioobiegu..."
              />
            </div>
            <div>
              <Label htmlFor="source">Źródło (opcjonalne)</Label>
              <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              Dodaj
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
