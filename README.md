
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.9.A.K OPERATING MANUAL**

*   **Document Version:** 1.39 (Task 9.A.K - FSM Reducer Fix & Ticker Ref Reset)
*   **Date:** 2025-06-14 
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. **Phase 9 In Progress. Current application version: v2.9.A.K.**

## **0. CRITICAL: AI AGENT DEVELOPMENT PROCESS & RULES OF ENGAGEMENT**

**THIS SECTION IS THE PRIMARY DIRECTIVE FOR THE FIREBASE STUDIO AI PROTOTYPER (HEREINAFTER "THE AI AGENT" OR "AI"). FAILURE TO ADHERE TO THESE RULES CONSTITUTES A CRITICAL PROCESS FAILURE AND REQUIRES IMMEDIATE CORRECTION.**

### **0.1. Scope Approval Before Code (NON-NEGOTIABLE)**
1.  **Scoping First:** For ANY requested feature, fix, refactoring, documentation update, or other modification, the AI Agent **MUST** first perform a targeted audit of the relevant current codebase.
2.  **Detailed Scope Proposal:** Following the audit, the AI Agent **MUST** present a detailed scope proposal to the user. This proposal should outline the intended changes, affected files, and reasoning.
3.  **Explicit User Approval:** Code generation or file modification (i.e., XML `<changes>` output) **SHALL NOT** occur until the user explicitly approves the proposed scope.
4.  **Iterative Refinement:** If the user requests modifications to the scope, the AI Agent must update the scope proposal and await re-approval before proceeding.
5.  **No Unsolicited Code:** The AI Agent **MUST NOT** generate code or XML changes for tasks or fixes not explicitly scoped and approved by the user.

### **0.2. Adherence to This Document**
*   **Single Source of Truth:** This document (`README.md`) in its entirety, including all sections on features, technology stack, phased plans, and specific guidelines, is the **absolute and single source of truth** for the StockSage project. The application version (e.g., `v2.x.y.z`) will be updated dynamically in this document and in the UI.
*   **Clarification Required:** If any ambiguity exists in this document or in user requests, the AI Agent **MUST** ask for clarification before proceeding with scoping or implementation.

### **0.3. Phased Implementation & UI-First Strategy**
*   **Phased Plan Adherence:** The project **MUST** be implemented according to the "Phased Implementation Plan" detailed in Section 5. Each phase and task must be treated as a distinct unit of work.
*   **UI-First Principle:** The core strategy of UI-First Development (building UI shells with placeholders before backend logic) **MUST** be maintained for any new UI-related features unless explicitly overridden by an approved scope for a specific task.
*   **Data Decoupling:** The "Debug" tab serving as the source of raw JSON for "Main" tab displays is a key architectural principle to be upheld. The FSM re-architecture in Phase 9 further solidifies how this data is managed and propagated.

### **0.4. General Operational Principles**
*   **Incremental Commits:** Each completed and approved task (or sub-task where logical) should result in a state that is "committable." The AI Agent should aim for small, logical changes per XML response, reflecting only the approved scope.
*   **Code Quality:** Prioritize clean, readable, well-organized, and performant code. Use functional components and hooks. Adhere to all specific coding guidelines provided (Next.js, Genkit, etc.).
*   **Error Handling:** Implement robust error handling (Next.js `error.js`, `try-catch`, Toasts for user feedback) as appropriate for any new code. The FSM pipeline includes explicit error states and propagation logic.
*   **No Placeholder Responses:** The AI Agent **MUST NOT** respond with "Omitted from agent history" or similar placeholders for code changes.
*   **Comments:** JSDoc/TSDoc for complex logic/APIs. Avoid redundant comments. **NO comments in `package.json`.**
*   **File Generation:** No non-textual files (e.g., binary, images). No favicon generation.
*   **XML Output Format:** All code changes **MUST** be provided in the specified `<changes>` XML format.

### **0.5. Environment Re-Initialization (`reinit.md`)**
*   The procedures outlined in `reinit.md` for a full local environment re-initialization **MUST** be recommended to the user at critical junctures, such as after significant dependency changes, `next.config.ts` modifications, or when troubleshooting persistent, unexplainable build/runtime errors. The AI Agent should remind the user of this procedure's importance.

### **0.6. Application Versioning Standard Operating Procedure (SOP)**
*   **Version Format:** The application will follow a `2.x.y.z` versioning scheme:
    *   `2`: Static major version for this iteration of StockSage.
    *   `x`: Current Phase number from the "Phased Implementation Plan" (Section 5).
    *   `y`: Current Task number (can be hex A-F for special tasks) within that Phase.
    *   `z`: Sub-Task or iteration number for that specific Task. This increments with each commit related to the x.y task.
*   **AI Agent Responsibility:** With each user request that results in code changes and an intended commit, the AI Agent **MUST**:
    1.  Determine the correct `2.x.y.z` version based on the current Phase, Task, and the new iteration/sub-task being implemented.
    2.  Update the version string displayed in the application UI, specifically in `src/components/layout/header.tsx`.
    3.  Update all relevant mentions of the application version within this `README.md` document (e.g., main title, section headers, Phased Implementation Plan status).
    4.  Ensure the `README.md` Changelog (Section 6) and Project Implementation Commit Log (Section 7) are updated to reflect the new version and changes.
    5.  **README.md Update Timing:** All updates to this `README.md` document (including versioning, changelogs, and phased plan status) as described above **SHALL ONLY** be performed during an explicit 'COMMIT' stage, after the user has confirmed the code changes for that task version are ready to be finalized.
*   **Example:** If the current phase is 9, current task is A (for the full README update), and this is the 0th iteration for this task, the version will be `v2.9.A.0`. If the next task is a bug fix, it will be `v2.9.A.1`.

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.A.K)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.A.K`). This version represents a significant milestone with a fully re-architected FSM-based analysis pipeline and comprehensive documentation, currently undergoing functional integration testing.
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling & FSM Orchestration**

The primary strategy for this implementation is **UI-First Development**, now enhanced and managed by a **Finite State Machine (FSM)** for the analysis pipeline. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab.
*   **FSM-Orchestrated Data Flow:** The `StockAnalysisContext` utilizes a `useReducer` hook to implement an FSM. This FSM manages the entire lifecycle of a stock analysis (both partial and full):
    *   It orchestrates the sequence of data fetching and AI analysis steps.
    *   It updates the application's global state (the JSONs in `StockAnalysisContext`, which populate the Debug tab) upon successful completion or failure of each step.
    *   It handles error propagation, marking subsequent steps as "skipped" if a prerequisite fails.
    *   This ensures a predictable, traceable, and robust data pipeline.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for all data points.
    *   Offer a robust and debuggable backend processing pipeline through the FSM.

## **2. High-Level Goals (Current Version v2.9.A.K)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First & FSM Adherence:** Strictly follow the UI-First strategy with the FSM-orchestrated data pipeline.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers, significantly improved by the Phase 9 FSM re-architecture.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface with clear feedback on processing states.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, client-side debug console with filtering, clear error reporting via toasts, and detailed FSM pipeline logging.
*   **Dynamic Versioning:** Maintain and display the application version `2.x.y.z` as per SOP (Section 0.6).

## **3. Core Application Features (StockSage v2.9.A.K)**

This section details the core features of StockSage v2.9.A.K, serving as the Product Requirements.

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.A.K`).
    *   Includes a theme toggler (Light/Dark/System) using `next-themes` and ShadCN `DropdownMenu`.
