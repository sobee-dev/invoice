// components/docs/form/CurrencyField.tsx
"use client";

import { inputClasses } from "@/components/ui/buttonStyles";
import { GLOBAL_CURRENCIES } from "@/data/constants";
import type { CurrencyValue } from "@/lib/currency";

const OTHER = "__other__";

interface CurrencyFieldProps {
  id: string;
  value: CurrencyValue;
  onChange: (next: CurrencyValue) => void;
  disabled?: boolean;
}

export function CurrencyField({ id, value, onChange, disabled = false }: CurrencyFieldProps) {
  return (
    <div className="space-y-2">
      <select
        id={id}
        value={value.custom ? OTHER : value.code}
        disabled={disabled}
        onChange={(e) =>
          e.target.value === OTHER
            ? onChange({ ...value, custom: true })
            : onChange({ code: e.target.value, custom: false, symbol: "" })
        }
        className={`${inputClasses} h-11`}
      >
        {GLOBAL_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} · {c.name} ({c.symbol})
          </option>
        ))}
        <option value={OTHER}>Other (custom symbol)</option>
      </select>

      {value.custom && (
        <input
          value={value.symbol}
          maxLength={5}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, symbol: e.target.value })}
          aria-label="Custom currency symbol"
          placeholder="Currency symbol, for example ¥"
          className={`${inputClasses} h-11`}
        />
      )}
    </div>
  );
}