
/**
 * @fileOverview General string manipulation utilities.
 */

import { AugmentedTaSearchOutputSchema } from '@/ai/schemas/augmented-ta-search-schemas';
import { AugmentedOptionsSearchOutputSchema } from '@/ai/schemas/augmented-options-search-schemas';
import { z } from 'zod';

/**
 * Extracts the first valid JSON object string from a larger text block.
 * It looks for the first '{' and the last '}' to determine the JSON boundaries.
 * This is useful for cleaning up responses from LLMs that might include
 * conversational text or markdown code fences around a JSON payload.
 *
 * @param {string} text The text containing the JSON string.
 * @returns {string | null} The extracted JSON string, or null if no valid JSON object is found.
 */
export function extractJsonString(text: string): string | null {
  // First, find the start and end of the potential JSON block
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

/**
 * Formats a raw AI text response, which might contain a JSON block, into user-friendly markdown.
 * @param rawTextResponse The raw text from the AI.
 * @param promptName The name of the prompt used, to determine formatting.
 * @param ticker The stock ticker for context.
 * @returns A formatted markdown string.
 */
export function formatResponseToMarkdown(
  rawTextResponse: string,
  promptName?: string,
  ticker?: string
): string {
  const jsonString = extractJsonString(rawTextResponse);

  if (!jsonString) {
    // If no JSON is found, return the raw text as is.
    return rawTextResponse;
  }

  try {
    const parsedData = JSON.parse(jsonString);

    if (promptName === 'technical-analysis-web-search') {
      const data = AugmentedTaSearchOutputSchema.parse(parsedData);
      let md = `**Web Search: Technical Analysis for ${ticker || 'Stock'}**\n\n`;
      md += `- 📈 **ATR-14:** ${data.averageTrueRange14 ?? 'Not found'}\n\n`;
      md += `- 📊 **Bollinger Bands:** Upper: ${data.bollingerBands?.upper ?? 'N/A'}, Middle: ${data.bollingerBands?.middle ?? 'N/A'}, Lower: ${data.bollingerBands?.lower ?? 'N/A'}\n\n`;
      md += `-  Fibonacci Levels: ${data.fibonacciRetracement ? Object.entries(data.fibonacciRetracement).map(([key, value]) => `${key}: $${value}`).join(', ') : 'Not found'}`;
      return md;
    }
    
    if (promptName === 'options-flow-web-search') {
      const data = AugmentedOptionsSearchOutputSchema.parse(parsedData);
      let md = `**Web Search: Options Metrics for ${ticker || 'Stock'}**\n\n`;
      md += `- 🎯 **Max Pain:** ${data.maxPain ?? 'Not found'}\n\n`;
      md += `- 🌊 **Gamma Exposure (GEX):** ${data.gammaExposure ?? 'Not found'}\n\n`;
      md += `- ⚖️ **Put/Call Ratio:** ${data.putCallRatio ?? 'Not found'}\n\n`;
      md += `- 📉 **IV Skew:** ${data.ivSkew ?? 'Not found'}\n\n`;
      md += `- 🌡️ **IV Rank:** ${data.ivRank ?? 'Not found'}%\n\n`;
      md += `-  percentile **IV Percentile:** ${data.ivPercentile ?? 'Not found'}th\n\n`;
      return md;
    }

    // For other cases or if promptName doesn't match, return the original raw text.
    return rawTextResponse;

  } catch (error) {
    console.error(`formatResponseToMarkdown: Failed to parse or format JSON for prompt '${promptName}'. Error:`, error);
    // Fallback to returning the raw text if parsing/formatting fails.
    return rawTextResponse;
  }
}
