import type { OOMHistory } from "../types";

interface Props {
  history: OOMHistory | null;
}

export default function OOMWarning({ history }: Props) {
  if (!history || history.total_count === 0) {
    return null;
  }

  const lastEvent = history.events[0];
  const timeAgo = lastEvent ? formatTimeAgo(new Date(lastEvent.occurred_at)) : "";

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800">
            Previous OOM Detected ({history.total_count} occurrence{history.total_count > 1 ? "s" : ""})
          </h4>
          <p className="mt-1 text-sm text-red-700">
            This model+instance combination has experienced OOM errors
            {timeAgo && ` (last: ${timeAgo})`}.
          </p>
          {lastEvent && (
            <div className="mt-2 text-xs text-red-600">
              <p>Last config: TP={lastEvent.tensor_parallel_degree}, Concurrency={lastEvent.concurrency}, Max Len={lastEvent.max_model_len}</p>
            </div>
          )}
          <p className="mt-2 text-sm text-red-700">
            <strong>Suggestions:</strong>
          </p>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
            <li>Reduce concurrency (try {Math.max(1, Math.floor((lastEvent?.concurrency || 16) / 2))})</li>
            <li>Increase runtime overhead slider</li>
            <li>Reduce max_model_len</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
