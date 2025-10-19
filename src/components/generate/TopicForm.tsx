import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TopicFormProps {
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: (topic: string) => void;
  loading: boolean;
}

export function TopicForm({ topic, onTopicChange, onSubmit, loading }: TopicFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(topic);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (topic.trim().length >= 3 && !loading) {
        onSubmit(topic);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="topic"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Temat fiszek
        </label>
        <Textarea
          id="topic"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="np. Stolice europejskie, Wzory matematyczne, Słownictwo angielskie..."
          className="min-h-[120px] resize-none"
          disabled={loading}
          data-testid="generate-topic-input"
        />
        <p className="text-xs text-muted-foreground">
          {topic.length}/500 znaków • Naciśnij Enter aby wygenerować (Shift+Enter dla nowej linii)
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || topic.trim().length < 3}
        size="lg"
        data-testid="generate-submit-button"
      >
        {loading ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
}
