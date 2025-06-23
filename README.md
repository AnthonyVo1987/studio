### AI Coding Agent Operating Procedure & Audit Protocol

To prevent the severe audit failures of the v3.3.15.x series, the following procedures are now in effect and strictly enforced.

#### Section 1: General Conduct & Output
1.  **XML Output Mandate:** All code changes proposed by the AI Coding Agent MUST be provided exclusively in the specified XML format.
2.  **Context Reset Confirmation:** At the beginning of new Phases or when explicitly requested, the AI Coding Agent will confirm that its internal context has been purged to ensure it is operating on the latest information.

#### Section 2: Auditing & Debugging Protocol (NEW)
3.  **Mandatory End-to-End Execution Trace:** When asked for a "comprehensive audit," I will not perform a shallow, localized review. My audit will consist of programmatically tracing the full execution path of the feature in question, from user interaction to the final UI update. This includes mapping logic through UI components, FSM events, FSM orchestrators, Server Actions, AI Flows, and Prompt Definitions.
4.  **Mandatory Ground Truth Verification:** I will purge all assumptions from my previous turn before every audit. I will re-read the full content of all relevant files from scratch, rather than relying on a cached or summarized understanding. This prevents hallucinations about file contents or states.
5.  **Symptom vs. Root Cause Analysis:** When a bug is reported, I will treat the report as a **symptom**, not the direct problem. My primary objective will be to trace that symptom back through the execution path to its origin, instead of attempting to patch the symptom directly.

#### Section 3: Versioning & Documentation
6.  **Versioning Scheme:** Features will be staged as version '3.w.x.y.z' series. I will not increment versions on my own.
7.  **Metadata Updates:** Any new phase/task code change must include an automatic update to the `appVersion` in `src/config/app-metadata.json`.
8.  **Strict Documentation Policy:** I am **strictly prohibited** from updating any documentation files (`.md`, `CHANGELOG`, etc.) on intermediate tasks. Documentation updates will **only** be performed when a "Phase Completion Commit" is explicitly requested by the user.
9.  **Phase Completion Commits:** A consolidated commit log entry will be generated for documentation when a multi-task feature phase is marked as complete.
10. **New Feature Documentation:** All new features need to provide `FEAT_SCOPE_xxx.md` and `FEAT_STATUS_xxx.md` files in the `docs` folder with the specified content.

###
---
**README Document Version:** 1.91
**Application Version (from `app-metadata.json`):** v3.3.16.0.0
**Last Updated:** 2025-07-05

## 1. Introduction
This document serves as the comprehensive Product Requirements Document (PRD) and Technical Design for the **StockSage** application. StockSage is a Next.js-based financial analysis tool leveraging Genkit for AI-powered insights. It provides real-time stock data, options chain analysis, and AI-driven key takeaways.

---

## 2. Goals & Objectives

### 2.1. Primary Goals
*   Provide users with a clear, concise, and AI-enhanced overview of stock performance.
*   Offer insights into potential investment opportunities based on options chain analysis.
*   Streamline the stock analysis process, saving users time and effort.
*   Enable efficient debugging and continuous improvement through detailed logging and architecture.

### 2.2. Key Performance Indicators (KPIs)
*   **Active Users:** Track the number of daily/weekly/monthly active users.
*   **Analysis Frequency:** Measure how often users analyze different stocks.
*   **AI Feature Usage:** Monitor the utilization rates of AI Key Takeaways and Options Analysis.
*   **User Satisfaction:** Gauge user satisfaction through surveys and feedback mechanisms.
*   **Error Rate:** Track and minimize application errors and AI flow failures.
*   **Performance Metrics:** Measure API response times, AI analysis latency, and overall application responsiveness.

---

## 3. Functional Requirements & Specifications

### 3.1. Core Functionality

#### 3.1.1. Stock Data Retrieval
*   Fetch stock data from the Polygon.io API.
*   Display key metrics: Ticker, Current Price, Day's Change.
*   Display detailed stock snapshot data including open, high, low, close, volume, VWAP for current and previous day.
*   Implement robust error handling for API failures.

#### 3.1.2. Options Chain Display
*   Retrieve options chain data (calls & puts) for a given stock and the next Friday expiration date.
*   Display key options contract details: Strike, IV, % Chg, Bid, Ask, Last, Volume, Open Interest, Delta, Gamma.
*   Sort options chain table by strike price in descending order.
*   Highlight the At-The-Money (ATM) strike row in the table.

