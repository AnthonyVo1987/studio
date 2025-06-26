# Root Cause Analysis Report: Web Search Tool Error & FSM Instability

**Document Version:** 3.0
**Date:** 2025-07-24
**Target Application Version Series:** 3.3.16.7.25+
**Status:** FIX IN PROGRESS

## 1. Executive Summary

This report details the findings from a series of step-by-step root cause analyses for the critical bug preventing the "Web Search AI Chat" from functioning and causing general pipeline instability. The primary symptom is a server-side error: **`Unable to determine type of tool: {"googleSearch":{}}`**. A secondary, but causally related, symptom is the repeated, duplicate execution of automated chat prompts, visible in the FSM state logs.

The definitive root cause has been identified as a **foundational architectural flaw in the client-side FSM orchestrator** within `src/contexts/stock-analysis-context.tsx`. The orchestrator's design, based on a `useEffect` hook with a large and complex dependency array, is inherently non-deterministic and creates a severe race condition.

This client-side instability is the direct cause of the downstream server-side errors. The application is attempting to invoke server actions from a corrupted, looping state, leading to the Genkit tool determination failure. Previous attempts to fix this with isolated patches (`v3.3.16.7.22` and `v3.3.16.7.23`) were insufficient as they did not address this core architectural problem.

## 2. Symptoms Observed

*   **Primary Error:** The FSM `lastError` state and the `rawTaWebSearchResponseJson` data field both explicitly captured the error message: `Unable to determine type of tool: {"googleSearch":{}}`.
*   **Pipeline Failure:** The automated analysis pipeline correctly dispatched the `technical-analysis-web-search` prompt but failed at that step, never proceeding to subsequent steps.
*   **FSM Instability (Key Clue):** The `completedChatPrompts` array in the FSM context variables contained duplicate entries for every non-web-search prompt (e.g., `["stock-trader-takeaways", "stock-trader-takeaways"]`), indicating a looping or race condition in the client-side orchestrator. This symptom persisted even after the `PIPELINE_PAUSED` fix attempt.

## 3. Comprehensive Execution Trace & Audit Trail

A full, top-down execution trace was performed from the client UI to the server-side AI flows.

*   **Client-Side Audit (`MainTabContent.tsx` -> `StockAnalysisContext.tsx`):**
    *   The `useEffect` orchestrator in `StockAnalysisContext` has a dependency array that includes both FSM state variables and data state variables (e.g., `_aiKeyTakeawaysJson`, `_aiOptionsAnalysisJson`).
    *   When an async server action completes and updates one of these data state variables, it triggers the orchestrator to run again.
    *   Crucially, the orchestrator re-runs *before* React has fully processed and committed all state updates from the previous run (like updating the `completedChatPrompts` array).
    *   This causes the orchestrator to read a *stale* version of the `completedChatPrompts` array, leading it to believe a step has not yet been run, and it dispatches the action again. This is the source of the loop and instability.

*   **Server-Side Audit (`web-search-chat-action.ts` -> `web-search-chat-flow.ts`):**
    *   The `web-search-chat-flow` itself is architecturally correct for tool use (it uses `tools` and omits a flow-level `outputSchema`).
    *   The error it produces is a valid response to being invoked under unstable or malformed conditions originating from the client's looping state.

## 4. Root Cause Conclusion

**The root cause is the non-deterministic, dependency-driven design of the FSM orchestrator in `src/contexts/stock-analysis-context.tsx`, which creates a race condition.**

The `PIPELINE_PAUSED` fix was a superficial patch that failed because it did not change the fundamental problem: the orchestrator's logic was being re-evaluated based on a complex set of changing dependencies, leading to unpredictable and repeated execution with stale state. The solution is not to add more pauses but to re-architect the orchestrator to be inherently sequential and deterministic.

## 5. Next Steps

This Root Cause Analysis is now complete. The implementation plans have been approved by the project lead. The next step is to generate the code changes to implement the approved fixes on an experimental branch. All existing diagnostic logs will be maintained, and more will be added during implementation to verify the new execution flow.

## 6. Approved Implementation Plan

### **Plan A: Re-architect FSM Orchestrator for Deterministic Execution**
*   **Objective:** To resolve the client-side FSM race condition by re-architecting the pipeline execution logic to be sequential and deterministic, removing the reliance on a complex `useEffect` dependency array.
*   **Implementation Task:**
    *   **File:** `src/contexts/stock-analysis-context.tsx`
    *   **Actions:**
        1.  **Simplify Orchestrator `useEffect` Dependencies:** The main orchestrator's dependency array will be pruned to react **only** to changes in the FSM's `current` state. This is the most critical step to break the race condition loop.
        2.  **Adopt `async/await` for Server Actions:** The logic for triggering the automated analysis steps will be moved inside the orchestrator. It will call server actions directly using an `async/await` pattern.
        3.  **Enforce Sequential Execution:** This architectural change will guarantee that the action for "Options Trader Takeaways" cannot begin until the `await` call for "Stock Trader Takeaways" has fully resolved and its resulting FSM state transition has been committed.
        4.  **Remove Obsolete Workarounds:** The `PIPELINE_PAUSED` state and its related `useEffect` hook will be removed, as they are a failed workaround made unnecessary by the new architecture.

## 7. Document Changelog

*   **v3.0 (2025-07-24):** Updated report to reflect the definitive root cause being the FSM orchestrator's race condition. Superseded previous analysis. Added new, comprehensive re-architecture plan.
*   **v2.0 (2025-07-23):** Added approved implementation plans for both the critical architectural fix and the secondary FSM race condition fix. Updated status to "FIX IN PROGRESS".
*   **v1.0 (2025-07-23):** Initial document creation, synthesizing findings from the full root cause analysis.
