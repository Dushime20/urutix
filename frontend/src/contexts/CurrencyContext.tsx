/**
 * CurrencyContext
 * ───────────────
 * Provides:
 *  - preferredCurrency  : the user's selected currency code
 *  - setPreferredCurrency: persist to backend + local state
 *  - rates              : current exchange rate map (base = USD)
 *  - convert(amount, from?, to?)  : convert between currencies
 *  - format(amount, from?)        : format as locale-aware string in preferred currency
 *  - formatIn(amount, currency, from?) : format in a specific currency
 *  - supportedCurrencies: full list with metadata
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import currencyApi from '../services/currencyApi';

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  flag: string;
}

export interface RateMap {
  [code: string]: number;
}

// ── Inline currency metadata (mirrors backend constants) ─────────────────────
// This avoids an extra API call for the metadata which rarely changes.

const CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',    locale: 'en-US', decimals: 2, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',               symbol: '€',    locale: 'de-DE', decimals: 2, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      symbol: '£',    locale: 'en-GB', decimals: 2, flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',    locale: 'ja-JP', decimals: 0, flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc',        symbol: 'CHF',  locale: 'de-CH', decimals: 2, flag: '🇨🇭' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$',   locale: 'en-AU', decimals: 2, flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$',   locale: 'en-CA', decimals: 2, flag: '🇨🇦' },
  { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥',    locale: 'zh-CN', decimals: 2, flag: '🇨🇳' },
  { code: 'RWF', name: 'Rwandan Franc',      symbol: 'FRw',  locale: 'rw-RW', decimals: 0, flag: '🇷🇼' },
  { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh',  locale: 'sw-KE', decimals: 0, flag: '🇰🇪' },
  { code: 'UGX', name: 'Ugandan Shilling',   symbol: 'USh',  locale: 'sw-UG', decimals: 0, flag: '🇺🇬' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh',  locale: 'sw-TZ', decimals: 0, flag: '🇹🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',    locale: 'en-ZA', decimals: 2, flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',    locale: 'en-NG', decimals: 2, flag: '🇳🇬' },
  { code: 'EGP', name: 'Egyptian Pound',     symbol: 'E£',   locale: 'ar-EG', decimals: 2, flag: '🇪🇬' },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',    locale: 'en-IN', decimals: 2, flag: '🇮🇳' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'AED',  locale: 'ar-AE', decimals: 2, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',        symbol: 'SAR',  locale: 'ar-SA', decimals: 2, flag: '🇸🇦' },
];

const CURRENCY_MAP = new Map<string, CurrencyMeta>(CURRENCIES.map(c => [c.code, c]));

// ── Context shape ─────────────────────────────────────────────────────────────

interface CurrencyContextValue {
  preferredCurrency: string;
  setPreferredCurrency: (code: string) => Promise<void>;
  rates: RateMap;
  ratesUpdatedAt: string | null;
  ratesLoading: boolean;
  supportedCurrencies: CurrencyMeta[];
  /** Convert amount (stored as fromCurrency, default USD) to preferredCurrency */
  convert: (amount: number, fromCurrency?: string) => number;
  /** Format amount in the user's preferred currency */
  format: (amount: number, fromCurrency?: string) => string;
  /** Format amount in a specific target currency */
  formatIn: (amount: number, targetCurrency: string, fromCurrency?: string) => string;
  /** Get metadata for a currency code */
  getCurrencyMeta: (code: string) => CurrencyMeta | undefined;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

const LOCAL_KEY = 'urutix_preferred_currency';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialise from localStorage so there's no flash of wrong currency
  const [preferredCurrency, _setPreferredCurrency] = useState<string>(() => {
    return localStorage.getItem(LOCAL_KEY) ?? 'USD';
  });

  // Fetch exchange rates — refresh every 60 minutes
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => currencyApi.getRates(),
    staleTime: 60 * 60 * 1000,  // 1 hour
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
  });

  const rates: RateMap = { USD: 1, ...(ratesData?.rates ?? {}) };

  // Load user preference from backend on mount (if authenticated)
  useEffect(() => {
    currencyApi.getPreference()
      .then(code => {
        _setPreferredCurrency(code);
        localStorage.setItem(LOCAL_KEY, code);
      })
      .catch(() => { /* not authenticated — stay with local value */ });
  }, []);

  const setPreferredCurrency = useCallback(async (code: string) => {
    _setPreferredCurrency(code);
    localStorage.setItem(LOCAL_KEY, code);
    try {
      await currencyApi.setPreference(code);
    } catch {
      // non-critical — local state already updated
    }
  }, []);

  // ── Conversion helpers ───────────────────────────────────────────────────

  const convertValue = useCallback(
    (amount: number, fromCurrency = 'USD', toCurrency = preferredCurrency): number => {
      if (!amount || isNaN(amount)) return 0;
      if (fromCurrency === toCurrency) return amount;
      const fromRate = fromCurrency === 'USD' ? 1 : (rates[fromCurrency] ?? 1);
      const toRate   = toCurrency   === 'USD' ? 1 : (rates[toCurrency]   ?? 1);
      const usd = amount / fromRate;
      return usd * toRate;
    },
    [rates, preferredCurrency],
  );

  const formatAmount = useCallback(
    (amount: number, targetCurrency: string): string => {
      const meta = CURRENCY_MAP.get(targetCurrency);
      if (!meta) return `${targetCurrency} ${amount.toFixed(2)}`;
      try {
        return new Intl.NumberFormat(meta.locale, {
          style: 'currency',
          currency: targetCurrency,
          minimumFractionDigits: meta.decimals,
          maximumFractionDigits: meta.decimals,
        }).format(amount);
      } catch {
        return `${meta.symbol} ${amount.toFixed(meta.decimals)}`;
      }
    },
    [],
  );

  const convert = useCallback(
    (amount: number, fromCurrency = 'USD') => convertValue(amount, fromCurrency, preferredCurrency),
    [convertValue, preferredCurrency],
  );

  const format = useCallback(
    (amount: number, fromCurrency = 'USD') => {
      const converted = convertValue(amount, fromCurrency, preferredCurrency);
      return formatAmount(converted, preferredCurrency);
    },
    [convertValue, formatAmount, preferredCurrency],
  );

  const formatIn = useCallback(
    (amount: number, targetCurrency: string, fromCurrency = 'USD') => {
      const converted = convertValue(amount, fromCurrency, targetCurrency);
      return formatAmount(converted, targetCurrency);
    },
    [convertValue, formatAmount],
  );

  const getCurrencyMeta = useCallback((code: string) => CURRENCY_MAP.get(code), []);

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        rates,
        ratesUpdatedAt: ratesData?.updatedAt ?? null,
        ratesLoading,
        supportedCurrencies: CURRENCIES,
        convert,
        format,
        formatIn,
        getCurrencyMeta,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};

export { CURRENCIES as SUPPORTED_CURRENCIES, CURRENCY_MAP };
