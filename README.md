
### AI Coding Agent Operating Procedure Instructions
1.  Features will be staged as version '3.w.x.y.z' series. Please follow this version naming convention when I request for commits later on. Do not increment versions on your own.
    *   App Major Version: 3 (Fixed)
    *   APP Phase Version (w): Represents the overall feature phase (e.g., 1 for Initial Setup, 2 for FSM Refactor, 3 for UI Enhancements).
    *   FEAT Phase Version (x): Represents the phase within the specific feature being implemented (e.g., for FSM Refactor, Phase 1 might be 'Foundation', Phase 2 'Manual Actions Integration').
    *   FEAT Phase Task # (y): The specific task number within the feature's phase.
    *   Bug FEAT Phase Task # (z): Increment for bug fix iterations related to a specific FEAT Phase Task # (y). Starts at 0 for the initial implementation.
###
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
###
3.  Any new phase/task code changes/implementation needs to have the app meta data version updated as well automatically along with code changes.
    *   This will allow us automatic and dynamic tracking of the current app version while we are still testing and coding.
    *   That way, when we start testing some changes and we encounter issues, I can just provide the debug logs which will have the version meta data so it's clear what task we are on and will help to ground us.

---
**README Document Version:** 1.59
**Application Version (from `app-metadata.json`):** v3.2.1.3.0 (Commit `57c7e8b0` - Phase 1 FSM Consolidation Complete)
**Last Updated:** 2025-06-20

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
*   Display key options contract details: Strike, IV, % Change, Bid, Ask, Last, Volume, Open Interest, Delta, Gamma.
*   Sort options chain table by strike price in descending order.
*   Highlight the At-The-Money (ATM) strike row in the table.

#### 3.1.3. AI-Powered Insights & Analysis
*   **AI Key Takeaways:** Generate five key takeaways (Price Action, Trend, Volatility, Momentum, Patterns) with associated sentiment, based on stock data.
*   **AI Analyzed Technical Analysis (Pivot Points):** Calculate standard daily pivot points (PP, S1-S3, R1-R3) based on previous day HLC.
*   **AI Options Analysis:** Analyze the options chain to identify significant Call and Put "Walls" (up to 3 each) based on Open Interest and/or Volume.
*   **AI Chatbot:** Provide a contextual chatbot that can answer questions about the currently analyzed stock using all available data (snapshot, TAs, AI analyses, options data).
*   Leverage Genkit flows for all AI functionalities.

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   Main application interface organized into "Main" and "Debug" tabs.
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
*   **Client Debug Console:** Real-time client-side log display with filtering, search, max 1000 entries, wrap indicator, and export capabilities. Exported logs include the dynamic application version.
*   **Startup Log Toggle:** User-configurable setting in Debug Settings Card to reduce log verbosity during initial application startup.
*   **FSM State Debug Card:** Real-time display of FSM states, flags, and context variables.

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
    *   Dynamic `import()` is used in `src/ai/definition-loader.ts` and `src/ai/prompt-loader.ts` to load these JSONs, ensuring robust path resolution in deployed environments.
    *   Prompts correctly configure "Dynamic Thinking" using `thinkingConfig: { thinkingBudget: -1 }` (or other budget values) within the `config` object for `ai.definePrompt`.
    *   Safety settings are defined in these JSONs using fully qualified harm category names (e.g., `HARM_CATEGORY_SEXUALLY_EXPLICIT`).
*   A `DefinitionLoader` (`src/ai/definition-loader.ts`) loads and validates these JSONs.
*   Zod schemas (`src/ai/schemas/`) for data validation of AI flow inputs and outputs.

#### 3.2.3. Data Sources
*   **Polygon.io API:** Primary source for stock data (snapshot, historical aggregates for TAs) and options chain data.
*   **Environment Variables (`.env`):** Stores API keys (Polygon, Google AI).
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   Stores the application version (`appVersion` - following `3.w.x.y.z` scheme) and last update timestamp (`lastUpdatedTimestamp`).
    *   **Policy (Strictly Enforced):**
        *   This file is the **SOLE SOURCE OF TRUTH** for the application's functional version.
        *   The `appVersion` from this file is dynamically loaded at runtime (e.g., in `src/app/page.tsx` via `getAppConfig()`) and passed as props to components like `Header` and `DebugConsole` for UI display and inclusion in exported log/data file metadata.
        *   The `lastUpdatedTimestamp` field **MUST ALWAYS be a real, valid ISO 8601 string** reflecting the time of the metadata update; placeholder values are strictly prohibited.

