
/**
 * @fileOverview General string manipulation utilities.
 */

/**
 * Extracts the first valid JSON object string from a larger text block.
 * It looks for the first '{' and the last '}' to determine the JSON boundaries.
 * This is useful for cleaning up responses from LLMs that might include
 * conversational text around a JSON payload.
 *
 * @param {string} text The text containing the JSON string.
 * @returns {string | null} The extracted JSON string, or null if no valid JSON object is found.
 */
export function extractJsonString(text: string): string | null {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    // No valid JSON object markers found
    return null;
  }

  const jsonString = text.substring(startIndex, endIndex + 1);

  try {
    // A final check to ensure what we extracted is actually valid JSON
    JSON.parse(jsonString);
    return jsonString;
  } catch (error) {
    // The substring looked like JSON but failed to parse.
    console.error("extractJsonString: Extracted string failed to parse.", error);
    return null;
  }
}
