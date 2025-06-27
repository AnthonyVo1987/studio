
# Feature Scope: Dual AI Chat Architecture (v3.3.16.4.F)

**Document Version:** 9.0
**Date:** 2025-07-31
**Target Application Version Series:** 3.3.16.4.F+
**Feature Status:** `IN PROGRESS - FINAL TESTING`

## 1. Introduction & Objective

This document outlines the scope for a significant architectural refactor of the StockSage AI Chat functionality. The primary objective is to **resolve the persistent `Unable to determine type of tool` error** by decoupling the chat system into two distinct, parallel, and isolated streams: one for App Data Analysis and one for Grounded Web Search. This new design abandons the fragile, polymorphic `chat-flow` in favor of two purpose-built, independent code paths, dramatically improving stability and debuggability.

## 2. Core Problem Area Addressed

The audit of `v3.3.16.4.E` confirms that attempting to manage both grounded (tool-using) and non-grounded (structured JSON output) requests within a single, polymorphic flow (`chat-flow.ts`) creates an irreconcilable architectural conflict within Genkit. The core problem is the mutual exclusivity of `tools` and `output.schema` in a prompt definition, which the current design fails to manage correctly at the flow level.

## 3. Proposed Solution: A Decoupled, Dual-Chat Architecture

The solution is to physically separate the two functionalities into completely independent streams, from the UI down to the AI prompts. This eliminates complex conditional logic and ensures each path is optimized for its specific task.

---

#### 3.1 Stream 1: App Data AI Chat (No Web Search)

This stream is focused exclusively on analyzing the data already loaded within the application (stock snapshot, TAs, etc.).

*   **UI:** The existing `Chatbot` component has been repurposed for this stream.
*   **Code Path & AI Architecture:**
    *   Uses a dedicated server action (`app-data-chat-action.ts`) and AI flow (`app-data-chat-flow.ts`).
    *   The `ai.definePrompt` call **always** includes a structured `output.schema` and **never** includes a `googleSearch` tool. This path is stable.

---

#### 3.2 Stream 2: Grounded AI Chat (Web Search Enabled) - **Refactored in v3.3.16.7.49**

This new stream handles all interactions requiring real-time web search capabilities. The initial Genkit-based implementation proved unstable and has been **completely replaced**.

*   **UI:** A second `Chatbot` component is dedicated to this stream.
*   **Code Path & AI Architecture (New):**
    *   The Genkit-based `web-search-chat-flow.ts` and `web-search-chat-action.ts` have been **deprecated**.
    *   A new, robust server action, `sdk-web-search-chat-action.ts`, now powers this chat.
    *   This action uses the **raw Google AI SDK (`@google/generative-ai`)** to make API calls, completely bypassing the problematic Genkit tool abstraction for this use case.
*   **FSM Integration:**
    *   The chat submission for this stream is now handled by a **local, deterministic FSM** within `chatbot-fsm-context.tsx`. This provider directly calls the new SDK action and updates the chat history upon completion, removing the dependency on the complex global FSM orchestrator and eliminating a major source of race conditions.

---

## 4. General Details & Value Added

*   **Clarity & Stability:** By creating two separate, non-interacting streams (and replacing the unstable one with a more direct SDK implementation), we eliminate the source of the tool-use conflict.
*   **Simplified Debugging:** A bug in the web search chat can now be traced along its own isolated path. The Debug Tab has separate display boxes for each chat stream's data.
*   **Decoupled from Pipeline (v3.3.16.7.50):** All chat prompts are now **100% manual**. The complex logic for triggering chats automatically as part of the main analysis pipeline has been **removed**, simplifying the FSM and making the application more predictable.

## 5. Implementation Phased Plan

### Phase 1: Foundation & App Data Chat Refactor
*   **Status:** `COMPLETED`

### Phase 2: Build Grounded Web Search Chat Stream
*   **Status:** `COMPLETED`

