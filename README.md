
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.9.6.0 OPERATING MANUAL**

*   **Document Version:** 1.27 (Task 9.6.0 - FSM Chat Summary Integration)
*   **Date:** 2025-06-13 (Date of last significant structure update, versioning SOP added now)
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. **Phase 9 In Progress. Current application version: v2.9.6.0.**

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
*   **Data Decoupling:** The "Debug" tab serving as the source of raw JSON for "Main" tab displays is a key architectural principle to be upheld.

### **0.4. General Operational Principles**
*   **Incremental Commits:** Each completed and approved task (or sub-task where logical) should result in a state that is "committable." The AI Agent should aim for small, logical changes per XML response, reflecting only the approved scope.
*   **Code Quality:** Prioritize clean, readable, well-organized, and performant code. Use functional components and hooks. Adhere to all specific coding guidelines provided (Next.js, Genkit, etc.).
*   **Error Handling:** Implement robust error handling (Next.js `error.js`, `try-catch`, Toasts for user feedback) as appropriate for any new code.
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
    *   `y`: Current Task number within that Phase.
    *   `z`: Sub-Task or iteration number for that specific Task. This increments with each commit related to the x.y task.
*   **AI Agent Responsibility:** With each user request that results in code changes and an intended commit, the AI Agent **MUST**:
    1.  Determine the correct `2.x.y.z` version based on the current Phase, Task, and the new iteration/sub-task being implemented.
    2.  Update the version string displayed in the application UI, specifically in `src/components/layout/header.tsx`. (This part happens *before* the commit stage, during code generation for the task).
    3.  Update all relevant mentions of the application version within this `README.md` document (e.g., main title, section headers, Phased Implementation Plan status).
    4.  Ensure the `README.md` Changelog (Section 6) and Project Implementation Commit Log (Section 7) are updated to reflect the new version and changes.
    5.  **README.md Update Timing:** All updates to this `README.md` document (including versioning, changelogs, and phased plan status) as described above **SHALL ONLY** be performed during an explicit 'COMMIT' stage, after the user has confirmed the code changes for that task version are ready to be finalized. The AI Agent **MUST NOT** propose `README.md` changes during scoping or iterative code development stages unless specifically instructed otherwise for a unique circumstance.