*   **Footer:** Contains copyright information and a standard financial disclaimer.
*   **Theme:** Supports Light and Dark themes, configurable via the header. Theme styles are defined in `src/app/globals.css` using HSL CSS variables.
*   **Disclaimer:** Prominent financial advice disclaimer in the footer.
*   **Client-Side Debug Console:**
    *   Toggleable via a Switch on the main page (`src/app/page.tsx`).
    *   When enabled, it appears as a fixed panel at the bottom of the screen (`src/components/debug-console.tsx`).
    *   Displays client-side logs captured via a global log buffer and `console.*` interception.
    *   Features:
        *   Search functionality for log messages.
        *   Filtering by log type (DEBUG, INFO, WARN, ERROR, LOG) and log source (component/module name).
        *   Controls to "Select All" / "Clear All" for type and source filters.
        *   Buttons to Copy (JSON, TXT, CSV) or Export (JSON, TXT, CSV) displayed logs.
        *   Button to clear the log buffer.
        *   Button to close the console panel.
    *   Log sources are defined in `src/lib/debug-log-types.ts` and can be individually toggled on the "Debug" tab. Enabling the main console switch defaults all sources to ON.

### **3.2. "Main" Tab Features (`src/components/main-tab-content.tsx`)**
The "Main" tab is the primary user interface for stock analysis.

*   **Stock Analysis Input Area:**
    *   **Ticker Input:** A text field (`Input`) for users to enter a stock ticker symbol (e.g., "NVDA"). Default: "NVDA".
    *   **Data Source Selector:** A `Select` component, currently defaulted and disabled to "Polygon.io" as it's the only integrated source.
    *   **"Analyze Stock" Button (v2.9.A.G+ Behavior):** Initiates an "extended partial analysis," which includes:
        1.  Fetching all data from Polygon.io (Market Status, Stock Snapshot, Standard TAs, Options Chain).
        2.  Calculating AI Analyzed Technical Analysis (Pivot Points).
        3.  Generating AI Key Takeaways.
        4.  Performing AI Options Analysis.
        *   This triggers the FSM `START_PARTIAL_ANALYSIS` event (the naming is now a bit of a misnomer for its extended scope but kept for FSM consistency; `isFullAnalysisTriggered` will be `false`).
    *   **"AI Full Stock Analysis" Button:** Initiates a "full analysis," which includes all steps of the new "Analyze Stock" button, plus:
        1.  Generating an AI Chat Summary (which becomes the first message in the Chatbot).
        *   This triggers the FSM `START_FULL_ANALYSIS` event (`isFullAnalysisTriggered` will be `true`).
    *   Buttons show loading spinners and are disabled while an analysis pipeline is active (`isPipelineActive` state).

*   **Display Card Order & Content:**
    All display cards render data reactively from the `StockAnalysisContext`. They show loading skeletons or "N/A" / error messages if data is pending, unavailable, or an error occurred.

    1.  **Key Metrics Display (`src/components/key-metrics-display.tsx`):**
        *   Displays: Ticker, Current Price, Day's Change (percentage).
        *   Formatting: Current Price is currency formatted. Day's Change uses sentiment coloring (green for positive, red for negative) and `TrendingUp`/`TrendingDown` icons.
    2.  **Stock Snapshot Details Display (`src/components/stock-snapshot-details-display.tsx`):**
        *   Displays: A table of detailed price/volume data including Current Price, Today's Change % (sentiment colored), Today's Change (currency, sentiment colored), Day's VWAP, Day's Volume (compact), Day's Close, Day's Open, Day's High, Day's Low. Also includes Previous Day's Open, High, Low, Close, Volume, and VWAP.
        *   Formatting: Currency, percentage, and compact number formatting applied.
    3.  **Standard Technical Indicators Display (`src/components/standard-ta-display.tsx`):**
        *   Displays: A table of standard technical indicators:
            *   **RSI:** For periods 7, 10, 14. RSI(14) value is sentiment-colored (green < 30, red > 70).
            *   **MACD (12,26,9):** Value, Signal, Histogram. MACD Histogram is sentiment-colored (green > 0, red < 0).
            *   **VWAP:** Day and Minute values.
            *   **EMA:** For periods 5, 10, 20, 50, 200.
            *   **SMA:** For periods 5, 10, 20, 50, 200.
        *   Formatting: Numerical values to two decimal places.
    4.  **AI Analyzed Technical Analysis Display (`src/components/ai-analyzed-ta-display.tsx`):**
        *   Displays: Daily Pivot Points (PP, S1, S2, S3, R1, R2, R3) calculated based on the previous day's High, Low, and Close (HLC).
        *   Formatting: Numerical values to two decimal places. The Pivot Point (PP) row is sentiment-colored based on whether the current stock price is above (green) or below (red) it.
    5.  **AI Key Takeaways Display (`src/components/ai-key-takeaways-display.tsx`):**
        *   Displays: Five AI-generated key takeaways, each with a category label, a sentiment badge, and the takeaway text.
        *   Categories: Price Action, Trend, Volatility, Momentum, Patterns.
        *   Formatting: Sentiment badges and text are colored semantically (e.g., bullish is green, bearish is red, neutral/moderate is yellow/orange).
        *   Export/Copy: Dropdown menus allow exporting takeaways as JSON, Text, or CSV, and copying as JSON, Text, or CSV.
    6.  **Options Chain Table Display (`src/components/options-chain-table.tsx`):**
        *   Displays: A table of options contracts for the nearest Friday expiration, sorted by strike price in descending order. Shows approximately +/-10 strikes from the at-the-money (ATM) strike.
        *   Columns for Calls (left) and Puts (right) with Strike Price in the center.
        *   Call Columns: Gamma, IV, % Chg, Bid, Ask, Last, Volume, Open Int, Delta.
        *   Put Columns: Delta, Open Int, Volume, Last, Bid, Ask, % Chg, IV, Gamma.
        *   Formatting: Numerical values formatted appropriately (currency, percentage, compact numbers, two decimals). The ATM strike row is highlighted.
        *   Header: Dynamically shows Ticker and Expiration Date.
        *   Export/Copy: Buttons to Export or Copy the displayed options chain as CSV.
    7.  **AI Analyzed Options Chain Display (`src/components/ai-options-analysis-display.tsx`):**
        *   Displays: An expandable card (ShadCN `Accordion`) showing AI-identified Call/Put "Walls" and "OI Clusters."
        *   Content:
            *   **Walls:** Tables for Call Walls and Put Walls, showing Strike and Open Interest. Max 3 walls per side.
            *   **OI Clusters:** Tables for Call OI Clusters and Put OI Clusters, showing Strikes (array), Total OI, and Average OI per strike. Max 3 clusters per side.
            *   **AI Note:** Displays `analysisSummary` text from the AI if provided (e.g., "No significant walls identified").
        *   Formatting: Numerical values formatted (currency, compact numbers).
        *   Export/Copy: Buttons to Export or Copy the AI options analysis as JSON.
    8.  **AI Chatbot Interface (`src/components/chatbot.tsx`):**
        *   Displays: A chat interface for users to ask questions about the analyzed stock.
        *   Features:
            *   Input field for user messages.
            *   Scrollable chat history area displaying user and model (AI) messages.
            *   Example prompts (buttons) that pre-fill the input field (e.g., "What is the current price of {TICKER}?").
            *   Controls to Clear Chat History (with confirmation dialog), Copy Chat (JSON), and Export Chat (JSON).
        *   Context: The chatbot uses all available data from the `StockAnalysisContext` (Snapshot, TAs, AI TA, Key Takeaways, AI Options Analysis, Market Status) and the ongoing chat history to answer questions.
        *   Initial Message (Full Analysis): After a "AI Full Stock Analysis," the first message from the AI is an automatically generated summary of the entire analysis.
        *   Formatting: AI responses use Markdown for better readability (bolding, lists, emojis). Numerical values are formatted to two decimal places, monetary values prefixed with "$".
    9.  **Market Status Display (`src/components/market-status-display.tsx`):**
        *   Displays: A table showing the status of relevant markets (e.g., "NYSE: Open", "NASDAQ: Closed"), server time (ET), and if early/late hours trading is active. Excludes Crypto/FX markets.

