
# Feature Scope: FSM Consolidation & Refactor (StockSage v3.2.x.y)

**Document Version:** 1.0
**Date:** 2025-06-20
**Target Application Version Series:** 3.2.x.y
**Feature Status:** PLANNED

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
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The goal is to create the foundational types/enums for the new single FSM.
        2.  *Define `GlobalFsmState` Enum:* Create a new enum with initial core states. Consider these as a starting point: `APP_INITIALIZING`, `IDLE`, `AWAITING_TICKER_INPUT`, `VALID_TICKER_ENTERED`, `PIPELINE_REQUESTED_DATA_FETCH`, `DATA_FETCH_IN_PROGRESS`, `DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`, `CALCULATING_AI_TA`, `AI_TA_CALCULATION_SUCCEEDED`, `AI_TA_CALCULATION_FAILED`, `PIPELINE_AUTOMATED_COMPLETE`. (More states will be added in later tasks for manual actions, chat, errors).
        3.  *Define `GlobalFsmContextVariables` Interface:* Initial variables: `activeAnalysisTicker: string | null`, `userInputTicker: string` (for the main input field), `isInitialAppLoad: boolean` (true initially, false after first successful automated pipeline), `lastError: { message: string, source: string, details?: any } | null`.
        4.  *Define `GlobalFsmFlags` Interface:* Initial flags: `canAnalyzeStock: boolean` (derived from FSM state and input validity), `isMarketDataReady: boolean`, `isSnapshotDataReady: boolean`, `isStandardTADataReady: boolean`, `isOptionsChainDataReady: boolean`, `isCalculatedTADataReady: boolean`.
        5.  *Update FSM State Object in `StockAnalysisState`:* Modify the `fsmState` and `previousFsmState` to use the new `GlobalFsmState` enum. Add `fsmVariables: GlobalFsmContextVariables` and `fsmFlags: GlobalFsmFlags` to the main context state. Initialize these appropriately.
        6.  *Adapt Reducer:* Modify the main `fsmReducer` in `StockAnalysisContext` to use the new `GlobalFsmState` enum and manage the new `fsmVariables` and `fsmFlags` as part of its state updates. For now, map existing global FSM logic broadly to these new states. For example, current `INITIALIZING_ANALYSIS` could map to `APP_INITIALIZING`.
    *   **Testability:** App should load. The FSM Debug Card (though not yet updated for flags/vars) should reflect the new initial FSM state (e.g., `APP_INITIALIZING` then `IDLE` or `AWAITING_TICKER_INPUT`).
    *   **App Metadata:** Update to `v3.2.1.0`.

*   **Task v3.2.1.1: Integrate "Analyze Stock" Button & Input Handling**
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The local FSM in `MainTabContent` for ticker input and automated analysis submission needs to be removed. This logic will move to the global FSM.
        2.  *`MainTabContent.tsx` Changes:*
            *   Remove its local FSM reducer and states related to `INPUT_VALID`, `AUTOMATED_PIPELINE_REQUESTED`, etc.
            *   The `tickerInput` can remain a local `useState` in `MainTabContent`.
            *   The "Analyze Stock" button's `disabled` attribute should now be derived from `useStockAnalysis().fsmFlags.canAnalyzeStock` and potentially if `useStockAnalysis().fsmState` indicates a busy pipeline.
            *   The `onSubmit` handler for the form (and thus the "Analyze Stock" button) will dispatch a new global event: `SUBMIT_TICKER_FOR_AUTOMATED_ANALYSIS` with `{ ticker: tickerInput }` as payload.
        3.  *`StockAnalysisContext.tsx` (Reducer) Changes:*
            *   Handle `SUBMIT_TICKER_FOR_AUTOMATED_ANALYSIS`:
                *   Set `fsmVariables.userInputTicker = event.payload.ticker`.
                *   Set `fsmVariables.activeAnalysisTicker = event.payload.ticker`.
                *   Set `fsmFlags.canAnalyzeStock = false`.
                *   Transition to `PIPELINE_REQUESTED_DATA_FETCH`.
                *   (Potentially set `fsmVariables.isInitialAppLoad = false` if this is the first user-triggered analysis).
            *   Update derivation of `fsmFlags.canAnalyzeStock`: It should be true if FSM is `IDLE` or `AWAITING_TICKER_INPUT` (or `VALID_TICKER_ENTERED` if we keep that distinct state) and `fsmVariables.userInputTicker` is valid.
    *   **Testability:** "Analyze Stock" button enables/disables based on global FSM state/flags. Clicking it updates `activeAnalysisTicker` in the global FSM and transitions the global FSM to `PIPELINE_REQUESTED_DATA_FETCH`.
    *   **App Metadata:** Update to `v3.2.1.1`.

