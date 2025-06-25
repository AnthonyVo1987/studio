
# Feature Scope: Dual AI Chat Architecture (v3.3.16.4.F)

**Document Version:** 2.0
**Date:** 2025-07-19
**Target Application Version Series:** 3.3.16.4.F+
**Feature Status:** READY FOR TESTING

## 1. Introduction & Objective

This document outlines the scope for a significant architectural refactor of the StockSage AI Chat functionality. The primary objective is to **resolve the persistent `Unable to determine type of tool` error** by decoupling the chat system into two distinct, parallel, and isolated streams: one for App Data Analysis and one for Grounded Web Search. This new design abandons the fragile, polymorphic `chat-flow` in favor of two purpose-built, independent code paths, dramatically improving stability and debuggability.

## 2. Core Problem Area Addressed

The audit of `v3.3.16.4.E` confirms that attempting to manage both grounded (tool-using) and non-grounded (structured JSON output) requests within a single, polymorphic flow (`chat-flow.ts`) creates an irreconcilable architectural conflict within Genkit. The core problem is the mutual exclusivity of `tools` and `output.schema` in a prompt definition, which the current design fails to manage correctly at the flow level.

## 3. Proposed Solution: A Decoupled, Dual-Chat Architecture

The solution is to physically separate the two functionalities into completely independent streams, from the UI down to the AI prompts. This eliminates complex conditional logic and ensures each path is optimized for its specific task.

---

#### 3.1 Stream 1: App Data AI Chat (No Web Search)

This stream will be focused exclusively on analyzing the data already loaded within the application (stock snapshot, TAs, etc.).

*   **UI:** The existing `Chatbot` component has been repurposed. It features a prominent disclaimer stating: *"This chat analyzes loaded application data only. It cannot access real-time web information."*
*   **Code Path:**
    *   A new, dedicated server action (`app-data-chat-action.ts`) and AI flow (`app-data-chat-flow.ts`) have been created.
    *   The flow uses its own schema (`app-data-chat-schemas.ts`) and prompt definitions.
*   **AI Architecture:**
    *   The `ai.definePrompt` call will **always** include a structured `output.schema` to get a reliable JSON response.
    *   It will **never** include the `googleSearch` tool.
*   **FSM Integration:**
    *   New, dedicated state variables have been added to `StockAnalysisContext` for this chat's history, requests, and responses (e.g., `appDataChatHistory`, `appDataChatRequestJson`).
    *   The FSM has dedicated states to manage this chat stream's lifecycle (e.g., `APP_DATA_CHAT_PENDING`, `APP_DATA_CHAT_SUCCESS`).
*   **Prompt Buttons:** The on-demand prompt buttons within this chat box are limited to those that analyze app data (e.g., "Stock Trader's Takeaways").

---

#### 3.2 Stream 2: Grounded AI Chat (Web Search Enabled)

This new stream handles all interactions requiring real-time web search capabilities.

*   **UI:** A **new, second Chatbot component** has been added to the interface. It has a disclaimer: *"This chat uses Google Search to answer questions. It does not have access to the specific data loaded in the application."*
*   **Code Path:**
    *   A new server action (`web-search-chat-action.ts`) and AI flow (`web-search-chat-flow.ts`) have been created.
    *   The flow uses its own schema (`web-search-chat-schemas.ts`) and prompt definitions.
*   **AI Architecture:**
    *   The `ai.definePrompt` call will **always** include the `tools: [{ googleSearch: {} }]` property.
    *   It will **never** include a structured `output.schema`, strictly following the "Grounded JSON-in-Text" pattern from the reference guide. The flow is responsible for parsing the text response.
*   **FSM Integration:**
    *   New state variables have been added to `StockAnalysisContext` for this chat's history and state (e.g., `webSearchChatHistory`, `webSearchChatRequestJson`).
    *   The FSM has dedicated states to manage this stream's lifecycle (e.g., `WEB_SEARCH_CHAT_PENDING`, `WEB_SEARCH_CHAT_SUCCESS`).
*   **Prompt Buttons:** The prompt buttons within this chat box are limited to those requiring web searches (e.g., "Technical Analysis Web Search," "Options Flow Web Search"). The interactive user input is also routed through this grounded path.

---

## 4. General Details & Value Added

*   **Clarity & Stability:** By creating two separate, non-interacting streams, we eliminate the source of the tool-use conflict. If one stream fails, the other is completely unaffected.
*   **Simplified Debugging:** A bug in the web search chat can now be traced along its own isolated path without interference from the app data chat logic, and vice-versa. The Debug Tab has been updated with separate display boxes for each chat stream's raw data.
*   **Future Re-integration:** The modular design, with cleanly separated files and logic for each stream, makes a potential future project to merge them back into a single, more sophisticated UI a much more manageable task.

## 5. Implementation Phased Plan

This section outlines the incremental tasks for an AI Coding Agent to implement this feature.

### Phase 1: Foundation & App Data Chat Refactor
*   **Objective:** Repurpose the existing, flawed chat architecture into the new, stable "App Data Chat" stream.
*   **Status:** `COMPLETED`

### Phase 2: Build Grounded Web Search Chat Stream
*   **Objective:** Create the second, completely independent "Grounded Web Search Chat" stream.
*   **Status:** `COMPLETED`

### Phase 3: Final Cleanup & Testing
*   **Objective:** Clean up obsolete code and perform final integration tests.
*   **Status:** `IN PROGRESS`
*   **Tasks:** 
    *   **v3.3.16.7.0:** Code & Logging Cleanup. (`COMPLETED`)
    *   **v3.3.16.7.1:** Phase Completion Commit & Documentation. (`COMPLETED`)
    *   **v3.3.16.7.2:** Comprehensive Testing. (`PLANNED`)

## 6. Document Changelog
*   **v2.0 (2025-07-19):** Updated feature status to `READY FOR TESTING`. Marked implementation phases as complete. Updated Phase 3 task status.
*   **v1.0 (2025-07-19):** Initial document creation.
