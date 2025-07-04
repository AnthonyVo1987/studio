
# Feature Status Report: AI Agent Router (v3.5)

**Document Version:** 1.0
**Date:** 2025-08-15
**Feature Target Application Version Series:** 3.5.x.y.z

## 1. Overall Feature Status

**Current Status:** `PLANNED`
**Last Updated:** 2025-08-15

**Summary:** This feature is currently in the planning stage. The objective is to replace the application's two separate chatbot interfaces with a single, unified "Smart Agent" that can intelligently route user requests to the appropriate backend AI function or tool. This will be built on top of the existing stable, deterministic architecture.

## 2. Known Issues

*   No known issues at this stage. This is a new feature in the planning phase.

## 3. Phase & Task Status

The implementation is broken down into the following phases. All tasks are currently planned.

### Phase 1: Create the Agent Flow & Tools
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.5.1.0:** Create Zod schemas for the agent action. (`PLANNED`)
    *   **v3.5.1.1:** Create `agent-router-flow.ts` file. (`PLANNED`)
    *   **v3.5.1.2:** Define all four required tools (`runKeyTakeawaysTool`, `runOptionsAnalysisTool`, `runAppDataChatTool`, `runWebSearchChatTool`). (`PLANNED`)
    *   **v3.5.1.3:** Define the main `agentRouterFlow` with its system prompt and tool configuration. (`PLANNED`)

### Phase 2: Create the Agent's Server Action
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.5.2.0:** Create `agent-router-action.ts` file. (`PLANNED`)
    *   **v3.5.2.1:** Implement the server action to bridge the client and the new agent flow. (`PLANNED`)

### Phase 3: UI Refactoring & Integration
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.5.3.0:** Create the new `SmartAgentChat.tsx` UI component. (`PLANNED`)
    *   **v3.5.3.1:** In `main-tab-content.tsx`, remove the two existing `Chatbot` components. (`PLANNED`)
    *   **v3.5.3.2:** Integrate the new `SmartAgentChat` component into the main UI. (`PLANNED`)

### Phase 4: Final Testing & Cleanup
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.5.4.0:** Comprehensive end-to-end testing of the new agent interface. (`PLANNED`)
    *   **v3.5.4.1:** Audit and identify obsolete code for future removal. (`PLANNED`)

## 4. Document Changelog
*   **v1.0 (2025-08-15):** Initial document creation to track the new AI Agent Router feature.
