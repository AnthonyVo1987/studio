# StockSage Change History

## Changelog (CHANGELOG.md)
*   **Version 1.50 (Task v2.9.C.0):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.50) with version `v2.9.C.0` after Chatbot FSM pilot. Added new Task 9.C.0 to Phased Plan. Updated AI operational rules for XML output (Section 0.5).
*   **Version 1.1 (Task v2.9.B.9):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.49) with new AI operational rules (XML output, token efficiency, immediate coding post-approval).
*   **Version 1.0 (Task v2.9.B.4):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Created `CHANGELOG.md` to decouple detailed changelogs from `README.md`.
    *   Migrated "StockSage Application Commit Log" from `README.md`.
    *   This section will track changes to `CHANGELOG.md` itself. Future updates to the application commit log will be prepended to the section below.

---
## StockSage Application Commit Log (v2.x.y.z)

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme. Latest commits are at the top.

---
**App Version:** `v2.9.C.I` (Fix Broken AI Chat Functionality)
**Tag:** `Phase-9_Task-9.C.I_FixBrokenAiChat` - Commit Hash: `fb9041c0`
**Subject:** `fix(chat): Resolve broken AI Chat by correcting useActionState and handling (v2.9.C.I)`
**Details:**
This version addresses a critical bug where the AI Chat was completely non-functional (typing or pressing prompt buttons did nothing). The root cause was an incorrect initialization and handling of the `useActionState` hook in `MainTabContent.tsx` for the `chatServerAction`.

Key changes included in v2.9.C.I:
- **`src/components/main-tab-content.tsx`:**
    - Corrected the initialization of `useActionState` for `chatServerAction`. It now correctly uses the server action function (`chatServerAction`) and a locally defined `initialLocalChatActionState` as arguments.
    - Reinstated and refined the `useEffect` hook that listens to changes in `chatActionState`. This effect now properly:
        - Handles `status: 'success'`: Parses `chatActionState.data.chatbotResponseJson`, creates a `ChatMessage` of role 'model', and adds it to the global chat history via `addChatMessageToGlobalContext`. It includes a check to prevent duplicate model responses.
        - Handles `status: 'error'`: Logs the error and adds an appropriate error message to the chat history.
        - Updates debug JSONs (`chatbotRequestJson`, `chatbotResponseJson`) in both success and error cases.
    - Ensured `chatFormAction` (the dispatcher from `useActionState`) is correctly passed as a prop to `ChatbotFsmProvider`.
    - Ensured `contextChatHistoryRef` is used within the `useEffect` for `chatActionState` to prevent duplicate message dispatches if the effect re-runs.
- Application version updated to `v2.9.C.I` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect the new version and completed task.

These changes restore the AI Chat functionality, allowing users to interact with the chatbot via text input and example prompt buttons.
---
**App Version:** `v2.9.C.H` (Chat/Export UX Fixes & Options Table JSON Export)
**Tag:** `Phase-9_Task-9.C.H_ChatUX-ExportLogic-OptionsJSON` - Commit Hash: `(previous_commit_for_C.H)`
**Subject:** `fix(chat,export): Improve Chat UX, refine export logic, add JSON export to Options Table (v2.9.C.H)`
**Details:**
This version addresses multiple UI/UX issues and adds new export functionality:
- **AI Chat Prompt Button Enhancement (`src/components/chatbot.tsx`):**
    - Clicking an example chat prompt button now immediately submits the prompt. The `handleExamplePromptClick` function was modified to dispatch `USER_INPUT_CHANGED` followed by `SUBMIT_MESSAGE_REQUESTED` to the `ChatbotFsmContext`, which then triggers the form submission logic via its internal effect.
- **Dynamic Combined Data Export/Copy Logic (`src/components/main-tab-content.tsx`):**
    - `getCombinedDataForExport` now dynamically includes `aiKeyTakeaways` and `aiOptionsAnalysis` JSONs only if their respective data is valid and available (checked using `isDataReadyForProcessing`). The base export always includes ticker, market status, stock snapshot, standard TAs, and AI analyzed TA.
    - The "Export All to JSON" and "Copy All to JSON" buttons are now disabled if any core analysis pipeline (automated, manual key takeaways, manual options analysis) is active, preventing data inconsistencies during export/copy.
    - `isAllDataReadyForCombinedExport` (now `isBaseDataReadyForCombinedExport`) was updated to only check the readiness of the base data components for enabling these buttons.
