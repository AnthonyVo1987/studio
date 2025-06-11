
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
    console.error("Error downloading JSON:", error);
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
    console.error("Error downloading TXT:", error);
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
      console.error("Fallback: Oops, unable to copy", err);
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Async: Could not copy text: ", err);
    return false;
  }
}
