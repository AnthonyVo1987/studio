
# Feature Scope: Single Selectable Options Expiration (v3.6)

**Document Version:** 1.1
**Date:** 2025-08-20
**Target Application Version Series:** 3.6.x.y.z
**Feature Status:** `IMPLEMENTATION COMPLETE`

## 1. Introduction & Objective

This document outlines the scope for implementing a selectable options expiration date feature. The primary objective is to allow users to fetch and view options chain data for any valid expiration date, not just the default upcoming Friday.

To ensure stability, this feature was developed and tested in a **completely isolated staging environment** within the application. This approach prevents any disruption to the existing, stable main analysis pipeline.

## 2. Core Concept & High-Level Plan

1.  **Isolate:** A new "Staging: Options" tab was added to the application's UI. This tab contains a completely self-contained version of the options analysis feature.
2.  **Build:** Within this new tab, the new user workflow was built:
    *   User enters a ticker.
    *   User clicks a button to fetch all available expiration dates for that ticker.
    *   The dates populate a dropdown menu.
    *   The user selects a date from the dropdown.
    *   The user clicks a second button to fetch the options chain for the selected ticker and expiration date.
    *   The options chain table is populated with the new data.
3.  **Validate:** The feature is now stable and complete within the staging tab. A separate integration task will be planned to migrate this functionality to the main application tab and remove the redundant code.

## 3. Architectural Components & Scope

### 3.1. New UI Components (Staging Tab)

*   **New Tab:** A "Staging: Options" tab was added to the main `Tabs` component in `page-content.tsx`.
*   **New Container Component:** A new component, `StagingOptionsTabContent.tsx`, was created to house all the UI and logic for this feature, ensuring its isolation.
*   **Isolated Controls:**
    *   A dedicated ticker `<Input>` field.
    *   A "Fetch Expirations" `<Button>`.
    *   A `<Select>` dropdown menu to display and select from the fetched expiration dates. It will be disabled until dates are fetched.
    *   A "Get Options Chain" `<Button>`, which will be disabled until a ticker and expiration date are selected.
*   **Replicated `OptionsChainTable`:** A copy of the existing `OptionsChainTable` component was placed in the new tab to display the results. This copy was refactored to be data-agnostic.
*   **New Raw JSON Displays:** Two new `JsonDisplayArea`-style components were added to show the raw request and response JSON for the options chain fetching process, aiding in debugging.
*   **Enhanced Controls:** New dropdowns were added to control **Option Type** (Both/Calls/Puts), **Strike Count** (20/30/40), and **Table Display** (Side-by-Side/Top-Bottom).

### 3.2. New Backend & Data Layer Logic

*   **New Server Actions:**
    *   A new action, `getOptionsExpirationsAction`, was created to fetch the list of available expiration dates for a given ticker.
    *   A second new action, `getOptionsChainForExpirationAction`, was created to fetch the full options chain for a given ticker and a specific expiration date.
*   **Polygon Adapter Updates:**
    *   The `polygon-adapter.ts` was updated with a new `getExpirationDates` method that handles API pagination to retrieve all expiration dates.
    *   The existing options chain fetching logic was refactored into a reusable function that can be called by both the old and new server actions.

### 3.3. State Management

*   **Isolated Context:** To ensure complete isolation, a new React Context (`StagingOptionsContext`) and provider were created. This context manages all state related to the staging tab, including the ticker input, the list of expirations, the selected expiration, loading/error states, and the final options chain data. It operates independently of the main `StockAnalysisContext`.

## 4. Out of Scope for Initial Implementation

*   **Integration with Main Tab:** This initial feature implementation did **not** modify the existing options chain functionality on the "Main" tab.
*   **Code Consolidation:** The intentional code duplication (e.g., of the `OptionsChainTable`) will be addressed in a future integration task.
*   **AI Integration:** The new, selectable options chain data is not plumbed into any AI analysis flows in this phase.

## 5. Implementation Phased Plan (Coding Tasks Only)

### Phase 1: Backend & Data Layer Foundation
*   **Status:** `COMPLETED`

### Phase 2: UI Foundation & Staging Tab Setup
*   **Status:** `COMPLETED`

### Phase 3: State Management & UI Control Integration
*   **Status:** `COMPLETED`

### Phase 4: Data Display Integration
*   **Status:** `COMPLETED`


## 6. Document Changelog
*   **v1.1 (2025-08-20):** Marked feature as `IMPLEMENTATION COMPLETE`. Updated all sections to reflect the final state of the feature.
*   **v1.0 (2025-08-15):** Initial document creation.
