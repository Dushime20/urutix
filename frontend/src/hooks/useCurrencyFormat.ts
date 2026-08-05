/**
 * useCurrencyFormat
 * ─────────────────
 * Convenience hook that exposes format / convert / compact helpers
 * pre-bound to the user's preferred currency.
 *
 * Usage:
 *   const { format, compact, formatIn, convert, currency } = useCurrencyFormat();
 *
 *   format(1000)              // "$1,000.00"  or  "FRw 1,450,000"  (full)
 *   compact(1000)             // "$1.0K"      or  "FRw 1.5M"       (compact)
 *   compact(1000, 'RWF')      // convert 1000 RWF → preferred, compact
 *   formatIn(1000, 'EUR')     // convert 1000 USD → EUR, full string
 *   compactIn(1000, 'EUR')    // convert 1000 USD → EUR, compact string
 *   convert(1000)             // raw number in preferred currency
 *   currency                  // 'USD' | 'EUR' | 'RWF' …
 */
import { useCallback } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export const useCurrencyFormat = () => {
  const {
    format,
    formatIn,
    convert,
    preferredCurrency,
    getCurrencyMeta,
    rates,
  } = useCurrency();

  const meta = getCurrencyMeta(preferredCurrency);

  // ── Compact helpers ───────────────────────────────────────────────────────

  /**
   * Convert `amount` (stored as `fromCurrency`, default USD) to the user's
   * preferred currency, then format in compact K / M / B notation.
   *
   *   compact(1_250_000)         → "$1.3M"
   *   compact(1_250_000, 'RWF')  → "$1.3M"  (after converting from RWF)
   */
  const compact = useCallback(
    (amount: number, fromCurrency = 'USD'): string => {
      const converted = convert(amount, fromCurrency);
      const dec = meta?.decimals ?? 2;
      // Full format for small decimal-currency values — compact would show $0.0 for e.g. 50 RWF → $0.03
      if (dec > 0 && Math.abs(converted) < 1_000) {
        return format(amount, fromCurrency);
      }
      return formatCompact(converted, preferredCurrency, meta?.symbol, dec);
    },
    [convert, format, preferredCurrency, meta],
  );

  /**
   * Convert `amount` (stored as `fromCurrency`, default USD) to `targetCurrency`,
   * then format in compact K / M / B notation.
   */
  const compactIn = useCallback(
    (amount: number, targetCurrency: string, fromCurrency = 'USD'): string => {
      const fromRate = fromCurrency === 'USD' ? 1 : (rates[fromCurrency] ?? 1);
      const toRate   = targetCurrency === 'USD' ? 1 : (rates[targetCurrency] ?? 1);
      const converted = (amount / fromRate) * toRate;
      const targetMeta = getCurrencyMeta(targetCurrency);
      return formatCompact(converted, targetCurrency, targetMeta?.symbol);
    },
    [rates, getCurrencyMeta],
  );

  return {
    /** Full locale-aware format in preferred currency */
    format,
    /** Compact K/M/B format in preferred currency */
    compact,
    /** Full locale-aware format in an explicit currency */
    formatIn,
    /** Compact K/M/B format in an explicit currency */
    compactIn,
    /** Convert to preferred currency — returns raw number */
    convert,
    /** Current preferred currency code */
    currency: preferredCurrency,
    /** Full metadata for the preferred currency */
    currencyMeta: meta,
    /** Current rate map */
    rates,
    /** Quick rate lookup */
    getRate: (code: string) => (code === 'USD' ? 1 : (rates[code] ?? null)),
  };
};

// ── Internal compact formatter ────────────────────────────────────────────────

function getSymbol(currency: string, metaSymbol?: string): string {
  if (metaSymbol) return metaSymbol;
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find(p => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

function formatCompact(
  value: number,
  currency: string,
  metaSymbol?: string,
  decimals = 0,
): string {
  if (isNaN(value)) return `${getSymbol(currency, metaSymbol)}0`;
  const abs  = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const sym  = getSymbol(currency, metaSymbol);

  if (abs >= 1_000_000_000) return `${sign}${sym}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}${sym}${(abs / 1_000).toFixed(1)}K`;

  if (decimals > 0) {
    return `${sign}${sym}${abs.toFixed(decimals)}`;
  }

  return `${sign}${sym}${abs % 1 === 0 ? abs : abs.toFixed(1)}`;
}
