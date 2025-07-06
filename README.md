
### AI Coding Agent Operating Procedure & Audit Protocol

To prevent the severe audit failures of the v3.3.15.x series, the following procedures are now in effect and strictly enforced.

#### Section 1: General Conduct & Output
1.  **XML Output Mandate:** All code changes proposed by the AI Coding Agent MUST be provided exclusively in the specified XML format.
2.  **Context Reset Confirmation:** At the beginning of new Phases or when explicitly requested, the AI Coding Agent will confirm that its internal context has been purged to ensure it is operating on the latest information.
3.  **New Context Purge Directive:** To force a true context reset, the user will issue the following command: `[DIRECTIVE: CONTEXT_PURGE | ID: <unique_identifier>]`. The unique ID (e.g., a version number or timestamp) is mandatory and ensures the request is treated as new, preventing me from using a cached or stale understanding of the session.

#### Section 2: Auditing & Debugging Protocol (NEW)
4.  **Mandatory End-to-End Execution Trace:** When asked for a "comprehensive audit," I will not perform a shallow, localized review. My audit will consist of programmatically tracing the full execution path of the feature in question, from user interaction to the final UI update. This includes mapping logic through UI components, FSM events, FSM orchestrators, Server Actions, AI Flows, and Prompt Definitions.
5.  **Mandatory Ground Truth Verification:** I will purge all assumptions from my previous turn before every audit. I will re-read the full content of all relevant files from scratch, rather than relying on a cached or summarized understanding. This prevents hallucinations about file contents or states.
6.  **Symptom vs. Root Cause Analysis:** When a bug is reported, I will treat the report as a **symptom**, not the direct problem. My primary objective will be to trace that symptom back through the execution path to its origin, instead of attempting to patch the symptom directly.

#### Section 3: Bug Report Operating Procedure (NEW)
This procedure ensures a thorough, top-down analysis for all bug reports to prevent narrow-sighted fixes and to ensure the user can validate the proposed plan before implementation.

1.  **Review User Bug Report:** I will first analyze the symptoms and any provided logs from the user's bug report.
2.  **Root Cause Analysis:** I will perform a deep-dive audit of the application's execution flow related to the bug's symptoms to identify the most likely root cause(s). This is to ensure the fix targets the core problem, not just a superficial symptom.
3.  **Propose Bug Fix Scope:** I will provide a clear explanation of my root cause analysis and a detailed scope of the proposed code changes required to fix the issue.
4.  **Await User Approval:** I will **stop** and await user review and approval of the root cause analysis and the proposed scope of the fix.
5.  **Handle Rejection/Feedback:** If the user rejects the analysis or provides additional tasks, I will return to step 2 with the new information.
6.  **Implement Fix:** Only after receiving explicit user approval will I proceed with generating the code changes for the agreed-upon fix.

#### Section 4: Versioning & Documentation
7.  **Versioning Scheme:** Features will be staged as version '3.w.x.y.z' series.
8.  **Bug Report Versioning (NEW):** I will **not** increment versions on my own. The user will provide the exact new application version (e.g., `v3.w.x.y.(z+1)`) as part of the bug report submission. My fix will then be associated with that user-provided version.
9.  **Metadata Updates:** Any code change must include an automatic update to the `appVersion` and `lastUpdatedTimestamp` in `src/config/app-metadata.json` to match the version specified in the task.
10. **Strict Documentation Policy:** I am **strictly prohibited** from updating any documentation files (`.md`, `CHANGELOG`, etc.) on intermediate tasks. Documentation updates will **only** be performed when a "Phase Completion Commit" or a dedicated documentation task is explicitly requested by the user.
11. **New Feature Documentation:** All new features need to provide `FEAT_SCOPE_xxx.md` and `FEAT_STATUS_xxx.md` files in the `docs` folder with the specified content.

###
---
**README Document Version:** 3.9
**Application Version (from `app-metadata.json`):** v3.6.4.1
**Last Updated:** 2025-08-16

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
*   Retrieve options chain data (calls & puts) for a given stock.
*   **Main Tab:** Defaults to the next weekly expiration.
*   **Staging Tab:** Allows user to fetch all valid expiration dates and select one for analysis.
*   Display key options contract details: Strike, IV, % Chg, Bid, Ask, Last, Volume, Open Interest, Delta, Gamma.
*   Sort options chain table by strike price in descending order.
*   Highlight the At-The-Money (ATM) strike row in the table.