#### 3.2.4. State Management (Target Architecture for v3.2.x.y.z - FSM Consolidation)
*   **React Context (`StockAnalysisContext`):** Centralized global state management for:
    *   Fetched data JSON strings (e.g., `stockSnapshotJson`, `aiKeyTakeawaysJson`).
    *   **Single, Enhanced Global Finite State Machine (FSM):** This FSM will manage all primary application states, contextual flags (e.g., `isSnapshotDataReady`, `canUserTriggerManualAnalysis`), and key context variables (e.g., `activeAnalysisTicker`, `lastErrorDetails`). It will orchestrate the entire application lifecycle and UI flows.
    *   Client-side debug logging (`logDebug` function, configuration, startup logging flags).
    *   Chat history.
    *   UI states for debug console and FSM debug card visibility.
    *   The `contextValue` provided by `StockAnalysisProvider` is memoized using `useMemo`.
*   **`useReducer` (in `StockAnalysisContext`):** Manages the single, enhanced global application FSM.
*   **`useActionState` (React Hook):** Manages the lifecycle (pending, success, error) of server actions invoked from client components.

#### 3.2.5. FSM (Finite State Machines) - (Target Architecture for v3.2.x.y.z)
*   **Single Global Application FSM (managed in `StockAnalysisContext`):**
    *   Orchestrates the main application lifecycle (e.g., `APP_INITIALIZING`, `IDLE`, `PIPELINE_REQUESTED_DATA_FETCH`, `MANUAL_ACTION_PENDING_KEY_TAKEAWAYS`, `CHAT_MESSAGE_PENDING`).
    *   Manages `GlobalFsmFlags` (booleans for specific conditions like `isSnapshotDataReady`) and `GlobalFsmContextVariables` (data like `activeTicker`).
    *   Drives UI enablement/disablement and conditional logic throughout the app.
*   **Local UI FSMs (MainTabContent, ChatbotFsmContext, DebugConsoleFsmContext):** To be deprecated or their roles significantly reduced/absorbed by the single global FSM. UI components will primarily react to the global FSM's state, flags, and variables. (Note: `MainTabContent` local FSM for automated pipeline removed in v3.2.1.1.0).
*   **FSM State Display:** The "FSM State Debug Card" (`FsmStateDebugCard.tsx`) will be enhanced to display the state, flags, and variables of the single global FSM.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }`.
*   Flows (`analyze-stock-data.ts`, `analyze-options-chain-flow.ts`, `analyze-ta-flow.ts`, `chat-flow.ts`) load definitions using `src/ai/definition-loader.ts` (dynamic `import()`).
*   All flows include error handling and execution time logging.
*   **AI Options Analysis Flow (`analyze-options-chain-flow.ts`):** Refined prompt to encourage identification of relative OI spikes.

### 3.4. Error Handling & Logging

#### 3.4.1. Error Handling
*   Next.js `error.js` boundary files.
*   `try...catch` in Server Actions and AI Flows, returning structured error states.
*   Client display components parse and display these structured error JSONs.

#### 3.4.2. Logging System
*   **Client-Side Logging:**
    *   Primary Method: `logDebug(source: LogSourceId, category: string, ...messages: any[])` from `useStockAnalysis()`.
    *   Console Interception: `StockAnalysisContext` intercepts native `console.*` calls.
    *   **Startup Logging Control:** `StockAnalysisContext` manages `isInitialAppStartupComplete` and `isReducedStartupLoggingEnabled` flags. If reduced startup logging is enabled, non-critical logs are suppressed during the initial load phase. A "StartupComplete" message is logged when full logging resumes.
*   **Server-Side Logging (Actions & Flows):** `console.log`, `console.error`, `console.time/timeEnd` with standardized prefixes.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   Displays client-side logs (up to 1000 entries).
    *   Features: Filtering by type/source, search, visual wrap indicator message.
    *   Export/Copy: Logs (JSON, TXT, CSV) include the **dynamic application version** and a snapshot of FSM states (and eventually flags/variables from the single FSM).

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules & Policies
*   **Client-Side `console.log` Prohibited:** Use `logDebug` from `StockAnalysisContext`.
*   **No Commented-Out Code in Commits.**
*   **JSDoc:** For overviews and complex functions. No inline code comments unless essential.
*   **`package.json`:** No comments.
*   **Metadata Timestamps (`src/config/app-metadata.json`):**
    *   The `lastUpdatedTimestamp` field **MUST** always be a real, valid ISO 8601 timestamp.
*   **Debugging Status (as of v3.2.1.3.0):**
    *   "Debug Log Enhancements" feature (v3.1.x.y.z) is complete.
    *   "FSM Consolidation & Refactor" (v3.2.x.y.z): Phase 1 (Foundation & Core FSM Setup - v3.2.1.x.z) is **COMPLETE**. This includes migrating the full automated analysis pipeline (ticker input, data fetch, AI TA calculation) to the new single global FSM.

#### 3.5.2. UI/UX Conventions
*   Consistent use of ShadCN components from `components/ui`.
*   Use rounded corners, shadows, and drop shadows.
*   Use Tailwind CSS with theme variables from `globals.css` for colors.
*   Use `lucide-react` for icons (verify existence).
*   Ensure responsiveness and accessibility (ARIA attributes).
*   Hydration Mismatch Prevention: Defer client-specific values to `useEffect`.

#### 3.5.3. TypeScript & Data Handling
*   TypeScript with `import type` for type imports.
*   Zod schemas for AI flow inputs/outputs and server action payloads/results.
*   `next/image` for images. Placeholders: `https://placehold.co/<width>x<height>.png` with `data-ai-hint`.

