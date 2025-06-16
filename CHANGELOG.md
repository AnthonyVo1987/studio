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

