
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.9.A.Z OPERATING MANUAL**

*   **Document Version:** 1.48 (Task 9.A.Z - Document Current State for Handover)
*   **Date:** 2025-06-15 
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. **Phase 9 In Progress. Current application version: v2.9.A.Z.**

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
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.A.Z)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.A.Z`). This version focuses on simplifying the analysis pipeline trigger and enhancing AI output quality, but is currently impacted by critical stability issues.
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

## **2. High-Level Goals (Current Version v2.9.A.Z)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First & FSM Adherence:** Strictly follow the UI-First strategy with the FSM-orchestrated data pipeline.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers, significantly improved by the Phase 9 FSM re-architecture.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface with clear feedback on processing states.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, client-side debug console with filtering, clear error reporting via toasts, and detailed FSM pipeline logging. **(CRITICAL: Client Debug Console currently NON-FUNCTIONAL).**
*   **Dynamic Versioning:** Maintain and display the application version `2.x.y.z` as per SOP (Section 0.6).
*   **Critical Issue Resolution:** Prioritize fixing the outstanding UI loop and client console logging issues.

### **2.1. Known Issues / Current Status (v2.9.A.Z)**
**WARNING:** This version (v2.9.A.Z) has critical outstanding issues that significantly impact usability and debuggability:
1.  **Stuck UI / Infinite Loop:** After the "Analyze Stock" button is pressed and the initial automated pipeline (Data Fetch + AI TA) completes (FSM reaches `AI_TA_SUCCEEDED`), the UI often remains in a loading state. The FSM does not consistently transition to `IDLE`, preventing further analysis or interaction with UI elements like the manual AI trigger buttons.
2.  **Broken Client Debug Console Logs:** The custom client debug console is not capturing or displaying application-specific logs (from `logDebug` or intercepted native `console.*` calls). Only browser/Next.js "Fast Refresh" messages are visible. This severely hinders client-side debugging.

These issues persist despite recent fix attempts and require further investigation in subsequent tasks.

## **3. Core Application Features (StockSage v2.9.A.Z)**

This section details the core features of StockSage v2.9.A.Z, serving as the Product Requirements. *(Note: Some features are currently impacted by the known issues described in Section 2.1).*

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.A.Z`).
    *   Includes a theme toggler (Light/Dark/System) using `next-themes` and ShadCN `DropdownMenu`.
*   **Footer:** Contains copyright information and a standard financial disclaimer.
*   **Theme:** Supports Light and Dark themes, configurable via the header. Theme styles are defined in `src/app/globals.css` using HSL CSS variables.
*   **Disclaimer:** Prominent financial advice disclaimer in the footer.
*   **Client-Side Debug Console:**
    *   Toggleable via a Switch on the main page (`src/app/page.tsx`).
    *   When enabled, it appears as a fixed panel at the bottom of the screen (`src/components/debug-console.tsx`).
    *   Displays client-side logs captured via a global log buffer and `console.*` interception. **(CURRENTLY BROKEN in v2.9.A.Z)**
    *   Features (intended):
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
    *   **"Analyze Stock" Button (v2.9.A.Y+ Behavior):** Initiates an automated analysis pipeline which includes:
        1.  Fetching all data from Polygon.io (Market Status, Stock Snapshot, Standard TAs, Options Chain).
        2.  Calculating AI Analyzed Technical Analysis (Pivot Points).
        *   This triggers the FSM `START_FULL_ANALYSIS` event. Each press wipes all previous analysis-related JSON data (market status, snapshot, TAs, options, all AI results *except manually triggered ones for the current session*) and starts the automated pipeline fresh. AI Chat History and Client Debug Console logs are explicitly preserved.
        *   Button shows loading spinners and is disabled while an analysis pipeline is active (`isAutomatedPipelineActive` state from FSM). **(CURRENTLY GETS STUCK in loading state in v2.9.A.Z due to FSM not transitioning to IDLE)**
    *   **New "Generate AI Key Takeaways" Button (v2.9.A.Y+ Behavior):**
        *   Manually triggers AI Key Takeaways generation.
        *   Enabled only when the main automated pipeline (`Analyze Stock`) is complete (FSM is `IDLE` or `FULL_ANALYSIS_COMPLETE`) AND prerequisite data (Snapshot, Standard TAs, AI Analyzed TA, Market Status) are valid and available in context.
        *   Disabled if its own AI process (`isPerformAiAnalysisPending`) is active or if the main pipeline is active.
    *   **New "Generate AI Options Analysis" Button (v2.9.A.Y+ Behavior):**
        *   Manually triggers AI Options Analysis.
        *   Enabled only when the main automated pipeline is complete AND prerequisite data (Snapshot, Options Chain) are valid and available in context.
        *   Disabled if its own AI process (`isPerformAiOptionsAnalysisPending`) is active or if the main pipeline is active.

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
    5.  **AI Key Takeaways Display (`src/components/ai-key-takeaways-display.tsx`):** (Populated by manual button press)
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
    7.  **AI Analyzed Options Chain Display (`src/components/ai-options-analysis-display.tsx`):** (Populated by manual button press)
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
        *   Context: The chatbot uses all available data from the `StockAnalysisContext` (Snapshot, TAs, AI TA, *manually generated* Key Takeaways & Options Analysis, Market Status) and the ongoing chat history to answer questions.
        *   Initial Message: No automatic initial summary message is generated. Chat is purely user-initiated.
        *   Formatting: AI responses use Markdown for better readability (bolding, lists, emojis). Numerical values are formatted to two decimal places, monetary values prefixed with "$".
    9.  **Market Status Display (`src/components/market-status-display.tsx`):**
        *   Displays: A table showing the status of relevant markets (e.g., "NYSE: Open", "NASDAQ: Closed"), server time (ET), and if early/late hours trading is active. Excludes Crypto/FX markets.

