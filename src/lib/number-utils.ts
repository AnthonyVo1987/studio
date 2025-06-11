
/**
 * @fileOverview Number utility functions.
 */

/**
 * Formats a number to a string with a specified number of decimal places.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * @param {number | string | null | undefined} value The number or string representation of a number to format.
 * @param {number} decimalPlaces The number of decimal places. Defaults to 2.
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @returns {string} The formatted number as a string, or the placeholder.
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimalPlaces: number = 2,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }
  return num.toFixed(decimalPlaces);
}


/**
 * Formats a number to two decimal places. Alias for formatNumber with 2 decimal places.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * @param {number | string | null | undefined} value The number or string representation of a number to format.
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @returns {string} The formatted number as a string, or the placeholder.
 */
export function formatToTwoDecimals(
  value: number | string | null | undefined,
  placeholder: string = "N/A"
): string {
  return formatNumber(value, 2, placeholder);
}


/**
 * Formats a number into a currency string (e.g., $1,234.50).
 * Ensures two decimal places.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * @param {number | string | null | undefined} value The number or string representation of a number to format.
 * @param {string} currencySymbol The currency symbol to prefix. Defaults to "$".
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @returns {string} The formatted currency string, or the placeholder.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currencySymbol: string = "$",
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }
  // Use toLocaleString for grouping, then ensure two decimal places manually if needed,
  // as toLocaleString's decimal handling can vary. Better to use toFixed for precision.
  const fixedNum = num.toFixed(2);
  const parts = fixedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add thousand separators
  return `${currencySymbol}${parts.join('.')}`;
}

/**
 * Formats a number as a percentage string (e.g., 12.34%).
 * Ensures two decimal places for the percentage value.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * The input value should be the actual percentage value (e.g., 12.34 for 12.34%).
 * @param {number | string | null | undefined} value The percentage value.
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @returns {string} The formatted percentage string, or the placeholder.
 */
export function formatPercentage(
  value: number | string | null | undefined,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }
  return `${num.toFixed(2)}%`;
}

/**
 * Formats a large number into a compact representation (e.g., 1.2M, 3.5B).
 * Ensures one decimal place for the compact form, but only if it's not a whole number.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * @param {number | string | null | undefined} value The number or string representation of a number to format.
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @returns {string} The compact formatted number string, or the placeholder.
 */
export function formatCompactNumber(
  value: number | string | null | undefined,
  placeholder: string = "N/A"
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }

  const absValue = Math.abs(num);
  let formattedNum;

  if (absValue < 1e3) { // Less than 1,000
    formattedNum = num.toFixed(0); // Show as whole number if less than 1K
  } else if (absValue < 1e6) { // Thousands
    formattedNum = (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (absValue < 1e9) { // Millions
    formattedNum = (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absValue < 1e12) { // Billions
    formattedNum = (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  } else { // Trillions
    formattedNum = (num / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  }
  return formattedNum;
}
