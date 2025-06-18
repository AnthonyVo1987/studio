---

## 1. Introduction
This document serves as the comprehensive Product Requirements Document (PRD) for the StockSage application. StockSage is a Next.js-based financial analysis tool leveraging Genkit for AI-powered insights. It provides real-time stock data, options chain analysis, and AI-driven key takeaways.

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
*   Fetch real-time stock data from the Polygon.io API.
*   Display key metrics: price, volume, market cap, P/E ratio, etc.
*   Implement robust error handling for API failures.

#### 3.1.2. Options Chain Analysis
*   Retrieve options chain data (calls & puts) for a given stock and expiration date.
*   Calculate and display key options metrics: implied volatility, delta, gamma, theta, vega.
*   Offer filtering and sorting options for options contracts.

#### 3.1.3. AI-Powered Insights
*   Generate AI Key Takeaways: Summarize key stock information and potential investment considerations.
*   Provide AI Options Analysis: Analyze the options chain and suggest potential strategies (bullish, bearish, neutral).
*   Leverage Genkit flows for AI functionality.

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   ShadCN components for consistent UI elements.
*   Tailwind CSS for styling.
*   Dark mode support.

### 3.2. System Architecture & Components

#### 3.2.1. Next.js (Frontend)
*   React-based UI framework.
*   Server-side rendering (SSR) for improved performance and SEO.
*   App Router for routing and layout management.
*   Server Components for data fetching and server-side logic.
*   Client Components for interactive elements.

#### 3.2.2. Genkit (AI Backend)
*   Google Gemini models (currently `gemini-2.5-flash-preview-05-20`) for AI analysis.
*   AI flows for orchestrating LLM calls.
*   Prompts (defined in JSON files under `src/ai/definitions/`) for AI tasks.
*   Tools for accessing external data and performing actions (currently not heavily used but available).
*   Zod schemas for data validation.

#### 3.2.3. Data Sources
*   Polygon.io API: For stock data and options chain data.
*   `.env` file: Stores API keys and configuration parameters.

#### 3.2.4. State Management
*   **React Context (`StockAnalysisContext`):** Primary global state management for application-wide data (like fetched JSONs, FSM states) and core functionalities (like `logDebug`, FSM event dispatch).
*   **`useReducer` (in `StockAnalysisContext` and local FSMs):** For managing the global FSM state and local component FSMs (e.g., `MainTabContent.tsx`, `ChatbotFsmContext.tsx`, `DebugConsoleFsmContext.tsx`).
*   **`useActionState` (React Hook):** Used for managing the lifecycle of server actions (pending, success, error states), particularly for data fetching and AI analysis calls from client components to server actions.

#### 3.2.5. FSM (Finite State Machines)
*   **Global Application FSM (in `StockAnalysisContext`):** Manages the overall application state (e.g., `IDLE`, `FETCHING_DATA`, `ANALYZING_TA`, `GENERATING_KEY_TAKEAWAYS`, `ANALYZING_OPTIONS`, `FULL_ANALYSIS_COMPLETE`, `ERROR` states). Orchestrates the sequence of operations for both automated and manual analysis pipelines by triggering server actions.
*   **Local UI FSMs:**
    *   **`MainTabContent.tsx` Local FSM:** Manages UI states related to input validity, enabling/disabling the "Analyze Stock" button, and readiness for manual AI actions (`MANUAL_ACTIONS_ENABLED` state). It also triggers events for manual AI analysis submissions.
    *   **`ChatbotFsmContext.tsx`:** Manages the Chatbot's internal UI logic (input handling, submission state).
    *   **`DebugConsoleFsmContext.tsx`:** Manages UI states for the Debug Console's menus (filter, copy, export).
*   **FSM State Display:** A dedicated "FSM State Debug Card" (`FsmStateDebugCard.tsx`) provides a centralized view of Previous, Current, and Target states for all major FSMs. Local FSMs report their display states to `StockAnalysisContext` for this purpose.

