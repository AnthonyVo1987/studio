# Debugging Reference: Stock Analysis Pipeline Loops (ERROR_PIPELINE_LOOP)

This document serves as a living reference for understanding and debugging issues related to pipeline loops, specifically the `ERROR_PIPELINE_LOOP` state, within the StockSage AI stock analysis application. It contains an AI coding agent's digested understanding of the system's architecture, the expected flow of the "Analyze Stock" pipeline, key components, state transitions, and identified potential failure points.

This document is intended to be updated as new bug reports are analyzed and new discoveries are made.

---

## 4. Bug Report Operating Procedure

To ensure a thorough and systematic approach to debugging and fixing `ERROR_PIPELINE_LOOP` issues (and potentially other complex pipeline failures), we will follow this operating procedure for each bug report:

1.  **Review User Bug Report Symptom/Issues(s):** The AI Agent will carefully read and analyze the user-provided description of the symptoms and observed issues related to the `ERROR_PIPELINE_LOOP` state or other pipeline failures.
2.  **Root Cause Analysis - Code Execution Flow Audit:** The AI Agent will leverage the comprehensive context and execution flow trace documented in this file (Sections 1-3), along with reviewing relevant code files (using their full absolute paths like `/src/path/to/file.ts`), to audit the *actual* execution flow based on the reported symptoms. The goal is to pinpoint the potential root cause(s) of the observed behavior by comparing it against the expected flow and identifying deviations, unexpected state transitions, action failures, or data issues. This step emphasizes understanding *why* the `ERROR_PIPELINE_LOOP` guard might be triggered or where the pipeline is otherwise failing to proceed as expected.
3.  **Propose Bug Fix Scope of Changes:** Based on the identified root cause(s), the AI Agent will propose a specific scope of changes needed to fix the bug. This includes identifying the file(s) to modify (using full absolute paths) and describing the nature of the code changes required.
4.  **User Review and Approval:** The AI Agent will present the Root Cause Analysis and Proposed Bug Fix Scope to the user for review.
5.  **User Feedback/Rejection:** The user may provide feedback, request further analysis, or reject the proposed root cause or scope if it doesn't align with their understanding or further observations. The AI Agent will incorporate this feedback and refine the analysis/proposal.
6.  **User Approval - Proceed with Implementation:** ONLY after the user explicitly approves the Root Cause Analysis and Proposed Bug Fix Scope, the AI Agent will proceed with implementing the necessary code changes.

This procedure ensures that we collaboratively agree on the underlying problem before attempting a solution, minimizing the risk of addressing only symptoms or introducing new issues. To maintain clear version tracking of applied fixes, an additional step is included:

---

5.  **Version Increment for Approved Fixes:** Upon user approval of the Root Cause Analysis and Proposed Bug Fix Scope, and *before* implementing the code changes, the AI Agent will update the `appVersion` in the `/src/config/app-metadata.json` file. The last number in the `appVersion` string (the bug fix iteration) will be incremented to match the Bug Report number being addressed (e.g., for [BUG REPORT 6], increment `v3.x.y.z` to `v3.x.y.6`). This ensures the application version reflects the applied fix.
6.  **Implement Code Changes:** After versioning is updated, the AI Agent will implement the approved code changes, using full absolute paths for file references.
7.  **Verify Fix:** The AI Agent will verify the fix by running the application and observing the expected behavior (e.g., the pipeline no longer getting stuck in `ERROR_PIPELINE_LOOP`). If direct code read is possible, the AI Agent will also audit the modified file(s) for correctness.
8.  **Generate Commit Details and Document Updates:** Upon user request to close or commit a bug report, the AI Agent will automatically generate a one-line commit detail message for the fix and update the `/docs/Debugging_Pipeline_Loops.md` document to include this commit message and mark the bug report as CLOSED, noting the version the fix was implemented in.

---




## 5. Bug Reports Tracking

This section will list the bug reports related to `ERROR_PIPELINE_LOOP`.
 