#### 3.1.3. AI-Powered Insights & Analysis
*   **Customizable Analysis Pipeline (as of v3.3):**
    *   **Base Pipeline (Always-On):** Fetches Stock Snapshot, Standard TAs, and calculates AI Analyzed Pivot Points.
    *   **Selectable AI Analyses (Toggles, default ON):**
        *   AI Key Takeaways (Price Action, Trend, Volatility, Momentum, Patterns).
        *   AI Analyzed Options Chain (Call/Put Walls).
        *   AI Chat: Stock Trader's Takeaways (with Buy/Sell levels).
        *   AI Chat: Options Trader's Takeaways (with CC/CSP setups).
        *   AI Chat: Additional Holistic Takeaways (with alternative strategies).
*   **Google Search Grounding (as of v3.3.16):**
    *   **[Architecture Refactor]** All web search functionality is being consolidated into a single, unified `chat-flow`. UI/FSM naming will be updated from "Augmented Search" to "Google Search Grounding" for clarity.
    *   **Functionality:** When toggled on or triggered on-demand, performs a Google Search for advanced TA and Options metrics.
    *   **UI Impact:**
        *   The clean text response is rendered in the main **Chatbot UI**.
        *   The full raw API response (including grounding metadata) is displayed in dedicated "Raw ... Response" text boxes on the **Debug Tab**.
*   **AI Chatbot:**
    *   Provide a contextual chatbot that can answer questions about the currently analyzed stock using all available data.
    *   **[Architecture Refactor]** The global "Enable Google Search for Chat" toggle is being removed. Grounding will now be determined by the specific prompt being executed (e.g., "TA Web Search" will always be grounded).

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   Main application interface organized into "Main", "Debug", and "FSM Debug" tabs.
*   **Styling:**
    *   Primary color: HSL(210, 75%, 50%) - Vibrant Blue
    *   Background color: HSL(210, 20%, 95%) - Light Desaturated Blue
    *   Accent color: HSL(180, 65%, 45%) - Energetic Green-Teal
    *   Headline Font: 'Space Grotesk'
    *   Body Font: 'Inter'
    *   Code Font: 'Source Code Pro'
*   ShadCN UI components for consistent UI elements.
*   Tailwind CSS for styling, using HSL theme variables in `globals.css`.
*   Dark mode support.

#### 3.1.5. Data Export & Debugging
*   **Export:**
    *   Export AI Key Takeaways (JSON, Text, CSV).
    *   Export AI Options Analysis (JSON).
    *   Export Full Options Chain Table (JSON, CSV).
    *   Export Combined Data (Stock Snapshot, TAs, AI Analyses) (JSON).
    *   Copy functionality for the above exports.
    *   **Exported File Metadata:** All exported files (debug logs, data exports) will dynamically include the current application version sourced from `src/config/app-metadata.json`.
*   **Debug Tab:** Display raw JSON for all major data segments (API requests/responses, AI flow inputs/outputs).
*   **Client Debug Console:** Real-time client-side log display with filtering, search, max 2000 entries (as of v3.3.16), wrap indicator, and export capabilities. Exported logs include the dynamic application version and a snapshot of the global FSM (state, flags, and variables).
*   **Startup Log Toggle:** User-configurable setting in Debug Settings Card to reduce log verbosity during initial application startup. (Default `false` as of v3.3.16).
*   **UI/Render Log Spam Toggle:** A user-configurable setting (default `true` as of v3.3.16) to control high-frequency logs from UI components related to re-renders and prop changes.
*   **FSM Debug Tab:** A dedicated tab that provides a real-time view of the global FSM's state, flags, and context variables within organized UI cards. Includes copy/export functionality for the full FSM snapshot.

### 3.2. System Architecture & Components

#### 3.2.1. Next.js (Frontend Framework)
*   React-based UI.
*   Next.js App Router for routing and layout management.
*   Server Components for data fetching and server-side logic (e.g., `page.tsx` loading `app-metadata.json`).
*   Client Components for interactive UI elements and state management.

