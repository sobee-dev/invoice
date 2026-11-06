// components/clients/RevenueTimeline.tsx
"use client";

import { useId, useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { paidMonthlyTotals } from "@/lib/customerStats";
import type { Document } from "@/services/documents";
import { fmtMoney } from "@/utils/money";

const W = 640;
const H = 240;
const PAD_X = 16;
const PAD_TOP = 24;
const PAD_BOTTOM = 12;

interface Pt {
  x: number;
  y: number;
}

// A smooth line through the points. Control points are clamped so a sharp drop never dips below the baseline.
function smoothPath(pts: Pt[], minY: number, maxY: number): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const clamp = (v: number) => Math.min(maxY, Math.max(minY, v));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

interface RevenueTimelineProps {
  docs: Document[];
  symbol: string;
  currencyCode: string;
  partial: boolean;
  isLoading: boolean;
}

export function RevenueTimeline({ docs, symbol, currencyCode, partial, isLoading }: RevenueTimelineProps) {
  const [months, setMonths] = useState<6 | 12>(12);
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  const { points, excluded } = useMemo(() => paidMonthlyTotals(docs, currencyCode, months), [docs, currencyCode, months]);

  const max = Math.max(0, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const hasData = max > 0;

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const baseline = H - PAD_BOTTOM;
  const coords: Pt[] = points.map((p, i) => ({
    x: PAD_X + (i / (points.length - 1)) * innerW,
    y: PAD_TOP + (1 - (hasData ? p.value / max : 0)) * innerH,
  }));

  const line = smoothPath(coords, PAD_TOP, baseline);
  const area = coords.length > 0 ? `${line} L ${coords[coords.length - 1].x} ${baseline} L ${coords[0].x} ${baseline} Z` : "";

  // With a full year, label every second month and always include the current one.
  const showLabel = (i: number) => months === 6 || i % 2 === (points.length - 1) % 2;

  const toggle = (
    <div className="flex rounded-full bg-surface-container p-1" role="group" aria-label="Time range">
      {([6, 12] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={months === m}
          onClick={() => {
            setMonths(m);
            setActive(null);
          }}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            months === m ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {m === 6 ? "6M" : "1Y"}
        </button>
      ))}
    </div>
  );

  return (
    <SectionCard
      title="Revenue timeline"
      subtitle={hasData ? `${fmtMoney(total, symbol, 2)} in paid sales invoices over ${months} months` : "Paid sales invoices by month"}
      action={toggle}
    >
      {isLoading ? (
        <div className="h-60 animate-pulse rounded-lg bg-surface-container-low" />
      ) : !hasData ? (
        <div className="flex h-60 items-center justify-center text-center text-body-md text-on-surface-variant">
          No paid invoices in this period yet.
        </div>
      ) : (
        <div>
          <div className="relative text-primary-container">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Paid sales invoices by month, ${fmtMoney(total, symbol, 2)} in total`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1={PAD_X} x2={W - PAD_X} y1={baseline} y2={baseline} stroke="#c5c6d0" strokeWidth="1" />
              <path d={area} fill={`url(#${gradientId})`} />
              <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {coords.map((c, i) => (
                <g key={points[i].key}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="14"
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${points[i].label}: ${fmtMoney(points[i].value, symbol, 2)}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                  />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={active === i ? 5.5 : 3.5}
                    fill="#ffffff"
                    stroke="currentColor"
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                </g>
              ))}
            </svg>

            {active !== null && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[135%] whitespace-nowrap rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow"
                style={{ left: `${(coords[active].x / W) * 100}%`, top: `${(coords[active].y / H) * 100}%` }}
              >
                {points[active].label}: {fmtMoney(points[active].value, symbol, 2)}
              </div>
            )}
          </div>

          <div className="relative mt-2 h-5" style={{ marginLeft: `${(PAD_X / W) * 100}%`, marginRight: `${(PAD_X / W) * 100}%` }}>
            {points.map((p, i) =>
              showLabel(i) ? (
                <span
                  key={p.key}
                  className="absolute -translate-x-1/2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant"
                  style={{ left: `${(i / (points.length - 1)) * 100}%` }}
                >
                  {p.label}
                </span>
              ) : null,
            )}
          </div>

          {(excluded > 0 || partial) && (
            <p className="mt-3 text-xs text-on-surface-variant">
              {excluded > 0 &&
                `${excluded} paid invoice${excluded === 1 ? "" : "s"} in another currency ${excluded === 1 ? "is" : "are"} not included. `}
              {partial && "Only this client's most recent documents are included."}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}