// components/docs/form/TotalsPanel.tsx
import { Icon } from "@/components/layout/Icon";
import { sanitizeDecimal } from "@/lib/documentForm";
import { fmtMoney } from "@/utils/money";

const fieldClasses =
  "h-10 max-sm:h-9 rounded-lg border border-white/25 bg-white/10 px-3 text-right text-sm font-semibold text-white placeholder:text-white/40 focus:border-white focus:outline-none disabled:opacity-60";

interface TotalsPanelProps {
  symbol: string;
  subtotal: number;
  taxPct: string;
  onTaxPct: (value: string) => void;
  taxAmount: number;
  showDiscount: boolean;
  discount: string;
  onDiscount: (value: string) => void;
  grandTotal: number;
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
}

export function TotalsPanel(p: TotalsPanelProps) {
  return (
    <section className="rounded-xl bg-primary p-6 text-white shadow-card max-sm:p-4">
      <h2 className="text-lg font-bold max-sm:text-base">Totals</h2>

      <dl className="mt-4 space-y-3 text-sm max-sm:mt-3 max-sm:space-y-2 max-sm:text-xs">
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-white/70">Subtotal</dt>
          <dd className="min-w-0 wrap-anywhere text-right font-semibold">{fmtMoney(p.subtotal, p.symbol, 2)}</dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt>
            <label htmlFor="doc-tax" className="text-white/70">
              Tax rate (%)
            </label>
          </dt>
          <dd>
            <input
              id="doc-tax"
              inputMode="decimal"
              value={p.taxPct}
              disabled={p.saving}
              onChange={(e) => p.onTaxPct(sanitizeDecimal(e.target.value))}
              placeholder="0"
              className={`${fieldClasses} w-24`}
            />
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-white/70">Tax amount</dt>
          <dd className="font-semibold">{fmtMoney(p.taxAmount, p.symbol, 2)}</dd>
        </div>

        {p.showDiscount && (
          <div className="flex items-center justify-between gap-3">
            <dt>
              <label htmlFor="doc-discount" className="text-white/70">
                Discount ({p.symbol})
              </label>
            </dt>
            <dd>
              <input
                id="doc-discount"
                inputMode="decimal"
                value={p.discount}
                disabled={p.saving}
                onChange={(e) => p.onDiscount(sanitizeDecimal(e.target.value))}
                placeholder="0.00"
                className={`${fieldClasses} w-32`}
              />
            </dd>
          </div>
        )}
      </dl>

      <div className="my-5 border-t border-white/15 max-sm:my-4" />

      <div className="flex items-end justify-between gap-3">
        <span className="shrink-0 font-bold">Grand total</span>
        <span className="min-w-0 wrap-anywhere text-right text-2xl font-extrabold leading-tight text-secondary-container max-sm:text-xl">
          {fmtMoney(p.grandTotal, p.symbol, 2)}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/60 max-sm:text-[10px]">The server recalculates these figures when you save.</p>

      <button
        type="button"
        onClick={p.onSave}
        disabled={p.saving}
        className="mt-6 max-sm:mt-4 max-sm:h-11 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary-container text-sm font-bold text-on-secondary-container transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="save" size={20} />
        {p.saving ? "Saving..." : p.saveLabel}
      </button>
    </section>
  );
}