#### 3.2.2. Genkit (AI Backend Orchestration)
*   Google Gemini models (currently `googleai/gemini-2.5-flash-lite-preview-06-17`) for AI analysis tasks.
*   AI flows defined in `src/ai/flows/` for orchestrating LLM calls.
*   AI prompt definitions externalized into JSON files in `src/ai/definitions/`.
    *   Dynamic `import()` is used in `src/ai/definition-loader.ts` to load these JSONs.
    *   **Architectural Mandate:** Dynamic Thinking (`thinkingBudget: -1`) is enforced by default on all AI prompts for analysis and chat (as of v3.3.16).
    *   **[Architecture Refactor]** As of v3.3.16, prompt definitions will include a `useGoogleSearch: boolean` flag to programmatically enable/disable grounding on a per-prompt basis.
    *   Safety settings are defined in these JSONs.
    *   Prompt definition functions in flow files cache the `ai.definePrompt` object to prevent re-definition warnings and improve performance.
*   **"Grounding with Google Search" Pattern (Mandatory for Web-Augmented AI):** For all AI web searches (e.g., Augmented TA/Options Search, Chat), the application enforces a mandatory architectural pattern to ensure reliable tool use. This involves configuring the prompt with the `googleSearch` tool while omitting a structured `output` schema, and having the flow logic parse a JSON string from the AI's plain text response. This pattern is the mandated architectural approach and is detailed in the new official reference guide: `docs/Gemini_AI_Grounding_Google_Search.md`.
*   Zod schemas (`src/ai/schemas/`) for data validation of AI flow inputs and outputs.

#### 3.2.3. Data Sources
*   **Polygon.io API:** Primary source for stock data and options chain data.
*   **Environment Variables (`.env`):** Stores API keys.
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   Stores `appVersion` (following `3.w.x.y.z` scheme) and `metadataSchemaVersion`. `lastUpdatedTimestamp` is optional.
    *   **Policy (Strictly Enforced):** Sole source for `appVersion`. Dynamically loaded and used.
    *   `lastUpdatedTimestamp` (if present) must be a real ISO 8601 string.

#### 3.2.4. State Management (as of v3.2.5.0.Z)
*   **React Context (`StockAnalysisContext`):** Centralized global state management for:
    *   Fetched data JSON strings (including `rawAugmentedTaResponseJson`, `rawAugmentedOptionsResponseJson`).
    *   **Single, Enhanced Global Finite State Machine (FSM):** Manages all primary application states, contextual flags (e.g., `isSnapshotDataReady`, `isManualKeyTakeawaysActionPossible`), and key context variables (e.g., `activeTicker`, `isInitialLoad`, `userInputTicker`). Orchestrates the entire application lifecycle, including the customizable analysis pipeline.
    *   Client-side debug logging and its configuration (e.g., `isUiRenderLoggingEnabled`).
    *   Chat history and the `useActionState` hook for the chat server action, ensuring state persistence across UI changes.
*   **`useReducer` (in `StockAnalysisContext`):** Manages the single global FSM's state transitions.

