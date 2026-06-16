/**
 * formatNumber — generic number formatter (no currency symbol).
 * Max 2 decimal places, trailing zeros removed.
 */
export const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

/**
 * formatCurrency — locale-aware currency formatter.
 *
 * Uses Intl.NumberFormat when a valid currency code is supplied.
 * Falls back to prefixing with the symbol / code for unknown currencies.
 *
 * NOTE: for full CurrencyContext-aware conversion (respecting the user's
 *       preferred currency) use `useCurrencyFormat().format()` in components.
 *       This function is a plain utility for non-hook call sites.
 */
export const formatCurrency = (
  value: number | string | undefined | null,
  currency = 'USD',
): string => {
  const num =
    value === undefined || value === null || value === ''
      ? 0
      : typeof value === 'string'
      ? parseFloat(value)
      : value;

  if (isNaN(num)) return `${currency} 0`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    // Unknown currency code — fallback to plain prefix
    const parts = parseFloat(num.toFixed(2)).toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${currency} ${parts.join('.')}`;
  }
};

/**
 * compactCurrency — formats a monetary value in compact K / M / B notation.
 *
 * Examples (USD):
 *   1_234          → "$1.2K"
 *   1_250_000      → "$1.3M"
 *   2_500_000_000  → "$2.5B"
 *   999            → "$999"
 *
 * The symbol/prefix is derived from Intl when possible; otherwise the raw
 * currency code is prepended.
 */
export const compactCurrency = (
  value: number | string | undefined | null,
  currency = 'USD',
): string => {
  const num =
    value === undefined || value === null || value === ''
      ? 0
      : typeof value === 'string'
      ? parseFloat(value)
      : value;

  if (isNaN(num)) return getCurrencySymbol(currency) + '0';

  const abs  = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const sym  = getCurrencySymbol(currency);

  if (abs >= 1_000_000_000) return `${sign}${sym}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}${sym}${(abs / 1_000).toFixed(1)}K`;

  // Below 1 K — use full formatting
  return formatCurrency(num, currency);
};

/**
 * compactNumber — compact plain number (no currency symbol).
 *
 *   1_234     → "1.2K"
 *   1_500_000 → "1.5M"
 */
export const compactNumber = (value: number | undefined | null): string => {
  if (value == null || isNaN(value)) return '0';
  const abs  = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
};

/**
 * Extract the currency symbol for a given ISO 4217 code.
 * Returns the code itself when no symbol can be determined.
 */
export const getCurrencySymbol = (currency: string): string => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const sym = parts.find(p => p.type === 'currency');
    return sym ? sym.value : currency;
  } catch {
    return currency;
  }
};
