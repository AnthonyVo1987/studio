
# Feature Status Report: AI Chat Prompt & Google Search Grounding Consolidation (v3.3.16)

**Document Version:** 2.0
**Date:** 2025-07-06
**Feature Target Application Version Series:** 3.3.16.x.z

## 1. Overall Feature Status

**Current Status:** `IN PROGRESS`
**Last Updated:** 2025-07-06

**Summary:** This feature is planned to execute a major refactoring and consolidation of all AI chat and web search functionalities. The objective is to create a single, unified, and configuration-driven execution path, clarifying terminology, standardizing AI prompt configurations, and enhancing the capabilities of the web search prompts. Phase 1 is now complete.

## 2. Phase & Task Status

### Phase 1: Terminology & Configuration Refactor
*   **Overall Phase Status:** `COMPLETED`
*   **Tasks:**
    *   **v3.3.16.1.0:** Rename "Augmented" assets to "Web Search" terminology. (`COMPLETED`)
    *   **v3.3.16.1.1:** Add `useGoogleSearch` flag to `LlmPromptDefinitionSchema`. (`COMPLETED`)
    *   **v3.3.16.1.2:** Rename/create prompt JSON definition files. (`COMPLETED`)
    *   **v3.3.16.1.3:** Add `thinkingBudget: -1` to all prompt JSONs. (`COMPLETED`)
    *   **v3.3.16.1.4:** Add `useGoogleSearch` flag to all relevant prompt JSONs. (`COMPLETED`)
    *   **v3.3.16.1.5:** Update content of web search prompts with new requirements. (`COMPLETED`)

### Phase 2: AI Flow, FSM, and UI Unification
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.3.16.2.0:** Refactor `chat-flow.ts` to be a pure, `promptName`-driven orchestrator. (`PLANNED`)
    *   **v3.3.16.2.1:** Update schemas and server action to use `promptName`. (`PLANNED`)
    *   **v3.3.16.2.2:** Remove global "Enable Google Search for Chat" UI and state. (`PLANNED`)
    *   **v3.3.16.2.3:** Reorganize Chatbot buttons and update their dispatch logic. (`PLANNED`)
    *   **v3.3.16.2.4:** Refactor FSM orchestrator to use new `SUBMIT_CHAT_MESSAGE` with `promptName` for pipeline macros. (`PLANNED`)

### Phase 3: Debugging & Cleanup
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.3.16.3.0:** Increase debug log buffer to 2000. (`PLANNED`)
    *   **v3.3.16.3.1:** Change default log settings. (`PLANNED`)
    *   **v3.3.16.3.2:** Audit and update all debug log messages for new architecture. (`PLANNED`)
    *   **v3.3.16.3.3:** Delete obsolete `augmented-*-search-flow.ts` files. (`PLANNED`)

### Phase 4: Final Testing & Documentation
*   **Overall Phase Status:** `PLANNED`
*   **Tasks:**
    *   **v3.3.16.4.0:** Comprehensive end-to-end testing. (`PLANNED`)
    *   **v3.3.16.4.1:** Final Phase Completion Commit. (`PLANNED`)

## 3. Feature Changelog & Commit History

| Date       | Version Tag (Task ID)         | Commit Hash (if applicable) | Summary of Changes                                                                  | Status    |
| :--------- | :---------------------------- | :-------------------------- | :---------------------------------------------------------------------------------- | :-------- |
| 2025-07-06 | `v3.3.16.1.5` (Phase 1 Complete) | TBD                         | Completed Phase 1: Terminology & Configuration Refactor. App version set.         | COMPLETED |
| 2025-07-05 | `v3.3.16.0.0` (Feature Scoped) | TBD                         | Feature scope and implementation plan approved. Documents generated. App version set. | COMPLETED |

## 4. Document Changelog (for this FEAT_STATUS_xxx.md file)

*   **v2.0 (2025-07-06):** Marked Phase 1 as COMPLETED and updated the changelog table.
*   **v1.0 (2025-07-05):** Initial document creation.
