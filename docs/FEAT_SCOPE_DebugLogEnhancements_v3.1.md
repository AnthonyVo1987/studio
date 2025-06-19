
# Feature Scope: Debug Log Enhancements (StockSage v3.1.x.y)

**Document Version:** 1.0
**Date:** 2025-06-19
**Target Application Version Series:** 3.1.x.y

## 1. Introduction & Objective

This document outlines the scope, requirements, and implementation plan for the "Debug Log Enhancements" feature in the StockSage application. The primary objective is to refine the client-side debug logging system to be more manageable, provide better log retention, offer more control over log verbosity, and improve the overall developer experience during debugging.

## 2. Feature Scoping & Detailed Analysis

### 2.1. Core Problem Areas Addressed
*   **Excessive Log Verbosity:** Current logging can be too dense, especially from frequently re-rendering UI components or during specific lifecycle events, making it difficult to isolate critical messages.
*   **Limited Log Retention:** The existing maximum log entry count (previously 300) may be insufficient for comprehensive debugging sessions.
*   **Lack of Wrap Indication:** No clear visual cue when the circular log buffer overwrites older entries.
*   **Startup Log Spam:** The initial application boot-up sequence can flood the console with messages, obscuring important early-state information or the "ready" state confirmation.

### 2.2. Proposed Enhancements & Requirements

#### 2.2.1. Consolidate and Reduce Excessive Console/Debug Messages
*   **Requirement:** Systematically review and reduce the volume of non-critical or redundant debug messages.
*   **Guidance for AI Agent:**
    *   Focus on `logDebug` calls within client components (`src/components/**/*.tsx`) and context files (`src/contexts/**/*.tsx`).
    *   For logs triggered by `useEffect` hooks reacting to prop changes:
        *   If a prop is a complex object/array (e.g., JSON string), consider logging only if its content has *semantically changed*, not just if the reference is new. If deep comparison is too complex, log a summary (e.g., length, hash, or key properties) instead of the full object on every change.
        *   Prioritize logging on actual state transitions or significant data processing events rather than every render cycle.
    *   When logging large data objects (e.g., API responses, parsed data structures), log a summary (e.g., `Object.keys()`, item counts, or a snippet) by default, rather than the entire object. Full object logging should be conditional or used sparingly.
    *   Maintain a balance: ensure logs crucial for understanding FSM transitions, API call lifecycles, error states, and significant user interactions are preserved.

#### 2.2.2. Increase Max Log Entries & Implement Circular Buffer Indication
*   **Requirement:** Increase the maximum number of log entries stored in the client-side buffer and provide a clear indication when the buffer wraps around.
*   **Guidance for AI Agent:**
    *   **Increase Max Entries:** Modify the `MAX_BUFFER_SIZE` constant in `src/lib/global-log-buffer.ts` from `300` to `1000`.
    *   **Circular Buffer Wrap Indication:**
        *   In `src/lib/global-log-buffer.ts`, when `globalLogEntries.push(newEntry)` causes the buffer to exceed `MAX_BUFFER_SIZE` and an old entry is `shift()`ed off:
            *   Insert a special marker entry at the *beginning* of the `globalLogEntries` array. This entry should be clearly identifiable, e.g., `{ type: 'system', source: 'LogBuffer', messages: ['--- LOG BUFFER WRAPPED (Oldest entries removed) ---'] }`.
            *   Ensure this marker entry uses a `LogSourceId` that is unlikely to be filtered out by default (e.g., a new one like `'LogBuffer'` or reuse `'DebugConsole'`).
        *   In `src/components/debug-console.tsx`, update the rendering logic to visually distinguish this "LOG BUFFER WRAPPED" message (e.g., different color, italics, a horizontal line before/after).