### Phase 3: Final Cleanup & Testing
*   **Objective:** Clean up obsolete code and perform final integration tests.
*   **Status:** `IN PROGRESS`
*   **Tasks:** 
    *   **v3.3.16.7.0 - v3.3.16.7.47:** Various Genkit debugging and SDK diagnostic tool implementations. (`COMPLETED`)
    *   **v3.3.16.7.49 (Part A):** Upgrade Web Search Chat to use the raw Google AI SDK, deprecating the Genkit flow. (`COMPLETED`)
    *   **v3.3.16.7.50 (Part B):** Decouple all AI chat prompts from the automated analysis pipeline. (`COMPLETED`)
    *   **v3.3.16.8.x:** (Next) Comprehensive end-to-end testing of the new, stable architecture. (`PLANNED`)
    *   **v3.3.16.8.x:** Continue debugging of Chatbot scrollbars. (`PLANNED`)

## 6. Post-Mortem: Why the Genkit Web Search Failed & SDK Succeeded

*   **What Went Wrong:** The initial design attempted to use a single, polymorphic Genkit flow (`web-search-chat-flow.ts`) to handle multiple, slightly different web search prompts. This, combined with the non-deterministic FSM orchestrator, created a brittle system that was difficult to debug. The core issue within Genkit—the conflict between `tools` and `output.schema`—was a recurring problem that simple fixes could not resolve.
*   **How We Got It Right:**
    1.  **Isolation:** The creation of the `sdk-debug-chatbot` proved that a direct, simple call using the raw Google AI SDK was perfectly stable and functional.
    2.  **Deterministic Action:** By moving the web search logic into its own server action (`sdk-web-search-chat-action.ts`) and calling it from a simple, local FSM in the `ChatbotFsmProvider`, we created a predictable, linear request-response cycle. This completely bypassed the complex global FSM orchestrator, which was the source of the race conditions.
    3.  **Simplification:** Decoupling the chat prompts from the automated pipeline (Part B) was the final step in simplification. It removed a whole layer of conditional logic from the FSM, making it far more robust.
*   **Lesson Learned:** For features that are proving architecturally unstable, sometimes the best solution is to **replace the abstraction (Genkit tools) with a more direct implementation (raw SDK)** and to **radically simplify the control flow (remove from global FSM)**.

## 7. Document Changelog
*   **v9.0 (2025-07-31):** Updated entire document to reflect the completion of the SDK web search refactor and decoupling from the analysis pipeline. Added a new post-mortem section. Marked feature as ready for final testing.
*   **v8.0 (2025-07-30):** Updated Phase 3 task list to reflect the completion of the deterministic SDK debug tool fix (`v3.3.16.7.43` - `v3.3.16.7.47`).
*   **v7.0 (2025-07-29):** Updated Phase 3 task list to reflect the completion of the SDK debug tool (`v3.3.16.7.36` - `v3.3.16.7.41`) and scope the FSM re-architecture for a new version series (`v3.3.16.8.x`).
*   **v6.0 (2025-07-26):** Updated Phase 3 task list to reflect the completion of the fully isolated diagnostic chat components (v3.3.16.7.29) and the failed tool reference fix (v3.3.16.7.28).
*   **v5.0 (2025-07-25):** Updated Phase 3 task list to reflect the completion of the diagnostic debug prompt feature (v3.3.16.7.26) and to scope the upcoming FSM re-architecture as the next planned task.
*   **v4.0 (2025-07-22):** Updated Phase 3 task list to reflect the failed fix attempt in v3.3.16.7.21 and ongoing debugging.
*   **v3.0 (2025-07-20):** Updated status to `IN PROGRESS - TESTING & DEBUGGING`. Documented the successful fix for the App Data Chat pipeline loop and the unresolved status of the chat scrollbar bug. Updated Phase 3 task list.
*   **v2.0 (2025-07-19):** Updated feature status to `READY FOR TESTING`. Marked implementation phases as complete. Updated Phase 3 task status.
*   **v1.0 (2025-07-19):** Initial document creation.
