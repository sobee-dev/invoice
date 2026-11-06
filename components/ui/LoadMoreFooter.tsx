// components/ui/LoadMoreFooter.tsx
"use client";

interface LoadMoreFooterProps {
  shown: number;
  total: number | null;
  noun: string; // "clients", "products"
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
}

// Sits at the bottom of a list card. Nothing more is fetched until the person
// presses the button.
export function LoadMoreFooter({ shown, total, noun, hasMore, isLoadingMore, loadMoreError, onLoadMore }: LoadMoreFooterProps) {
  if (shown === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-6 py-4">
      <p className="text-body-md text-on-surface-variant">
        Showing {shown} of {total ?? shown} {noun}.
      </p>

      <div className="flex items-center gap-3">
        {loadMoreError && <p className="text-body-md text-error">Could not load more {noun}.</p>}
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="h-10 rounded-lg border border-primary-container bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            {isLoadingMore ? "Loading..." : loadMoreError ? "Try again" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}