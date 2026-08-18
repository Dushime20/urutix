import { useCallback } from 'react';
import { useCurrencyFormat } from './useCurrencyFormat';

/**
 * Formats parking amounts in the user's preferred currency, keeping the
 * billed ISO 4217 amount visible when the two differ.
 */
export function useParkingMoney() {
  const { format, formatIn, currency, rates, getRate } = useCurrencyFormat();

  const billed = useCallback(
    (amount?: number | null, fromCurrency = 'USD') => {
      const value = Number(amount);
      const from = (fromCurrency || 'USD').toUpperCase();
      if (!Number.isFinite(value)) return formatIn(0, from, from);
      return formatIn(value, from, from);
    },
    [formatIn],
  );

  const converted = useCallback(
    (amount?: number | null, fromCurrency = 'USD') => {
      const value = Number(amount);
      const from = (fromCurrency || 'USD').toUpperCase();
      if (!Number.isFinite(value)) return format(0, from);
      return format(value, from);
    },
    [format],
  );

  const money = useCallback(
    (amount?: number | null, fromCurrency = 'USD') => {
      const value = Number(amount);
      const from = (fromCurrency || 'USD').toUpperCase();
      if (!Number.isFinite(value)) return format(0, from);
      const converted = format(value, from);
      if (from === currency) return converted;
      return `${converted} (${billed(value, from)})`;
    },
    [billed, currency, format],
  );

  const rateLabel = useCallback(
    (fromCurrency = 'USD') => {
      const from = (fromCurrency || 'USD').toUpperCase();
      if (from === currency) return null;
      const fromRate = from === 'USD' ? 1 : (rates[from] ?? getRate(from) ?? 1);
      const toRate = currency === 'USD' ? 1 : (rates[currency] ?? getRate(currency) ?? 1);
      const converted = toRate / fromRate;
      const decimals = converted >= 10 ? 2 : 4;
      return `1 ${from} ≈ ${converted.toFixed(decimals)} ${currency}`;
    },
    [currency, getRate, rates],
  );

  return {
    money,
    billed,
    converted,
    preferredCurrency: currency,
    rateLabel,
  };
}
