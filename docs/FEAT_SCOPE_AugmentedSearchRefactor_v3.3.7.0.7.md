
# Feature Scope: Augmented Search Re-Architecture (StockSage v3.3.7.0.7)

**Document Version:** 4.0
**Date:** 2025-07-03
**Target Application Version Series:** 3.3.7.0.7+
**Feature Status:** `IMPLEMENTATION INCOMPLETE - CRITICAL BUG`

## 1. Introduction & Objective

This document outlines the scope and implementation plan for a critical re-architecture of the "Customizable Analysis & AI Augmented Web Search" feature. Due to persistent integration issues and blocking errors, the current approach will be abandoned in favor of a decoupled, parallel execution model.

The **primary objective** is to completely isolate the augmented search functionality (for both Technical Analysis and Options) from the main application's data processing and AI analysis pipeline. This will restore stability to the core application while allowing for focused, non-blocking debugging and development of the augmented search feature.

## 2. Core Problem Area Addressed

*   **Blocking Errors:** The augmented search flows, when failing (e.g., `Unable to determine type of tool`), currently halt the entire analysis pipeline, preventing users from getting any results.
*   **Debugging Complexity:** The tight integration makes it difficult to determine if a bug originates from the augmented search flow, the data integration logic, or the main analysis prompt that consumes the augmented data.
*   **Fragile Data Dependency:** The main AI analyses have become dependent on the output format of the experimental augmented search, creating a brittle system.

## 3. Proposed Solution: Decoupled Architecture

The solution is to refactor the feature to run the main analysis and augmented searches as two separate, parallel processes that no longer share data.

1.  **Data Flow Decoupling:**
    *   The main analysis flows (`analyze-stock-data`, `analyze-options-chain`, `chat-flow`) will be reverted to their pre-feature state. They will **no longer** accept `augmentedTaSearchJson` or `augmentedOptionsSearchJson` as inputs.
    *   The corresponding prompts will have all `{{#if augmented...}}` logic removed.

2.  **UI Isolation & Raw Output:**
    *   The existing parsed display components (`AugmentedTaDisplay`, `AugmentedOptionsDisplay`) will be **removed**.
    *   They will be replaced by two new, simple components (`AugmentedTaRawDisplay`, `AugmentedOptionsRawDisplay`) that each contain a Card and a read-only Textarea.
    *   These new components will display the **raw, unparsed JSON string** received from the `augmentedTaSearchJson` and `augmentedOptionsSearchJson` context variables. This allows for direct observation of the AI's output.
    *   The new "TA Raw" text box will be placed directly after the "AI Analyzed Technical Analysis" card.
    *   The new "Options Raw" text box will be placed directly after the "AI Analyzed Options Chain" card.

3.  **FSM Orchestrator Refactoring:**
    *   The FSM in `stock-analysis-context.tsx` will be modified to trigger the augmented search flows but **not** wait for their completion.
    *   The main analysis pipeline will proceed through its steps (`Key Takeaways`, `Options Analysis`, `Chat Prompts`) independently.
    *   The success or failure of the augmented searches will only update their own isolated state (`augmentedTaSearchJson`, `augmentedOptionsSearchJson`) and will not influence the state transitions of the main pipeline.

## 4. Implementation Phased Plan & Task Breakdown

This section details the specific tasks for an AI Coding Agent to implement the re-architecture. The versioning scheme will start from `v3.3.8.x.z` to clearly separate it from the previous failed attempts.

### Phase 1: Data & AI Layer Decoupling (Target: v3.3.8.x.z)
*   **Objective:** Remove all dependencies on augmented data from the core AI analysis flows and prompts.
*   **Status:** `COMPLETED`

### Phase 2: UI Isolation (Target: v3.3.9.x.z)
*   **Objective:** Replace the current augmented display components with simple, raw text displays.
*   **Status:** `COMPLETED`

### Phase 3: FSM & Orchestrator Refactoring (Target: v3.3.10.x.z)
*   **Objective:** Modify the FSM to run augmented searches in parallel without blocking the main pipeline.
*   **Status:** `COMPLETED`

### Phase 4: Final Testing & Documentation (Target: v3.3.11.x.z)
*   **Objective:** Verify the full isolation and update all documentation.
*   **Status:** `IN PROGRESS`
*   **Tasks:**
    *   **Task v3.3.15.1.0 (Critical Fix):** Re-create and correctly implement the AI prompts that were lost by the AI Agent for both augmented TA and options searches. This is the highest priority. (`PLANNED`)
    *   **Task v3.3.11.0.0:** Conduct comprehensive testing to confirm that failures in the augmented search do not affect the main analysis and that data appears correctly in the raw text boxes. (`BLOCKED`)
    *   **Task v3.3.11.1.0:** Perform a "Phase Completion Commit" to update all project documents (`README.md`, `CHANGELOG.md`, etc.) to reflect the new, stable, decoupled architecture. (`BLOCKED`)

## 5. Document Changelog
*   **v4.0 (2025-07-03):** Updated feature status to reflect critical bug of lost AI prompts. Added a new priority task to re-create the prompts and marked subsequent testing as blocked.
*   **v3.0 (2025-07-02):** Marked Phases 1, 2, and 3 as `COMPLETED`. Updated overall feature status.
*   **v2.0 (2025-06-30):** Added detailed, multi-phase implementation plan and task breakdown for the re-architecture.
*   **v1.0 (2025-06-30):** Initial document creation, scoping the re-architecture.
