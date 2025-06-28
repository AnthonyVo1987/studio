
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
**README Document Version:** 3.4
**Application Version (from `app-metadata.json`):** v3.3.16.8.7
**Last Updated:** 2025-08-03

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
*   **Customizable Analysis Pipeline (as of v3.3.16.7.50):**
    *   **Base Pipeline (Always-On):** Fetches Stock Snapshot, Standard TAs, and calculates AI Analyzed Pivot Points.
    *   **Selectable AI Analyses (Toggles, default ON):**
        *   AI Key Takeaways (Price Action, Trend, Volatility, Momentum, Patterns).
        *   AI Analyzed Options Chain (Call/Put Walls).
    *   **[REMOVED FROM PIPELINE]** All AI Chat prompts are now manual, user-initiated actions and are no longer part of the automated pipeline.

*   **Dual AI Chat Architecture (as of v3.3.16.7.52):**
    *   **App Data Chat:** A non-grounded chat box focused exclusively on analyzing data already loaded into the application (using a stable Genkit flow).
    *   **Web Search Chat:** A separate chat box that handles all queries requiring real-time web search. This now uses the **raw Google AI SDK** for improved stability, bypassing the problematic Genkit tool abstraction for this use case. All prompts are manual.

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   Main application interface organized into "Main", "Debug Data", "Client Debug Trace Logs", "Console Logs", and "FSM Debug" tabs. A "Staging" tab is also available for developers.
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
    *   **Console Debug Snapshot:** For deep-dive issues; includes everything except the curated trace logs.
    *   **Data-Only Snapshot:** For AI prompt/data issues; includes FSM data, debug data, and chat histories only.
*   **"Staging" Tab:** A dedicated area for developers to test experimental features and diagnostic tools in isolation from the main application flow.

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

#### 3.2.4. State Management (as of v3.2.5.0.Z)
*   **React Context (`StockAnalysisContext`):** Centralized global state management.
*   **Single, Enhanced Global Finite State Machine (FSM):** Manages all primary application states, flags, and context variables. Orchestrates the application lifecycle.

#### 3.2.5. FSM (Finite State Machines) - (Reflecting v3.3.16.7.50)
*   **Simplified Pipeline Orchestration:** The global FSM orchestrator no longer triggers any chat prompts automatically. Its responsibility is now limited to sequencing the data fetch and core AI analysis steps (Key Takeaways, Options Analysis) based on user toggle selections. This makes the pipeline significantly more deterministic.
*   **Manual Chat Triggers:** All chat functionalities are now triggered manually by the user through their respective UI components, which call dedicated server actions.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }`.
*   Flows load definitions using `src/ai/definition-loader.ts`.
*   All flows include error handling and execution time logging. Prompts are cached for performance.
*   Example chat prompts for the UI are sourced from `src/ai/definitions/example-chat-prompts.json`.

### 3.4. Error Handling & Logging
*   **Error Handling:** `try...catch` in Server Actions and AI Flows.
*   **Logging System:** `logDebug()` for client-side, `console.*` for server-side.
*   **Debug Console (New Tab System):** Two dedicated tabs display logs: "Client Debug Trace Logs" (curated) and "Console Logs" (raw). Both feature filtering, search, and a 2000-entry buffer.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules & Policies
*   **Current Feature Focus (as of v3.3.16.8.7):**
    *   **"Enhanced Debug Consoles" & "SDK AI Diagnostics Migration":** Implementation is complete. The application is now ready for a comprehensive end-to-end testing phase before proceeding to the v3.4 Deterministic Overhaul.

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
*   **This README Document Version:** 3.4
*   **Current Application Version:** `v3.3.16.8.7`
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **Changelogs:** Refer to `CHANGELOG.md`.

---
