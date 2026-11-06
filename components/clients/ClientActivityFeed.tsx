// components/clients/ClientActivityFeed.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";

import { ActivityEvent, ActivityKind, timeAgo } from "@/lib/customerStats";
import { TYPE_LABEL } from "@/lib/documents";
import { ROUTES } from "@/lib/routes";

const KIND_STYLE: Record<ActivityKind, { label: string; chip: string; dot: string }> = {
  created: { label: "Created", chip: "bg-status-draft-bg text-status-draft-fg", dot: "bg-outline" },
  paid: { label: "Paid", chip: "bg-status-paid-bg text-status-paid-fg", dot: "bg-status-paid-fg" },
  delivered: { label: "Delivered", chip: "bg-status-info-bg text-status-info-fg", dot: "bg-status-info-fg" },
};

const FILTERS: { key: ActivityKind | "all"; label: string }[] = [
  { key: "all", label: "All activity" },
  { key: "created", label: "Created" },
  { key: "paid", label: "Paid" },
  { key: "delivered", label: "Delivered" },
];

const PAGE = 8;

function sentence(kind: ActivityKind): string {
  if (kind === "paid") return "was marked as paid.";
  if (kind === "delivered") return "was marked as delivered.";
  return "was created.";
}

interface ClientActivityFeedProps {
  events: ActivityEvent[];
  isLoading: boolean;
}

export function ClientActivityFeed({ events, isLoading }: ClientActivityFeedProps) {
  
  const [filter, setFilter] = useState<ActivityKind | "all">("all");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => (filter === "all" ? events : events.filter((e) => e.kind === filter)), [events, filter]);
  const visible = filtered.slice(0, limit);

  const select = (
    <select
      aria-label="Filter activity"
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value as ActivityKind | "all");
        setLimit(PAGE);
      }}
      className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm font-medium text-on-surface focus:border-primary-container focus:outline-none"
    >
      {FILTERS.map((f) => (
        <option key={f.key} value={f.key}>
          {f.label}
        </option>
      ))}
    </select>
  );

  return (
    <SectionCard title="Activity feed" action={select}>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-surface-container-low" />
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-body-md text-on-surface-variant">
          {events.length === 0 ? "No activity yet. It appears here as you create and collect on invoices for this client." : "Nothing matches this filter."}
        </p>
      ) : (
        <>
          <ol className="ml-2 border-l-2 border-outline-variant">
            {visible.map((e) => {
              const style = KIND_STYLE[e.kind];
              return (
                <li key={e.id} className="relative flex items-start justify-between gap-4 pb-6 pl-6 last:pb-0">
                  <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${style.dot}`} />
                  <div className="min-w-0">
                    <p className="text-body-md text-on-surface">
                      {e.kind === "created" && `${TYPE_LABEL[e.documentType]} `}
                      <Link href={`${ROUTES.docs}/${e.documentId}`} className="font-bold text-primary hover:underline">
                        {e.documentNumber}
                      </Link>{" "}
                      {sentence(e.kind)}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{timeAgo(e.at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.chip}`}>
                    {style.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {filtered.length > limit && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="h-10 rounded-lg border border-primary-container bg-white px-4 text-sm font-semibold text-primary hover:bg-surface-container-low"
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}