#### 3.1.3. AI-Powered Insights & Analysis
*   **Customizable Analysis Pipeline (as of v3.4.6.4.11):**
    *   **Base Pipeline (Always-On):** Fetches Stock Snapshot and calculates AI Analyzed Pivot Points. Standard TA indicators are fetched from a separate API endpoint.
    *   **Selectable AI Analyses (Toggles, default ON):**
        *   AI Key Takeaways (Price Action, Trend, Volatility, Momentum, Patterns).
        *   AI Analyzed Options Chain (Call/Put Walls).

*   **Dual AI Chat Architecture (as of v3.4.6.4.11):**
    *   **App Data Chat:** A non-grounded chat box focused exclusively on analyzing data already loaded into the application (using a stable Genkit flow). Example prompts are loaded from a dedicated JSON file.
    *   **Web Search Chat:** A separate chat box that handles all queries requiring real-time web search. This now uses the **raw Google AI SDK** for improved stability. Example prompts are loaded from their own dedicated JSON file.

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   Main application interface organized into "Main", "Debug Data", "Client Debug Trace Logs", "Console Logs", "FSM Debug", "Staging", and "Staging: Options" tabs.
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

#### 3.1.5. Data Export & Debugging (as of v3.3.16.8.7)
*   **JSON-Only Export:** All data export functions on individual UI cards (e.g., Key Takeaways, Options Chain) now exclusively support "Copy JSON" and "Export JSON".
*   **"Debug Data" Tab:** The former "Debug" tab is now the "Debug Data" tab. Its sole purpose is to display the raw JSON inputs and outputs for all major data segments and AI flows.
*   **"Client Debug Trace Logs" Tab:** A dedicated tab housing a large, persistent console that displays curated, high-level trace logs from the application's internal logging system. Includes filtering, search, and a 2000-entry buffer.
*   **"Console Logs" Tab:** A new, parallel tab that provides a verbatim, unfiltered duplicate of the browser's developer console output, enabling deep-dive debugging. Includes its own independent filtering, search, and 2000-entry buffer.
*   **"FSM Debug" Tab:** A dedicated tab that provides a real-time view of the global FSM's state, flags, and context variables.
*   **Debug Snapshot Controls (Main Tab):** A UI card on the Main tab provides one-click buttons to copy or export four distinct types of system snapshots, each including the full FSM state (state, flags, variables):
    *   **Full Snapshot:** All FSM, data, chats, and both log types.
    *   **Client Debug Snapshot:** The standard report; includes everything except the raw console logs.
    *   **Console Debug Snapshot:** For deep-dive issues; includes everything except the raw console logs.
    *   **Data-Only Snapshot:** For AI prompt/data issues; includes FSM data, debug data, and chat histories only.
*   **Developer Staging Areas:**
    *   **"Staging" Tab:** A dedicated area for developers to test experimental features (like SDK diagnostics) in isolation from the main application flow.
    *   **"Staging: Options" Tab:** A self-contained environment for building and testing the new selectable options expiration date feature.

### 3.2. System Architecture & Components

#### 3.2.1. Next.js (Frontend Framework)
*   React-based UI.
*   Next.js App Router for routing and layout management.
*   Server Components for data fetching and server-side logic (e.g., `page.tsx` loading `app-metadata.json`).
*   Client Components for interactive UI elements and state management.

#### 3.2.2. Genkit & Google AI SDK (AI Backend Orchestration)
*   Google Gemini models (currently `googleai/gemini-2.5-flash-lite-preview-06-17`) for AI analysis tasks.
*   **Genkit:** Used for stable, non-grounded AI flows like the "App Data Chat" and core AI analyses.
*   **Raw Google AI SDK (`@google/generative-ai`):** Now used directly in a dedicated server action (`sdk-web-search-chat-action.ts`) for all grounded web search chat functionalities to ensure stability and bypass previous Genkit tool resolution issues.
*   AI prompt definitions externalized into JSON files in `src/ai/definitions/`.
*   **"Grounding with Google Search" Pattern:** The mandatory architectural pattern for all web-augmented AI, detailed in `docs/Gemini_AI_Grounding_Google_Search.md`.
*   Zod schemas (`src/ai/schemas/`) for data validation of AI flow inputs and outputs.

