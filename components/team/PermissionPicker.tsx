// components/team/PermissionPicker.tsx
import type { PermissionLevel } from "@/services/staff";

const OPTIONS: { key: PermissionLevel; label: string }[] = [
  { key: "limited_access", label: "Limited" },
  { key: "managerial_access", label: "Managerial" },
];

interface PermissionPickerProps {
  value: PermissionLevel;
  onChange: (next: PermissionLevel) => void;
  disabled?: boolean;
}

export function PermissionPicker({ value, onChange, disabled = false }: PermissionPickerProps) {
  return (
    <div role="radiogroup" aria-label="Access level" className="flex gap-3">
      {OPTIONS.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.key)}
            className={`h-12 flex-1 rounded-xl border-2 text-sm font-bold transition-colors disabled:opacity-50 ${
              active
                ? "border-primary-container bg-primary-container text-white"
                : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}