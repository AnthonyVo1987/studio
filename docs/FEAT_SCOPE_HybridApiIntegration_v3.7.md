# Feature Scope: Hybrid API Integration (E*Trade + Polygon) (v3.7)

**Document Version:** 1.0
**Date:** 2025-08-22
**Target Application Version Series:** 3.7.x.y.z
**Feature Status:** `PLANNED`

## 1. Introduction & Objective

This document outlines the scope for a major architectural refactor of the StockSage data layer. The **primary objective** is to implement a **hybrid API strategy**, leveraging the strengths of both the E*Trade and Polygon.io APIs.

This initiative will refactor the application to use the E*Trade API for all options-related data fetching (expiration dates and chains) due to its superior, dedicated endpoints. The Polygon API will be retained for its essential role in providing core stock data, including quotes, market status, and, most critically, standard technical indicators (RSI, MACD, etc.) which the E*Trade API does not currently offer.

## 2. Rationale & Benefits

Our exploratory analysis concluded that a hybrid approach is the optimal path forward:

*   **Simplification & Reliability:** E*Trade's dedicated endpoints for options expirations and filtered chains will replace our complex, custom-built pagination and filtering logic in the Polygon adapter. This will significantly simplify the codebase, reduce potential points of failure, and improve maintainability.
*   **Best-of-Breed:** We can use the "best tool for the job"—E*Trade for its powerful options API and Polygon for its indispensable technical indicator data.
*   **Future-Proofing:** Establishes a multi-provider data layer, making the application more flexible and resilient to future changes in any single API.

## 3. New Architectural Model

The implementation will result in the following architectural changes:

*   **Dual Adapters:** The data layer will consist of two distinct adapters:
    1.  `polygon-adapter.ts`: Its responsibilities will be **reduced**. It will only handle fetching stock snapshots, technical indicators, and market status. All options-related code will be removed.
    2.  `etrade-adapter.ts`: A **new adapter** will be created to encapsulate all communication with the E*Trade API. This includes handling its specific authentication flow and providing methods to fetch options expirations and chains.
*   **Server Action Refactoring:** The server actions that power the options UI (`get-options-expirations-action.ts`, `get-options-chain-for-expiration-action.ts`) will be re-wired to call the new `etrade-adapter.ts`.
*   **Core Pipeline Decoupling:** The main `fetchStockDataAction` will no longer fetch or return options data. The "AI Options Analysis" step in the main pipeline will be refactored to become a self-contained action that fetches its own data via the E*Trade adapter when triggered.

## 4. Implementation Phased Plan

This feature will be implemented in discrete phases to manage risk and ensure stability.

### Phase 1: E*Trade Adapter & Authentication Foundation
*   **Objective:** Establish the foundational components for communicating with the E*Trade API.
*   **Tasks:**
    *   **v3.7.1.0:** Create the new `src/services/data-sources/adapters/etrade-adapter.ts` file.
    *   **v3.7.1.1:** Implement a placeholder or mock authentication flow within the new adapter to allow for initial development. E*Trade's OAuth flow will be fully implemented later if required.
    *   **v3.7.1.2:** Add new placeholder environment variables to `.env` for E*Trade credentials (e.g., `ETRADE_CLIENT_ID`).

### Phase 2: Migrate Staging Tab to E*Trade
*   **Objective:** Re-wire the isolated "Staging: Options" tab to be fully powered by the new E*Trade adapter, providing a safe environment for testing the new data source.
*   **Tasks:**
    *   **v3.7.2.0:** Implement the `getExpirationDates` method in `etrade-adapter.ts` to call the `/v1/market/optionexpiredate` endpoint.
    *   **v3.7.2.1:** Implement the `getOptionsChainForDate` method in `etrade-adapter.ts` to call the `/v1/market/optionchains` endpoint, utilizing its native filtering parameters.
    *   **v3.7.2.2:** Update `get-options-expirations-action.ts` to use the new `etrade-adapter.ts`.
    *   **v3.7.2.3:** Update `get-options-chain-for-expiration-action.ts` to use the new `etrade-adapter.ts`.
    *   **v3.7.2.4:** Perform end-to-end testing of the "Staging: Options" tab to ensure it is fully functional with the E*Trade API.

### Phase 3: Refactor Core Pipeline & Polygon Adapter
*   **Objective:** Decouple options data from the main "Analyze Stock" pipeline and simplify the Polygon adapter.
*   **Tasks:**
    *   **v3.7.3.0:** In `polygon-adapter.ts`, remove all options-related fetching logic from the `getFullStockData` method.
    *   **v3.7.3.1:** Update the `fetchStockDataAction` and its return types to reflect that `optionsChainJson` is no longer part of its payload.
    *   **v3.7.3.2:** In `stock-analysis-context.tsx`, refactor the global FSM and data states. The `isOptionsChainDataReady` flag and its dependencies must be updated to reflect the new, decoupled data flow.
    *   **v3.7.3.3:** Refactor the `performAiOptionsAnalysisAction` to be self-contained. It will now need to call the E*Trade adapter to fetch its own options data before performing the AI analysis.

### Phase 4: Final Testing & Code Cleanup
*   **Objective:** Validate the new hybrid architecture and remove all obsolete code.
*   **Tasks:**
    *   **v3.7.4.0:** Perform comprehensive end-to-end testing of the entire application, including the main analysis pipeline and all chat functions.
    *   **v3.7.4.1:** Fully remove the now-unused functions (`getExpirationDates`, `fetchOptionsChainForDate`) from `polygon-adapter.ts` and clean up any related types or variables.
    *   **v3.7.4.2:** Final documentation update to reflect the "Feature Complete" status.

## 5. Document Changelog
*   **v1.0 (2025-08-22):** Initial document creation.