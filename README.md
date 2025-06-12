
# **MANDATORY AI DEVELOPMENT PROTOCOL & STOCKAGE v2.1.0 OPERATING MANUAL**

*   **Document Version:** 1.13 (Task 8.4 Update)
*   **Date:** 2025-06-12
*   **Author:** Firebase Studio (AI Prototyper)
*   **Status:** Official Project Blueprint & AI Operational Mandate. Phase 7 COMPLETE. Phase 8 In Progress.

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
*   **`async_hooks` & Turbopack:**
    *   **Context:** Historically a major blocker. Current mitigations: no `@genkit-ai/next`, `enableOpenTelemetry: false`.
    *   **CRITICAL INSTRUCTION FOR USER:** If `async_hooks` errors reappear, a **full local environment re-initialization (`reinit.md`) MUST be performed by the user.** This is the first and most critical troubleshooting step.
    *   **Rule 1:** **DO NOT re-add `genkitPluginNextjs()` or `@genkit-ai/next`.**
    *   **Rule 2:** Extreme caution with new dependencies (especially APM/tracing).
    *   **Rule 3:** Keep `next.config.ts` simple. **AVOID Webpack `resolve.fallback`.**
    *   **Rule 4:** If `async_hooks` errors persist AFTER re-init, flag immediately. Do not attempt Webpack fallbacks.
*   **Genkit v1.x Syntax:** Strict adherence.
*   **Data Flow:** Raw data -> Debug Tab JSONs (state) -> Main Tab components format from state.
*   **Client-Side Debug Console (`DebugConsole.tsx`):** Now stable with advanced features.

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 7 Complete. Phase 8 In Progress.)*

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
**Phase 7: Data Export & Final Client-Side Features** - Status: **COMPLETE** (Commit: `b6bc90e8`)
*   **Task 7.1: Implement Remaining Data Export Controls** - Status: **COMPLETE**
    *   (Sub-tasks 7.1.0, 7.1.2, 7.1.3, 7.1.4 for Main Tab exports and Debug Tab copy verification)
*   **Task 7.2: Implement `DebugConsole.tsx` Component** - Status: **COMPLETE**
    *   (Includes Sub-tasks 7.2.1: Advanced Filtering, 7.2.2: Search, 7.2.3: Export TXT/CSV, 7.2.4: Copy TXT/CSV)

---
**Phase 8: Final Styling, Cleanup, Documentation & Review** - Status: **IN PROGRESS**
*   **Task 8.1: UI & Styling Review (Sentiment Colors Refactor):** - Status: **COMPLETE** (Commit: `b6bc90e8`)
*   **Task 8.2: Create `README.md` for v2.1.0 (This Document Update):** - Status: **COMPLETE** (Commit: `b6bc90e8`)
*   **Task 8.3: Prepare Firebase Deployment Config:** - Status: **PENDING**
*   **Task 8.4: Final Code Review & Cleanup:** - Status: **COMPLETE** (Commit: `bef12d70`)
*   **Task 8.5: Comprehensive End-to-End Test:** - Status: **PENDING**

## **6. Changelog (This Re-Implementation PRD & Operating Manual)**

| Version | Date         | Author                        | Summary of Changes                                                                                                                                                                                                                                                            |
| :------ | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-06-09   | Firebase Studio (AI Prototyper) | Initial draft of the Re-Implementation PRD for v2.1.0 with UI-First strategy.                                                                                                                                                                                                 |
| ...     | ...          | ...                           | ... (Previous changelog entries remain, ensure consistency) ...                                                                                                                                                                                                              |
| 1.11    | 2025-06-12   | Firebase Studio (AI Prototyper) | Marked Phase 7, Task 7.2 (`DebugConsole.tsx` Component) as **COMPLETE**, including all sub-tasks (advanced filtering, search, TXT/CSV export & copy). Phase 7 fully complete. Updated commit log for `b6bc90e8`. Updated Sec 4.7.4.                                        |
| 1.12    | 2025-06-12   | Firebase Studio (AI Prototyper) | **Restructured README.md to be the primary AI Operating Manual.** Moved AI development protocols (Section 0) to the top with enhanced enforcement language for scope approval. Marked Task 8.1 (UI Styling Review) and Task 8.2 (this update) as COMPLETE. Updated commit log to reflect `b6bc90e8` for these tasks. |
| **1.13**| **2025-06-12**| Firebase Studio (AI Prototyper) | **Task 8.4 (Final Code Review & Cleanup) complete.** Minor code cleanup in `src/app/page.tsx`. Updated commit log for `bef12d70`. |

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
... (Details remain)

