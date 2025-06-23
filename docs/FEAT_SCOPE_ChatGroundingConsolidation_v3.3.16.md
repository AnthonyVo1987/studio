
# Feature Scope: AI Chat Prompt & Google Search Grounding Consolidation (v3.3.16.0.0)

**Document Version:** 1.0
**Date:** 2025-07-05
**Target Application Version Series:** 3.3.16.x.z
**Feature Status:** PLANNED

## 1. Introduction & Objective

This document outlines the scope for a significant refactoring and consolidation of the application's AI chat prompts and the use of the Google Search Grounding tool. The primary objective is to streamline the architecture into a single, unified, and easily maintainable execution path for all AI chat and search-based actions. This will improve clarity by using standard industry terminology ("Grounding" vs. "Augmented"), enhance debuggability, and establish a consistent configuration pattern for all AI prompts.

This scope is the result of a comprehensive, end-to-end codebase audit, applying the corrective actions outlined in the project's `README.md` and `POST_MORTEM` report to prevent previous audit failures.

## 2. Comprehensive Audit & Adherence to Corrective Actions

In adherence to the mandatory new audit protocol, a full execution trace was performed on the existing AI features. This involved mapping the flow from UI components (`main-tab-content.tsx`, `chatbot.tsx`) -> FSM events (`stock-analysis-context.tsx`) -> Server Actions (`chat-server-action.ts`) -> AI Flows (`chat-flow.ts`) -> Prompt Definitions (`*.json`).

**Key Files Audited to Generate this Scope:**
*   `src/contexts/stock-analysis-context.tsx` (FSM, Orchestrator)
*   `src/components/main-tab-content.tsx` (UI Toggles)
*   `src/components/chatbot.tsx` (UI Buttons)
*   `src/ai/flows/chat-flow.ts` (The intelligent, unified flow)
*   `src/ai/definitions/*.json` (All prompt definitions)
*   `src/actions/chat-server-action.ts` (Server Action)

**Audit Findings:** The current "intelligent `chat-flow`" architecture is sound but can be further consolidated. Configuration settings like `thinkingBudget` and `tools` are defined within the flow logic. The renaming from "Augmented" to a clearer term is necessary. This scope addresses these findings to create a more robust and transparent system.

## 3. Feature Scoping & Detailed Analysis

### 3.1. Renaming and Consolidation
*   **Action:** All UI text, component names, FSM flags/variables, and internal documentation related to "Augmented" search will be renamed to use the standard industry term **"Google Search Grounding"** or **"Web Search"**.
*   **Rationale:** This removes ambiguity and clarifies that the feature utilizes the built-in Gemini `googleSearch` tool, not a separate, custom-built web search feature.

### 3.2. Unified AI Flow Architecture
*   **Action:** The intelligent `chat-flow.ts` will be refactored to be the single, definitive entry point for ALL chat-based AI interactions. It will no longer conditionally load different prompt definitions based on trigger keys.
*   **New Logic:**
    1.  The flow will be modified to accept a `promptName` as part of its input.
    2.  Based on this `promptName`, it will dynamically load the corresponding JSON definition (e.g., `stock-chatbot.json`, `technical-analysis-web-search.json`).
    3.  It will extract the `thinkingBudget` and `useGoogleSearch` (a new boolean flag to be added to the JSON definitions) from the loaded prompt configuration.
    4.  It will then construct the `ai.definePrompt` call with the correct configuration (`tools` property will be added ONLY if `useGoogleSearch` is true).
    5.  It will handle the different output formats (structured JSON vs. plain text) based on whether grounding was enabled.
*   **Rationale:** This creates a single, highly consistent, and data-driven execution path. All prompt-specific configurations (model, safety, thinking, grounding) will now live entirely within their respective JSON definition files, making the `chat-flow.ts` a pure orchestrator.

