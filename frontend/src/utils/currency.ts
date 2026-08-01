import { CACHE_KEYS, getCachedData } from "@/utils/cache";

export type StoreCurrencyCode =
  | "PKR"
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "AED"
  | "SAR"
  | "INR"
  | "JPY";

export type StoreCurrencyConfig = {
  code: StoreCurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  exampleAmount: number;
};

export const DEFAULT_STORE_CURRENCY: StoreCurrencyCode = "PKR";

export const STORE_CURRENCIES: StoreCurrencyConfig[] = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", locale: "en-PK", decimals: 2, exampleAmount: 1999 },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", decimals: 2, exampleAmount: 1999 },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE", decimals: 2, exampleAmount: 1999 },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", decimals: 2, exampleAmount: 1999 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA", decimals: 2, exampleAmount: 1999 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU", decimals: 2, exampleAmount: 1999 },
  { code: "AED", name: "UAE Dirham", symbol: "AED", locale: "en-AE", decimals: 2, exampleAmount: 1999 },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", locale: "ar-SA", decimals: 2, exampleAmount: 1999 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", decimals: 2, exampleAmount: 1999 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP", decimals: 0, exampleAmount: 1999 },
];

export function getCurrencyConfig(code?: string): StoreCurrencyConfig {
  const match = STORE_CURRENCIES.find((c) => c.code === code);
  return match || STORE_CURRENCIES[0];
}

export function getStoreCurrencyFromCache(): StoreCurrencyCode {
  const cached = getCachedData<{ currency?: string }>(CACHE_KEYS.COMPANY);
  const code = cached?.currency;
  if (code && STORE_CURRENCIES.some((c) => c.code === code)) {
    return code as StoreCurrencyCode;
  }
  return DEFAULT_STORE_CURRENCY;
}

export function getStorePriceShowDecimalsFromCache(): boolean {
  const cached = getCachedData<{ priceShowDecimals?: boolean }>(CACHE_KEYS.COMPANY);
  return cached?.priceShowDecimals !== false;
}

/** True when amount has a non-zero fractional part at the configured precision. */
export function amountHasFraction(value: number, decimalPlaces: number): boolean {
  if (decimalPlaces <= 0) return false;
  const numeric = Number(value) || 0;
  const factor = 10 ** decimalPlaces;
  const rounded = Math.round(numeric * factor) / factor;
  return Math.abs(rounded - Math.trunc(rounded)) > 1e-9;
}

export function formatStoreMoney(
  amount: number,
  code?: string,
  options?: { showDecimals?: boolean }
): string {
  const value = Number(amount) || 0;
  const config = getCurrencyConfig(code || getStoreCurrencyFromCache());
  const showDecimals = options?.showDecimals ?? getStorePriceShowDecimalsFromCache();

  let minDecimals: number;
  let maxDecimals: number;
  let displayValue = value;

  if (!showDecimals) {
    minDecimals = 0;
    maxDecimals = 0;
    displayValue = Math.round(value);
  } else {
    maxDecimals = config.decimals;
    minDecimals = amountHasFraction(value, maxDecimals) ? maxDecimals : 0;
  }

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(displayValue);

  if (config.code === "PKR") return `Rs ${formatted}`;
  if (config.code === "EUR") return `€${formatted}`;
  if (config.code === "USD") return `$${formatted}`;
  if (config.code === "GBP") return `£${formatted}`;
  if (config.code === "CAD") return `CA$${formatted}`;
  if (config.code === "AUD") return `A$${formatted}`;
  if (config.code === "INR") return `₹${formatted}`;
  if (config.code === "JPY") return `¥${formatted}`;
  return `${config.code} ${formatted}`;
}

export function getCurrencySelectLabel(code: string): string {
  const config = getCurrencyConfig(code);
  return `${config.code} — ${config.name} (${config.symbol})`;
}

export function getCurrencyExample(code?: string, showDecimals?: boolean): string {
  const config = getCurrencyConfig(code || getStoreCurrencyFromCache());
  const useDecimals = showDecimals ?? getStorePriceShowDecimalsFromCache();
  const sampleAmount = useDecimals ? 200.03 : 200.03;
  return formatStoreMoney(sampleAmount, config.code, { showDecimals: useDecimals });
}