- **Options Chain Table - JSON Export/Copy (`src/components/options-chain-table.tsx`):**
    - Added "Export JSON" and "Copy JSON" buttons to the Options Chain Table card header.
    - Implemented `handleExportOptionsJson` to download the full `parsedData` (options chain data) as a JSON file.
    - Implemented `handleCopyOptionsJson` to copy the `parsedData` as a JSON string to the clipboard.
    - These new buttons are disabled if the options chain data is not ready for export.
- Application version updated to `v2.9.C.H` in `src/components/layout/header.tsx`.
---
**App Version:** `v2.9.C.G` (AI Options Analysis Fix & Simplification, Restore Options Table)
**Tag:** `Phase-9_Task-9.C.G_FixSimplifyAiOptionsRestoreTable` - Commit Hash: `(previous_commit_for_C.G)`
**Subject:** `fix(ai,ui): Simplify AI Options, fix crash & restore Options Table (v2.9.C.G)`
**Details:**
This version addresses a crash in AI Options Analysis, simplifies its output, and ensures the Options Chain Table is consistently rendered.
- **AI Options Analysis Simplification:**
    - **Schema (`src/ai/schemas/ai-options-analysis-schemas.ts`):** `AiOptionsAnalysisOutputSchema` modified to only include `callWalls` and `putWalls`. Removed `callClusters`, `putClusters`, and `analysisSummary`.
    - **Flow (`src/ai/flows/analyze-options-chain-flow.ts`):**
        - Prompt updated to only request Call/Put Walls (max 3 each). Removed instructions for clusters and summary.
        - Flow now ensures output strictly conforms to the simplified schema, returning `{ callWalls: [], putWalls: [] }` on error or malformed AI response.
        - Explicitly limits walls to max 3 per type.
    - **Server Action (`src/actions/perform-ai-options-analysis-action.ts`):**
        - Expects simplified output from the flow.
        - `baseErrorReturn` updated to provide `{ callWalls: [], putWalls: [] }` in `aiOptionsAnalysisJson` on error.
        - Treats non-conforming flow output as an error.
    - **Display Component (`src/components/ai-options-analysis-display.tsx`):**
        - UI updated to only display Call/Put Walls. Removed cluster and summary rendering.
        - Export/Copy JSON now handles the simplified structure.
- **Options Chain Table Visibility (`src/components/options-chain-table.tsx`):**
    - Reviewed and ensured the component robustly renders its card shell and displays appropriate error/skipped messages if `optionsChainJson` indicates such states, preventing it from disappearing.
