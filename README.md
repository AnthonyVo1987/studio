
### AI Coding Agent Operating Procedure Instructions
1.  Features will be staged as version '3.w.x.y.z' series. Please follow this version naming convention when I request for commits later on. Do not increment versions on your own.
    *   App Major Version: 3 (Fixed)
    *   APP Phase Version (w): Represents the overall feature phase (e.g., 1 for Initial Setup, 2 for FSM Refactor, 3 for UI Enhancements).
    *   FEAT Phase Version (x): Represents the phase within the specific feature being implemented (e.g., for FSM Refactor, Phase 1 might be 'Foundation', Phase 2 'Manual Actions Integration').
    *   FEAT Phase Task # (y): The specific task number within the feature's phase.
    *   Bug FEAT Phase Task # (z): Increment for bug fix iterations related to a specific FEAT Phase Task # (y). Starts at 0 for the initial implementation.
2.  All new features need to provide the following documentation:
    *   Generate a brand new ‘FEAT_SCOPE_xxx.md” markdown file in docs folder and it needs to contain:
        *   The ‘FEAT_SCOPE_xxx.md” markdown file needs to utilize “chain of thought” prompting techniques to guide an AI Coding Agent to implement the full feature from scoping details.
        *   FULL scoping details including complexity, value added proposition, risks assessment and potential pain points/issues.
        *   Feature Implementation Phase and Task breakdown for AI Coding Agent to implement.
        *   Add document version/changelog tracking for changes to this doc.
    *   Generate a brand new ‘FEAT_STATUS_xxx.md” markdown file in docs folder and it needs:
        *   Act a high level Feature Status Reports of the current state of the feature.
        *   Changelog details whenever a Phase, Task is complete, and commit details.
        *   Add document version/changelog tracking for changes to this doc.
    *   Note: Any new phase/task code changes/implementation needs to have the app meta data version updated as well automatically along with code changes. This will allow us automatic and dynamic tracking of the current app version while we are still testing and coding. That way, when we start testing some changes and we encounter issues, I can just provide the debug logs which will have the version meta data so it's clear what task we are on and will help to ground us.
3.  Any new phase/task code changes/implementation needs to have the app meta data version updated as well automatically along with code changes.
    *   This will allow us automatic and dynamic tracking of the current app version while we are still testing and coding.
    *   That way, when we start testing some changes and we encounter issues, I can just provide the debug logs which will have the version meta data so it's clear what task we are on and will help to ground us.
4.  **XML Output Mandate & Confirmation:** All code changes proposed by the AI Coding Agent MUST be provided exclusively in the specified XML format. The Agent will explicitly confirm its understanding and adherence to this format at the beginning of new tasks or phases.
5.  **Context Reset Confirmation:** At the beginning of new Phases or when explicitly requested, the AI Coding Agent will confirm that its internal context, stale cache, and operating state have been purged, cleared, and reset to ensure it is operating on the latest information.
6.  **Phase Completion Commits:** When a multi-task feature phase is marked as complete, a final consolidated commit log entry will be generated for documentation. This entry will use a distinct commit hash (provided by the user or a placeholder if not user-provided for meta-commits) and will summarize all tasks completed within that phase. The application version for this phase completion entry will typically reflect the version of the last task in that phase. No source code changes are made during this phase-closing documentation step; it is purely for record-keeping and updating relevant feature documents. The AI Agent will also perform a context reset after a phase completion.
###
---
**README Document Version:** 1.76
**Application Version (from `app-metadata.json`):** v3.3.4.3.0
**Last Updated:** 2025-06-25

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
*   **AI Augmented Web Search (as of v3.3):**
    *   **[Toggle] Augmented Technical Analysis:** Uses Google Search to fetch additional indicators (ATR, Bollinger Bands, etc.) and displays them in a new card. This data enriches the core AI analyses when enabled.
    *   **[Toggle] Augmented Options Flow Analysis:** Uses Google Search to fetch advanced options metrics (Max Pain, GEX, etc.) and displays them in a new card, enriching the options-related AI analyses.