#### 3.2.3. Data Sources
*   **Polygon.io API:** Primary source for stock data and options chain data.
*   **Environment Variables (`.env`):** Stores API keys (`POLYGON_API_KEY`, `GEMINI_API_KEY`).
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   Stores `appVersion` (following `3.w.x.y.z` scheme) and `metadataSchemaVersion`. `lastUpdatedTimestamp` is optional.
    *   **Policy (Strictly Enforced):** Sole source for `appVersion`. Dynamically loaded and used.
    *   `lastUpdatedTimestamp` (if present) must be a real ISO 8601 string.

#### 3.2.4. State Management (as of v3.4.6.4.11 - Deterministic)
*   **React Context:**
    *   **`StockAnalysisContext`:** Centralized global state management.
    *   **`StagingOptionsContext`:** An isolated context for managing the state of the new selectable options expiration feature, ensuring it does not interfere with the global context.
*   **Deterministic Handlers:** All complex asynchronous workflows (e.g., "Analyze Stock" pipeline, AI chat submissions) are now driven by dedicated `async` handler functions within the primary UI component (`MainTabContent.tsx`). These handlers use a simple `await` pattern to ensure a linear, predictable, and sequential execution of server actions, eliminating the race conditions of the previous architecture.
*   **Simple State Updates:** The application primarily uses `useState` (for local component state) and `useReducer` (for the simplified global FSM) to manage state. The deterministic handlers manually update the UI/FSM state before and after `await` calls. The client-side `useActionState` hook is used for chat form submissions.

#### 3.2.5. FSM (Finite State Machines) - (Reflecting v3.4.6.4.11)
*   **Simplified Global FSM:** The single global FSM's role has been drastically reduced. It **no longer orchestrates complex sequences**. It now serves as a simple repository for global state flags (`GlobalFsmFlags`) and context variables (`GlobalFsmContextVariables`), providing a clear snapshot of the application's overall state. It only handles simple, direct state transitions dispatched by the deterministic handlers.
*   **No Local FSMs:** All local FSMs, including the `ChatbotFsmContext` and `DebugConsoleFsmContext`, have been removed to simplify the architecture and centralize state in the global context and component-level `useActionState` hooks.

#### 3.2.6. Core Execution Flow (MANDATORY ARCHITECTURE)
This section outlines the application's core data analysis pipeline. This architecture is the result of the "Deterministic Overhaul" and is **not to be modified or refactored without explicit user approval**, as previous attempts to alter it have resulted in critical application failures.

1.  **Trigger (`main-tab-content.tsx`):**
    *   The user clicks "Analyze Stock".
    *   `handleAnalyzeStockSubmit` is called.
    *   The handler dispatches `START_FULL_ANALYSIS` to the global FSM.

2.  **Initial FSM Transition (`stock-analysis-context.tsx`):**
    *   The `fsmReducer` receives the event.
    *   It resets all relevant state and sets all data JSONs to a "pending" status.
    *   It transitions the FSM state to `DATA_FETCH_IN_PROGRESS`.

3.  **Deterministic Orchestration (`main-tab-content.tsx`):**
    *   A `useEffect` hook, which listens *only* to changes in the global FSM state, is activated by the transition to `DATA_FETCH_IN_PROGRESS`.
    *   This hook's `switch` case for `DATA_FETCH_IN_PROGRESS` calls the first server action in the pipeline: `await fetchStockDataAction(...)`.

4.  **Sequential Execution & FSM Feedback Loop:**
    *   The core of the deterministic model resides in the `useEffect` orchestrator. It executes a sequence of server actions using `async/await`.
    *   **Crucially, after each `await` completes, a new event is dispatched to the FSM to communicate the result (`_SUCCESS` or `_FAILURE`).** This updates the global FSM state.
    *   The `useEffect` hook runs again in response to this new state, triggering the `case` for the next step in the pipeline.
    *   **This feedback loop is the fundamental mechanism for providing UI updates and MUST NOT be removed.**