#### 3.5.4. Server & AI Conventions (Genkit 1.x)
*   Next.js App Router, Server Components, Server Actions.
*   Genkit (`ai` object from `src/ai/genkit.ts`) for all AI definitions.
*   Adhere to Genkit 1.x API syntax.
*   Thinking Mode: `thinkingConfig: { thinkingBudget: ... }` in JSON prompt definitions.
*   Flow Files (`src/ai/flows/*.ts`): `'use server';`, JSDoc, export async wrapper & types.
*   Prompt Definitions (`src/ai/definitions/*.json`): Loaded via dynamic `import()` in `definition-loader.ts`. Handlebars for templating (NO logic).
*   Tools (`ai.defineTool`): For LLM-decided actions.

### 3.6. Commit & Changelog Procedures (Reflecting v3.2.1.3.0 and New Versioning Scheme)
*   **Application Versioning - Single Source of Truth & `3.w.x.y.z` Scheme:**
    *   The application's functional version is updated **ONLY** in `src/config/app-metadata.json` within the `appVersion` field, following the `3.w.x.y.z` scheme:
        *   `3`: App Major Version (Fixed).
        *   `w`: APP Phase Version (e.g., 2 for FSM Consolidation).
        *   `x`: FEAT Phase Version (e.g., 1 for FSM Consolidation - Phase 1: Foundation).
        *   `y`: FEAT Phase Task # (e.g., 1 for Task v3.2.1.1 - Integrate "Analyze Stock" Button).
        *   `z`: Bug FEAT Phase Task # (Increment for bug fixes specific to task 'y'. Starts at 0).
    *   The `lastUpdatedTimestamp` field in `src/config/app-metadata.json` **MUST** be updated to the current real-world ISO 8601 timestamp.
*   **Dynamic Versioning in UI/Exports:**
    *   `src/components/layout/header.tsx` receives `appVersion` via props (from `page.tsx` -> `app-metadata.json`).
    *   `src/components/debug-console.tsx` receives `appVersion` via props for inclusion in log exports.
*   **Documentation Updates:**
    *   `CHANGELOG.md`: Update with detailed commit message for each task/fix, reflecting the new `appVersion`.
    *   `README.md`: Update this PRD if core architecture or primary functional requirements change (like this versioning scheme update).
    *   **New Feature Docs:** For entirely new features, generate `FEAT_SCOPE_xxx.md` and `FEAT_STATUS_xxx.md` in the `/docs` folder as per new operating procedures.

---

## 4. Project Setup & Running Locally

### 4.1. Prerequisites
*   Node.js (latest LTS version recommended)
*   npm (comes with Node.js)

### 4.2. Environment Variables
Create a `.env` file in the project root:
```env
POLYGON_API_KEY=your_polygon_api_key
GOOGLE_API_KEY=your_google_ai_api_key
```

### 4.3. Installation
```bash
npm install
```

### 4.4. Running the Development Server
1.  **Terminal 1 (Next.js Application):**
    ```bash
    npm run dev
    ```
    App: `http://localhost:9002`

2.  **Terminal 2 (Genkit Flows):**
    ```bash
    npm run genkit:watch
    ```
    Genkit Dev UI: `http://localhost:3400` (usually)

### 4.5. Building for Production
```bash
npm run build
npm run start
```

---

## 5. Change History & Versioning
*   **This README Document Version:** 1.59
*   **Current Application Version:** `v3.2.1.3.0` (Commit `57c7e8b0` - Phase 1 FSM Consolidation Complete)
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **Changelogs:**
    *   For v3.0.0.0 onwards: Refer to `CHANGELOG_3.0.md`.
    *   For pre-v3.0.0.0 history: Refer to `CHANGELOG.md`.

---

    
