import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGenerateFlashcards } from "@/lib/hooks/useGenerateFlashcards";
import { TopicForm } from "./generate/TopicForm";
import { LoadingIndicator } from "./generate/LoadingIndicator";
import { ErrorMessage } from "./generate/ErrorMessage";
import { FlashcardsReview } from "./generate/FlashcardsReview";
import { ManualFlashcardCreation } from "./generate/ManualFlashcardCreation";

export default function GeneratePage() {
  const {
    topic,
    setTopic,
    loading,
    error,
    generationData,
    flashcards,
    saving,
    generate,
    handleReject,
    handleEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleUpdateField,
    handleSaveAll,
    handleStartOver,
  } = useGenerateFlashcards();

  const handleSubmit = useCallback(
    (topicValue: string) => {
      // Local validation
      const trimmedTopic = topicValue.trim();

      if (trimmedTopic.length < 3) {
        return;
      }

      if (trimmedTopic.length > 500) {
        return;
      }

      generate(trimmedTopic);
    },
    [generate]
  );

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8 md:py-12 max-w-4xl" data-testid="generate-page">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight" data-testid="generate-heading">
            Generuj fiszki AI
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Wpisz temat, a AI wygeneruje dla Ciebie zestaw fiszek edukacyjnych.
          </p>
        </div>

        {/* Tabs for different generation methods */}
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">Generuj AI</TabsTrigger>
            <TabsTrigger value="manual">Dodaj ręcznie</TabsTrigger>
          </TabsList>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-6 mt-6">
            {/* Show form only if no generation data */}
            {!generationData && (
              <>
                {/* Topic Form */}
                <TopicForm topic={topic} onTopicChange={setTopic} onSubmit={handleSubmit} loading={loading} />

                {/* Loading Indicator */}
                {loading && <LoadingIndicator />}

                {/* Error Message */}
                {error && <ErrorMessage error={error} />}
              </>
            )}

            {/* Show generated flashcards */}
            {generationData && flashcards.length > 0 && (
              <>
                <FlashcardsReview
                  flashcards={flashcards}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onUpdateField={handleUpdateField}
                />

                {/* Error Message */}
                {error && <ErrorMessage error={error} />}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveAll}
                    disabled={saving}
                    size="lg"
                    className="flex-1"
                    data-testid="generate-save-all-button"
                  >
                    {saving ? "Zapisywanie..." : "Zapisz zaakceptowane fiszki"}
                  </Button>
                  <Button
                    onClick={handleStartOver}
                    variant="outline"
                    size="lg"
                    disabled={saving}
                    data-testid="generate-start-over-button"
                  >
                    Generuj nowe
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Zaakceptowane: {flashcards.filter((c) => c.localStatus === "pending").length} /{" "}
                  {flashcards.filter((c) => c.localStatus !== "rejected").length}
                </p>
              </>
            )}
          </TabsContent>

          {/* Manual Creation Tab */}
          <TabsContent value="manual" className="space-y-6 mt-6">
            <ManualFlashcardCreation />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
