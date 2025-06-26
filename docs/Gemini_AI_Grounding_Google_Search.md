# Gemini AI: Grounding with Google Search - Reference Guide

**Document Version:** 3.0
**Date:** 2025-07-26
**Author:** StockSage AI Coding Agent

## 1. Introduction

This document serves as the **single source of truth and mandatory reference guide** for implementing AI flows that utilize the "Grounding with Google Search" feature within the StockSage application. Its purpose is to ensure all current and future web-augmented AI features are built with a consistent, proven, and correct architectural pattern.

This guide synthesizes lessons learned from debugging the v3.3 feature, analysis of our own working implementation in `chat-flow.ts`, and a review of official Google AI and Genkit documentation. Adherence to this guide is mandatory to prevent errors related to tool usage and response parsing.

## 2. The `googleSearch` Tool: Mandatory Syntax for This Project

There are two syntaxes for enabling the `googleSearch` tool. Due to specific package versions and dependencies within this project, only one is correct and permitted.

### 2.1. The Object Literal Syntax (MANDATORY)

This is the correct and **required** syntax for enabling Google Search in this application. It involves passing a plain object literal inside the `tools` array.

**Correct Usage:**
```typescript
const result = await ai.generate({
  //...
  tools: [{ googleSearch: {} }], 
});
```

### 2.2. The `import` Syntax (PROHIBITED)

The official Genkit documentation may show an `import` pattern. **This pattern is incompatible with our current project environment.**

**Incorrect / Prohibited Usage:**
```typescript
// DO NOT USE THIS PATTERN
import { googleSearch } from '@genkit-ai/googleai'; 

const result = await ai.generate({
  //...
  tools: [googleSearch], // This will cause a build error in our project
});
```

**Reason for Prohibition:** As documented in the project's `CHANGELOG.md` (see `v3.3.16.7.28`), attempting to use the `import { googleSearch }` pattern results in a build failure: `Export 'googleSearch' doesn't exist in target module`. Therefore, the object literal syntax is the only proven and stable method.

## 3. The "Grounded JSON-in-Text" Architectural Pattern

When a feature requires both web search grounding and a structured JSON output, a simple text response is insufficient. The solution is the **"Grounded JSON-in-Text"** pattern, which is the required architecture for this scenario. It consists of four critical, interconnected steps.

### Step 1: Conditional Prompt Definition (`ai.definePrompt`)

The flow must dynamically configure the prompt based on whether grounding is enabled. The key distinction is the **mutual exclusivity of the `tools` and `output` properties**.

*   **When Grounding is OFF:**
    *   The `tools` property is **omitted**.
    *   The `output: { schema: ... }` property is **INCLUDED** to enforce a structured JSON response from the AI.

*   **When Grounding is ON:**
    *   The `tools: [{ googleSearch: {} }]` property is **INCLUDED**.
    *   The `output: { schema: ... }` property is **COMPLETELY OMITTED**.

**Common Pitfall:** The most critical error is including both `tools` and `output: { schema: ... }` in the same prompt definition. This will cause an `Unable to determine type of tool` error or similar API-level failures.

### Step 2: Explicit Prompt Text Instruction

When grounding is enabled, the AI will return a plain text string. To get structured data, the prompt text itself must explicitly instruct the AI to format its *entire response* as a single, valid JSON string conforming to a specific Zod schema.

**Example Prompt Instruction:**
```
"After gathering the data, you MUST format your ENTIRE response as a single, valid JSON string that conforms to the 'MyTargetOutputSchema'. Your entire response MUST start with `{` and end with `}`. Do not include any text, notes, or explanations outside of the JSON structure."
```

### Step 3: Dual-Mode Flow Logic (`ai.defineFlow`)

The main flow logic must be able to handle both the structured JSON from a non-grounded call and the plain text from a grounded call.

**Example Flow Logic:**
```typescript
const myFlow = ai.defineFlow(
  { /* ...inputSchema, outputSchema... */ },
  async (input) => {
    const isGrounded = input.isGroundingEnabled;
    const promptToUse = await getTheCorrectPrompt(isGrounded); // Logic to get prompt from Step 1

    const result = await promptToUse(input);

    if (isGrounded) {
      // Grounded path: Response is in result.text
      const rawTextResponse = result.text;
      if (!rawTextResponse) { throw new Error("Grounded AI call returned no text."); }
      
      // Use a robust parser to extract the JSON from the text
      const jsonString = extractJsonString(rawTextResponse); 
      if (!jsonString) { throw new Error("Could not extract valid JSON from AI's text response."); }

      const parsedData = JSON.parse(jsonString);
      const validatedData = MyTargetOutputSchema.parse(parsedData);
      return validatedData;

    } else {
      // Non-grounded path: Response is already structured in result.output
      if (!result.output) { throw new Error("Non-grounded AI call returned no output object."); }
      return result.output;
    }
  }
);
```

### Step 4: Robust JSON Parsing and Error Handling

Since the grounded path relies on parsing a JSON string from a text response, the logic must be robust.

*   **Use a Helper Function:** Use a utility like `extractJsonString` to reliably find the JSON block within the AI's text response, stripping away any accidental conversational text or markdown fences.
*   **Validate with Zod:** Always parse the resulting JSON string and then validate the object against its corresponding Zod schema (`MyTargetOutputSchema.parse(parsedObject)`). This ensures data integrity before it's passed to the rest of the application.
*   **Handle Errors Gracefully:** The flow must have `try...catch` blocks to handle JSON parsing errors or Zod validation failures, returning a structured error to the client instead of crashing.

## 4. Understanding the Grounding Response & Metadata

When a response is successfully grounded, the API response includes a `groundingMetadata` field alongside the generated text. This structured data is essential for verifying claims and building a rich citation experience in your application.

### Example Metadata Output:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Spain won Euro 2024, defeating England 2-1 in the final."
          }
        ],
        "role": "model"
      },
      "groundingMetadata": {
        "webSearchQueries": [
          "UEFA Euro 2024 winner"
        ],
        "groundingAttributions": [
          {"web": {"uri": "https://www.uefa.com/euro2024/news/028f-1b3294a21855-1f92100a1000-1000--spain-2-1-england-late-oirazabal-goal-wins-euro-2024-for-spai/", "title": "Spain 2-1 England: Late Oyarzabal goal..."}}
        ],
        "groundingSupports": [
          {
            "segment": {"startIndex": 0, "endIndex": 55, "text": "Spain won Euro 2024, defeating England 2-1 in the final."},
            "groundingAttributionIndices": [0]
          }
        ]
      }
    }
  ]
}
```

