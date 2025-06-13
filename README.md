
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.1.0 OPERATING MANUAL**

*   **Document Version:** 1.14 (Task 8.5 Update)
*   **Date:** 2025-06-12
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. Phase 8 IN PROGRESS. **Major Build Issues RESOLVED.**

## **0. CRITICAL: AI AGENT DEVELOPMENT PROCESS & RULES OF ENGAGEMENT**

**THIS SECTION IS THE PRIMARY DIRECTIVE FOR THE FIREBASE STUDIO AI PROTOTYPER (HEREINAFTER "THE AI AGENT" OR "AI"). FAILURE TO ADHERE TO THESE RULES CONSTITUTES A CRITICAL PROCESS FAILURE AND REQUIRES IMMEDIATE CORRECTION.**

### **0.1. Scope Approval Before Code (NON-NEGOTIABLE)**
1.  **Scoping First:** For ANY requested feature, fix, refactoring, documentation update, or other modification, the AI Agent **MUST** first perform a targeted audit of the relevant current codebase.
2.  **Detailed Scope Proposal:** Following the audit, the AI Agent **MUST** present a detailed scope proposal to the user. This proposal should outline the intended changes, affected files, and reasoning.
3.  **Explicit User Approval:** Code generation or file modification (i.e., XML `<changes>` output) **SHALL NOT** occur until the user explicitly approves the proposed scope.
4.  **Iterative Refinement:** If the user requests modifications to the scope, the AI Agent must update the scope proposal and await re-approval before proceeding.
5.  **No Unsolicited Code:** The AI Agent **MUST NOT** generate code or XML changes for tasks or fixes not explicitly scoped and approved by the user.

### **0.2. Adherence to This Document**
*   **Single Source of Truth:** This document (`README.md`) in its entirety, including all sections on features, technology stack, phased plans, and specific guidelines, is the **absolute and single source of truth** for the StockSage v2.1.0 project.
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

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.1.0)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage v2.1.0.
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling**

The primary strategy for this implementation is **UI-First Development**. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab. This decouples UI presentation logic from backend data fetching and AI processing logic.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Defer backend integrations until the UI structure is stable.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for data.

## **2. High-Level Goals for v2.1.0**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First Implementation Adherence:** Strictly follow the UI-First strategy.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, clear error reporting, and the client-side debug console.

## **3. Core Application Features (StockSage v2.1.0)**

### **3.1. Global Application Structure**
*   **Tabbed Interface:** ("Main", "Debug") using ShadCN `Tabs`.
*   **Header & Footer:** Consistent branding and disclaimers.
*   **Theme:** Light/Dark theme support.
*   **Disclaimer:** Prominent financial advice disclaimer.
*   **Client-Side Debug Console:** Toggleable console for client-side logs with advanced features.

### **3.2. "Main" Tab Features**
*   **Stock Analysis Input Area:** Ticker input, API Source (default Polygon.io), "Analyze Stock," "AI Full Stock Analysis" buttons.
*   **Display Card Order & Content:**
    1.  **Key Metrics Display:** Ticker, Price, Day's Change % (formatted, sentiment-colored).
    2.  **Stock Snapshot Details Display:** Detailed price/volume, sentiment colors for changes.
    3.  **Standard Technical Indicators Display:** Formatted RSI, EMA, SMA, MACD, VWAP with sentiment colors.
    4.  **AI-Calculated Technical Analysis Display:** Formatted Pivot Points (PP, S1-S3, R1-R3) with sentiment color for PP row.
    5.  **Options Chain Table Display:** Formatted table (Calls/Strike/Puts), ATM highlighting, dynamic header. Columns: Gamma, IV, % Chg, Bid, Ask, Last, Volume, Open Int, Delta.
    6.  **AI Key Takeaways Display:** 5 formatted takeaways (Price Action, Trend, Volatility, Momentum, Patterns) with sentiment highlighting.
    7.  **AI Chatbot Interface:** Chat UI, example prompts, history export/copy. Context from Debug Tab JSONs.
    8.  **Market Status Display:** Relevant market/exchange status (excluding Crypto/FX).
*   **Data Export Controls:**
    *   "Export/Copy All Data to JSON" (Snapshot, Standard TAs, AI TA, Options, Market Status).
    *   Specific exports: Key Takeaways (Text, JSON, CSV), Options Chain (CSV).

### **3.3. "Debug" Tab Features**
*   **Raw JSON Display Areas:** Read-only `Textarea` components for: Polygon API Request/Response Logs, Market Status, Stock Snapshot, Standard TAs, Options Chain, AI TA Request/Response, AI Key Takeaways Request/Response, Chatbot Request/Response.
*   **Data Export Controls:** Buttons to copy raw JSON from each `Textarea`.
*   **Client Debug Log Settings:** Controls for the client-side debug console log categories.