#### 2.2.3. Reduce Initial Startup Debug Logs with a Toggle
*   **Requirement:** Implement a mechanism to reduce log verbosity during the initial application startup phase, with a user-configurable toggle.
*   **Guidance for AI Agent:**
    *   **Startup State Flag & Toggle State Management (in `src/contexts/stock-analysis-context.tsx`):**
        *   Introduce a new boolean state variable, e.g., `isInitialAppStartupComplete` (default `false`).
        *   Introduce a new boolean state variable, e.g., `isReducedStartupLoggingEnabled` (default `true`).
        *   Provide a setter function for `isReducedStartupLoggingEnabled`.
        *   Logic to set `isInitialAppStartupComplete` to `true`: This should occur once the application has reached a stable, ready state after the initial full load. A good candidate is when the Global FSM first transitions to `FsmState.IDLE` *after* having successfully completed an initial automated analysis pipeline (e.g., after a sequence like `INITIALIZING_ANALYSIS` -> ... -> `FULL_ANALYSIS_COMPLETE` -> `PROCEED_TO_IDLE`). This needs to be robust to only trigger once per full page load/refresh.
    *   **UI Toggle (in `src/components/debug-settings-card.tsx`):**
        *   Add a new `<Switch />` component and `<Label />`.
        *   Label: "Enable Reduced Logging During Initial App Startup".
        *   The switch should control the `isReducedStartupLoggingEnabled` state from `StockAnalysisContext`.
    *   **Conditional Startup Logging Logic (in `src/contexts/stock-analysis-context.tsx`):**
        *   Modify the `logDebug` function (or the console interceptor logic that calls `addEntryToGlobalLogBuffer`):
            *   Before adding a log entry to the buffer, check the condition: `if (!isInitialAppStartupComplete && isReducedStartupLoggingEnabled)`.
            *   If this condition is true (i.e., startup not complete AND reduced logging is on), then only allow log entries from a predefined list of "critical" `LogSourceId`s (e.g., `'StockAnalysisContext'`, `'NATIVE_CONSOLE'` if message indicates error, `'DefinitionLoader'`, `'PolygonAdapter'` for critical errors) OR if the log entry's `type` is `'error'` or `'warn'`. All other `logDebug` calls during this phase should be suppressed (i.e., not added to `globalLogBuffer`).
        *   After `isInitialAppStartupComplete` becomes `true`, immediately emit a distinct `logDebug` message to the console, e.g., `logDebug('StockAnalysisContext', 'StartupComplete', 'Initial application startup sequence complete. Full debug logging is now active.')`.

## 3. Value Added Proposition

*   **Improved Debuggability:** Makes it significantly easier for developers to find relevant log messages, especially during noisy application startup and in long-running debugging sessions.
*   **Enhanced Developer Experience:** A less cluttered console reduces cognitive load and speeds up troubleshooting.
*   **Better Performance (Marginal):** Reducing the volume of console I/O and log buffer manipulations can offer slight client-side performance benefits.
*   **Flexible Logging Control:** The startup log toggle allows developers to choose between detailed startup tracing and a quieter initial load.
*   **Increased Log History:** A larger buffer capacity (1000 entries) provides more context for diagnosing issues that unfold over time.

## 4. Risks Assessment & Potential Pain Points

*   **Risk of Hiding Critical Startup Information:** If the "reduced startup logging" logic is too aggressive or the definition of "critical" sources/types is too narrow, essential early-stage debug messages or error indicators might be missed.
*   **Defining "InitialAppStartupComplete" Accurately:** Pinpointing the exact moment the app transitions from "startup" to "fully operational" requires careful consideration of the FSM states and data loading sequences. An incorrect trigger could lead to premature full logging or prolonged reduced logging.
*   **Complexity of Conditional Logging Logic:** Modifying the core `logDebug` or console interception mechanism to handle the startup state and toggle needs to be done carefully to avoid introducing new bugs or performance issues.
*   **Refactoring Effort for General Verbosity:** While the goal is to reduce noise, identifying which existing logs are "excessive" versus "essential" can be subjective and may require careful review of many components. The AI agent will need clear heuristics.
*   **Testing Thoroughness:** Verifying all logging scenarios (reduced startup, full startup, post-startup, buffer wrapping, toggle on/off, filter interactions) will be crucial.

## 5. Implementation Task Breakdown Plan

This feature will be implemented in phases, corresponding to the `v3.1.x.y` versioning scheme.

### Phase 1: Core Buffer Enhancements & Initial Verbosity Reduction (Target: `v3.1.1.y`)

