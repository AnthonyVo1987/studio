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
  // date-fns getDay(): 0 (Sunday) to 6 (Saturday). Friday is 5.
  // dateFnsNextFriday will return the *next* Friday. If today is Friday, it returns the *following* Friday.
  // If we want "this Friday" if today is Mon-Fri, and "next Friday" if today is Sat/Sun,
  // we might need more specific logic.
  // The PRD states "Fetch for the nearest Friday expiration."
  // Let's assume "nearest Friday in the future".
  // If today is Mon-Thu, it's this week's Friday.
  // If today is Fri, Sat, Sun, it's next week's Friday.

  let nextFridayDate = dateFnsNextFriday(today);

  // If today is Friday, dateFnsNextFriday gives the *following* Friday.
  // If "nearest" means this Friday if not passed, we adjust.
  // However, option contracts usually expire at end of day. If it's Friday morning,
  // that Friday's contracts are still active.
  // For simplicity and to align with "nearest Friday expiration" (implying future),
  // using dateFnsNextFriday which always gives a future Friday seems robust.
  // If current day is Friday and we want *this* Friday:
  if (getDay(today) === 5) { // 5 is Friday
    // if we need *this* Friday for an expiration and it hasn't passed market close.
    // For now, "next Friday" from date-fns is safer for expirations.
    // To get *this* Friday if today is Friday, we would just use `today`.
    // The Polygon API options chain endpoint usually wants an exact expiration date.
    // "Nearest Friday expiration" implies looking for future ones.
    // So, if today is Friday, it should be the next Friday.
    // This is already handled by dateFnsNextFriday.
  }


  return format(nextFridayDate, 'yyyy-MM-dd');
}

/**
 * Formats a timestamp (epoch milliseconds) or Date object to a Pacific Time string.
 * Example output: '2024-06-10 14:30:00 PDT'
 * @param {number | Date} timestamp The timestamp in epoch milliseconds or a Date object.
 * @returns {string} The formatted date string in Pacific Time.
 */
export function formatTimestampToPacificTime(timestamp: number | Date): string {
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    // Note: 'America/Los_Angeles' covers PST/PDT automatically.
    // Date.toLocaleString can be unreliable across environments for specific timezone formatting.
    // For robust timezone handling, date-fns-tz is usually recommended, but it's not in deps.
    // Using a common format, but timezone name might be system-dependent.
    
    // A simple approach if date-fns-tz is not available:
    // This will use the browser's/server's interpretation of 'America/Los_Angeles'
    // if supported by Intl.DateTimeFormat.
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // 24-hour format
      timeZoneName: 'short',
    });
    
    const parts = formatter.formatToParts(date);
    const findPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';

    // Reconstruct in a more standard format if Intl gives varied results
    // e.g. MM/DD/YYYY, HH:MM:SS TZN
    // We want YYYY-MM-DD HH:MM:SS TZN
    const year = findPart('year');
    const month = findPart('month');
    const day = findPart('day');
    const hour = findPart('hour');
    const minute = findPart('minute');
    const second = findPart('second');
    const timeZoneName = findPart('timeZoneName');

    return `${year}-${month}-${day} ${hour}:${minute}:${second} ${timeZoneName}`;

  } catch (error) {
    console.error("Error formatting timestamp to Pacific Time:", error);
    // Fallback to UTC or simple ISO string if formatting fails
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    return format(date, "yyyy-MM-dd HH:mm:ss 'UTC'");
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
    return 'N/A';
  }
}
