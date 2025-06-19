
# Feature Status Report: Debug Log Enhancements (StockSage v3.1.x.y)

**Document Version:** 1.0
**Date:** 2025-06-19
**Feature Target Application Version Series:** 3.1.x.y

## 1. Overall Feature Status

**Current Status:** `PLANNED`
**Last Updated:** 2025-06-19

**Summary:** The Debug Log Enhancements feature is planned for implementation. The scope includes improving log buffer management, reducing general log verbosity, and adding a mechanism for less verbose logging during initial application startup.

## 2. Phase & Task Status

### Phase 1: Core Buffer Enhancements & Initial Verbosity Reduction (Target: `v3.1.1.y`)
*   **Overall Phase Status:** `PENDING`
*   **Tasks:**
    *   **Task v3.1.1.1: Increase Max Log Buffer Size & Implement Wrap Indicator**
        *   **Status:** `PENDING`
        *   **Details:** Increase `MAX_BUFFER_SIZE` to 1000. Add a "LOG BUFFER WRAPPED" marker when buffer wraps. Update `DebugConsole` to highlight marker.
        *   **Assigned To:** AI Coding Agent
        *   **Estimated Completion:** TBD
        *   **Actual Completion:** TBD
        *   **Commit Hash:** N/A
    *   **Task v3.1.1.2: Initial Pass - Reduce General Log Verbosity**
        *   **Status:** `PENDING`
        *   **Details:** Review and refactor `logDebug` calls in display components, `StockAnalysisContext`, and `MainTabContent` to reduce chattiness and summarize large objects.
        *   **Assigned To:** AI Coding Agent
        *   **Estimated Completion:** TBD
        *   **Actual Completion:** TBD
        *   **Commit Hash:** N/A

### Phase 2: Startup-Specific Log Reduction & UI Toggle (Target: `v3.1.2.y`)
*   **Overall Phase Status:** `PENDING`
*   **Dependencies:** Completion of Phase 1 (v3.1.1.y)
*   **Tasks:**
    *   **Task v3.1.2.1: Implement Startup State Flag & UI Toggle**
        *   **Status:** `PENDING`
        *   **Details:** Add `isInitialAppStartupComplete` and `isReducedStartupLoggingEnabled` states to `StockAnalysisContext`. Add UI switch in `DebugSettingsCard`.
        *   **Assigned To:** AI Coding Agent
        *   **Estimated Completion:** TBD
        *   **Actual Completion:** TBD
        *   **Commit Hash:** N/A
    *   **Task v3.1.2.2: Implement Conditional Startup Logging Logic**
        *   **Status:** `PENDING`
        *   **Details:** Modify `logDebug` (or console interceptor) in `StockAnalysisContext` to suppress non-critical logs during startup if toggle is enabled. Log "Startup Complete" message.
        *   **Assigned To:** AI Coding Agent
        *   **Estimated Completion:** TBD
        *   **Actual Completion:** TBD
        *   **Commit Hash:** N/A

## 3. Feature Changelog & Commit History

| Date       | Version Tag (Task ID) | Commit Hash (if applicable) | Summary of Changes                                                                 | Status   |
| :--------- | :-------------------- | :-------------------------- | :--------------------------------------------------------------------------------- | :------- |
| 2025-06-19 | `v3.1.0.0` (Scope)    | N/A                         | Feature scope defined. Initial `FEAT_SCOPE` and `FEAT_STATUS` documents created. | PLANNED  |
|            |                       |                             |                                                                                    |          |

## 4. Document Changelog (for this FEAT_STATUS_xxx.md file)

*   **v1.0 (2025-06-19):** Initial document creation. Outlines feature phases, tasks, and initial status.

---
This status report will be updated as tasks are completed and committed.
