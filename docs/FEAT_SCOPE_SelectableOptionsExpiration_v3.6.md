# Feature Scope: Single Selectable Options Expiration (v3.6)

**Document Version:** 1.2
**Date:** 2025-08-23
**Target Application Version Series:** 3.6.x.y.z
**Feature Status:** `AWAITING FINAL TESTING`

## 1. Introduction & Objective

This document outlines the scope for implementing a selectable options expiration date feature. The primary objective is to allow users to fetch and view options chain data for any valid expiration date, not just a system-guessed default.

To ensure stability, this feature was first developed in an isolated staging environment and is now **fully integrated into the main application tab and its analysis pipeline**.

## 2. Core Concept & High-Level Plan

1.  **UI Integration:** All user controls for selecting options (expiration date, type, strike count, display format) are now consolidated within the main application tab.
2.  **Intelligent Defaulting:** On startup, the application now automatically fetches all available expiration dates for the default ticker and intelligently selects the next available date, eliminating hardcoded logic.
3.  **Dynamic Pipeline:** The main "Analyze Stock" pipeline is now fully dynamic. It consumes the user's selections and uses them as the basis for the entire data fetch and subsequent AI analysis.
4.  **Stale Context Handling:** A critical bug has been fixed where changing tickers would lead to using a stale expiration date. The system now intelligently detects this mismatch and forces a refetch of the correct default expiration for the new ticker.

## 3. Architectural Components & Scope

### 3.1. Main Tab UI Components

*   **"Options Chain Settings" Card:** A dedicated card in the `MainTabContent` houses all options-related controls.
    *   A dedicated ticker `<Input>` field.
    *   A "Fetch Expirations" `<Button>`.
    *   A `<Select>` dropdown menu to display and select from the fetched expiration dates.
    *   A "Get Options" `<Button>` for on-demand fetching.
    *   New dropdowns for **Option Type** (Both/Calls/Puts), **Strike Count** (20/30/40), and **Table Display** (Side-by-Side/Top-Bottom).

### 3.2. Backend & Data Layer Logic

*   **Server Actions:**
    *   `getOptionsExpirationsAction`: Fetches the list of available expiration dates.
    *   `getOptionsChainForExpirationAction`: Fetches the full options chain for a specific ticker and date.
*   **Polygon Adapter Updates:**
    *   The `polygon-adapter.ts` contains a robust `getExpirationDates` method that handles API pagination.
    *   The core `getFullStockData` function has been refactored to be "intelligent"—it uses a provided expiration date if available, or automatically fetches and determines the correct default if one is needed.

### 3.3. State Management (`StockAnalysisContext`)

*   **Centralized State:** The main application context now manages all state related to options settings, including the ticker input, the list of expirations, the selected expiration, loading/error states, and the final options chain data.
*   **Startup Fetch Logic:** A new `useEffect` hook triggers an initial fetch of expiration dates on application load.
*   **Stale Context Detection:** The `useEffect` orchestrator in `MainTabContent` now contains logic to detect a ticker change and force the options data to be re-evaluated.

## 4. Implementation Phased Plan

### Phase 1: Isolated Feature Build (Staging Tab)
*   **Status:** `COMPLETED`

### Phase 2: Full Integration into Main Application
*   **Status:** `COMPLETED`
*   **Tasks:**
    *   **v3.6.4.13:** Moved UI controls to main tab, renamed card. (`COMPLETED`)
    *   **v3.6.4.14:** Updated data-fetching layer (action & adapter) to accept options. (`COMPLETED`)
    *   **v3.6.4.15:** Integrated user selections into the main pipeline trigger. (`COMPLETED`)
    *   **v3.6.4.16:** Centralized startup logic to fetch expirations automatically. (`COMPLETED`)
    *   **v3.6.4.17:** Made data fetching "intelligent" by removing hardcoded Friday logic. (`COMPLETED`)
    *   **v3.6.4.18:** Implemented stale context detection to handle ticker changes correctly. (`COMPLETED`)

### Phase 3: Final Testing & Validation
*   **Status:** `PLANNED`

## 5. Document Changelog
*   **v1.2 (2025-08-23):** Updated document to reflect the full integration of the feature. Status changed to `AWAITING FINAL TESTING`.
*   **v1.1 (2025-08-20):** Marked staging implementation as complete.
*   **v1.0 (2025-08-15):** Initial document creation for staging feature.

    