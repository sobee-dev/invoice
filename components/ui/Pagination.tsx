// components/ui/Pagination.tsx
import { btnOutline } from "@/components/ui/buttonStyles";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, pageCount, onPage }: PaginationProps) {
  if (pageCount <= 1) return null;

  // At most five numbers, kept around the current page.
  const visible = Math.min(5, pageCount);
  const start = Math.max(1, Math.min(page - 2, pageCount - visible + 1));
  const numbers = Array.from({ length: visible }, (_, i) => start + i);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={btnOutline}>
        Previous
      </button>

      <ul className="flex items-center gap-1">
        {numbers.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition-colors ${
                n === page ? "bg-primary-container text-white" : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pageCount} className={btnOutline}>
        Next
      </button>
    </nav>
  );
}