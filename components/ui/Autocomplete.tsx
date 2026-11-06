// components/ui/Autocomplete.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/buttonStyles";
import { useDismiss } from "@/hooks/useDismiss";

interface AutocompleteProps<T> {
  value: string;
  onChange: (text: string) => void;
  items: T[];
  loading?: boolean;
  getKey: (item: T) => string;
  renderOption: (item: T) => { title: string; subtitle?: string };
  onSelect: (item: T) => void;
  ariaLabel: string;
  inputId?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}

export function Autocomplete<T>({
  value,
  onChange,
  items,
  loading = false,
  getKey,
  renderOption,
  onSelect,
  ariaLabel,
  inputId,
  placeholder,
  disabled = false,
  invalid = false,
  autoFocus = false,
}: AutocompleteProps<T>) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useDismiss(wrapRef, open, () => setOpen(false));

  const showList = open && value.trim().length > 0 && (loading || items.length > 0);

  useEffect(() => {
    setActive(-1);
  }, [items]);

  const choose = (item: T) => {
    onSelect(item);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showList) setOpen(true);
      else setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`${inputClasses} h-11 ${invalid ? "border-error" : ""}`}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-outline-variant bg-white py-1 shadow-lg"
        >
          {items.map((item, i) => {
            const option = renderOption(item);
            return (
              <li
                key={getKey(item)}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click, so the input does not lose focus first
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(item);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-4 py-2.5 ${i === active ? "bg-surface-container-low" : ""}`}
              >
                <span className="block text-body-md font-semibold text-on-surface">{option.title}</span>
                {option.subtitle && <span className="block text-xs text-on-surface-variant">{option.subtitle}</span>}
              </li>
            );
          })}
          {loading && items.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-xs text-on-surface-variant">
              Searching...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}