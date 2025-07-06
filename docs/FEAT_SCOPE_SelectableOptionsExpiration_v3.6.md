
# Feature Scope: Single Selectable Options Expiration (v3.6)

**Document Version:** 1.0
**Date:** 2025-08-15
**Target Application Version Series:** 3.6.x.y.z
**Feature Status:** `PLANNED`

## 1. Introduction & Objective

This document outlines the scope for implementing a selectable options expiration date feature. The primary objective is to allow users to fetch and view options chain data for any valid expiration date, not just the default upcoming Friday.

To ensure stability, this feature will be developed and tested in a **completely isolated staging environment** within the application. This approach prevents any disruption to the existing, stable main analysis pipeline.

## 2. Core Concept & High-Level Plan

1.  **Isolate:** A new "Staging: Options" tab will be added to the application's UI. This tab will contain a completely self-contained version of the options analysis feature.
2.  **Build:** Within this new tab, we will build the new user workflow:
    *   User enters a ticker.
    *   User clicks a button to fetch all available expiration dates for that ticker.
    *   The dates populate a dropdown menu.
    *   The user selects a date from the dropdown.
    *   The user clicks a second button to fetch the options chain for the selected ticker and expiration date.
    *   The options chain table is populated with the new data.
3.  **Validate:** Once the feature is deemed stable and complete within the staging tab, a separate integration task will be planned to migrate this functionality to the main application tab and remove the redundant code.

## 3. Architectural Components & Scope

### 3.1. New UI Components (Staging Tab)

*   **New Tab:** A "Staging: Options" tab will be added to the main `Tabs` component in `page-content.tsx`.
*   **New Container Component:** A new component, `StagingOptionsTabContent.tsx`, will be created to house all the UI and logic for this feature, ensuring its isolation.
*   **Isolated Controls:**
    *   A dedicated ticker `<Input>` field.
    *   A "Fetch Expirations" `<Button>`.
    *   A `<Select>` dropdown menu to display and select from the fetched expiration dates. It will be disabled until dates are fetched.
    *   A "Get Options Chain" `<Button>`, which will be disabled until a ticker and expiration date are selected.
*   **Replicated `OptionsChainTable`:** An exact duplicate of the existing `OptionsChainTable` component will be placed in the new tab to display the results.
*   **New Raw JSON Displays:** Two new `JsonDisplayArea`-style components will be added to show the raw request and response JSON for the options chain fetching process, aiding in debugging.

### 3.2. New Backend & Data Layer Logic

*   **New Server Actions:**
    *   A new action, `getOptionsExpirationsAction`, will be created to fetch the list of available expiration dates for a given ticker.
    *   A second new action, `getOptionsChainForExpirationAction`, will be created to fetch the full options chain for a given ticker and a specific expiration date.
*   **Polygon Adapter Updates:**
    *   The `polygon-adapter.ts` will be updated with a new method to handle the API call for fetching expiration dates (`v3/reference/options/contracts`).
    *   The existing `getFullStockData` method may be refactored to extract the options chain fetching logic into a reusable function that can be called by both the old and new server actions.

### 3.3. State Management

*   **Isolated Context:** To ensure complete isolation, a new React Context (`StagingOptionsContext`) and provider will be created. This context will manage all state related to the staging tab, including the ticker input, the list of expirations, the selected expiration, loading/error states, and the final options chain data. It will operate independently of the main `StockAnalysisContext`.

## 4. Out of Scope for Initial Implementation

*   **Integration with Main Tab:** This initial feature implementation will **not** modify the existing options chain functionality on the "Main" tab.
*   **Code Consolidation:** The intentional code duplication (e.g., of the `OptionsChainTable`) will not be addressed in this phase. Cleanup and refactoring will be part of a future integration task.
*   **AI Integration:** The new, selectable options chain data will not be plumbed into any AI analysis flows in this phase.

## 5. Document Changelog
*   **v1.0 (2025-08-15):** Initial document creation.

    