*   **[BUG REPORT 6]:** App stuck in ERROR_PIPELINE_LOOP after Analyze Stock button press. **Status: CLOSED**
    *   **Fix Version:** v3.3.16.4.6
    *   **Commit Details:** `fix(fsm): Resolve ERROR_PIPELINE_LOOP by guarding against re-dispatch of pending custom analysis steps (v3.3.16.4.6)`
    *   **Commit Details:** `[3.3.16.4.6] fix(fsm): Resolve ERROR_PIPELINE_LOOP by guarding against re-dispatch of pending custom analysis steps`
    *   **Symptom(s):** App remains in ERROR_PIPELINE_LOOP after Analyze Stock button press. FSM state snapshot shows current and previous state as ERROR_PIPELINE_LOOP. `lastError` indicates "Potential loop detected for step 'kt_NVDA'." All analysis toggles were enabled.
    *   **Root Cause Analysis:** The FSM is correctly triggering the ERROR_PIPELINE_LOOP guard because it detected an attempt to process the 'kt_NVDA' step (AI Key Takeaways) when this step was already marked as completed in the `completedSteps` Set. The logs show the pipeline progressed successfully through data fetch and AI TA, reaching the point where it should initiate custom analysis. The issue is likely a race condition or synchronization problem in the Orchestrator (`StockAnalysisContext` useEffect) where it re-dispatches the trigger event for the first custom step (Key Takeaways in this case, as toggled) before the FSM state update from the *initial* dispatch of that trigger is fully processed and reflected in the Orchestrator's dependencies. This causes the reducer's `checkStepAndGuard` to see the step as already 'completed' (added by the first trigger), leading to the loop.
    *   **Bug Fix Scope of Changes:** Modify the Orchestrator useEffect in `/src/contexts/stock-analysis-context.tsx`. Within the `dispatchNextCustomAction` function, add checks before dispatching trigger events (`TRIGGER_MANUAL_KEY_TAKEAWAYS`, `TRIGGER_MANUAL_OPTIONS_ANALYSIS`, `SUBMIT_CHAT_MESSAGE`) to ensure the corresponding `useActionState` pending flag (`isPerformAiAnalysisPending`, `isPerformAiOptionsAnalysisPending`, `isChatPending`) is false. This will prevent the Orchestrator from re-dispatching a trigger if the action is already in progress, allowing the FSM and action states to synchronize correctly.

---
*   **[BUG REPORT 7]:** AI Key Takeaways ERROR_PIPELINE_LOOP **Status: OPEN**
    *   **Fix Version:** v3.3.16.4.7
    *   **Commit Details:** Pending
    *   **Document Placeholder:** [BUG REPORT 7]
    *   **Symptom(s):** Application is stuck in the `ERROR_PIPELINE_LOOP` state. The FSM state snapshot shows both `previous` and `current` states as `ERROR_PIPELINE_LOOP`. The `lastError` in `globalFsmContextVariables` is `"Potential loop detected for step 'kt_NVDA'. Aborting action."` All analysis toggles, including AI Key Takeaways, are enabled. The application version is `v3.3.16.4.6`.
    *   **Root Cause Analysis:** The symptom is identical to [BUG REPORT 6], even with the fix for [BUG REPORT 6] implemented in version `v3.3.16.4.6`. This confirms that the previous fix, which guarded against re-dispatching *pending* actions within the Orchestrator's `dispatchNextCustomAction`, did not address the core issue causing the loop in this specific scenario. The FSM guard `checkStepAndGuard` is still triggering because the key 'kt_NVDA' is unexpectedly present in the `state.variables.completedSteps` Set when the initial `TRIGGER_MANUAL_KEY_TAKEAWAYS` event for this pipeline run is processed. While `resetForNewAnalysis` is expected to clear this Set at the start of a full analysis, and the Orchestrator is designed to dispatch the custom analysis initiation only once after the `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` state is reached, a subtle race condition likely exists. The most probable cause is that the Orchestrator's effect, upon detecting the transition to `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START`, triggers the `dispatchNextCustomAction('base')` call. In a specific, narrow timing window, this dispatch might occur multiple times or be processed in a way that the reducer processes the event, adds 'kt_NVDA' to `completedSteps`, but another dispatch of the same event arrives *before* the Orchestrator's internal state or the useEffect dependencies fully synchronize with the state update that includes 'kt_NVDA' in `completedSteps`. This leads the `checkStepAndGuard` to incorrectly believe a loop is occurring on the seemingly "first" dispatch of the event in that state transition, even though the *actual* first dispatch has already been processed by the reducer.
    *   **Proposed Bug Fix Scope of Changes:** Implement a mechanism within the Orchestrator's effect to ensure that the initiation of the custom analysis sequence (`dispatchNextCustomAction('base')`) occurs only *once* per transition into the `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` state for the 'standard' pipeline profile. This can be achieved by introducing a `useRef` flag to track whether the custom analysis initiation has already been dispatched for the current analysis run.
        *   **File to Modify:** `/src/contexts/stock-analysis-context.tsx`
        *   **Description of Changes:**
            1.  Add a `useRef` named `customAnalysisInitiatedRef` initialized to `false` within the `StockAnalysisProvider`.
            2.  In the `resetForNewAnalysis` function, set `customAnalysisInitiatedRef.current = false`.
            3.  In the Orchestrator's `useEffect` that handles state transitions, locate the conditional block for `state.current === GlobalFsmState.PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` and `state.variables.activePipelineProfile === 'standard'`.
            4.  Wrap the call to `dispatchNextCustomAction('base')` within an additional check: `if (!customAnalysisInitiatedRef.current) { ... }`.
            5.  Inside this `if` block, set `customAnalysisInitiatedRef.current = true` immediately before dispatching `dispatchNextCustomAction('base')`.
            6.  Add appropriate debug log messages to indicate when the custom analysis initiation is dispatched and when a re-initiation attempt is guarded against.

