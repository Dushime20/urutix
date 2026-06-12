/**
 * Supported currencies for the platform.
 * Architecture: add a new entry here to support a new currency — no other code changes needed.
 */
export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  /** BCP 47 locale used for Intl.NumberFormat */
  locale: string;
  /** Decimal digits to show (JPY = 0, most others = 2) */
  decimals: number;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
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

export const CURRENCY_MAP = new Map<string, CurrencyMeta>(
  SUPPORTED_CURRENCIES.map(c => [c.code, c])
);

export const BASE_CURRENCY = 'USD';

/** Rate map shape: target currency code → units per 1 USD */
export interface RateMap {
  [targetCurrency: string]: number;
}