*   **Combined Data Export Controls:**
    *   "Export All to JSON" Button: Downloads a single JSON file containing: Stock Snapshot, Standard TAs, AI Analyzed TA, AI Key Takeaways, AI Options Analysis, Options Chain, and Market Status.
    *   "Copy All to JSON" Button: Copies the same combined data to the clipboard.
    *   These buttons are disabled if not all prerequisite data is available or if an analysis pipeline is active.

### **3.3. "Debug" Tab Features (`src/components/debug-tab-content.tsx`)**
The "Debug" tab provides developers and advanced users with raw data views and client-side log controls.

*   **Raw JSON Display Areas:**
    *   Read-only `Textarea` components, each with a "Copy JSON" button.
    *   Areas for:
        *   Polygon Adapter Input JSON (parameters sent to the main Polygon fetching function).
        *   Polygon Adapter Output Summary JSON (summary of data fetched or errors from the adapter).
        *   Market Status JSON.
        *   Stock Snapshot JSON.
        *   Standard Technical Indicators JSON.
        *   Options Chain JSON.
        *   AI Analyzed TA Request JSON.
        *   AI Analyzed TA JSON.
        *   AI Options Analysis Request JSON.
        *   AI Options Analysis JSON.
        *   AI Key Takeaways Request JSON.
        *   AI Key Takeaways JSON.
        *   Chatbot Request JSON (includes summary request during full analysis, and interactive chat requests).
        *   Chatbot Response JSON (includes summary response and interactive chat responses).
        *   *Note:* The FSM Pipeline logs are primarily viewed via the Client Debug Console panel itself, not a dedicated Textarea here, for real-time updates.
*   **Client Debug Log Source Settings (`src/components/debug-settings-card.tsx`):**
    *   A card allowing users to toggle individual client-side log sources ON/OFF.
    *   Sources correspond to `LogSourceId` from `src/lib/debug-log-types.ts` (e.g., "KeyMetricsDisplay", "StockAnalysisContext", "FSM\_PIPELINE").
    *   Includes "Enable All Log Sources" and "Disable All Sources (Except Console Itself)" buttons.
    *   These settings control which logs appear in the pop-up Client Debug Console.

### **3.4. Backend Functionality & Architecture Flow**
This section details the server-side logic, data fetching, AI processing, and the overall FSM-driven architecture.

*   **Data Retrieval (Polygon.io via `@polygon.io/client-js`):**
    *   Handled by `src/services/data-sources/adapters/polygon-adapter.ts`.
    *   Fetches:
        *   **Market Status:** Using `client.reference.marketStatus()`.
        *   **Ticker Snapshot:** Using `client.stocks.snapshotTicker()`. Provides current day, previous day, and latest minute bar data, which includes current price, changes, O,H,L,C,V,VWAP.
        *   **Standard Technical Indicators:**
            *   RSI: `client.stocks.rsi()` for windows 7, 10, 14 (daily, close).
            *   MACD: `client.stocks.macd()` (daily, close, standard 12,26,9).
            *   EMA: `client.stocks.ema()` for windows 5, 10, 20, 50, 200 (daily, close).
            *   SMA: `client.stocks.sma()` for windows 5, 10, 20, 50, 200 (daily, close).
            *   VWAP (Day & Minute) values are derived from the Ticker Snapshot's day and minute aggregate bars.
        *   **Options Chain Snapshot:** Using `client.options.snapshotOptionChain()`. Fetches Calls and Puts separately for the nearest upcoming Friday expiration date. The strike range is dynamically calculated as +/- 20% around the current stock price (to get a decent window) and then filtered down to +/-10-11 strikes from ATM for display. Contracts are sorted by strike price in descending order in the final display table.
    *   The adapter includes delays between API calls to respect rate limits.
    *   Output: An `AdapterOutput` object containing the `StockDataPackage` (with all fetched data or error details per section) and raw request/response summaries for debugging.