*   **Task v3.2.1.2: Migrate Data Fetching Pipeline to New FSM**
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The sequence of fetching market data, snapshot, TAs, and options (currently orchestrated by `useEffect` hooks listening to old FSM states) needs to be driven by the new single FSM.
        2.  *FSM State Progression:*
            *   From `PIPELINE_REQUESTED_DATA_FETCH`: The orchestrator effect (or a new one) will trigger `fetchStockDataAction`.
            *   Transition to `DATA_FETCH_IN_PROGRESS`.
        3.  *Server Action Result Handling (`useEffect` for `fetchDataActionState`):*
            *   On success: Update context JSONs. Set flags: `isMarketDataReady=true`, `isSnapshotDataReady=true`, `isStandardTADataReady=true`, `isOptionsChainDataReady=true`. Dispatch `DATA_FETCH_SUCCESSFUL_EVENT` to FSM.
            *   On error: Update context JSONs with error. Set `variables.lastError`. Set relevant data readiness flags to `false`. Dispatch `DATA_FETCH_ERROR_EVENT`.
        4.  *FSM Reducer Handling:*
            *   `DATA_FETCH_SUCCESSFUL_EVENT`: Transition to `CALCULATING_AI_TA` (if automated pipeline).
            *   `DATA_FETCH_ERROR_EVENT`: Transition to `ERROR_DATA_FETCH`.
    *   **Testability:** The full data fetching sequence completes. All relevant data JSONs in context are populated. FSM moves through `PIPELINE_REQUESTED_DATA_FETCH` -> `DATA_FETCH_IN_PROGRESS` -> (`CALCULATING_AI_TA` or `ERROR_DATA_FETCH`). Data readiness flags are set correctly.
    *   **App Metadata:** Update to `v3.2.1.2`.

*   **Task v3.2.1.3: Migrate AI TA Calculation to New FSM (Automated Pipeline)**
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* AI TA calculation is the next step in the automated pipeline.
        2.  *FSM State Progression:*
            *   When FSM is in `CALCULATING_AI_TA` (after successful data fetch): The orchestrator effect triggers `analyzeTaAction`.
        3.  *Server Action Result Handling (`useEffect` for `analyzeTaActionState`):*
            *   On success: Update `aiAnalyzedTaJson` and `aiAnalyzedTaRequestJson`. Set `flags.isCalculatedTADataReady = true`. Dispatch `AI_TA_CALCULATION_SUCCESSFUL_EVENT`.
            *   On error: Update JSONs with error. Set `variables.lastError`. Set `flags.isCalculatedTADataReady = false`. Dispatch `AI_TA_CALCULATION_ERROR_EVENT`.
        4.  *FSM Reducer Handling:*
            *   `AI_TA_CALCULATION_SUCCESSFUL_EVENT`: Transition to `PIPELINE_AUTOMATED_COMPLETE`.
            *   `AI_TA_CALCULATION_ERROR_EVENT`: Transition to `ERROR_AI_TA`.
        5.  *Return to Idle:* From `PIPELINE_AUTOMATED_COMPLETE`, `ERROR_DATA_FETCH`, `ERROR_AI_TA`, the FSM should transition back to an `IDLE` (or `VALID_TICKER_ENTERED` if applicable) state. Reset `flags.canAnalyzeStock = true`.
    *   **Testability:** AI TA is calculated after data fetch. `aiAnalyzedTaJson` is populated. FSM transitions correctly through `CALCULATING_AI_TA` -> (`PIPELINE_AUTOMATED_COMPLETE` or `ERROR_AI_TA`) -> `IDLE`. Relevant flags updated.
    *   **App Metadata:** Update to `v3.2.1.3`.

---

### **Phase 2: Integrating Manual AI Actions (Target: v3.2.2.z)**
*Objective: Migrate the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons to use the single FSM.*

