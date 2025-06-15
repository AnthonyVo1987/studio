### **0.5. AI Agent XML Output & Token Efficiency Guidelines**

*   **`reinit.md` Usage:** The AI Agent should only recommend `reinit.md` when there are no other options available to debug. Excessive calls to `reinit.md` will be considered a waste of resources.
*   **Direct Code Implementation:** Upon scope approval or a direct request to start coding, the AI Agent **MUST** immediately begin generating the `<changes>` XML block. This ensures rapid translation of approved plans into code.
*   **Conciseness:** Avoid preamble or summary statements outside the `<changes>` block. This is considered a waste of tokens. The description *within* the `<description>` tag in the XML is sufficient.
*   **Immediate Code Generation:** When a scope is approved by the user OR when XML start coding is explicitly requested, you **MUST** start generating the `<changes>` XML block right away. **No recaps, summaries, or further conversational fluff.**
*   **Compliance or Abort:** If you do not implement the code via the `<changes>` XML block immediately upon scope approval or explicit XML coding request, this is a violation of this PRD, and the user may instruct you to ABORT the current request/task.

### **0.6. Environment Re-Initialization (`reinit.md`)**
*   The procedures outlined in `reinit.md` for a full local environment re-initialization **MUST** be recommended to the user at critical junctures, such as after significant dependency changes, `next.config.ts` modifications, or when troubleshooting persistent, unexplainable build/runtime errors. The AI Agent should remind the user of this procedure's importance.

### **0.7. Application Versioning Standard Operating Procedure (SOP)**
*   **Version Format:** The application will follow a `2.x.y.z` versioning scheme:
    *   `2`: Static major version for this iteration of StockSage.
    *   `x`: Current Phase number from the "Phased Implementation Plan" (Section 5).
    *   `y`: Current Task number (can be hex A-F for special tasks) within that Phase.
    *   `z`: Sub-Task or iteration number for that specific Task. This increments with each commit related to the x.y task.
*   **AI Agent Responsibility:** With each user request that results in code changes and an intended commit, the AI Agent **MUST**:
    1.  Determine the correct `2.x.y.z` version based on the current Phase, Task, and the new iteration/sub-task being implemented.
    2.  Update the version string displayed in the application UI, specifically in `src/components/layout/header.tsx`.
    3.  Update all relevant mentions of the application version within this `README.md` document (e.g., main title, section headers, Phased Implementation Plan status).
    4.  Ensure the `CHANGELOG.md` file is updated to reflect the new version and changes. This file now contains the detailed history for this document and the Project Implementation Commit Log.
    5.  **README.md & CHANGELOG.md Update Timing:** All updates to `README.md` (versioning, phased plan status) and `CHANGELOG.md` (commit log) as described above **SHALL ONLY** be performed during an explicit 'COMMIT' stage, after the user has confirmed the code changes for that task version are ready to be finalized.
