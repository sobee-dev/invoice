'use client';
// Small onboarding-only helpers. Everything else reuses the app's existing
// components/ui (SectionCard, PageHeader, Modal, Toast, buttonStyles).
import type { ReactNode } from 'react';
import { Icon } from '@/components/layout/Icon';
import { inputClasses, labelClasses } from '@/components/ui/buttonStyles';

export const inputCls = `${inputClasses} h-12`;
export const textareaCls = `${inputClasses} min-h-[96px] py-3 resize-y`;

export function Spinner({ size = 20 }: { size?: number }) {
  return <Icon name="progress_activity" size={size} className="animate-spin" />;
}

export function Field({
  label, optional, error, hint, children,
}: { label: string; optional?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClasses}>
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-outline">(optional)</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-on-surface-variant">{hint}</span>
      ) : null}
    </label>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-error-container px-4 py-3 text-body-md text-error">
      <Icon name="error" size={18} filled className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-container/20 ${
        checked ? 'bg-primary-container' : 'bg-outline-variant'
      }`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function Segmented<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-surface-container p-1">
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            value === o.value ? 'bg-white text-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}