- Application version updated to `v2.9.C.G`.
---
**App Version:** `v2.9.C.F` (Fix Header Parsing Error)
**Tag:** `Phase-9_Task-9.C.F_FixHeaderParseError` - Commit Hash: `(previous_commit_for_C.F)`
**Subject:** `fix(ui): Remove extraneous backtick from header.tsx (v2.9.C.F)`
**Details:**
Removed a stray triple backtick (```) from the end of `src/components/layout/header.tsx` that was causing a parsing error and preventing the application from rendering. Application version updated to `v2.9.C.F`.
---
**App Version:** `v2.9.C.E` (Resolve FsmStateDebugCard ReferenceError)
**Tag:** `Phase-9_Task-9.C.E_FixFsmCardRefError` - Commit Hash: `08df82c7`
**Subject:** `fix(ui): Resolve ReferenceError for console states in FsmStateDebugCard (v2.9.C.E)`
**Details:**
This version addresses a `ReferenceError` in `FsmStateDebugCard.tsx` where `isClientDebugConsoleEnabled` and `isClientDebugConsoleOpen` were used without being destructured from the `useStockAnalysis()` hook. The fix ensures these values are correctly obtained from the context, allowing the FSM Debug Card to accurately calculate its position relative to the Client Debug Console. Application version updated to `v2.9.C.E`.
---
**App Version:** `v2.9.C.D` (Fix FSM Debug Card Context Provider Error)
**Tag:** `Phase-9_Task-9.C.D_FixFsmCardContextProvider` - Commit Hash: `(previous_commit_for_C.D)`
**Subject:** `fix(fsm): Resolve ChatbotFSM context error in FsmStateDebugCard & prevent update loops (v2.9.C.D)`
**Details:**
Addressed an error where `FsmStateDebugCard` attempted to use `useChatbotFsm` without being a descendant of `ChatbotFsmProvider`. The fix involved reverting to a model where local FSM contexts (`ChatbotFsmContext`, `DebugConsoleFsmContext`) report their display state tuples (Previous, Current, Target) to `StockAnalysisContext`. `FsmStateDebugCard` now consumes these display states from `StockAnalysisContext`. Setters in `StockAnalysisContext` for these display tuples were made more robust to prevent re-renders if the actual display data hasn't changed, mitigating potential "maximum update depth" errors. Application version updated to `v2.9.C.D`.
---
**App Version:** `v2.9.C.C` (Fix FSM Display Maximum Update Depth Error)
**Tag:** `Phase-9_Task-9.C.C_FixFsmDisplayMaxUpdateDepth` - Commit Hash: `(previous_commit_for_C.C)`
**Subject:** `fix(fsm): Refactor FSM state display to prevent maximum update depth error (v2.9.C.C)`
**Details:**
Refactored the FSM state display mechanism to prevent "Maximum update depth exceeded" errors. Removed centralized FSM display state variables (`mainTabFsmDisplay`, `chatbotFsmDisplay`, `debugConsoleMenuFsmDisplay`) from `StockAnalysisContext`. `ChatbotFsmContext` and `DebugConsoleFsmContext` now directly expose their FSM states (previous, current, target). `FsmStateDebugCard.tsx` was updated to consume these states directly from their respective contexts and receive Main Tab FSM state via props. This decentralization breaks update loops. Application version updated to `v2.9.C.C`.
---
**App Version:** `v2.9.C.B` (Fix Debug Console FSM Display Prop Error)
**Tag:** `Phase-9_Task-9.C.B_FixDebugConsoleFsmProp` - Commit Hash: `(previous_commit_for_C.B)`
**Subject:** `fix(fsm): Correctly pass setDebugConsoleMenuFsmDisplayState prop (v2.9.C.B)`
**Details:**
Resolved a `TypeError: setDebugConsoleMenuFsmDisplayState is not a function` by ensuring the `setDebugConsoleMenuFsmDisplay` function from `StockAnalysisContext` is correctly passed as the `setDebugConsoleMenuFsmDisplayState` prop to `DebugConsoleFsmProvider` in `page.tsx`. Application version updated to `v2.9.C.B`.
---
**App Version:** `v2.9.C.A` (Consolidated FSM Debug Card Feature)
**Tag:** `Phase-9_Task-9.C.A_ConsolidatedFsmDebugCard` - Commit Hash: `(previous_commit_for_C.A)`
**Subject:** `feat(debug): Implement consolidated FSM State Debug Card & relocate Global FSM display (v2.9.C.A)`
**Details:**
Implemented a new "FSM State Debug Card" to provide a centralized view of Previous, Current, and Target states for all major FSMs (Global App, Main Tab UI, Chatbot UI, Debug Console Menu UI).
- Global FSM display (Prev/Curr/Target) relocated to the main application header.
- Added a new toggle switch on the main page to show/hide the FSM State Debug Card (enabled by default).
- The FSM State Debug Card appears above the Client Debug Console and includes "Copy JSON" and "Export JSON" functionality for all displayed FSM states.
- Local FSM display details removed from individual component headers and now reported to `StockAnalysisContext` for consumption by the new debug card.
- Application version updated to `v2.9.C.A`.
---
**App Version:** `v2.9.C.9` (Consolidated Bug Fixes & Feature Enhancements)
**Tag:** `Phase-9_Task-9.C.9_ConsolidatedFixesAndFeatures` - Commit Hash: `3684d4d6`
**Subject:** `fix(fsm,ui): Consolidate fixes for FSMs, button states, exports & enhance debug (v2.9.C.9)`
**Details:**
This version encapsulates a series of critical bug fixes and feature enhancements made from v2.9.C.0 through v2.9.C.9, improving application stability, FSM behavior, and debuggability.

Key changes included up to v2.9.C.9:
-   **Chatbot FSM Pilot (v2.9.C.0):** Introduced a dedicated FSM for `Chatbot.tsx` UI state management.
-   **Server Action Initial State Export Fixes (v2.9.C.1 - v2.9.C.5):**
    -   Resolved multiple build/runtime errors caused by missing exports for `initialStockDataFetchResult`, `initialAnalyzeTaState`, `initialPerformAiAnalysisState`, and `initialPerformAiOptionsAnalysisState` from their respective server action files.
    -   Corrected the approach by defining these initial states directly in the client-side `StockAnalysisContext.tsx` where `useActionState` is used, as server actions cannot export non-function values. This addressed the "A 'use server' file can only export async functions" error.
-   **"Analyze Stock" Button Re-enable Fix (v2.9.C.6):** Modified the local FSM in `MainTabContent.tsx` to correctly transition to `INPUT_VALID` when the global FSM returns to `IDLE` after a full analysis, ensuring the button becomes active again.
-   **On-Demand AI Button Availability Fix (v2.9.C.7):** Refined local FSM logic in `MainTabContent.tsx` to ensure `activeAnalysisTicker` is preserved correctly after a successful automated pipeline, allowing manual AI buttons ("Generate AI Key Takeaways", "Generate AI Options Analysis") to become enabled.
-   **Granular FSM State Display Feature (v2.9.C.8):** Enhanced debuggability by adding "Previous", "Current", and "Target" state displays for all local FSMs (`MainTabContent`, `ChatbotFSMContext`, `DebugConsoleFSMContext`) in their respective UI components.
-   **Number Formatting TypeError Fix (v2.9.C.9):** Refactored `formatNumber` in `src/lib/number-utils.ts` to prevent `TypeError` when handling potentially undefined inputs, resolving unexpected server response errors originating from server actions using these utilities.
-   Application version updated incrementally in `src/components/layout/header.tsx` and relevant documentation throughout these changes.

These consolidated changes result in a more robust, debuggable, and user-friendly application state.
---
**App Version:** `v2.9.C.0` (Pilot Chatbot FSM Refactor)
**Tag:** `Phase-9_Task-9.C.0_PilotChatbotFSM` - Commit Hash: `a0c733ee`
**Subject:** `feat(chatbot): Pilot FSM for Chatbot UI state management (v2.9.C.0)`
**Details:**
Introduced a dedicated Finite State Machine (FSM) and React Context (`ChatbotFsmContext`) to manage the UI states of the `Chatbot.tsx` component. This refactor encapsulates Chatbot's internal UI logic (input handling, submission state) within its own FSM, improving modularity and predictability.

Key changes included in v2.9.C.0:
- Created `src/contexts/chatbot-fsm-context.tsx` defining:
    - `ChatbotFsmInternalState` (IDLE, PROCESSING_USER_INPUT, SUBMITTING_MESSAGE).
    - `ChatbotFsmEvent` (USER_INPUT_CHANGED, SUBMIT_MESSAGE_REQUESTED, SUBMISSION_CONCLUDED).
    - `ChatbotFsmProvider` to manage and provide the FSM state and dispatch.
    - `useChatbotFsm` hook.
- Refactored `src/components/chatbot.tsx`:
    - Now consumes `ChatbotFsmContext` via `useChatbotFsm`.
    - Internal `userInput` state removed; FSM now manages `userInput`.
    - `handleSubmit` (triggered by form submission or Enter key) now dispatches `SUBMIT_MESSAGE_REQUESTED` to the Chatbot FSM.
    - An effect in `ChatbotFsmProvider` handles the actual server action call (`chatFormAction`) and global chat message addition when the FSM is in `SUBMITTING_MESSAGE`.
    - `isChatPending` prop (from `MainTabContent`) is used by `ChatbotFsmProvider`'s effect to dispatch `SUBMISSION_CONCLUDED` to the Chatbot FSM when the server action completes.
- Modified `src/components/main-tab-content.tsx`:
    - Wraps the `<Chatbot />` component with `<ChatbotFsmProvider />`.
    - Passes necessary props to `ChatbotFsmProvider`, including `chatFormAction`, `addChatMessageToGlobalContext`, relevant data JSONs, and `isChatPending`.
- Updated application version to `v2.9.C.0` in `src/components/layout/header.tsx`.
- Updated `README.md` and `CHANGELOG.md` to reflect the new version, completed task, new AI operational rules, and commit details.

This pilot refactor improves the `Chatbot` component's state management, making it more robust and easier to maintain, while decoupling its UI logic from the main application FSM.
---
**App Version:** `v2.9.B.9` (Correct Default Log Source Configuration)
**Tag:** `Phase-9_Task-9.B.9_CorrectDefaultLogConfig` - Commit Hash: `c4637481`
**Subject:** `fix(debug): Correct default log source config & update AI rules (v2.9.B.9)`
**Details:**
Corrected `defaultLogSourceConfig` in `src/lib/debug-log-types.ts` to ensure all log sources (except `OptionsChainTable`) are set to `true` by default when the client debug console is active. This provides a better initial debugging experience. Updated README.md (v1.49) to include new AI operational rules regarding XML output and interaction efficiency. UI Header updated to `v2.9.B.9`.
---
**App Version:** `v2.9.B.8` (Enhance Debug Console Defaults & FSM State Display)
**Tag:** `Phase-9_Task-9.B.8_EnhanceDebugConsole` - Commit Hash: `(previous_commit_hash_for_B8)`
**Subject:** `feat(debug): Enhance console defaults, display Prev/Curr/Target FSM states (v2.9.B.8)`
**Details:**
Enabled client debug console by default, increased max log entries to 1000. `OptionsChainTable` log source now defaults to OFF when console is enabled. Added Previous, Current, and Target FSM state display to the debug console banner for easier FSM debugging. UI Header updated to `v2.9.B.8`.
---
**App Version:** `v2.9.B.7` (Fix On-Demand AI Button Availability)
**Tag:** `Phase-9_Task-9.B.7_FixOnDemandButtonAvailability` - Commit Hash: `(previous_commit_hash_for_B7)`
**Subject:** `fix(ui): Preserve activeAnalysisTicker to enable on-demand AI buttons (v2.9.B.7)`
**Details:**
Modified `MainTabContent.tsx` to stop resetting `activeAnalysisTicker` to `null` when the FSM transitions to `IDLE`. This ensures that the `activeAnalysisTicker` (for which data has been loaded) persists, allowing the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons to become enabled after the main "Analyze Stock" pipeline completes. UI Header updated to `v2.9.B.7`.
---
**App Version:** `v2.9.B.6` (Fix Chatbot Issues)
**Tag:** `Phase-9_Task-9.B.6_FixChatIssues` - Commit Hash: `(previous_commit_hash_for_B6)`
**Subject:** `fix(chat): Prevent duplicate messages & wrap action in startTransition (v2.9.B.6)`
**Details:**
Wrapped `chatFormAction` call in `Chatbot.tsx` in `React.startTransition` to resolve `useActionState` warning. Refined `useEffect` for `chatActionState` in `MainTabContent.tsx` by adjusting dependencies and adding a check against the last message in `contextChatHistoryRef.current` to prevent duplicate message dispatches to the FSM. UI Header updated to `v2.9.B.6`.
---
**App Version:** `v2.9.B.5` (Safer Error Serialization in Polygon Adapter)
**Tag:** `Phase-9_Task-9.B.5_SaferErrorSerialization` - Commit Hash: `(previous_commit_hash_for_B5)`
**Subject:** `fix(server): Implement safer error serialization in Polygon adapter (v2.9.B.5)`
**Details:**
Modified `getFullStockData` in `src/services/data-sources/adapters/polygon-adapter.ts` to serialize caught errors into plain objects with specific, known-safe properties (`name`, `message`, limited `stack`, `code`) for `rawErrorDetails` and `rawOverallError`. This prevents issues with complex error objects causing client-side deserialization failures in server action responses. UI Header updated to `v2.9.B.5`.
---
**App Version:** `v2.9.B.4` (Decouple Changelogs to CHANGELOG.md)
**Tag:** `Phase-9_Task-9.B.4_DecoupleChangelogs` - Commit Hash: `(user_provided_hash_for_B4_or_placeholder)`
**Subject:** `docs(changelog): Decouple changelogs into new CHANGELOG.md (v2.9.B.4)`
**Details:**
Created `CHANGELOG.md` and migrated detailed PRD/Operating Manual changelog and application commit log from `README.md`. `README.md` (v1.48) now refers to `CHANGELOG.md` for this information.
---
**App Version:** `v2.9.B.3` (Fix Stuck UI Loop - Event-Driven FSM Transition)
**Tag:** `Phase-9_Task-9.B.3_FixFSMLoopEventDriven` - Commit Hash: `6b456a93`
**Subject:** `fix(fsm): Implement event-driven transition to FULL_ANALYSIS_COMPLETE (v2.9.B.3)`
**Details:**
Modified FSM to use an explicit `FINALIZE_AUTOMATED_PIPELINE` event dispatched from `MainTabContent` when `AI_TA_SUCCEEDED` or `AI_TA_FAILED`. The `fsmReducer` now handles this event to transition to `FULL_ANALYSIS_COMPLETE`. This resolves the stuck UI issue by ensuring the FSM correctly reaches an `IDLE` state. UI Header updated to `v2.9.B.3`.
---
**App Version:** `v2.9.B.2` (Further Debug Stuck UI - FSM Reducer Hardening)
**Tag:** `Phase-9_Task-9.B.2_DebugFSMLoopReducer` - Commit Hash: `9e57850e`
**Subject:** `feat(fsm): Add entry logging to reducer and simplify AI_TA terminal states for debug (v2.9.B.2)`
**Details:**
Added entry logging to `fsmReducer` and simplified `AI_TA_SUCCEEDED`/`FAILED` cases by removing internal logs to ensure direct transition to `FULL_ANALYSIS_COMPLETE`. UI Header updated to `v2.9.B.2`.
---
**App Version:** `v2.9.B.1` (Fix Stuck UI Loop - FSM Reducer)
**Tag:** `Phase-9_Task-9.B.1_FixFSMLoopReducer` - Commit Hash: `45af28c8`
**Subject:** `fix(fsm): Correct FSM transition to fix stuck UI (v2.9.B.1)`
**Details:**
Corrected the `fsmReducer` in `StockAnalysisContext` to ensure `AI_TA_SUCCEEDED` and `AI_TA_FAILED` states explicitly return `FsmState.FULL_ANALYSIS_COMPLETE`, aiming to fix the UI getting stuck. UI Header updated to `v2.9.B.1`.
---
**App Version:** `v2.9.B.0` (Fix SSR ReferenceError for context functions)
**Tag:** `Phase-9_Task-9.B.0_FixContextFuncSSR` - Commit Hash: `31e36f14`
**Subject:** `fix(ssr): Define context log source functions plainly to resolve ReferenceError (v2.9.B.0)`
**Details:**
Addressed SSR ReferenceError for `disableAllLogSources` by changing it and `enableAllLogSources` to plain functions in `StockAnalysisContext`. UI Header updated to `v2.9.B.0`.
---
**App Version:** `v2.9.A.Z` (Attempt to Fix Stuck UI & Broken Logs - ISSUES PERSIST)
**Tag:** `Phase-9_Task-9.A.Z_AttemptFixUI-Logs` - Commit Hash: `2c7498c4`
**Subject:** `fix(app): Attempt to resolve stuck UI and broken console logs (v2.9.A.Z)`
**Details:**
This commit includes changes intended to address two critical issues:
1. Stuck UI after 'Analyze Stock': Ensured FSM transitions correctly from AI_TA_SUCCEEDED/FAILED to FULL_ANALYSIS_COMPLETE and then to IDLE. Added robust logging in MainTabContent's useEffect for PROCEED_TO_IDLE dispatch. (Note: This issue remained unresolved post-commit.)
2. Broken Client Console Logs: Re-verified and ensured simplified dependency array for console interception useEffect in StockAnalysisContext. Added extensive diagnostic logging. (Note: This issue also remained unresolved post-commit.)
UI Header updated to `v2.9.A.Z`. `README.md` updated.
---
*(Older commit logs would continue here if they existed in the original README.md Section 7)*

```