*   **Combined Data Export Controls:**
    *   "Export All to JSON" Button: Downloads a single JSON file containing: Stock Snapshot, Standard TAs, AI Analyzed TA, *manually generated* AI Key Takeaways, *manually generated* AI Options Analysis, Options Chain, and Market Status.
    *   "Copy All to JSON" Button: Copies the same combined data to the clipboard.
    *   These buttons are disabled if not all prerequisite data is available or if an analysis pipeline is active.

### **3.3. "Debug" Tab Features (`src/components/debug-tab-content.tsx`)**
The "Debug" tab provides developers and advanced users with raw data views and client-side log controls.

*   **Raw JSON Display Areas:**
    *   Read-only `Textarea` components, each with a "Copy JSON" button.
    *   Areas for:
        *   Polygon Adapter Input JSON.
        *   Polygon Adapter Output Summary JSON.
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
        *   Chatbot Request JSON (interactive chat only).
        *   Chatbot Response JSON (interactive chat only).
*   **Client Debug Log Source Settings (`src/components/debug-settings-card.tsx`):**
    *   A card allowing users to toggle individual client-side log sources ON/OFF.
    *   Sources correspond to `LogSourceId` from `src/lib/debug-log-types.ts`.
    *   Includes "Enable All Log Sources" and "Disable All Sources (Except Console Itself)" buttons.
    *   These settings control which logs appear in the pop-up Client Debug Console. **(CONSOLE CURRENTLY BROKEN in v2.9.A.Z)**

### **3.4. Backend Functionality & Architecture Flow**
This section details the server-side logic, data fetching, AI processing, and the overall FSM-driven architecture.

*   **Data Retrieval (Polygon.io via `@polygon.io/client-js`):**
    *   Handled by `src/services/data-sources/adapters/polygon-adapter.ts`. (No changes here for v2.9.A.Z)

*   **Genkit AI Flows (Located in `src/ai/flows/`):** (No changes to flow logic for v2.9.A.Z, but their invocation changes)
    1.  **AI Analyzed Technical Analysis (`analyze-ta-flow.ts`):** (Part of automated pipeline)
    2.  **AI Key Takeaways (`analyze-stock-data.ts`):** (Manually triggered)
    3.  **AI Options Analysis (`analyze-options-chain-flow.ts`):** (Manually triggered)
    4.  **AI Chatbot (`chat-flow.ts`):** (User-initiated)

*   **Server Action Validation (`analyze-stock-server-action.ts`):** (No changes here for v2.9.A.Z)

