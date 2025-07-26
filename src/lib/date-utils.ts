
/**
 * @fileOverview Date and time utility functions.
 */

import { format, addDays, getDay, nextFriday as dateFnsNextFriday, parseISO, subDays } from 'date-fns';

/**
 * Finds the next available expiration date from a list.
 * It finds the first date that is on or after today. If today is an expiration,
 * it prefers the next available date if one exists.
 * @param {string[]} expirationDates An array of sorted date strings ('yyyy-MM-dd').
 * @returns {string | undefined} The next available date, or undefined if none are suitable.
 */
export function findNextAvailableDate(expirationDates: string[]): string | undefined {
  if (!expirationDates || expirationDates.length === 0) {
    return undefined;
  }
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const firstAvailableIndex = expirationDates.findIndex(date => date >= todayStr);

  if (firstAvailableIndex === -1) {
    // No dates are in the future, maybe return the last one? Or none. Undefined is safer.
    return undefined;
  }

  const firstAvailableDate = expirationDates[firstAvailableIndex];
  // If the found date is today, and there's another date after it, prefer the next one.
  if (firstAvailableDate === todayStr && expirationDates.length > firstAvailableIndex + 1) {
    return expirationDates[firstAvailableIndex + 1];
  }
  
  // Otherwise, the first available date is the one to use.
  return firstAvailableDate;
}


/**
 * @deprecated This function uses a hardcoded day-of-the-week assumption and is being replaced by findNextAvailableDate with actual API data.
 * Calculates the nearest Friday expiration date.
 * If today is Friday, it will return next Friday.
 * Otherwise, it returns the upcoming Friday.
 * @returns {string} The next Friday expiration date in 'yyyy-MM-dd' format.
 */
export function calculateNextFridayExpiration(): string {
  const today = new Date();
  let nextFridayDate = dateFnsNextFriday(today);

  // One-time Kludge for July 4th, 2025 Holiday
  // In the future, this should be replaced with a dynamic holiday calendar check.
  const year = nextFridayDate.getFullYear();
  const month = nextFridayDate.getMonth(); // 0-indexed, so July is 6
  const dayOfMonth = nextFridayDate.getDate();

  // Specific check for July 4th, 2025.
  if (year === 2025 && month === 6 && dayOfMonth === 4) {
    // If next Friday is July 4th, use Thursday July 3rd instead.
    nextFridayDate = subDays(nextFridayDate, 1);
  }

  return format(nextFridayDate, 'yyyy-MM-dd');
}

/**
 * Formats a timestamp (epoch milliseconds or ISO string) or Date object to a Pacific Time string.
 * Example output: '06/10/2025, 02:30:00 PM PDT'
 * @param {number | string | Date | null | undefined} timestamp The timestamp (epoch ms or ISO string) or a Date object.
 * @returns {string} The formatted date string in Pacific Time, or "N/A".
 */
export function formatTimestampToPacificTime(timestamp: number | string | Date | null | undefined): string {
  if (timestamp === null || timestamp === undefined || timestamp === "") {
    // If no valid timestamp is provided, return "N/A" directly.
    // Avoid using new Date() here to prevent hydration mismatches.
    return "N/A";
  }
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    
    // Check if the date is valid after parsing/construction
    if (isNaN(date.getTime())) {
        return "N/A";
    }
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', // Common US market time zone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, 
      timeZoneName: 'short',
    });
    
    return formatter.format(date);

  } catch (error) {
    // Fallback for safety, though a specific "N/A" or error string is better
    // if the primary formatting fails for an unexpected reason with a valid-looking input.
    // However, the initial check should catch most problematic inputs.
    return "N/A"; 
  }
}

/**
 * Parses an ISO date string (e.g., from API) and formats it to 'Month Day, Year'.
 * @param {string | null | undefined} isoDateString The ISO date string.
 * @returns {string} Formatted date string or "N/A" if input is invalid.
 */
export function formatDisplayDate(isoDateString?: string | null): string {
  if (!isoDateString) return 'N/A';
  try {
    const date = parseISO(isoDateString);
    if (isNaN(date.getTime())) { // Check for invalid date after parsing
        return 'N/A';
    }
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    // Date parsing error silently handled by returning 'N/A'
    return 'N/A';
  }
}