*   **Genkit AI Flows (Located in `src/ai/flows/`):**
    All flows use the global `ai` instance from `src/ai/genkit.ts` and models defined in `src/ai/models.ts`. Server actions in `src/actions/` wrap these flows.

    1.  **AI Analyzed Technical Analysis (`analyze-ta-flow.ts`):**
        *   **Purpose:** Calculates classic daily Pivot Points.
        *   **Input (`AnalyzeTaInput`):** Previous day's High, Low, Close prices.
        *   **Output (`AnalyzeTaOutput`):** Pivot Point (PP), Support levels (S1, S2, S3), Resistance levels (R1, R2, R3).
        *   *Note:* This is a direct calculation, not an LLM call.
    2.  **AI Key Takeaways (`analyze-stock-data.ts`):**
        *   **Purpose:** Generates 5 key takeaways with associated sentiment, focusing on Price Action, Trend, Volatility, Momentum, and Patterns.
        *   **Input (`StockAnalysisInput`): Ticker, Stock Snapshot JSON, Standard TAs JSON, AI Analyzed TA JSON, Market Status JSON.
        *   **Output (`StockAnalysisOutput`):** An object with keys for each category, containing `takeaway` text and `sentiment`.
        *   **LLM Prompt:** Instructs the AI to synthesize all provided data.
    3.  **AI Options Analysis (`analyze-options-chain-flow.ts`):**
        *   **Purpose:** Identifies significant Call/Put "Walls" (single high OI strikes) and "OI Clusters" (adjacent high OI strikes).
        *   **Input (`AiOptionsAnalysisInput`):** Ticker, Options Chain JSON, Current Underlying Price.
        *   **Output (`AiOptionsAnalysisOutput`):** Arrays for `callWalls`, `putWalls`, `callClusters`, `putClusters` (max 3 each), and an `analysisSummary` string.
        *   **LLM Prompt:** Instructs the AI to analyze Open Interest patterns in the provided options chain JSON.
    4.  **AI Chat Summary Generation (`generate-full-analysis-summary-flow.ts`):**
        *   **Purpose:** Creates an initial summary message for the chatbot after a full analysis is performed.
        *   **Input (`GenerateFullAnalysisSummaryInput`):** Ticker, Stock Snapshot JSON, Standard TAs JSON, AI Analyzed TA JSON, AI Key Takeaways JSON, AI Options Analysis JSON, Market Status JSON.
        *   **Output (`GenerateFullAnalysisSummaryOutput`):** `summaryText` (Markdown formatted).
        *   **LLM Prompt:** Instructs the AI to provide a holistic overview, mentioning findings from each available data section and gracefully acknowledging any skipped/errored prior steps.
    5.  **AI Chatbot (`chat-flow.ts`):**
        *   **Purpose:** Provides contextual, conversational answers to user questions about the analyzed stock.
        *   **Input (`ChatInput`):** Ticker, all context JSONs (Snapshot, Key Takeaways, AI TA, Options Analysis), chat history, and the current user input.
        *   **Output (`ChatOutput`):** `response` (Markdown formatted).
        *   **LLM Prompt:** Instructs the AI to use only the provided context, answer questions, use Markdown and emojis, and decline out-of-scope requests.

*   **FSM-Driven Architecture Flow (Managed by `StockAnalysisContext` and `MainTabContent`):**
    The analysis pipeline is orchestrated by a Finite State Machine (FSM) implemented with `useReducer` in `StockAnalysisContext`.

    1.  **Initiation:**
        *   User clicks "Analyze Stock" or "AI Full Stock Analysis" in `MainTabContent.tsx`.
        *   The corresponding FSM event (`START_PARTIAL_ANALYSIS` or `START_FULL_ANALYSIS`) is dispatched.
    2.  **Initialization (`INITIALIZING_ANALYSIS` state):**
        *   The FSM reducer sets `isFullAnalysisTriggered` based on the event.
        *   All relevant data JSONs in `StockAnalysisContext` are set to placeholder "pending" or "initializing..." statuses.
        *   Chat history is cleared (only for full analysis).
        *   FSM transitions to `AWAITING_DATA_FETCH_TRIGGER`.
    3.  **Data Fetching (`AWAITING_DATA_FETCH_TRIGGER` -> `FETCHING_DATA` -> `DATA_FETCH_SUCCEEDED`/`FAILED`):**
        *   `MainTabContent` observes `AWAITING_DATA_FETCH_TRIGGER` and dispatches `TRIGGER_DATA_FETCH`.
        *   Reducer transitions to `FETCHING_DATA`, sets Polygon log JSONs to "fetching...".
        *   `MainTabContent` observes `FETCHING_DATA` and calls `analyzeStockFormAction`.
        *   Upon action completion, `MainTabContent` dispatches `FETCH_DATA_SUCCESS` (with data) or `FETCH_DATA_FAILURE` (with error) to the FSM.
        *   Reducer updates context JSONs with fetched data or error/skipped states.
    4.  **Post Data Fetch Logic (`DATA_FETCH_SUCCEEDED` -> `INITIATE_AI_TA_SEQUENCE` in `MainTabContent`):**
        *   `MainTabContent` observes `DATA_FETCH_SUCCEEDED` and dispatches `INITIATE_AI_TA_SEQUENCE`.
        *   Reducer handles `INITIATE_AI_TA_SEQUENCE`, sets AI TA placeholders to "pending...", transitions to `AWAITING_AI_TA_TRIGGER`.
    5.  **AI Analyzed TA (`AWAITING_AI_TA_TRIGGER` -> `ANALYZING_TA` -> `AI_TA_SUCCEEDED`/`FAILED`):**
        *   `MainTabContent` observes `AWAITING_AI_TA_TRIGGER`, checks data, dispatches `TRIGGER_AI_TA`.
        *   Reducer transitions to `ANALYZING_TA`.
        *   `MainTabContent` observes `ANALYZING_TA`, calls `analyzeTaFormAction`.
        *   Upon action completion, FSM event `AI_TA_SUCCESS` or `AI_TA_FAILURE` is dispatched.
        *   Reducer updates `aiAnalyzedTaJson` and `aiAnalyzedTaRequestJson`.
    6.  **Post AI TA Logic (`AI_TA_SUCCEEDED`/`FAILED` -> `INITIATE_KEY_TAKEAWAYS_SEQUENCE` in `MainTabContent`):**
        *   `MainTabContent` observes `AI_TA_SUCCEEDED` or `AI_TA_FAILED`.
        *   It dispatches `INITIATE_KEY_TAKEAWAYS_SEQUENCE`.
        *   Reducer handles this, sets Key Takeaways placeholders to "pending...", transitions to `AWAITING_KEY_TAKEAWAYS_TRIGGER`.
    7.  **AI Key Takeaways (`AWAITING_KEY_TAKEAWAYS_TRIGGER` -> ... `KEY_TAKEAWAYS_SUCCEEDED`/`FAILED`):**
        *   Logic mirrors AI TA: `MainTabContent` dispatches `TRIGGER_KEY_TAKEAWAYS`, reducer transitions, `MainTabContent` calls action, FSM event, reducer updates context.
    8.  **Post Key Takeaways Logic (`KEY_TAKEAWAYS_SUCCEEDED`/`FAILED` -> `INITIATE_OPTIONS_ANALYSIS_SEQUENCE` in `MainTabContent`):**
        *   Logic mirrors Post AI TA: `MainTabContent` dispatches, reducer handles and transitions to `AWAITING_OPTIONS_ANALYSIS_TRIGGER`.
    9.  **AI Options Analysis (`AWAITING_OPTIONS_ANALYSIS_TRIGGER` -> ... `OPTIONS_ANALYSIS_SUCCEEDED`/`FAILED`):**
        *   Logic mirrors AI TA.
    10. **Post Options Analysis Logic & Branching (`OPTIONS_ANALYSIS_SUCCEEDED`/`FAILED`):**
        *   `MainTabContent` observes `OPTIONS_ANALYSIS_SUCCEEDED` or `FAILED`.
        *   **If `isFullAnalysisTriggered` is true:** Dispatches `INITIATE_CHAT_SUMMARY_SEQUENCE`. Reducer handles this, sets Chat Summary placeholders, transitions to `AWAITING_CHAT_SUMMARY_TRIGGER`.
        *   **If `isFullAnalysisTriggered` is false (i.e., "Analyze Stock" button):** Dispatches `PROCEED_TO_ANALYZE_STOCK_COMPLETE`. Reducer transitions to `ANALYZE_STOCK_COMPLETE`, then `IDLE`.
    11. **AI Chat Summary (Full Analysis Only - `AWAITING_CHAT_SUMMARY_TRIGGER` -> ... `CHAT_SUMMARY_SUCCEEDED`/`FAILED`):**
        *   Logic mirrors AI TA. On success, reducer initializes `chatHistory`.
    12. **Completion (Full Analysis):**
        *   After chat summary (success or fail), FSM transitions to `FULL_ANALYSIS_COMPLETE`, then `IDLE`.
    *   **Error/Skipped State Handling:** If any step fails, the FSM reducer sets subsequent, dependent steps' JSONs in context to a "skipped\_due\_to\_[previous\_step]\_failure" status.

