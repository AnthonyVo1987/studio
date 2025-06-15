# StockSage Change History

## Changelog (CHANGELOG.md)
*   **Version 1.0 (Task v2.9.B.4):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Created `CHANGELOG.md` to decouple detailed changelogs from `README.md`.
    *   Migrated "StockSage Application Commit Log" from `README.md`.
    *   This section will track changes to `CHANGELOG.md` itself. Future updates to the application commit log will be prepended to the section below.

---
## StockSage Application Commit Log (v2.x.y.z)

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme. Latest commits are at the top.

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
