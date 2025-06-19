
# StockSage v3.0 - Product Requirements Document & Technical Design

**Document Version:** 3.0.1 (Reflecting dynamic versioning policy and AI loading fix documentation)
**Application Version:** 3.0.0.1 (Reflecting current application version)
**Last Updated:** (This will reflect the date of generation for this document version)

---

## 1. Introduction
This document serves as the comprehensive Product Requirements Document (PRD) and Technical Design specification for the StockSage application, version 3.0.0.1. StockSage is a Next.js-based financial analysis tool leveraging Genkit for AI-powered insights. It provides stock data, options chain analysis, and AI-driven key takeaways. This document reflects the current state of the application as of version 3.0.0.1 and serves as the baseline for future development.

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
    *   **Exported File Metadata:** All exported files (debug logs, data exports) will dynamically include the current application version sourced from `src/config/app-metadata.json`. This version is passed as a prop to the relevant export functions.
*   **Debug Tab:** Display raw JSON for all major data segments (API requests/responses, AI flow inputs/outputs).
*   **Client Debug Console:** Real-time client-side log display with filtering and export capabilities. Exported logs include the dynamic application version.
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
    *   Dynamic `import()` is used in `src/ai/definition-loader.ts` and `src/ai/prompt-loader.ts` to load these JSONs, ensuring robust path resolution in deployed environments (Fixed in v3.0.0.1).
    *   Prompts correctly configure "Dynamic Thinking" using `thinkingConfig: { thinkingBudget: -1 }` (or other budget values) within the `config` object for `ai.definePrompt`.
    *   Safety settings are defined in these JSONs using fully qualified harm category names (e.g., `HARM_CATEGORY_SEXUALLY_EXPLICIT`).
*   A `DefinitionLoader` (`src/ai/definition-loader.ts`) loads and validates these JSONs.
*   Zod schemas (`src/ai/schemas/`) for data validation of AI flow inputs and outputs.

#### 3.2.3. Data Sources
*   **Polygon.io API:** Primary source for stock data (snapshot, historical aggregates for TAs) and options chain data.
*   **Environment Variables (`.env`):** Stores API keys (Polygon, Google AI).
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   Stores the application version (`appVersion`) and last update timestamp (`lastUpdatedTimestamp`).
    *   **Policy (Strictly Enforced as of v3.0.0.1):**
        *   This file is the **SOLE SOURCE OF TRUTH** for the application's functional version.
        *   The `appVersion` from this file is dynamically loaded at runtime (e.g., in `src/app/page.tsx` via `getAppConfig()`) and passed as props to components like `Header` and `DebugConsole` for UI display and inclusion in exported log/data file metadata.
        *   The `lastUpdatedTimestamp` field **MUST ALWAYS be a real, valid ISO 8601 string** reflecting the time of the metadata update; placeholder values are strictly prohibited.

#### 3.2.4. State Management
*   **React Context (`StockAnalysisContext`):** Centralized global state management for:
    *   Fetched data JSON strings (e.g., `stockSnapshotJson`, `aiKeyTakeawaysJson`).
    *   Global Finite State Machine (FSM) state and event dispatching.
    *   Client-side debug logging (`logDebug` function and configuration).
    *   Chat history.
    *   UI states for debug console and FSM debug card visibility.
    *   The `contextValue` provided by `StockAnalysisProvider` is memoized using `useMemo` to prevent unnecessary re-renders of consumer components.
*   **`useReducer` (in `StockAnalysisContext` and local FSMs):** Manages the global application FSM and local component UI FSMs.
*   **`useActionState` (React Hook):** Manages the lifecycle (pending, success, error) of server actions invoked from client components, primarily for data fetching (e.g., `fetchStockDataAction`) and AI analysis (e.g., `performAiAnalysisAction`).

#### 3.2.5. FSM (Finite State Machines)
*   **Global Application FSM (managed in `StockAnalysisContext`):** Orchestrates the main application lifecycle.
*   **Local UI FSMs:**
    *   **`MainTabContent.tsx` Local FSM:** Manages UI states for the main input form and manual AI actions.
    *   **`ChatbotFsmContext.tsx`:** Manages the Chatbot's internal UI logic.
    *   **`DebugConsoleFsmContext.tsx`:** Manages UI states for the Debug Console's menus.
*   **FSM State Display:** A dedicated "FSM State Debug Card" (`FsmStateDebugCard.tsx`) provides a centralized, real-time view of Previous, Current, and Target states for all major FSMs.

### 3.3. AI Flow & Prompt Design
*   **AI Prompts Location:** `src/ai/definitions/*.json`. Model: `googleai/gemini-2.5-flash-lite-preview-06-17`. Config: `thinkingConfig: { thinkingBudget: -1 }`.
*   Flows (`analyze-stock-data.ts`, `analyze-options-chain-flow.ts`, `analyze-ta-flow.ts`, `chat-flow.ts`) load definitions using `src/ai/definition-loader.ts` which employs dynamic `import()`.
*   All flows include error handling and execution time logging.

