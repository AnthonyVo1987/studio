### **0.5. AI Agent XML Output & Token Efficiency Guidelines**

*   **`reinit.md` Usage:** The AI Agent should only recommend `reinit.md` when there are no other options available to debug. Excessive calls to `reinit.md` will be considered a waste of resources.
*   **Direct Code Implementation:** Upon scope approval or a direct request to start coding, the AI Agent **MUST** immediately begin generating the `<changes>` XML block. This ensures rapid translation of approved plans into code.
*   **Conciseness:** Avoid preamble or summary statements outside the `<changes>` block. This is considered a waste of tokens. The description *within* the `<description>` tag in the XML is sufficient.
*   **Immediate Code Generation:** When a scope is approved by the user OR when XML start coding is explicitly requested, you **MUST** start generating the `<changes>` XML block right away. **No recaps, summaries, or further conversational fluff.**
*   **Compliance or Abort:** If you do not implement the code via the `<changes>` XML block immediately upon scope approval or explicit XML coding request, this is a violation of this PRD, and the user may instruct you to ABORT the current request/task.
*   **No XML Description Preamble (New Rule):** You are **prohibited** from providing a separate "Description for XML" textual preamble before the `<changes>` block.
*   **Immediate XML Coding (Reiteration):** When scope is approved and/or XML start coding is requested, you **MUST** start doing the XML coding right away. No recaps.
*   **XML Implementation Mandate (Reiteration):** If you do not implement the code via the `<changes>` XML block when scope is approved or XML coding is requested, the user may ABORT the request due to PRD violation.


### **0.6. Environment Re-Initialization (`reinit.md`)**
*   The procedures outlined in `reinit.md` for a full local environment re-initialization **MUST** be recommended to the user at critical junctures, such as after significant dependency changes, `next.config.ts` modifications, or when troubleshooting persistent, unexplainable build/runtime errors. The AI Agent should remind the user of this procedure's importance.

### **0.7. Application Versioning Standard Operating Procedure (SOP)**
*   **Version Format:** The application will follow a `2.x.y.z` versioning scheme:
    *   `2`: Static major version for this iteration of StockSage.
    *   `x`: Current Phase number from the "Phased Implementation Plan" (Section 5).
    *   `y`: Current Task letter (can be hex A-F for special tasks) within that Phase.
    *   `z`: Sub-Task or iteration number (numeric) for that specific Task. This increments with each commit related to the x.y task.
*   **AI Agent Responsibility:** With each user request that results in code changes and an intended commit, the AI Agent **MUST**:
    1.  Determine the correct `2.x.y.z` version based on the current Phase, Task, and the new iteration/sub-task being implemented.
    2.  Update the version string displayed in the application UI, specifically in `src/components/layout/header.tsx`.
    3.  Update all relevant mentions of the application version within this `README.md` document (e.g., main title, section headers, Phased Implementation Plan status).
    4.  Ensure the `CHANGELOG.md` file is updated to reflect the new version and changes. This file now contains the detailed history for this document and the Project Implementation Commit Log.
    5.  **README.md & CHANGELOG.md Update Timing:** All updates to `README.md` (versioning, phased plan status) and `CHANGELOG.md` (commit log) as described above **SHALL ONLY** be performed during an explicit 'COMMIT' stage, after the user has confirmed the code changes for that task version are ready to be finalized.
