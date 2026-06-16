/**
 * Currency types and base-currency constant.
 *
 * The supported currencies list is no longer hardcoded here —
 * it is stored in the `currencies` DB table and managed by super-admins
 * via the Currency CRUD API.  On first startup, CurrencyService.seedDefaultCurrencies()
 * populates the table automatically so nothing breaks on a fresh deploy.
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

export const BASE_CURRENCY = 'USD';

/** Rate map shape: target currency code → units per 1 USD */
export interface RateMap {
  [targetCurrency: string]: number;
}
