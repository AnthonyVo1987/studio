
# Feature Scope: Enhanced Debug Consoles (v3.3.16.8.0)

**Document Version:** 1.0
**Date:** 2025-08-02
**Target Application Version Series:** 3.3.16.8.x
**Feature Status:** `IMPLEMENTATION COMPLETE`

## 1. Introduction & Objective

This document outlines the scope for a comprehensive overhaul of the StockSage application's debugging capabilities. The **primary objective** is to create a more powerful, organized, and granular debugging experience. This is achieved by separating data inspection from log tracing, introducing a new raw console log view, standardizing all data exports to JSON, and providing one-click system snapshot exports for efficient bug reporting.

## 2. Core Problem Areas Addressed

*   **Mixed Concerns:** The previous "Debug" tab and pop-up console mixed raw data display with log tracing, making it difficult to focus on one or the other.
*   **Limited Log Visibility:** The curated log buffer, while useful, would occasionally filter out low-level browser or framework errors that are critical for deep-dive debugging.
*   **Inconsistent Exports:** Data exports were offered in multiple formats (JSON, TXT, CSV), adding unnecessary complexity to the codebase and UI.
*   **Inefficient Bug Reporting:** Gathering all necessary information for a bug report (FSM state, data JSONs, logs) was a manual and error-prone process.

## 3. Proposed Solution: Decoupled & Enhanced Debugging Architecture

The solution involves refactoring the UI into a multi-tab system where each tab has a distinct debugging purpose, and adding a centralized snapshot feature.

### 3.1. Data-Focused Debugging: "Debug Data" Tab & JSON Consolidation
*   **"Debug Data" Tab:** The former "Debug" tab is repurposed and renamed to "Debug Data". Its sole function is to display the raw JSON inputs and outputs for every major data and AI pipeline step.
*   **JSON-Only Exports:** All "Copy" and "Export" functions on individual UI cards (e.g., Key Takeaways, Options Chain) are standardized to JSON only, removing all other formats.

### 3.2. Decoupled Log Consoles
The single pop-up console is replaced by two dedicated, full-page tabs for a superior logging experience.
*   **"Client Debug Trace Logs" Tab:** Houses a large, persistent console for the application's curated, high-level trace logs (`logDebug`). The buffer is increased to 2000 entries.
*   **"Console Logs" Tab:** A new, parallel tab that provides a verbatim, unfiltered duplicate of the browser's developer console output. This captures everything, including framework warnings and errors, and has its own 2000-entry buffer.

### 3.3. Centralized Debug Snapshot Controls
*   **New UI Card on Main Tab:** A new `DebugSnapshotControls` component is added to the "Main" tab.
*   **Granular Snapshots:** It provides one-click "Copy JSON" and "Export JSON" buttons for four distinct snapshot types.
*   **FSM State Included:** **All** snapshots automatically include the complete state of the global FSM (current/previous state, all flags, and all variables) for maximum context.
    1.  **Full Snapshot:** All FSM data, all debug data, all chat histories, and both log buffers.
    2.  **Client Debug Snapshot:** The standard report; includes everything except the raw console logs.
    3.  **Console Debug Snapshot:** For deep-dive issues; includes everything except the curated trace logs.
    4.  **Data-Only Snapshot:** For AI prompt/data issues; includes FSM data, debug data, and chat histories only.

## 4. Value Added

*   **Clarity:** A clear separation of concerns between inspecting data and tracing logs.
*   **Power:** The raw "Console Logs" tab provides unprecedented visibility into low-level application behavior.
*   **Efficiency:** Standardizing on JSON exports simplifies the code and UI.
*   **Streamlined Bug Reporting:** One-click snapshots drastically reduce the time and effort required to create a comprehensive bug report.

## 5. Implementation Phased Plan
The feature was implemented in the following phases:
*   **Phase 1 (`v3.3.16.8.0`):** Preparation & UI Cleanup (Standardized all exports to JSON).
*   **Phase 2 (`v3.3.16.8.1`):** Refactored and relocated the Client Trace Log console to its own tab.
*   **Phase 3 (`v3.3.16.8.3`):** Implemented the new "Console Logs" tab with its own buffer and logging hooks.
*   **Phase 4 (`v3.3.16.8.4`):** Implemented the `DebugSnapshotControls` card and its associated logic.
*   **Phase 5 (`v3.3.16.8.5`):** Final documentation update and pre-testing checkpoint.

## 6. Document Changelog
*   **v1.0 (2025-08-02):** Initial document creation.