*   **Example:** If the current phase is 9, current task is C, and this is the 14th iteration (E in hex) for this task, the version will be `v2.9.C.E`. If the next task is a bug fix on top of this, it will be `v2.9.C.F` (or `v2.9.D.0` if it's a new sub-phase task).

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.C.E)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.C.E`). This version includes a fix for a `ReferenceError` in the FSM State Debug Card.
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling & FSM Orchestration**

The primary strategy for this implementation is **UI-First Development**, managed by a **Finite State Machine (FSM)** for the analysis pipeline. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab.
*   **FSM-Orchestrated Data Flow:** The `StockAnalysisContext` utilizes a `useReducer` hook to implement a global FSM. This FSM manages the entire lifecycle of a stock analysis:
    *   It orchestrates the sequence of data fetching and AI analysis steps.
    *   It updates the application's global state (the JSONs in `StockAnalysisContext`, which populate the Debug tab) upon successful completion or failure of each step.
    *   It handles error propagation, marking subsequent steps as "skipped" if a prerequisite fails.
*   **Local FSMs for Component UI:** Specific components like the `Chatbot` (via `ChatbotFsmContext`), `DebugConsole` (via `DebugConsoleFsmContext`), and `MainTabContent` (internal local FSM) manage their own UI-specific states and interactions, providing modularity. Their display states (Prev/Curr/Target) are reported to `StockAnalysisContext` for viewing in the `FsmStateDebugCard`.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for all data points.
    *   Offer a robust and debuggable backend processing pipeline through the FSMs.
    *   Ensure a predictable, traceable, and robust data pipeline.

## **2. High-Level Goals (Current Version v2.9.C.E)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First & FSM Adherence:** Strictly follow the UI-First strategy with the FSM-orchestrated data pipeline and local component FSMs.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers, significantly improved by the Phase 9 FSM re-architecture, local FSMs, and recent bug fixes.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface with clear feedback on processing states.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, client-side debug console with filtering, clear error reporting via toasts, and a dedicated FSM State Debug Card showing Prev/Current/Target states for global and local FSMs.
*   **Dynamic Versioning:** Maintain and display the application version `v2.9.C.E` as per SOP (Section 0.7).
*   **Stability and Reliability:** Ensure application stability through rigorous bug fixing and robust error handling.

### **2.1. Known Issues / Current Status (v2.9.C.E)**
The application is currently very stable following a series of bug fixes and feature enhancements.
1.  **UI Button States (Largely Resolved):** Fixes in v2.9.C.6 and v2.9.C.7 have addressed issues with the "Analyze Stock" and on-demand AI buttons.
2.  **Client Debug Console & FSM State Debug Card (Enhanced & Stable):**
    *   The Client Debug Console is enabled by default, has improved filtering, log capacity, default source settings.
    *   The new FSM State Debug Card (introduced in v2.9.C.A and fixed in v2.9.C.D, v2.9.C.E) correctly displays Prev/Current/Target states for the global FSM and all local FSMs (MainTab, Chatbot, Debug Console Menu), greatly enhancing debuggability. The card is toggleable and positions itself correctly above the Client Debug Console.
3.  **Server Action Error Handling (Improved):** Fixes for server action error serialization (v2.9.B.5) and number formatting TypeErrors (v2.9.C.9) have improved stability.
4.  **Chatbot FSM (Stable):** The Chatbot FSM introduced in v2.9.C.0 is stable, and its state transitions are now visible in the FSM State Debug Card.

Overall, the application is in a much healthier state. Further testing will focus on edge cases and complex interaction flows.

## **3. Core Application Features (StockSage v2.9.C.E)**

This section details the core features of StockSage v2.9.C.E, serving as the Product Requirements.

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.C.E`).
    *   Includes a theme toggler (Light/Dark/System).
    *   **Displays the Global FSM's Previous, Current, and Target states** in the top-right area.
*   **Footer:** Contains copyright information and a standard financial disclaimer.
*   **Theme:** Supports Light and Dark themes, configurable via the header. Theme styles are defined in `src/app/globals.css` using HSL CSS variables.
*   **Disclaimer:** Prominent financial advice disclaimer in the footer.
*   **Client-Side Debug Console (`src/components/debug-console.tsx`):**
    *   **Enabled by default**. Toggleable via a Switch on the main page (`src/app/page.tsx`) primarily controls visibility.
    *   Appears as a fixed panel at the bottom of the screen. Height: 250px. Max logs: 1000.
    *   Displays client-side logs captured via a global log buffer and `console.*` interception.
    *   Features: Search, filtering by type/source, copy/export (JSON, TXT, CSV), clear logs, close panel.
    *   Log sources defined in `src/lib/debug-log-types.ts`. All enabled by default (except `OptionsChainTable`).