*   **Data Formatting:**
    *   Numerical data for display is generally formatted to two decimal places.
    *   Monetary values are prefixed with "$".
    *   Options strike prices are formatted as currency but without decimals if whole numbers.
    *   Percentages are displayed with a "%" sign.
    *   Large numbers (like volume) are compacted.
    *   These formatting utilities are in `src/lib/number-utils.ts`.

## **4. Technology Stack (Mandatory)**

*   **Frontend Framework:** Next.js (latest stable v14.x or v15.x, **App Router mandatory**)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI (latest stable)
*   **Icons:** Lucide React (latest stable)
*   **Styling:** Tailwind CSS (latest stable v3.x)
*   **AI Integration:** Genkit (latest stable **v1.x series**)
*   **AI Model Provider:** Google AI (using `@genkit-ai/googleai`)
*   **Default AI Model:** `googleai/gemini-2.5-flash-preview-05-20` (defined in `src/ai/models.ts`)
*   **State Management:**
    *   React Context API (`StockAnalysisProvider` in `src/contexts/stock-analysis-context.tsx`) for global state (Debug Tab JSONs, chat history, FSM state).
    *   `useReducer` within `StockAnalysisProvider` for managing the FSM state of the analysis pipeline.
    *   `useActionState` for server actions.
*   **Data Fetching (External API):** **Polygon.io REST Client (`@polygon.io/client-js` version `^7.3.2` or latest compatible stable)**.
*   **Deployment Target (Initial):** Firebase App Hosting
*   **Build Tooling:** Next.js CLI (Turbopack enabled by default: `next dev --turbopack`).

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**

(This section re-emphasizes guidelines already stated or implied in Section 0, but tailored for quick reference related to tech stack specifics. **Section 0 remains the master directive.**)

#### **4.1.1. Next.js Specifics**
*   App Router, Server Components by default, Server Actions, `next/image` (with `placehold.co` and `data-ai-hint`), single root JSX.

#### **4.1.2. Genkit (v1.x) Specifics**
*   **Initialization**: Use global `ai` object from `src/ai/genkit.ts`. `enableOpenTelemetry: false` is critical. `@genkit-ai/next` is **NOT USED**.
*   **Strict v1.x Syntax**: Adhere to `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`.
*   **Flow Structure**: `'use server';` directive, JSDoc documentation, Zod schemas for input/output, export wrapper function & types.
*   **Prompts**: Handlebars templating language only. **NO direct function calls/`await` in templates.** Media (images) via data URIs (`{{media url=...}}`). Instructions for output formatting should be within the prompt string.
*   **Tools**: Use `ai.defineTool` if the LLM needs to *decide* whether to fetch data or perform an action during its reasoning process. Do not use for data that is always required; fetch that data before calling the flow and pass it as input.
*   **Gemini Model ID Format**: **MUST be `googleai/MODEL_NAME`** (e.g., `googleai/gemini-2.5-flash-preview-05-20`).
*   **Safety Settings**: Configure as needed per flow (e.g., `BLOCK_ONLY_HIGH` for chat-like interactions or general analysis).
*   **Model IDs File**: Centralize model IDs in `src/ai/models.ts`.
*   **Zod Imports for Schemas**: When defining Zod schemas in `src/ai/schemas/*.ts` files that might be imported (even for type inference) by client-side code, **MUST use `import {z} from 'zod';`** NOT `import {z} from 'genkit';`. This is critical to prevent Webpack from bundling server-side Genkit machinery (see Section 4.1.6.2).

#### **4.1.3. Data Fetching (Polygon.io)**
*   **Mandatory Library:** `@polygon.io/client-js`. No custom `fetch` calls to Polygon.io API.
*   **Adapter Pattern:** All Polygon.io API calls are abstracted within `src/services/data-sources/adapters/polygon-adapter.ts`. This adapter is responsible for making individual API calls, handling potential errors from those calls, and packaging the data (or error info) into the `AdapterOutput` structure.
*   **Output:** The adapter provides raw JSON data (or error objects) for each requested data type (Market Status, Snapshot, TAs, Options). This data is then passed to the `StockAnalysisContext` to populate the Debug Tab, and subsequently consumed and formatted by Main Tab display components.

#### **4.1.4. Styling & UI (ShadCN & Tailwind)**
*   Use ShadCN `Tabs` for Main/Debug tab navigation.
*   Define the application's color scheme using HSL CSS variables in `src/app/globals.css`. Base colors are:
    *   Primary: HSL(210, 75%, 50%) (vibrant blue)
    *   Background: HSL(210, 20%, 95%) (light, desaturated blue)
    *   Accent: HSL(180, 65%, 45%) (energetic green-teal)