### **3.4. Backend Functionality**
*   **Data Retrieval (Polygon.io via `@polygon.io/client-js`):** Market Status, Ticker Snapshot (current/prev day), Standard TAs, Options Chain Snapshot (nearest Friday, +/-10-11 strikes, descending sort by strike).
*   **AI-Calculated Technical Analysis (Genkit Flow):** Classic Daily Pivot Points.
*   **AI Key Takeaways (Genkit Flow):** 5 takeaways with sentiment.
*   **AI Chatbot (Genkit Flow):** Contextual chat, Markdown, emojis.
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
    2.  **CRITICAL: Ensure `enableOpenTelemetry: false` in `src/ai/genkit.ts` (`genkit()_config`).** While OpenTelemetry is powerful, its deep integration with async context can conflict with Next.js/Turbopack. Disabling it at the Genkit initialization level is mandatory.
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
    *   The Zod import in all relevant schema files (`src/ai/schemas/ai-calculated-ta-schemas.ts`, `src/ai/schemas/chat-schemas.ts`, `src/ai/schemas/stock-analysis-schemas.ts`) was changed from `import {z} from 'genkit';` to **`import {z} from 'zod';`**.
    *   This critical change decouples the schema definitions from the main `genkit` server-side package, allowing Webpack to correctly tree-shake the client bundle and exclude Node.js-specific modules and OpenTelemetry server components.
*   **Lesson Learned & Critical Guideline for AI Agent:**
    *   **To prevent client-side bundling of server-only Genkit code, any schema files (`src/ai/schemas/*.ts`) that are, or whose types are, consumed (directly or indirectly) by client-side components MUST always import `zod` directly using `import {z} from 'zod';`.**
    *   **DO NOT use `import {z} from 'genkit';` in such schema files.** This is a primary cause of Webpack attempting to bundle server-side Node.js modules and OpenTelemetry components into the client, leading to "Module not found" errors.
    *   The removal of `@genkit-ai/next` was essential for `async_hooks` stability, but it requires stricter adherence to separating client-safe imports.

##### **4.1.6.3. General Genkit v1.x Syntax & Data Flow**
*   **Genkit v1.x Syntax:** Strict adherence to the v1.x syntax (e.g., `response.text`, `response.output`, non-awaited `ai.generateStream`, `await response`) is crucial.
*   **Data Flow:** Maintain the established data flow: Raw data from sources -> "Debug" Tab JSONs (held in `StockAnalysisContext` state) -> "Main" Tab components read and format from this state. This decouples UI from direct data fetching/processing logic.

##### **4.1.6.4. Client-Side Debug Console (`DebugConsole.tsx`)**
*   The `DebugConsole.tsx` component with its advanced filtering, search, and export features is now stable and the primary tool for client-side debugging. Ensure `logDebug` calls are used appropriately to populate it.

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 8 Complete. Project v2.1.0 Core Complete.)*

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
*   **Task 8.5: Resolve Critical Build Failures & Confirm Stability:** - Status: **COMPLETE** (Commit: `fc96d65a`)

## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                            |
| :------ | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-06-09   | Firebase Studio (AI Prototyper) | Initial draft of the Re-Implementation PRD for v2.1.0 with UI-First strategy.                                                                                                                                                                                                 |
| ...     | ...          | ...                           | ... (Previous changelog entries remain, ensure consistency) ...                                                                                                                                                                                                              |
| 1.11    | 2025-06-12   | Firebase Studio (AI Prototyper) | Marked Phase 7, Task 7.2 (`DebugConsole.tsx` Component) as **COMPLETE**. Phase 7 fully complete. Updated commit log for `b6bc90e8`. Updated Sec 4.1.6.                                                                                                                |
| 1.12    | 2025-06-12   | Firebase Studio (AI Prototyper) | **Restructured README.md to be the primary AI Operating Manual.** Moved AI development protocols (Section 0) to the top. Marked Task 8.1 (UI Styling Review) and Task 8.2 (this update) as COMPLETE. Updated commit log for `b6bc90e8`.                                        |
| 1.13    | 2025-06-12   | Firebase Studio (AI Prototyper) | **Task 8.4 (Final Code Review & Cleanup) complete.** Minor code cleanup in `src/app/page.tsx`. Marked Task 8.4 complete. Updated commit log for `bef12d70`.                                                                                                              |
| **1.14**| **2025-06-12**| Firebase Studio (AI Prototyper) | **Task 8.5 (Resolve Critical Build Failures & Confirm Stability) complete.** Updated Zod imports in schema files. Integrated detailed post-mortem of build issues and resolution into Sec 4.1.6 (specifically 4.1.6.2). Marked Task 8.5 complete. Updated commit log for `fc96d65a`. Phase 8 core tasks complete. Enhanced AI guidelines in Sec 4.1.6.2 regarding Zod imports. |