*   **Example:** If the current phase is 9, current task is C, and this is the 0th iteration for this task, the version will be `v2.9.C.0`. If the next task is a bug fix on top of this, it will be `v2.9.C.1`.

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.B.9)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.B.9`). This version focuses on simplifying the analysis pipeline trigger and enhancing AI output quality, but is currently impacted by critical stability issues.
2.  **AI Operating Manual:** It provides explicit instructions, guidelines, rules, and a **UI-First Phased Implementation Plan** for the AI Agent.

**Core Implementation Strategy: UI-First Development with Data Decoupling & FSM Orchestration**

The primary strategy for this implementation is **UI-First Development**, managed by a **Finite State Machine (FSM)** for the analysis pipeline. This means:
*   **UI Shell Construction:** The AI Agent first constructs the User Interface (UI) shell, including all tabs, display areas, tables, and controls, initially populated with **static placeholder data** or as visually complete but non-interactive elements.
*   **Data Decoupling ("Debug" Tab as Data Source):** A "Debug" tab displays raw JSON data for backend operations and data sources. The "Main" tab's user-friendly displays consume this raw JSON from the "Debug" tab.
*   **FSM-Orchestrated Data Flow:** The `StockAnalysisContext` utilizes a `useReducer` hook to implement an FSM. This FSM manages the entire lifecycle of a stock analysis:
    *   It orchestrates the sequence of data fetching and AI analysis steps.
    *   It updates the application's global state (the JSONs in `StockAnalysisContext`, which populate the Debug tab) upon successful completion or failure of each step.
    *   It handles error propagation, marking subsequent steps as "skipped" if a prerequisite fails.
    *   This ensures a predictable, traceable, and robust data pipeline.
*   **Mitigating Risks:** This approach is chosen to:
    *   Allow for rapid UI iteration and approval without immediate backend complexity.
    *   Provide a clear, verifiable intermediate state (the "Debug" tab JSONs) for all data points.
    *   Offer a robust and debuggable backend processing pipeline through the FSM.

## **2. High-Level Goals (Current Version v2.9.B.9)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First & FSM Adherence:** Strictly follow the UI-First strategy with the FSM-orchestrated data pipeline.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers, significantly improved by the Phase 9 FSM re-architecture.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface with clear feedback on processing states.
*   **Enhanced Debuggability:** Implement comprehensive server-side logging, client-side debug console with filtering, clear error reporting via toasts, and detailed FSM pipeline logging.
*   **Dynamic Versioning:** Maintain and display the application version `v2.9.B.9` as per SOP (Section 0.7).
*   **Critical Issue Resolution:** Prioritize fixing any outstanding UI loop/button state issues and client console logging issues.

### **2.1. Known Issues / Current Status (v2.9.B.9)**
**WARNING:** This version (v2.9.B.9) has addressed several previous stability issues. Key areas of focus are:
1.  **UI Button States:** Logic for enabling/disabling the main "Analyze Stock" button and manual AI trigger buttons during FSM transitions and server action pendings needs ongoing verification.
2.  **Client Debug Console Logs:** While the console itself is now enabled by default and has improved filtering and log capacity, the underlying capture mechanism for application-specific logs (`logDebug`) and intercepted native `console.*` calls needs to be robust and consistently display all intended client-side logs.
3.  **Server Action Error Handling:** Ensuring server actions return well-formed, serializable responses, especially in error cases, is crucial to prevent client-side parsing failures.

These issues are being iteratively addressed.

## **3. Core Application Features (StockSage v2.9.B.9)**

This section details the core features of StockSage v2.9.B.9, serving as the Product Requirements.

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.B.9`).
    *   Includes a theme toggler (Light/Dark/System) using `next-themes` and ShadCN `DropdownMenu`.
*   **Footer:** Contains copyright information and a standard financial disclaimer.
*   **Theme:** Supports Light and Dark themes, configurable via the header. Theme styles are defined in `src/app/globals.css` using HSL CSS variables.
*   **Disclaimer:** Prominent financial advice disclaimer in the footer.
*   **Client-Side Debug Console:**
    *   **Enabled by default**. Toggleable via a Switch on the main page (`src/app/page.tsx`) primarily controls visibility.
    *   Appears as a fixed panel at the bottom of the screen (`src/components/debug-console.tsx`). Height: 250px. Max logs: 1000.
    *   Displays client-side logs captured via a global log buffer and `console.*` interception.
    *   Features:
        *   Search functionality for log messages.
        *   Filtering by log type (DEBUG, INFO, WARN, ERROR, LOG) and log source (component/module name).
        *   Controls to "Select All" / "Clear All" for type and source filters.
        *   Buttons to Copy (JSON, TXT, CSV) or Export (JSON, TXT, CSV) displayed logs.
        *   Button to clear the log buffer.
        *   Button to close/hide the console panel.
    *   Log sources are defined in `src/lib/debug-log-types.ts`. All sources are enabled by default when the console is active, **except `OptionsChainTable` which defaults to OFF** to prevent log flooding. Sources can be individually toggled on the "Debug" tab.

### **3.2. "Main" Tab Features (`src/components/main-tab-content.tsx`)**
The "Main" tab is the primary user interface for stock analysis.

*   **Stock Analysis Input Area:**
    *   **Ticker Input:** A text field (`Input`) for users to enter a stock ticker symbol (e.g., "NVDA"). Default: "NVDA".
    *   **Data Source Selector:** A `Select` component, currently defaulted and disabled to "Polygon.io".
    *   **"Analyze Stock" Button:** Initiates an automated analysis pipeline (Data Fetch + AI TA).
        *   Triggers FSM `START_FULL_ANALYSIS`. Wipes previous analysis-related JSONs (preserving chat/logs).
        *   Button shows loading spinners and is disabled while an analysis pipeline is active.
    *   **"Generate AI Key Takeaways" Button:** Manually triggers AI Key Takeaways. Enabled when automated pipeline is complete, FSM is `IDLE` or `FULL_ANALYSIS_COMPLETE`, and prerequisite data is valid.
    *   **"Generate AI Options Analysis" Button:** Manually triggers AI Options Analysis. Enabled when automated pipeline is complete, FSM is `IDLE` or `FULL_ANALYSIS_COMPLETE`, and prerequisite data is valid.