*   **Task v3.1.1.1: Increase Max Log Buffer Size & Implement Wrap Indicator**
    *   **File(s):** `src/lib/global-log-buffer.ts`, `src/components/debug-console.tsx`
    *   **Details:**
        1.  In `src/lib/global-log-buffer.ts`:
            *   Increase `MAX_BUFFER_SIZE` from `300` to `1000`.
            *   Modify `addEntryToGlobalLogBuffer`: When shifting an old entry, add a new marker entry ` { id: generateId(), timestamp: new Date().toISOString(), type: 'system', source: 'LogBuffer', messages: ['--- LOG BUFFER WRAPPED (Oldest entries removed) ---'] }` to the *beginning* of `globalLogEntries`.
        2.  In `src/components/debug-console.tsx`:
            *   Modify the log rendering logic to visually highlight the "LOG BUFFER WRAPPED" message (e.g., distinct style, horizontal rule).

*   **Task v3.1.1.2: Initial Pass - Reduce General Log Verbosity**
    *   **File(s):** Client components in `src/components/`, `src/contexts/stock-analysis-context.tsx`, `src/components/main-tab-content.tsx`.
    *   **Details:**
        1.  **Display Components:**
            *   Review `useEffect` hooks in display components (`KeyMetricsDisplay`, `StockSnapshotDetailsDisplay`, etc.).
            *   For "PropsReceived" logs, attempt to log only if data *content* has changed, not just reference. If complex, log summary (length/keys).
            *   For parsed data logs, log summaries (e.g., `Object.keys(parsedData)`, `parsedData.contracts.length`) instead of full objects.
        2.  **`StockAnalysisContext` / `MainTabContent`:**
            *   Review `logDebug` calls in FSM reducers and effects. Reduce frequency for highly repetitive, low-value logs. Prioritize logs for state transitions, errors, significant data events.
        *   **Action:** AI Agent to identify specific `logDebug` calls and propose modifications based on these guidelines.

### Phase 2: Startup-Specific Log Reduction & UI Toggle (Target: `v3.1.2.y`)

*   **Task v3.1.2.1: Implement Startup State Flag & UI Toggle**
    *   **File(s):** `src/contexts/stock-analysis-context.tsx`, `src/components/debug-settings-card.tsx`.
    *   **Details:**
        1.  In `StockAnalysisContext.tsx`:
            *   Add state: `isInitialAppStartupComplete: boolean` (default: `false`).
            *   Add state: `isReducedStartupLoggingEnabled: boolean` (default: `true`).
            *   Add setter: `setReducedStartupLoggingEnabled(enabled: boolean): void`.
            *   In the Global FSM `useEffect` orchestrator, or where `FULL_ANALYSIS_COMPLETE` transitions to `IDLE` for the *first time*: set `isInitialAppStartupComplete = true`. This logic must be idempotent per page load. Consider using a `useRef` to track if it has already been set.
        2.  In `DebugSettingsCard.tsx`:
            *   Add a new `<Switch />` and `<Label />` for "Enable Reduced Logging During Initial App Startup", bound to `isReducedStartupLoggingEnabled` and `setReducedStartupLoggingEnabled` from context.

*   **Task v3.1.2.2: Implement Conditional Startup Logging Logic**
    *   **File(s):** `src/contexts/stock-analysis-context.tsx` (specifically the `logDebug` function or console interceptor logic).
    *   **Details:**
        1.  Modify the core logging mechanism:
            *   Before `addEntryToGlobalLogBuffer` is called, check:
                ```javascript
                if (!contextState.isInitialAppStartupComplete && contextState.isReducedStartupLoggingEnabled) {
                    // If it's reduced startup logging phase
                    const criticalSources: LogSourceId[] = ['StockAnalysisContext', 'NATIVE_CONSOLE', /* add others if truly critical at startup like DefinitionLoader errors */];
                    const isCriticalSource = entrySource && criticalSources.includes(entrySource);
                    const isErrorOrWarn = entryType === 'error' || entryType === 'warn';

                    if (!isCriticalSource && !isErrorOrWarn) {
                        return; // Suppress log
                    }
                }
                // Proceed to addEntryToGlobalLogBuffer...
                ```
            *   Ensure `entrySource` and `entryType` are available at this check point.
        2.  In `StockAnalysisContext.tsx`, when `isInitialAppStartupComplete` is set to `true`:
            *   Call `logDebug('StockAnalysisContext', 'StartupComplete', 'Initial application startup sequence complete. Full debug logging is now active.')`.

## 6. Document Changelog

*   **v1.0 (2025-06-19):** Initial document creation. Includes full scope, analysis, risks, and phased implementation plan for Debug Log Enhancements feature (v3.1.x.y).

---
This document will be updated as the feature progresses through its implementation phases.