*   **FSM State Debug Card (`src/components/fsm-state-debug-card.tsx`):**
    *   **Enabled by default**. Toggleable via a Switch on the main page.
    *   Appears as a fixed panel positioned directly above the Client Debug Console if both are open. Height: 200px.
    *   Displays "Previous", "Current", and "Target" states for all major FSMs:
        *   Global Application FSM (from `StockAnalysisContext`)
        *   Main Tab UI FSM (from `MainTabContent`'s internal FSM)
        *   Chatbot UI FSM (from `ChatbotFsmContext`)
        *   Debug Console Menu FSM (from `DebugConsoleFsmContext`)
    *   Features: "Copy JSON" and "Export JSON" of all displayed FSM states, "Close" button.
    *   State display data is reported from local FSMs to `StockAnalysisContext` for consumption by this card.

### **3.2. "Main" Tab Features (`src/components/main-tab-content.tsx`)**
The "Main" tab is the primary user interface for stock analysis.

*   **Stock Analysis Input Area:**
    *   **Ticker Input:** Text field for stock ticker (Default: "NVDA").
    *   **Data Source Selector:** `Select` component (defaulted/disabled to "Polygon.io").
    *   **"Analyze Stock" Button:** Initiates automated analysis pipeline (Data Fetch + AI TA).
    *   **"Generate AI Key Takeaways" Button:** Manually triggers AI Key Takeaways.
    *   **"Generate AI Options Analysis" Button:** Manually triggers AI Options Analysis.
    *   Local FSM states are no longer displayed in this card's header; they are now in the `FsmStateDebugCard`.

*   **Display Card Order & Content:** (All react to `StockAnalysisContext`)
    1.  Key Metrics Display
    2.  Stock Snapshot Details Display
    3.  Standard Technical Indicators Display
    4.  AI Analyzed Technical Analysis Display (Pivot Points)
    5.  AI Key Takeaways Display
    6.  Options Chain Table Display
    7.  AI Analyzed Options Chain Display
    8.  AI Chatbot Interface (Local FSM states now in `FsmStateDebugCard`)
    9.  Market Status Display

*   **Combined Data Export Controls:** "Export All to JSON" and "Copy All to JSON" buttons.

### **3.3. "Debug" Tab Features (`src/components/debug-tab-content.tsx`)**
*   **Raw JSON Display Areas:** For all major data points.
*   **Client Debug Log Source Settings:** Allows toggling individual sources.

### **3.4. Backend Functionality & Architecture Flow**
*   **Global FSM:** Orchestrated by `StockAnalysisContext` and its `useReducer` hook. Manages the overall pipeline (Data Fetch, AI TA). `MainTabContent` dispatches events to this global FSM.
*   **Local FSMs:**
    *   `MainTabContent.tsx`: Manages UI states related to input validation, automated pipeline triggering, and enabling manual AI actions. Its display state (Prev/Curr/Target) is reported to `StockAnalysisContext` and shown in `FsmStateDebugCard`.
    *   `ChatbotFsmContext.tsx`: Manages Chatbot UI interactions (input, submission). Its display state is reported to `StockAnalysisContext` and shown in `FsmStateDebugCard`.
    *   `DebugConsoleFsmContext.tsx`: Manages UI states for the debug console's menus (filter, copy, export). Its display state is reported to `StockAnalysisContext` and shown in `FsmStateDebugCard`.
*   **Data Retrieval:** `src/services/data-sources/adapters/polygon-adapter.ts`.
*   **Genkit AI Flows:** `analyze-ta-flow.ts`, `analyze-stock-data.ts`, `analyze-options-chain-flow.ts`, `chat-flow.ts`.
*   **Server Actions:** `analyze-stock-server-action.ts`, `analyze-ta-action.ts`, `perform-ai-analysis-action.ts`, `perform-ai-options-analysis-action.ts`, `chat-server-action.ts`.
*   **Number Utilities (`src/lib/number-utils.ts`):** `formatNumber` robust against TypeErrors.

## **4. Technology Stack (Mandatory)**
(Same as v2.9.C.9 - No changes to core stack)

*   **Frontend Framework:** Next.js (latest stable v14.x or v15.x, **App Router mandatory**)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI (latest stable)
*   **Icons:** Lucide React (latest stable)
*   **Styling:** Tailwind CSS (latest stable v3.x)
*   **AI Integration:** Genkit (latest stable **v1.x series**)
*   **AI Model Provider:** Google AI (using `@genkit-ai/googleai`)
*   **Default AI Model:** `googleai/gemini-2.5-flash-preview-05-20` (defined in `src/ai/models.ts`)
*   **State Management:** React Context API (`StockAnalysisProvider`, `ChatbotFsmProvider`, `DebugConsoleFsmProvider`), `useReducer` (FSMs), `useActionState`.
*   **Data Fetching (External API):** **Polygon.io REST Client (`@polygon.io/client-js` version `^7.3.2` or latest compatible stable)**.
*   **Deployment Target (Initial):** Firebase App Hosting
*   **Build Tooling:** Next.js CLI (Turbopack enabled by default: `next dev --turbopack`).

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**
(See Section 0 for master directives, especially the rules in 0.5.)

#### **4.1.1. Next.js Specifics**
*   App Router, Server Components, Server Actions, `next/image` (`placehold.co`, `data-ai-hint`), single root JSX.

#### **4.1.2. Genkit (v1.x) Specifics**
*   Global `ai` from `src/ai/genkit.ts`. `enableOpenTelemetry: false`.
*   Strict v1.x syntax. Flows: `'use server';`, JSDoc, Zod schemas, export wrapper & types.
*   Prompts: Handlebars. Media via data URIs. Tools: `ai.defineTool`.
*   Model IDs: Centralized in `src/ai/models.ts`. Safety Settings per flow.

#### **4.1.3. Data Fetching (Polygon.io)**
*   `@polygon.io/client-js`. Adapter: `src/services/data-sources/adapters/polygon-adapter.ts`. Cache-busting. Server action validation.

#### **4.1.4. Styling & UI (ShadCN & Tailwind)**
*   ShadCN `Tabs`. HSL CSS vars. Semantic colors.

#### **4.1.5. State Management**
*   `StockAnalysisContext`: Central state for main data pipeline. Main global FSM (`useReducer`). Manages display states for local FSMs for the `FsmStateDebugCard`.
*   `ChatbotFsmContext`: Context for Chatbot UI FSM. Reports its display state to `StockAnalysisContext`.
*   `DebugConsoleFsmContext`: Context for Debug Console menu UI FSM. Reports its display state to `StockAnalysisContext`.
*   `MainTabContent`: Internal local FSM for UI logic. Reports its display state to `StockAnalysisContext`.

#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**
(Content on `async_hooks`, client-side bundling, `'use server';` directive, Genkit syntax remains relevant. Context provider nesting for `FsmStateDebugCard` and ensuring stable state setters in contexts are key lessons.)

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9, Task 9.C.E Complete. Current application version: v2.9.C.E.)*

