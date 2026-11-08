// components/ui/Badge.tsx
import type { ReactNode } from "react";

export type BadgeTone = "green" | "orange" | "blue" | "red" | "neutral";

const TONES: Record<BadgeTone, string> = {
  green: "bg-status-paid-bg text-status-paid-fg",
  orange: "bg-status-warn-bg text-status-warn-fg",
  blue: "bg-status-info-bg text-status-info-fg",
  red: "bg-error-container text-error",
  neutral: "bg-status-draft-bg text-status-draft-fg",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold max-sm:px-2 max-sm:text-[10px] ${TONES[tone]}`}>
      {children}
    </span>
  );
}