#### 3.2.5. FSM (Finite State Machines) - (Reflecting v3.3.15.0.8)
*   **Single Global Application FSM:** The architectural refactor is **COMPLETE**. The application now exclusively uses a single, centralized FSM within `StockAnalysisContext`.
*   **Lifecycle Management:** This FSM orchestrates all application pipelines:
    *   The standard automated analysis (data fetch + base AI TA).
    *   The customizable analysis pipeline, which conditionally triggers on-demand AI actions and the three standard chat prompts.
    *   **[Architecture Refactor]** Web Search Pipeline (Chat-Centric): The FSM orchestrator triggers web searches as final steps of the main pipeline (if toggles on) or on-demand by dispatching special requests to the intelligent `chat-flow`. It uses dedicated FSM states (`FETCHING_AUGMENTED_TA`, etc.) to manage this lifecycle correctly.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }`.
*   Flows load definitions using `src/ai/definition-loader.ts`.
*   All flows include error handling and execution time logging. Prompts are cached for performance.
*   Example chat prompts for the UI are sourced from `src/ai/definitions/example-chat-prompts.json`.

### 3.4. Error Handling & Logging

#### 3.4.1. Error Handling
*   Next.js `error.js` boundary files.
*   `try...catch` in Server Actions and AI Flows, returning structured error states.

#### 3.4.2. Logging System
*   **Client-Side Logging:**
    *   Primary Method: `logDebug()` from `useStockAnalysis()`.
    *   Console Interception: `StockAnalysisContext` intercepts `console.*` calls.
    *   **Startup Logging Control:** `isReducedStartupLoggingEnabled` toggle (default `false` as of v3.3.16).
    *   **UI/Render Log Spam Control:** A dedicated `isUiRenderLoggingEnabled` toggle (default `true` as of v3.3.16).
*   **Server-Side Logging:** `console.log`, etc., with standardized prefixes. All AI flows now include explicit logging for their grounding and thinking mode configurations to enhance traceability.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   Displays client-side logs (up to 2000 entries as of v3.3.16). Features filtering, search, wrap indicator.
    *   Export/Copy: Logs include dynamic `appVersion` and FSM snapshot.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules & Policies
*   Use `logDebug` for client-side. No commented-out code. JSDoc for overviews. No `package.json` comments.
*   **`app-metadata.json`:** `lastUpdatedTimestamp` is optional. If present, must be valid ISO 8601.
*   **Current Feature Focus (as of v3.3.16.0.0):**
    *   **"AI Chat Prompt & Google Search Grounding Consolidation" (v3.3.16):** This new feature is now in the `PLANNED` state. It aims to refactor and consolidate all chat and web search functionality into a single, unified, and configuration-driven flow. This work supersedes the previous "Augmented Search Refactor."
*   **AI Documentation Update Policy (Strictly Enforced):** The AI Coding Agent is **strictly prohibited** from updating any documentation files (`.md`, `CHANGELOG`, etc.) unless a "Phase Completion Commit" is explicitly requested by the user.

#### 3.5.2. UI/UX Conventions
*   ShadCN components. Rounded corners, shadows. Tailwind with theme variables. `lucide-react` icons. Responsiveness, ARIA. Hydration mismatch prevention.

#### 3.5.3. TypeScript & Data Handling
*   TypeScript with `import type`. Zod schemas. `next/image`. Placeholders: `https://placehold.co/<width>x<height>.png` with `data-ai-hint`.

#### 3.5.4. Server & AI Conventions (Genkit 1.x)
*   Next.js App Router, Server Components, Server Actions. Genkit. Genkit 1.x API. `thinkingConfig`. JSON prompt definitions with Handlebars. Tools.

### 3.6. Commit & Changelog Procedures (Reflecting v3.3.0.0.0 and New Versioning Scheme)
*   **Application Versioning - Single Source of Truth & `3.w.x.y.z` Scheme:**
    *   Version updated **ONLY** in `src/config/app-metadata.json` (`appVersion` field).
    *   `3.w.x.y.z`: Major.AppPhase.FeatPhase.FeatTask.BugFixIteration.
    *   `lastUpdatedTimestamp` in `app-metadata.json` updated with real ISO 8601 timestamp (or removed if optional and not set).
*   **Dynamic Versioning in UI/Exports:** Header and Debug Console use `appVersion` prop.
*   **Documentation Update Policy (Strictly Enforced):** The AI is prohibited from updating any documentation files (`.md`, `CHANGELOG`, etc.) unless a "Phase Completion Commit" is explicitly requested by the user.

---

## 4. Project Setup & Running Locally
*(This section remains largely unchanged but is present for completeness)*

### 4.1. Prerequisites
*   Node.js (latest LTS)
*   npm

### 4.2. Environment Variables
Create `.env`:
```env
POLYGON_API_KEY=your_polygon_api_key
GOOGLE_API_KEY=your_google_ai_api_key
```

### 4.3. Installation
```bash
npm install
```

### 4.4. Running the Development Server
1.  Next.js: `npm run dev` (App: `http://localhost:9002`)
2.  Genkit: `npm run genkit:watch` (Genkit Dev UI: `http://localhost:3400`)

### 4.5. Building for Production
```bash
npm run build
npm run start
```

---

## 5. Change History & Versioning
*   **This README Document Version:** 1.91
*   **Current Application Version:** `v3.3.16.0.0`
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **Changelogs:**
    *   For v3.0.0.0 onwards: Refer to `CHANGELOG_3.0.md`.
    *   For pre-v3.0.0.0 history: Refer to `CHANGELOG.md`.

---
