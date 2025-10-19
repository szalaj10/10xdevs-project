interface ErrorMessageProps {
  error: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-destructive bg-destructive/10 p-4"
      data-testid="generate-error"
    >
      <div className="flex items-start gap-3">
        <svg
          className="size-5 text-destructive shrink-0 mt-0.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive">Wystąpił błąd</h3>
          <p className="mt-1 text-sm text-destructive/90">{error}</p>
        </div>
      </div>
    </div>
  );
}
