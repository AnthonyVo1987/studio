
/**
 * @fileOverview Date and time utility functions.
 */

import { format, addDays, getDay, nextFriday as dateFnsNextFriday, parseISO } from 'date-fns';

/**
 * Calculates the nearest Friday expiration date.
 * If today is Friday, it will return next Friday.
 * Otherwise, it returns the upcoming Friday.
 * @returns {string} The next Friday expiration date in 'yyyy-MM-dd' format.
 */
export function calculateNextFridayExpiration(): string {
  const today = new Date();
  let nextFridayDate = dateFnsNextFriday(today);
  return format(nextFridayDate, 'yyyy-MM-dd');
}

/**
 * Formats a timestamp (epoch milliseconds or ISO string) or Date object to a Pacific Time string.
 * Example output: '2024-06-10 14:30:00 PDT'
 * @param {number | string | Date | null | undefined} timestamp The timestamp (epoch ms or ISO string) or a Date object.
 * @returns {string} The formatted date string in Pacific Time, or "N/A".
 */
export function formatTimestampToPacificTime(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return "N/A";
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Use AM/PM for clarity
      timeZoneName: 'short',
    });
    
    return formatter.format(date);

  } catch (error) {
    console.error("Error formatting timestamp to Pacific Time:", error);
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    try {
      return format(date, "yyyy-MM-dd HH:mm:ss 'UTC'");
    } catch (e) {
      return "N/A";
    }
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
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.warn("Failed to parse or format display date:", isoDateString, error);
    return 'N/A';
  }
}
