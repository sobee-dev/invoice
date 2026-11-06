// lib/currency.ts
import { DEFAULT_CURRENCY, GLOBAL_CURRENCIES } from "@/data/constants";

export interface CurrencyValue {
  code: string;
  custom: boolean;  // true when the owner typed their own symbol
  symbol: string;   // only used when custom
}

// A document stores either a currency code or, for a custom currency, the symbol itself.
export function toCurrencyValue(stored: string): CurrencyValue {
  const byCode = GLOBAL_CURRENCIES.find((c) => c.code === stored);
  if (byCode) return { code: byCode.code, custom: false, symbol: "" };

  const bySymbol = GLOBAL_CURRENCIES.find((c) => c.symbol === stored);
  if (bySymbol) return { code: bySymbol.code, custom: false, symbol: "" };

  if (!stored) return { code: DEFAULT_CURRENCY.code, custom: false, symbol: "" };
  return { code: DEFAULT_CURRENCY.code, custom: true, symbol: stored };
}

export function storedCurrency(value: CurrencyValue): string {
  return value.custom ? value.symbol.trim() : value.code;
}

export function displaySymbol(value: CurrencyValue): string {
  if (value.custom) return value.symbol.trim() || "?";
  return GLOBAL_CURRENCIES.find((c) => c.code === value.code)?.symbol ?? DEFAULT_CURRENCY.symbol;
}