/**
 * @fileOverview Number utility functions.
 */

/**
 * Formats a number to two decimal places. If the input is null or undefined,
 * it returns "N/A" or a specified placeholder.
 * If the input is not a valid number, it also returns the placeholder.
 * @param {number | null | undefined} value The number to format.
 * @param {string} placeholder The string to return if value is null/undefined or not a number. Defaults to "N/A".
 * @returns {string} The formatted number as a string, or the placeholder.
 */
export function formatToTwoDecimals(
  value: number | null | undefined,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return placeholder;
  }
  return value.toFixed(2);
}

/**
 * Formats a number to a string with a specified number of decimal places.
 * If the input is null or undefined, it returns "N/A" or a specified placeholder.
 * @param {number | null | undefined} value The number to format.
 * @param {number} decimalPlaces The number of decimal places.
 * @param {string} placeholder The string to return if value is null/undefined. Defaults to "N/A".
 * @returns {string} The formatted number as a string, or the placeholder.
 */
export function formatNumber(
  value: number | null | undefined,
  decimalPlaces: number = 2,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return placeholder;
  }
  return value.toFixed(decimalPlaces);
}


/**
 * Formats a number into a currency string (e.g., $1,234.50).
 * If the input is null or undefined, it returns "N/A" or a specified placeholder.
 * @param {number | null | undefined} value The number to format.
 * @param {string} currencySymbol The currency symbol to prefix. Defaults to "$".
 * @param {string} placeholder The string to return if value is null/undefined. Defaults to "N/A".
 * @returns {string} The formatted currency string, or the placeholder.
 */
export function formatCurrency(
  value: number | null | undefined,
  currencySymbol: string = "$",
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return placeholder;
  }
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formattedValue}`;
}

/**
 * Formats a number as a percentage string (e.g., 12.34%).
 * If the input is null or undefined, it returns "N/A" or a specified placeholder.
 * The input value should be the actual percentage value (e.g., 12.34 for 12.34%).
 * @param {number | null | undefined} value The percentage value.
 * @param {number} decimalPlaces The number of decimal places for the percentage. Defaults to 2.
 * @param {string} placeholder The string to return if value is null/undefined. Defaults to "N/A".
 * @returns {string} The formatted percentage string, or the placeholder.
 */
export function formatPercentage(
  value: number | null | undefined,
  decimalPlaces: number = 2,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return placeholder;
  }
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Formats a large number into a compact representation (e.g., 1.2M, 3.5B).
 * If the input is null or undefined, it returns "N/A" or a specified placeholder.
 * @param {number | null | undefined} value The number to format.
 * @param {number} precision Number of decimal places for the compact form. Defaults to 1.
 * @param {string} placeholder The string to return if value is null/undefined. Defaults to "N/A".
 * @returns {string} The compact formatted number string, or the placeholder.
 */
export function formatCompactNumber(
  value: number | null | undefined,
  precision: number = 1,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
    return placeholder;
  }

  const absValue = Math.abs(value);

  if (absValue < 1e3) { // Less than 1,000
    return value.toString();
  } else if (absValue < 1e6) { // Less than 1,000,000 (thousands)
    return (value / 1e3).toFixed(precision) + 'K';
  } else if (absValue < 1e9) { // Less than 1,000,000,000 (millions)
    return (value / 1e6).toFixed(precision) + 'M';
  } else if (absValue < 1e12) { // Less than 1,000,000,000,000 (billions)
    return (value / 1e9).toFixed(precision) + 'B';
  } else { // Trillions and above
    return (value / 1e12).toFixed(precision) + 'T';
  }
}
