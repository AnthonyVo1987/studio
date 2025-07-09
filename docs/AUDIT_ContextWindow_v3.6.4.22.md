# Codebase & Context Window Audit (v3.6.4.22)

**Document Version:** 1.0
**Date:** 2025-08-28
**Audit Target Application Version:** v3.6.4.22

## 1. Introduction & Objective

This document provides a comprehensive audit of the StockSage application's codebase as of version `v3.6.4.22`. The primary objectives are:
1.  To perform a full, end-to-end execution trace of the application's core data analysis pipeline to verify its current architectural state.
2.  To estimate the total "context window" size required for an AI model to fully comprehend the entire codebase, in order to diagnose and mitigate issues like tunnel vision and incorrect premises during AI-assisted development.

This audit was initiated in response to recent development challenges and serves as a foundational understanding for future work.

## 2. Full Codebase Audit & Execution Path Analysis

The application's architecture has stabilized around a deterministic model driven by two key files: `stock-analysis-context.tsx` (the central state manager) and `main-tab-content.tsx` (the user-facing action orchestrator).

### Core Execution Path: "Analyze Stock" Pipeline

1.  **Startup & Initialization (`stock-analysis-context.tsx`):**
    *   On initial application load, the `StockAnalysisProvider` initializes all state variables.
    *   A critical side effect is triggered: a `useEffect` hook calls the `getOptionsExpirationsAction` to fetch all available expiration dates for the default ticker ("NVDA").
    *   Upon successful retrieval, the `findNextAvailableDate` utility is used to determine the most logical upcoming expiration, and this value is set in the `selectedExpirationDate` state, pre-populating the UI correctly.

2.  **User Action (`main-tab-content.tsx`):**
    *   The user clicks the "Analyze Stock" button.
    *   The `handleAnalyzeStockSubmit` handler is invoked, dispatching a `START_FULL_ANALYSIS` event to the global Finite State Machine (FSM).

3.  **FSM State Change & Stale Context Prevention (`stock-analysis-context.tsx`):**
    *   The `fsmReducer` processes the `START_FULL_ANALYSIS` event. It updates the `activeTicker` variable from its initial `null` value to the requested ticker (e.g., "NVDA").
    *   This state change triggers a specialized `useEffect` hook that watches for changes in `activeTicker`.
    *   **The v3.6.4.21 Bug Fix:** This hook's logic is now robust. It uses a `useRef` to compare the *previous* ticker value to the *current* one. On the initial analysis, the `previousTicker` is `null`, so the condition to reset the options state is **false**. This correctly preserves the pre-fetched expiration date for the first pipeline run. On subsequent runs with a different ticker, the condition is `true`, and the state is correctly reset to prevent using stale options data.

4.  **Deterministic Pipeline Orchestration (`main-tab-content.tsx`):**
    *   The primary orchestrator, a `useEffect` hook in `main-tab-content.tsx`, is triggered by the FSM state changing to `DATA_FETCH_IN_PROGRESS`.
    *   It reads the user's current option settings (`selectedExpirationDate`, `optionType`, etc.) from the context.
    *   It calls the `fetchStockDataAction` with `await`, ensuring this step completes before proceeding.
    *   The result (success or failure) is dispatched back to the FSM.

5.  **Sequential Pipeline Execution:**
    *   The FSM transitions to the next state (e.g., `CALCULATING_AI_TA`).
    *   The orchestrator `useEffect` runs again, hitting the new `case` in its `switch` statement.
    *   This `await -> dispatch` loop continues for each step of the pipeline (TA calculation, Key Takeaways, Options Analysis), creating a predictable, traceable, and sequential workflow.

### Data Flow Summary

*   **Data Adapter (`polygon-adapter.ts`):** This is the single point of contact with the Polygon.io API.
*   **Server Actions (`src/actions/`):** These are thin server-side wrappers that call either the data adapter or the AI flows and serialize the results into JSON for the client.
*   **AI Flows (`src/ai/flows/`):** These Genkit modules contain the core AI logic, which is made highly configurable by loading all prompt details from `.json` files in `src/ai/definitions/`.
*   **State Propagation:** Results from server actions are received in `main-tab-content.tsx` and used to update the global state via setters from `stock-analysis-context.tsx`. UI components subscribe to this context and re-render reactively.

## 3. Estimated Total Context Window Requirement

The total estimated context size required to fully and accurately reason about the entire codebase is **250,000 to 350,000+ tokens**.

This estimation is broken down by the cognitive load and importance of different parts of the codebase:

1.  **Tier 1: Critical Core Logic**
    *   **Files:** 4
    *   **Est. LoC:** ~1,500
    *   **Importance (Highest):** These files (`stock-analysis-context.tsx`, `main-tab-content.tsx`, `polygon-adapter.ts`, `types.ts`) define the application's core state, execution flow, and data contracts. A complete and simultaneous understanding of these files is non-negotiable for preventing critical bugs.

2.  **Tier 2: Primary Actions & Flows**
    *   **Files:** ~12
    *   **Est. LoC:** ~1,200
    *   **Importance (High):** These files in `src/actions/` and `src/ai/flows/` represent the direct implementation of the application's features. Context for these files is crucial, as a change in one often impacts its direct caller or callee.

3.  **Tier 3: UI Display Components**
    *   **Files:** ~15
    *   **Est. LoC:** ~2,500
    *   **Importance (Medium):** These components in `src/components/` are primarily concerned with rendering data. While their internal logic can be complex, it is mostly isolated. Context is required to understand how each component receives and parses its specific JSON data prop from the global state.

4.  **Tier 4: Supporting Docs & Configuration**
    *   **Files:** ~25
    *   **Est. LoC:** ~4,000+
    *   **Importance (Medium-Low):** The documentation files (`README.md`, `CHANGELOG.md`, `FEAT_*.md`, `AUDIT_*.md`) provide essential operational rules, historical context, and architectural decisions. The JSON prompt definitions in `src/ai/definitions/` are vital for AI behavior but are self-contained.

5.  **Tier 5: Boilerplate & UI Primitives**
    *   **Files:** ~25+
    *   **Est. LoC:** ~2,000+
    *   **Importance (Low):** These include the ShadCN UI primitives in `src/components/ui/`, utility functions, and top-level configuration files. For these, I only need to understand their existence and basic function, not their detailed implementation.

### 3.1. Conclusion on Context Size

The estimated context size of **250k - 350k+ tokens** is at the upper limit of what current-generation AI models can effectively handle for high-fidelity, complex reasoning tasks. This large context requirement directly contributes to the risk of "tunnel vision" and the generation of fixes based on an incomplete or imperfectly summarized understanding of the codebase.

The use of the `CONTEXT_PURGE` directive is the most critical mitigation strategy, as it forces a re-evaluation of the codebase for each new task, but the inherent risk due to the project's scale remains a key factor in development.