### 3.3. AI Flow & Prompt Design
*   AI prompt definitions are externalized into JSON files in `src/ai/definitions/`.
*   A `DefinitionLoader` (`src/ai/definition-loader.ts`) loads and validates these JSONs, and helps build prompt strings for Genkit flows.
*   **AI Key Takeaways Flow (`analyze-stock-data.ts`):**
    *   Uses `analyze-stock-data.json` definition.
    *   Input: Stock snapshot, standard TAs, AI-analyzed TAs, market status.
    *   Output: Five key takeaways (price action, trend, volatility, momentum, patterns) with sentiment.
*   **AI Options Analysis Flow (`analyze-options-chain-flow.ts`):**
    *   Uses `analyze-options-chain.json` definition.
    *   Input: Options chain JSON, current underlying price, ticker.
    *   Output: Identified Call/Put Walls (max 3 each) based on OI/Volume.
*   **AI Analyzed TA Flow (Pivot Points) (`analyze-ta-flow.ts`):**
    *   Uses `analyze-ta-indicators.json` (a `calculation-logic` type definition).
    *   Input: Previous day HLC.
    *   Output: Standard daily pivot points and support/resistance levels.
*   **AI Chatbot Flow (`chat-flow.ts`):**
    *   Uses `stock-chatbot.json` definition.
    *   Input: Ticker, all available data JSONs (snapshot, key takeaways, AI TA, options analysis), chat history, user input.
    *   Output: Markdown-formatted chatbot response.

### 3.4. Error Handling & Logging
*   Comprehensive error handling throughout the application.
*   `error.js` boundary files for handling route-level errors.
*   `try...catch` blocks in server actions and AI flows, returning structured error states.
*   Detailed logging for debugging and monitoring.
*   Client-side debug console (`DebugConsole.tsx`) for inspecting application state.
*   Server-side logs (`console.log`, `console.error`) for tracking API calls, AI flow executions, and errors.

#### 3.4.1. Logging Conventions & Locations
*   **`src/lib/debug-log-types.ts`:** Defines `LogSourceId`s, `LogType`s, labels, and default enabled configurations for client-side debug sources.
*   **`StockAnalysisContext` (`src/contexts/stock-analysis-context.tsx`):**
    *   Provides `logDebug(source: LogSourceId, category: string, ...messages: any[])` function. This is the **primary method for client-side logging**.
    *   It intercepts `console.log/warn/error/info/debug` calls. If the first argument to a native console call is `__LOGDEBUG_MARKER__`, it treats the subsequent arguments as `source`, `category`, and `messages` for structured logging via the `logDebug` pathway. Otherwise, native console calls are logged with source `'NATIVE_CONSOLE'`.
    *   Logs are added to a global, non-React state buffer (`src/lib/global-log-buffer.ts`).
*   **Server Actions (`src/actions/*.ts`):** Use `console.log` and `console.error` with a standardized prefix (e.g., `[ServerAction:actionName:Ticker:XYZ]`).
*   **Genkit Flows (`src/ai/flows/*.ts`):** Use `console.log` and `console.error` with a flow-specific prefix (e.g., `[AIFlow:flowName:Ticker:XYZ]`).
*   **Client Components (e.g., `src/components/main-tab-content.tsx`):** **MUST** use the `logDebug` function from `useStockAnalysis()` for structured client-side logging.
*   **`CHANGELOG.md`:** Detailed log of changes and bug fixes.

#### 3.4.2. Common Logging Practices
*   Use descriptive log messages and include relevant data (e.g., ticker, FSM states, variable values).
*   When catching errors, log the error message, stack trace (if available), and relevant context.
*   Log entry/exit points of important functions, AI flows, and server actions.
*   Log inputs and outputs of AI flows and server actions (summarize large objects).
*   Log FSM state transitions (global and local), including the event that triggered them.
*   Log critical decision points in UI logic, especially in `useEffect` hooks controlling UI state (like button enablement).

#### 3.4.3. Debug Console (`src/components/debug-console.tsx`)
*   Displays logs from the `logDebug` system.
*   Allows filtering by `LogType` and `LogSourceId`.
*   Search functionality.
*   Export/Copy logs (JSON, TXT, CSV) including app version and current FSM states as metadata.
*   Clears logs on manual clear or implicitly on full page reload.

### 3.5. Coding Standards & Conventions

