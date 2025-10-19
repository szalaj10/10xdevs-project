export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Generuję fiszki, proszę czekać...</p>
      </div>
    </div>
  );
}