*   **AI Chatbot:**
    *   Provide a contextual chatbot that can answer questions about the currently analyzed stock using all available data.
    *   **Grounding with Google Search:** A UI toggle (disabled by default) allows the user to enable Google Search grounding for the chatbot.

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
*   **Client Debug Console:** Real-time client-side log display with filtering, search, max 1000 entries, wrap indicator, and export capabilities. Exported logs include the dynamic application version and a snapshot of the global FSM (state, flags, and variables).
*   **Startup Log Toggle:** User-configurable setting in Debug Settings Card to reduce log verbosity during initial application startup. Logic ensures this only affects the *first* pipeline run, determined by the FSM's `isInitialLoad` variable.
*   **UI/Render Log Spam Toggle:** A user-configurable setting (disabled by default) to control high-frequency logs from UI components related to re-renders and prop changes.
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
    *   **Architectural Mandate:** Dynamic Thinking (`thinkingBudget: -1`) is enforced by default on all AI prompts for analysis and chat.
    *   Safety settings are defined in these JSONs.
    *   Prompt definition functions in flow files cache the `ai.definePrompt` object to prevent re-definition warnings and improve performance.
    *   **Grounding with Google Search:** The chat flow conditionally enables grounding by adding `{ googleSearch: {} }` to the `tools` array in the prompt definition. It also correctly omits the `output` schema when grounding is active, as this is an API requirement.
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
    *   Fetched data JSON strings.
    *   **Single, Enhanced Global Finite State Machine (FSM):** Manages all primary application states, contextual flags (e.g., `isSnapshotDataReady`, `isManualKeyTakeawaysActionPossible`), and key context variables (e.g., `activeTicker`, `isInitialLoad`, `userInputTicker`). Orchestrates the entire application lifecycle, including the "AI Full Stock Analysis" macro.
    *   Client-side debug logging and its configuration (e.g., `isUiRenderLoggingEnabled`).
    *   Chat history and the `useActionState` hook for the chat server action, ensuring state persistence across UI changes.
*   **`useReducer` (in `StockAnalysisContext`):** Manages the single global FSM's state transitions.

#### 3.2.5. FSM (Finite State Machines) - (Reflecting v3.3.3.1.0)
*   **Single Global Application FSM:** The architectural refactor is **COMPLETE**. The application now exclusively uses a single, centralized FSM within `StockAnalysisContext`.
*   **Lifecycle Management:** This FSM orchestrates all application pipelines:
    *   The standard automated analysis (data fetch + base AI TA).
    *   The new customizable analysis pipeline, which conditionally triggers on-demand AI actions (Key Takeaways, Options Analysis) and chat prompts based on user-selected toggles.
*   **Deprecated FSMs:** Local FSMs previously in `MainTabContent`, `ChatbotFsmContext`, and `DebugConsoleFsmContext` have been removed, and their logic has been fully absorbed by the global FSM.

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
    *   **Startup Logging Control:** `isReducedStartupLoggingEnabled` toggle works in conjunction with the FSM's `isInitialLoad` variable.
    *   **UI/Render Log Spam Control:** A dedicated `isUiRenderLoggingEnabled` toggle (disabled by default) suppresses high-frequency logs from UI components related to re-renders and prop changes.
*   **Server-Side Logging:** `console.log`, etc., with standardized prefixes.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   Displays client-side logs (up to 1000 entries). Features filtering, search, wrap indicator.
    *   Export/Copy: Logs include dynamic `appVersion` and FSM snapshot.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules & Policies
*   Use `logDebug` for client-side. No commented-out code. JSDoc for overviews. No `package.json` comments.
*   **`app-metadata.json`:** `lastUpdatedTimestamp` is optional. If present, must be valid ISO 8601.
*   **Current Feature Focus (as of v3.3.4.3.0):**
    *   **"Customizable Analysis & AI Augmented Web Search" (v3.3.x.y.z):** IN PROGRESS. Phase 1, 2, and 3 are complete. Phase 4 is in progress.

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
*   **Documentation Updates:** `CHANGELOG.md`, this `README.md`, and feature-specific `FEAT_SCOPE_xxx.md`, `FEAT_STATUS_xxx.md` updated.

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
*   **This README Document Version:** 1.76
*   **Current Application Version:** `v3.3.4.3.0`
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **Changelogs:**
    *   For v3.0.0.0 onwards: Refer to `CHANGELOG_3.0.md`.
    *   For pre-v3.0.0.0 history: Refer to `CHANGELOG.md`.

---