### 3.3. Configuration & FSM Refactoring
*   **Dynamic Thinking:** All AI prompt JSON definitions (`analyze-stock-data.json`, `analyze-options-chain.json`, and all chat/search prompts) will have the `thinkingBudget: -1` property to enable dynamic thinking mode by default.
*   **Grounding Configuration:** A new boolean property, `useGoogleSearch: boolean`, will be added to the schema for prompt definitions (`LlmPromptDefinitionSchema` in `definition-loader.ts`) and implemented in all relevant JSON files.
    *   `stock-chatbot.json`, `stock-trader-takeaways.json`, `options-trader-takeaways.json`, `holistic-takeaways.json`: `useGoogleSearch: false`
    *   `technical-analysis-web-search.json`, `options-flow-web-search.json`: `useGoogleSearch: true`
    *   The prompts for `analyze-stock-data` and `analyze-options-chain` will not require this flag, as they are not chat-based and will never use grounding.
*   **FSM Cleanup:**
    *   The `isAugmented...` flags in the FSM will be removed. The new UI toggles will directly control which `promptName` is dispatched to the chat flow.
    *   FSM states and debug logs will be updated to reflect the new "promptName"-based logic.

### 3.4. UI Refactoring
*   **Global Toggle Removal:** The "Enable Google Search for Chat" switch in `chatbot.tsx` will be removed. Grounding is now determined by the specific prompt being executed.
*   **Button Reorganization:** The example prompt buttons in `chatbot.tsx` will be reorganized and relabeled under clear categories:
    *   **Category: App Data Analysis (No Web Search)**
        *   Button: "Stock Trader's Takeaways"
        *   Button: "Options Trader's Takeaways"
        *   Button: "Additional Holistic Takeaways"
    *   **Category: Google Search Grounded Analysis**
        *   Button: "Technical Analysis Web Search"
        *   Button: "Options Flow Analysis Web Search"

### 3.5. AI Prompt Content Updates
The two web search prompts will be updated to fetch more comprehensive data.

*   **`technical-analysis-web-search.json`:**
    *   **Support/Resistance Levels:** The prompt will ask for a maximum of 3 levels for each.
    *   **Bollinger Bands:** The prompt will be updated to request the actual values for the Lower, Middle, and Upper bands.
    *   **Fibonacci Retracement:** The prompt will be updated to request the 5 key levels: 0.236, 0.382, 0.500, 0.618, and 0.786.

*   **`options-flow-web-search.json`:**
    *   The prompt will be expanded to also request: IV Skew, IV Rank, IV Percentile, Historic Volatility, and Options Volatility Skew, in addition to the existing metrics.

### 3.6. Debugging & Logging Enhancements
*   **Log Buffer:** The max number of log entries in `global-log-buffer.ts` will be increased from 1000 to **2000**.
*   **Default Log Settings:** In `stock-analysis-context.tsx`:
    *   The default value for `isReducedStartupLoggingEnabled` will be set to **`false`**.
    *   The default value for `isUiRenderLoggingEnabled` will be set to **`true`**.
*   **Log Content:** All relevant FSM and flow logs will be updated to reflect the new `promptName`-based architecture.

## 4. Value Added Proposition

*   **Architectural Clarity:** Consolidates all chat/search logic into one flow, making the system easier to understand and debug.
*   **Configuration-Driven:** Moves all prompt-specific logic (including grounding) into JSON files, allowing for changes without altering flow code.
*   **Standardization:** Adopts industry-standard terminology ("Grounding") and enforces consistent configuration patterns (`thinkingBudget`, `useGoogleSearch`) across all prompts.
*   **Enhanced Analysis:** The updated web search prompts will provide richer, more detailed data for analysis.

## 5. Risks Assessment

*   **Central Flow Complexity:** The refactored `chat-flow.ts` will be more complex as it dynamically constructs the prompt configuration. This requires careful implementation to avoid bugs.
*   **Prompt Engineering Fragility:** The expanded web search prompts are more demanding and may have a higher failure rate or return malformed JSON. Robust error handling and parsing in the flow will be critical.
*   **Regression Risk:** Modifying the core `chat-flow` and its interaction with the FSM could introduce regressions in existing chat functionality. Thorough testing will be required.

## 6. Document Changelog

*   **v1.0 (2025-07-05):** Initial document creation based on a comprehensive audit and new feature request.