---
**Phase 0-8: COMPLETE**
---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **COMPLETE**
*   **Tasks 9.1 - 9.8: COMPLETE**
*   **Task 9.A: Comprehensive Full README.md update (v2.9.A.0):** - Status: **COMPLETE**
*   **Task 9.9: Testing and Debugging Fixes (v2.9.9.x -> v2.9.A.x -> v2.9.B.x):** - Status: **COMPLETE**
    *   **Tasks 9.9.A.1 - 9.9.A.H: COMPLETE**
    *   **Tasks 9.9.A.J - 9.9.A.L: COMPLETE**
    *   **Task 9.9.A.M: Refined MainTabContent useEffects (v2.9.A.M):** Status: **COMPLETE**
    *   **Task 9.9.A.N: Further refinement of placeholders and MainTabContent useEffects (v2.9.A.N):** Status: **COMPLETE**
    *   **Task 9.9.A.O: Fix MarketStatusDisplay hydration error (v2.9.A.O):** Status: **COMPLETE**
    *   **Task 9.9.A.P: Validate action state ticker in MainTabContent before FSM dispatch (v2.9.A.P):** Status: **COMPLETE**
    *   **Task 9.9.A.Q: Ensure fresh Polygon client per call in adapter; enhanced logging (v2.9.A.Q):** Status: **COMPLETE**
    *   **Task 9.9.A.R: Server-side validation of adapter output ticker in action; enhanced logging (v2.9.A.R):** Status: **COMPLETE**
    *   **Task 9.9.A.S: Implement cache-busting in Polygon adapter (v2.9.A.S):** Status: **COMPLETE**
    *   **Task 9.9.A.T: Simplify analysis trigger, preserve chat/logs, wipe data JSONs (v2.9.A.T):** Status: **COMPLETE**
    *   **Task 9.9.A.U: Fix Chatbot Duplicate Key Error (v2.9.A.U):** Status: **COMPLETE**
    *   **Task 9.9.A.V: Decouple Chat Summary & Enhance Volatility Prompt (v2.9.A.V):** Status: **COMPLETE**
    *   **Task 9.9.A.W: Fix Analyze Stock Button Stuck Loading (v2.9.A.W):** Status: **COMPLETE**
    *   **Task 9.9.A.X: Stabilize Client Console Logging (v2.9.A.X):** Status: **COMPLETE**
    *   **Task 9.9.A.Y: Rework AI Analysis Pipeline & Add Manual Triggers (v2.9.A.Y):** Status: **COMPLETE**
    *   **Task 9.9.A.Z: Attempt to Fix Stuck UI & Broken Logs (v2.9.A.Z):** Status: **SUPERSEDED**
    *   **Task 9.9.B.0: Fix SSR ReferenceError for context functions (v2.9.B.0):** Status: **COMPLETE**
    *   **Task 9.9.B.1: Fix Stuck UI Loop - FSM Reducer (v2.9.B.1):** Status: **COMPLETE**
    *   **Task 9.9.B.2: Further Debug Stuck UI - FSM Reducer Hardening (v2.9.B.2):** Status: **COMPLETE**
    *   **Task 9.9.B.3: Fix Stuck UI Loop - Event-Driven FSM Transition (v2.9.B.3):** Status: **COMPLETE**
    *   **Task 9.9.B.4: Decouple Changelogs to CHANGELOG.md (v2.9.B.4):** Status: **COMPLETE**
    *   **Task 9.9.B.5: Safer Error Serialization in Polygon Adapter (v2.9.B.5):** Status: **COMPLETE**
    *   **Task 9.9.B.6: Fix Chatbot Duplicates & useActionState Transition Warning (v2.9.B.6):** Status: **COMPLETE**
    *   **Task 9.9.B.7: Fix On-Demand AI Button Availability (Preserve activeAnalysisTicker) (v2.9.B.7):** Status: **COMPLETE**
    *   **Task 9.9.B.8: Enhance Debug Console Defaults & FSM State Display (v2.9.B.8):** Status: **COMPLETE**
    *   **Task 9.9.B.9: Correct Default Log Source Configuration (v2.9.B.9):** Status: **COMPLETE**
