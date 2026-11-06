export function fmtLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}