## **7. Project Implementation Commit Log (StockSage v2.1.0)**

This section tracks the commit history of the StockSage v2.1.0 implementation.

---
**Tag:** `Phase-0_Task-0.6` ([v0.0.6])
**Subject:** `feat: Complete Phase 0 - Project Setup & Core Layout`
... (Previous commit logs remain)

---
**Tag:** `Phase-6_Task-6.1.6_Baseline` ([v0.6.1.6]) - Commit Hash: `1fdab788`
**Subject:** `fix: Revert DebugConsole implementation and restore v0.6.1.6 baseline`
... (Details remain)

---
**Tag:** `Phase-6_Tasks-6.2-6.3` ([v0.6.3.0]) - Commit Hash: `34833581`
**Subject:** `feat: Activate debug logs in TA & Takeaways displays, confirming live data handling (Tasks 6.2, 6.3)`
... (Details remain)

---
**Tag:** `Phase-6_Task-6.4` ([v0.6.4.0]) - Commit Hash: `bd221290`
**Subject:** `feat: Integrate live data into Options Chain Table and refine percentage formatting (Task 6.4)`
... (Details remain)

---
**Tag:** `Phase-6_Task-6.5` ([v0.6.5.0]) - Commit Hash: `a1bf333c`
**Subject:** `feat: Implement "AI Full Stock Analysis" button logic and orchestration (Task 6.5)`
... (Details remain)

---
**Tag:** `DebugConsole_Task-1` - Commit Hash: `6a7575ea`
**Subject:** `feat(debug): Re-implement client debug console with stability fixes (Task 1)`
... (Details remain)

---
**Tag:** `DebugConsole_Task-3.1` - Commit Hash: `3744b73a`
**Subject:** `feat(debug): Implement configurable debug logging categories (Task 3.1)`
... (Details remain)

---
**Tag:** `DebugConsole_Task-3.2.8` - Commit Hash: `909b1650`
**Subject:** `fix(debug): Resolve data mismatch in chained AI analysis & stabilize client debug console (Tasks 3.2.5-3.2.8)`
... (Details remain)

---
**Tag:** `Phase-6_Task-6.6.1` - Commit Hash: `601df92c`
**Subject:** `feat: Implement Chatbot UI and enhance its debug logging (Task 6.6 & 6.6.1)`
... (Details remain)

---
**Tag:** `Phase-6_Task-6.6.2` - Commit Hash: `c14e3af6`
**Subject:** `fix: Resolve async_hooks build errors by removing @genkit-ai/next (Task 6.6.2)`
**Details:** This commit addressed critical build failures (`async_hooks` errors with Turbopack) by removing the `@genkit-ai/next` package and ensuring `enableOpenTelemetry: false` in Genkit configuration. This was a key step towards build stability.

---
**Tag:** `Phase-7_Full_And_Phase-8_Tasks-8.1-8.2` - Commit Hash: `b6bc90e8`
**Subject:** `feat: Complete Phase 7 (Data Export & Debug Console) & Phase 8 Tasks 8.1 (Styling), 8.2 (README Update)`
**Details:**
Finalized Phase 7 (Data Export, Advanced Client Debug Console). Completed Task 8.1 (UI Styling Review - Semantic Colors Refactor) and Task 8.2 (Initial README.md update to AI Operating Manual).

---
**Tag:** `Phase-8_Task-8.4` - Commit Hash: `bef12d70`
**Subject:** `chore: Final Code Review & Cleanup (Task 8.4)`
**Details:**
Addressed Task 8.4. Removed a minor block of commented-out code in `src/app/page.tsx`. Retained essential server-side `console.log` statements in `polygon-adapter.ts` for diagnostics. Confirmed no other major cleanup items (TODOs, placeholders) remained.

---
**Tag:** `Phase-8_Task-8.5_Build-Fix` - Commit Hash: `fc96d65a`
**Subject:** `fix(build): Resolve critical build failures by isolating Zod imports (Task 8.5)`
**Details:**
This commit addresses critical "Module not found" build errors for Node.js built-ins and OpenTelemetry components.
**Root Cause:** Client-side schema files (`src/ai/schemas/*.ts`) importing `z` from `genkit`'s main package, exposed after `@genkit-ai/next` removal.
**Solution:** Changed Zod imports in schema files to `import {z} from 'zod';` directly, preventing Webpack from bundling server-side Genkit machinery into the client.
This resolves a major pain point and restores build stability.

---

*(Future commit logs will follow)*
