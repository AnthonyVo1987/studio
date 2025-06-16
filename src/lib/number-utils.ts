
/**
 * @fileOverview Number utility functions.
 */

/**
 * Rounds a number to a specified number of decimal places.
 * Returns the number type.
 * @param {number | string | null | undefined} value The number to round.
 * @param {number} decimalPlaces The number of decimal places. Defaults to 2.
 * @returns {number | null | undefined} The rounded number or original value if not a number.
 */
export function roundNumber(value: number | string | null | undefined, decimalPlaces: number = 2): number | null | undefined {
  if (value === null || value === undefined) return undefined;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return undefined;
  }
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(num * factor) / factor;
}


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
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }
  // Now num is definitely a number
  const factor = Math.pow(10, decimalPlaces);
  const roundedNum = Math.round(num * factor) / factor;
  return roundedNum.toFixed(decimalPlaces);
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
 * Formats a number into a currency string (e.g., $1,234.50 or $160 for strikes).
 * For strike prices: no decimals if it's a whole number, otherwise shows necessary decimals (up to 2).
 * For other currency: ensures two decimal places.
 * If the input is null or undefined, or not a valid number,
 * it returns "N/A" or a specified placeholder.
 * @param {number | string | null | undefined} value The number or string representation of a number to format.
 * @param {string} currencySymbol The currency symbol to prefix. Defaults to "$".
 * @param {string} placeholder The string to return if value is null/undefined or not a valid number. Defaults to "N/A".
 * @param {boolean} isStrikePrice Whether this is for formatting a strike price. Defaults to false.
 * @returns {string} The formatted currency string, or the placeholder.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currencySymbol: string = "$",
  placeholder: string = "N/A",
  isStrikePrice: boolean = false
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }

  let formattedNumStr;
  if (isStrikePrice) {
    if (num % 1 === 0) {
      formattedNumStr = num.toFixed(0);
    } else {
      const s = num.toString();
      const decimalPart = s.split('.')[1];
      if (decimalPart && decimalPart.length === 1 && (decimalPart === '5' || decimalPart === '0')) {
        formattedNumStr = num.toFixed(1);
      } else {
        formattedNumStr = num.toFixed(2);
      }
    }
  } else {
    formattedNumStr = num.toFixed(2);
  }

  const parts = formattedNumStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currencySymbol}${parts.join('.')}`;
}

/**
 * Formats a number as a percentage string.
 * If the input is null/undefined or not a valid number, returns placeholder.
 * Input value should be actual percentage (e.g., 12.34 for 12.34%) if alreadyPercent is true,
 * or decimal (e.g., 0.1234 for 12.34%) if alreadyPercent is false.
 * @param {number | string | null | undefined} value The percentage value.
 * @param {string} placeholder String for invalid input. Defaults to "N/A".
 * @param {boolean} alreadyPercent True if value is 50 for 50%; false (default) if value is 0.5 for 50%.
 * @param {number | undefined} decimalPlaces Number of decimal places. Defaults to 0 (whole number).
 * @returns {string} Formatted percentage string or placeholder.
 */
export function formatPercentage(
  value: number | string | null | undefined,
  placeholder: string = "N/A",
  alreadyPercent: boolean = false,
  decimalPlaces?: number,
): string {
  if (value === null || value === undefined) {
    return placeholder;
  }
  let num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return placeholder;
  }
  if (!alreadyPercent) {
    num = num * 100;
  }

  const dp = decimalPlaces === undefined || decimalPlaces < 0 ? 0 : decimalPlaces;

  if (dp === 0) {
    return `${Math.round(num)}%`;
  } else {
    return `${num.toFixed(dp)}%`;
  }
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

  if (absValue < 1e3) {
    formattedNum = num.toFixed(0);
  } else if (absValue < 1e6) {
    formattedNum = (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (absValue < 1e9) {
    formattedNum = (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absValue < 1e12) {
    formattedNum = (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  } else {
    formattedNum = (num / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  }
  return formattedNum;
}
