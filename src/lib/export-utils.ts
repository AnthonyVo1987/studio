
/**
 * @fileOverview Utility functions for exporting data.
 */

/**
 * Triggers a browser download for the given JSON data.
 * @param {any} jsonData The JSON data (object or array) to download.
 * @param {string} filename The desired filename (e.g., "data.json").
 */
export function downloadJson(jsonData: any, filename: string): void {
  try {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert("Failed to download JSON data. See console for details.");
  }
}

/**
 * Triggers a browser download for the given text data.
 * @param {string} textData The text data to download.
 * @param {string} filename The desired filename (e.g., "logs.txt").
 */
export function downloadTxt(textData: string, filename: string): void {
  try {
    const blob = new Blob([textData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert("Failed to download TXT data. See console for details.");
  }
}


/**
 * Copies the given text to the clipboard.
 * @param {string} text The text to copy.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; 
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Exports data as JSON string
 * @param {any} data The data to export as JSON
 * @returns {string} JSON string representation
 */
export function exportToJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Exports data as CSV string
 * @param {any} data The data to export as CSV
 * @returns {string} CSV string representation
 */
export function exportToCsv(data: any): string {
  if (Array.isArray(data)) {
    // Handle array of objects
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  } else if (typeof data === 'object' && data !== null) {
    // Handle single object - convert to key-value pairs
    const entries = Object.entries(data).map(([key, value]) => [key, value]);
    return [
      'Key,Value',
      ...entries.map(([key, value]) => `"${key}","${typeof value === 'object' ? JSON.stringify(value) : value}"`)
    ].join('\n');
  } else {
    // Handle primitive values
    return `Value\n"${data}"`;
  }
}
