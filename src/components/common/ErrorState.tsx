interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-surface-card p-8 text-center">
      <p className="text-accent">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-accent px-6 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