*   **Semantic Color Usage:** Use semantic color classes (e.g., `text-positive`, `bg-destructive-muted`) defined via CSS variables. **NO hardcoded Tailwind color classes (e.g., `text-red-500`) outside of these semantic definitions or specific non-data-driven UI elements.**
*   Prefer using ShadCN components where available.
*   Ensure UI is responsive and accessible.

#### **4.1.5. State Management**
*   **Primary State:** `StockAnalysisContext` (defined in `src/contexts/stock-analysis-context.tsx`) is the central hub for application state related to stock analysis. This includes:
    *   All raw JSON strings for data fetched (Market Status, Snapshot, TAs, Options) and generated by AI flows (AI TA, Key Takeaways, Options Analysis, Chat Summary, Chatbot interactions). These directly populate the "Debug" tab.
    *   Chat history (`ChatMessage[]`).
    *   Client-side debug console settings (`isClientDebugConsoleEnabled`, `isClientDebugConsoleOpen`, `logSourceConfig`).
*   **FSM for Pipeline Management:**
    *   The `StockAnalysisContext` uses a `useReducer` hook (`fsmReducer`) to implement a Finite State Machine (FSM).
    *   The `FsmState` enum defines all possible states of the analysis pipeline.
    *   `FsmEvent` type defines all events that can trigger state transitions.
    *   `MainTabContent.tsx` dispatches FSM events and reacts to `fsmState` changes to orchestrate the analysis pipeline (calling server actions, updating UI).
*   **Server Actions:** `useActionState` hook is used in `MainTabContent.tsx` to manage the pending/success/error states of calls to Next.js Server Actions.

#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**

This section documents critical issues encountered during development and their resolutions. Understanding these is key to maintaining stability and avoiding reintroduction of bugs.

##### **4.1.6.1. `async_hooks` & Turbopack Build Failures (Historically a Major Blocker)**
*   **Context:** Previous development phases encountered persistent `async_hooks` errors during Next.js builds (`next build`), particularly when Turbopack was enabled and Genkit (especially `@genkit-ai/next`) was integrated. These errors often presented as segmentation faults or cryptic messages related to asynchronous context propagation.
*   **Resolution/Mitigation (Commit `c14e3af6` and ongoing):**
    1.  **CRITICAL: DO NOT re-add `genkitPluginNextjs()` or the `@genkit-ai/next` package.** This package was identified as a primary source of incompatibility with Turbopack's handling of `async_hooks`. Its removal was essential for build stability.
    2.  **CRITICAL: Ensure `enableOpenTelemetry: false` in `src/ai/genkit.ts` (`genkit()`_config).** While OpenTelemetry is powerful, its deep integration with async context can conflict with Next.js/Turbopack. Disabling it at the Genkit initialization level is mandatory.
    3.  **Extreme Caution with New Dependencies:** Be highly cautious when adding new dependencies, especially those related to Application Performance Monitoring (APM), tracing, or deep Node.js/async operations. Thoroughly test builds after adding such packages.
    4.  **Keep `next.config.js` Simple:** **AVOID Webpack `resolve.fallback` configurations** or other complex Webpack customizations in `next.config.js` unless absolutely unavoidable and thoroughly tested. These can interfere with Next.js's built-in handling of modules and bundling. The current simple `next.config.ts` (only handling image remote patterns and ignoring build errors for TypeScript/ESLint) is the stable baseline.
*   **CRITICAL INSTRUCTION FOR USER (AND AI AGENT):** If `async_hooks`-related errors (or similar difficult-to-diagnose build failures) reappear, a **full local environment re-initialization (as per `reinit.md`) MUST be performed by the user.** This is the first and most critical troubleshooting step. If errors persist *after* a full re-init, the issue must be flagged immediately to the user for deeper investigation. The AI Agent should not attempt complex Webpack fallbacks.

##### **4.1.6.2. Client-Side Bundling of Server Code (Webpack "Module not found" Errors) - RESOLVED**
*   **Context (Post-Mortem of Commit `fc96d65a`):** After resolving the `async_hooks` issue by removing `@genkit-ai/next` (commit `c14e3af6`), the project faced new build failures: "Module not found" errors for Node.js built-in modules (e.g., `tls`, `net`, `dns`, `http2`) and server-side OpenTelemetry components (e.g., `@opentelemetry/exporter-jaeger`). These errors indicated that Webpack was attempting to bundle server-only code into the client application.
*   **Root Cause:**
    1.  **Problematic Zod Import:** Client-side schema definition files (`src/ai/schemas/*.ts`) were importing the Zod utility (`z`) directly from the main `genkit` package: `import {z} from 'genkit';`.
    2.  **Dependency Chain:** Since these schema files (or types derived from them) were ultimately imported by client-side components (e.g., `Chatbot.tsx` using types from `chat-schemas.ts`), Webpack traced this dependency.
    3.  **Full Package Exposure:** Importing `z` from `genkit`'s main entry point exposed the entire `genkit` package to Webpack's bundling process. This allowed Webpack to "see" and attempt to bundle `genkit`'s full suite of functionalities, including its server-side tracing capabilities which depend on `@opentelemetry/sdk-node` and, by extension, `@grpc/grpc-js`.
    4.  **Effect of `@genkit-ai/next` Removal:** The `@genkit-ai/next` package, while causing `async_hooks` issues, likely provided implicit Webpack configurations or shims that previously (and perhaps imperfectly) prevented or mitigated the bundling of these deep server-side dependencies. Its removal (a necessary fix for `async_hooks`) unmasked this latent bundling problem.
    5.  **`enableOpenTelemetry: false` vs. Bundling:** The `enableOpenTelemetry: false` flag in `src/ai/genkit.ts` correctly prevents OpenTelemetry *runtime* initialization but **does not** stop Webpack from *attempting to bundle* the imported code if it's part of an import chain originating from client-side code.
*   **Resolution (Commit `fc96d65a`):**
    *   The Zod import in all relevant schema files (`src/ai/schemas/ai-analyzed-ta-schemas.ts`, `src/ai/schemas/chat-schemas.ts`, `src/ai/schemas/stock-analysis-schemas.ts`, and new `src/ai/schemas/ai-options-analysis-schemas.ts`, `src/ai/schemas/chat-summary-schemas.ts`) was changed from `import {z} from 'genkit';` to **`import {z} from 'zod';`**.
    *   This critical change decouples the schema definitions from the main `genkit` server-side package, allowing Webpack to correctly tree-shake the client bundle and exclude Node.js-specific modules and OpenTelemetry server components.
