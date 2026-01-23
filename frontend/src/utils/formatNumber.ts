
/**
 * Formats a number to have a maximum of 2 decimal places.
 * If the number is an integer, it returns no decimal places.
 * If the number has decimals, it rounds to at most 2 decimal places.
 * Trailing zeros are removed.
 * 
 * Examples:
 * formatNumber(100) -> "100"
 * formatNumber(100.5) -> "100.5"
 * formatNumber(100.567) -> "100.57"
 * formatNumber(100.50) -> "100.5"
 */
export const formatNumber = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Use Intl.NumberFormat for locale-aware formatting if desired, 
  // but for the specific requirement of max 2 decimals without trailing zeros:
  
  // Method 1: remove trailing zeros automatically with parseFloat
  return parseFloat(num.toFixed(2)).toString();
  
  // Alternatively, providing locale string with options:
  // return num.toLocaleString('en-US', {
  //   maximumFractionDigits: 2,
  //   minimumFractionDigits: 0
  // });
};

/**
 * Formats a currency value
 */
export const formatCurrency = (value: number | string | undefined | null, currency = 'USD'): string => {
  const formattedNum = formatNumber(value);
  // Add commas for thousands
  const parts = formattedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return `$${parts.join('.')}`;
};