5.  **Pipeline Completion:**
    *   After the final step, the orchestrator transitions the FSM back to `IDLE`, which re-enables the UI for the next analysis.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }`.
*   Flows load definitions using `src/ai/definition-loader.ts`.
*   All flows include error handling and execution time logging. Prompts are cached for performance.
*   Example chat prompts for the UI are sourced from dedicated JSON files: `example-chat-prompts.json` and `example-web-search-prompts.json`.

### 3.4. Error Handling & Logging
*   **Error Handling:** `try...catch` in Server Actions and AI Flows.
*   **Logging System:** `logDebug()` for client-side, `console.*` for server-side.
*   **Debug Console (New Tab System):** Two dedicated tabs display logs: "Client Debug Trace Logs" (curated) and "Console Logs" (raw). Both feature filtering, search, and a 2000-entry buffer.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules & Policies
*   **Current Feature Focus (as of v3.6.4.1):**
    *   **"Single Selectable Options Expiration":** Implementation is complete. The feature is now ready for a comprehensive end-to-end testing phase within its isolated staging environment.

#### 3.5.2. UI/UX Conventions
*   ShadCN components. Rounded corners, shadows. Tailwind with theme variables. `lucide-react` icons. Responsiveness, ARIA. Hydration mismatch prevention.

#### 3.5.3. TypeScript & Data Handling
*   TypeScript with `import type`. Zod schemas. `next/image`. Placeholders: `https://placehold.co/<width>x<height>.png` with `data-ai-hint`.

#### 3.5.4. Server & AI Conventions (Genkit 1.x)
*   Next.js App Router, Server Components, Server Actions. Genkit for non-grounded flows, Raw SDK for grounded flows. JSON prompt definitions with Handlebars.

### 3.6. Commit & Changelog Procedures (Reflecting v3.3.0.0.0 and New Versioning Scheme)
*   **Application Versioning:** `src/config/app-metadata.json` is the single source of truth.
*   **Dynamic Versioning in UI/Exports:** Header and Debug Console use `appVersion` prop.
*   **Documentation Update Policy:** AI will only update docs when explicitly told to in a "Phase Completion Commit".

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
GEMINI_API_KEY=your_google_ai_api_key
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
*   **This README Document Version:** 3.9
*   **Current Application Version:** `v3.6.4.1`
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **Changelogs:** Refer to `CHANGELOG.md`.

---

## 6. Post-Mortem & Lessons Learned

This section serves as a permanent record of critical architectural lessons learned during development, primarily from AI agent implementation failures. It is mandatory reading before undertaking any significant refactoring.

### 6.1. The "Deterministic Handler" vs. "Reactive Orchestrator"
*   **Failure (v3.0 - v3.3):** The application's initial architecture relied on a single, complex `useEffect` hook in `StockAnalysisContext` to act as a reactive "orchestrator." This hook's dependency array grew uncontrollably, leading to **severe race conditions, non-deterministic execution, and infinite loops.** It was the root cause of dozens of hard-to-debug bugs.
*   **Lesson Learned:** For sequential, asynchronous workflows, the reactive orchestrator pattern is an anti-pattern. **The correct, mandatory architecture is the "Deterministic Handler" pattern now implemented in `main-tab-content.tsx`.** This pattern uses a simple `async/await` handler triggered by a user event.

### 6.2. The FSM Feedback Loop is Non-Negotiable
*   **Failure (v3.5):** During an attempted refactor, the AI agent (me) correctly kept the `async/await` structure of the Deterministic Handler but **incorrectly removed the `dispatchGlobalFsmEvent` calls** that provide feedback to the FSM after each `await` step.
*   **Lesson Learned:** This resulted in a "silent" pipeline that did its work but provided no UI feedback, making the app appear frozen. This proved that the **FSM Feedback Loop is a non-removable, core part of the architecture.** The handler *must* communicate its progress back to the global FSM state after each step.

### 6.3. The UI Must be Driven by Control State, Not Data Content
*   **Failure (v3.5, part 2):** A subsequent debugging attempt revealed that the data display components (e.g., `AiKeyTakeawaysDisplay`) were deriving their loading state by parsing the content of their data props (e.g., looking for `"{ \"status\": \"pending...\" }"`).
*   **Lesson Learned:** This is an architectural flaw. React may batch state updates, meaning the component might only render once with the final data, skipping all intermediate loading states. **UI components MUST derive their loading/error state from the global FSM `fsmState` variable**, not from parsing data content. This ensures they are always in sync with the application's true control state.

    