// components/ui/buttonStyles.ts
const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const btnAmber = `${base} bg-secondary text-white hover:opacity-90`;
export const btnNavy = `${base} bg-primary-container text-white hover:bg-primary`;
export const btnOutline = `${base} border border-primary-container bg-white text-primary hover:bg-surface-container-low`;
export const btnDanger = `${base} bg-error text-white hover:opacity-90`;

export const inputClasses =
  "w-full rounded-lg border border-outline-variant bg-white px-4 text-body-md text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none disabled:bg-surface-container-low";
export const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant";