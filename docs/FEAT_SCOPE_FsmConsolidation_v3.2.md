
# Feature Scope: FSM Consolidation & Refactor (StockSage v3.2.x.y)

**Document Version:** 1.2
**Date:** 2025-06-20
**Target Application Version Series:** 3.2.x.y
**Feature Status:** IN PROGRESS

## 1. Introduction & Objective

This document outlines the scope, requirements, and a phased implementation plan for the "FSM Consolidation & Refactor" feature in the StockSage application. The **primary objective** is to re-architect the application's state management by consolidating existing global and local Finite State Machines (FSMs) into a **single, centralized, and enhanced FSM**.

**Chain of Thought - Guiding Principle for AI Agent:**
*   *Understand Current State:* The application has multiple FSMs (Global, MainTab, Chatbot, DebugConsole Menus). This leads to complexity in managing state interactions and can be error-prone.
*   *Define Target State:* A single FSM that governs all major application states and UI flows, incorporating flags and context variables for granular control. This FSM should be the single source of truth for "what the app is doing" and "what the user can do next."
*   *Incremental Migration:* The implementation must be phased. Each phase and task should be a small, testable step towards replacing parts of the old FSM logic with the new, consolidated FSM. Avoid a "big bang" refactor.
*   *Maintainability & Extensibility:* The new FSM design must make it easier to add future features and debug existing ones. It should be modular in its event handling and state definitions.
*   *Debuggability Focus:* Enhancements to debug tools (FSM Debug Card, log exports) are integral to this feature, providing clear visibility into the new FSM's operation.

## 2. Core Problem Areas Addressed

*   **Current State Management Complexity:** Multiple FSMs (`StockAnalysisContext` Global FSM, `MainTabContent` local FSM, `ChatbotFsmContext`, `DebugConsoleFsmContext`) create challenges in:
    *   Synchronizing states across different parts of the application.
    *   Managing interactions and potential race conditions.
    *   Tracing application flow during debugging.
*   **Risk of "Spaghetti Code":** As features grow, inter-FSM dependencies can become tangled, making the codebase harder to understand, maintain, and modify without unintended side effects.
*   **Scalability Concerns:** Adding new, complex features that require coordinated state changes across multiple existing FSMs is inefficient and increases the risk of errors.
*   **Inconsistent UI Behavior:** Different parts of the UI might derive their enabled/disabled or loading states from different sources, potentially leading to inconsistencies.
*   **Suboptimal Debuggability:** While existing tools are helpful, a single FSM provides a more unified and comprehensive view of the application's overall state, including flags and context variables.

## 3. Proposed Solution: Single Enhanced FSM Architecture

The proposed solution involves creating a single, robust FSM, likely managed within `StockAnalysisContext.tsx` (or a new, dedicated context it consumes). This FSM will be characterized by:

1.  **Centralized State Logic:** All primary application states will be defined and managed here.
2.  **Comprehensive State Definitions:** A new set of `GlobalFsmState` enums that are more granular and cover all significant application lifecycles and user interaction flows. Existing states will be audited, consolidated, or refined.
3.  **Contextual Flags (`GlobalFsmFlags`):** Boolean flags managed by the FSM to indicate specific conditions or data readiness (e.g., `isSnapshotDataReady`, `canUserTriggerManualAnalysis`, `isMarketOpen`). These will drive UI enablement/disablement and conditional logic.
4.  **Context Variables (`GlobalFsmContextVariables`):** Key pieces of data managed by or influencing the FSM (e.g., `activeAnalysisTicker`, `currentInputTicker`, `lastErrorDetails`).
5.  **Unified Event Dispatching:** Components will dispatch clearly defined events to this single FSM, which will then orchestrate state transitions, flag updates, and variable changes.
6.  **"Single Pend Point" / Common Idle State:** The FSM will aim for a common `IDLE` state. After operations, the FSM will typically return to `IDLE`, and the combination of current flags and variables will determine the application's subsequent readiness and available actions.

## 4. Value Added Proposition

*   **Improved Maintainability:** Simplifies understanding and modifying application behavior by having a single source of truth for state.
*   **Enhanced Extensibility:** Facilitates easier addition of new features by integrating new states, flags, and events into a unified structure.
*   **Superior Debuggability:** Offers a clear, holistic view of the application's state, flags, and variables. The enhanced FSM Debug Card and log exports will provide comprehensive "Failure Snapshots."
*   **Reduced Risk of Spaghetti Code & Race Conditions:** Promotes cleaner architecture and more predictable state transitions.
*   **Increased Robustness & Consistency:** Leads to more reliable UI behavior and fewer state-related bugs.
*   **Modular Disablement of Features:** New features tied to specific states/flags can be more easily toggled off if problematic.

## 5. Risk Assessment & Potential Pain Points

*   **Complexity of Initial Design:** Defining the comprehensive set of states, flags, and variables correctly is critical and challenging.
*   **Risk of Over-Monolithic FSM:** Care must be taken to ensure the single FSM doesn't become a "god object" by incorporating too much business logic directly, instead of orchestrating calls to services/actions.
*   **Regression Bugs:** High risk during the incremental refactoring process. Thorough testing at each step is paramount.
*   **Performance Implications:** A very complex reducer or frequent updates to a large context could impact performance if not carefully managed (e.g., memoization, selector patterns if necessary).
*   **Guiding AI Agent:** Breaking this down into small, verifiable sub-tasks for an AI agent requires extreme precision in prompts and expected outcomes for each step.
*   **Transition Period:** The codebase will be in a mixed state during development, which requires careful management.

## 6. Implementation Phased Plan & Task Breakdown

**Guiding AI Agent for Implementation:**
*   *At each task, the primary goal is to modify the specified file(s) to achieve the described action.*
*   *Ensure all new FSM states, flags, variables, and events are clearly defined with Zod schemas or TypeScript types/enums.*
*   *Focus on making the FSM the driver of UI states (loading, disabled, visibility) previously handled by local component state or multiple FSMs.*
*   *Update unit/integration tests (if any were previously generated) or ensure manual testability for each task.*
*   *The `appVersion` in `src/config/app-metadata.json` MUST be updated with each task that involves code changes.*

---

### **Phase 1: Foundation & Core FSM Setup (Target: v3.2.1.z)**
*Objective: Establish the basic structure of the new single FSM, define initial core states, flags, and context variables. Integrate the existing automated "Analyze Stock" pipeline (data fetch + TA calculation) into this new FSM as a pilot.*

*   **Task v3.2.1.0: Define Initial Single FSM Structure & Core States**
    *   **Status:** `COMPLETED` (Commit: `919db9f2`)
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The goal is to create the foundational types/enums for the new single FSM and adapt the reducer.
        2.  *Define `GlobalFsmState` Enum:* Create a new enum with initial core states: `APP_INITIALIZING`, `IDLE`, `AWAITING_TICKER_INPUT`, `VALID_TICKER_ENTERED`, `PIPELINE_REQUESTED_DATA_FETCH`, `DATA_FETCH_IN_PROGRESS`, `DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`, `CALCULATING_AI_TA`, `AI_TA_CALCULATION_SUCCEEDED`, `AI_TA_CALCULATION_FAILED`, `PIPELINE_AUTOMATED_COMPLETE`, plus placeholders for future `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`, `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED`, `OPTIONS_ANALYSIS_FAILED`, and `ERROR_STALE_DATA`.
        3.  *Define `GlobalFsmContextVariables` Interface:* Initial variables: `activeTicker: string | null`, `userInputTicker: string`, `isInitialLoad: boolean`, `lastError: { message: string, source: string, details?: any } | null`.
        4.  *Define `GlobalFsmFlags` Interface:* Initial flags: `canAnalyzeStock: boolean`, `isMarketDataReady: boolean`, `isSnapshotDataReady: boolean`, `isStandardTADataReady: boolean`, `isOptionsChainDataReady: boolean`, `isCalculatedTADataReady: boolean`, `isKeyTakeawaysDataAvailable: boolean`, `isOptionsAnalysisDataAvailable: boolean`.
        5.  *Update FSM State Object in `StockAnalysisState`:* Modify the `globalFsmState` (previously `fsmState`) to be of type `GlobalFsmReducerManagedState` which includes `{ current: GlobalFsmState, previous: GlobalFsmState | null, variables: GlobalFsmContextVariables, flags: GlobalFsmFlags }`. Update `defaultState` and initializers.
        6.  *Adapt Reducer:* Modify the main `fsmReducer` in `StockAnalysisContext` to use the new `GlobalFsmState` enum and manage the new `variables` and `flags` as part of its state updates. Map existing global FSM logic broadly to these new states, initializing flags and variables correctly on transitions (e.g., on `START_FULL_ANALYSIS`, reset data flags, set `activeTicker`).
        7.  *Update Orchestrator and Action Handlers:* Adapt the orchestrator `useEffect` and server action result `useEffect`s to work with the new FSM state structure, dispatch new FSM events, and update new flags/variables.
    *   **Testability:** App should load. The FSM Debug Card (though not yet updated for flags/vars) should reflect the new initial FSM state. Automated pipeline for "Analyze Stock" should still broadly function, with the new FSM states being logged.
    *   **App Metadata:** Updated to `v3.2.1.0`.

*   **Task v3.2.1.1: [BUG FIX] Resolve Repeated `INITIALIZATION_COMPLETE` Dispatch**
    *   **Status:** `COMPLETED` (Commit: `1aefabe1`)
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The `INITIALIZATION_COMPLETE` event was being dispatched multiple times.
        2.  *Implement Guard:* Add a `useRef` (e.g., `initializationDispatchedRef`) in `StockAnalysisContext` to track if `INITIALIZATION_COMPLETE` has already been dispatched by the orchestrator `useEffect`.
        3.  *Modify Orchestrator:* Ensure the dispatch only occurs if the ref is `false`, then set the ref to `true`. This check should be at the very beginning of the `APP_INITIALIZING` state handling block in the orchestrator.
    *   **Testability:** Verify `INITIALIZATION_COMPLETE` is dispatched and processed only once during app startup by observing client logs.
    *   **App Metadata:** Updated to `v3.2.1.1`.

*   **Task v3.2.1.2: Integrate "Analyze Stock" Button & Input Handling**
    *   **Status:** `COMPLETED` (Commit: `7da707fa`)
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The local FSM in `MainTabContent` for ticker input and automated analysis submission needs to be removed. This logic will move to the global FSM.
        2.  *`MainTabContent.tsx` Changes:*
            *   Remove its local FSM reducer and states related to `INPUT_VALID`, `AUTOMATED_PIPELINE_REQUESTED`, etc.
            *   The `tickerInput` remains a local `useState` in `MainTabContent`.
            *   The "Analyze Stock" button's `disabled` attribute is now derived from `useStockAnalysis().fsmFlags.canAnalyzeStock` and if `useStockAnalysis().fsmState.current` indicates a busy pipeline.
            *   The `onSubmit` handler for the form (and thus the "Analyze Stock" button) dispatches a global event: `START_FULL_ANALYSIS` with `{ ticker: tickerInput }` as payload.
        3.  *`StockAnalysisContext.tsx` (Reducer) Changes:*
            *   Handle `START_FULL_ANALYSIS`:
                *   Set `variables.userInputTicker = event.payload.ticker`.
                *   Set `variables.activeTicker = event.payload.ticker`.
                *   Set `flags.canAnalyzeStock = false`.
                *   Transition to `PIPELINE_REQUESTED_DATA_FETCH`.
                *   Reset all data availability flags (`isMarketDataReady`, `isSnapshotDataReady`, etc.) to `false`.
                *   Reset `variables.lastError = null`.
                *   Invoke `setAllPlaceholdersInternal` to reset context JSON strings.
            *   Update derivation logic for `flags.canAnalyzeStock`: It should be true if FSM current state is `IDLE`, `AWAITING_TICKER_INPUT`, or `VALID_TICKER_ENTERED` and `variables.userInputTicker` is valid. (This derivation logic will be implemented or refined within the reducer as flags are updated based on state transitions).
    *   **Testability:** "Analyze Stock" button enables/disables based on global FSM state/flags. Clicking it updates `activeTicker` in the global FSM, resets relevant flags/JSONs, and transitions the global FSM to `PIPELINE_REQUESTED_DATA_FETCH`.
    *   **App Metadata:** Updated to `v3.2.1.2`.

*   **Task v3.2.1.3: Migrate Data Fetching Pipeline to New FSM**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The sequence of fetching market data, snapshot, TAs, and options (currently orchestrated by `useEffect` hooks listening to old FSM states) needs to be driven by the new single FSM.
        2.  *FSM State Progression & Orchestration:*
            *   From `PIPELINE_REQUESTED_DATA_FETCH`: The orchestrator effect will dispatch `TRIGGER_DATA_FETCH`.
            *   Reducer handles `TRIGGER_DATA_FETCH`: Transition to `DATA_FETCH_IN_PROGRESS`. (Orchestrator will then call `fetchStockDataAction`).
        3.  *Server Action Result Handling (`useEffect` for `fetchDataActionState`):*
            *   On success: Update context JSONs. Set flags: `isMarketDataReady=true`, `isSnapshotDataReady=true`, `isStandardTADataReady=true`, `isOptionsChainDataReady=true`. Dispatch `FETCH_DATA_SUCCESS` to FSM.
            *   On error: Update context JSONs with error. Set `variables.lastError`. Set relevant data readiness flags to `false`. Dispatch `FETCH_DATA_FAILURE`.
            *   Handle `Stale data detected` specifically by dispatching `STALE_DATA_FROM_ACTION`.
        4.  *FSM Reducer Handling:*
            *   `FETCH_DATA_SUCCESS`: Transition to `DATA_FETCH_SUCCEEDED`.
            *   `FETCH_DATA_FAILURE`: Transition to `DATA_FETCH_FAILED`.
            *   `STALE_DATA_FROM_ACTION`: Transition to `ERROR_STALE_DATA`.
    *   **Testability:** The full data fetching sequence completes. All relevant data JSONs in context are populated. FSM moves through `PIPELINE_REQUESTED_DATA_FETCH` -> `DATA_FETCH_IN_PROGRESS` -> (`DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`, or `ERROR_STALE_DATA`). Data readiness flags are set correctly.
    *   **App Metadata:** Update to `v3.2.1.3`.

*   **Task v3.2.1.4: Migrate AI TA Calculation to New FSM (Automated Pipeline)**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* AI TA calculation is the next step in the automated pipeline.
        2.  *FSM State Progression & Orchestration:*
            *   From `DATA_FETCH_SUCCEEDED`: The orchestrator effect will dispatch `INITIATE_AI_TA_SEQUENCE`.
            *   Reducer handles `INITIATE_AI_TA_SEQUENCE`: Set AI TA JSONs to pending. Transition to `CALCULATING_AI_TA`. (Orchestrator will then call `analyzeTaAction`).
        3.  *Server Action Result Handling (`useEffect` for `analyzeTaActionState`):*
            *   On success: Update `aiAnalyzedTaJson` and `aiAnalyzedTaRequestJson`. Set `flags.isCalculatedTADataReady = true`. Dispatch `AI_TA_SUCCESS`.
            *   On error: Update JSONs with error. Set `variables.lastError`. Set `flags.isCalculatedTADataReady = false`. Dispatch `AI_TA_FAILURE`.
        4.  *FSM Reducer Handling:*
            *   `AI_TA_SUCCESS`: Transition to `AI_TA_CALCULATION_SUCCEEDED`.
            *   `AI_TA_FAILURE`: Transition to `AI_TA_CALCULATION_FAILED`.
        5.  *Finalize Automated Pipeline (Orchestrator):*
            *   From `AI_TA_CALCULATION_SUCCEEDED` or `AI_TA_CALCULATION_FAILED`: Orchestrator dispatches `FINALIZE_AUTOMATED_PIPELINE`.
            *   Reducer handles `FINALIZE_AUTOMATED_PIPELINE`: Transition to `PIPELINE_AUTOMATED_COMPLETE`. If success, set `variables.isInitialLoad = false`.
        6.  *Return to Idle (Orchestrator):*
            *   From `PIPELINE_AUTOMATED_COMPLETE`, `DATA_FETCH_FAILED`, `ERROR_STALE_DATA`: Orchestrator dispatches `PROCEED_TO_IDLE`.
            *   Reducer handles `PROCEED_TO_IDLE`: Transition to `IDLE` (or `VALID_TICKER_ENTERED`). Reset `flags.canAnalyzeStock = true`. Clear `variables.lastError`.
    *   **Testability:** AI TA is calculated after data fetch. `aiAnalyzedTaJson` is populated. FSM transitions correctly through states, eventually returning to `IDLE`. Relevant flags updated.
    *   **App Metadata:** Update to `v3.2.1.4`.

---

### **Phase 2: Integrating Manual AI Actions (Target: v3.2.2.z)**
*Objective: Migrate the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons to use the single FSM.*

*   **Task v3.2.2.0: Integrate "Generate AI Key Takeaways" Button**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Manual Key Takeaways should only be possible after a successful automated pipeline for the `variables.activeTicker`.
        2.  *`MainTabContent.tsx` Button Logic:*
            *   Disable state derived from `fsmState.current` (e.g., must be `IDLE` or `PIPELINE_AUTOMATED_COMPLETE`), `fsmFlags.isKeyTakeawaysDataAvailable` (to prevent re-generation if already present, or handle it), `fsmFlags.isSnapshotDataReady`, `fsmFlags.isStandardTADataReady`, `fsmFlags.isCalculatedTADataReady`, and whether global pipeline is busy.
            *   `onClick`: Dispatch `TRIGGER_MANUAL_KEY_TAKEAWAYS` event (payload: `{ ticker: fsmVariables.activeTicker }`).
        3.  *`StockAnalysisContext.tsx` (Reducer & Orchestration):*
            *   Reducer handles `TRIGGER_MANUAL_KEY_TAKEAWAYS`: Set relevant AI Key Takeaways JSONs to pending. Transition to `GENERATING_KEY_TAKEAWAYS`.
            *   Orchestrator `useEffect` triggers `performAiAnalysisAction` when in `GENERATING_KEY_TAKEAWAYS`.
            *   `useEffect` for `performAiAnalysisActionState` handles result: Update `aiKeyTakeawaysJson`, set `flags.isKeyTakeawaysDataAvailable`, `variables.lastError`. Dispatch `KEY_TAKEAWAYS_SUCCESS` or `KEY_TAKEAWAYS_FAILURE`.
            *   Reducer handles `KEY_TAKEAWAYS_SUCCESS` / `KEY_TAKEAWAYS_FAILURE`: Transition to a terminal state for this manual action (e.g., `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`).
            *   Orchestrator handles these terminal states by dispatching `PROCEED_TO_IDLE` to return to an idle state.
    *   **Testability:** Button enables/disables correctly. Key takeaways are generated. FSM transitions correctly.
    *   **App Metadata:** Update to `v3.2.2.0`.

*   **Task v3.2.2.1: Integrate "Generate AI Options Analysis" Button**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:** Similar to Key Takeaways:
        1.  Button logic based on global FSM state, flags (`isOptionsAnalysisDataAvailable`, `isOptionsChainDataReady`, `isSnapshotDataReady`).
        2.  `onClick` dispatches `TRIGGER_MANUAL_OPTIONS_ANALYSIS`.
        3.  Global FSM: Reducer transitions to `ANALYZING_OPTIONS`. Orchestrator calls `performAiOptionsAnalysisAction`. Action result handler dispatches success/failure. Reducer transitions to terminal state. Orchestrator returns to `IDLE`.
    *   **Testability:** Button enables/disables correctly. Options analysis generated. FSM transitions.
    *   **App Metadata:** Update to `v3.2.2.1`.

---

### **Phase 3: Integrating Chat & Debug Console Menus (Target: v3.2.3.z)**
*Objective: Bring Chatbot UI states and Debug Console menu states under the purview of the single FSM.*

*   **Task v3.2.3.0: Integrate Chatbot Submission Flow**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/components/chatbot.tsx`, `src/contexts/stock-analysis-context.tsx`. (Potentially deprecate `ChatbotFsmContext.tsx`).
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Chat submission is an asynchronous action. `ChatbotFsmContext` will be deprecated.
        2.  `Chatbot.tsx`: `onSubmit` (and example prompt clicks) dispatches `ADD_CHAT_MESSAGE` to global FSM with payload (userInput, current data context, chat history). The `userInput` can be local to `Chatbot.tsx`.
        3.  `StockAnalysisContext.tsx`:
            *   Reducer handles `ADD_CHAT_MESSAGE`: Add user message to `chatHistory`. Transition to `CHAT_MESSAGE_PENDING`.
            *   Orchestrator `useEffect` (when `CHAT_MESSAGE_PENDING`) triggers `chatServerAction`.
            *   `useEffect` for `chatActionState` handles result: Add model response/error to `chatHistory`. Update `chatbotRequestJson`/`chatbotResponseJson`. Dispatch event to global FSM like `CHAT_MESSAGE_SUCCESS` or `CHAT_MESSAGE_ERROR`.
            *   Reducer handles success/error: Transition back to `IDLE`.
    *   **Testability:** Chat messages can be submitted. Global FSM reflects pending/completion. Chat history updates. Chat input disabled during pending.
    *   **App Metadata:** Update to `v3.2.3.0`.

*   **Task v3.2.3.1: Integrate Debug Console Menu UI States (Optional but Recommended)**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/components/debug-console.tsx`, `src/contexts/stock-analysis-context.tsx`. (Potentially deprecate `DebugConsoleFsmContext.tsx`).
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The open/closed state of Debug Console menus (Filter, Copy, Export). `DebugConsoleFsmContext` will be deprecated.
        2.  Add flags to `GlobalFsmFlags`: e.g., `isDebugConsoleFilterMenuOpen: boolean`, `isDebugConsoleCopyMenuOpen: boolean`, `isDebugConsoleExportMenuOpen: boolean`. Initialize to `false`.
        3.  `DebugConsole.tsx`: Dropdown triggers dispatch events to global FSM like `TOGGLE_DEBUG_CONSOLE_MENU` (payload: `{ menu: 'filter' | 'copy' | 'export', currentOpenState: boolean }`).
        4.  Reducer handles `TOGGLE_DEBUG_CONSOLE_MENU`: Updates the corresponding flag (e.g., `flags.isDebugConsoleFilterMenuOpen = !payload.currentOpenState`). If opening one menu, ensure others are closed (set their flags to `false`).
    *   **Testability:** Debug console menus open/close correctly, driven by global FSM flags. Only one menu open at a time.
    *   **App Metadata:** Update to `v3.2.3.1`.

---

### **Phase 4: Testing and Debugging (Target: v3.2.4.z)**
*Objective: Rigorous testing of the consolidated FSM across all application features and edge cases. Focus on stability, correct state transitions, accurate flag/variable updates, and absence of regressions.*

*   **Task v3.2.4.0: Comprehensive End-to-End Testing - Scenario 1 (Happy Paths)**
    *   **Status:** `PLANNED`
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The goal is to verify all primary user flows work correctly with the new single FSM.
        2.  *Test Plan Execution Guidance:* Test initial app load, successful "Analyze Stock," successful manual AI actions, multiple chat interactions, changing tickers, and all Debug Console/FSM Card functionalities.
        3.  *Verification Criteria:* Monitor FSM states, flags, variables. Ensure UI elements behave correctly. Verify context data updates.
        4.  *Code Changes:* Only minor tweaks directly related to FSM behavior identified during this testing.
    *   **App Metadata:** `v3.2.4.0` (update if code changes).

*   **Task v3.2.4.1: Comprehensive End-to-End Testing - Scenario 2 (Error & Edge Cases)**
    *   **Status:** `PLANNED`
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Verify robust error handling and graceful recovery.
        2.  *Test Plan Execution Guidance:* Test invalid ticker, simulate API/AI flow failures, rapid clicks, actions with unmet prerequisites, network interruptions (if possible).
        3.  *Verification Criteria:* FSM transitions to `ERROR_...` states. `variables.lastError` populated. UI shows errors. App recovers gracefully. No crashes/hangs.
        4.  *Code Changes:* Implement fixes for identified issues.
    *   **App Metadata:** `v3.2.4.1` (update if code changes).

*   **Task v3.2.4.2: Log Review & Final Refinements**
    *   **Status:** `PLANNED`
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Final check of logs and FSM behavior.
        2.  *Action:* Review all client/server logs from comprehensive testing.
        3.  *Identify & Address:* Anomalies, incorrect flag/variable settings, missing/excessive logs. Ensure "Failure Snapshot" is complete.
        4.  *Considerations:* Are states entered/exited unexpectedly? Flags reset correctly? `lastError` cleared? Subtle race conditions?
        5.  *Code Changes:* Implement final small tweaks.
    *   **App Metadata:** `v3.2.4.2` (update if code changes).

---

### **Phase 5: Documentation & Cleanup (Target: v3.2.5.z)**
*Objective: Finalize the enhanced debugging tools and update all project documentation to reflect the new FSM architecture.*

*   **Task v3.2.5.0: Finalize Enhanced FSM Debug Card & Client Debug Console Exports**
    *   **Status:** `PLANNED`
    *   **File(s):** `src/components/fsm-state-debug-card.tsx`, `src/components/debug-console.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* FSM Debug Card and console exports must align with the final FSM structure.
        2.  *`FsmStateDebugCard.tsx` Verification:* Displays current/previous FSM state, all `GlobalFsmFlags`, key `GlobalFsmContextVariables`. Export/Copy works.
        3.  *`DebugConsole.tsx` Verification:* Log export/copy handlers correctly include the full FSM snapshot (state, flags, variables).
        4.  *Code Changes:* Minor adjustments based on Phase 4 findings.
    *   **Testability:** FSM Debug Card displays all info. Log exports contain complete FSM snapshot.
    *   **App Metadata:** Update to `v3.2.5.0`.

*   **Task v3.2.5.1: Update All Project Documentation (README.md, CHANGELOG.md, FEAT docs)**
    *   **Status:** `PLANNED`
    *   **File(s):** `README.md`, `CHANGELOG.md`, `docs/FEAT_SCOPE_FsmConsolidation_v3.2.md`, `docs/FEAT_STATUS_FsmConsolidation_v3.2.md`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* All documentation must reflect the new single FSM architecture and feature completion.
        2.  *`README.md` Update:* Rewrite/update State Management, FSM architecture, component interactions sections. Describe enhanced FSM Debug Card and exports. Update commit procedures.
        3.  *`CHANGELOG.md` Update:* Add consolidated entry for `v3.2.x.y` feature completion.
        4.  *`FEAT_STATUS_FsmConsolidation_v3.2.md` Update:* Mark feature and all phases/tasks as `COMPLETED`. Add final commit details.
        5.  *`FEAT_SCOPE_FsmConsolidation_v3.2.md` Update:* Mark as `COMPLETED`. Ensure "Implementation Plan" reflects tasks undertaken.
    *   **Testability:** Review all updated documents for accuracy and clarity.
    *   **App Metadata:** `v3.2.5.1` (or final version from previous task if no code changes).

## 7. Document Changelog

*   **v1.2 (2025-06-20):** Updated Task v3.2.1.2 status to `COMPLETED` (Commit: `7da707fa`).
*   **v1.1 (2025-06-20):** Updated Task v3.2.1.1 status to `COMPLETED` (Commit: `1aefabe1`). Adjusted subsequent task numbering in Phase 1. Updated Implementation Plan to be a 5-phase plan with dedicated Testing (Phase 4) and Documentation/Cleanup (Phase 5).
*   **v1.0 (2025-06-20):** Initial document creation. Includes full scope, analysis, risks, and phased implementation plan for FSM Consolidation & Refactor feature (v3.2.x.y). Based on approved scope and user-provided re-phasing.

---
This document will be updated as the feature progresses through its implementation phases.

    