*   **Example:** If the current phase is 9, current task is 1, and this is the 0th iteration/commit for this task, the version will be `v2.9.1.0`.

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.6.0)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.6.0`).
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling**

The primary strategy for this implementation is **UI-First Development**. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab. This decouples UI presentation logic from backend data fetching and AI processing logic.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Defer backend integrations until the UI structure is stable.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for data.

## **2. High-Level Goals (Current Version v2.9.6.0)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First Implementation Adherence:** Strictly follow the UI-First strategy.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers. **Phase 9 aims to significantly improve this via FSM re-architecture.**
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, clear error reporting, and the client-side debug console. **Phase 9 FSM will add dedicated pipeline logging.**
*   **Dynamic Versioning:** Maintain and display the application version `2.x.y.z` as per SOP (Section 0.6).

## **3. Core Application Features (StockSage v2.9.6.0)**

*(No changes to core features for this task. Focus is on architectural refactoring of the pipeline.)*

### **3.1. Global Application Structure**
*   **Tabbed Interface:** ("Main", "Debug") using ShadCN `Tabs`.
*   **Header & Footer:** Consistent branding and disclaimers. Header displays current dynamic version (e.g., `v2.9.6.0`).
*   **Theme:** Light/Dark theme support.
*   **Disclaimer:** Prominent financial advice disclaimer.
*   **Client-Side Debug Console:** Toggleable console for client-side logs with advanced features. When enabled, all individual log sources default to ON.

### **3.2. "Main" Tab Features**
*   **Stock Analysis Input Area:** Ticker input, API Source (default Polygon.io), "Analyze Stock," "AI Full Stock Analysis" buttons.
*   **Display Card Order & Content:**
    1.  **Key Metrics Display:** Ticker, Price, Day's Change % (formatted, sentiment-colored).
    2.  **Stock Snapshot Details Display:** Detailed price/volume, sentiment colors for changes.
    3.  **Standard Technical Indicators Display:** Formatted multi-window RSI (7,10,14), MACD (value/signal/histogram), VWAP (day/minute), multi-window EMA (5,10,20,50,200), multi-window SMA (5,10,20,50,200) with sentiment colors for RSI (14) and MACD histogram.
    4.  **AI Analyzed Technical Analysis Display:** Formatted Pivot Points (PP, S1-S3, R1-R3) with sentiment color for PP row.
    5.  **AI Key Takeaways Display:** 5 formatted takeaways (Price Action, Trend, Volatility, Momentum, Patterns) with sentiment highlighting.
    6.  **Options Chain Table Display:** Formatted table (Calls/Strike/Puts), ATM highlighting, dynamic header. Columns: Gamma, IV, % Chg, Bid, Ask, Last, Volume, Open Int, Delta.
    7.  **AI Analyzed Options Chain Display:** Expandable card (Accordion) showing AI-identified Call/Put "Walls" and "OI Clusters" based on Open Interest analysis (min 1, max 3 walls per side; min 0, max 3 clusters per side).
    8.  **AI Chatbot Interface:** Chat UI, example prompts, history export/copy. Context from Debug Tab JSONs (including new AI Options Analysis). Initial message for full analysis is an AI-generated summary.
    9.  **Market Status Display:** Relevant market/exchange status (excluding Crypto/FX).
*   **Data Export Controls:**
    *   "Export/Copy All Data to JSON" (Snapshot, Standard TAs, AI Analyzed TA, AI Options Analysis, Options, Market Status).
    *   Specific exports: Key Takeaways (Text, JSON, CSV), Options Chain (CSV), AI Options Analysis (JSON).

### **3.3. "Debug" Tab Features**
*   **Raw JSON Display Areas:** Read-only `Textarea` components for: Polygon API Request/Response Logs, Market Status, Stock Snapshot, Standard TAs, Options Chain, AI Analyzed TA Request/Response, AI Options Analysis Request/Response, AI Key Takeaways Request/Response, Chatbot Request/Response (will contain Chat Summary request/response during full analysis), **FSM Log display (via Client Debug Console)**.
*   **Data Export Controls:** Buttons to copy raw JSON from each `Textarea`.
*   **Client Debug Log Settings:** Controls for the client-side debug console log categories, including "Enable All Sources" and "Disable All Sources" buttons.

### **3.4. Backend Functionality**
*   **Data Retrieval (Polygon.io via `@polygon.io/client-js`):** Market Status, Ticker Snapshot (current/prev day, minute bar), Standard TAs (multi-window RSI, EMA, SMA; MACD; VWAP day/minute), Options Chain Snapshot (nearest Friday, +/-10-11 strikes, descending sort by strike).
*   **AI Analyzed Technical Analysis (Genkit Flow):** Classic Daily Pivot Points.
*   **AI Analyzed Options Chain (Genkit Flow):** Identification of Call/Put Walls and OI Clusters (min 1/max 3 walls per side; min 0/max 3 clusters per side) based on Open Interest.
*   **AI Key Takeaways (Genkit Flow):** 5 takeaways with sentiment, aware of AI Analyzed TA, and AI Options Analysis.
*   **AI Chat Summary (Genkit Flow - New in Phase 9.6):** Generates a textual summary of all analysis steps (Snapshot, TAs, AI TA, AI Key Takeaways, AI Options Analysis, Market Status) to serve as the initial message in the chatbot for a full analysis.
*   **AI Chatbot (Genkit Flow):** Contextual chat, Markdown, emojis, aware of AI Analyzed TA and AI Options Analysis.
*   **Data Formatting:** Numerical data (max 2 decimal places for display), monetary values ("$" prefix).

## **4. Technology Stack (Mandatory)**

*   **Frontend Framework:** Next.js (latest stable v14.x or v15.x, **App Router mandatory**)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI (latest stable)
*   **Icons:** Lucide React (latest stable)
*   **Styling:** Tailwind CSS (latest stable v3.x)
*   **AI Integration:** Genkit (latest stable **v1.x series**)
*   **AI Model Provider:** Google AI (using `@genkit-ai/googleai`)
*   **Default AI Model:** `googleai/gemini-2.5-flash-preview-05-20`
*   **State Management:** React Context API, `useActionState` for server actions. **Phase 9 introduces `useReducer` for FSM pipeline state management within the context.**
*   **Data Fetching (External API):** **Polygon.io REST Client (`@polygon.io/client-js` version `^7.3.2` or latest compatible stable)**.
*   **Deployment Target (Initial):** Firebase App Hosting
*   **Build Tooling:** Next.js CLI (Turbopack enabled by default: `next dev --turbopack`).

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**

(This section re-emphasizes guidelines already stated or implied in Section 0, but tailored for quick reference related to tech stack specifics. **Section 0 remains the master directive.**)

#### **4.1.1. Next.js Specifics**
*   App Router, Server Components by default, Server Actions, `next/image` (with `placehold.co` and `data-ai-hint`), single root JSX.

#### **4.1.2. Genkit (v1.x) Specifics**
*   **Initialization**: Use global `ai` object. `enableOpenTelemetry: false` is critical. `@genkit-ai/next` is NOT used.
*   **Strict v1.x Syntax**: Adhere to `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`.
*   **Flow Structure**: `'use server';`, JSDoc, Zod schemas, export wrapper function & types.
*   **Prompts**: Handlebars only. NO direct function calls/`await` in templates. Media via data URIs (`{{media url=...}}`). Format instructions in prompt.
*   **Tools**: Use `ai.defineTool` if LLM needs to *decide* to fetch data/act. Not for always-needed data.
*   **Gemini Model ID Format**: **MUST be `googleai/MODEL_NAME`** (e.g., `googleai/gemini-2.5-flash-preview-05-20`).
*   **Safety Settings**: Configure as needed (e.g., `BLOCK_ONLY_HIGH` for chat).
*   **Model IDs File**: Centralize in `src/ai/models.ts`.
*   **Zod Imports for Schemas**: When defining Zod schemas in `src/ai/schemas/*.ts` files that might be imported (even for type inference) by client-side code, **MUST use `import {z} from 'zod';`** NOT `import {z} from 'genkit';`. This is critical to prevent Webpack from bundling server-side Genkit machinery (see Section 4.1.6.2).

#### **4.1.3. Data Fetching (Polygon.io)**
*   **Mandatory Library:** `@polygon.io/client-js`. No custom `fetch` to Polygon.
*   **Adapter Pattern:** Abstract calls in `src/services/data-sources/adapters/polygon-adapter.ts`.
*   **Output:** Raw JSON for Debug Tab, consumed by Main Tab formatters.

#### **4.1.4. Styling & UI (ShadCN & Tailwind)**
*   Use `Tabs` for Main/Debug. HSL CSS variables in `globals.css`. **NO hardcoded color classes outside semantic definitions (positive, destructive, warning, accent, primary etc.).**
*   Prefer ShadCN components. Responsive and accessible.

#### **4.1.5. State Management**
*   React Context API (`StockAnalysisProvider`) for global state (Debug Tab JSONs).
*   `useActionState` for server actions.
*   **Phase 9 Addition:** `useReducer` within `StockAnalysisProvider` for managing the FSM state of the analysis pipeline.

#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**

This section documents critical issues encountered during development and their resolutions. Understanding these is key to maintaining stability.

##### **4.1.6.1. `async_hooks` & Turbopack Build Failures (Historically a Major Blocker)**
*   **Context:** Previous development phases encountered persistent `async_hooks` errors during Next.js builds (`next build`), particularly when Turbopack was enabled and Genkit (especially `@genkit-ai/next`) was integrated. These errors often presented as segmentation faults or cryptic messages related to asynchronous context propagation.
*   **Resolution/Mitigation (Commit `c14e3af6` and ongoing):**
    1.  **CRITICAL: DO NOT re-add `genkitPluginNextjs()` or the `@genkit-ai/next` package.** This package was identified as a primary source of incompatibility with Turbopack's handling of `async_hooks`. Its removal was essential for build stability.
    2.  **CRITICAL: Ensure `enableOpenTelemetry: false` in `src/ai/genkit.ts` (`genkit()`_config).** While OpenTelemetry is powerful, its deep integration with async context can conflict with Next.js/Turbopack. Disabling it at the Genkit initialization level is mandatory.
    3.  **Extreme Caution with New Dependencies:** Be highly cautious when adding new dependencies, especially those related to Application Performance Monitoring (APM), tracing, or deep Node.js/async operations. Thoroughly test builds after adding such packages.
    4.  **Keep `next.config.js` Simple:** **AVOID Webpack `resolve.fallback` configurations** or other complex Webpack customizations in `next.config.js` unless absolutely unavoidable and thoroughly tested. These can interfere with Next.js's built-in handling of modules and bundling. The current simple `next.config.ts` (only handling image remote patterns and ignoring build errors for TypeScript/ESLint) is the stable baseline.
*   **CRITICAL INSTRUCTION FOR USER (AND AI AGENT):** If `async_hooks`-related errors (or similar difficult-to-diagnose build failures) reappear, a **full local environment re-initialization (as per `reinit.md`) MUST be performed by the user.** This is the first and most critical troubleshooting step. If errors persist *after* a full re-init, the issue must be flagged immediately to the user for deeper investigation. The AI Agent should not attempt complex Webpack fallbacks.

##### **4.1.6.2. Client-Side Bundling of Server Code (Webpack "Module not found" Errors) - RESOLVED**
*   **Context (Post-Mortem of Commit `fc96d65a`):** After resolving the `async_hooks` issue by removing `@genkit-ai/next` (commit `c14e3af6`), the project faced new build failures: "Module not found" errors for Node.js built-in modules (e.g., `tls`, `net`, `dns`, `http2`) and server-side OpenTelemetry components (e.g., `@opentelemetry/exporter-jaeger`). These errors indicated that Webpack was attempting to bundle server-only code into the client application.
*   **Root Cause:**
    1.  **Problematic Zod Import:** Client-side schema definition files (`src/ai/schemas/*.ts`) were importing the Zod utility (`z`) directly from the main `genkit` package: `import {z} from 'genkit';`.
    2.  **Dependency Chain:** Since these schema files (or types derived from them) were ultimately imported by client-side components (e.g., `Chatbot.tsx` using types from `chat-schemas.ts`), Webpack traced this dependency.
    3.  **Full Package Exposure:** Importing `z` from `genkit`'s main entry point exposed the entire `genkit` package to Webpack's bundling process. This allowed Webpack to "see" and attempt to bundle `genkit`'s full suite of functionalities, including its server-side tracing capabilities which depend on `@opentelemetry/sdk-node` and, by extension, `@grpc/grpc-js`.
    4.  **Effect of `@genkit-ai/next` Removal:** The `@genkit-ai/next` package, while causing `async_hooks` issues, likely provided implicit Webpack configurations or shims that previously (and perhaps imperfectly) prevented or mitigated the bundling of these deep server-side dependencies. Its removal (a necessary fix for `async_hooks`) unmasked this latent bundling problem.
    5.  **`enableOpenTelemetry: false` vs. Bundling:** The `enableOpenTelemetry: false` flag in `src/ai/genkit.ts` correctly prevents OpenTelemetry *runtime* initialization but **does not** stop Webpack from *attempting to bundle* the imported code if it's part of an import chain originating from client-side code.
*   **Resolution (Commit `fc96d65a`):**
    *   The Zod import in all relevant schema files (`src/ai/schemas/ai-analyzed-ta-schemas.ts`, `src/ai/schemas/chat-schemas.ts`, `src/ai/schemas/stock-analysis-schemas.ts`, and new `src/ai/schemas/ai-options-analysis-schemas.ts`) was changed from `import {z} from 'genkit';` to **`import {z} from 'zod';`**.
    *   This critical change decouples the schema definitions from the main `genkit` server-side package, allowing Webpack to correctly tree-shake the client bundle and exclude Node.js-specific modules and OpenTelemetry server components.
*   **Lesson Learned & Critical Guideline for AI Agent:**
    *   **To prevent client-side bundling of server-only Genkit code, any schema files (`src/ai/schemas/*.ts`) that are, or whose types are, consumed (directly or indirectly) by client-side components MUST always import `zod` directly using `import {z} from 'zod';`**.
    *   **DO NOT use `import {z} from 'genkit';` in such schema files.** This is a primary cause of Webpack attempting to bundle server-side Node.js modules and OpenTelemetry components into the client, leading to "Module not found" errors.
    *   The removal of `@genkit-ai/next` was essential for `async_hooks` stability, but it requires stricter adherence to separating client-safe imports.
    *   The AI Agent **MUST** verify this Zod import pattern for any *new* schema files it creates or modifies that are intended for client-side type consumption. Failure to do so risks reintroducing critical build failures.
    *   **Reinforcement (Commit `69bcf1a6`):** An enhanced client-side execution guard has been added to `src/ai/genkit.ts`. If this server-only module is ever executed in a client environment (e.g., due to a new problematic import chain), it will throw an error in development and log a critical error in production, aiding in rapid diagnosis.

##### **4.1.6.3. Incorrect `'use server';` Directive on Non-Action Modules (e.g., `genkit.ts`) - RESOLVED**
*   **Context (Post-Mortem of Commit `8d199845`):** After resolving the schema import issues, the project faced a persistent build error: "A 'use server' file can only export async functions, found object."
*   **Root Cause:**
    1.  The file `src/ai/genkit.ts`, which initializes and exports the main `ai` Genkit instance (an object), incorrectly had the `'use server';` directive at the top of the file.
    2.  The `'use server';` directive, when placed at the top of a file, signals to Next.js that *all* exports from that file are Server Actions. Server Actions must be functions (typically async).
    3.  Exporting the `ai` object from `src/ai/genkit.ts` while it was marked with `'use server';` directly violated this Next.js rule, as an object is not an async function.
*   **Resolution (Commit `8d199845`):**
    *   The `'use server';` directive was **removed** from `src/ai/genkit.ts`.
    *   This allows `src/ai/genkit.ts` to function as a standard server-side module that exports the configured `ai` object. Other server-side modules (like Genkit flows, which *are* correctly marked with `'use server';` for their exported action functions) can then import and use this `ai` instance without issue.
*   **Lesson Learned & Critical Guideline for AI Agent:**
    *   The `'use server';` directive should **only** be used in files where *all* exports are intended to be Server Actions (async functions callable from the client or other server components).
    *   For modules that primarily configure instances, export constants, or provide utility objects/functions for use *within other server-side code* (and are not themselves Server Actions), the `'use server';` directive should **not** be used at the top of the file. This was the case for `src/ai/genkit.ts`. It also applies to files like `src/ai/models.ts`, schema files (`src/ai/schemas/*.ts`), and general utility files (`src/lib/*.ts`) if they are not exporting Server Actions.
    *   Flow files (`src/ai/flows/*.ts`) and Server Action files (`src/actions/*.ts`) correctly use `'use server';` because they export async functions.
    *   The AI Agent **MUST** verify the correct use (or absence) of the `'use server';` directive based on a file's intended exports and usage context, especially for core configuration files or utility modules.

##### **4.1.6.4. General Genkit v1.x Syntax & Data Flow**
*   **Genkit v1.x Syntax:** Strict adherence to the v1.x syntax (e.g., `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`) is crucial.
*   **Data Flow:** Maintain the established data flow: Raw data from sources -> "Debug" Tab JSONs (held in `StockAnalysisContext` state) -> "Main" Tab components read and format from this state. **Phase 9 will refactor how this state is managed and updated via an FSM.**

##### **4.1.6.5. Client-Side Debug Console (`DebugConsole.tsx`)**
*   The `DebugConsole.tsx` component with its advanced filtering, search, and export features is now stable and the primary tool for client-side debugging. Ensure `logDebug` calls are used appropriately to populate it. Default source toggles now ON.

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9 In Progress. Current application version: v2.9.6.0.)*

---
**Phase 0: Project Setup & Core Layout** - Status: **COMPLETE**
*   (Tasks 0.1 - 0.6)

---
**Phase 1: UI Shell Implementation - "Debug" Tab** - Status: **COMPLETE**
*   (Tasks 1.1 - 1.3)

---
**Phase 2: UI Shell Implementation - "Main" Tab (Part 1)** - Status: **COMPLETE**
*   (Tasks 2.1 - 2.5)

---
**Phase 3: UI Shell Implementation - "Main" Tab (Part 2: Options)** - Status: **COMPLETE**
*   (Task 3.1)

---
**Phase 4: Backend Data Fetching & "Debug" Tab Population** - Status: **COMPLETE**
*   (Tasks 4.1 - 4.5.1)

---
**Phase 5: AI Logic Implementation & "Debug" Tab Population** - Status: **COMPLETE**
*   (Tasks 5.1 - 5.3)

---
**Phase 6: Connecting "Main" Tab UI to Live Data** - Status: **COMPLETE**
*   (Tasks 6.1 - 6.6.2)

---
**Phase 7: Data Export & Final Client-Side Features** - Status: **COMPLETE**
*   (Tasks 7.1 - 7.2)

---
**Phase 8: Final Styling, Cleanup, Documentation & Stability** - Status: **COMPLETE**
*   (Tasks 8.1 - 8.8.5)

---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **IN PROGRESS**
*   **Task 9.1: FSM Core Setup & Initial State Integration (v2.9.1.0):** - Status: **COMPLETE** (Commit: `544f6005`)
    *   **Sub-Task 9.1.0:** Defined FSM types (states: `IDLE`, `INITIALIZING_ANALYSIS`, `AWAITING_DATA_FETCH_TRIGGER`; events: `START_PARTIAL_ANALYSIS`, `START_FULL_ANALYSIS`, `INITIALIZATION_COMPLETE`) in `stock-analysis-context.tsx`. Implemented `useReducer` and initial `fsmReducer` logic. `MainTabContent.tsx` updated to dispatch FSM events. Placeholder setting and chat history clearing now handled by FSM logic upon entering `INITIALIZING_ANALYSIS`. Added `FSM_PIPELINE` log source. Application version updated to `v2.9.1.0`.
*   **Task 9.2: Integrate Data Fetching into FSM (v2.9.2.0):** - Status: **COMPLETE** (Commit: `d8eff27b`)
    *   **Sub-Task 9.2.0:** Extended FSM with states (`FETCHING_DATA`, `DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`) and events (`TRIGGER_DATA_FETCH`, `FETCH_DATA_SUCCESS`, `FETCH_DATA_FAILURE`) in `stock-analysis-context.tsx`. `fsmReducer` now handles these, updating context JSONs (market status, snapshot, TAs, options, Polygon logs) based on fetch success/failure. `MainTabContent.tsx` triggers `fetchStockDataAction` via FSM state and dispatches success/failure FSM events based on `analyzeStockState`. Application version updated to `v2.9.2.0`.
*   **Task 9.3: Integrate AI Analyzed TA into FSM (v2.9.3.0):** - Status: **COMPLETE** (Commit: `bbc610b0`)
    *   **Sub-Task 9.3.0:** Further extended FSM in `stock-analysis-context.tsx` with states for AI TA (`AWAITING_AI_TA_TRIGGER`, `ANALYZING_TA`, `AI_TA_SUCCEEDED`, `AI_TA_FAILED`, `PARTIAL_ANALYSIS_COMPLETE`, `AWAITING_KEY_TAKEAWAYS_TRIGGER`) and events (`TRIGGER_AI_TA`, `AI_TA_SUCCESS`, `AI_TA_FAILURE`). FSM reducer now calls context setters for `aiAnalyzedTaJson` and handles branching logic for full/partial analysis. Subsequent AI step JSONs (Key Takeaways, Options Analysis) set to "skipped" if AI TA fails. `MainTabContent.tsx` triggers `analyzeTaAction` based on FSM state and translates `analyzeTaState` outcomes into FSM events. Header displays `v2.9.3.0`.
*   **Task 9.4: Integrate AI Key Takeaways into FSM (v2.9.4.0):** - Status: **COMPLETE** (Commit: `a70d937a`)
    *   **Sub-Task 9.4.0:** Extended FSM in `stock-analysis-context.tsx` for AI Key Takeaways (`AWAITING_KEY_TAKEAWAYS_TRIGGER`, `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`, `AWAITING_OPTIONS_ANALYSIS_TRIGGER`) and events (`TRIGGER_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCESS`, `KEY_TAKEAWAYS_FAILURE`). FSM reducer updates `aiKeyTakeawaysJson` and handles branching. Subsequent AI steps (Options Analysis, Chat) set to "skipped" if Key Takeaways fail or AI TA failed. `MainTabContent.tsx` triggers `performAiAnalysisAction` based on FSM state and dispatches FSM events from `performAiAnalysisState`. Header displays `v2.9.4.0`.
*   **Task 9.5: Integrate AI Options Analysis into FSM (v2.9.5.0):** - Status: **COMPLETE** (Commit: `d5fe9d27`)
    *   **Sub-Task 9.5.0:** Extended FSM in `stock-analysis-context.tsx` for AI Options Analysis (`AWAITING_OPTIONS_ANALYSIS_TRIGGER`, `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED`, `OPTIONS_ANALYSIS_FAILED`, `AWAITING_CHAT_SUMMARY_TRIGGER`) and events (`TRIGGER_OPTIONS_ANALYSIS`, `OPTIONS_ANALYSIS_SUCCESS`, `OPTIONS_ANALYSIS_FAILURE`). FSM reducer updates `aiOptionsAnalysisJson`. Subsequent AI steps (Chat Summary) set to "skipped" if Options Analysis fails or prior AI steps failed. `MainTabContent.tsx` triggers `performAiOptionsAnalysisAction` based on FSM state and dispatches FSM events from `performAiOptionsAnalysisState`. Header displays `v2.9.5.0`.
*   **Task 9.6: Integrate Chat Summary (Full Analysis) into FSM (v2.9.6.0):** - Status: **COMPLETE** (Commit: `f4ed4f56`)
    *   **Sub-Task 9.6.0:** Added `GenerateFullAnalysisSummaryInputSchema` and `GenerateFullAnalysisSummaryOutputSchema` in `src/ai/schemas/chat-summary-schemas.ts`. Implemented `generate-full-analysis-summary-flow.ts` Genkit flow and `generate-chat-summary-action.ts` server action. Extended FSM in `stock-analysis-context.tsx` with states (`GENERATING_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCEEDED`, `CHAT_SUMMARY_FAILED`, `FULL_ANALYSIS_COMPLETE`) and events (`TRIGGER_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCESS`, `CHAT_SUMMARY_FAILURE`). FSM reducer now populates `chatbotRequestJson` and `chatbotResponseJson` (with summary), and initializes `chatHistory` with the AI-generated summary. `MainTabContent.tsx` triggers `generateChatSummaryAction` via FSM. Header displays `v2.9.6.0`.
*   **Task 9.7: FSM Finalization & Error Handling Polish:** - Status: **PENDING**
*   **Task 9.8: Update README.md for Phase 9 Completion:** - Status: **PENDING**


## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                                                           |
| :------ | :----------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-06-09   | Firebase Studio (AI Prototyper) | Initial draft of the Re-Implementation PRD for v2.1.0 with UI-First strategy.                                                                                                                                                                                                                                |
| ...     | ...          | ...                           | ... (Previous changelog entries remain, ensure consistency) ...                                                                                                                                                                                                                                             |
| 1.25    | 2025-06-13   | Firebase Studio (AI Prototyper) | **Task 9.4.0 (FSM AI Key Takeaways Integration) COMPLETE.** Application version `v2.9.4.0`. Extended FSM in `stock-analysis-context.tsx` for AI Key Takeaways (`AWAITING_KEY_TAKEAWAYS_TRIGGER`, `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`, `AWAITING_OPTIONS_ANALYSIS_TRIGGER`) and events (`TRIGGER_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCESS`, `KEY_TAKEAWAYS_FAILURE`). FSM reducer updates `aiKeyTakeawaysJson`. Subsequent AI steps (Options Analysis, Chat) set to "skipped" if Key Takeaways fail or AI TA failed. `MainTabContent.tsx` triggers `performAiAnalysisAction` based on FSM state and dispatches FSM events from `performAiAnalysisState`. Header displays `v2.9.4.0`. Phase 9 Task 9.4.0 status updated. **Commit: `a70d937a`** |
| 1.26    | 2025-06-13   | Firebase Studio (AI Prototyper) | **Task 9.5.0 (FSM AI Options Analysis Integration) COMPLETE.** Application version `v2.9.5.0`. Extended FSM in `stock-analysis-context.tsx` for AI Options Analysis (`AWAITING_OPTIONS_ANALYSIS_TRIGGER`, `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED`, `OPTIONS_ANALYSIS_FAILED`, `AWAITING_CHAT_SUMMARY_TRIGGER`) and events (`TRIGGER_OPTIONS_ANALYSIS`, `OPTIONS_ANALYSIS_SUCCESS`, `OPTIONS_ANALYSIS_FAILURE`). FSM reducer updates `aiOptionsAnalysisJson`. Subsequent AI steps (Chat Summary) set to "skipped" if Options Analysis fails or prior AI steps failed. `MainTabContent.tsx` triggers `performAiOptionsAnalysisAction` based on FSM state and dispatches FSM events from `performAiOptionsAnalysisState`. Header displays `v2.9.5.0`. Phase 9 Task 9.5.0 status updated. **Commit: `d5fe9d27`** |
| **1.27**| **2025-06-13**| Firebase Studio (AI Prototyper) | **Task 9.6.0 (FSM Chat Summary Integration) COMPLETE.** Application version `v2.9.6.0`. Added new AI flow (`generate-full-analysis-summary-flow.ts`), schema (`chat-summary-schemas.ts`), and server action (`generate-chat-summary-action.ts`). Extended FSM in `stock-analysis-context.tsx` with states (`GENERATING_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCEEDED`, `CHAT_SUMMARY_FAILED`, `FULL_ANALYSIS_COMPLETE`) and events (`TRIGGER_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCESS`, `CHAT_SUMMARY_FAILURE`). FSM reducer now manages chat summary generation, populates `chatbotRequestJson` and `chatbotResponseJson` (with summary), and initializes `chatHistory` with the AI summary as the first message on full analysis. `MainTabContent.tsx` orchestrates this via FSM. Header displays `v2.9.6.0`. Phase 9 Task 9.6.0 status updated. **Commit: `f4ed4f56`** |


## **7. Project Implementation Commit Log (StockSage App Version)**

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme.

---
**App Version:** `v2.1.0` (Covers commits up to `d1a5e67f` which completed Phase 8 core features before dynamic versioning)

**Tag:** `Phase-0_Task-0.6` ([v0.0.6])
**Subject:** `feat: Complete Phase 0 - Project Setup & Core Layout`
... (Previous commit logs remain)

---
**App Version:** `v2.9.1.0` (FSM Core Setup)
**Tag:** `Phase-9_Task-9.1.0_FSM-Core-Setup` - Commit Hash: `544f6005`
**Subject:** `feat(arch): Initialize FSM for analysis pipeline and integrate initial states (v2.9.1.0)`
**Details:**
This commit implements Task v2.9.1.0, starting Phase 9 by laying the groundwork for a Finite State Machine (FSM) to manage the analysis pipeline.
- **FSM Core (`stock-analysis-context.tsx`):**
    - Defined `FsmState` enum (`IDLE`, `INITIALIZING_ANALYSIS`, `AWAITING_DATA_FETCH_TRIGGER`).
    - Defined `FsmEvent` types (`START_PARTIAL_ANALYSIS`, `START_FULL_ANALYSIS`, `INITIALIZATION_COMPLETE`).
    - Implemented an `fsmReducer` to handle transitions between these initial states.
    - Integrated `useReducer` to manage `fsmState` and expose `dispatchFsmEvent`.
    - Logic for setting placeholders and clearing chat history moved into the FSM reducer logic triggered by `START_PARTIAL/FULL_ANALYSIS` events.
    - `isFullAnalysisTriggered` flag in context now set based on FSM event.
- **UI Integration (`main-tab-content.tsx`):**
    - "Analyze Stock" and "AI Full Stock Analysis" buttons now dispatch `START_PARTIAL_ANALYSIS` and `START_FULL_ANALYSIS` FSM events, respectively.
    - Initial `useEffect` added to react to `fsmState` (specifically `INITIALIZING_ANALYSIS` to dispatch `INITIALIZATION_COMPLETE`).
- **Logging (`debug-log-types.ts`):**
    - Added new `FSM_PIPELINE` log source.
- **Versioning:** UI header and `README.md` updated to `v2.9.1.0`. Phase 9 introduced in README. **New README.md update protocol added to Section 0.6.**

---
**App Version:** `v2.9.2.0` (FSM Data Fetch Integration)
**Tag:** `Phase-9_Task-9.2.0_FSM-Data-Fetch` - Commit Hash: `d8eff27b`
**Subject:** `feat(fsm): Integrate data fetching step into FSM pipeline (v2.9.2.0)`
**Details:**
This commit implements Task v2.9.2.0, further developing the FSM by integrating the data fetching process.
- **FSM Enhancements (`stock-analysis-context.tsx`):**
    - Added new FSM states: `FETCHING_DATA`, `DATA_FETCH_SUCCEEDED`, `DATA_FETCH_FAILED`.
    - Added new FSM events: `TRIGGER_DATA_FETCH`, `FETCH_DATA_SUCCESS` (with `StockDataFetchResult` payload), `FETCH_DATA_FAILURE` (with error payload).
    - `fsmReducer` updated to handle these new states and events:
        - `AWAITING_DATA_FETCH_TRIGGER` -> `FETCHING_DATA` on `TRIGGER_DATA_FETCH`.
        - `FETCHING_DATA` -> `DATA_FETCH_SUCCEEDED` on `FETCH_DATA_SUCCESS`. Context JSONs (market status, snapshot, TAs, options, Polygon logs) are updated from the payload.
        - `FETCHING_DATA` -> `DATA_FETCH_FAILED` on `FETCH_DATA_FAILURE`. Context JSONs updated with error/skipped status. Subsequent AI step JSONs also set to skipped.
        - `DATA_FETCH_SUCCEEDED` -> `AWAITING_AI_TA_TRIGGER` (next step).
        - `DATA_FETCH_FAILED` -> `IDLE`, resets `isFullAnalysisTriggered`.
- **UI Integration (`main-tab-content.tsx`):**
    - `useEffect` added to dispatch `TRIGGER_DATA_FETCH` when `fsmState` is `AWAITING_DATA_FETCH_TRIGGER`.
    - `useEffect` added to call `analyzeStockFormAction` when `fsmState` is `FETCHING_DATA`.
    - The `useEffect` hook reacting to `analyzeStockState` (from `fetchStockDataAction`) now dispatches FSM events (`FETCH_DATA_SUCCESS` or `FETCH_DATA_FAILURE`) with the server action's payload, instead of directly setting context JSONs.
- **Versioning:** UI header updated to `v2.9.2.0`. `README.md` updated to reflect completion of Task 9.2.0 and app version `v2.9.2.0`.

---
**App Version:** `v2.9.3.0` (FSM AI TA Integration)
**Tag:** `Phase-9_Task-9.3.0_FSM-AI-TA` - Commit Hash: `bbc610b0`
**Subject:** `feat(fsm): Integrate AI Analyzed TA step into FSM pipeline (v2.9.3.0)`
**Details:**
This commit implements Task v2.9.3.0, integrating the AI Analyzed Technical Analysis step into the FSM.
- **FSM Enhancements (`stock-analysis-context.tsx`):**
    - Added new FSM states: `AWAITING_AI_TA_TRIGGER`, `ANALYZING_TA`, `AI_TA_SUCCEEDED`, `AI_TA_FAILED`, `PARTIAL_ANALYSIS_COMPLETE`, `AWAITING_KEY_TAKEAWAYS_TRIGGER`.
    - Added new FSM events: `TRIGGER_AI_TA`, `AI_TA_SUCCESS` (with `AnalyzeTaResult` payload), `AI_TA_FAILURE` (with error payload).
    - `fsmReducer` updated to handle these:
        - `DATA_FETCH_SUCCEEDED` -> `AWAITING_AI_TA_TRIGGER`.
        - `AWAITING_AI_TA_TRIGGER` -> `ANALYZING_TA` on `TRIGGER_AI_TA`. Sets `aiAnalyzedTaJson` to pending.
        - `ANALYZING_TA` -> `AI_TA_SUCCEEDED` on `AI_TA_SUCCESS`. Updates `aiAnalyzedTaRequestJson` and `aiAnalyzedTaJson` from payload.
        - `ANALYZING_TA` -> `AI_TA_FAILED` on `AI_TA_FAILURE`. Updates context JSONs with error/skipped status. Subsequent AI step JSONs (Key Takeaways, Options Analysis) also set to skipped.
        - `AI_TA_SUCCEEDED` -> `AWAITING_KEY_TAKEAWAYS_TRIGGER` (if full analysis) or `PARTIAL_ANALYSIS_COMPLETE` (if partial).
        - `AI_TA_FAILED` -> `AWAITING_KEY_TAKEAWAYS_TRIGGER` (if full analysis, noting TA failure) or `IDLE` (if partial).
- **UI Integration (`main-tab-content.tsx`):**
    - `useEffect` added to dispatch `TRIGGER_AI_TA` when `fsmState` is `AWAITING_AI_TA_TRIGGER` (and `stockSnapshotJson` is valid).
    - `useEffect` added to call `analyzeTaFormAction` when `fsmState` is `ANALYZING_TA` (and `stockSnapshotJson` is valid). If snapshot invalid, dispatches `AI_TA_FAILURE`.
    - The `useEffect` hook reacting to `analyzeTaState` now dispatches FSM events (`AI_TA_SUCCESS` or `AI_TA_FAILURE`) with the server action's payload.
- **Versioning:** UI header updated to `v2.9.3.0`. `README.md` updated to reflect completion of Task 9.3.0 and app version `v2.9.3.0`.

---
**App Version:** `v2.9.4.0` (FSM AI Key Takeaways Integration)
**Tag:** `Phase-9_Task-9.4.0_FSM-Key-Takeaways` - Commit Hash: `a70d937a`
**Subject:** `feat(fsm): Integrate AI Key Takeaways into FSM pipeline (v2.9.4.0)`
**Details:**
This commit implements Task v2.9.4.0, integrating the AI Key Takeaways generation step into the FSM.
- **FSM Enhancements (`stock-analysis-context.tsx`):**
    - Added new FSM states: `AWAITING_KEY_TAKEAWAYS_TRIGGER`, `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED`, `KEY_TAKEAWAYS_FAILED`, `AWAITING_OPTIONS_ANALYSIS_TRIGGER`.
    - Added new FSM events: `TRIGGER_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCESS` (with `PerformAiAnalysisResult` payload), `KEY_TAKEAWAYS_FAILURE` (with error payload).
    - `fsmReducer` updated to handle these:
        - `AI_TA_SUCCEEDED` (full analysis) -> `AWAITING_KEY_TAKEAWAYS_TRIGGER`.
        - `AI_TA_FAILED` (full analysis) -> `AWAITING_KEY_TAKEAWAYS_TRIGGER` (error noted for subsequent steps).
        - `AWAITING_KEY_TAKEAWAYS_TRIGGER` -> `GENERATING_KEY_TAKEAWAYS` on `TRIGGER_KEY_TAKEAWAYS` (unless pre-skipped). Sets `aiKeyTakeawaysJson` to pending.
        - `GENERATING_KEY_TAKEAWAYS` -> `KEY_TAKEAWAYS_SUCCEEDED` on `KEY_TAKEAWAYS_SUCCESS`. Updates context JSONs.
        - `GENERATING_KEY_TAKEAWAYS` -> `KEY_TAKEAWAYS_FAILED` on `KEY_TAKEAWAYS_FAILURE`. Updates context JSONs with error/skipped. Subsequent steps (Options, Chat) also set to skipped.
        - `KEY_TAKEAWAYS_SUCCEEDED` or `KEY_TAKEAWAYS_FAILED` -> `AWAITING_OPTIONS_ANALYSIS_TRIGGER`.
- **UI Integration (`main-tab-content.tsx`):**
    - `useEffect` added to dispatch `TRIGGER_KEY_TAKEAWAYS` when `fsmState` is `AWAITING_KEY_TAKEAWAYS_TRIGGER` (and full analysis).
    - `useEffect` added to call `performAiAnalysisFormAction` when `fsmState` is `GENERATING_KEY_TAKEAWAYS` (with prerequisite checks).
    - The `useEffect` hook reacting to `performAiAnalysisState` now dispatches FSM events (`KEY_TAKEAWAYS_SUCCESS` or `KEY_TAKEAWAYS_FAILURE`).
- **Versioning:** UI header updated to `v2.9.4.0`. `README.md` updated to reflect completion of Task 9.4.0 and app version `v2.9.4.0`.

---
**App Version:** `v2.9.5.0` (FSM AI Options Analysis Integration)
**Tag:** `Phase-9_Task-9.5.0_FSM-Options-Analysis` - Commit Hash: `d5fe9d27`
**Subject:** `feat(fsm): Integrate AI Options Analysis step into FSM pipeline (v2.9.5.0)`
**Details:**
This commit implements Task v2.9.5.0, integrating the AI Options Analysis step into the FSM for full analysis flows.
- **FSM Enhancements (`stock-analysis-context.tsx`):**
    - Added new FSM states: `AWAITING_OPTIONS_ANALYSIS_TRIGGER`, `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED`, `OPTIONS_ANALYSIS_FAILED`, `AWAITING_CHAT_SUMMARY_TRIGGER`.
    - Added new FSM events: `TRIGGER_OPTIONS_ANALYSIS`, `OPTIONS_ANALYSIS_SUCCESS` (with `PerformAiOptionsAnalysisResult` payload), `OPTIONS_ANALYSIS_FAILURE` (with error payload).
    - `fsmReducer` updated to handle these:
        - `KEY_TAKEAWAYS_SUCCEEDED` or `KEY_TAKEAWAYS_FAILED` (full analysis) -> `AWAITING_OPTIONS_ANALYSIS_TRIGGER`.
        - `AWAITING_OPTIONS_ANALYSIS_TRIGGER` -> `ANALYZING_OPTIONS` on `TRIGGER_OPTIONS_ANALYSIS` (unless pre-skipped due to prior failures). Sets `aiOptionsAnalysisJson` to pending.
        - `ANALYZING_OPTIONS` -> `OPTIONS_ANALYSIS_SUCCEEDED` on `OPTIONS_ANALYSIS_SUCCESS`. Updates context JSONs.
        - `ANALYZING_OPTIONS` -> `OPTIONS_ANALYSIS_FAILED` on `OPTIONS_ANALYSIS_FAILURE`. Updates context JSONs with error/skipped. Subsequent steps (Chat Summary) also set to skipped.
        - `OPTIONS_ANALYSIS_SUCCEEDED` or `OPTIONS_ANALYSIS_FAILED` -> `AWAITING_CHAT_SUMMARY_TRIGGER`.
- **UI Integration (`main-tab-content.tsx`):**
    - Added `useActionState` for `performAiOptionsAnalysisAction`.
    - `useEffect` added to dispatch `TRIGGER_OPTIONS_ANALYSIS` when `fsmState` is `AWAITING_OPTIONS_ANALYSIS_TRIGGER` (and full analysis, and prerequisites are met).
    - `useEffect` added to call `performAiOptionsAnalysisFormAction` when `fsmState` is `ANALYZING_OPTIONS` (with prerequisite checks for options chain and snapshot data).
    - A new `useEffect` hook processes `performAiOptionsAnalysisState` to dispatch FSM events (`OPTIONS_ANALYSIS_SUCCESS` or `OPTIONS_ANALYSIS_FAILURE`).
    - Loading indicators on analysis buttons refined to consider `isPerformAiOptionsAnalysisPending`.
- **Versioning:** UI header updated to `v2.9.5.0`. `README.md` updated to reflect completion of Task 9.5.0 and app version `v2.9.5.0`.

---
**App Version:** `v2.9.6.0` (FSM Chat Summary Integration)
**Tag:** `Phase-9_Task-9.6.0_FSM-Chat-Summary` - Commit Hash: `f4ed4f56`
**Subject:** `feat(fsm): Integrate AI Chat Summary into FSM pipeline (v2.9.6.0)`
**Details:**
This commit implements Task v2.9.6.0, integrating AI-generated chat summaries into the FSM for full analysis flows.
- **New AI Flow & Schemas:**
    - `src/ai/schemas/chat-summary-schemas.ts`: Defines `GenerateFullAnalysisSummaryInputSchema` and `GenerateFullAnalysisSummaryOutputSchema`.
    - `src/ai/flows/generate-full-analysis-summary-flow.ts`: Implements Genkit flow to generate a textual summary from all analysis data, acknowledging any prior skipped/errored steps.
- **New Server Action:**
    - `src/actions/generate-chat-summary-action.ts`: Defines `generateChatSummaryAction` to call the new flow.
- **FSM Enhancements (`stock-analysis-context.tsx`):**
    - Added new FSM states: `GENERATING_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCEEDED`, `CHAT_SUMMARY_FAILED`, `FULL_ANALYSIS_COMPLETE`.
    - Added new FSM events: `TRIGGER_CHAT_SUMMARY`, `CHAT_SUMMARY_SUCCESS`, `CHAT_SUMMARY_FAILURE`.
    - `fsmReducer` updated to handle these:
        - `AWAITING_CHAT_SUMMARY_TRIGGER` -> `GENERATING_CHAT_SUMMARY` (if not pre-skipped). Sets `chatbotRequestJson` and `chatbotResponseJson` to pending.
        - `GENERATING_CHAT_SUMMARY` -> `CHAT_SUMMARY_SUCCEEDED`. Updates context JSONs, and critically, initializes `chatHistory` with the AI-generated summary as the first message.
        - `GENERATING_CHAT_SUMMARY` -> `CHAT_SUMMARY_FAILED`. Updates context JSONs with error.
        - `CHAT_SUMMARY_SUCCEEDED` or `CHAT_SUMMARY_FAILED` -> `FULL_ANALYSIS_COMPLETE`.
        - `FULL_ANALYSIS_COMPLETE` -> `IDLE`. Resets `isFullAnalysisTriggered`.
- **UI Integration (`main-tab-content.tsx`):**
    - Added `useActionState` for `generateChatSummaryAction`.
    - `useEffect` added to dispatch `TRIGGER_CHAT_SUMMARY` from `AWAITING_CHAT_SUMMARY_TRIGGER`.
    - `useEffect` added to call `generateChatSummaryFormAction` from `GENERATING_CHAT_SUMMARY`.
    - `useEffect` hook processes `generateChatSummaryState` to dispatch FSM events.
    - Loading indicators refined.
- **Logging & Versioning:**
    - Added `GenerateChatSummaryAction` and `GenerateFullAnalysisSummaryFlow` to `debug-log-types.ts`.
    - UI header updated to `v2.9.6.0`. `README.md` updated to reflect completion of Task 9.6.0 and app version `v2.9.6.0`.

---
*(Future commit logs will follow)*




    