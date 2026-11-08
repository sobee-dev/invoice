// components/docs/form/LineItemsEditor.tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { btnOutline, inputClasses } from "@/components/ui/buttonStyles";
import { useAsyncSearch } from "@/hooks/useAsyncSearch";
import { FormLineItem, newItem, parseDecimal, roundMoney, sanitizeDecimal } from "@/lib/documentForm";
import { Product, productService } from "@/services/products";
import { fmtMoney } from "@/utils/money";

const GRID = "md:grid md:grid-cols-[minmax(0,1fr)_100px_130px_130px_44px] md:items-start md:gap-3";
const mobileLabel = "mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant max-sm:text-[10px] md:hidden";

interface ItemRowProps {
  item: FormLineItem;
  symbol: string;
  invalid: boolean;
  disabled: boolean;
  autoFocus: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<FormLineItem>) => void;
  onRemove: () => void;
}

function ItemRow({ item, symbol, invalid, disabled, autoFocus, canRemove, onChange, onRemove }: ItemRowProps) {
  const { results, loading } = useAsyncSearch<Product>(item.name, productService.search, !item.productId && !disabled);

  const qty = parseDecimal(item.qtyStr);
  const total = roundMoney(qty * parseDecimal(item.priceStr));
  const overStock = Boolean(item.productId) && item.qtyOnHand !== undefined && qty > item.qtyOnHand;

  const handleName = (text: string) =>
    // Editing the name breaks the match to a product.
    onChange({ name: text, productId: undefined, qtyOnHand: undefined });

  const handleSelect = (p: Product) =>
    onChange({
      name: p.name,
      productId: p.id,
      priceStr: String(Number(p.unitPrice)),
      qtyOnHand: Number(p.quantityOnHand),
    });

  return (
    <li className={`grid grid-cols-2 gap-3 py-4 max-sm:gap-2 max-sm:py-3 ${GRID}`}>
      <div className="col-span-2 md:col-span-1">
        <span className={mobileLabel}>Item</span>
        <Autocomplete
          ariaLabel="Item name"
          value={item.name}
          onChange={handleName}
          items={results}
          loading={loading}
          getKey={(p) => p.id}
          renderOption={(p) => ({
            title: p.name,
            subtitle: `${p.sku || "No SKU"} · ${fmtMoney(Number(p.unitPrice), symbol, 2)} · ${Number(p.quantityOnHand)} in stock`,
          })}
          onSelect={handleSelect}
          placeholder="Start typing to find a product"
          disabled={disabled}
          invalid={invalid && !item.name.trim()}
          autoFocus={autoFocus}
        />
        {item.productId ? (
          <p className="mt-1 text-xs text-on-surface-variant max-sm:text-[11px]">
            Matched to an existing product{item.qtyOnHand !== undefined ? `, ${item.qtyOnHand} in stock` : ""}.
          </p>
        ) : (
          item.name.trim() && <p className="mt-1 text-xs text-on-surface-variant max-sm:text-[11px]">New product, created when you save.</p>
        )}
        {overStock && <p className="mt-1 text-xs font-semibold text-status-warn-fg max-sm:text-[11px]">Only {item.qtyOnHand} in stock.</p>}
      </div>

      <div>
        <span className={mobileLabel}>Qty</span>
        <input
          aria-label="Quantity"
          inputMode="decimal"
          value={item.qtyStr}
          disabled={disabled}
          onChange={(e) => onChange({ qtyStr: sanitizeDecimal(e.target.value) })}
          aria-invalid={(invalid && qty <= 0) || undefined}
          className={`${inputClasses} h-11 max-sm:h-10 max-sm:text-sm ${invalid && qty <= 0 ? "border-error" : ""}`}
        />
      </div>

      <div>
        <span className={mobileLabel}>Unit price ({symbol})</span>
        <textarea
          aria-label={`Unit price in ${symbol}`}
          inputMode="decimal"
          rows={1}
          value={item.priceStr}
          disabled={disabled}
          placeholder="0.00"
          onChange={(e) => {
            onChange({ priceStr: sanitizeDecimal(e.target.value) });
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
          aria-invalid={(invalid && item.priceStr.trim() === "") || undefined}
          className={`${inputClasses} min-h-11 max-sm:min-h-10 max-sm:text-sm resize-none overflow-hidden wrap-anywhere py-2.5 leading-tight ${
            invalid && item.priceStr.trim() === "" ? "border-error" : ""
          }`}
        />
      </div>

      <div className="col-span-2 md:col-span-1">
        <span className={mobileLabel}>Total</span>
        <div className="flex min-h-11 items-center justify-end max-sm:min-h-10 wrap-anywhere rounded-lg bg-primary-container px-3 py-2 text-right text-sm font-extrabold leading-tight text-white max-sm:text-xs">
          {fmtMoney(total, symbol, 2)}
        </div>
      </div>

      <div className="col-span-2 flex justify-end md:col-span-1">
        <button
          type="button"
          aria-label="Remove item"
          onClick={onRemove}
          disabled={disabled || !canRemove}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-error-container text-error hover:opacity-80 disabled:opacity-40 max-sm:h-10 max-sm:w-10"
        >
          <Icon name="delete" size={18} mobileSize={16} />
        </button>
      </div>
    </li>
  );
}

interface LineItemsEditorProps {
  items: FormLineItem[];
  onChange: (next: FormLineItem[]) => void;
  symbol: string;
  invalidIds: Set<string>;
  disabled?: boolean;
}

export function LineItemsEditor({ items, onChange, symbol, invalidIds, disabled = false }: LineItemsEditorProps) {
  const [focusId, setFocusId] = useState<string | null>(null);

  const patch = (id: string, change: Partial<FormLineItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const add = () => {
    const created = newItem();
    setFocusId(created.id);
    onChange([...items, created]);
  };

  return (
    <div>
      <div className={`hidden border-b border-outline-variant pb-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant ${GRID}`}>
        <span>Item</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      <ul className="divide-y divide-outline-variant">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            symbol={symbol}
            invalid={invalidIds.has(item.id)}
            disabled={disabled}
            autoFocus={item.id === focusId}
            canRemove={items.length > 1}
            onChange={(change) => patch(item.id, change)}
            onRemove={() => onChange(items.filter((i) => i.id !== item.id))}
          />
        ))}
      </ul>

      <button type="button" onClick={add} disabled={disabled} className={`${btnOutline} mt-2`}>
        <Icon name="add" size={18} /> Add item
      </button>
    </div>
  );
}