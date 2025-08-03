/**
 * @fileOverview UUID Polyfill - Cross-browser UUID generation
 * 
 * Provides a cross-browser compatible UUID generation utility that falls back
 * to a custom implementation when crypto.randomUUID is not available.
 */

/**
 * Generate a UUID v4 string with cross-browser compatibility
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers or Node.js environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short UUID for cases where a full UUID is not needed
 */
export function generateShortUUID(): string {
  return generateUUID().substring(0, 8);
}

/**
 * Check if crypto.randomUUID is natively supported
 */
export function isCryptoUUIDSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
}