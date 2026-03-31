import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}





export function getContrastColor(hexColor: string): string {
  // Strip the # if present
  const hex = hexColor.replace('#', '');

  // Parse R, G, B channels
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  // Human eyes are most sensitive to green, least to blue
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Above 0.5 = light background → use dark text
  // Below 0.5 = dark background → use white text
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
}


// lib/utils.ts

export function numberToWords(amount: number, currency: string): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '') + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
    if (n < 1_000_000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000);
    if (n < 1_000_000_000) return convert(Math.floor(n / 1_000_000)) + 'Million ' + convert(n % 1_000_000);
    return convert(Math.floor(n / 1_000_000_000)) + 'Billion ' + convert(n % 1_000_000_000);
  }

  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);

  const wholeWords = convert(whole).trim() || 'Zero';
  const centsWords = cents > 0 ? ` and ${convert(cents).trim()} Cents` : '';

  return `${wholeWords}${centsWords} ${currency} Only`;
}

// lib/utils.ts

const currencySymbolMap: Record<string, string> = {
  '$':  'Dollars',
  '€':  'Euros',
  '£':  'Pounds',
  '¥':  'Yen',
  '₦':  'Naira',
  '₹':  'Rupees',
  '₩':  'Won',
  '₪':  'Shekels',
  '₫':  'Dong',
  '₱':  'Pesos',
  '₲':  'Guaraní',
  '฿':  'Baht',
  '₴':  'Hryvnia',
  '₺':  'Lira',
  'R':  'Rand',
  'kr': 'Kroner',
  'Fr': 'Francs',
};

export function resolveCurrencyName(symbol: string): string {
  return currencySymbolMap[symbol.trim()] ?? symbol;
}