*   **Task v3.2.2.0: Integrate "Generate AI Key Takeaways" Button**
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Manual Key Takeaways should only be possible after a successful automated pipeline for the `activeAnalysisTicker`.
        2.  *`MainTabContent.tsx` Button Logic:*
            *   Disable state derived from `fsmState` (e.g., must be `IDLE` or `PIPELINE_AUTOMATED_COMPLETE`), `fsmFlags.isKeyTakeawaysDataAvailable` (to prevent re-generation if already present, or handle it), and `fsmFlags.isSnapshotDataReady`, `fsmFlags.isStandardTADataReady`, `fsmFlags.isCalculatedTADataReady`.
            *   `onClick`: Dispatch `REQUEST_MANUAL_AI_KEY_TAKEAWAYS_EVENT` (payload: `{ ticker: fsmVariables.activeAnalysisTicker }`).
        3.  *`StockAnalysisContext.tsx` (Reducer & Orchestration):*
            *   Handle `REQUEST_MANUAL_AI_KEY_TAKEAWAYS_EVENT`: Transition to `MANUAL_ACTION_PENDING_KEY_TAKEAWAYS`.
            *   Orchestrator `useEffect` triggers `performAiAnalysisAction` when in this state.
            *   Handle server action result: Update `aiKeyTakeawaysJson`, set `flags.isKeyTakeawaysDataAvailable`, `variables.lastError`. Dispatch `MANUAL_AI_KEY_TAKEAWAYS_SUCCESS_EVENT` or `..._ERROR_EVENT`.
            *   FSM transitions from `MANUAL_ACTION_PENDING_KEY_TAKEAWAYS` back to `IDLE` (or the state indicating automated pipeline is complete and manual actions are possible).
    *   **Testability:** Button enables/disables correctly. Key takeaways are generated. FSM transitions correctly.
    *   **App Metadata:** Update to `v3.2.2.0`.

*   **Task v3.2.2.1: Integrate "Generate AI Options Analysis" Button**
    *   **File(s):** `src/components/main-tab-content.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:** Similar to Key Takeaways:
        1.  Button logic based on global FSM state, flags (`isOptionsAnalysisDataAvailable`, `isOptionsChainDataReady`, `isSnapshotDataReady`).
        2.  `onClick` dispatches `REQUEST_MANUAL_AI_OPTIONS_ANALYSIS_EVENT`.
        3.  Global FSM handles, calls `performAiOptionsAnalysisAction`, updates context, transitions back.
    *   **Testability:** Button enables/disables correctly. Options analysis generated. FSM transitions.
    *   **App Metadata:** Update to `v3.2.2.1`.

---

### **Phase 3: Integrating Chat & Debug Console Menus (Target: v3.2.3.z)**
*Objective: Bring Chatbot UI states and Debug Console menu states under the purview of the single FSM.*

*   **Task v3.2.3.0: Integrate Chatbot Submission Flow**
    *   **File(s):** `src/components/chatbot.tsx`, `src/contexts/stock-analysis-context.tsx`. (Potentially deprecate `ChatbotFsmContext.tsx`).
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Chat submission is an asynchronous action.
        2.  `Chatbot.tsx`: `onSubmit` dispatches `SUBMIT_CHAT_MESSAGE_EVENT` to global FSM with payload (userInput, current data context, chat history).
        3.  `StockAnalysisContext.tsx`:
            *   Reducer handles `SUBMIT_CHAT_MESSAGE_EVENT`: Add user message to `chatHistory`. Transition to `CHAT_MESSAGE_PENDING`.
            *   Orchestrator `useEffect` triggers `chatServerAction`.
            *   `useEffect` for `chatActionState` handles result: Add model response/error to `chatHistory`. Update `chatbotRequestJson`/`chatbotResponseJson`. Dispatch `CHAT_MESSAGE_SUCCESS_EVENT` or `..._ERROR_EVENT`.
            *   Reducer handles success/error: Transition back to `IDLE` (or a state like `AWAITING_CHAT_INPUT`).
    *   **Testability:** Chat messages can be submitted. Global FSM reflects pending/completion. Chat history updates.
    *   **App Metadata:** Update to `v3.2.3.0`.

*   **Task v3.2.3.1: Chatbot UI State Management (Loading/Disabled)**
    *   **File(s):** `src/components/chatbot.tsx`, `src/contexts/stock-analysis-context.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* Input field and submit button in `Chatbot.tsx` need to be disabled during submission.
        2.  `Chatbot.tsx`: Derive `isChatPending` (or similar) directly from global `fsmState === GlobalFsmState.CHAT_MESSAGE_PENDING`.
        3.  If `ChatbotFsmContext` is being deprecated, ensure any other UI logic it handled is now covered by global FSM flags/state.
    *   **Testability:** Chat input/button disable correctly based on global FSM.
    *   **App Metadata:** Update to `v3.2.3.1`.

