
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.9.A.V OPERATING MANUAL**

*   **Document Version:** 1.46 (Task 9.A.V - Decouple Chat Summary, Enhance Volatility Prompt)
*   **Date:** 2025-06-15 
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. **Phase 9 In Progress. Current application version: v2.9.A.V.**

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
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.A.V)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.A.V`). This version focuses on simplifying the analysis pipeline trigger and enhancing AI output quality.
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling & FSM Orchestration**

The primary strategy for this implementation is **UI-First Development**, managed by a **Finite State Machine (FSM)** for the analysis pipeline. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab.
*   **FSM-Orchestrated Data Flow:** The `StockAnalysisContext` utilizes a `useReducer` hook to implement an FSM. This FSM manages the entire lifecycle of a stock analysis:
    *   It orchestrates the sequence of data fetching and AI analysis steps.
    *   It updates the application's global state (the JSONs in `StockAnalysisContext`, which populate the Debug tab) upon successful completion or failure of each step.
    *   It handles error propagation, marking subsequent steps as "skipped" if a prerequisite fails.
    *   This ensures a predictable, traceable, and robust data pipeline.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for all data points.
    *   Offer a robust and debuggable backend processing pipeline through the FSM.

## **2. High-Level Goals (Current Version v2.9.A.V)**

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

## **3. Core Application Features (StockSage v2.9.A.V)**

This section details the core features of StockSage v2.9.A.V, serving as the Product Requirements.

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.A.V`).
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
    *   **"Analyze Stock" Button (v2.9.A.V+ Behavior):** Initiates a "full analysis," which includes:
        1.  Fetching all data from Polygon.io (Market Status, Stock Snapshot, Standard TAs, Options Chain).
        2.  Calculating AI Analyzed Technical Analysis (Pivot Points).
        3.  Generating AI Key Takeaways.
        4.  Performing AI Options Analysis.
        *   This triggers the FSM `START_FULL_ANALYSIS` event. Each press wipes all previous analysis-related JSON data (market status, snapshot, TAs, options, all AI results) and starts the pipeline fresh. AI Chat History and Client Debug Console logs are explicitly preserved.
    *   Button shows loading spinners and is disabled while an analysis pipeline is active (`isPipelineActive` state).

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
        *   Categories: Price Action, Trend, Volatility, Momentum, Patterns. The "Volatility" takeaway is prompted to be descriptive.
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
            *   Scrollable chat history area displaying user and model (AI) messages. AI Chat History is preserved across "Analyze Stock" button presses.
            *   Example prompts (buttons) that pre-fill the input field (e.g., "What is the current price of {TICKER}?").
            *   Controls to Clear Chat History (with confirmation dialog), Copy Chat (JSON), and Export Chat (JSON).
        *   Context: The chatbot uses all available data from the `StockAnalysisContext` (Snapshot, TAs, AI TA, Key Takeaways, AI Options Analysis, Market Status) and the ongoing chat history to answer questions.
        *   Initial Message: No automatic initial summary message is generated after analysis. Chat is purely user-initiated.
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
        *   Chatbot Request JSON (includes interactive chat requests only).
        *   Chatbot Response JSON (includes interactive chat responses only).
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
        *   **Market Status:** Using `client.reference.marketStatus()`. Includes a cache-busting parameter `_t: Date.now()`.
        *   **Ticker Snapshot:** Using `client.stocks.snapshotTicker()`. Includes a cache-busting parameter `_t: Date.now()`. Provides current day, previous day, and latest minute bar data.
        *   **Standard Technical Indicators:** Each call (`rsi`, `macd`, `ema`, `sma`) includes a cache-busting parameter `_t: Date.now()`.
        *   **Options Chain Snapshot:** Using `client.options.snapshotOptionChain()`. Includes a cache-busting parameter `_t: Date.now()`. Fetches Calls and Puts separately for the nearest upcoming Friday expiration date.
    *   The adapter includes delays between API calls to respect rate limits. A new `PolygonAdapter` instance is created for each `getFullStockData` call, passing the target ticker to its constructor to ensure isolation.
    *   Output: An `AdapterOutput` object containing the `StockDataPackage` and raw request/response summaries.

