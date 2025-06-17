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
*   **Example:** If the current phase is 9, current task is C, and this is the 19th iteration (S in hex) for this task, the version will be `v2.9.C.S`. If the next task is a bug fix on top of this, it will be `v2.9.C.T` (or `v2.9.D.0` if it's a new sub-phase task).

---
## **1. Preamble: Purpose of this Document & Core Strategy (StockSage v2.9.C.Y)**

This document serves a dual purpose:

1.  **Product Requirements Document (PRD):** It defines the features, functionality, and design for StockSage (current version `v2.9.C.Y`). This version includes significant enhancements to debug logging and further attempts to refine AI options analysis.
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

## **2. High-Level Goals (Current Version v2.9.C.Y)**

*   **Functional Parity & Refinement:** Replicate and refine core features based on StockSage v1.2.14, enhanced with new UI/UX and capabilities outlined herein.
*   **UI-First & FSM Adherence:** Strictly follow the UI-First strategy with the FSM-orchestrated data pipeline and local component FSMs.
*   **Tabbed Interface:** Maintain the "Main" and "Debug" tab structure.
*   **Modern Architecture:** Implement using Next.js App Router, Server Components by default, and TypeScript.
*   **Best Practices:** Adhere to industry best practices for React, Next.js, Tailwind CSS, and Genkit development.
*   **AI Agent Guidelines Adherence:** Strictly follow the operational rules and phased plan detailed in this document, especially Section 0.
*   **Modularity and Maintainability:** Create a well-organized codebase with reusable components and clearly defined service layers, significantly improved by the Phase 9 FSM re-architecture, local FSMs, modularized AI prompts, and recent debug logging enhancements.
*   **User Experience:** Deliver a high-quality, responsive, and accessible user interface with clear feedback on processing states.
*   **Enhanced Debuggability:** Implement comprehensive server-side and client-side debug logging (with filtering), clear error reporting via toasts, and a dedicated FSM State Debug Card. Logging has been reviewed and streamlined in this version.
*   **Dynamic Versioning:** Maintain and display the application version `v2.9.C.Y` as per SOP (Section 0.7).
*   **Stability and Reliability:** Ensure application stability through rigorous bug fixing and robust error handling in AI flows and server actions.

### **2.1. Known Issues / Current Status (v2.9.C.Y)**
The application is currently stable. Key areas of ongoing refinement:
1.  **AI Key Takeaways (Defaulting Improved, Generation Still Monitored):**
    *   **v2.9.C.U/V:** Error handling and defaulting in the `analyzeStockData` flow (`src/ai/flows/analyze-stock-data.ts`) were improved to ensure a well-structured object is always returned, even if the AI fails to generate specific takeaways for all categories. The display now shows these defaults correctly.
    *   **Current Status:** While the error handling is more robust, the AI model itself may still sometimes fail to generate *meaningful* takeaways for all categories, resulting in the display of default "AI analysis for [category] was incomplete..." messages. This indicates a potential need for further prompt engineering for `analyze-stock-data.json` or adjustments to model selection/parameters for this specific task. **The AI prompt JSONs are considered a work in progress for debugging and optimizing AI generation quality.**
2.  **AI Options Analysis (Prompt Refined, Wall Detection Still Monitored):**
    *   **v2.9.C.U/V:** The prompt for `analyze-options-chain.json` was significantly "loosened" and made more insistent, explicitly requesting the AI to identify "AT LEAST 1 Call Wall and AT LEAST 1 Put Wall if any reasonable candidates exist," up to a maximum of 3.
    *   **Current Status:** The AI flow (`analyze-options-chain-flow.ts`) respects the AI's output. If the AI, despite the more insistent prompt, still returns empty walls (e.g., `{"callWalls": [], "putWalls": []}`), the UI correctly displays "No significant walls identified by AI." The effectiveness of the current prompt in consistently identifying obvious walls in all market conditions remains an area for monitoring and potential future prompt iteration. **The AI prompt JSONs are considered a work in progress for debugging and optimizing AI generation quality.**
3.  **Debug Logging (Enhanced and Streamlined):**
    *   **v2.9.C.W/X:** Comprehensive debug trace logging was added across server-side (AI definition loading, AI flows, server actions) and client-side (contexts, key components, FSMs) parts of the application.
    *   **v2.9.C.Y:** Existing debug logs were reviewed and streamlined to reduce noise (e.g., less verbose JSON snippets from display components, removal of redundant cache-bust logging in Polygon adapter's TA calls) while retaining critical trace information.

Overall, the application is stable, with ongoing efforts directed at improving the consistency and effectiveness of the AI-driven analysis features, supported by a significantly enhanced and now streamlined debugging framework.

## **3. Core Application Features (StockSage v2.9.C.Y)**

This section details the core features of StockSage v2.9.C.Y, serving as the Product Requirements.

### **3.1. Global Application Structure**
*   **Tabbed Interface:** Two primary tabs, "Main" and "Debug", managed by ShadCN `Tabs`.
*   **Header:**
    *   Displays "StockSage" branding and the current dynamic application version (e.g., `v2.9.C.Y`).
    *   Includes a theme toggler (Light/Dark/System).
    *   Displays the Global FSM's Previous, Current, and Target states.
*   **Footer:** Contains copyright information and a standard financial disclaimer.
*   **Theme:** Supports Light and Dark themes.
*   **Client-Side Debug Console & FSM State Debug Card:** Functionality remains robust, with enhanced and streamlined logging.

### **3.2. "Main" Tab Features (`src/components/main-tab-content.tsx`)**
*   **Stock Analysis Input Area:** Ticker input, "Analyze Stock", "Generate AI Key Takeaways", "Generate AI Options Analysis" buttons.
*   **Display Card Order & Content:**
    1.  Key Metrics Display
    2.  Stock Snapshot Details Display
    3.  Standard Technical Indicators Display
    4.  AI Analyzed Technical Analysis Display (Pivot Points - logic configured via JSON)
    5.  AI Key Takeaways Display (Flow error handling robust, generation quality monitored)
    6.  Options Chain Table Display
    7.  AI Analyzed Options Chain Display (Prompt refined for more wall identification, still monitored)
    8.  AI Chatbot Interface
    9.  Market Status Display
*   **Combined Data Export Controls:** Functionality remains.

### **3.3. "Debug" Tab Features (`src/components/debug-tab-content.tsx`)**
*   Raw JSON display areas and client debug log source settings. Logging is now more comprehensive and streamlined.

### **3.4. Backend Functionality & Architecture Flow**
*   **Global FSM & Local FSMs:** Orchestration remains the same, with enhanced logging.
*   **Data Retrieval:** `src/services/data-sources/adapters/polygon-adapter.ts` (logging streamlined).
*   **Genkit AI Flows & Definitions:**
    *   AI prompts and TA calculation configuration are loaded from JSON files in `src/ai/definitions/` via `src/ai/definition-loader.ts` (enhanced logging).
    *   `analyze-stock-data.ts`: Flow error handling robust, generation quality is a work in progress. Enhanced logging.
    *   `analyze-options-chain-flow.ts`: Prompt refined for more wall identification. Enhanced logging. AI generation quality is a work in progress.
*   **Server Actions:** Core functionality remains, interact with updated flows. Enhanced logging.

## **4. Technology Stack (Mandatory)**
(No changes from v2.9.C.T - Next.js App Router, TypeScript, ShadCN, Tailwind, Genkit v1.x, Google AI, Polygon.io)

### **4.1. AI Coding Agent - Specific Guidelines (Sub-Section of Section 0)**
(See Section 0 for master directives, especially the rules in 0.5.)

#### **4.1.1. Next.js Specifics**
*   App Router, Server Components, Server Actions, `next/image`.

#### **4.1.2. Genkit (v1.x) Specifics**
*   Global `ai` from `src/ai/genkit.ts`.
*   Flows (`'use server';`, JSDoc, Zod schemas, export wrapper & types) load their prompt/logic configurations from JSON files in `src/ai/definitions/` using `src/ai/definition-loader.ts`.
*   Prompts for LLMs use Handlebars. Media via data URIs. Tools: `ai.defineTool`.
*   Model IDs centralized. Safety Settings per flow (can also be defined in JSON).
*   **AI Prompt JSONs (e.g., `analyze-stock-data.json`, `analyze-options-chain.json`):** The content and effectiveness of these prompts are currently a work in progress and subject to ongoing debugging and refinement to improve AI generation quality and consistency.
*   All flows and definition loading now have enhanced debug logging.

#### **4.1.3. Data Fetching (Polygon.io)** (Logging streamlined)
#### **4.1.4. Styling & UI (ShadCN & Tailwind)** (No changes)
#### **4.1.5. State Management** (Enhanced logging in contexts)
#### **4.1.6. Known Pain Points & Lessons Learned (CRITICAL REMINDERS)**
(Content on `async_hooks`, client-side bundling, `'use server';` directive, Genkit syntax, `useActionState`, context provider nesting, and robust error handling in flows/actions remain crucial. Modularization of prompts aids iteration, but prompt engineering itself for consistent high-quality AI output for specific tasks like detailed takeaways or subtle options analysis remains an iterative process. Ensuring flows return well-structured data, even in error/default states, is key.)

## **5. Phased Implementation Plan (UI-First Strategy)**

*(Status: Phase 9, Task 9.C.Y Complete. Current application version: v2.9.C.Y.)*

---
**Phase 0-8: COMPLETE**
---
**Phase 9: Pipeline & Architecture Enhancements (FSM Re-architecture)** - Status: **ONGOING** (Focus on AI Options Analysis robustness)
*   **Tasks 9.1 - 9.8: COMPLETE**
*   **Task 9.A: Comprehensive Full README.md update (v2.9.A.0):** - Status: **COMPLETE**
*   **Task 9.9: Testing and Debugging Fixes (v2.9.9.x -> v2.9.A.x -> v2.9.B.x):** - Status: **COMPLETE**
    *   **Tasks 9.9.A.1 - 9.9.A.Z: COMPLETE/SUPERSEDED**
    *   **Tasks 9.9.B.0 - 9.9.B.9: COMPLETE**
*   **Task 9.C.0 - 9.C.9 (Consolidated Fixes & Features): COMPLETE**
*   **Task 9.C.A - 9.C.F (FSM Debug & UI Fixes): COMPLETE**
*   **Task 9.C.G: BUG FIX - AI Options Analysis Crash & Simplification, Restore Options Chain Table Visibility (v2.9.C.G):** Status: **COMPLETE**
*   **Task 9.C.H: BUG/FEAT - AI Chat Prompt Fix, Dynamic Combined Export, Options Table JSON Export (v2.9.C.H):** Status: **COMPLETE**
*   **Task 9.C.I: BUG FIX - AI Chat Broken (useActionState), Refine Chat UX & Export Logic (v2.9.C.I):** Status: **COMPLETE**
*   **Task 9.C.J: DEPLOY - Firebase App Hosting (v2.9.C.J):** Status: **COMPLETE**
*   **Task 9.C.K: BUG/FEAT - Refine AI Takeaways, Chat Prompt Details, and UI (v2.9.C.K):** Status: **COMPLETE**
*   **Task 9.C.L: BUG FIX - Refine AI Displays, Chat Formatting & Options Analysis (v2.9.C.L):** Status: **COMPLETE**
*   **Task 9.C.M: BUG FIX - AI Analyzed Options Chain Broken (Flow/Schema for 3 walls) (v2.9.C.M):** Status: **COMPLETE**
*   **Task 9.C.N: BUG FIX - AI Analyzed Options Chain Broken (Flow/Action Robustness) (v2.9.C.N):** Status: **COMPLETE**
*   **Task 9.C.O: BUG FIX - AI Analyzed Options Chain Broken (Simplify Prompt) (v2.9.C.O):** Status: **COMPLETE**
*   **Task 9.C.P: BUG FIX - AI Analyzed Options Chain Display Logic (v2.9.C.P):** Status: **COMPLETE**
*   **Task 9.C.Q: FEAT - Adaptive Call/Put Wall Detection (v2.9.C.Q):** Status: **COMPLETE**
*   **Task 9.C.R: REFACTOR - Simplify AI Options Analysis (v2.9.C.R):** Status: **COMPLETE**
*   **Task 9.C.S: FEAT - Modularize AI Prompts into JSON Files (v2.9.C.S):** Status: **COMPLETE**
*   **Task 9.C.T: BUG FIX - AI Key Takeaways Error Handling & Options Prompt Refinement (v2.9.C.T):** Status: **COMPLETE**
*   **Task 9.C.U: BUG FIX - AI Key Takeaways Defaulting & Options Prompt Loosening (v2.9.C.U):** Status: **COMPLETE**
*   **Task 9.C.V: BUG FIX & FEAT - AI Options Prompt (Enforce Min/Max Walls), Key Takeaways Monitoring (v2.9.C.V):** Status: **COMPLETE**
*   **Task 9.C.W: FEAT - Additional Debug Trace Logging (Phase 1: Server-Side) (v2.9.C.W):** Status: **COMPLETE**
*   **Task 9.C.X: FEAT - Additional Debug Trace Logging (Phase 2: Client-Side) (v2.9.C.X):** Status: **COMPLETE**
*   **Task 9.C.Y: FEAT - Streamline & Consolidate Debug Logs (v2.9.C.Y):** Status: **COMPLETE**

## **6. Changelog and Commit Log**

The detailed changelog for this document (README.md) and the application's commit log are now maintained in a separate `CHANGELOG.md` file in the project root.
Please refer to `CHANGELOG.md` for all version history and commit details.

---

