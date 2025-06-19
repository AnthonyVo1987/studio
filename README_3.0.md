
# StockSage v3.0.0.0 - Product Requirements Document & Technical Design

**Document Version:** 3.0
**Application Version:** 3.0.0.0
**Last Updated:** (This will reflect the date of generation for this document version)

---

## 1. Introduction
This document serves as the comprehensive Product Requirements Document (PRD) and Technical Design specification for the StockSage application, version 3.0.0.0. StockSage is a Next.js-based financial analysis tool leveraging Genkit for AI-powered insights. It provides stock data, options chain analysis, and AI-driven key takeaways. This document reflects the current state of the application as of version 3.0.0.0 and serves as the baseline for future development.

---

## 2. Goals & Objectives

### 2.1. Primary Goals
*   Provide users with a clear, concise, and AI-enhanced overview of stock performance.
*   Offer insights into potential investment opportunities based on options chain analysis.
*   Streamline the stock analysis process, saving users time and effort.
*   Enable efficient debugging and continuous improvement through detailed logging and a well-defined architecture.

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
*   **Debug Tab:** Display raw JSON for all major data segments (API requests/responses, AI flow inputs/outputs).
*   **Client Debug Console:** Real-time client-side log display with filtering and export capabilities.
*   **FSM State Debug Card:** Real-time display of FSM states.

### 3.2. System Architecture & Components

#### 3.2.1. Next.js (Frontend Framework)
*   React-based UI.
*   Next.js App Router for routing and layout management.
*   Server Components for data fetching and server-side logic (e.g., `page.tsx`).
*   Client Components for interactive UI elements and state management.

#### 3.2.2. Genkit (AI Backend Orchestration)
*   Google Gemini models (`googleai/gemini-2.5-flash-lite-preview-06-17`) for AI analysis tasks.
*   AI flows defined in `src/ai/flows/` for orchestrating LLM calls.
*   AI prompt definitions externalized into JSON files in `src/ai/definitions/`.
    *   Prompts correctly configure "Dynamic Thinking" using `thinkingConfig: { thinkingBudget: -1 }` (or other budget values) within the `config` object for `ai.definePrompt`.
    *   Safety settings are defined in these JSONs using fully qualified harm category names (e.g., `HARM_CATEGORY_SEXUALLY_EXPLICIT`).
*   A `DefinitionLoader` (`src/ai/definition-loader.ts`) loads and validates these JSONs.
*   Zod schemas (`src/ai/schemas/`) for data validation of AI flow inputs and outputs.

#### 3.2.3. Data Sources
*   **Polygon.io API:** Primary source for stock data (snapshot, historical aggregates for TAs) and options chain data.
*   **Environment Variables (`.env`):** Stores API keys (Polygon, Google AI).
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   Stores the application version (`appVersion`) and last update timestamp (`lastUpdatedTimestamp`).
    *   **Policy:** This file is the **sole source of truth** for the application's functional version displayed in the UI.
    *   **Policy:** The `lastUpdatedTimestamp` field **MUST always be a real, valid ISO 8601 string** reflecting the time of the metadata update; placeholder values are strictly prohibited.

#### 3.2.4. State Management
*   **React Context (`StockAnalysisContext`):** Centralized global state management for:
    *   Fetched data JSON strings (e.g., `stockSnapshotJson`, `aiKeyTakeawaysJson`).
    *   Global Finite State Machine (FSM) state and event dispatching.
    *   Client-side debug logging (`logDebug` function and configuration).
    *   Chat history.
    *   UI states for debug console and FSM debug card visibility.
*   **`useReducer` (in `StockAnalysisContext` and local FSMs):** Manages the global application FSM and local component UI FSMs.
*   **`useActionState` (React Hook):** Manages the lifecycle (pending, success, error) of server actions invoked from client components, primarily for data fetching (e.g., `fetchStockDataAction`) and AI analysis (e.g., `performAiAnalysisAction`).

#### 3.2.5. FSM (Finite State Machines)
*   **Global Application FSM (managed in `StockAnalysisContext`):** Orchestrates the main application lifecycle, including:
    *   `IDLE`, `INITIALIZING_ANALYSIS`
    *   `FETCHING_DATA`, `DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`, `STALE_DATA_FROM_ACTION_ERROR`
    *   `ANALYZING_TA`, `AI_TA_SUCCEEDED`, `AI_TA_FAILED`
    *   `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`
    *   `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED`, `OPTIONS_ANALYSIS_FAILED`
    *   `FULL_ANALYSIS_COMPLETE`