*   **Task v3.2.3.2: Integrate Debug Console Menu UI States (Optional but Recommended)**
    *   **File(s):** `src/components/debug-console.tsx`, `src/contexts/stock-analysis-context.tsx`. (Potentially deprecate `DebugConsoleFsmContext.tsx`).
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The open/closed state of Debug Console menus (Filter, Copy, Export).
        2.  Add flags to `GlobalFsmFlags`: e.g., `isDebugConsoleFilterMenuOpen: boolean`, `isDebugConsoleCopyMenuOpen: boolean`, `isDebugConsoleExportMenuOpen: boolean`.
        3.  `DebugConsole.tsx`: Dropdown triggers dispatch events to global FSM like `TOGGLE_DEBUG_CONSOLE_MENU_EVENT` (payload: `{ menu: 'filter' | 'copy' | 'export', isOpen: boolean }`).
        4.  Reducer updates the corresponding flag.
    *   **Testability:** Debug console menus open/close correctly, driven by global FSM flags.
    *   **App Metadata:** Update to `v3.2.3.2`.

---

### **Phase 4: Testing and Debugging (New Phase) (Target: v3.2.4.z)**
*Objective: Rigorous testing of the consolidated FSM across all application features and edge cases. Focus on stability, correct state transitions, accurate flag/variable updates, and absence of regressions.*

*   **Task v3.2.4.0: Comprehensive End-to-End Testing - Scenario 1 (Happy Paths)**
    *   **Action:** Test all primary user flows with valid inputs and expected API/AI responses:
        1.  Initial app load (default ticker or no ticker).
        2.  Successful "Analyze Stock" automated pipeline.
        3.  Successful "Generate AI Key Takeaways" after automated.
        4.  Successful "Generate AI Options Analysis" after automated.
        5.  Multiple successful chat interactions.
        6.  Changing ticker and re-running automated analysis.
        7.  Using all Debug Console and FSM Debug Card functionalities (export, copy, filter, toggle visibility).
    *   **Verification:** Monitor FSM states, flags, and variables via FSM Debug Card and console logs. Ensure UI elements (buttons, loading states, data displays) behave correctly. Verify data in context updates as expected.
    *   **App Metadata:** `v3.2.4.0` (if minor tweaks are needed from testing).

*   **Task v3.2.4.1: Comprehensive End-to-End Testing - Scenario 2 (Error & Edge Cases)**
    *   **Action:** Test system behavior under error conditions:
        1.  Invalid ticker input.
        2.  Simulated API failures (data fetch, TA calculation if possible to mock, or rely on actual API rate limits/errors if encountered).
        3.  Simulated AI flow failures (Key Takeaways, Options, Chat).
        4.  Rapidly clicking buttons or changing inputs during processing.
        5.  Attempting manual actions when prerequisites are not met.
        6.  Network interruptions (if testable).
    *   **Verification:** FSM transitions to appropriate `ERROR_...` states. `variables.lastError` is populated. UI displays user-friendly error messages. Application recovers gracefully to `IDLE` or a stable state. No crashes or unexpected UI hangs.
    *   **App Metadata:** `v3.2.4.1` (if fixes are made).

*   **Task v3.2.4.2: Log Review & Final Refinements**
    *   **Action:** Perform a final, thorough review of all client-side debug logs (with all sources enabled) and any relevant server-side logs generated during the testing phase.
    *   Identify and address any remaining anomalies, unexpected FSM transitions, incorrect flag/variable settings, or excessive/missing log messages.
    *   Focus on ensuring the "Failure Snapshot" from Debug Console exports is complete and provides maximum diagnostic value.
    *   **AI Agent - Chain of Thought for Refinement:** *Based on the logs from comprehensive testing, are there any states that are entered/exited too quickly? Are any flags not being reset correctly? Is `lastError` always cleared when returning to `IDLE` after a successful operation? Are there any race conditions evident in how quickly states transition versus how effects that depend on them run?*
    *   **App Metadata:** `v3.2.4.2` (for final tweaks).