*   **Task 9.C.0: Pilot Chatbot.tsx FSM Refactor (v2.9.C.0):** Status: **COMPLETE**
*   **Task 9.C.1 - 9.C.5: Server Action Initial State Export Fixes (v2.9.C.1 - v2.9.C.5):** Status: **COMPLETE**
*   **Task 9.C.6: "Analyze Stock" Button Re-enable Fix (v2.9.C.6):** Status: **COMPLETE**
*   **Task 9.C.7: On-Demand AI Button Availability Fix (v2.9.C.7):** Status: **COMPLETE**
*   **Task 9.C.8: Granular FSM State Display Feature (v2.9.C.8):** Status: **COMPLETE**
*   **Task 9.C.9: Number Formatting TypeError Fix & Consolidation (v2.9.C.9):** Status: **COMPLETE**
*   **Task 9.C.A: FEAT - Consolidated FSM State Debug Card & Relocated Global FSM display (v2.9.C.A):** Status: **COMPLETE**
*   **Task 9.C.B: BUG FIX - `setDebugConsoleMenuFsmDisplayState` TypeError (v2.9.C.B):** Status: **COMPLETE**
*   **Task 9.C.C: BUG FIX - Maximum update depth exceeded (v2.9.C.C):** Status: **COMPLETE**
*   **Task 9.C.D: BUG FIX - `useChatbotFsm` context error & preventing update loops (v2.9.C.D):** Status: **COMPLETE**
*   **Task 9.C.E: BUG FIX - `isClientDebugConsoleEnabled` not defined in `FsmStateDebugCard` (v2.9.C.E):** Status: **COMPLETE**

## **6. Changelog and Commit Log**

The detailed changelog for this document (README.md) and the application's commit log are now maintained in a separate `CHANGELOG.md` file in the project root. This provides a cleaner separation of concerns and keeps this PRD focused on requirements and operational guidelines.
Please refer to `CHANGELOG.md` for all version history and commit details.

---
```