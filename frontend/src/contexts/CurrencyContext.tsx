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
 *  - supportedCurrencies: list from the DB (dynamic, managed by super-admin)
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
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

// ── Fallback list — used only while the API loads on first render ─────────────
// This prevents a flash of broken formatting. The real list comes from the DB.
const FALLBACK_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',    locale: 'en-US', decimals: 2, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',               symbol: '€',    locale: 'de-DE', decimals: 2, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      symbol: '£',    locale: 'en-GB', decimals: 2, flag: '🇬🇧' },
  { code: 'RWF', name: 'Rwandan Franc',      symbol: 'FRw',  locale: 'rw-RW', decimals: 0, flag: '🇷🇼' },
  { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh',  locale: 'sw-KE', decimals: 0, flag: '🇰🇪' },
];

// ── Context shape ─────────────────────────────────────────────────────────────

interface CurrencyContextValue {
  preferredCurrency: string;
  setPreferredCurrency: (code: string) => Promise<void>;
  rates: RateMap;
  ratesUpdatedAt: string | null;
  ratesLoading: boolean;
  supportedCurrencies: CurrencyMeta[];
  supportedCurrenciesLoading: boolean;
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

// ── Bootstrap rates (USD base) — placeholder while live rates load ────────────
// Approximate mid-market rates. Replaced by live data as soon as the backend responds.
const BOOTSTRAP_RATES: RateMap = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CHF: 0.90,
  AUD: 1.53,
  CAD: 1.36,
  CNY: 7.24,
  RWF: 1469.00,
  KES: 132.00,
  UGX: 3750.00,
  TZS: 2650.00,
  ZAR: 18.60,
  NGN: 1580.00,
  EGP: 48.50,
  INR: 83.20,
  AED: 3.67,
  SAR: 3.75,
};

// ── Provider ──────────────────────────────────────────────────────────────────

const LOCAL_KEY = 'urutix_preferred_currency';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferredCurrency, _setPreferredCurrency] = useState<string>(() => {
    return localStorage.getItem(LOCAL_KEY) ?? 'USD';
  });

  // ── Fetch supported currencies from DB (refreshed every 10 minutes) ───────
  const { data: supportedData, isLoading: supportedCurrenciesLoading } = useQuery({
    queryKey: ['supported-currencies'],
    queryFn: () => currencyApi.getSupportedCurrencies(),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 2,
    // On failure keep the fallback list
    placeholderData: FALLBACK_CURRENCIES,
  });

  const supportedCurrencies: CurrencyMeta[] = supportedData ?? FALLBACK_CURRENCIES;

  // ── Build a lookup map from the live list ─────────────────────────────────
  const currencyMap = useMemo(
    () => new Map<string, CurrencyMeta>(supportedCurrencies.map(c => [c.code, c])),
    [supportedCurrencies],
  );

  // ── Fetch exchange rates (refreshed every 60 minutes) ─────────────────────
  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => currencyApi.getRates(),
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
    // Use bootstrap rates as placeholder so conversion works instantly on first render
    placeholderData: { base: 'USD', rates: BOOTSTRAP_RATES, updatedAt: null },
  });

  const rates: RateMap = { USD: 1, ...(ratesData?.rates ?? BOOTSTRAP_RATES) };

  // ── Load user preference from backend on mount (if authenticated) ─────────
  useEffect(() => {
    currencyApi
      .getPreference()
      .then(code => {
        _setPreferredCurrency(code);
        localStorage.setItem(LOCAL_KEY, code);
      })
      .catch(() => {});
  }, []);

  const setPreferredCurrency = useCallback(async (code: string) => {
    _setPreferredCurrency(code);
    localStorage.setItem(LOCAL_KEY, code);
    try {
      await currencyApi.setPreference(code);
    } catch {
      // non-critical
    }
  }, []);

  // ── Conversion helpers ────────────────────────────────────────────────────

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
      const meta = currencyMap.get(targetCurrency);
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
    [currencyMap],
  );

  const convert = useCallback(
    (amount: number, fromCurrency = 'USD') =>
      convertValue(amount, fromCurrency, preferredCurrency),
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

  const getCurrencyMeta = useCallback(
    (code: string) => currencyMap.get(code),
    [currencyMap],
  );

  return (
    <CurrencyContext.Provider
      value={{
        preferredCurrency,
        setPreferredCurrency,
        rates,
        ratesUpdatedAt: ratesData?.updatedAt ?? null,
        ratesLoading,
        supportedCurrencies,
        supportedCurrenciesLoading,
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

// Keep named exports for any code that still imports SUPPORTED_CURRENCIES
// The live data is always available via useCurrency().supportedCurrencies
export { FALLBACK_CURRENCIES as SUPPORTED_CURRENCIES };