*   **FSM-Driven Architecture Flow (Managed by `StockAnalysisContext` and `MainTabContent` - as of v2.9.A.Y design, but with known issues in v2.9.A.Z):**
    The analysis pipeline is orchestrated by a Finite State Machine (FSM).
    1.  **Initiation (Automated Part):** User clicks "Analyze Stock". FSM event (`START_FULL_ANALYSIS`) is dispatched.
    2.  **Data Fetching & AI TA:** FSM progresses through fetching data (Polygon.io: Market Status, Stock Snapshot, Standard TAs, Options Chain) and then calculating AI Analyzed TA (Pivot Points).
    3.  **Automated Pipeline End:** After `AI_TA_SUCCEEDED` or `AI_TA_FAILED`, FSM transitions to `FULL_ANALYSIS_COMPLETE`.
    4.  **Return to Idle:** From `FULL_ANALYSIS_COMPLETE`, `MainTabContent` should detect this and dispatch `PROCEED_TO_IDLE`, which should reset the FSM to `IDLE`, re-enabling buttons. **(THIS STEP IS CURRENTLY FAILING in v2.9.A.Z, causing UI to get stuck)**
    5.  **Manual AI Triggers:**
        *   User clicks "Generate AI Key Takeaways". `MainTabContent` dispatches `TRIGGER_MANUAL_KEY_TAKEAWAYS`. FSM moves to `GENERATING_KEY_TAKEAWAYS`. After success/failure, FSM returns to `FULL_ANALYSIS_COMPLETE` (then `IDLE`).
        *   User clicks "Generate AI Options Analysis". `MainTabContent` dispatches `TRIGGER_MANUAL_OPTIONS_ANALYSIS`. FSM moves to `ANALYZING_OPTIONS`. After success/failure, FSM returns to `FULL_ANALYSIS_COMPLETE` (then `IDLE`).
    *   **Error/Skipped State Handling:** If any step fails, subsequent dependent steps' JSONs are set to appropriate "skipped" or "error" statuses.

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
(Content on `async_hooks`, client-side bundling, `'use server';` directive, Genkit syntax, and Debug Console remains relevant and CRITICAL. **The Debug Console is currently broken.**)

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9 In Progress. Current application version: v2.9.A.Z.)*

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
    *   **Task 9.9.A.V: Decouple Chat Summary & Enhance Volatility Prompt (v2.9.A.V):** Status: **COMPLETE**
    *   **Task 9.9.A.W: Fix Analyze Stock Button Stuck Loading (v2.9.A.W):** Status: **COMPLETE**
    *   **Task 9.9.A.X: Stabilize Client Console Logging (v2.9.A.X):** Status: **COMPLETE**
    *   **Task 9.9.A.Y: Rework AI Analysis Pipeline & Add Manual Triggers (v2.9.A.Y):** Status: **COMPLETE**
    *   **Task 9.9.A.Z: Attempt to Fix Stuck UI & Broken Logs (v2.9.A.Z):** - Status: **IN PROGRESS (Attempted Fixes, Critical Issues Persist - UI Loop, Console Logs Broken)**


## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                                                          |
| :------ | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ...     | ...          | ...                           | ... (Previous changelog entries up to 1.46 / v2.9.A.Y remain) ...                                                                                                                                                                                                                                           |
| 1.46    | 2025-06-15   | Firebase Studio (AI Prototyper) | **Task 9.9.A.Y (Rework AI Analysis Pipeline & Add Manual Triggers) COMPLETE.** Application version `v2.9.A.Y`. Automated pipeline shortened. Manual trigger buttons for Key Takeaways & Options Analysis added. FSM & UI updated. Header displays `v2.9.A.Y`. Phase 9 Task 9.9.A.Y status updated. **Commit: [Hash for v2.9.A.Y]** |
| 1.47    | 2025-06-15   | Firebase Studio (AI Prototyper) | **Task 9.9.A.Z (Attempt to Fix Stuck UI & Broken Logs) - ISSUES PERSIST.** Application version `v2.9.A.Z`. Attempted fixes for UI loop and broken console logs. README updated with current app state, known issues, and commit details. UI Header displays `v2.9.A.Z`. Phase 9 Task 9.9.A.Z status: IN PROGRESS. **Commit: 2c7498c4** |

## **7. Project Implementation Commit Log (StockSage App Version)**

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme.

---
... (Previous commit logs up to v2.9.A.Y remain)

---
**App Version:** `v2.9.A.Y` (Rework AI Analysis Pipeline & Add Manual Triggers)
**Tag:** `Phase-9_Task-9.A.Y_ReworkPipeline-ManualTriggers` - Commit Hash: `[Hash for v2.9.A.Y]`
**Subject:** `refactor(analysis): Shorten auto pipeline, add manual AI triggers (v2.9.A.Y)`
**Details:**
Refactored the stock analysis pipeline: "Analyze Stock" button now concludes after AI Analyzed Technical Analysis. Introduced separate buttons for "Generate AI Key Takeaways" and "Generate AI Options Analysis," enabled when prerequisites are met. Updated FSM in StockAnalysisContext and UI logic in MainTabContent to support this new flow. UI Header updated to `v2.9.A.Y`.

---
**App Version:** `v2.9.A.Z` (Attempt to Fix Stuck UI & Broken Logs - ISSUES PERSIST)
**Tag:** `Phase-9_Task-9.A.Z_AttemptFixUI-Logs` - Commit Hash: `2c7498c4`
**Subject:** `fix(app): Attempt to resolve stuck UI and broken console logs (v2.9.A.Z)`
**Details:**
This commit includes changes intended to address two critical issues:
1. Stuck UI after 'Analyze Stock': Ensured FSM transitions correctly from AI_TA_SUCCEEDED/FAILED to FULL_ANALYSIS_COMPLETE and then to IDLE. Added robust logging in MainTabContent's useEffect for PROCEED_TO_IDLE dispatch. (Note: This issue remains unresolved post-commit.)
2. Broken Client Console Logs: Re-verified and ensured simplified dependency array for console interception useEffect in StockAnalysisContext. Added extensive diagnostic logging. (Note: This issue also remains unresolved post-commit.)
UI Header updated to `v2.9.A.Z`. `README.md` updated.
---
*(Future commit logs will follow)*