*   **Genkit AI Flows (Located in `src/ai/flows/`):**
    All flows use the global `ai` instance from `src/ai/genkit.ts` and models defined in `src/ai/models.ts`. Server actions in `src/actions/` wrap these flows.

    1.  **AI Analyzed Technical Analysis (`analyze-ta-flow.ts`):**
        *   **Purpose:** Calculates classic daily Pivot Points.
        *   **Input (`AnalyzeTaInput`):** Previous day's High, Low, Close prices.
        *   **Output (`AnalyzeTaOutput`):** Pivot Point (PP), Support levels (S1, S2, S3), Resistance levels (R1, R2, R3).
    2.  **AI Key Takeaways (`analyze-stock-data.ts`):**
        *   **Purpose:** Generates 5 key takeaways with associated sentiment. Volatility takeaway prompt enhanced for descriptiveness.
        *   **Input (`StockAnalysisInput`):** Ticker, Stock Snapshot JSON, Standard TAs JSON, AI Analyzed TA JSON, Market Status JSON.
        *   **Output (`StockAnalysisOutput`):** Object with takeaways for Price Action, Trend, Volatility, Momentum, Patterns.
    3.  **AI Options Analysis (`analyze-options-chain-flow.ts`):**
        *   **Purpose:** Identifies significant Call/Put "Walls" and "OI Clusters."
        *   **Input (`AiOptionsAnalysisInput`):** Ticker, Options Chain JSON, Current Underlying Price.
        *   **Output (`AiOptionsAnalysisOutput`):** Arrays for walls/clusters and an `analysisSummary`.
    4.  **AI Chatbot (`chat-flow.ts`):**
        *   **Purpose:** Provides contextual, conversational answers based on user input.
        *   **Input (`ChatInput`):** Ticker, all context JSONs, chat history, user input.
        *   **Output (`ChatOutput`):** `response`.

*   **Server Action Validation (`analyze-stock-server-action.ts`):**
    *   `fetchStockDataAction` maintains a critical check: if the ticker in the `stockSnapshot` returned by the `polygon-adapter` does *not* match the requested ticker, the action returns an explicit error. This helps catch stale data issues closer to the source.

*   **FSM-Driven Architecture Flow (Managed by `StockAnalysisContext` and `MainTabContent`):**
    The analysis pipeline is orchestrated by a Finite State Machine (FSM).
    1.  **Initiation:** User clicks "Analyze Stock". `activeAnalysisTicker` in `MainTabContent` is set. `analysisTriggeredForTickerRef` is set. FSM event (`START_FULL_ANALYSIS`) is dispatched. Chat history is *preserved*. All analysis-related JSONs in context are *wiped* to "pending...".
    2.  **Initialization (`INITIALIZING_ANALYSIS` state):** FSM reducer calls `setAllPlaceholdersInternal`. `isFullAnalysisTriggered` is set. Transitions to `AWAITING_DATA_FETCH_TRIGGER`.
    3.  **Data Fetching (`AWAITING_DATA_FETCH_TRIGGER` -> `FETCHING_DATA` -> `DATA_FETCH_SUCCEEDED`/`FAILED`/`STALE_DATA_FROM_ACTION_ERROR`):**
        *   `MainTabContent` observes `AWAITING_DATA_FETCH_TRIGGER`, dispatches `TRIGGER_DATA_FETCH`.
        *   Reducer transitions to `FETCHING_DATA`.
        *   `MainTabContent` observes `FETCHING_DATA`, calls `analyzeStockFormAction({ ticker: activeAnalysisTicker })`.
        *   Upon action completion (`analyzeStockState` update):
            *   `MainTabContent` validates `analyzeStockState.data.stockSnapshotJson.ticker` against `analysisTriggeredForTickerRef.current`.
            *   If stale, dispatches `STALE_DATA_FROM_ACTION` to FSM. Reducer sets context JSONs to error/skipped, transitions to `STALE_DATA_FROM_ACTION_ERROR`, then `IDLE`.
            *   If consistent and success, dispatches `FETCH_DATA_SUCCESS`. Reducer updates context JSONs.
            *   If action error, dispatches `FETCH_DATA_FAILURE`. Reducer updates context.
    4.  **Post Data Fetch & Subsequent AI Steps:**
        *   The `useEffect` hooks in `MainTabContent` for `DATA_FETCH_SUCCEEDED`, `AI_TA_SUCCEEDED`, etc., gatekeep progression. They check if their *own output JSONs* (now in context) and other prerequisites for the *next* step are ready and consistent (especially snapshot ticker) before dispatching `INITIATE_NEXT_AI_STEP_SEQUENCE`.
        *   The `AWAITING_..._TRIGGER` effects then simply dispatch `TRIGGER_...`.
        *   This pattern repeats for AI TA, Key Takeaways, and Options Analysis.
    5.  **Pipeline End:** After `OPTIONS_ANALYSIS_SUCCEEDED` or `OPTIONS_ANALYSIS_FAILED`, the FSM transitions to `FULL_ANALYSIS_COMPLETE`, then to `IDLE`. No automatic chat summary is generated.
    *   **Error/Skipped State Handling:** If any step fails (or stale data detected), the FSM reducer sets subsequent, dependent steps' JSONs in context to appropriate "skipped" or "error" statuses.

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
    *   React Context API (`StockAnalysisProvider` in `src/contexts/stock-analysis-context.tsx`) for global state.
    *   `useReducer` within `StockAnalysisProvider` for managing the FSM state.
    *   `useActionState` for server actions.
