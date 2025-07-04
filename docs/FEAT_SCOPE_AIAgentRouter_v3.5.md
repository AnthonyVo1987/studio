
# Feature Scope: AI Agent Router (v3.5)

**Document Version:** 1.0
**Date:** 2025-08-15
**Target Application Version Series:** 3.5.x.y.z
**Feature Status:** `PLANNED`

## 1. Introduction & Objective

This document outlines the scope for a significant feature enhancement: the **AI Agent Router**. The primary objective is to replace the two separate "App Data Chat" and "Web Search Chat" components with a single, unified, and intelligent **"Smart Agent"** interface.

This agent will be responsible for understanding a user's natural language requests (or button clicks) and routing them to the correct backend function, whether it's a non-grounded analysis of application data, a web-grounded search, or a specific, pre-canned analysis like "Key Takeaways". This feature builds upon the stable, deterministic architecture established in v3.4, using it as a foundation rather than replacing it.

## 2. Core Concept & User Experience

*   **Unified Interface:** The two current `Chatbot` components will be removed from the UI. They will be replaced by a single, more capable `SmartAgentChat` component.
*   **Natural Language Routing:** Users will interact with this single chat window for all AI-driven tasks. They can ask "What are the put walls for NVDA?" or "What is the latest news affecting the market?" without needing to know which system to use.
*   **Reliable Button Actions:** Existing example prompt buttons will be integrated into the new interface. These will send deterministic directives to the agent, ensuring 100% reliable routing for these common actions.

## 3. New Architectural Components

This feature will be implemented by creating a new, isolated routing layer on top of our existing, stable actions and flows.

1.  **`SmartAgentChat.tsx`**: A new UI component that provides the single, unified chat interface for the user. It will manage the chat history and call the new agent server action.
2.  **`agent-router-action.ts`**: A new server action that will serve as the single bridge between the client (`SmartAgentChat.tsx`) and the AI agent flow.
3.  **`agent-router-flow.ts`**: The "brain" of the new feature. This is a Genkit flow whose sole purpose is to perform Natural Language Understanding on the user's request. It will use a set of defined **Genkit Tools** to decide which existing backend function to call. It will **not** contain business logic itself.

## 4. Tool Definition Strategy: Wrapping Existing Stable Logic

The key to stability is that the new agent **will not** replace our existing, battle-tested logic. Instead, it will use tools that are simple wrappers around our current server actions. This isolates the "unpredictable" AI decision-making to a single routing step.

The `agent-router-flow` will have the following tools defined:

*   **`runKeyTakeawaysTool`**:
    *   **Description for AI:** "Use to generate fundamental AI key takeaways (price action, trend, etc.). Requires base data to be loaded first."
    *   **Action:** Calls the existing `performAiAnalysisAction`.
*   **`runOptionsAnalysisTool`**:
    *   **Description for AI:** "Use to analyze the options chain and find Call/Put walls. Requires options data to be loaded first."
    *   **Action:** Calls the existing `performAiOptionsAnalysisAction`.
*   **`runAppDataChatTool`**:
    *   **Description for AI:** "Use for questions about data already loaded in the app (e.g., 'summarize the pivot points'). This tool CANNOT access the internet."
    *   **Action:** Calls the existing `appDataChatAction`.
*   **`runWebSearchChatTool`**:
    *   **Description for AI:** "The default tool for most queries. Use for ANY question requiring real-time web information, news, or financial term definitions."
    *   **Action:** Calls the existing, stable `sdkWebSearchChatAction`.

## 5. Implementation Task Breakdown Plan

This feature will be implemented in discrete phases to ensure stability and manage risk.

*   **Phase 1: Create the Agent Flow & Tools**
    *   **Task 3.5.1.0:** Create `src/ai/schemas/agent-router-schemas.ts` to define the Zod schemas for the new action's inputs and outputs.
    *   **Task 3.5.1.1:** Create `src/ai/flows/agent-router-flow.ts`.
    *   **Task 3.5.1.2:** Within the new flow file, define all four tools (`runKeyTakeawaysTool`, `runOptionsAnalysisTool`, `runAppDataChatTool`, `runWebSearchChatTool`) using `ai.defineTool`. Each tool's implementation will simply call its corresponding existing server action.
    *   **Task 3.5.1.3:** Define the main `agentRouterFlow` using `ai.defineFlow`. This flow will take the user's input, be configured with the four tools, and include a robust system prompt that clearly explains when to use each tool.

*   **Phase 2: Create the Agent's Server Action**
    *   **Task 3.5.2.0:** Create `src/actions/agent-router-action.ts`.
    *   **Task 3.5.2.1:** This action will serve as a simple, secure bridge. It will receive the payload from the client and pass it directly to the `agentRouterFlow`. It will then return the flow's final result back to the client.

*   **Phase 3: UI Refactoring & Integration**
    *   **Task 3.5.3.0:** Create the new `src/components/smart-agent-chat.tsx` component. This component will manage the unified chat history and use the `useActionState` hook to communicate with the new `agentRouterAction`.
    *   **Task 3.5.3.1:** In `src/components/main-tab-content.tsx`, remove the two old `Chatbot` components.
    *   **Task 3.5.3.2:** Add the new `SmartAgentChat` component into `main-tab-content.tsx`.

*   **Phase 4: Final Testing & Cleanup**
    *   **Task 3.5.4.0:** Perform comprehensive end-to-end testing of all chat and AI functions through the new agent interface.
    *   **Task 3.5.4.1:** Once verified, audit the codebase for any remaining unused chat-related components or state and mark them for removal in a subsequent cleanup task.

## 6. Value, Risks, and Mitigation

*   **Value Added:**
    *   **Simplified UX:** A single, natural language interface for all AI tasks.
    *   **Architectural Cohesion:** Centralizes AI routing logic, making the system easier to maintain and extend.
*   **Key Risks & Mitigations:**
    *   **Incorrect Tool Routing:** Mitigated by meticulous system prompt engineering and using deterministic directives for UI button clicks.
    *   **Increased Latency:** Mitigated by using optimistic UI updates and clear "Agent is thinking..." feedback to manage user perception.
    *   **Data Availability Failures:** Mitigated by ensuring each tool's underlying action is self-contained and performs its own input validation, returning a clear error if prerequisites (like loaded data) are not met.

## 7. Document Changelog
*   **v1.0 (2025-08-15):** Initial document creation.