*   **Local UI FSMs:**
    *   **`MainTabContent.tsx` Local FSM:** Manages UI states for the main input form (ticker input validity, "Analyze Stock" button enablement) and readiness for manual AI actions.
    *   **`ChatbotFsmContext.tsx`:** Manages the Chatbot's internal UI logic (user input, submission state).
    *   **`DebugConsoleFsmContext.tsx`:** Manages UI states for the Debug Console's menus (filter, copy, export).
*   **FSM State Display:** A dedicated "FSM State Debug Card" (`FsmStateDebugCard.tsx`) provides a centralized, real-time view of Previous, Current, and Target states for all major FSMs.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }` for dynamic thinking.
*   **`analyze-stock-data.ts` (Key Takeaways):**
    *   Definition: `analyze-stock-data.json`.
    *   Input: Ticker, stock snapshot, standard TAs, AI-analyzed TAs, market status.
    *   Output: Five key takeaways (price action, trend, volatility, momentum, patterns) with sentiment.
    *   Error Handling: Throws error on critical AI prompt failure; includes execution time logging.
*   **`analyze-options-chain-flow.ts` (Options Walls):**
    *   Definition: `analyze-options-chain.json`.
    *   Input: Ticker, options chain JSON, current underlying price.
    *   Output: Up to 3 Call Walls and 3 Put Walls based on OI/Volume.
    *   Error Handling: Throws error on critical AI prompt failure; includes execution time logging.
*   **`analyze-ta-flow.ts` (Pivot Points Calculation):**
    *   Definition: `analyze-ta-indicators.json` (calculation-logic type, no LLM).
    *   Input: Previous day High, Low, Close prices.
    *   Output: Standard daily pivot points (PP, S1-S3, R1-R3).
*   **`chat-flow.ts` (Chatbot):**
    *   Definition: `stock-chatbot.json`.
    *   Input: Ticker, all available data JSONs (snapshot, TAs, AI analyses), chat history, user input.
    *   Output: Markdown-formatted chatbot response.
    *   Error Handling: Throws error on critical AI prompt failure; includes execution time logging.

### 3.4. Error Handling & Logging

#### 3.4.1. Error Handling
*   Next.js `error.js` boundary files for route-level errors.
*   `try...catch` blocks in Server Actions and AI Flows, returning structured error states (e.g., `{ error: "...", details: "..." }`).
*   AI Flows throw errors on critical AI prompt failures, propagated by Server Actions.
*   Client display components parse and display these structured error JSONs.

#### 3.4.2. Logging System
*   **Client-Side Logging:**
    *   Primary Method: `logDebug(source: LogSourceId, category: string, ...messages: any[])` from `useStockAnalysis()`.
    *   Log Sources: Defined in `src/lib/debug-log-types.ts` (e.g., `KeyMetricsDisplay`, `StockAnalysisContext`).
    *   Console Interception: `StockAnalysisContext` intercepts native `console.log/warn/error` etc., and routes them through `logDebug` if the debug console is enabled.
    *   Log Buffer: `src/lib/global-log-buffer.ts` stores logs for the debug console.
*   **Server-Side Logging (Actions & Flows):**
    *   Standard: `console.log`, `console.error`, `console.time/timeEnd`.
    *   Prefixes: Standardized prefixes for Server Actions (e.g., `[ServerAction:actionName:Ticker:XYZ]`) and AI Flows (e.g., `[AIFlow:flowName:Ticker:XYZ]`).
    *   Timing: AI Flows include execution time logging via `console.time/timeEnd`. Server Actions log before/after AI flow calls.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   Displays client-side logs.
    *   Features: Filtering by log type/source, search.
    *   Export/Copy: Logs (JSON, TXT, CSV) including app version and FSM states.
    *   `APP_VERSION_FOR_EXPORT` constant (e.g., "v3.0.0.0") used for exported log metadata.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules
*   **Client-Side `console.log` Prohibited:** Use `logDebug` from `StockAnalysisContext` instead. Native `console.*` calls are only for server-side or core context mechanisms.
*   **No Commented-Out Code:** Remove dead code before commits.
*   **JSDoc:** Use for file overviews and complex function explanations. No inline code comments unless absolutely necessary for highly complex, non-obvious logic.
*   **`package.json`:** No comments.

#### 3.5.2. Application Metadata & Versioning Policy (`src/config/app-metadata.json`)
*   **Single Source of Truth for App Version:** The `appVersion` field in `src/config/app-metadata.json` is the definitive source for the application's functional version displayed in the UI (via `page.tsx` -> `Header` prop).
*   **Real Timestamps Mandatory:** The `lastUpdatedTimestamp` field in `src/config/app-metadata.json` **MUST** always be set to a real, valid ISO 8601 timestamp upon any modification to the file or related version update. Placeholder timestamps (e.g., "YYYY-MM-DDTHH:MM:SSZ") are strictly prohibited.
*   **Source File Versioning Prohibited for App Version Updates:**
    *   `src/components/layout/header.tsx`: **DO NOT** manually update version strings here for application versioning. It receives the version dynamically.
    *   `src/components/debug-console.tsx`: The `APP_VERSION_FOR_EXPORT` constant is set based on the **commit tag/version of a release** and is for log export identification, independent of the dynamically displayed app version. It should be updated when a new tagged release is made.

#### 3.5.3. UI/UX Conventions
*   Utilize ShadCN components from `components/ui` for consistency.
*   Employ rounded corners, shadows, and drop shadows for a professional aesthetic.
*   Use Tailwind CSS with semantic classes. Adhere to theme variables defined in `globals.css` for colors.
*   Use `lucide-react` for icons, verifying icon existence.
*   Prioritize responsiveness and accessibility (ARIA attributes).
*   **Hydration Mismatch Prevention:** Defer operations like `Math.random()`, `new Date()` (where server/client difference matters), or direct access to `window`/`document` to client-side `useEffect` hooks.

#### 3.5.4. TypeScript & Data Handling
*   Use TypeScript strictly, with `import type` for type-only imports.
*   Define Zod schemas for all significant data structures, especially for AI flow inputs/outputs and server action payloads/results.
*   Pass image data as data URIs for Genkit prompts (if applicable).
*   Use `next/image` for image optimization. Placeholders: `https://placehold.co/<width>x<height>.png`.