#### 3.5.0. General Rules
*   **NO `console.log` in committed client-side code** unless it's part of the `StockAnalysisContext`'s interception mechanism or a temporary, explicitly discussed debugging measure. Use `logDebug` from context.
*   **No commented-out code in commits.**
*   Follow established file/folder structures and naming conventions.
*   **Current Debugging Focus (v2.9.D series):** The manual AI analysis buttons in `MainTabContent.tsx`. Refer to `docs/Issue-Report_AI_Analysis_Buttons.md`.
*   See extensive list in prior `README.md` versions (e.g., v2.9.D.8) for more general coding best practices (ESLint, TypeScript, `any` type avoidance, etc.). These are implicitly still in effect.

#### 3.5.1. UI/UX Conventions
*   Consistent use of ShadCN components from `components/ui`.
*   Use rounded corners, shadows, and drop shadows.
*   Use Tailwind CSS with semantic classes. Use theme variables from `globals.css` for colors.
*   Use `lucide-react` for icons (verify existence).
*   Ensure responsiveness and accessibility (ARIA attributes).

#### 3.5.1.1. Avoiding Hydration Mismatches
*   Defer operations producing different server/client values (`Math.random()`, `new Date()`, `window`, `document`, `localStorage`) to a `useEffect` hook to ensure they run client-side only.

#### 3.5.2. TypeScript & Data Handling Conventions
*   Use TypeScript with `import type` for type imports.
*   Define Zod schemas for all significant data structures, especially AI flow inputs/outputs.
*   Pass image data as data URIs for Genkit prompts.
*   Use `next/image` and placeholder services correctly.

#### 3.5.3. Server & AI Conventions (Genkit 1.x Focus)
*   Use Next.js App Router, Server Components by default.
*   Server Actions for mutations.
*   Genkit (`src/ai/genkit.ts` `ai` object) **MUST** be used for `ai.defineFlow`, `ai.definePrompt`.
*   **Genkit 1.x API:**
    *   Init: `const ai = genkit({plugins: [googleAI()]});` (No `logLevel`).
    *   Response: `response.text`, `response.output` (not functions).
    *   Streaming: `const {stream, response} = ai.generateStream(...);` (no `await` on `generateStream`), then `for await (const chunk of stream) {}`, then `await response;`.
*   Flow files (`src/ai/flows/*.ts`): `'use server';`, JSDoc overview, export async wrapper & types.
*   Prompts load definitions from JSON (`src/ai/definitions/*.json`).
*   Handlebars for prompt templating: `{{{variable}}}`. **NO logic in templates.**
*   Tools: `ai.defineTool`. Use for LLM-decided actions.

#### 3.5.4. Code Style
*   **NO COMMENTS IN CODE** unless JSDoc or exceptionally complex logic. No `package.json` comments.
*   Clean, readable, performant code. Functional components, hooks.

### 3.6. Debugging and Logging (Reiteration)
*   **Client:** `logDebug` from `StockAnalysisContext` is the standard. Filter/search via `DebugConsole`.
*   **Server (Actions, Flows):** `console.log/error` with prefixes.
*   Log key state transitions, inputs/outputs, and error conditions comprehensively.
*   **`isDataReadyForProcessing` function in `MainTabContent.tsx`:** This utility is crucial for determining if prerequisite JSON data strings (from context) are valid and ready for use in AI flows or UI. It checks for null, empty, pending, error, or skipped states. Its behavior with various JSON states is central to button enablement logic.

### 3.7. Commit & Changelog Procedures
*   Increment app version in `src/components/layout/header.tsx`.
*   Update `CHANGELOG.md` with a detailed commit message for each task/fix.
*   Update this `README.md` if PRD, architecture, or core AI operational rules change significantly.

---

## 4. Project Setup & Running Locally

### 4.1. Prerequisites
*   Node.js (latest LTS recommended)
*   npm

### 4.2. Environment Variables
Create a `.env` file in the project root:
```env
POLYGON_API_KEY=your_polygon_api_key
GOOGLE_API_KEY=your_google_ai_api_key 
# (Note: GOOGLE_API_KEY is used by Genkit's GoogleAI plugin)
```

### 4.3. Installation
```bash
npm install
```

### 4.4. Running the Development Server
1.  **Terminal 1 (Next.js App):**
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
See `CHANGELOG.md`. App version in UI header.

---