*   **Lesson Learned & Critical Guideline for AI Agent:**
    *   **To prevent client-side bundling of server-only Genkit code, any schema files (`src/ai/schemas/*.ts`) that are, or whose types are, consumed (directly or indirectly) by client-side components MUST always import `zod` directly using `import {z} from 'zod';`**.
    *   **DO NOT use `import {z} from 'genkit';` in such schema files.** This is a primary cause of Webpack attempting to bundle server-side Node.js modules and OpenTelemetry components into the client, leading to "Module not found" errors.
    *   The removal of `@genkit-ai/next` was essential for `async_hooks` stability, but it requires stricter adherence to separating client-safe imports.
    *   The AI Agent **MUST** verify this Zod import pattern for any *new* schema files it creates or modifies that are intended for client-side type consumption. Failure to do so risks reintroducing critical build failures.
    *   **Reinforcement (Commit `69bcf1a6`):** An enhanced client-side execution guard has been added to `src/ai/genkit.ts`. If this server-only module is ever executed in a client environment (e.g., due to a new problematic import chain), it will throw an error in development and log a critical error in production, aiding in rapid diagnosis.

##### **4.1.6.3. Incorrect `'use server';` Directive on Non-Action Modules (e.g., `genkit.ts`) - RESOLVED**
*   **Context (Post-Mortem of Commit `8d199845`):** After resolving the schema import issues, the project faced a persistent build error: "A 'use server' file can only export async functions, found object."
*   **Root Cause:**
    1.  The file `src/ai/genkit.ts`, which initializes and exports the main `ai` Genkit instance (an object), incorrectly had the `'use server';` directive at the top of the file.
    2.  The `'use server';` directive, when placed at the top of a file, signals to Next.js that *all* exports from that file are Server Actions. Server Actions must be functions (typically async).
    3.  Exporting the `ai` object from `src/ai/genkit.ts` while it was marked with `'use server';` directly violated this Next.js rule, as an object is not an async function.
*   **Resolution (Commit `8d199845`):**
    *   The `'use server';` directive was **removed** from `src/ai/genkit.ts`.
    *   This allows `src/ai/genkit.ts` to function as a standard server-side module that exports the configured `ai` object. Other server-side modules (like Genkit flows, which *are* correctly marked with `'use server';` for their exported action functions) can then import and use this `ai` instance without issue.
*   **Lesson Learned & Critical Guideline for AI Agent:**
    *   The `'use server';` directive should **only** be used in files where *all* exports are intended to be Server Actions (async functions callable from the client or other server components).
    *   For modules that primarily configure instances, export constants, or provide utility objects/functions for use *within other server-side code* (and are not themselves Server Actions), the `'use server';` directive should **not** be used at the top of the file. This was the case for `src/ai/genkit.ts`. It also applies to files like `src/ai/models.ts`, schema files (`src/ai/schemas/*.ts`), and general utility files (`src/lib/*.ts`) if they are not exporting Server Actions.
    *   Flow files (`src/ai/flows/*.ts`) and Server Action files (`src/actions/*.ts`) correctly use `'use server';` because they export async functions.
    *   The AI Agent **MUST** verify the correct use (or absence) of the `'use server';` directive based on a file's intended exports and usage context, especially for core configuration files or utility modules.

##### **4.1.6.4. General Genkit v1.x Syntax & Data Flow**
*   **Genkit v1.x Syntax:** Strict adherence to the v1.x syntax (e.g., `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`) is crucial.
*   **Data Flow & FSM:** Maintain the established data flow: Raw data from sources (Polygon via adapter) -> Server Actions -> FSM events in `MainTabContent` -> `fsmReducer` in `StockAnalysisContext` updates state (Debug Tab JSONs) -> "Main" Tab components read and format from this state. The FSM is central to orchestrating this.

##### **4.1.6.5. Client-Side Debug Console (`DebugConsole.tsx`)**
*   The `DebugConsole.tsx` component with its advanced filtering, search, and export features is the primary tool for client-side debugging. Ensure `logDebug` calls (from `useStockAnalysis` context) are used appropriately with correct `LogSourceId` to populate it. Default source toggles now ON when console is enabled.

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9 In Progress. Current application version: v2.9.A.K.)*

---
**Phase 0: Project Setup & Core Layout** - Status: **COMPLETE**
*   (Tasks 0.1 - 0.6)

---
**Phase 1: UI Shell Implementation - "Debug" Tab** - Status: **COMPLETE**
*   (Tasks 1.1 - 1.3)

---
**Phase 2: UI Shell Implementation - "Main" Tab (Part 1)** - Status: **COMPLETE**
*   (Tasks 2.1 - 2.5)

---
**Phase 3: UI Shell Implementation - "Main" Tab (Part 2: Options)** - Status: **COMPLETE**
*   (Task 3.1)

---
**Phase 4: Backend Data Fetching & "Debug" Tab Population** - Status: **COMPLETE**
*   (Tasks 4.1 - 4.5.1)

---
**Phase 5: AI Logic Implementation & "Debug" Tab Population** - Status: **COMPLETE**
*   (Tasks 5.1 - 5.3)

---
**Phase 6: Connecting "Main" Tab UI to Live Data** - Status: **COMPLETE**
*   (Tasks 6.1 - 6.6.2)

---
**Phase 7: Data Export & Final Client-Side Features** - Status: **COMPLETE**
*   (Tasks 7.1 - 7.2)

---
**Phase 8: Final Styling, Cleanup, Documentation & Stability** - Status: **COMPLETE**
*   (Tasks 8.1 - 8.8.5)

