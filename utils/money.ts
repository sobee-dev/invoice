export function fmtMoney(n: number | string, symbol: string, decimals = 0): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return `${symbol}0`;
  return `${symbol}${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtCompact(n: number, symbol: string): string {
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(1)}k`;
  return `${symbol}${n.toFixed(0)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