*   **Display Card Order & Content:** (Same as v2.9.B.3, all react to `StockAnalysisContext`)
    1.  Key Metrics Display
    2.  Stock Snapshot Details Display
    3.  Standard Technical Indicators Display
    4.  AI Analyzed Technical Analysis Display (Pivot Points)
    5.  AI Key Takeaways Display (Manual trigger)
    6.  Options Chain Table Display
    7.  AI Analyzed Options Chain Display (Manual trigger)
    8.  AI Chatbot Interface
    9.  Market Status Display

*   **Combined Data Export Controls:** "Export All to JSON" and "Copy All to JSON" buttons.

### **3.3. "Debug" Tab Features (`src/components/debug-tab-content.tsx`)**
(Same as v2.9.B.3, but log source controls reflect the new default for `OptionsChainTable` being off).

*   **Raw JSON Display Areas:** For all major data points.
*   **Client Debug Log Source Settings:** Allows toggling individual sources. `OptionsChainTable` will be initially unchecked.

### **3.4. Backend Functionality & Architecture Flow**
(Largely same as v2.9.B.3, FSM-driven.)

*   **Data Retrieval:** `src/services/data-sources/adapters/polygon-adapter.ts`.
*   **Genkit AI Flows:** `analyze-ta-flow.ts`, `analyze-stock-data.ts`, `analyze-options-chain-flow.ts`, `chat-flow.ts`.
*   **Server Actions:** `analyze-stock-server-action.ts`, etc.
*   **FSM Architecture:** Managed by `StockAnalysisContext` and `MainTabContent`.

## **4. Technology Stack (Mandatory)**
(Same as v2.9.B.3)

*   **Frontend Framework:** Next.js (latest stable v14.x or v15.x, **App Router mandatory**)
*   **Language:** TypeScript
*   **UI Components:** ShadCN UI (latest stable)
*   **Icons:** Lucide React (latest stable)
*   **Styling:** Tailwind CSS (latest stable v3.x)
*   **AI Integration:** Genkit (latest stable **v1.x series**)
*   **AI Model Provider:** Google AI (using `@genkit-ai/googleai`)
*   **Default AI Model:** `googleai/gemini-2.5-flash-preview-05-20` (defined in `src/ai/models.ts`)
*   **State Management:** React Context API (`StockAnalysisProvider`), `useReducer` (FSM), `useActionState`.
*   **Data Fetching (External API):** **Polygon.io REST Client (`@polygon.io/client-js` version `^7.3.2` or latest compatible stable)**.
*   **Deployment Target (Initial):** Firebase App Hosting
*   **Build Tooling:** Next.js CLI (Turbopack enabled by default: `next dev --turbopack`).

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**
(See Section 0 for master directives, especially the new rules in 0.5.)

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
*   `StockAnalysisContext`: Central state. FSM (`useReducer`). `MainTabContent` dispatches FSM events. `useActionState`.

#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**
(Content on `async_hooks`, client-side bundling, `'use server';` directive, Genkit syntax remains relevant. Client Debug Console improvements are ongoing.)

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9 In Progress. Current application version: v2.9.B.9.)*

---
**Phase 0-8: COMPLETE**
---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **IN PROGRESS**
*   **Tasks 9.1 - 9.8: COMPLETE**
*   **Task 9.A: Comprehensive Full README.md update (v2.9.A.0):** - Status: **COMPLETE**
*   **Task 9.9: Testing and Debugging Fixes (v2.9.9.x -> v2.9.A.x -> v2.9.B.x):** - Status: **IN PROGRESS**
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

## **6. Changelog and Commit Log**

The detailed changelog for this document (README.md) and the application's commit log are now maintained in a separate `CHANGELOG.md` file in the project root. This provides a cleaner separation of concerns and keeps this PRD focused on requirements and operational guidelines.
Please refer to `CHANGELOG.md` for all version history and commit details.

---