---

*   **[BUG REPORT 8]:** AI Key Takeaways ERROR_PIPELINE_LOOP #2 **Status: OPEN**
    *   **Fix Version:** v3.3.16.4.8
    *   **Commit Details:** `[3.3.16.4.8] fix(fsm): Resolve AI Key Takeaways ERROR_PIPELINE_LOOP #2 with 100ms delay between stages`
    *   **Document Placeholder:** [BUG REPORT 8]
    *   **Status:** CLOSED
    *   **Symptom(s):** The application is in the `ERROR_PIPELINE_LOOP` state, specifically at the AI Key Takeaways stage, with the error message "Potential loop detected for step 'kt_NVDA'. Aborting action." Application version is `v3.3.16.4.7`.
        *   `appVersion`: `v3.3.16.4.7`. This indicates the fix for [BUG REPORT 7] was in the application version used for this report.
        *   `fsmStatesSnapshot`: `globalApplicationFSM`: `ERROR_PIPELINE_LOOP`, `globalFsmFlags`: all analysis/web search toggles true, `globalFsmContextVariables`: `activeTicker`="NVDA", `userInputTicker`="NVDA", `lastError`="Potential loop detected for step 'kt_NVDA'. Aborting action.", `completedSteps`={}.
        *   `logs`: Logs show progression through data fetching and AI TA calculation, reaching `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` before `ERROR_PIPELINE_LOOP` occurs with the 'kt_NVDA' loop detection message. Log ID 120 shows `[Orchestrator] Initiating custom analysis sequence...`, indicating the initiation logic was reached.
    *   **Root Cause Analysis:** Despite the fix implemented in `v3.3.16.4.7` using `customAnalysisInitiatedRef` to prevent re-initiation of the custom analysis sequence, the application still encounters the `ERROR_PIPELINE_LOOP` at the same point with the same 'kt_NVDA' error. This confirms the issue is not the Orchestrator repeatedly *starting* the custom analysis sequence, but a race condition occurring immediately *after* the first call to `dispatchNextCustomAction('base')` leads to the dispatch of `TRIGGER_MANUAL_KEY_TAKEAWAYS`. When the reducer processes this event, the `checkStepAndGuard('kt_NVDA')` function is called. The guard firing indicates that, at this precise moment, 'kt_NVDA' is unexpectedly already in the `completedSteps` Set. Since `resetForNewAnalysis` clears this set, the only way for 'kt_NVDA' to be in the set when the *initial* custom analysis trigger event is processed is a very narrow race window. This likely involves the reducer processing the `TRIGGER_MANUAL_KEY_TAKEAWAYS` event, adding 'kt_NVDA' to `completedSteps` as it transitions to `GENERATING_KEY_TAKEAWAYS`, but due to state update batching or concurrency timing, the `checkStepAndGuard` runs either concurrently or immediately after the Set is updated *before* the full state transition to `GENERATING_KEY_TAKEAWAYS` is consistently reflected, causing the guard to fire incorrectly. The previous fix addressed re-initiation by the Orchestrator's effect, but not this potential race within the reducer's processing of the *first* trigger event.
    *   **Proposed Bug Fix Scope of Changes:** The issue is a persistent, subtle race condition within the pipeline orchestration, specifically how the `completedSteps` Set interacts with the `checkStepAndGuard` function during rapid state transitions, particularly at the start of the custom analysis sequence. The fix will employ a more aggressive approach by combining the previous fix (ensuring single initiation) with artificial delays.
        1.  **Confirm `customAnalysisInitiatedRef`:** Verify that the `/src/contexts/stock-analysis-context.tsx` file contains the `customAnalysisInitiatedRef` (`useRef` flag), initialized to `false` in `resetForNewAnalysis`, and used to guard the initial call to `dispatchNextCustomAction('base')` when transitioning to `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` for the 'standard' profile. If not present or incorrect, implement this check.
        2.  **Implement 100ms Delay Between Stages:** Modify the `dispatchNextCustomAction` function in `/src/contexts/stock-analysis-context.tsx`. Before *each* call to `_dispatchFsmEventActual` that dispatches a trigger event for a pipeline stage (e.g., `TRIGGER_DATA_FETCH`, `INITIATE_AI_TA_SEQUENCE`, `TRIGGER_MANUAL_KEY_TAKEAWAYS`, `TRIGGER_MANUAL_OPTIONS_ANALYSIS`, `SUBMIT_CHAT_MESSAGE`), wrap the dispatch within a `setTimeout(() => { ... }, 100);`. This will introduce a 100ms delay between the completion of one stage's processing (or the determination of the next stage) and the dispatch of the event to trigger the next stage, allowing state updates (including `completedSteps`) to settle.
        3.  Add appropriate debug log messages before each delayed dispatch indicating which event is being dispatched and that a delay is being applied.

---

## 6. Implementation Notes

This section will list the bug reports related to `ERROR_PIPELINE_LOOP`.

---


## 1. System Architecture Overview

The application follows a React Server Components architecture with a clear separation of concerns:

*   **Client Components (e.g., `main-tab-content.tsx`, `StockAnalysisProvider` context):** Handle user interaction, manage local UI state, dispatch FSM events, and utilize React `useActionState` hooks to interact with Server Actions. The `StockAnalysisProvider` includes a Global Finite State Machine (FSM) to orchestrate the overall analysis flow and manage shared application state and data.
*   **Server Actions (e.g., `analyze-stock-server-action.ts`, `analyze-ta-action.ts`):** Provide RPC endpoints called by client components. They encapsulate server-side logic, including data fetching via adapters and calling AI flows. They return a structured state object (`{ status: 'idle' | 'success' | 'error', data?: ..., error?: ..., message?: ... }`) to the client.
*   **Data Source Adapters (e.g., `polygon-adapter.ts`):** Interface with external data APIs (currently Polygon.io) to fetch raw financial data.
*   **AI Flows (e.g., `analyze-ta-flow.ts`, `analyze-stock-data.ts`, `chat-flow.ts`):** Implement AI-driven tasks using the Genkit framework. They take structured input, interact with AI models (Gemini via Google AI plugin), potentially use tools (like Google Search for grounded generation), and return structured output. Flow definitions (`src/ai/definitions/*.json`) configure the AI behavior (prompts, models, safety settings, tools).
*   **Definition Loader (`ai/definition-loader.ts`):** Utility to load and validate JSON definitions for AI prompts and calculation logic.
*   **Genkit Initialization (`ai/genkit.ts`):** Configures the Genkit environment and AI model defaults.

## 2. Expected "Analyze Stock" Pipeline Execution Flow (Success Path)

The pipeline is orchestrated by the Global FSM within `StockAnalysisContext.tsx`. The "Analyze Stock" button triggers a standard, sequential (but optionally conditional) execution profile.

1.  **User Action (`main-tab-content.tsx`):**
    *   User enters ticker, clicks "Analyze Stock".
    *   `handleAnalyzeStockSubmit` dispatches `START_FULL_ANALYSIS` event.
    *   **Expected UI:** Analyze button disabled, loading indicator shown.

2.  **Global FSM (`StockAnalysisContext.tsx`) - Initial State & Data Fetch Request:**
    *   **State:** `IDLE` or `VALID_TICKER_ENTERED`.
    *   **Event:** `START_FULL_ANALYSIS`.
    *   **Reducer Action:** Calls `resetForNewAnalysis`. Sets `activeTicker`, clears errors/pending payloads, sets `activePipelineProfile='standard'`, clears `completedSteps` set. Sets all analysis JSON states to `pendingJson` (or `chatPendingJson` for chat).
    *   **Expected State:** `PIPELINE_REQUESTED_DATA_FETCH`. `canAnalyzeStock` becomes `false`.
    *   **Orchestrator Effect:** Detects `PIPELINE_REQUESTED_DATA_FETCH` and `activeTicker`.
    *   **Expected Event:** `TRIGGER_DATA_FETCH`.
    *   **Reducer Action:** No significant state change, event is primarily for orchestration.
    *   **Expected State:** `DATA_FETCH_IN_PROGRESS`.

3.  **Data Fetching (`fetchStockDataAction` & `polygon-adapter.ts`):**
    *   **Orchestrator Effect:** Detects `DATA_FETCH_IN_PROGRESS` and `!isFetchDataPending`.
    *   **Expected Server Action Call:** `startTransition(() => { fetchStockDataFormAction({ ticker: activeTicker }); })`.
    *   **`fetchStockDataAction` Execution:**
        *   Validates ticker input.
        *   Creates a `PolygonAdapter` instance.
        *   Calls `adapter.getFullStockData(ticker)`.
        *   **`PolygonAdapter.getFullStockData` Execution:**
            *   Performs ticker consistency check.
            *   Sequentially calls Polygon.io APIs (market status, snapshot, TAs, options chain) with `delay` and cache-busting timestamp.
            *   Processes and formats raw API responses.
            *   Handles individual API call errors by adding error details to specific data parts in the `StockDataPackage` (graceful degradation).
            *   Checks for critical stale data (snapshot ticker mismatch) or overall adapter errors, returning `status: 'error'` with details.
            *   **Expected Outcome on Success:** All required data fetched, processed, and returned in an `AdapterOutput` with `status: 'success'`.
    *   **Action State Effect (`StockAnalysisContext:ActionStateEffect_FetchData`):** Monitors `fetchDataActionState`. Detects `status: 'success'`.
    *   **Expected Event:** `FETCH_DATA_SUCCESS` with the `StockDataFetchResult` payload (all JSON strings).

4.  **Global FSM - Processing Fetched Data & AI TA Request:**
    *   **Event:** `FETCH_DATA_SUCCESS`.
    *   **Reducer Action:** Updates state JSONs with fetched data, sets data ready flags (`isMarketDataReady`, etc.) to `true`.
    *   **Expected State:** `DATA_FETCH_SUCCEEDED`.
    *   **Orchestrator Effect:** Detects `DATA_FETCH_SUCCEEDED`.
    *   **Expected Event:** `INITIATE_AI_TA_SEQUENCE`.
    *   **Reducer Action:** Sets AI TA JSONs to `pendingJson`.
    *   **Expected State:** `CALCULATING_AI_TA`.

5.  **Calculating AI TA (`analyzeTaAction` & `analyze-ta-flow.ts`):**
    *   **Orchestrator Effect:** Detects `CALCULATING_AI_TA` and `!isAnalyzeTaPending`.
    *   **Expected Prerequisite Check:** `isDataReadyForProcessing(_stockSnapshotJson)` passes.
    *   **Expected Server Action Call:** `startTransition(() => { analyzeTaFormAction({ stockSnapshotJson, ticker }); })`.
    *   **`analyzeTaAction` Execution:**
        *   Validates input (non-empty snapshot JSON).
        *   Parses `stockSnapshotJson`.
        *   Validates presence of HLC data in snapshot.
        *   Prepares input for the flow.
        *   Calls `analyzeTaIndicators(flowInput)`.
        *   **`analyze-ta-flow.ts` Execution:**
            *   Loads `analyze-ta-indicators.json` (cached after first load).
            *   Populates calculation context from input.
            *   Evaluates formulas (`evaluateFormula`).
            *   Maps calculated values to output structure.
            *   **Expected Outcome on Success:** Returns `AnalyzeTaOutput` object.
        *   Receives flow output, stringifies it.
        *   **Expected Outcome on Success:** Returns `status: 'success'` with request/response JSONs.
    *   **Action State Effect (`StockAnalysisContext:ActionStateEffect_AnalyzeTa`):** Monitors `analyzeTaActionState`. Detects `status: 'success'`.
    *   **Expected Event:** `AI_TA_SUCCESS` with the `AnalyzeTaResult` payload.

6.  **Global FSM - AI TA Complete & Initiating Customizable Pipeline:**
    *   **Event:** `AI_TA_SUCCESS`.
    *   **Reducer Action:** Updates AI TA JSONs, sets `isCalculatedTADataReady` to `true`, sets `isInitialLoad` to `false`.
    *   **Expected State:** `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START`.
    *   **Orchestrator Effect:** Detects `PIPELINE_AWAITING_CUSTOM_ANALYSIS_START` and `activePipelineProfile === 'standard'`.
    *   **Expected Action:** Calls `dispatchNextCustomAction('base')`.

7.  **Executing Customizable Pipeline Steps (Iterative via `dispatchNextCustomAction`):**
    *   `dispatchNextCustomAction` iterates through the `stepOrder` (`'base'`, `'key_takeaways'`, `'options_analysis'`, `'chat_stock'`, `'chat_options'`, `'chat_holistic'`, `'web_search_ta'`, `'web_search_options'`) starting from the step *after* `lastCompletedStep` ('base' initially).
    *   For each step, it checks if the corresponding toggle flag in `state.flags` is enabled (`isAiKeyTakeawaysSelected`, etc.) and if the step key has already been added to `state.variables.completedSteps`.
    *   **Expected Flow for each *selected* step (e.g., Key Takeaways):**
        *   Toggle `isAiKeyTakeawaysSelected` is true. Step key `kt_${ticker}` is NOT in `completedSteps`.
        *   **Expected Action (in `dispatchNextCustomAction`):** Dispatch `TRIGGER_MANUAL_KEY_TAKEAWAYS`.
        *   **Reducer Action:** Adds `kt_${ticker}` to `completedSteps`. Sets KT JSONs to pending. Sets `isKeyTakeawaysDataAvailable` to `false`.
        *   **Expected State:** `GENERATING_KEY_TAKEAWAYS`.
        *   **Orchestrator Effect:** Detects `GENERATING_KEY_TAKEAWAYS` and `!isPerformAiAnalysisPending`.
        *   **Expected Prerequisite Check:** `isDataReadyForProcessing` checks pass for required data (snapshot, standard TAs, AI TA, market status).
        *   **Expected Server Action Call:** `startTransition(() => { performAiAnalysisFormAction({ ...payload }); })`.
        *   **`performAiAnalysisAction` Execution:** Validates input, calls `analyzeStockData` flow.
        *   **`analyze-stock-data-flow` Execution:** Loads definition (cached), calls Genkit `promptToUse`. Handles potentially missing outputs with defaults.
        *   **Expected Outcome on Flow Success:** Genkit returns valid output. Flow returns `StockAnalysisOutput`.
        *   **`performAiAnalysisAction` Outcome:** Returns `status: 'success'` with request/response JSONs. Includes check for `result.output === undefined` from Genkit call and throws if missing.
        *   **Action State Effect:** Monitors `performAiAnalysisActionState`. Detects `status: 'success'`.
        *   **Expected Event:** `KEY_TAKEAWAYS_SUCCESS` with payload.
        *   **Reducer Action:** Updates KT JSONs, sets `isKeyTakeawaysDataAvailable` to `true`.
        *   **Expected State:** `KEY_TAKEAWAYS_SUCCEEDED`.
        *   **Orchestrator Effect:** Detects `KEY_TAKEAWAYS_SUCCEEDED` (and `activePipelineProfile === 'standard'`), calls `dispatchNextCustomAction('key_takeaways')` to find the *next* selected step.
    *   This sequence repeats for each selected step (`options_analysis`, `chat_stock`, `chat_options`, `chat_holistic`, `web_search_ta`, `web_search_options`), each transitioning through its specific pending/success/failure states and dispatching events that trigger the next step in the `dispatchNextCustomAction` sequence.
    *   **For Chat/Web Search Steps:** The flow involves `SUBMIT_CHAT_MESSAGE` -> `CHAT_MESSAGE_PENDING` -> `chatServerAction` -> `chatWithBot` flow (potentially using `googleSearch`) -> `CHAT_MESSAGE_ACTION_SUCCESS` -> (If grounded) `FORMATTING_WEB_SEARCH_RESULTS` -> `formatWebSearchResultsAction` -> `format-web-search-flow` -> `FORMAT_WEB_SEARCH_SUCCESS`. Each successful action triggers the next step via the Orchestrator calling `dispatchNextCustomAction` with the appropriate `lastCompletedStep` identifier.

8.  **Finalizing the Pipeline:**
    *   `dispatchNextCustomAction` iterates through all steps in `stepOrder`.
    *   **Expected Action:** Finds no more selected steps after the `lastCompletedStep`. Dispatches `FINALIZE_AUTOMATED_PIPELINE`.
    *   **Reducer Action:**
    *   **Expected State:** `PIPELINE_AUTOMATED_COMPLETE`.
    *   **Orchestrator Effect:** Detects `PIPELINE_AUTOMATED_COMPLETE` and `activePipelineProfile === 'standard'`.
    *   **Expected Event:** `PROCEED_TO_IDLE`.
    *   **Reducer Action:** Resets pipeline-specific variables/payloads.
    *   **Expected State:** `IDLE`.

9.  **UI Update (MainTabContent):**
    *   Data display components update as JSON states are populated.
    *   **Expected UI:** All selected analysis results are displayed. Chat history includes chatbot/formatted web search responses. Analyze and Manual Action buttons become enabled again.

**Key Mechanism to Prevent Infinite Loops (and the likely source of ERROR_PIPELINE_LOOP):**

The core mechanism intended to prevent infinite loops in the `dispatchNextCustomAction` orchestration is the `state.variables.completedSteps` Set.

*   When `resetForNewAnalysis` is called at the start (`START_FULL_ANALYSIS`), this Set is cleared.
*   When a manual action (Key Takeaways, Options Analysis) or a chat/web search action is triggered *by the pipeline orchestration* (within `dispatchNextCustomAction`), the corresponding step key (`kt_${ticker}`, `opt_${ticker}`, `${promptName}_${ticker}`, or `${promptName}_${ticker}` for web searches) is *added to this Set in the reducer* when the state transitions to the `PENDING` state for that action (e.g., `GENERATING_KEY_TAKEAWAYS`, `ANALYZING_OPTIONS`, `CHAT_MESSAGE_PENDING`).
*   The `checkStepAndGuard` helper function, called at the beginning of the reducer for the manual/chat trigger events, explicitly checks if the step key is *already* in `completedSteps`. If it is, it logs a "Potential loop detected" error, calls `handlePipelineError`, and transitions the state to `ERROR_PIPELINE_LOOP`.

**Therefore, the `ERROR_PIPELINE_LOOP` state is intentionally triggered by the FSM reducer when it detects an event attempting to start a pipeline step (`TRIGGER_MANUAL_KEY_TAKEAWAYS`, `TRIGGER_MANUAL_OPTIONS_ANALYSIS`, `SUBMIT_CHAT_MESSAGE`) whose corresponding key is already present in the `completedSteps` Set.**

This guard is crucial because the Orchestrator `useEffect` *always* calls `dispatchNextCustomAction(lastCompletedStep)` when a step (except chat) succeeds or fails while in the 'standard' pipeline profile. Without the `completedSteps` check, a state transition might cause the Orchestrator to re-dispatch an event for a step that the reducer had already processed, leading to an infinite cycle.

The most likely reasons for the `ERROR_PIPELINE_LOOP` to occur are scenarios where:

1.  An event that *should* only trigger a pipeline step once is being dispatched multiple times unexpectedly.
2.  A pipeline step is completing or failing, but the Orchestrator's `dispatchNextCustomAction` is being called with an incorrect `lastCompletedStep` argument, causing it to re-evaluate and re-trigger an already completed step.
3.  The FSM state transitions or Action State updates are not happening as expected, causing the Orchestrator to get "stuck" in a state where it repeatedly attempts to trigger a step that the reducer then guards against, leading to the loop.

---

---