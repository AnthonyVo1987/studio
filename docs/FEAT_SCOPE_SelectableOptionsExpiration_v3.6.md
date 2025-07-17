# Feature Scope: Single Selectable Options Expiration (v3.6)

**Document Version:** 2.1
**Date:** 2025-07-12
**Target Application Version Series:** 3.6.x.y.z
**Feature Status:** `STABLE`

## 1. Introduction & Objective

This document outlines the scope for implementing a selectable options expiration date feature. The primary objective is to allow users to fetch and view options chain data for any valid expiration date, not just a system-guessed default.

To ensure stability, this feature was first developed in an isolated staging environment and is now **fully integrated into the main application tab and its analysis pipeline**. All known implementation and state management bugs have been resolved. A comprehensive cleanup of all obsolete staging-related code has also been completed.

## 2. Core Concept & High-Level Plan

1.  **UI Integration:** All user controls for selecting options (expiration date, type, strike count, display format) are consolidated within the main application tab.
2.  **Intelligent & Proactive Defaulting:** On user input (typing a new ticker), the application now uses a debounced hook to automatically fetch all available expiration dates and intelligently selects the next available date as the default.
3.  **Dynamic Pipeline:** The main "Analyze Stock" pipeline is fully dynamic. It consumes the user's selections and uses them as the basis for the entire data fetch and subsequent AI analysis.
4.  **Stale Context Handling:** A critical bug has been fixed where changing tickers would lead to using a stale expiration date. The system now intelligently detects this mismatch and forces a refetch of the correct default expiration for the new ticker.
5.  **Code Cleanup:** All code related to the initial staging implementation (components, contexts, server actions, state variables) has been completely removed from the codebase.

## 3. Architectural Components & Scope

### 3.1. Main Tab UI Components

*   **"Options Chain Settings" Card:** A dedicated card in the `MainTabContent` houses all options-related controls.
    *   A "Fetch Expirations" `<Button>`.
    *   A `<Select>` dropdown menu to display and select from the fetched expiration dates.
    *   Dropdowns for **Option Type** (Both/Calls/Puts), **Strike Count** (20/30/40), and **Table Display** (Side-by-Side/Top-Bottom).

### 3.2. Backend & Data Layer Logic

*   **Polygon Adapter Updates:**
    *   The `polygon-adapter.ts` contains a robust `getExpirationDates` method that handles API pagination.
    *   The core `getFullStockData` function has been refactored to be "intelligent"—it uses a provided expiration date if available, or automatically fetches and determines the correct default if one is needed.

### 3.3. State Management (`StockAnalysisContext`)

*   **Centralized State:** The main application context now manages all state related to options settings, including the list of expirations, the selected expiration, loading/error states, and the final options chain data.
*   **Proactive Fetch Logic:** A debounced `useEffect` hook triggers an automatic fetch of expiration dates when the user types a new ticker.
*   **Stale Context Detection:** The logic in `StockAnalysisContext` correctly resets options state when the user input ticker changes, preventing stale data from being used.

## 4. Implementation Phased Plan

### Phase 1: Isolated Feature Build (Staging Tab)
*   **Status:** `COMPLETED`

### Phase 2: Full Integration into Main Application
*   **Status:** `COMPLETED`

### Phase 3: Final Debugging & Stabilization
*   **Status:** `COMPLETED`

### Phase 4: Final Testing & Validation
*   **Status:** `COMPLETED` (Implicitly, as part of stabilization)

### Phase 5: Code Cleanup
*   **Status:** `COMPLETED`
*   **Tasks:**
    *   **v3.6.5.8:** UI cleanup, tab renaming. (`COMPLETED`)
    *   **v3.6.5.9:** Remove staging UI components and context. (`COMPLETED`)
    *   **v3.6.5.10:** Remove orphaned server actions and dead state. (`COMPLETED`)
    *   **v3.6.5.11:** Remove final piece of dead state. (`COMPLETED`)

## 5. Document Changelog
*   **v2.1 (2025-07-12):** Updated document to reflect the full completion of the staging feature cleanup. Status changed to `STABLE`.
*   **v2.0 (2025-08-27):** Updated document to reflect the full integration and stabilization of the feature. Status changed to `AWAITING FINAL TESTING`. All implementation and debugging tasks marked as complete.
*   **v1.2 (2025-08-23):** Updated document to reflect the full integration of the feature. Status changed to `AWAITING FINAL TESTING`.
*   **v1.1 (2025-08-20):** Marked staging implementation as complete.
*   **v1.0 (2025-08-15):** Initial document creation for staging feature.
