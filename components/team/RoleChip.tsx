// components/team/RoleChip.tsx
import type { PermissionLevel } from "@/services/staff";

const STYLES: Record<PermissionLevel, { label: string; classes: string }> = {
  managerial_access: { label: "Managerial", classes: "bg-secondary-container text-on-secondary-container" },
  limited_access: { label: "Limited", classes: "bg-status-draft-bg text-status-draft-fg" },
};

export function RoleChip({ level }: { level: PermissionLevel }) {
  const style = STYLES[level] ?? STYLES.limited_access;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${style.classes}`}>
      {style.label}
    </span>
  );
}