### 3.4. Error Handling & Logging

#### 3.4.1. Error Handling
*   Next.js `error.js` boundary files.
*   `try...catch` in Server Actions and AI Flows, returning structured error states.
*   Client display components parse and display these structured error JSONs.

#### 3.4.2. Logging System
*   **Client-Side Logging:**
    *   Primary Method: `logDebug(source: LogSourceId, category: string, ...messages: any[])` from `useStockAnalysis()`.
    *   Console Interception: `StockAnalysisContext` intercepts native `console.*` calls.
*   **Server-Side Logging (Actions & Flows):** `console.log`, `console.error`, `console.time/timeEnd` with standardized prefixes.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   Displays client-side logs. Features: Filtering, search.
    *   Export/Copy: Logs (JSON, TXT, CSV) include the **dynamic application version** (sourced from `app-metadata.json` via props) and FSM states.

### 3.5. Coding Standards & Conventions

#### 3.5.1. General Rules
*   **Client-Side `console.log` Prohibited:** Use `logDebug`.
*   **No Commented-Out Code.**
*   **JSDoc:** For overviews and complex functions. No inline code comments unless essential.
*   **`package.json`:** No comments.

#### 3.5.2. Application Versioning & Metadata Policy (Strictly Enforced as of v3.0.0.1)
*   **Single Source of Truth for App Version:** The `appVersion` field in `src/config/app-metadata.json` is the **sole and definitive source** for the application's functional version.
*   **Dynamic Versioning Everywhere:**
    *   The `appVersion` is loaded dynamically at runtime by `src/app/page.tsx` (via `getAppConfig()`).
    *   This dynamic `appVersion` is passed as a prop to components responsible for displaying it (e.g., `Header` in `src/components/layout/header.tsx`) or embedding it in exports (e.g., `DebugConsole` in `src/components/debug-console.tsx`).
    *   **NO HARDCODED version strings related to the application's functional version are permitted in any source file (`.tsx`, `.ts`, etc.).**
    *   The constant `APP_VERSION_FOR_EXPORT` (formerly in `DebugConsole.tsx`) has been **REMOVED**. All export metadata requiring the application version must use the dynamic `appVersion` prop passed to the `DebugConsole` component.
*   **Real Timestamps Mandatory:** The `lastUpdatedTimestamp` field in `src/config/app-metadata.json` **MUST** always be a real, valid ISO 8601 timestamp. Placeholder timestamps are strictly prohibited.
*   **Commit Procedures (for Version Updates):**
    1.  Update `appVersion` and `lastUpdatedTimestamp` in `src/config/app-metadata.json`.
    2.  Update `CHANGELOG_3.0.md` (or relevant changelog for the version series).
    3.  If PRD/Architecture changes, update this `README_3.0.md`.
    4.  **DO NOT** manually modify version strings in other source files like `Header.tsx` or files within `src/components/`; they will reflect the new version dynamically or are managed independently (like commit-specific tags for debugging/export context if ever re-introduced, which is currently not the case for app versioning).

#### 3.5.3. UI/UX Conventions
*   ShadCN components from `components/ui`.
*   Tailwind CSS with theme variables from `globals.css`.
*   `lucide-react` for icons.
*   Responsiveness and accessibility (ARIA).
*   Hydration Mismatch Prevention: Defer client-specific values to `useEffect`.

#### 3.5.4. TypeScript & Data Handling
*   TypeScript with `import type`.
*   Zod schemas for AI flow inputs/outputs and server action payloads/results.
*   `next/image` for images. Placeholders: `https://placehold.co/<width>x<height>.png`.

#### 3.5.5. Server & AI Conventions (Genkit 1.x)
*   Next.js App Router, Server Components, Server Actions.
*   Genkit (`ai` object from `src/ai/genkit.ts`) for all AI definitions.
*   Adhere to Genkit 1.x API syntax.
*   Thinking Mode: `thinkingConfig: { thinkingBudget: ... }` in JSON prompt definitions.
*   Flow Files (`src/ai/flows/*.ts`): `'use server';`, JSDoc, export async wrapper & types.
*   Prompt Definitions (`src/ai/definitions/*.json`): Loaded via dynamic `import()` in `definition-loader.ts`. Handlebars for templating (NO logic).
*   Tools (`ai.defineTool`): For LLM-decided actions.

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
    Genkit Dev UI: `http://localhost:3400`

### 4.5. Building for Production
```bash
npm run build
npm run start
```

---

## 5. Change History & Versioning (StockSage v3.0+)

*   **Current Application Version:** `v3.0.0.1`
    *   Sourced dynamically from `src/config/app-metadata.json`.
*   **This Document Version:** 3.0.1
*   **Historical Changelogs (pre-v3.0.0.0):** Refer to `CHANGELOG.md` in the project root.
*   **v3.0.0.0 Onwards:** Refer to `CHANGELOG_3.0.md` (this is a new file created as part of v3.0.0.1 documentation efforts).

---