---
**Tag:** `Phase-7_Full` - Commit Hash: `b6bc90e8`
**Subject:** `feat: Complete Phase 7 - Data Export & Client Debug Console Enhancements`
**Details:**
This commit finalizes all tasks and sub-tasks within Phase 7, "Data Export & Final Client-Side Features". It includes the completion of all specified data export functionalities on the Main and Debug tabs, and comprehensive enhancements to the client-side debug console.

**Task 7.1: Implement Remaining Data Export Controls (Completed):**
*   Main Tab:
    *   Implemented "Export All Data to JSON" and "Copy All Data to JSON" buttons, compiling Stock Snapshot, Standard TAs, AI Calculated TAs, Options Chain, and Market Status.
    *   Implemented "Export Options (CSV)" and "Copy Options (CSV)" for the Options Chain table.
    *   Implemented "Export Takeaways" and "Copy Takeaways" dropdowns (Text, JSON, CSV) for AI Key Takeaways.
*   Debug Tab:
    *   Verified and ensured robust "Copy JSON" functionality for all raw JSON display areas.

**Task 7.2: Implement `DebugConsole.tsx` Component (Full Enhancements - Completed):**
*   **Sub-Task 7.2.1 (Advanced Filtering):**
    *   Added UI controls (dropdown menu with checkboxes) to filter logs by type (debug, info, log, warn, error) and by source/category.
    *   Included "Select All" / "Clear All" options for both type and source filters.
*   **Sub-Task 7.2.2 (Search Functionality):**
    *   Integrated an input field for case-insensitive text search within log messages with a clear button.
*   **Sub-Task 7.2.3 (Export to TXT/CSV):**
    *   Modified export functionality to a dropdown menu with options for TXT and CSV, in addition to JSON.
*   **Sub-Task 7.2.4 (Copy to TXT/CSV):**
    *   Modified copy functionality to a dropdown menu with options for TXT and CSV, in addition to JSON.

All export and copy functionalities provide user feedback via toasts and integrate with the client debug console. The `DebugConsole` itself now offers advanced filtering, search, and multi-format export/copy capabilities.
Phase 7 is fully complete. This commit also includes Task 8.1 (UI Styling Review - Semantic Colors Refactor) and Task 8.2 (README.md update to AI Operating Manual).

---
**Tag:** `Phase-8_Task-8.4` - Commit Hash: `bef12d70`
**Subject:** `chore: Final Code Review & Cleanup (Task 8.4)`
**Details:**
This commit addresses Task 8.4: Final Code Review & Cleanup.
The primary changes include:
1.  **Removed Obsolete Code**:
    *   In `src/app/page.tsx`, a small block of commented-out code within the `handleDebugConsoleToggle` function, related to an old log clearing mechanism, was removed as this functionality is now handled by the `StockAnalysisContext`.
2.  **Code Review Decisions**:
    *   **Server-Side Logging**: Intentionally retained `console.log` and `console.error` statements within `src/services/data-sources/adapters/polygon-adapter.ts`. These are deemed essential server-side diagnostics for the Polygon API integration, not temporary debug logs.
    *   **`logDebug` Verbosity**: Reviewed existing `logDebug` calls across client-side components. No changes were made as current usage is considered appropriate, especially with the client debug console's filtering capabilities.
    *   **TODO/FIXME Comments**: Confirmed no `TODO` or `FIXME` comments exist in the codebase.
    *   **Placeholder Data**: Confirmed no residual placeholder data is being used in components.
    *   **Minor Optimizations**: No obvious, low-risk optimizations fitting the "cleanup" scope were identified.
This commit ensures the codebase is cleaner by removing non-functional commented code and verifies the state of other cleanup aspects.
---

*(Future commit logs will follow)*
