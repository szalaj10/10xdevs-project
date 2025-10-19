import { Button } from "@/components/ui/button";
import type { GenerationDTO } from "@/types";

interface BulkActionsBarProps {
  generation: GenerationDTO;
  pendingCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAccept: () => void;
  actionLoading: boolean;
}

export function BulkActionsBar({
  generation,
  pendingCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onBulkAccept,
  actionLoading,
}: BulkActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted rounded-lg">
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>Model: {generation.model}</span>
        <span>Wygenerowano: {generation.generated_count}</span>
        <span>Oczekujące: {pendingCount}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll} disabled={pendingCount === 0}>
          Zaznacz wszystkie
        </Button>
        <Button variant="outline" size="sm" onClick={onDeselectAll} disabled={selectedCount === 0}>
          Odznacz wszystkie
        </Button>
        <Button size="sm" onClick={onBulkAccept} disabled={selectedCount === 0 || actionLoading}>
          Akceptuj zaznaczone ({selectedCount})
        </Button>
      </div>
    </div>
  );
}
