/**
 * useCurrencyFormat
 * ─────────────────
 * Convenience hook that exposes format/convert helpers pre-bound
 * to the user's preferred currency.
 *
 * Usage:
 *   const { format, formatIn, convert, currency } = useCurrencyFormat();
 *   format(1000)                   // "$1,000.00" or "FRw 1,450,000" etc.
 *   format(1000, 'RWF')            // convert 1000 RWF → preferred
 *   formatIn(1000, 'EUR')          // convert 1000 USD → EUR string
 *   convert(1000)                  // raw number in preferred currency
 *   currency                       // 'USD' | 'EUR' | 'RWF' ...
 */
import { useCurrency } from '../contexts/CurrencyContext';

export const useCurrencyFormat = () => {
  const { format, formatIn, convert, preferredCurrency, getCurrencyMeta, rates } = useCurrency();

  const meta = getCurrencyMeta(preferredCurrency);

  return {
    /** Format an amount (stored as fromCurrency, default USD) in the user's preferred currency */
    format,
    /** Format an amount in a specific target currency */
    formatIn,
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
