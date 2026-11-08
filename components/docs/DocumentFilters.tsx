// components/docs/DocumentFilters.tsx
"use client";

import { Icon } from "@/components/layout/Icon";
import { DocumentStatus, DocumentType, STATUS_FILTERS, TYPE_FILTERS } from "@/lib/documents";

interface DocumentFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  type: DocumentType | "all";
  onType: (value: DocumentType | "all") => void;
  status: DocumentStatus | "all";
  onStatus: (value: DocumentStatus | "all") => void;
  hasFilters: boolean;
  onClear: () => void;
  /** Which type chips to show. Defaults to all of them. */
  types?: { key: DocumentType | "all"; label: string }[];
}

export function DocumentFilters({
  search,
  onSearch,
  type,
  onType,
  status,
  onStatus,
  hasFilters,
  onClear,
  types = TYPE_FILTERS,
}: DocumentFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border border-outline-variant/50 bg-white p-5 shadow-card max-sm:space-y-3 max-sm:p-3">
      <div className="relative">
        <Icon
          name="search"
          size={20}
          mobileSize={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search document number, customer or supplier..."
          autoComplete="off"
          className="h-12 w-full max-sm:h-10 max-sm:text-sm rounded-3xl border border-outline-variant/20 bg-surface-container-low pl-11 pr-11 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Document type">
        {types.map((f) => {
          const active = type === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => onType(f.key)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors max-sm:px-3 max-sm:py-1.5 max-sm:text-xs ${
                active
                  ? "border-primary-container bg-primary-container font-bold text-white"
                  : "border-outline-variant/50 bg-white font-medium text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Document status">
        {STATUS_FILTERS.map((f) => {
          const active = status === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => onStatus(active ? "all" : f.key)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors max-sm:gap-1.5 max-sm:px-3 max-sm:py-1 max-sm:text-xs ${
                active
                  ? "border-primary-container bg-surface-container font-bold text-primary-container"
                  : "border-outline-variant/50 bg-white font-medium text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${f.dot}`} />
              {f.label}
            </button>
          );
        })}

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="ml-1 text-sm font-semibold text-primary-container hover:underline max-sm:text-xs"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}