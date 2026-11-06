// components/dashboard/RevenueChart.tsx
import { SectionCard } from "@/components/ui/SectionCard";
import { fmtCompact } from "@/utils/money";

export interface RevenuePoint {
  label: string;
  value: number;
}

export function RevenueChart({ points, symbol }: { points: RevenuePoint[]; symbol: string }) {
  const data = points.slice(-6);
  const max = Math.max(0, ...data.map((p) => p.value));
  const lastIndex = data.length - 1;

  return (
    <SectionCard
      title="Business Insights"
      subtitle="Revenue growth over time"
      className="h-full"
      action={
        <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
          Last {data.length || 6} Months
        </span>
      }
    >
      {data.length === 0 || max <= 0 ? (
        <div className="flex h-64 items-center justify-center text-body-md text-on-surface-variant">
          No revenue recorded yet.
        </div>
      ) : (
        <div role="img" aria-label="Monthly revenue bar chart">
          <div className="mt-10 flex h-56 items-end gap-3">
            {data.map((p, i) => {
              const isLast = i === lastIndex;
              const height = Math.max((p.value / max) * 100, 3);
              // Older months fade toward the page, the newest is solid amber.
              const opacity = 0.3 + 0.6 * (i / Math.max(lastIndex - 1, 1));

              return (
                <div key={`${p.label}-${i}`} className="relative flex-1" style={{ height: `${height}%` }}>
                  {isLast && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-secondary px-2 py-1 text-[11px] font-semibold text-white">
                      {fmtCompact(p.value, symbol)}
                    </span>
                  )}
                  <div
                    className={`h-full w-full rounded-t-lg ${isLast ? "bg-secondary" : "bg-surface-tint"}`}
                    style={isLast ? undefined : { opacity }}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-3">
            {data.map((p, i) => (
              <span
                key={`${p.label}-label-${i}`}
                className={`flex-1 text-center text-[11px] font-semibold uppercase tracking-wide ${
                  i === lastIndex ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}