import { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import type { FlashcardDTO } from "../types";
import { useAuthGuard } from "../lib/hooks/useAuthGuard";
import { useFlashcardsCRUD } from "../lib/hooks/useFlashcardsCRUD";

// Lazy load dialogs for better performance
const AddFlashcardDialog = lazy(() =>
  import("./flashcards/AddFlashcardDialog").then((m) => ({ default: m.AddFlashcardDialog }))
);
const EditFlashcardDialog = lazy(() =>
  import("./flashcards/EditFlashcardDialog").then((m) => ({ default: m.EditFlashcardDialog }))
);
const DeleteFlashcardDialog = lazy(() =>
  import("./flashcards/DeleteFlashcardDialog").then((m) => ({ default: m.DeleteFlashcardDialog }))
);

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function FlashcardsListPage() {
  const { isLoading: authLoading } = useAuthGuard();
  const { flashcards, loading, error, warnings, fetchFlashcards, addFlashcard, editFlashcard, deleteFlashcard } =
    useFlashcardsCRUD();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"created_at" | "due">("created_at");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDTO | null>(null);
  const [deletingFlashcardId, setDeletingFlashcardId] = useState<number | null>(null);

  useEffect(() => {
    fetchFlashcards(search, sort, page).then(({ totalPages: pages }) => {
      setTotalPages(pages);
    });
  }, [search, sort, page, fetchFlashcards]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
      }, 300),
    []
  );

  const handleSortChange = (newSort: "created_at" | "due") => {
    setSort(newSort);
    setPage(1);
  };

  const handleAdd = async (data: any) => {
    await addFlashcard(data);
    await fetchFlashcards(search, sort, page);
  };

  const handleEdit = async (id: number, data: any) => {
    await editFlashcard(id, data);
  };

  const handleDelete = async () => {
    if (!deletingFlashcardId) return;
    await deleteFlashcard(deletingFlashcardId);
    setDeletingFlashcardId(null);
  };

  if (authLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-96" />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="flashcards-page">
      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" data-testid="flashcards-error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="mb-6">
          <AlertDescription>
            {warnings.map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-6" data-testid="flashcards-heading">
          Moje fiszki
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            type="search"
            placeholder="Szukaj po pytaniu..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="sm:max-w-xs"
            data-testid="flashcards-search-input"
          />
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Data utworzenia</SelectItem>
              <SelectItem value="due">Termin powtórki</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddDialogOpen(true)}>Dodaj fiszkę</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : flashcards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Brak fiszek. Dodaj pierwszą fiszkę!</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>Dodaj fiszkę</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {flashcards.map((flashcard) => (
              <Card key={flashcard.id} data-testid="flashcard-item">
                <CardHeader>
                  <CardTitle>{flashcard.front}</CardTitle>
                  <CardDescription>{flashcard.back}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {flashcard.source && <span>Źródło: {flashcard.source}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingFlashcard(flashcard);
                          setIsEditDialogOpen(true);
                        }}
                        data-testid="flashcard-edit-button"
                      >
                        Edytuj
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setDeletingFlashcardId(flashcard.id);
                          setIsDeleteDialogOpen(true);
                        }}
                        data-testid="flashcard-delete-button"
                      >
                        Usuń
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Poprzednia
              </Button>
              <span className="py-2 px-4">
                Strona {page} z {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Następna
              </Button>
            </div>
          )}
        </>
      )}

      <Suspense fallback={<div>Ładowanie...</div>}>
        {isAddDialogOpen && (
          <AddFlashcardDialog isOpen={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onAdd={handleAdd} />
        )}

        {editingFlashcard && isEditDialogOpen && (
          <EditFlashcardDialog
            flashcard={editingFlashcard}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingFlashcard(null);
            }}
            onEdit={handleEdit}
          />
        )}

        {isDeleteDialogOpen && (
          <DeleteFlashcardDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setDeletingFlashcardId(null);
            }}
            onConfirm={handleDelete}
          />
        )}
      </Suspense>
    </main>
  );
}