---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **IN PROGRESS**
*   **Task 9.1: FSM Core Setup & Initial State Integration (v2.9.1.0):** - Status: **COMPLETE** (Commit: `544f6005`)
*   **Task 9.2: Integrate Data Fetching into FSM (v2.9.2.0):** - Status: **COMPLETE** (Commit: `d8eff27b`)
*   **Task 9.3: Integrate AI Analyzed TA into FSM (v2.9.3.0):** - Status: **COMPLETE** (Commit: `bbc610b0`)
*   **Task 9.4: Integrate AI Key Takeaways into FSM (v2.9.4.0):** - Status: **COMPLETE** (Commit: `a70d937a`)
*   **Task 9.5: Integrate AI Options Analysis into FSM (v2.9.5.0):** - Status: **COMPLETE** (Commit: `d5fe9d27`)
*   **Task 9.6: Integrate Chat Summary (Full Analysis) into FSM (v2.9.6.0):** - Status: **COMPLETE** (Commit: `f4ed4f56`)
*   **Task 9.7: FSM Finalization & Error Handling Polish (v2.9.7.0):** - Status: **COMPLETE** (Commit: `9b4c790e`)
*   **Task 9.8: Pre-testing Enhancements/Refinements/Debug Logs (v2.9.8.0):** - Status: **COMPLETE** (Commit: `a7f2b396`)
*   **Task 9.A: Comprehensive Full README.md update - FULL PRD, Detailed Design and Architecture Flow (v2.9.A.0):** - Status: **COMPLETE** (Commit: `a7f2b396`)
*   **Task 9.9: Testing and Debugging Fixes (v2.9.9.x -> v2.9.A.x):** - Status: **IN PROGRESS**
    *   **Task 9.9.A.1: Fix Client Debug Console Toggle & FSM ReferenceError (v2.9.A.1):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.1]`)
    *   **Task 9.9.A.2: Fix FSM Pipeline Stall & Display Component Handling of 'pending' (v2.9.A.2):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.2]`)
    *   **Task 9.9.A.3: Further FSM Pipeline Debugging & Display Component Fixes (v2.9.A.3):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.3]`)
    *   **Task 9.9.A.4: Robust 'pending' handling in OptionsChainTable; FSM progression debug in MainTabContent (v2.9.A.4):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.4]`)
    *   **Task 9.9.A.5: Simplified useEffect entry conditions in MainTabContent for FSM AWAITING_TRIGGER states (v2.9.A.5):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.5]`)
    *   **Task 9.9.A.6: Aggressive entry-point logging to FSM useEffects in MainTabContent; verify dependencies (v2.9.A.6):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.6]`)
    *   **Task 9.9.A.7: Fix MarketStatusDisplay pending state; aggressive FSM logging in MainTabContent (v2.9.A.7):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.7]`)
    *   **Task 9.9.A.8: Simplified useEffect dependency arrays for FSM AWAITING_TRIGGER states in MainTabContent (v2.9.A.8):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.8]`)
    *   **Task 9.9.A.9: Refactor FSM to decouple chained state transitions via explicit 'PROCEED_TO_*_SETUP' events (v2.9.A.9):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.9]`)
    *   **Task 9.9.A.A: Strict useEffect deps for AWAITING_..._TRIGGER states in MainTabContent (v2.9.A.A):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.A]`)
    *   **Task 9.9.A.B: Refine full analysis path in MainTabContent useEffects (v2.9.A.B):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.B]`)
    *   **Task 9.9.A.C: Fix footer hydration error; verify full analysis path logic (v2.9.A.C):** - Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.C]`) 
    *   **Task 9.9.A.D: Fix footer hydration error again (v2.9.A.D):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.D]`)
    *   **Task 9.9.A.E: Add ticker consistency checks before AI server actions in MainTabContent (v2.9.A.E):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.E]`)
    *   **Task 9.9.A.F: Refine ticker consistency logic in MainTabContent AI action useEffects to 'return early' and wait for context update (v2.9.A.F):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.F]`)
    *   **Task 9.9.A.G: Change "Analyze Stock" button scope; adjust FSM for new partial/full definitions (v2.9.A.G):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.G]`)
    *   **Task 9.9.A.H: Fix hydration error in date-utils (v2.9.A.H):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.H]`)
    *   **Task 9.9.A.J: Robustly ensure data consistency for AI actions in MainTabContent (v2.9.A.J):** Status: **COMPLETE** (Commit: `[Prev. Hash for v2.9.A.J]`)
    *   **Task 9.9.A.K: Correct FSM reducer logic to ensure state transitions from '*_SUCCEEDED' to 'AWAITING_*_TRIGGER' states; reset ticker ref on IDLE. (v2.9.A.K):** Status: **COMPLETE (Commit: 38de9431)** (This commit)


## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                                                           |
| :------ | :----------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-06-09   | Firebase Studio (AI Prototyper) | Initial draft of the Re-Implementation PRD for v2.1.0 with UI-First strategy.                                                                                                                                                                                                                                |
| ...     | ...          | ...                           | ... (Previous changelog entries remain, ensure consistency) ...                                                                                                                                                                                                                                             |
| 1.38    | 2025-06-14   | Firebase Studio (AI Prototyper) | **Task 9.9.A.J (Robust data consistency for AI actions) COMPLETE.** Application version `v2.9.A.J`. Refined `useEffect` hooks in MainTabContent for AI actions to ensure data consistency with the active ticker, returning early to await context updates. Header displays `v2.9.A.J`. **Commit: [Prev. Hash for v2.9.A.J]** |
| **1.39**| **2025-06-14**| Firebase Studio (AI Prototyper) | **Task 9.9.A.K (Correct FSM reducer transitions & reset ticker ref) COMPLETE.** Application version `v2.9.A.K`. Updated FSM reducer logic in StockAnalysisContext to ensure proper state transitions to `AWAITING_*_TRIGGER` states and set pending placeholders. Reset `analysisTriggeredForTickerRef` in MainTabContent on IDLE. Header displays `v2.9.A.K`. Phase 9 Task 9.9.A.K status updated. **Commit: 38de9431** |


## **7. Project Implementation Commit Log (StockSage App Version)**

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme.

---
**App Version:** `v2.1.0` (Covers commits up to `d1a5e67f` which completed Phase 8 core features before dynamic versioning)

**Tag:** `Phase-0_Task-0.6` ([v0.0.6])
**Subject:** `feat: Complete Phase 0 - Project Setup & Core Layout`
... (Previous commit logs remain)

---
**App Version:** `v2.9.A.J` (Robust data consistency for AI actions in MainTabContent)
**Tag:** `Phase-9_Task-9.A.J_FSM-Data-Consistency-Retry` - Commit Hash: `[Prev. Hash for v2.9.A.J]`
**Subject:** `fix(fsm): Enhance AI action data consistency checks in MainTabContent (v2.9.A.J)`
**Details:**
Refined `useEffect` hooks in `MainTabContent.tsx` for AI server actions. On ticker data inconsistency, effects now return early, relying on dependencies to re-evaluate when context data (like `stockSnapshotJson`) updates to match the active analysis ticker. This aims to allow the pipeline to "wait" for consistent data rather than failing immediately. UI Header updated to `v2.9.A.J`. `README.md` updated.

---
**App Version:** `v2.9.A.K` (FSM Reducer Fix & Ticker Ref Reset)
**Tag:** `Phase-9_Task-9.A.K_FSM-Reducer-Fix-TickerRef` - Commit Hash: `38de9431`
**Subject:** `fix(fsm): Ensure reducer transitions to AWAITING states; reset ticker ref (v2.9.A.K)`
**Details:**
Corrected FSM reducer logic in `StockAnalysisContext.tsx`: ensured that `INITIATE_..._SEQUENCE` events, when handled within `*_SUCCEEDED` states, correctly set pending placeholders for the upcoming AI step AND explicitly return the new `AWAITING_..._TRIGGER` state. This fixes the FSM stall after data fetching. Reset `analysisTriggeredForTickerRef.current` in `MainTabContent.tsx` when FSM becomes IDLE. UI Header updated to `v2.9.A.K`. `README.md` updated.

---
*(Future commit logs will follow)*

