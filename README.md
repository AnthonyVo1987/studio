
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.8.8.4 OPERATING MANUAL**

*   **Document Version:** 1.20 (Task 8.8.4 - AI Options Analysis & TA Renaming)
*   **Date:** 2025-06-12 (Date of last significant structure update, versioning SOP added now)
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. **Phase 8 Core Features Complete. Project adopting dynamic versioning scheme. Current application version: v2.8.8.4.**

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
    2.  Update the version string displayed in the application UI, specifically in `src/components/layout/header.tsx`.
    3.  Update all relevant mentions of the application version within this `README.md` document (e.g., main title, section headers, Phased Implementation Plan status).
    4.  Ensure the `README.md` Changelog (Section 6) and Project Implementation Commit Log (Section 7) are updated to reflect the new version and changes.
*   **Example:** If the current phase is 8, current task is 8, and this is the 4th iteration/commit for this task, the version will be `v2.8.8.4`.

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.8.8.4)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.8.8.4`).
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling**

The primary strategy for this implementation is **UI-First Development**. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab. This decouples UI presentation logic from backend data fetching and AI processing logic.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Defer backend integrations until the UI structure is stable.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for data.

## **2. High-Level Goals (Current Version v2.8.8.4)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First Implementation Adherence:** Strictly follow the UI-First strategy.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, clear error reporting, and the client-side debug console.
*   **Dynamic Versioning:** Maintain and display the application version `2.x.y.z` as per SOP (Section 0.6).

## **3. Core Application Features (StockSage v2.8.8.4)**

### **3.1. Global Application Structure**
*   **Tabbed Interface:** ("Main", "Debug") using ShadCN `Tabs`.
*   **Header & Footer:** Consistent branding and disclaimers. Header displays current dynamic version (e.g., `v2.8.8.4`).
*   **Theme:** Light/Dark theme support.
*   **Disclaimer:** Prominent financial advice disclaimer.
*   **Client-Side Debug Console:** Toggleable console for client-side logs with advanced features.

### **3.2. "Main" Tab Features**
*   **Stock Analysis Input Area:** Ticker input, API Source (default Polygon.io), "Analyze Stock," "AI Full Stock Analysis" buttons.
*   **Display Card Order & Content:**
    1.  **Key Metrics Display:** Ticker, Price, Day's Change % (formatted, sentiment-colored).
    2.  **Stock Snapshot Details Display:** Detailed price/volume, sentiment colors for changes.
    3.  **Standard Technical Indicators Display:** Formatted multi-window RSI (7,10,14), MACD (value/signal/histogram), VWAP (day/minute), multi-window EMA (5,10,20,50,200), multi-window SMA (5,10,20,50,200) with sentiment colors for RSI (14) and MACD histogram.
    4.  **AI Analyzed Technical Analysis Display:** (Formerly "AI-Calculated TA") Formatted Pivot Points (PP, S1-S3, R1-R3) with sentiment color for PP row.
    5.  **Options Chain Table Display:** Formatted table (Calls/Strike/Puts), ATM highlighting, dynamic header. Columns: Gamma, IV, % Chg, Bid, Ask, Last, Volume, Open Int, Delta.
    6.  **AI Analyzed Options Chain Display (NEW):** Expandable card initially showing AI-identified Call and Put "Walls" and "OI Clusters" based on Open Interest analysis (min 1, max 3 walls per side; min 0, max 3 clusters per side).
    7.  **AI Key Takeaways Display:** 5 formatted takeaways (Price Action, Trend, Volatility, Momentum, Patterns) with sentiment highlighting.
    8.  **AI Chatbot Interface:** Chat UI, example prompts, history export/copy. Context from Debug Tab JSONs (including new AI Options Analysis).
    9.  **Market Status Display:** Relevant market/exchange status (excluding Crypto/FX).
*   **Data Export Controls:**
    *   "Export/Copy All Data to JSON" (Snapshot, Standard TAs, AI Analyzed TA, AI Options Analysis, Options, Market Status).
    *   Specific exports: Key Takeaways (Text, JSON, CSV), Options Chain (CSV), AI Options Analysis (JSON).

### **3.3. "Debug" Tab Features**
*   **Raw JSON Display Areas:** Read-only `Textarea` components for: Polygon API Request/Response Logs, Market Status, Stock Snapshot, Standard TAs (new structure), Options Chain, AI Analyzed TA Request/Response, AI Options Analysis Request/Response (NEW), AI Key Takeaways Request/Response, Chatbot Request/Response.
*   **Data Export Controls:** Buttons to copy raw JSON from each `Textarea`.
*   **Client Debug Log Settings:** Controls for the client-side debug console log categories.

### **3.4. Backend Functionality**
*   **Data Retrieval (Polygon.io via `@polygon.io/client-js`):** Market Status, Ticker Snapshot (current/prev day, minute bar), Standard TAs (multi-window RSI, EMA, SMA; MACD; VWAP day/minute), Options Chain Snapshot (nearest Friday, +/-10-11 strikes, descending sort by strike).
*   **AI Analyzed Technical Analysis (Genkit Flow):** Classic Daily Pivot Points.
*   **AI Analyzed Options Chain (Genkit Flow - NEW):** Identification of Call/Put Walls and OI Clusters (min 1/max 3 walls per side; min 0/max 3 clusters per side) based on Open Interest.
*   **AI Key Takeaways (Genkit Flow):** 5 takeaways with sentiment, aware of new TA structure and AI Options Analysis.
*   **AI Chatbot (Genkit Flow):** Contextual chat, Markdown, emojis, aware of new TA structure and AI Options Analysis.
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
*   **State Management:** React Context API, `useActionState` for server actions.
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
    *   The Zod import in all relevant schema files (`src/ai/schemas/ai-analyzed-ta-schemas.ts` (renamed), `src/ai/schemas/chat-schemas.ts`, `src/ai/schemas/stock-analysis-schemas.ts`, and new `src/ai/schemas/ai-options-analysis-schemas.ts`) was changed from `import {z} from 'genkit';` to **`import {z} from 'zod';`**.
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
*   **Data Flow:** Maintain the established data flow: Raw data from sources -> "Debug" Tab JSONs (held in `StockAnalysisContext` state) -> "Main" Tab components read and format from this state. This decouples UI from direct data fetching/processing logic.

##### **4.1.6.5. Client-Side Debug Console (`DebugConsole.tsx`)**
*   The `DebugConsole.tsx` component with its advanced filtering, search, and export features is now stable and the primary tool for client-side debugging. Ensure `logDebug` calls are used appropriately to populate it.

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 8 Core Features Complete. Project adopting dynamic versioning scheme. Current application version: v2.8.8.4.)*

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
*   **Task 8.1: UI & Styling Review (Sentiment Colors Refactor):** - Status: **COMPLETE** (Commit: `b6bc90e8`)
*   **Task 8.2: Update `README.md` to AI Operating Manual:** - Status: **COMPLETE** (Commit: `b6bc90e8`)
*   **Task 8.3: Prepare Firebase Deployment Config:** - Status: **PENDING** (Deferred)
*   **Task 8.4: Final Code Review & Cleanup:** - Status: **COMPLETE** (Commit: `bef12d70`)
*   **Task 8.5: Resolve Critical Build Failures & Confirm Stability (Zod Imports):** - Status: **COMPLETE** (Commit: `fc96d65a`)
*   **Task 8.6: Resolve Critical Build Failures & Confirm Stability ('use server' on `genkit.ts`):** - Status: **COMPLETE** (Commit: `8d199845`)
*   **Task 8.7.0: Deep Dive Audit (Post v8.6.0) & Minor Cleanup:** - Status: **COMPLETE** (Part of Commit: `69bcf1a6`)
*   **Task 8.7.1: Add Enhanced Client Execution Guard to `genkit.ts`:** - Status: **COMPLETE** (Part of Commit: `69bcf1a6`)
*   **Task 8.8.0: Final Audit & Minor Log Refinement:** - Status: **COMPLETE** (Part of Commit: `d1a5e67f`)
*   **Task 8.8.1: Final Proactive Audit (Post Task 8.8.0):** - Status: **COMPLETE** (Part of Commit: `d1a5e67f`)
*   **Task 8.8.2: Implement Dynamic Version Display & SOP (Version: v2.8.8.2):** - Status: **COMPLETE** (Commit: `07817f2a`)
*   **Task 8.8.3: Update TA Data & Display (Multi-Window, VWAP Minute) (Version: v2.8.8.3):** - Status: **COMPLETE** (Commit: `b222bbfd`)
*   **Task 8.8.4: AI Analyzed Options Chain (Call/Put Walls & OI Clusters) & TA Renaming (Current version: v2.8.8.4):** - Status: **IN PROGRESS (Current Task - Commit pending)**


## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                                                           |
| :------ | :----------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-06-09   | Firebase Studio (AI Prototyper) | Initial draft of the Re-Implementation PRD for v2.1.0 with UI-First strategy.                                                                                                                                                                                                                                |
| ...     | ...          | ...                           | ... (Previous changelog entries remain, ensure consistency) ...                                                                                                                                                                                                                                             |
| 1.18    | 2025-06-12   | Firebase Studio (AI Prototyper) | **Task 8.8.2 (Implement Dynamic Version Display & SOP) complete.** Updated UI to display `v2.8.8.2`. Added Section 0.6 defining the `2.x.y.z` dynamic versioning SOP. Updated various sections to reflect current version `v2.8.8.2`. Phase 8 Core Features now marked complete, project status updated to reflect new versioning. Updated commit log for `07817f2a`. |
| 1.19    | 2025-06-12   | Firebase Studio (AI Prototyper) | **Task 8.8.3 (Update TA Data & Display) complete.** Application version `v2.8.8.3`. Updated `src/services/data-sources/types.ts` for new TA structures. Updated `polygon-adapter.ts` to fetch multi-window RSI, EMA, SMA, and minute VWAP. Updated `standard-ta-display.tsx` to render new TA data. Updated AI prompt in `analyze-stock-data.ts` to understand new TA JSON. Updated header to display `v2.8.8.3`. Updated relevant README sections. Commit `b222bbfd`. |
| **1.20**| **2025-06-12**| Firebase Studio (AI Prototyper) | **Task 8.8.4 (AI Options Analysis & TA Renaming) in progress.** Application version `v2.8.8.4`. Renamed "AI-Calculated TA" to "AI Analyzed TA" throughout codebase & docs. Added new "AI Analyzed Options Chain" feature: new UI card, Genkit flow for Call/Put Walls & OI Clusters, server action, context updates, debug logs. Prompts for Key Takeaways and Chatbot updated. Header displays `v2.8.8.4`. Relevant README sections updated. Commit: `YOUR_NEXT_COMMIT_HASH`. |


## **7. Project Implementation Commit Log (StockSage App Version)**

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme.

---
**App Version:** `v2.1.0` (Covers commits up to `d1a5e67f` which completed Phase 8 core features before dynamic versioning)

**Tag:** `Phase-0_Task-0.6` ([v0.0.6])
**Subject:** `feat: Complete Phase 0 - Project Setup & Core Layout`
... (Previous commit logs remain)

---
**App Version:** `v2.8.8.2` (Reflected dynamic versioning implementation)
**Tag:** `Phase-8_Task-8.8.2_Versioning-SOP` - Commit Hash: `07817f2a`
**Subject:** `feat(app): Implement dynamic version display (v2.8.8.2) and SOP`
**Details:**
This commit implements the new `2.x.y.z` dynamic application versioning scheme.
- Updated `src/components/layout/header.tsx` to display the current version `v2.8.8.2`.
- Updated `README.md`:
    - Added Section 0.6 to define the dynamic versioning SOP for the AI Agent.
    - Updated various sections (title, preamble, goals, features, phase plan status) to reflect the current version `v2.8.8.2`.
    - Updated README changelog to version 1.18.
This change provides clearer tracking of application iterations.

---
**App Version:** `v2.8.8.3` (Reflects TA data enhancements)
**Tag:** `Phase-8_Task-8.8.3_TA-Enhancements` - Commit Hash: `b222bbfd`
**Subject:** `feat(data): Enhance TA data with multi-window indicators and new structure (v2.8.8.3)`
**Details:**
This commit implements Task v2.8.8.3, significantly enhancing the Standard Technical Analysis data.
- **Data Types (`src/services/data-sources/types.ts`):** Updated `TechnicalIndicatorsData` to support multi-window values for RSI, EMA, SMA (e.g., `RSI: {"7": val, "14": val}`) and a dedicated structure for VWAP (`{day: val, minute: val}`).
- **Data Fetching (`polygon-adapter.ts`):**
    - Modified adapter to fetch RSI for 7, 10, 14-day windows.
    - Modified adapter to fetch EMA for 5, 10, 20, 50, 200-day windows.
    - Modified adapter to fetch SMA for 5, 10, 20, 50, 200-day windows.
    - VWAP now includes 'day' (from daily aggregate) and 'minute' (from minute aggregate in snapshot).
- **UI Display (`standard-ta-display.tsx`):**
    - Rewrote rendering logic to display the new multi-window TA data in the order: RSI, MACD, VWAP, EMA, SMA.
    - Sentiment coloring applied to RSI (14-day) and MACD histogram.
- **AI Prompt (`analyze-stock-data.ts`):** Updated prompt to inform the LLM about the new `standardTasJson` structure.
- **Versioning:** UI header and `README.md` updated to `v2.8.8.3`.

---
**App Version:** `v2.8.8.4` (Reflects AI Options Analysis and TA renaming)
**Tag:** `Phase-8_Task-8.8.4_Options-AI-TA-Rename` - Commit Hash: `YOUR_NEXT_COMMIT_HASH`
**Subject:** `feat(ai,ui): Add AI Options Wall & Cluster Analysis, rename AI TA components, update version to v2.8.8.4`
**Details:**
This commit implements Task v2.8.8.4.
- **Renaming:** "AI-Calculated Technical Analysis" has been renamed to "AI Analyzed Technical Analysis" throughout the codebase. This includes:
    - Component: `AiCalculatedTaDisplay.tsx` -> `AiAnalyzedTaDisplay.tsx`.
    - Schemas: `ai-calculated-ta-schemas.ts` -> `ai-analyzed-ta-schemas.ts` (and internal types like `AnalyzeTaInput/OutputSchema`).
    - Actions: `calculate-ai-ta-action.ts` -> `analyze-ta-action.ts` (and internal types/functions).
    - Flows: `calculate-ai-ta-flow.ts` -> `analyze-ta-flow.ts` (and internal types/functions).
    - Context variables: `aiCalculatedTaJson` -> `aiAnalyzedTaJson`, etc.
    - UI text and descriptions.
- **New Feature: AI Analyzed Options Chain:**
    - Added a new "AI Analyzed Options Chain" card to the Main Tab.
    - Implemented a new Genkit flow (`src/ai/flows/analyze-options-chain-flow.ts`) with a prompt to detect Call/Put "Walls" (OI >= 1.5x avg OI & >= 2x adjacent OI; min 1, max 3 walls per side) AND "OI Clusters" (2+ adjacent strikes with high OI; min 0, max 3 clusters per side).
    - Created corresponding Zod schemas (`src/ai/schemas/ai-options-analysis-schemas.ts`) for input and output, including `ClusterDetailSchema`.
    - Added a new server action (`src/actions/perform-ai-options-analysis-action.ts`) to orchestrate this flow.
    - Updated `StockAnalysisContext` to store `aiOptionsAnalysisRequestJson` and `aiOptionsAnalysisJson`.
    - Integrated the new action into the "Full AI Analysis" sequence in `MainTabContent.tsx`.
    - The `AiOptionsAnalysisDisplay.tsx` component uses an Accordion for displaying results (Walls and OI Clusters), designed for future expandability.
    - Added export/copy functionality for AI Options Analysis JSON.
    * Updated `DebugTabContent.tsx` to display the new JSON fields.
    * Added new log source IDs for relevant components/actions/flows.
- **Chatbot Context:** The Chatbot prompt and input schema (`chat-schemas.ts`, `chat-flow.ts`) now include the `aiOptionsAnalysisJson` for richer contextual responses.
- **Versioning:** UI header and `README.md` updated to `v2.8.8.4`. `README.md` sections updated to reflect new feature and renaming.

---

*(Future commit logs will follow)*

