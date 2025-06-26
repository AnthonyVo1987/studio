# Root Cause Analysis Report: Web Search Tool Error (v3.3.16.7.22)

**Document Version:** 2.0
**Date:** 2025-07-23
**Target Application Version Series:** 3.3.16.7.22+
**Status:** FIX IN PROGRESS

## 1. Executive Summary

This report details the findings from a step-by-step root cause analysis for the critical bug preventing the "Web Search AI Chat" from functioning. The primary symptom is a server-side error: **`Unable to determine type of tool: {"googleSearch":{}}`**.

The definitive root cause has been identified as a **critical architectural conflict within the Genkit flow definition** in `src/ai/flows/web-search-chat-flow.ts`. Specifically, the `ai.defineFlow` function wrapper is declared with a structured `outputSchema`, which is mutually exclusive with the `tools` property being used in the `ai.definePrompt` call it contains.

A secondary, but significant, issue was identified in the client-side FSM orchestrator, which contains a race condition causing unstable and duplicated action dispatching. While this client-side instability needs to be addressed for overall application health, it is not the direct source of the tool determination error.

## 2. Symptoms Observed

The analysis was initiated based on the following key symptoms observed in the logs from version `v3.3.16.7.21`:

*   **Primary Error:** The FSM `lastError` state and the `rawTaWebSearchResponseJson` data field both explicitly captured the error message: `Unable to determine type of tool: {"googleSearch":{}}`.
*   **Pipeline Failure:** The automated analysis pipeline correctly dispatched the `technical-analysis-web-search` prompt but failed at that step, never proceeding to the `options-flow-web-search`.
*   **FSM Instability:** The `completedChatPrompts` array in the FSM context variables contained duplicate entries for every non-web-search prompt, indicating a looping or race condition in the client-side orchestrator.

## 3. Comprehensive Execution Trace & Audit Trail

To identify the root cause, a multi-stage audit was performed:

1.  **Log Review:** Initial analysis of client and server logs to identify the primary failure point and secondary symptoms.
2.  **Upstream Audit:** A full trace of the client-side execution path from UI interaction (`MainTabContent.tsx`) through the FSM orchestrator (`stock-analysis-context.tsx`). This identified the race condition in the `useEffect` orchestrator as a major source of instability.
3.  **Downstream Audit:** A full trace of the server-side execution path from the server action (`web-search-chat-action.ts`) through the Genkit flow (`web-search-chat-flow.ts`), cross-referencing against the `docs/Gemini_AI_Grounding_Google_Search.md` guide.
4.  **AI Prompts & Schemas Audit:** A final, targeted audit of the prompt and schema definitions for both the non-grounded and grounded chat flows to check for architectural compliance.

## 4. Root Cause Conclusion

The audit trail provides a definitive conclusion that isolates the direct cause of the `Unable to determine type of tool` error:

**The root cause is a Genkit architectural violation in `src/ai/flows/web-search-chat-flow.ts`.**

The `ai.defineFlow` function is declared with a specific `outputSchema`:
```typescript
const webSearchChatFlow = ai.defineFlow(
  {
    name: 'webSearchChatFlow',
    inputSchema: WebSearchChatInputSchema,
    // This line declares the flow MUST produce a structured object.
    outputSchema: WebSearchChatOutputSchema, 
  },
  async (input) => { /* ... */ }
);
```
However, the `ai.definePrompt` *inside* this flow is correctly configured for tool use, which means it **must** omit the `output` schema and can only produce a text string.
```typescript
const promptOptions: any = {
  // ...
  // This line correctly enables the tool.
  tools: [{ googleSearch: {} }], 
  // This correctly omits the `output` schema.
};
```
This creates a fundamental contradiction: the flow promises to output a structured object but contains a prompt that can only output text due to tool usage. Genkit cannot resolve this conflict and fails before executing the prompt, leading to the observed error.

## 5. Next Steps

This Root Cause Analysis is now complete. The implementation plans have been approved by the project lead. The next step is to generate the code changes to implement the approved fixes.

## 6. Approved Implementation Plan

### Plan A: Fix Genkit Architectural Violation (MUST-HAVE)
*   **Objective:** To resolve the critical `Unable to determine type of tool` error by correcting the Genkit architectural violation in the Web Search AI flow.
*   **Implementation Task:**
    *   **File:** `src/ai/flows/web-search-chat-flow.ts`
    *   **Action:** Locate the `ai.defineFlow` block for `webSearchChatFlow` and **remove the `outputSchema: WebSearchChatOutputSchema,` line entirely**. This resolves the conflict by making the flow's declaration match its tool-using behavior.

### Plan B: Fix FSM Race Condition (NICE-TO-HAVE)
*   **Objective:** To resolve the client-side FSM race condition that causes duplicate chat actions to be dispatched.
*   **Implementation Task:**
    *   **File:** `src/contexts/stock-analysis-context.tsx`
    *   **Actions:**
        1.  Add a new `PIPELINE_PAUSED` state to the `GlobalFsmState` enum.
        2.  Modify the FSM reducer to transition to `PIPELINE_PAUSED` upon successful completion of a custom chat prompt.
        3.  Add a new debouncing `useEffect` hook that triggers on the `PIPELINE_PAUSED` state. This hook will use a `setTimeout` to introduce a brief delay before dispatching an event to transition the FSM back to `AI_TA_CALCULATION_SUCCEEDED`, allowing React state to propagate and preventing the race condition.

## 7. Document Changelog

*   **v2.0 (2025-07-23):** Added approved implementation plans for both the critical architectural fix and the secondary FSM race condition fix. Updated status to "FIX IN PROGRESS".
*   **v1.0 (2025-07-23):** Initial document creation, synthesizing findings from the full root cause analysis.