### Key Metadata Fields:
*   **`webSearchQueries`**: An array of the search queries the model used. This is useful for debugging and understanding the model's reasoning process.
*   **`groundingAttributions`** (or `groundingChunks`): An array of objects containing the web sources (with `uri` and `title`) that the model used to formulate its answer.
*   **`groundingSupports`**: An array of objects that connect segments of the model's response text to the sources in `groundingAttributions`. Each support object links a `segment` (defined by `startIndex` and `endIndex` of the text) to one or more sources via `groundingAttributionIndices`. This is the key to building inline citations.

## 5. Implementation Notes & Lessons Learned

*   **The Root Cause of v3.3.7 Errors:** The primary bug was failing to remove the `outputSchema` from the `ai.defineFlow` definition when adding the `googleSearch` tool to the prompt.
*   **The Root Cause of v3.3.16.7.30 Error:** The error `Cannot read properties of undefined (reading '__action')` was caused by using the prohibited `import` syntax for the tool.
*   **Follow the Pattern:** The `web-search-chat-flow.ts` file provides a working, correct implementation of this architecture. All new grounded search features must replicate this pattern exactly.
*   **Single Responsibility:** When grounding is on, the AI's only responsibility is to find information and return a text response. The application's responsibility is to parse and validate it.

## 6. Document Changelog
*   **v3.0 (2025-07-26):** Consolidated information from all provided official API docs and examples. Added a new section explicitly mandating the use of the `{ googleSearch: {} }` object literal syntax and prohibiting the `import` syntax, with a clear explanation of why. Expanded the `groundingMetadata` section with a new, more detailed example and explanation of fields. Re-numbered sections.
*   **v2.0 (2025-07-03):** Added Section 5 detailing the `groundingMetadata` response object, including an example and explanation of key fields. Renumbered subsequent sections.
*   **v1.0 (2025-06-29):** Initial document creation.
