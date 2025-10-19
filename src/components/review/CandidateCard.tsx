import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { CandidateCardDTO } from "@/types";

interface CandidateCardProps {
  candidate: CandidateCardDTO;
  isSelected: boolean;
  isEditing: boolean;
  editedFront: string;
  editedBack: string;
  onToggleSelect: (id: number) => void;
  onEdit: (candidate: CandidateCardDTO) => void;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => void;
  onUpdateField: (field: "front" | "back", value: string) => void;
  actionLoading: boolean;
}

export const CandidateCard = memo(
  function CandidateCard({
    candidate,
    isSelected,
    isEditing,
    editedFront,
    editedBack,
    onToggleSelect,
    onEdit,
    onAccept,
    onReject,
    onCancelEdit,
    onSaveEdit,
    onUpdateField,
    actionLoading,
  }: CandidateCardProps) {
    return (
      <Card
        className={
          candidate.status === "accepted"
            ? "border-green-500"
            : candidate.status === "rejected"
              ? "border-red-500 opacity-50"
              : ""
        }
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            {candidate.status === "pending" && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(candidate.id)}
                aria-label={`Zaznacz kandydata ${candidate.id}`}
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg mb-4">
                {candidate.status === "accepted" && "✅ "}
                {candidate.status === "rejected" && "❌ "}
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-muted-foreground">Pytanie:</label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      value={editedFront}
                      onChange={(e) => onUpdateField("front", e.target.value)}
                      rows={2}
                      maxLength={200}
                    />
                  </div>
                ) : (
                  candidate.front
                )}
              </CardTitle>
              <CardContent className="px-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-sm font-normal text-muted-foreground">Odpowiedź:</label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      value={editedBack}
                      onChange={(e) => onUpdateField("back", e.target.value)}
                      rows={3}
                      maxLength={350}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">{candidate.back}</p>
                )}
              </CardContent>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={() => onSaveEdit(candidate.id)} disabled={actionLoading}>
                  Zapisz
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={actionLoading}>
                  Anuluj
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(candidate)}
                  disabled={candidate.status !== "pending" || actionLoading}
                >
                  Edytuj
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAccept(candidate.id)}
                  disabled={candidate.status !== "pending" || actionLoading}
                >
                  Akceptuj
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(candidate.id)}
                  disabled={candidate.status !== "pending" || actionLoading}
                >
                  Odrzuć
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) =>
    prevProps.candidate.id === nextProps.candidate.id &&
    prevProps.candidate.status === nextProps.candidate.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editedFront === nextProps.editedFront &&
    prevProps.editedBack === nextProps.editedBack &&
    prevProps.actionLoading === nextProps.actionLoading
);