*   **Data Fetching (External API):** **Polygon.io REST Client (`@polygon.io/client-js` version `^7.3.2` or latest compatible stable)**.
*   **Deployment Target (Initial):** Firebase App Hosting
*   **Build Tooling:** Next.js CLI (Turbopack enabled by default: `next dev --turbopack`).

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**
(See Section 0 for master directives.)

#### **4.1.1. Next.js Specifics**
*   App Router, Server Components, Server Actions, `next/image` (`placehold.co`, `data-ai-hint`), single root JSX.

#### **4.1.2. Genkit (v1.x) Specifics**
*   Global `ai` from `src/ai/genkit.ts`. `enableOpenTelemetry: false`. No `@genkit-ai/next`.
*   Strict v1.x syntax: `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`.
*   Flows: `'use server';`, JSDoc, Zod schemas, export wrapper & types.
*   Prompts: Handlebars. No direct function calls/`await`. Media via data URIs.
*   Tools: `ai.defineTool` for LLM-decided actions.
*   Model IDs: `googleai/MODEL_NAME` format, centralized in `src/ai/models.ts`.
*   Safety Settings: Per flow.
*   Zod Imports: `import {z} from 'zod';` in `src/ai/schemas/*.ts`.

#### **4.1.3. Data Fetching (Polygon.io)**
*   Library: `@polygon.io/client-js`.
*   Adapter: `src/services/data-sources/adapters/polygon-adapter.ts`.
    *   Cache-busting params (`_t: Date.now()`) added to API calls.
    *   New adapter instance per `getFullStockData` call, with ticker passed to constructor.
*   Server Action: `src/actions/analyze-stock-server-action.ts` validates adapter's returned ticker.

#### **4.1.4. Styling & UI (ShadCN & Tailwind)**
*   ShadCN `Tabs`. HSL CSS vars in `globals.css`. Semantic colors.

#### **4.1.5. State Management**
*   `StockAnalysisContext`: Central state (Debug JSONs, chat, FSM state).
*   FSM (`useReducer`): Orchestrates analysis pipeline.
*   `MainTabContent`: Dispatches FSM events, reacts to `fsmState`, calls server actions.
*   `useActionState`: Manages server action states.

#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**
(Content on `async_hooks`, client-side bundling, `'use server';` directive, Genkit syntax, and Debug Console remains relevant and CRITICAL.)

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9 In Progress. Current application version: v2.9.A.V.)*

---
**Phase 0-8: COMPLETE**
---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **IN PROGRESS**
*   **Tasks 9.1 - 9.8: COMPLETE**
*   **Task 9.A: Comprehensive Full README.md update (v2.9.A.0):** - Status: **COMPLETE**
*   **Task 9.9: Testing and Debugging Fixes (v2.9.9.x -> v2.9.A.x):** - Status: **IN PROGRESS**
    *   **Tasks 9.9.A.1 - 9.9.A.H: COMPLETE**
    *   **Task 9.9.A.J - 9.9.A.L: COMPLETE**
    *   **Task 9.9.A.M: Refined MainTabContent useEffects (v2.9.A.M):** Status: **COMPLETE**
    *   **Task 9.9.A.N: Further refinement of placeholders and MainTabContent useEffects (v2.9.A.N):** Status: **COMPLETE**
    *   **Task 9.9.A.O: Fix MarketStatusDisplay hydration error (v2.9.A.O):** Status: **COMPLETE**
    *   **Task 9.9.A.P: Validate action state ticker in MainTabContent before FSM dispatch (v2.9.A.P):** Status: **COMPLETE**
    *   **Task 9.9.A.Q: Ensure fresh Polygon client per call in adapter; enhanced logging (v2.9.A.Q):** Status: **COMPLETE**
    *   **Task 9.9.A.R: Server-side validation of adapter output ticker in action; enhanced logging (v2.9.A.R):** Status: **COMPLETE**
    *   **Task 9.9.A.S: Implement cache-busting in Polygon adapter (v2.9.A.S):** Status: **COMPLETE**
    *   **Task 9.9.A.T: Simplify analysis trigger, preserve chat/logs, wipe data JSONs (v2.9.A.T):** Status: **COMPLETE**
    *   **Task 9.9.A.U: Fix Chatbot Duplicate Key Error (v2.9.A.U):** Status: **COMPLETE**
    *   **Task 9.9.A.V: Decouple Chat Summary & Enhance Volatility Prompt (v2.9.A.V):** Status: **COMPLETE** (This task)


## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                                                          |
| :------ | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ...     | ...          | ...                           | ... (Previous changelog entries up to 1.45 / v2.9.A.U remain) ...                                                                                                                                                                                                                                           |
| 1.45    | 2025-06-15   | Firebase Studio (AI Prototyper) | **Task 9.9.A.U (Fix Chatbot Duplicate Key Error) COMPLETE.** Application version `v2.9.A.U`. Enhanced uniqueness of IDs for AI-generated summary messages in `StockAnalysisContext` to prevent React key collisions. Header displays `v2.9.A.U`. Phase 9 Task 9.9.A.U status updated. **Commit: [Prev. Hash for v2.9.A.U]** |
| **1.46**| **2025-06-15**| Firebase Studio (AI Prototyper) | **Task 9.9.A.V (Decouple Chat Summary & Enhance Volatility Prompt) COMPLETE.** Application version `v2.9.A.V`. README updated to reflect features of v2.9.A.V: automatic chat summary removed from main pipeline; volatility prompt enhanced. UI Header displays `v2.9.A.V`. Phase 9 Task 9.9.A.V status updated. **Commit: 731cd246** |


## **7. Project Implementation Commit Log (StockSage App Version)**

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme.

---
... (Previous commit logs up to v2.9.A.S remain)

---
**App Version:** `v2.9.A.T` (Simplify analysis trigger, preserve chat/logs, wipe data JSONs)
**Tag:** `Phase-9_Task-9.A.T_SimplifyAnalysisTrigger-WipeData` - Commit Hash: `[Prev. Hash for v2.9.A.T]`
**Subject:** `feat(analysis): Simplify analysis trigger, preserve chat/logs (v2.9.A.T)`
**Details:**
Removed 'AI Full Stock Analysis' button. 'Analyze Stock' button now always triggers a full analysis pipeline. On every press, all data JSONs (snapshot, TAs, options, AI results, API logs, initial chatbot summary request/response) are wiped by resetting them to a 'pending...' state. AI Chat History and Client Debug Console logs are explicitly preserved across these analyses. Removed redundant FSM event `START_ANALYZE_STOCK`. UI Header updated to `v2.9.A.T`. `README.md` updated.

---
**App Version:** `v2.9.A.U` (Fix Chatbot Duplicate Key Error)
**Tag:** `Phase-9_Task-9.A.U_FixChatbotDuplicateKey` - Commit Hash: `[Prev. Hash for v2.9.A.U]`
**Subject:** `fix(chat): Ensure unique keys for AI summary messages (v2.9.A.U)`
**Details:**
Enhanced uniqueness of IDs for AI-generated summary messages in `StockAnalysisContext` by appending a random suffix to the timestamp. This prevents React key collisions if multiple summaries are generated rapidly. UI Header updated to `v2.9.A.U`. `README.md` updated.

---
**App Version:** `v2.9.A.V` (Decouple Chat Summary & Enhance Volatility Prompt)
**Tag:** `Phase-9_Task-9.A.V_DecoupleChatSummary-VolatilityPrompt` - Commit Hash: `731cd246`
**Subject:** `feat(analysis): Decouple auto chat summary, enhance volatility prompt (v2.9.A.V)`
**Details:**
Modified "Analyze Stock" button to trigger full pipeline up to AI Options Analysis only; automatic AI chat summary generation removed. Chatbot is now purely for user-initiated questions. Volatility prompt in `analyze-stock-data.ts` enhanced for more descriptive output. Removed `generate-full-analysis-summary-flow.ts`, `generate-chat-summary-action.ts`, `chat-summary-schemas.ts` (manual user deletion). Updated FSM in `StockAnalysisContext`, `MainTabContent`, and `debug-log-types.ts`. UI Header updated to `v2.9.A.V`. `README.md` updated to reflect changes.
---
*(Future commit logs will follow)*


    