#### 3.5.5. Server & AI Conventions (Genkit 1.x)
*   Default to Next.js App Router and Server Components where appropriate.
*   Use Server Actions for data mutations and fetching logic callable from the client.
*   **Genkit Usage:**
    *   The global `ai` object from `src/ai/genkit.ts` is the entry point for all Genkit definitions (`ai.defineFlow`, `ai.definePrompt`, `ai.defineTool`).
    *   Adhere to Genkit 1.x API syntax: `response.text` (not `response.text()`), `const {stream, response} = ai.generateStream(...)` (no `await`), etc.
    *   **Thinking Mode:** Configure using `thinkingConfig: { thinkingBudget: ... }` in prompt definitions.
*   **Flow Files (`src/ai/flows/*.ts`):**
    *   Must include `'use server';` directive.
    *   JSDoc overview for file purpose and exported members.
    *   Export the main async wrapper function for the flow and its Zod input/output types.
*   **Prompt Definitions (`src/ai/definitions/*.json`):**
    *   Centralized location for all LLM prompt configurations.
    *   Loaded by `src/ai/definition-loader.ts`.
    *   Utilize Handlebars templating (`{{{variable}}}`) for dynamic data insertion. **NO logic or function calls within Handlebars templates.**
*   **Tools (`ai.defineTool`):** Use for enabling LLMs to make decisions about invoking external functions or data lookups as part of their reasoning process. (Current usage is minimal but framework is in place).

---

## 4. Project Setup & Running Locally

### 4.1. Prerequisites
*   Node.js (latest LTS version recommended)
*   npm (comes with Node.js)

### 4.2. Environment Variables
Create a `.env` file in the project root with the following content:
```env
POLYGON_API_KEY=your_polygon_api_key
GOOGLE_API_KEY=your_google_ai_api_key
# Note: GOOGLE_API_KEY is used by Genkit's GoogleAI plugin.
```
Replace `your_polygon_api_key` and `your_google_ai_api_key` with your actual API keys.

### 4.3. Installation
Install project dependencies:
```bash
npm install
```

### 4.4. Running the Development Server
The application requires two separate processes to run in development:

1.  **Terminal 1 (Next.js Application):**
    Starts the Next.js development server.
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Terminal 2 (Genkit Flows):**
    Starts the Genkit development server, which hosts and runs your AI flows.
    ```bash
    npm run genkit:watch
    ```
    The Genkit Developer UI will typically be available at `http://localhost:3400`.

### 4.5. Building for Production
To create a production build:
```bash
npm run build
```
To run the production build:
```bash
npm run start
```

---

## 5. Change History & Versioning (StockSage v3.0+)

*   **Current Application Version:** `v3.0.0.0` (Baseline for this document)
    *   Sourced from `src/config/app-metadata.json`.
*   **This Document Version:** 3.0
*   **Historical Changelogs (pre-v3.0.0.0):** Refer to the main `CHANGELOG.md` in the project root for the detailed history of `v2.x` versions.
*   **v3.0.0.0 Onwards:** Changes from this version forward will be tracked in a separate `CHANGELOG_3.0.md` (to be created).

---
