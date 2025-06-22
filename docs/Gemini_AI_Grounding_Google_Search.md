# Gemini AI: Grounding with Google Search - Reference Guide

**Document Version:** 1.0
**Date:** 2025-06-29
**Author:** StockSage AI Coding Agent

## 1. Introduction

This document serves as the **single source of truth and mandatory reference guide** for implementing AI flows that utilize the "Grounding with Google Search" feature within the StockSage application. Its purpose is to ensure all current and future web-augmented AI features are built with a consistent, proven, and correct architectural pattern.

This guide synthesizes lessons learned from debugging the v3.3 feature, analysis of our own working implementation in `chat-flow.ts`, and the official Google AI API documentation. Adherence to this guide is mandatory to prevent errors related to tool usage and response parsing.

## 2. The Core Concept

"Grounding with Google Search" allows a Genkit AI flow to use Google Search as a tool to answer questions with up-to-date, real-world information. The key challenge is that when a tool is active, the AI model's response type changes from a structured JSON object to a plain text string. Our application, however, requires structured data for processing and display.

The solution is the **"Grounded JSON-in-Text"** pattern, which is the required architecture.

## 3. The "Grounded JSON-in-Text" Architectural Pattern (Mandatory)

This pattern consists of four critical, interconnected steps. All steps must be implemented correctly for the feature to work.

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

## 4. Lessons Learned & Summary

*   **The Root Cause of v3.3.7 Errors:** The primary bug was failing to remove the `outputSchema` from the `ai.defineFlow` definition when adding the `googleSearch` tool to the prompt.
*   **No Special Imports:** The `googleSearch` tool is enabled with a plain object `[{ googleSearch: {} }]`. No special imports are needed.
*   **Follow the Pattern:** The `chat-flow.ts` file provides a working, correct implementation of this architecture. All new grounded search features must replicate this pattern exactly.
*   **Single Responsibility:** When grounding is on, the AI's only responsibility is to find information and return a JSON string. The application's responsibility is to parse and validate it.
```