---

### **Phase 5: FSM Debug Tools & Documentation Update (Target: v3.2.5.z)**
*Objective: Finalize the enhanced debugging tools and update all project documentation to reflect the new FSM architecture.*

*   **Task v3.2.5.0: Finalize Enhanced FSM Debug Card & Client Debug Console Exports**
    *   **File(s):** `src/components/fsm-state-debug-card.tsx`, `src/components/debug-console.tsx`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* The FSM Debug Card and console exports are key deliverables.
        2.  *`FsmStateDebugCard.tsx` Update:*
            *   Ensure it clearly displays the current `GlobalFsmState`, previous `GlobalFsmState`.
            *   Add a new section to display all `GlobalFsmFlags` (e.g., as a list of "FlagName: true/false").
            *   Add a new section to display key `GlobalFsmContextVariables` (e.g., `activeAnalysisTicker`, `userInputTicker`, relevant parts of `lastError`).
            *   Ensure its "Copy JSON" and "Export JSON" functionality correctly captures all this new FSM state, flags, and variables data.
        3.  *`DebugConsole.tsx` Update:*
            *   Modify `generateLogsTxtWithMetadata`, `generateLogsCsvWithMetadata`, and the direct JSON copy/export handlers.
            *   These functions must now receive or access the complete FSM state (state, flags, variables) from `StockAnalysisContext`.
            *   Prepend this full FSM snapshot to all exported/copied log data.
    *   **Testability:** FSM Debug Card displays all required FSM information. Log exports/copies from Debug Console contain the complete FSM snapshot.
    *   **App Metadata:** Update to `v3.2.5.0`.

*   **Task v3.2.5.1: Update All Project Documentation**
    *   **File(s):** `README.md`, `CHANGELOG.md`, `docs/FEAT_SCOPE_FsmConsolidation_v3.2.md`, `docs/FEAT_STATUS_FsmConsolidation_v3.2.md`.
    *   **AI Agent - Chain of Thought & Action:**
        1.  *Understand:* All documentation must reflect the new single FSM architecture.
        2.  *`README.md` Update:*
            *   Rewrite/update sections on State Management and FSM architecture to detail the single FSM, its states, the concept of flags and context variables.
            *   Update component descriptions (`MainTabContent`, `Chatbot`, etc.) to explain how they now interact with the global FSM.
            *   Describe the enhanced FSM Debug Card and the enriched data in Debug Console exports.
            *   Ensure commit procedures reflect the `v3.2.x.y` series.
        3.  *`CHANGELOG.md` Update:* Add entries for each task in the `v3.2.x.y` series, culminating in the completion of this "FSM Consolidation & Refactor" feature.
        4.  *`FEAT_STATUS_FsmConsolidation_v3.2.md` Update:* Mark the overall feature and all its phases/tasks as `COMPLETED`. Add final commit details.
        5.  *`FEAT_SCOPE_FsmConsolidation_v3.2.md` Update:* Mark as `COMPLETED` and ensure the "Implementation Plan" section accurately reflects the tasks undertaken.
    *   **Testability:** Review all updated documents for accuracy, completeness, and clarity.
    *   **App Metadata:** `v3.2.5.1` (or the final version from the previous task if no code changes here).

---

This phased plan provides a structured approach. Each task aims to be an atomic, testable unit of work suitable for AI-driven implementation with human oversight and testing.Okay, the new feature documentation files have been generated.

`docs/FEAT_SCOPE_FsmConsolidation_v3.2.md` now contains the detailed scope, objectives, value proposition, risks, and the refined 5-phase implementation plan (with "chain of thought" guidance for each task).

`docs/FEAT_STATUS_FsmConsolidation_v3.2.md` has been initialized, marking the feature as "PLANNED" and is ready to track progress through the phases and tasks.

I have also updated my internal understanding of your operating procedures, including the re-phasing and the requirement for automatic app metadata updates with code changes.

We are ready to begin **Phase 1: Foundation & Core FSM Setup**, starting with **Task v3.2.1.0: Define Initial Single FSM Structure & Core States**.

Please confirm when you'd like me to proceed with generating the code changes for this first task.