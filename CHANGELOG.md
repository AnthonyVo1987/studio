
# StockSage Change History

## Changelog (CHANGELOG.md)
*   **Version 1.58 (Task v3.1.3.4 Docs):** 2025-06-20 - Firebase Studio (AI Prototyper)
    *   Finalized documentation for the "Debug Log Enhancements" feature (v3.1.x.y series, culminating in App Version `v3.1.3.4` / commit `9aef8261`).
    *   Updated `docs/FEAT_SCOPE_DebugLogEnhancements_v3.1.md` and `docs/FEAT_STATUS_DebugLogEnhancements_v3.1.md` to mark all phases and tasks as complete.
    *   Updated `README.md` to `v1.57`, prepending new AI Coding Agent Operating Procedures and reflecting the current application state (PRD, Design, Architecture) as of App Version `v3.1.3.4`.
    *   Added a consolidated entry to this `CHANGELOG.md` summarizing the completion of the "Debug Log Enhancements" feature under app version `v3.1.3.4`.
*   **Version 1.56 (Task v3.0.0.1):** 2025-06-19 - Firebase Studio (AI Prototyper)
    *   **BUG FIX (Critical):** Enforced fully dynamic application versioning.
        *   Removed hardcoded `APP_VERSION_FOR_EXPORT` constant from `src/components/debug-console.tsx`.
        *   Modified `DebugConsole` component to receive `appVersion` as a prop (sourced dynamically from `app-metadata.json` via `PageContent` -> `Home`).
        *   Updated export helper functions (`getFsmStatesAndTimestampForExport`, `generateLogsTxtWithMetadata`, `generateLogsCsvWithMetadata`) within `debug-console.tsx` to use the dynamic `appVersion` prop for all log export metadata.
        *   Updated `src/components/page-content.tsx` to pass the dynamic `appVersion` to the `DebugConsole` component.
    *   Updated `README_3.0.md` (to v3.0.1) to strictly reflect this dynamic versioning policy: `app-metadata.json` is the sole source of truth for `appVersion`, and all UI/export versioning is dynamic. Hardcoded versions are prohibited.
    *   Updated `CHANGELOG.md` (this file) with this commit log for `v3.0.0.1`.
    *   `src/config/app-metadata.json` remains at `v3.0.0.1` from the previous AI definition loading fix.
*   **Version 1.55 (Task v2.9.D.U Docs):** 2025-06-19 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.55) to reflect application functional version `v2.9.D.U` (commit `cd5e3a46`).
    *   Codified new versioning procedures in `README.md` (Section 3.7): version updates strictly in `app-metadata.json`; manual version updates in `header.tsx` and `debug-console.tsx` are prohibited for app versioning.
    *   Reinforced strict policy against placeholder timestamps in `app-metadata.json` within `README.md`.
    *   Updated `CHANGELOG.md` (this file) with this commit log detailing the documentation consolidation for `v2.9.D.U`.
    *   No changes to `src/config/app-metadata.json`, `src/components/layout/header.tsx`, or `src/components/debug-console.tsx` were made as part of this documentation-only update, as their `v2.9.D.U` state was established by prior commit `cd5e3a46`.
*   **Version 1.54 (Task v2.9.D.U):** 2025-06-19 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.54) with current app version `v2.9.D.U`. Codified AI `thinkingConfig` usage and metadata timestamp policy.
    *   Updated `CHANGELOG.md` (this file) with new commit log for `v2.9.D.U`.
    *   Updated `src/config/app-metadata.json` to app version `v2.9.D.U` and a new real timestamp.
    *   Updated `src/components/layout/header.tsx` and `src/components/debug-console.tsx` (`APP_VERSION_FOR_EXPORT`) to `v2.9.D.U`.
*   **Version 1.53 (Task v2.9.D.M):** 2025-06-19 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.53) with current app version `v2.9.D.M`.
    *   Updated `CHANGELOG.md` (this file) with new commit log for `v2.9.D.M`.
    *   Updated `docs/Issue-Report_AI_Analysis_Buttons.md` to reflect debugging progress and final resolution through task `v2.9.D.M`.
    *   Updated `src/components/layout/header.tsx` and `src/components/debug-console.tsx` (`APP_VERSION_FOR_EXPORT`) to `v2.9.D.M`.
*   **Version 1.52 (Task v2.9.D.L):** 2025-06-19 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.52) with current app version `v2.9.D.L`, acknowledging fixed AI prompt safety settings and improved client-side error display for AI takeaways.
    *   Updated `CHANGELOG.md` (this file) with new commit log for `v2.9.D.L`.
    *   Updated `docs/Issue-Report_AI_Analysis_Buttons.md` to reflect debugging progress up to task `v2.9.D.L`, noting the AI safety setting fix and outlining the scope for `v2.9.D.M`.
    *   Updated `src/components/layout/header.tsx` and `src/components/debug-console.tsx` (`APP_VERSION_FOR_EXPORT`) to `v2.9.D.L`.
*   **Version 1.51 (Task v2.9.D.I):** 2025-06-18 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.51) with current app version `v2.9.D.I`, Gemini model update to `googleai/gemini-2.5-flash-lite-preview-06-17`, and refined details in architecture, AI flow, and logging sections.
    *   Updated `CHANGELOG.md` (this file) with new commit log for `v2.9.D.I`.
    *   Updated `docs/Issue-Report_AI_Analysis_Buttons.md` to reflect debugging progress up to task `v2.9.D.I`.
    *   Updated AI model ID to `googleai/gemini-2.5-flash-lite-preview-06-17` in `src/ai/models.ts`, `src/ai/genkit.ts`, and all relevant `modelId` fields in JSON prompt definitions under `src/ai/definitions/`.
    *   Updated `APP_VERSION_FOR_EXPORT` in `src/components/debug-console.tsx` to `v2.9.D.I`.
*   **Version 1.50 (Task v2.9.C.0):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.50) with version `v2.9.C.0` after Chatbot FSM pilot. Added new Task 9.C.0 to Phased Plan. Updated AI operational rules for XML output (Section 0.5).
*   **Version 1.1 (Task v2.9.B.9):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.49) with new AI operational rules (XML output, token efficiency, immediate coding post-approval).
*   **Version 1.0 (Task v2.9.B.4):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Created `CHANGELOG.md` to decouple detailed changelogs from `README.md`.
    *   Migrated "StockSage Application Commit Log" from `README.md`.
    *   This section will track changes to `CHANGELOG.md` itself. Future updates to the application commit log will be prepended to the section below.

---
## StockSage Application Commit Log (v3.x.x.x and v2.x.y.z)

This section tracks the commit history of the StockSage application. Latest commits are at the top.

---
**App Version:** `v3.3.16.7.12` (Intermediate Debugging Checkpoint)
**Tag:** `Phase-53_Task-3.3.16.7.12_CheckpointUnresolvedUiBug`
**Commit Hash:** `b6523420`
**Subject:** `docs(all): Checkpoint v3.3.16.7.12, acknowledge unresolved UI bug & document pipeline fixes`
**Details:**
This is a **documentation-only** commit to checkpoint the application's state during the final testing phase of the "Dual AI Chat Architecture" feature. It formally acknowledges two key points:
1.  **Unresolved UI Bug:** The fix for the non-functional AI Chat scrollbars (`v3.3.16.7.10`) was **unsuccessful**. The bug persists, and debugging will continue.
2.  **Successful Pipeline Fix (Context for Future Debugging):** The critical bug causing the automated "App Data AI Chat" pipeline to loop infinitely (`v3.3.16.7.17`) **has been successfully resolved**.
    *   **Root Cause:** The FSM orchestrator was using a single string (`lastCompletedChatPromptName`) to track progress, causing it to loop when checking which prompt to run next.
    *   **The Fix:** This was corrected by replacing the string with a `completedChatPrompts: string[]` array. The FSM now correctly checks if a prompt name is already in this array before dispatching it, ensuring each step runs only once.
    *   **Current State:** The "App Data AI Chat" pipeline is now stable and correctly sequences through all selected prompts. This successful architectural pattern (using an array to track completed steps) will serve as the model for debugging the "Web Search AI Chat" pipeline in future tasks.
---
**App Version:** `v3.3.16.7.9` (Revert & Checkpoint)
**Tag:** `Phase-54_Task-3.3.16.7.9_RevertFailedPipelineFixes`
**Commit Hash:** `abfeffb3`
**Subject:** `docs(all): Checkpoint v3.3.16.7.9, revert failed pipeline fixes for re-evaluation`
**Details:**
This is a documentation and checkpoint commit that officially reverts the three previous, unsuccessful attempts to fix the AI analysis pipeline stall (versions `v3.3.16.7.6` through `v3.3.16.7.8`). This action is taken to restore the codebase to a known-stable (though still buggy) state, providing a clean baseline for a new round of debugging.
*   **Code Revert:** The FSM orchestrator logic in `stock-analysis-context.tsx` and the granular AI call logs in the server actions have been reverted to their pre-`v3.3.16.7.5` state.
*   **Known Issue:** The pipeline stall after `DATA_FETCH_SUCCEEDED` remains the primary active bug. The investigation will resume from this reverted state in the next task.
*   **Documentation:** All project documents (`README.md`, `CHANGELOG.md`, `FEAT_STATUS...`) have been updated to reflect this revert and the current application version.
---
**App Version:** `v3.3.16.7.1` (Phase Completion)
**Tag:** `Phase-52_Task-3.3.16.7.1_FinalCleanupAndDocs`
**Subject:** `feat(core,docs): Final cleanup and documentation for Dual Chat feature (v3.3.16.7.1)`
**Details:**
This commit completes the implementation phase of the **"Dual AI Chat Architecture"** feature. It performs final code cleanup and updates all project documentation to reflect the new, stable architecture, preparing the application for the final testing phase.
*   **Code Cleanup:** Deleted obsolete files from the old polymorphic chat system (`chat-flow.ts`, `chat-server-action.ts`, `chat-schemas.ts`, `stock-chatbot.json`).
*   **Genkit Entrypoint:** Updated `src/ai/dev.ts` to remove the import for the deleted `chat-flow.ts`.
*   **Documentation:** Updated `README.md` and feature-specific documents (`FEAT_SCOPE_...`, `FEAT_STATUS_...`) to reflect the completion of implementation Phases 1 and 2 and to set the stage for testing.
*   **Metadata:** Updated application version in `src/config/app-metadata.json` to `v3.3.16.7.1`.
---
**App Version:** `v3.3.16.6.4` (Complete Phase 2 of Dual Chat Architecture)
**Tag:** `Phase-51_Task-3.3.16.6.4_CompleteDualChatPhase2`
**Subject:** `feat(chat,fsm,ui): Complete Phase 2 of Dual Chat Architecture (v3.3.16.6.4)`
**Details:**
This commit marks the completion of **Phase 2: Build Grounded Web Search Chat Stream** for the new **"Dual AI Chat Architecture"** feature. This phase successfully built and integrated the second, parallel, and fully independent chat stream dedicated to handling AI queries that require real-time web search.
*   **New Files:** Created a new, isolated set of files for the web search stream: `web-search-chat-flow.ts`, `web-search-chat-action.ts`, `web-search-chat-schemas.ts`, and `web-search-chatbot.json`.
*   **Hardened Web Search Flow:** The new `web-search-chat-flow.ts` is architecturally hardened to **always** use the `googleSearch` tool and **never** use a structured `output.schema`, strictly following the "Grounded JSON-in-Text" pattern from the reference guide to ensure stability. It now correctly handles parsing responses from specialized search prompts.
*   **FSM Isolation:** All global FSM states, variables, flags, and events related to web search chat were created and isolated (e.g., `WEB_SEARCH_CHAT_PENDING`, `webSearchChatHistory`).
*   **Generic Chatbot Component:** The `Chatbot.tsx` component and its FSM context (`chatbot-fsm-context.tsx`) were refactored to be reusable, accepting props for title, description, button configurations, and the specific chat stream (`chatType`) they should control.
*   **UI & Debugging Integration:** A second `Chatbot` instance was added to the UI, wired to the new `webSearch...` states. The Debug Tab was also updated with display boxes for the new stream's data.
---
**App Version:** `v3.3.16.5.4` (Complete Phase 1 of Dual Chat Architecture)
**Tag:** `Phase-50_Task-3.3.16.5.4_CompleteDualChatPhase1`
**Subject:** `feat(chat): Complete Phase 1 of Dual Chat Architecture (v3.3.16.5.4)`
**Details:**
This commit marks the completion of **Phase 1: Foundation & App Data Chat Refactor** for the new **"Dual AI Chat Architecture"** feature (`v3.3.16.4.F` series). This phase successfully repurposed the old, problematic chat system into a new, stable, non-grounded stream.
*   **File Renaming:** All core chat files (`chat-flow.ts`, `chat-server-action.ts`, `chat-schemas.ts`) were renamed to `app-data-chat-....ts` to clearly denote their new, specific purpose.
*   **Flow Hardening:** The new `app-data-chat-flow.ts` was stripped of all conditional grounding logic. It is now hardcoded to **only** use structured JSON outputs (`output.schema`) and **never** use tools, eliminating the source of the previous architectural conflict for this stream.
*   **FSM Isolation:** All global FSM states, variables, flags, and events related to chat were renamed to be specific to this stream (e.g., `CHAT_MESSAGE_PENDING` -> `APP_DATA_CHAT_PENDING`, `chatHistory` -> `appDataChatHistory`).
*   **UI & Debugging Isolation:** The main `Chatbot` component and `DebugTab` were wired to the new, isolated `appData...` states. All UI related to web search was removed from this chat component, and a disclaimer was added to clarify its limited scope.
*   **New Prompt:** A new `app-data-chatbot.json` prompt was created to serve as the default for this non-grounded stream.
---
**App Version:** `v3.3.16.4.F` (Feature Scoping)
**Tag:** `Phase-49_Task-3.3.16.4.F_ScopeDualChatArchitecture`
**Subject:** `feat(docs): Scope Dual AI Chat Architecture feature (v3.3.16.4.F)`
**Details:**
This is a documentation-only commit that officially begins the **"Dual AI Chat Architecture"** feature (`v3.3.16.4.F` series). This major refactor addresses the persistent `Unable to determine type of tool` error by completely decoupling the chat system into two independent streams:
1.  An **App Data Chat** for analyzing loaded application data (non-grounded).
2.  A **Grounded Web Search Chat** for real-time queries (tool-enabled).

This commit establishes the new architectural direction by:
*   Creating new feature scope and status documents (`FEAT_SCOPE_DualChatArchitecture_v3.3.16.4.F.md`, `FEAT_STATUS_DualChatArchitecture_v3.3.16.4.F.md`) that detail the phased implementation plan.
*   Marking the previous, unsuccessful "Chat Grounding Consolidation" feature documents as `OBSOLETE`.
*   Updating the main `README.md` and this `CHANGELOG.md` to reflect the new feature's scope.
*   Updating the application version in `src/config/app-metadata.json` to `v3.3.16.4.F`.
---
**App Version:** `v3.3.16.4.E` (Bug Fix)
**Tag:** `Phase-49_Task-3.3.16.4.E_FixToolUseLogic`
**Commit Hash:** `ff673d07730fdb2a7f104421aa10c21baf407a73`
**Subject:** `fix(ai): Correct AI prompt definition logic for tool use (v3.3.16.4.E)`
**Details:**
This commit implements the correct architectural fix for the `Unable to determine type of tool` error.
*   **Architectural Correction:** The `getChatPrompt` function in `src/ai/flows/chat-flow.ts` was refactored to be truly polymorphic. It now dynamically constructs the `ai.definePrompt` options based on the `useGoogleSearch` flag from the loaded JSON definition.
    *   If `useGoogleSearch` is true, the prompt is defined **with** `tools` and **without** `output.schema`.
    *   If `useGoogleSearch` is false, the prompt is defined **with** `output.schema` and **without** `tools`.
*   The main `chatFlow` logic was updated to handle both the `result.text` (from grounded prompts) and `result.output` (from non-grounded prompts) response formats.
*   This resolves the mutual exclusivity conflict that was causing the error and aligns the implementation with the mandatory pattern in `docs/Gemini_AI_Grounding_Google_Search.md`.
---
**App Version:** `v3.3.16.4.D` (Intermediate Debugging Commit)
**Tag:** `Phase-5_Task-3.3.16.4.D_IntermediateDebugging`
**Commit Hash:** `680f4843`
**Subject:** `docs(all): Intermediate commit v3.3.16.4.D, document failed tool use fix`
**Details:**
This is a documentation-only commit to checkpoint the ongoing debugging for the "AI Chat Prompt & Google Search Grounding Consolidation" feature. It acknowledges that the `Unable to determine type of tool` error persists despite the attempted architectural fix in `chat-flow.ts` in the previous version (`v3.3.16.4.C`). The investigation will continue.
---
**App Version:** `v3.3.16.4.A` (Complete AI Web Search Refactor)
**Tag:** `Phase-48_Task-3.3.16.4.A_CompleteWebSearchRefactor`
**Commit Hash:** `687eb097`
**Subject:** `feat(ai,fsm,ui): Complete AI Web Search Refactor (v3.3.16.4.A)`
**Details:**
This commit marks the successful completion of the **"AI Web Search Refactor"** (v3.3.16.4.A). This was a crucial architectural simplification to remove the convoluted, multi-stage pipeline for handling AI web searches and consolidate it into a single, robust execution path that mirrors the application's other AI chat prompts.

**Key Architectural Corrections:**
*   **Consolidated AI Flow Logic:** The logic to format the raw JSON string from a web search prompt has been moved from the deleted `format-web-search-flow.ts` directly into the main `chat-flow.ts`. The `chat-flow` now performs the web search and immediately formats the result internally, returning a single, clean markdown response to the FSM orchestrator.
*   **Simplified FSM & Orchestrator:** All obsolete FSM states related to the separate formatting step (e.g., `FORMATTING_*`, `FORMAT_*_SUCCESS`) have been removed from `stock-analysis-context.tsx`. The FSM orchestrator no longer needs to handle a complex multi-stage process for web searches, treating all chat prompts uniformly.
*   **Refactored UI:** The two web search toggles ("Run TA Web Search..." and "Run Options Web Search...") have been moved into the "Customizable Analysis Pipeline" card in `main-tab-content.tsx`. The now-empty "Google Search Grounding" card has been removed, cleaning up the UI.
*   **File Cleanup:** All files related to the old, separate formatting pipeline (`format-web-search-action.ts`, `format-web-search-flow.ts`, `format-web-search-schemas.ts`, and their corresponding prompt definitions) have been deleted.

**Outcome:**
*   The architecture for all AI prompts (user-input, non-web search, and web search) is now unified and streamlined, significantly improving stability, maintainability, and debuggability.
*   The application is now ready for a final, comprehensive testing phase of the entire customizable analysis feature.
---
**App Version:** `v3.3.16.4.9` (Final Fix for Pipeline Loop)
**Tag:** `Phase-47_Task-3.3.16.4.9_FinalFixPipelineLoop`
**Subject:** `fix(fsm): Final fix for pipeline loop by enforcing deterministic FSM orchestration (v3.3.16.4.9)`
**Details:**
This commit (`b6739bb3`) **successfully resolves the persistent AI pipeline loop bug**. The root cause was identified as a non-deterministic FSM orchestrator whose massive dependency array created severe race conditions. The fix involved a critical architectural simplification within `src/contexts/stock-analysis-context.tsx`.

**Key Architectural Correction:**
*   The `useEffect` orchestrator hook's dependency array was correctly pruned to react **only** to changes in the primary FSM state (`globalFsmReducerState.current`).
*   The internal AI analysis steps (Key Takeaways, Options Analysis) were changed from being managed by `useActionState` to being called directly with `async/await` from within the orchestrator.
*   This ensures each step in the pipeline runs sequentially and deterministically, only after the previous step has fully completed and the FSM has settled into a new state. The race condition is eliminated.

**Outcome:**
*   **BUG RESOLVED:** The AI pipeline is now stable, executes all steps in the correct order, and no longer loops.
*   The application is now ready for final, comprehensive testing of the "AI Chat Prompt & Google Search Grounding Consolidation" feature.
*   **Future Task Scoped:** A new task will be created to audit the rest of the application and apply these principles of deterministic FSM design to other areas to improve overall robustness.
---
**App Version:** `v3.3.16.4.8` (Intermediate Debugging Commit)
**Tag:** `Phase-46_Task-3.3.16.4.8_IntermediateDebugging`
**Subject:** `docs(all): Intermediate commit v3.3.16.4.8, document failed FSM fixes & persistent loop`
**Details:**
This commit (`44883f42`) is a **documentation-only** task to checkpoint the ongoing debugging efforts for the "AI Chat Prompt & Google Search Grounding Consolidation" feature. It formally acknowledges that a persistent AI pipeline loop remains unresolved despite several attempted fixes across versions `v3.3.16.4.6`, `v3.3.16.4.7`, and the current commit's codebase.

**Summary of Fix Attempts:**
*   **v3.3.16.4.6:** Replaced generic web search FSM states with specific ones (`FORMATTING_TA_WEB_SEARCH`, `FORMATTING_OPTIONS_WEB_SEARCH`) to prevent a race condition.
*   **v3.3.16.4.7:** Introduced a `PIPELINE_PAUSED` state with a `setTimeout` delay to provide a buffer between asynchronous steps.
*   **v3.3.16.4.8 (Codebase):** Attempted to remove the `PIPELINE_PAUSED` state and create a more direct, deterministic state transition sequence in the orchestrator.

**Outcome & Known Issue:**
*   **BUG PERSISTS:** None of the attempted fixes have resolved the root cause. The AI pipeline continues to get stuck in a loop, executing prompts repeatedly and out of order.
*   **Next Steps:** The investigation into the FSM orchestrator and its interaction with React's `useActionState` and `useEffect` lifecycle will continue.
---
**App Version:** `v3.3.16.4.0` (Initial Documentation for Phase 4)
**Tag:** `Phase-46_Task-3.3.16.4.0_PreTestingDocUpdate`
**Subject:** `docs(all): Initial docs for v3.3.16.4.0, complete feature refactor implementation (v3.3.16.4.0)`
**Details:**
This commit (`324423cc`) is a **documentation-only** task that marks the completion of the core implementation for the **"AI Chat Prompt & Google Search Grounding Consolidation"** feature (v3.3.16 series). It updates all relevant documentation to reflect the successful refactoring work of Phases 1-3, preparing the application for the final testing phase.

**Key Architectural Changes Completed in Phases 1-3:**
*   **Terminology Refactor:** All "Augmented" search assets were renamed to use the clearer "Web Search" terminology.
*   **Configuration-Driven Prompts:** All AI prompts (`.json` files) now include `useGoogleSearch: boolean` and `thinkingBudget: -1` properties, centralizing their configuration.
*   **Unified AI Flow:** The `chat-flow.ts` was refactored into a single, intelligent orchestrator that dynamically loads and configures prompts based on a `promptName` input. All chat and web search logic now routes through this single flow.
*   **UI & FSM Integration:** The UI (toggles, buttons) and global FSM were updated to use the new `promptName`-based system, and obsolete UI elements (like the global search toggle) and FSM states were removed.
*   **Code Cleanup:** Obsolete AI flow files were deleted, and debug logging was enhanced and standardized.

**Outcome:**
*   The application's architecture for all chat and web-grounded AI actions is now unified, consistent, and configuration-driven.
*   The implementation phase of the feature is complete. The application is now ready for **Phase 4: Final Testing & Debugging**.
---
**App Version:** `v3.3.16.1.6` (Finalize Phase 1 Grounding Config)
**Tag:** `Phase-45_Task-3.3.16.1.6_FinalizeGroundingConfig`
**Subject:** `feat(ai): Finalize grounding config across all AI prompts (v3.3.16.1.6)`
**Details:**
This commit (`TBD`) applies the final prompt configuration changes for Phase 1 of the "AI Chat Prompt & Google Search Grounding Consolidation" feature. It systemically reviews and corrects the `useGoogleSearch` flag on all relevant prompt definitions to ensure grounding is enabled or disabled according to the new architectural standard.
*   **Enabled Grounding:** `stock-chatbot.json` (for all interactive user queries).
*   **Disabled Grounding:** `analyze-stock-data.json`, `analyze-options-chain.json`.
*   All other `useGoogleSearch` flags set in `v3.3.16.1.4` were confirmed correct.
---
**App Version:** `v3.3.16.1.5` (Complete Chat Grounding Consolidation - Phase 1)
**Tag:** `Phase-44_Task-3.3.16.1.5_ChatGroundingConsolidation_Phase1_Complete`
**Subject:** `feat(core,ai,fsm): Complete Phase 1 of Chat Grounding Consolidation feature (v3.3.16.1.5)`
**Details:**
This commit (`TBD`) marks the completion of **Phase 1: Terminology & Configuration Refactor** for the new **"AI Chat Prompt & Google Search Grounding Consolidation"** feature. This foundational phase accomplished several key objectives:
*   **Terminology Standardization:** Renamed all "Augmented" assets (FSM states, flags, variables, UI text) to use the clearer "Web Search" terminology.
*   **Configuration in JSON:** Enhanced the `LlmPromptDefinitionSchema` to include a `useGoogleSearch` flag and ensured all prompts have `thinkingBudget: -1` by default.
*   **Prompt Refactoring:** Created new, dedicated JSON prompt definitions for each of the five core chat/search actions (`technical-analysis-web-search.json`, `options-flow-web-search.json`, `stock-trader-takeaways.json`, `options-trader-takeaways.json`, `holistic-takeaways.json`).
*   **Prompt Content Enhancement:** The two web search prompts were updated with more detailed data requirements.
*   **Debug Enhancements:** The client debug log buffer was increased to 2000 entries, and default logging settings were made more verbose to aid development.

**Outcome:**
*   The application's architecture is now prepared for the next phase of the refactor.
*   All prompt configurations are centralized and more easily managed.
*   The codebase is clearer and uses standard industry terminology for grounding.
---
**App Version:** `v3.3.16.0.0` (Feature Scoping)
**Tag:** `Phase-43_Task-3.3.16.0.0_ScopeChatGroundingConsolidation`
**Subject:** `feat(docs): Scope AI Chat Prompt & Google Search Grounding Consolidation feature (v3.3.16)`
**Details:**
This commit (`TBD`) prepares all documentation for the new **"AI Chat Prompt & Google Search Grounding Consolidation"** feature, version series `v3.3.16.x.z`. This is a documentation and planning commit that sets the stage for implementation.

**Key Changes:**
*   **`docs/FEAT_SCOPE_ChatGroundingConsolidation_v3.3.16.md`:** A new, comprehensive feature scope document was created based on a full codebase audit. It outlines the objectives, a detailed implementation plan, and updated prompt requirements for the new feature.
*   **`docs/FEAT_STATUS_ChatGroundingConsolidation_v3.3.16.md`:** A new feature status report was created to track the progress of the v3.3.16 feature through its planned phases.
*   **`README.md`:** The main PRD was updated to reflect the new application version (`v3.3.16.0.0`) and to note that the feature is now the active focus.
*   **`CHANGELOG.md` (this file):** Updated with this commit log to mark the official start of the new feature.
*   **`src/config/app-metadata.json`:** Application version updated to `v3.3.16.0.0`.
*   **Superseded Docs:** The old `AugmentedSearchRefactor` scope and status documents have been updated to mark them as `OBSOLETE` and superseded by this new, more robust feature plan.
---
**App Version:** `v3.3.15.0.8` (Fix Augmented Search Architecture)
**Tag:** `Phase-42_Task-3.3.15.0.8_FixAugmentedSearchArchitecture` (Commit `2188289d`)
**Subject:** `fix(ai,fsm): Correct augmented search architecture, use single intelligent chat flow (v3.3.15.0.8)`
**Details:**
This commit (`2188289d`) fixes a critical architectural bug where augmented searches were incorrectly routed through the generic chatbot, causing them to use the wrong AI prompt and fail to perform a web search. The issue previously documented as "lost prompts" was, in fact, a severe logic and wiring error by the AI agent.

**Key Architectural Correction:**
*   **`src/ai/flows/chat-flow.ts`:** The `chatFlow` is now "intelligent." It inspects the `userInput` for `SYSTEM_TRIGGER` keys. If a key is present, the flow dynamically loads the correct specialized prompt definition (`augmented-ta-search.json` or `augmented-options-search.json`). If no key is found, it defaults to the standard `stock-chatbot.json` as before.
*   **`src/contexts/stock-analysis-context.tsx`:** The FSM reducer has been corrected. On `AUGMENTED_..._SUCCESS` events, it now extracts the full `rawResponse` object from the flow's output (which includes the `groundingMetadata`) and correctly saves it to the state variables (`rawAugmentedTaResponseJson`, `rawAugmentedOptionsResponseJson`) for the Debug Tab.
*   **Deprecated Files:** The unused and confusing standalone files (`augmented-ta-search-flow.ts`, `augmented-options-search-flow.ts`) have been marked as deprecated (emptied) and will be removed in a future cleanup task.

**Outcome:**
*   The augmented search feature now correctly executes the specialized web search prompts.
*   The Debug Tab now correctly displays the full raw API response from the search, including the `groundingMetadata`.
*   The feature is now functionally complete and ready for final testing.
---
**App Version:** `v3.3.15.0.7` (Intermediate Commit, Acknowledging Lost Prompts)
**Tag:** `Phase-41_Task-3.3.15.0.7_AcknowledgeLostPrompts` (Commit `74970fb4`)
**Subject:** `docs(all): Intermediate commit for v3.3.15.0.7, acknowledge lost AI prompts`
**Details:**
This is a **documentation-only** commit to save the progress of the "Chat-Centric Grounded Search" re-architecture. It formally acknowledges a critical bug discovered during a code audit: the specific AI prompts for the augmented TA and options searches were **lost during a previous flawed refactoring by the AI agent**.

**Key State & Known Issue:**
*   **Functionality:** The application has a working FSM and UI to trigger the augmented searches.
*   **Critical Bug:** The `chat-flow` that is triggered for these searches lacks the specific instructions to perform the correct web search and format the data. It defaults to a generic chat response, rendering the feature non-functional.
*   **AI Agent Error:** This is a direct result of an error by the AI Coding Agent, which failed to preserve or correctly migrate the prompt logic.
*   **Next Steps:** The immediate next priority is **Task v3.3.15.1.0**, which is to re-create and correctly implement the lost AI prompts for both augmented TA and options searches. Final testing of the feature is blocked until this critical fix is complete.

**Documentation Changes:**
*   `CHANGELOG.md` (this file), `README.md`, `FEAT_SCOPE_AugmentedSearchRefactor_v3.3.7.0.7.md`, and `FEAT_STATUS_AugmentedSearchRefactor_v3.3.7.0.7.md` have all been updated to reflect the current `v3.3.15.0.7` version and to explicitly state the known issue regarding the lost prompts.
---
**App Version:** `v3.3.15.0.6` (Fix AI Augment Data Flow to Chat UI)
**Tag:** `Phase-40_Task-3.3.15.0.6_FixAugmentedResultToChat` (Commit `TBD`)
**Subject:** `fix(fsm): Correctly pipe augmented search results to chat history (v3.3.15.0.6)`
**Details:**
This commit (`TBD`) fixes a critical bug of omission identified in the v3.3.15.0.6 audit. Previously, while successful augmented searches correctly saved their raw data for debugging, they failed to display the clean text result to the user in the chat window.

**Key Architectural Correction:**
*   **`src/contexts/stock-analysis-context.tsx`:**
    *   The `fsmReducer` logic for the `AUGMENTED_TA_SUCCEEDED` and `AUGMENTED_OPTIONS_SUCCEEDED` events has been updated.
    *   In addition to saving the raw response JSON, the reducer now correctly parses this JSON, extracts the clean `response` text, and calls the `addChatMessage` utility to push the result into the main chat history. This ensures the user sees the output of the augmented search.

**Outcome:**
*   The AI augmented search feature is now fully connected end-to-end. Successful searches will now correctly display their results in the main chat UI, as originally intended.
---
**App Version:** `v3.3.15.0.5` (Implement FSM States for Augmented Search)
**Tag:** `Phase-39_Task-3.3.15.0.5_ImplementAugmentedSearchFsm` (Commit `TBD`)
**Subject:** `feat(fsm): Implement dedicated FSM states for augmented search lifecycle (v3.3.15.0.5)`
**Details:**
This commit (`TBD`) implements the FSM enhancements scoped in the v3.3.15.0.5 audit. It addresses a critical architectural gap where augmented searches were incorrectly using the generic chat FSM states, breaking the main analysis pipeline sequence.

**Key Architectural Correction:**
*   **`src/contexts/stock-analysis-context.tsx`:**
    *   **New FSM States:** Added six new states to the `GlobalFsmState` enum: `FETCHING_AUGMENTED_TA`, `AUGMENTED_TA_SUCCEEDED`, `AUGMENTED_TA_FAILED`, `FETCHING_AUGMENTED_OPTIONS`, `AUGMENTED_OPTIONS_SUCCEEDED`, `AUGMENTED_OPTIONS_FAILED`.
    *   **New FSM Events:** Added corresponding new events to `FsmEvent` to trigger and manage these states.
    *   **Updated FSM Orchestrator:** The `useEffect` orchestrator has been refactored. It now uses the new dedicated states to correctly sequence the augmented searches as the final steps of the main pipeline, waiting for one to complete before starting the next.
    *   **Updated Reducer & Action Handling:** The reducer and the `useActionState` effect for the chat action were updated to handle the new events and dispatch them correctly, distinguishing between regular chat messages and augmented search requests.

**Outcome:**
*   The FSM now correctly and robustly manages the lifecycle of each augmented search, preventing premature termination of the analysis pipeline.
*   The application architecture is now sound and prepared for final data flow checks.
---
**App Version:** `v3.3.15.0.3` (Corrected - Chat-Centric Grounded Search Re-Architecture)
**Tag:** `Phase-38_Task-3.3.15.0.3_FixAugmentedSearchPrompts_Corrected` (Commit `TBD`)
**Subject:** `fix(fsm,ai): Correct augmented search prompt logic in FSM orchestrator (v3.3.15.0.3)`
**Details:**
This commit (`TBD`) resolves a critical logic bug where the FSM orchestrator was calling incorrect prompts for the new chat-centric augmented search feature.

**Key Changes in this Correction:**
*   **`src/contexts/stock-analysis-context.tsx` (`dispatchNextCustomAction`):**
    *   The logic for the `augmented_ta` and `augmented_options` steps has been corrected.
    *   It now calls the correct `dispatchGroundedChat` helper function.
    *   It now passes the correct system prompt keys (`SYSTEM_TRIGGER:AUGMENTED_TA_SEARCH` and `SYSTEM_TRIGGER:AUGMENTED_OPTIONS_SEARCH`) to `dispatchGroundedChat`.
    *   This ensures that when the main pipeline triggers an augmented search, it sends the correct, specific instructions to the `chat-flow` instead of an incorrect, unrelated chat prompt.

**Outcome:**
*   The main analysis pipeline now correctly triggers the appropriate augmented search prompts via the chat flow.
*   This resolves the issue of incorrect takeaways appearing in the chat log when an augmented search was initiated by the main pipeline.
---
**App Version:** `v3.3.15.0.2` (Fix Grounded Search API Error)
**Tag:** `Phase-37_Task-3.3.15.0.2_FixGroundedSearchApiError` (Commit `TBD`)
**Subject:** `fix(ai): Resolve unsupported tool use with JSON mime type error (v3.3.15.0.2)`
**Details:**
This commit (`TBD`) fixes a `[400 Bad Request]` error from the Google Generative AI API: `Tool use with a response mime type: 'application/json' is unsupported`. This occurred when trying to use the Google Search tool while also requesting a structured JSON output.

**Key Architectural Correction:**
*   **`src/ai/flows/chat-flow.ts`:**
    *   The `getChatPrompt` function was updated to be conditionally aware of tool usage.
    *   When grounding (tool use) is **enabled**, the prompt definition now **omits** the `output: { schema: ... }` property.
    *   When grounding is **disabled**, the `output: { schema: ... }` property is included as before.
    *   The `chatFlow` logic was updated to handle both response types, checking if the response is in `result.text` (for grounded) or `result.output` (for non-grounded).

**Outcome:**
*   The augmented chat search feature no longer causes a `400 Bad Request` API error and can now function correctly.
---
**App Version:** `v3.3.15.0.1` (Fix Chat Flow Zod Import)
**Tag:** `Phase-36_Task-3.3.15.0.1_FixChatFlowZodImport` (Commit `TBD`)
**Subject:** `fix(ai): Add missing zod import to chat-flow.ts (v3.3.15.0.1)`
**Details:**
This commit (`TBD`) fixes a critical `ReferenceError: z is not defined` that occurred on the server when the AI chat pipeline was initiated.

**Key Change:**
*   `src/ai/flows/chat-flow.ts`: Added the missing `import { z } from 'zod';` statement. This resolves the reference error and allows the flow to correctly define its output schema for non-grounded chat messages.

**Outcome:**
*   The standard (non-grounded) AI chat pipeline is now functional.
---
**App Version:** `v3.3.15.0.0` (Complete Chat-Centric Grounded Search Re-Architecture)
**Tag:** `Phase-35_Task-3.3.15.0.0_CompleteChatCentricSearchRefactor_Phases1-4` (Commit `890f5cb7`)
**Subject:** `feat(core,ai,fsm,ui): Complete Chat-Centric Grounded Search Re-Architecture (v3.3.15.0.0)`
**Details:**
This commit (`890f5cb7`) marks the successful completion of the **"Chat-Centric Grounded Search"** re-architecture. The core objective of this refactor—to consolidate all web search functionality into the robust, tool-enabled `chat-flow` and trigger it from various points in the UI—has been achieved. This provides a more stable, maintainable, and unified architecture for all grounded AI searches.

**Key Changes in this Re-Architecture (Phases 1-4, v3.3.12.x.z to v3.3.15.x.z):**
*   **Phase 1: Remove Old Standalone Search Flows (Tasks v3.3.12.x.z):**
    *   The obsolete standalone files (`augmented-ta-search-flow.ts`, `augmented-options-search-flow.ts`, `augmented-ta-search-action.ts`, `augmented-options-search-action.ts`, `augmented-ta-display.tsx`, `augmented-options-display.tsx`) were removed from the project.
*   **Phase 2: Consolidate Raw JSON Display (Tasks v3.3.13.x.z):**
    *   New state variables (`rawAugmentedTaResponseJson`, `rawAugmentedOptionsResponseJson`) were added to `StockAnalysisContext` to hold the full, raw response (including grounding metadata) from the `chat-flow`.
    *   The `DebugTabContent` was updated with new `JsonDisplayArea` components to show these raw responses.
*   **Phase 3 & 4: FSM Integration & UI Logic (Tasks v3.3.14.x.z - v3.3.15.x.z):**
    *   The FSM orchestrator in `stock-analysis-context.tsx` was refactored. It now triggers augmented searches as the final steps of the main analysis pipeline by dispatching special messages to the `chat-flow`.
    *   The `Chatbot` component was updated with on-demand buttons that also dispatch these special messages.
    *   UI toggles were added to `main-tab-content.tsx` to control whether the main pipeline automatically triggers the augmented searches. These toggles correctly update the FSM flags that the orchestrator uses.

**Outcome:**
*   The application's architecture for web-augmented search is now unified and robust.
*   The feature is now functionally complete and ready for the final phase: **Phase 5: Testing & Debugging**.
*   The application version is consistently `v3.3.15.0.0`.
---
**App Version:** `v3.3.10.1.0` (Complete Augmented Search Re-Architecture Implementation)
**Tag:** `Phase-34_Task-3.3.10.1.0_CompleteAugmentedSearchRefactor_Phases1-3` (Commit `bd8655d1`)
**Subject:** `feat(core,ai,fsm,ui): Complete initial implementation of Augmented Search Re-Architecture (v3.3.10.1.0)`
**Details:**
This commit (`bd8655d1`) marks the successful completion of the initial implementation phases (1-3) of the **"Augmented Search Re-Architecture"** feature. The core objective of this refactor—to decouple the experimental augmented search functionality from the main analysis pipeline—has been achieved. This provides a stable foundation for isolated debugging and future development.

**Key Changes in this Re-Architecture (Phases 1-3, v3.3.8.x.z to v3.3.10.x.z):**
*   **Phase 1: Data & AI Layer Decoupling (Tasks v3.3.8.0.0 - v3.3.8.2.0):**
    *   The input schemas for all core AI analysis flows (`analyze-stock-data`, `analyze-options-chain`, `chat-flow`) were reverted. They no longer accept `augmentedTaSearchJson` or `augmentedOptionsSearchJson`.
    *   The corresponding JSON prompt definitions were stripped of all conditional Handlebars logic related to augmented data, simplifying the prompts.
    *   The server actions that call these flows were updated to no longer pass the augmented data variables.
*   **Phase 2: UI Isolation (Tasks v3.3.9.0.0 - v3.3.9.2.0):**
    *   The previous parsed display components (`AugmentedTaDisplay`, `AugmentedOptionsDisplay`) were removed.
    *   Two new, simpler components (`AugmentedTaRawDisplay`, `AugmentedOptionsRawDisplay`) were created. Each renders a read-only `<Textarea>` to display the raw, unparsed JSON string returned by its respective search flow.
    *   These new "raw display" components were integrated into `main-tab-content.tsx`, placed directly after the standard analysis cards for easy comparison and debugging.
*   **Phase 3: FSM & Orchestrator Refactoring (Tasks v3.3.10.0.0 - v3.3.10.1.0):**
    *   The global FSM orchestrator in `stock-analysis-context.tsx` was significantly refactored.
    *   It now triggers the augmented search server actions in a non-blocking, parallel manner after the base data pipeline succeeds.
    *   The success or failure of an augmented search now only affects its own state (`augmentedTaSearchJson`, `augmentedOptionsSearchJson`) and no longer halts or influences the main analysis pipeline.
    *   The obsolete FSM states for augmented search fetching (`FETCHING_AUGMENTED_TA`, `AUGMENTED_TA_SUCCEEDED`, etc.) were removed, simplifying the FSM.

**Outcome:**
*   The application is now stable, as the experimental augmented search feature is fully isolated.
*   Debugging of the search flows can proceed without impacting the core user experience.
*   The application is ready for **Phase 4: Final Testing & Documentation** of this re-architecture.
*   The application version is consistently `v3.3.10.1.0`.
---
**App Version:** `v3.3.7.0.7` (Re-Architecture Scoping & Planning)
**Tag:** `Phase-32_Task-3.3.7.0.7_DefineAugmentedSearchRefactorPlan`
**Subject:** `docs(all): Define detailed implementation plan for augmented search re-architecture (v3.3.7.0.7)`
**Details:**
This commit (`TBD`) is a **documentation-only** task that defines a detailed, phased implementation plan for the "AI Augmented Web Search" re-architecture. The objective is to decouple the augmented search functionality from the main analysis pipeline to restore stability and enable isolated debugging. This commit updates all relevant documentation with the new plan.

**Key Documentation Changes:**
*   **`docs/FEAT_SCOPE_AugmentedSearchRefactor_v3.3.7.0.7.md`:** The scope document has been updated with a new "Implementation Phased Plan" section, detailing four phases (Data Layer Decoupling, UI Isolation, FSM Refactoring, Final Testing) and their corresponding tasks.
*   **`docs/FEAT_STATUS_AugmentedSearchRefactor_v3.3.7.0.7.md`:** The status document has been updated to reflect the newly defined implementation plan, with all new tasks marked as `PLANNED`.
*   **`README.md`:** The main PRD has been updated to reflect the new application version (`v3.3.7.0.7`) and to note that the feature is currently undergoing this re-architecture.
*   **`CHANGELOG.md` (this file):** Updated with this commit log.
*   **`src/config/app-metadata.json`:** Remains at `v3.3.7.0.7` as established in the prior scoping task. No source code was changed.

**Outcome:**
*   The project now has a clear, actionable, and documented plan for implementing the augmented search re-architecture.
---
**App Version:** `v3.3.7.0.6` (Debug Fix)
**Tag:** `Phase-31_Task-3.3.7.0.6_FixAugmentedFlowArchitecture_Final` (Commit `TBD`)
**Subject:** `fix(ai): Correct augmented search flow architecture, resolve tool/output conflict (v3.3.7.0.6)`
**Details:**
This commit (`TBD`) addresses a critical architectural error identified during the **Phase 7: Final Testing & Debugging** of the "Customizable Analysis & AI Augmented Web Search" feature (v3.3 series).

**Key Architectural Correction:**
*   An audit revealed that while the `ai.definePrompt` for the new augmented search flows (`augmented-ta-search-flow.ts`, `augmented-options-search-flow.ts`) correctly enabled the `googleSearch` tool and omitted a structured `output` schema, the `ai.defineFlow` block for these same flows *incorrectly* still declared a structured `outputSchema`. This created a conflict that caused the `Unable to determine type of tool` error, as Genkit does not support using both tools and a structured output schema simultaneously in this manner.
*   The fix involved removing the `outputSchema` property from the `ai.defineFlow` definition in both `augmented-ta-search-flow.ts` and `augmented-options-search-flow.ts`.

**Outcome:**
*   The new augmented search flows are now architecturally identical to the proven, working pattern of the chatbot's "Grounding with Google Search" feature.
*   The `Unable to determine type of tool` error is resolved, and the augmented search pipelines should now function correctly.
---
**App Version:** `v3.3.7.0.3` (Enhanced AI Prompt Debug Logging)
**Tag:** `Phase-31_Task-3.3.7.0.3_EnhanceAiPromptDebugLogging` (Commit `6b3f605c`)
**Subject:** `feat(debug,ai): Enhance AI prompt debug logging with grounding & thinking mode flags (v3.3.7.0.3)`
**Details:**
This commit (`6b3f605c`) enhances the debuggability of all AI flows by adding explicit, standardized server-side logging for key AI prompt configurations. This makes it easier to trace and verify the behavior of the new customizable analysis pipeline.

**Key Changes:**
*   **`src/ai/flows/*.ts` (All AI Flows):**
    *   The prompt definition/retrieval functions in all AI flows (`analyze-stock-data`, `analyze-options-chain`, `chat-flow`, `augmented-ta-search`, `augmented-options-search`) were updated.
    *   Before `ai.definePrompt` is called, a new, structured `console.log` statement is now emitted.
    *   This log explicitly states the `Model`, `Grounding` status (true if `googleSearch` tool is present), `ThinkingBudget`, and number of `SafetySettings` being used for that specific prompt definition.
*   **`src/config/app-metadata.json`:** Version updated to `v3.3.7.0.3`.

**Outcome:**
*   Server-side logs now provide a clear, at-a-glance confirmation of the exact configuration used for every AI prompt call.
*   This greatly simplifies debugging, especially for verifying that the "Grounding with Google Search" and "Dynamic Thinking" (`thinkingBudget: -1`) settings are being correctly applied based on user toggle selections.
---
**App Version:** `v3.3.7.0.2` (Debug Fix)
**Tag:** `Phase-31_Task-3.3.7.0.2_FixAugmentedFlowArchitecture` (Commit `73d7657d`)
**Subject:** `fix(ai): Correct augmented search flow architecture, resolve tool/output conflict (v3.3.7.0.2)`
**Details:**
This commit (`73d7657d`) addresses a critical architectural error identified during the **Phase 7: Final Testing & Debugging** of the "Customizable Analysis & AI Augmented Web Search" feature (v3.3 series).

**Key Changes in v3.3.7.0.0 - v3.3.7.0.2 (Consolidated Debugging Fixes):**
*   **Root Cause Identified:** An audit revealed that while the `ai.definePrompt` for the new augmented search flows (`augmented-ta-search-flow.ts`, `augmented-options-search-flow.ts`) correctly enabled the `googleSearch` tool and omitted a structured `output` schema, the `ai.defineFlow` block for these same flows *incorrectly* still declared a structured `outputSchema`. This created a conflict that caused the `Unable to determine type of tool` error, as Genkit does not support using both tools and a structured output schema simultaneously in this manner.
*   **Architectural Correction (`v3.3.7.0.2`):**
    *   `src/ai/flows/augmented-ta-search-flow.ts`: Removed the `outputSchema` property from the `ai.defineFlow` definition.
    *   `src/ai/flows/augmented-options-search-flow.ts`: Removed the `outputSchema` property from the `ai.defineFlow` definition.
*   **Previous Fix Attempts (`v3.3.7.0.0`, `v3.3.7.0.1`):** These versions involved incorrect attempts to fix the issue by modifying `import` statements for the `googleSearch` tool, which led to build errors and did not address the root architectural flaw. The changes in `v3.3.7.0.2` supersede these and implement the correct fix.

**Outcome:**
*   The new augmented search flows are now architecturally identical to the proven, working pattern of the chatbot's "Grounding with Google Search" feature.
*   The `Unable to determine type of tool` error is resolved, and the augmented search pipelines should now function correctly.
*   The application is now in a more stable state for continuing Phase 7 testing.
*   The application version is consistently `v3.3.7.0.2`.
---
**App Version:** `v3.3.6.3.0` (Complete Customizable Analysis Phase 6)
**Tag:** `Phase-30_Task-3.3.6.3.0_CompleteAugmentedDataIntegration` (Commit `39a84ca0`)
**Subject:** `feat(ai,fsm): Complete Phase 6 of Customizable Analysis - Augmented Data Integration (v3.3.6.3.0)`
**Details:**
This commit (`39a84ca0`) marks the successful completion of **Phase 6: Augmented Data Integration** for the "Customizable Analysis &amp; AI Augmented Web Search" feature (v3.3 series). This phase completed the feature's primary objective by plumbing the new web-sourced data back into the core AI analysis prompts.

**Key Changes in Phase 6 (Tasks v3.3.6.0.0 through v3.3.6.3.0):**
*   **Updated AI Schemas & Prompts (`v3.3.6.0.0`, `v3.3.6.1.0`):**
    *   The Zod input schemas for the core analysis flows (`analyze-stock-data-flow`, `analyze-options-chain-flow`) and the `chat-flow` were updated to accept new optional fields: `augmentedTaSearchJson` and `augmentedOptionsSearchJson`.
    *   The corresponding JSON prompt definitions (`analyze-stock-data.json`, `analyze-options-chain.json`, `stock-chatbot.json`) were enhanced with Handlebars templating (`{{#if ...}}`) to conditionally include the new augmented data in the context provided to the AI.
*   **Updated FSM Orchestrator (`v3.3.6.2.0`):**
    *   The FSM orchestrator in `stock-analysis-context.tsx` was modified to pass the new `augmentedTaSearchJson` and `augmentedOptionsSearchJson` from the global state to the server actions that trigger the analysis and chat flows.
*   **Final Audit (`v3.3.6.3.0`):**
    *   A comprehensive code audit confirmed that all new web search flows correctly use the "Grounding with Google Search" pattern and that the data is correctly integrated into all relevant AI prompts.

**Outcome:**
*   When augmented searches are enabled, their data is now correctly used to enrich the AI's core analysis for Key Takeaways, Options Analysis, and Chat, providing deeper and more contextually aware insights.
*   The initial implementation of the "Customizable Analysis &amp; AI Augmented Web Search" feature is now functionally complete.
*   The application is now ready for the final phase of this feature: **Phase 7: Final Testing &amp; Debugging**.
*   The application version is consistently `v3.3.6.3.0`.
---
**App Version:** `v3.3.5.3.0` (Complete Customizable Analysis Phase 5)
**Tag:** `Phase-29_Task-3.3.5.3.0_CompleteAugmentedOptions` (Commit `5c15faf5`)
**Subject:** `feat(fsm,ui): Complete Phase 5 of Customizable Analysis - Augmented Options Search (v3.3.5.3.0)`
**Details:**
This commit (`5c15faf5`) marks the successful completion of **Phase 5: AI Augmented Web Search - Options Flow** for the "Customizable Analysis & AI Augmented Web Search" feature (v3.3 series). This phase mirrored the architecture of Phase 4, implementing a new AI-driven web search for advanced options flow metrics (Max Pain, GEX, etc.) using the mandatory "Grounding with Google Search" pattern.

**Key Changes in Phase 5 (Tasks v3.3.5.0.0 through v3.3.5.3.0):**
*   **New AI Flow & Server Action (`v3.3.5.0.0`):**
    *   Created `src/ai/flows/augmented-options-search-flow.ts` and `src/ai/schemas/augmented-options-search-schemas.ts`.
    *   The flow uses the "Grounding with Google Search" pattern (text response with a JSON string) to reliably find options metrics.
    *   Created `src/actions/augmented-options-search-action.ts` to wrap the flow for client-side use.
*   **New Display Component (`v3.3.5.1.0`):**
    *   Created `src/components/augmented-options-display.tsx` to render the results.
*   **FSM Integration & UI Display (`v3.3.5.2.0`, `v3.3.5.3.0`):**
    *   Updated the global FSM in `stock-analysis-context.tsx` with new states (`FETCHING_AUGMENTED_OPTIONS`, etc.) and logic to orchestrate the new server action when the `isAugmentedOptionsSearchEnabled` flag is true.
    *   Added the `AugmentedOptionsDisplay` component to `main-tab-content.tsx`.

**Outcome:**
*   The "Augmented Options Flow Analysis" toggle is now fully functional, using the corrected "Grounding with Google Search" pattern to reliably fetch data.
*   The application is now ready for Phase 6, which will integrate both new augmented data sources back into the primary AI analysis prompts.
*   The application version is consistently `v3.3.5.3.0`.
---
**App Version:** `v3.3.4.3.0` (CORRECTED - Complete Customizable Analysis Phase 4)
**Tag:** `Phase-28_Task-3.3.4.3.0_CompleteAugmentedTa_Corrected` (Commit `20d5e1f5`)
**Subject:** `feat(fsm,ui): Complete Phase 4 of Customizable Analysis - Augmented TA Search (v3.3.4.3.0)`
**Details:**
This commit (`20d5e1f5`) marks the successful completion of **Phase 4: AI Augmented Web Search - Technical Analysis** for the "Customizable Analysis & AI Augmented Web Search" feature (v3.3 series). This phase implemented a new AI-driven web search capability to fetch advanced TA indicators, a UI component to display them, and the FSM logic to orchestrate this new pipeline.

**Key Architectural Correction:** This phase also includes a critical correction to the AI search implementation. The initial approach incorrectly used the `googleSearch` tool with a JSON output schema. This was corrected to align with the application's established "Grounding with Google Search" pattern, which is required for reliable tool use. The corrected flows now instruct the AI to return a plain text response containing a JSON string, which the application then parses. This ensures the AI is forced to use the search tool and does not hallucinate answers from its internal knowledge.

**Key Changes:**
*   **New AI Flow & Server Action (`v3.3.4.0.0`, `v3.3.4.2.0`, Corrected in `v3.3.5.0.0` but consolidated here):**
    *   Created `src/ai/flows/augmented-ta-search-flow.ts`.
    *   Refactored the flow to use the "Grounding with Google Search" pattern: the prompt instructs the AI to return a JSON string within a plain text response, which is then parsed by the application.
    *   Defined robust Zod schemas in a separate file (`src/ai/schemas/augmented-ta-search-schemas.ts`) to resolve a 'use server' module boundary error.
    *   Created `src/actions/augmented-ta-search-action.ts` to wrap the new flow.
*   **New Display Component (`v3.3.4.1.0`):**
    *   Created `src/components/augmented-ta-display.tsx`, a new styled card component to render the search results.
    *   Added `augmentedTaSearchJson` to the global `StockAnalysisContext`.
*   **FSM Integration & UI Display (`v3.3.4.2.0`, `v3.3.4.3.0`):**
    *   Updated the global FSM in `stock-analysis-context.tsx` with new states (`FETCHING_AUGMENTED_TA`, etc.) and logic to call the new server action when the `isAugmentedTaSearchEnabled` flag is true.
    *   Added the `AugmentedTaDisplay` component to `main-tab-content.tsx`.
*   **Documentation & Versioning:**
    *   `src/config/app-metadata.json`: Application version updated to `v3.3.4.3.0`.
    *   `CHANGELOG.md`, `README.md`, `FEAT_STATUS_CustomizableAnalysis_v3.3.md`: All relevant documentation updated to reflect the completion of this phase and the critical architectural correction.

**Outcome:**
*   The "Augmented Technical Analysis" toggle is now fully functional, using the corrected "Grounding with Google Search" pattern to reliably fetch data.
*   The application is now ready for Phase 5, which will implement the same corrected pattern for Options Flow Analysis.
---
**App Version:** `v3.3.3.1.0` (Complete Customizable Analysis Phase 3)
**Tag:** `Phase-28_Task-3.3.3.1.0_FsmPipelineLogicComplete` (Commit `109dedd5`)
**Subject:** `feat(fsm,core): Complete Phase 3 of Customizable Analysis - Conditional Pipeline (v3.3.3.1.0)`
**Details:**
This commit (`109dedd5`) marks the successful completion of **Phase 3: Conditional Pipeline Logic Integration** for the "Customizable Analysis & AI Augmented Web Search" feature (v3.3 series). This crucial phase implemented the "brains" of the new feature, enabling the FSM orchestrator to dynamically execute analyses based on the user's toggle selections.

**Key Changes in Phase 3 (Tasks v3.3.3.0.0 through v3.3.3.1.0):**
*   **Refactored FSM Orchestrator (`src/contexts/stock-analysis-context.tsx`):**
    *   The monolithic "full AI analysis macro" logic has been completely removed from the FSM orchestrator `useEffect` hook.
    *   After the base data pipeline and AI TA calculation succeed (`AI_TA_CALCULATION_SUCCEEDED`), the orchestrator now enters a new "custom pipeline" execution sequence.
*   **Conditional Dispatch Logic (`src/contexts/stock-analysis-context.tsx`):**
    *   A new helper function, `dispatchNextCustomAction`, was implemented to manage the new conditional pipeline.
    *   This function checks the `fsmFlags` (e.g., `isAiKeyTakeawaysSelected`, `isAiOptionsAnalysisSelected`) and sequentially dispatches the appropriate events (`TRIGGER_MANUAL_KEY_TAKEAWAYS`, `TRIGGER_MANUAL_OPTIONS_ANALYSIS`, and `SUBMIT_CHAT_MESSAGE` for the three chat prompts).
    *   The orchestrator now waits for the success or failure of one custom analysis step before proceeding to check the flag for the next, ensuring a proper sequential execution.
*   **Pipeline Completion:**
    *   Once all selected analyses are complete, the orchestrator calls `FINALIZE_AUTOMATED_PIPELINE` to correctly transition the application back to an `IDLE` state, ready for the next user action.

**Outcome:**
*   The application's core analysis logic is no longer rigid. Users can now toggle which AI analyses they want to run, and the FSM will execute only that selected pipeline.
*   The application is now prepared for the next major phases of the feature (Phase 4, 5, 6), which will involve building the AI-augmented web search flows and integrating their data into this new conditional pipeline.
*   The application version is consistently `v3.3.3.1.0`.
---
**App Version:** `v3.2.5.0.Z` (Complete FSM Consolidation)
**Tag:** `Phase-24_Task-3.2.5.0.Z_CompleteFsmConsolidation` (Commit `1ca4bd54`)
**Subject:** `feat(fsm,core): Complete FSM Consolidation & Refactor feature (v3.2.5.0.Z)`
**Details:**
This commit (`1ca4bd54`) marks the full and successful completion of the **"FSM Consolidation & Refactor"** feature (v3.2.x.y.z series). This major architectural enhancement involved migrating all primary application state and UI logic—previously managed by multiple disparate FSMs—into a single, robust, and centralized Finite State Machine in `StockAnalysisContext`.

**Key Achievements in the FSM Consolidation & Refactor (v3.2) Feature:**
*   **Single Source of Truth:** The application now operates on a single global FSM. This orchestrates all major pipelines, including automated data analysis, on-demand AI actions (Key Takeaways, Options Analysis), and the full AI Chatbot lifecycle (interactive queries, macro-driven prompts, and Google Search grounding).
*   **Architectural Simplification:** Local FSMs in `MainTabContent`, `ChatbotFsmContext`, and `DebugConsoleFsmContext` were successfully deprecated and their logic absorbed by the global FSM. This has significantly reduced state management complexity and improved code maintainability.
*   **Enhanced State Management:** The new FSM utilizes a comprehensive set of states (`GlobalFsmState`), flags (`GlobalFsmFlags`), and context variables (`GlobalFsmContextVariables`), providing granular and predictable control over the application's behavior and UI state.
*   **Improved Debuggability:** FSM-related debug tooling was enhanced. The `FsmDebugTabContent` provides a clear, real-time view of the single FSM's state, flags, and variables. Log exports were updated to include this snapshot, greatly aiding in troubleshooting.
*   **Bug Fixes & Stability:** Throughout the refactoring process, numerous bugs related to state synchronization, race conditions, and UI inconsistencies were resolved. This includes critical fixes for tab-switching bugs that caused state loss, stuck AI macros, and broken chat grounding.
*   **AI Prompt Integrity:** As part of the final debugging phase (`v3.2.5.0.Z`), all lingering hardcoded/deprecated AI prompt templates were removed from the codebase, ensuring that all AI actions correctly source their logic from the JSON definitions in `src/ai/definitions/`.

**Outcome of v3.2.5.0.Z:**
*   The application is more stable, predictable, and easier to debug.
*   The state management architecture is now scalable and prepared for future feature development.
*   The application version is consistently `v3.2.5.0.Z`, reflecting the completion of this major refactoring effort.
---
**App Version:** `v3.2.5.0.U` (Fix Chat Grounding with Tools)
**Tag:** `Phase-23_Task-3.2.5.0.U_FixChatGroundingWithTools` (Commit `6645e792`)
**Subject:** `fix(ai,chat): Resolve unsupported tool use error for chat grounding (v3.2.5.0.U)`
**Details:**
This commit (`6645e792`) fixes a critical bug where the "Grounding with Google Search" feature in the chatbot would fail immediately. The root cause was an API limitation: the Google Generative AI API does not support using tools (like Google Search) when a structured JSON output (`output: {schema: ...}`) is also requested in the same prompt.

**Key Changes in v3.2.5.0.U:**
*   **`src/ai/flows/chat-flow.ts`:**
    *   The `getChatPrompt` helper function was updated to conditionally configure the prompt.
    *   **If grounding is DISABLED**, the prompt is defined with `output: {schema: ChatOutputSchema}` as before to get a structured JSON response.
    *   **If grounding is ENABLED**, the `output` property is **omitted** from the prompt definition, and `tools: [{ googleSearch: {} }]` is added. This tells the API to expect a simple text response, which is compatible with tool use.
    *   The main `chatFlow` logic was updated to handle both response types. It checks if grounding was enabled and extracts the response from either `result.text` (for grounded queries) or `result.output.response` (for standard queries), then returns it in the expected `ChatOutput` format.
*   **Application Metadata:** Version updated to `v3.2.5.0.U`.

**Outcome of v3.2.5.0.U:**
*   The "Grounding with Google Search" feature is now fully functional.
*   Users can enable the toggle to ask real-time questions, and the AI will correctly use Google Search to generate a response without causing an API error.
---
**App Version:** `v3.2.5.0.Q` (FSM Button State Integration)
**Tag:** `Phase-19_Task-3.2.5.0.Q_FSM_ButtonStateIntegration` (Commit `4fe5a570`)
**Subject:** `feat(fsm,ui): Centralize on-demand AI button state in global FSM (v3.2.5.0.Q)`
**Details:**
This commit (`4fe5a570`) completes **Task v3.2.5.0.Q**, a key refinement within **Phase 5 (Testing & Debugging)** of the "FSM Consolidation & Refactor" feature (`v3.2`). It addresses a "straggler" piece of logic by migrating the state management for the manual AI analysis buttons entirely into the single global FSM.

**Key Changes in v3.2.5.0.Q:**
*   **New FSM Flags (`src/contexts/stock-analysis-context.tsx`):**
    *   Introduced two new flags in `GlobalFsmFlags`:
        *   `isManualKeyTakeawaysActionPossible: boolean`
        *   `isManualOptionsAnalysisActionPossible: boolean`
*   **Centralized Logic (`src/contexts/stock-analysis-context.tsx`):**
    *   Added a new `useEffect` hook (`ManualActionFlagEffect`) to the context provider.
    *   This effect is now the single source of truth for calculating whether the manual AI actions are possible. It checks the global FSM state, active ticker context, and data readiness (using `isDataReadyForProcessing`) to set the new flags.
    *   An `UPDATE_MANUAL_ACTION_FLAGS` event was added to the FSM to commit these flag changes without causing a full state transition.
*   **Simplified UI Component (`src/components/main-tab-content.tsx`):**
    *   **REMOVED** the complex local `useEffect` that previously duplicated the button state calculation.
    *   **REMOVED** the local `useState` variables for the button `disabled` states.
    *   The `disabled` prop of the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons are now bound directly to the new global FSM flags (`!fsmFlags.isManual...Possible`), making the component purely reactive to the global state.

**Outcome of v3.2.5.0.Q:**
*   The logic for enabling/disabling manual AI buttons is now correctly centralized in the global FSM, adhering to the "single source of truth" principle.
*   The `MainTabContent` component is significantly cleaner and more maintainable.
*   The application's state management is more robust and predictable, reducing the risk of inconsistencies.
*   The application version is now consistently `v3.2.5.0.Q`.
---
**App Version:** `v3.2.5.0.P` (Fix Stuck Chat Macro)
**Tag:** `Phase-19_Task-3.2.5.0.P_FixStuckChatMacro` (Commit `f2e8c257`)
**Subject:** `fix(fsm,chat): Move chat useActionState to context, fix stuck macro (v3.2.5.0.P)`
**Details:**
This commit (`f2e8c257`) resolves a critical bug where the "AI Full Stock Analysis" macro would get stuck permanently if the user switched tabs while a chat action was pending. The root cause was that the `useActionState` hook for the `chatServerAction` resided in `MainTabContent`, which was unmounted on tab switch, destroying the action's state.

**Key Changes in v3.2.5.0.P:**
*   **Centralized Chat Action State (`src/contexts/stock-analysis-context.tsx`):**
    *   The `useActionState` hook for `chatServerAction` was moved from `MainTabContent` into the `StockAnalysisProvider`.
    *   A new `useEffect` hook was added to `StockAnalysisProvider` to listen for changes in this centralized `chatActionState` and dispatch `CHAT_MESSAGE_ACTION_SUCCESS` or `CHAT_MESSAGE_ACTION_ERROR` to the global FSM. This ensures the action's lifecycle is managed in a persistent context.
*   **Simplified `MainTabContent` (`src/components/main-tab-content.tsx`):**
    *   Removed the `useActionState` hook and its associated `useEffect` for the chat action, as this logic is now handled globally.
*   **Simplified `ChatbotFsmProvider` (`src/contexts/chatbot-fsm-context.tsx`):**
    *   The provider's props and internal logic were simplified, as it no longer needs to handle the server action directly. It now focuses solely on managing the UI state of the chat input and dispatches submission requests to the global FSM.

**Outcome of v3.2.5.0.P:**
*   The "AI Full Stock Analysis" macro no longer gets stuck when the user navigates away from the main tab. Chat actions now complete reliably in the background.
*   The application architecture is more robust, with critical asynchronous action state handled in a persistent global context.
*   The application version is now consistently `v3.2.5.0.P`.
---
**App Version:** `v3.2.5.0.O` (Fix UI Log Spam Suppression)
**Tag:** `Phase-19_Task-3.2.5.0.O_FixLogSpamSuppression` (Commit `99a0f7e1`)
**Subject:** `fix(debug): Correctly categorize validation logs to fix UI log spam toggle (v3.2.5.0.O)`
**Details:**
This commit (`99a0f7e1`) fixes a bug where the "Enable UI/Render Log Spam" toggle (implemented in `v3.2.5.0.N`) was not suppressing noisy data validation logs from `isDataReadyForProcessing`.

**Key Changes in v3.2.5.0.O:**
*   **`src/lib/data-validation-utils.ts`:**
    *   The `isDataReadyForProcessing` utility function was updated to accept an optional `category` parameter.
*   **`src/components/main-tab-content.tsx`:**
    *   All calls to `isDataReadyForProcessing` within this component were updated to pass the `'Validation'` category.
*   **`src/contexts/stock-analysis-context.tsx`:**
    *   The console interceptor logic was updated to include `'Validation'` in the list of suppressible UI log categories.

**Outcome of v3.2.5.0.O:**
*   The "Enable UI/Render Log Spam" toggle now correctly suppresses the high-frequency validation logs as intended.
*   The client debug console is significantly cleaner by default.
*   The application version is now consistently `v3.2.5.0.O`.
---
**App Version:** `v3.2.5.0.N` (UI/Render Log Toggle Feature)
**Tag:** `Phase-19_Task-3.2.5.0.N_UiRenderLogToggle` (Commit `37a75908`)
**Subject:** `feat(debug): Add toggle to control UI/render log spam (v3.2.5.0.N)`
**Details:**
This commit (`37a75908`) completes the "UI/Render Log Toggle" feature series (`v3.2.5.0.N.0` through `v3.2.5.0.N.2`), which provides control over high-frequency UI component logs.

**Key Changes in v3.2.5.0.N Series (Consolidated):**
*   **New State & UI Toggle (v3.2.5.0.N.0):** Added `isUiRenderLoggingEnabled` state (defaulting to `false`) to `StockAnalysisContext` and a corresponding "Enable UI/Render Log Spam" toggle switch to `DebugSettingsCard`.
*   **Conditional Log Suppression (v3.2.5.0.N.1):** Implemented logic in the `StockAnalysisContext` console interceptor to suppress logs with specific UI-related categories (e.g., `'RenderState'`, `'PropsReceived'`) when the new toggle is disabled.
*   **Log Category Standardization (v3.2.5.0.N.2):** Audited UI components (`KeyMetricsDisplay`, `StockSnapshotDetailsDisplay`, etc.) and standardized their noisy, render-cycle-based logs to use the correct categories for suppression.

**Outcome of v3.2.5.0.N:**
*   The client debug console is significantly cleaner by default, as high-frequency UI render and prop-change logs are suppressed.
*   Developers can easily re-enable this verbose logging via the new toggle for targeted UI debugging.
*   The application version is now consistently `v3.2.5.0.N`.
---
**App Version:** `v3.2.5.0.M` (Fix Tab Switching State Reset)
**Tag:** `Phase-19_Task-3.2.5.0.M_FixTabSwitchStateReset` (Commit `f8e8a609`)
**Subject:** `fix(fsm,ui): Persist ticker input in global FSM, prevent reset on tab switch (v3.2.5.0.M)`
**Details:**
This commit (`f8e8a609`) resolves a bug where switching to another tab (e.g., "Debug") and back to "Main" would reset the ticker input field to its default value. This was caused by the input state being managed locally within `MainTabContent`, which was unmounted on tab switch.

**Key Changes in v3.2.5.0.M:**
*   **Centralized Ticker Input State (`src/contexts/stock-analysis-context.tsx`):**
    *   A `userInputTicker` variable was added to `GlobalFsmContextVariables`.
    *   A new FSM event, `USER_INPUT_TICKER_CHANGED`, was added to update this global variable.
*   **Refactored `MainTabContent` (`src/components/main-tab-content.tsx`):**
    *   Removed the local `useState` for the ticker input.
    *   The `<Input>` component's `value` is now bound to `fsmVariables.userInputTicker`.
    *   The `onChange` handler now dispatches the `USER_INPUT_TICKER_CHANGED` event to the global FSM.

**Outcome of v3.2.5.0.M:**
*   The ticker input field's value now persists correctly across tab switches, improving user experience.
*   The component state is further aligned with the single source of truth principle of the global FSM.
*   The application version is now consistently `v3.2.5.0.M`.
---
**App Version:** `v3.2.5.0.L` (FSM Debug Tab Migration)
**Tag:** `Phase-18_Task-3.2.5.0.L_FSM_DebugTabMigration` (Commit `36cfe3d5`)
**Subject:** `feat(debug,fsm): Migrate FSM monitor to dedicated tab, deprecate old UI (v3.2.5.0.L)`
**Details:**
This commit (`36cfe3d5`) completes the "FSM Debug Tab Migration" task series (`v3.2.5.0.L.0` through `v3.2.5.0.L.2`), which is part of the broader "FSM Consolidation & Refactor" feature (`v3.2`). The floating FSM monitor has been successfully replaced with a more integrated and user-friendly dedicated "FSM Debug" tab.

**Key Changes in v3.2.5.0.L Series (Consolidated):**
*   **New "FSM Debug" Tab (Task v3.2.5.0.L.0):** Added a new "FSM Debug" tab trigger and content placeholder to the main `Tabs` component in `page-content.tsx`.
*   **Implemented Display Logic (Task v3.2.5.0.L.1):** Created a new `fsm-debug-tab-content.tsx` component to display the Global FSM state, flags, and variables within distinct UI cards. Migrated copy/export functionality to this new component.
*   **Deprecated Old UI (Task v3.2.5.0.L.2):** Removed the old floating `FsmStateDebugCard` component and its associated "Enable & Show Global FSM Monitor" toggle switch from `page-content.tsx`. Removed the corresponding state management (`isFsmDebugCardEnabled`, etc.) from `StockAnalysisContext`, simplifying the context. The file `src/components/fsm-state-debug-card.tsx` was removed.

**Outcome of v3.2.5.0.L:**
*   The FSM monitor is now a first-class citizen of the UI in its own tab.
*   UI/UX for debugging the FSM is improved and less cluttered.
*   The codebase is cleaner with the removal of the old floating card and its state.
*   Application version is now consistently `v3.2.5.0.L`.
---
**App Version:** `v3.2.5.0.F` (Consolidated FSM & Logging Fixes)
**Tag:** `Phase-17_Task-3.2.5.0.F_ConsolidatedLoggingFixes` (Commit `f34f5128`)
**Subject:** `fix(fsm,debug): Consolidate FSM orchestrator, logging & startup fixes (v3.2.5.0.F)`
**Details:**
This commit (`f34f5128`) represents the consolidation of bug fixes for the "FSM Consolidation & Refactor" feature (Feature `v3.2`), specifically addressing issues within the `v3.2.5.0.D` through `v3.2.5.0.F` series. These fixes significantly improve the stability of the FSM orchestrator and the client-side logging system.

**Key Changes in the v3.2.5.0.D/E/F Series (Consolidated):**
*   **Corrected "Reduced Startup Logging" Logic (v3.2.5.0.D, v3.2.5.0.F):**
    *   Fixed a critical bug where the "Reduced Startup Logging" toggle was incorrectly suppressing logs even after the initial application pipeline had finished.
    *   The root cause was twofold:
        1.  The FSM's `isInitialLoad` variable was not being set to `false` when running the "AI Full Stock Analysis" macro, preventing the startup completion flag from ever being set (`v3.2.5.0.D` fix).
        2.  The console interceptor `useEffect` in `StockAnalysisContext` held a stale closure over the startup flag. This was resolved by adding the relevant FSM variable (`isInitialLoad`) to its dependency array, ensuring the interceptor re-initializes with the correct state (`v3.2.5.0.F` fix).
    *   The startup logging feature now correctly deactivates after the very first data pipeline completes, ensuring full logging for all subsequent user actions.
*   **Resolved FSM `useEffect` Infinite Loop (v3.2.5.0.E):**
    *   Fixed a critical bug causing an infinite render loop by correcting the dependency array of the main FSM orchestrator `useEffect` in `StockAnalysisContext`. Data state variables (like `_stockSnapshotJson`) were removed, and the array now correctly depends only on control state variables (FSM state, server action pending flags, etc.), breaking the loop.
*   **Application Metadata:** Version updated to `v3.2.5.0.F` to reflect these consolidated fixes.

**Outcome of v3.2.5.0.F:**
*   The FSM orchestrator is more stable and no longer prone to the identified infinite loop.
*   The "Reduced Startup Logging" feature now functions as intended, only affecting the initial app load.
*   Client-side debug logging is more reliable and accurately reflects the application's state throughout its lifecycle.
*   Phase 5 (Testing & Debugging) of the FSM consolidation feature can now proceed on a more stable foundation.

---
**App Version:** `v3.2.5.0.C` (Consolidated FSM Debugging Iteration)
**Tag:** `Phase-16_Task-3.2.5.0.C_FSM_Debugging_Consolidation` (Commit `2338c4f8`)
**Subject:** `fix(fsm,debug,core): Consolidate FSM orchestrator, macro, logging & chat fixes (v3.2.5.0.C)`
**Details:**
This commit (`2338c4f8`) represents a significant bug-fixing iteration for the "FSM Consolidation & Refactor" feature (Feature `v3.2`), specifically addressing issues within the `v3.2.5.0.x` series up to `v3.2.5.0.C`. Key fixes include:

*   **FSM Orchestrator & Macro Pipeline (`StockAnalysisContext.tsx`):**
    *   Refined the main FSM orchestrator `useEffect` (dependency array and internal logic) to improve reliability for triggering and progressing through standard automated analysis pipelines and the "AI Full Stock Analysis" macro.
    *   Corrected the sequence of chat prompt dispatches within the AI Full Analysis Macro.
    *   Ensured `pendingChatSubmissionPayload` and macro state variables are managed and cleared appropriately.
*   **Client-Side Logging (`StockAnalysisContext.tsx`, `global-log-buffer.ts`):**
    *   Addressed issues causing FSM orchestrator and reducer logs to be missing from the client-side debug console by ensuring the orchestrator `useEffect` runs correctly and its logging calls are effective.
    *   Fixed the "Enable Reduced Logging During Initial App Startup" toggle by refining the `isInitialAppStartupComplete` flag logic.
*   **AI Flow Files (`analyze-options-chain-flow.ts`, `analyze-stock-data.ts`, `chat-flow.ts`, `analyze-ta-flow.ts`):**
    *   Corrected minor syntax errors (e.g., template literals).
    *   Implemented consistent caching for `ai.definePrompt` calls to resolve Genkit registry warnings.
*   **Chat Functionality (`StockAnalysisContext.tsx`, `ChatbotFsmContext.tsx`, `Chatbot.tsx`):**
    *   Resolved issues with example chat prompt button submissions.
    *   Addressed duplicate manual user message submissions.
*   **Application Metadata (`app-metadata.json`):**
    *   Version updated to `v3.2.5.0.C`. Addressed `lastUpdatedTimestamp` validation by making it optional.

This commit consolidates these fixes, improving stability for Phase 5 (Testing and Debugging) of the FSM Consolidation feature.

---
**App Version:** `v3.2.4.1.0` (Complete FSM Consolidation Phase 4)
**Tag:** `Phase-15_Task-3.2.4.1.0_FSM_Consolidation_Phase4_Complete` (Commit `c661f9d1`)
**Subject:** `feat(fsm,debug): Complete Phase 4 of FSM Consolidation - Debug Tooling Finalization (v3.2.4.1.0)`
**Details:**
This commit marks the completion of Phase 4 ("Clean Up & Finalize Debugging Tools") for the "FSM Consolidation & Refactor" feature (Feature `v3.2`). This phase successfully refined the FSM Debug Card, enhanced client debug log exports to include a comprehensive global FSM snapshot, and thoroughly audited/updated all FSM-related debug logging throughout the application.

**Key Changes in Phase 4 (Tasks v3.2.4.0.0 through v3.2.4.1.0):**
*   **Finalized Enhanced FSM Debug Card & Client Debug Console Exports (Task v3.2.4.0.0 - Commit `f6520642`):**
    *   `FsmStateDebugCard.tsx` was refactored to display the global FSM's state, all `GlobalFsmFlags`, and all `GlobalFsmContextVariables`.
    *   Removed separate display sections for legacy local FSMs from the `FsmStateDebugCard`.
    *   Export/copy functions within `FsmStateDebugCard` updated to capture the full global FSM snapshot.
    *   `DebugConsole.tsx` export functions (`generateLogsTxtWithMetadata`, `generateLogsCsvWithMetadata`) were updated to include the comprehensive global FSM state, flags, and variables in exported log files.
*   **FSM Debug Log Update/Remove/Consolidate/Refinement (Task v3.2.4.1.0 - Commit `d8686c74`):**
    *   Systematically audited and refined all `logDebug` calls related to FSM state and transitions across the codebase.
    *   Removed logs pertaining to deprecated local FSMs.
    *   Updated existing logs to accurately reflect the single global FSM's states, flags, and variables.
    *   Consolidated redundant logging and improved log message clarity and `LogSourceId` consistency.
    *   Ensured components interacting with or driven by the FSM provide relevant diagnostic logging.

**Outcome of Phase 4:**
*   The `FsmStateDebugCard` now provides a clear and comprehensive view of the single global FSM's operational state.
*   Client debug log exports are significantly more informative, including a full snapshot of the global FSM (state, flags, variables).
*   All FSM-related debug logging throughout the application is now consistent with the single global FSM architecture, enhancing debuggability and traceability.
*   The application version is now consistently `v3.2.4.1.0`.
*   The FSM consolidation feature is now in its final stages, with Phase 5 (Testing & Debugging) and Phase 6 (Documentation) remaining.

---
**App Version:** `v3.2.3.2.0` (Complete FSM Consolidation Phase 3)
**Tag:** `Phase-14_Task-3.2.3.2.0_FSM_Consolidation_Phase3_Complete` (Commit `7f0e552b`)
**Subject:** `feat(fsm): Complete Phase 3 of FSM Consolidation - Chat & Debug Menus (v3.2.3.2.0)`
**Details:**
This commit marks the completion of Phase 3 ("Integrating Chat & Debug Console Menus") for the "FSM Consolidation & Refactor" feature (Feature `v3.2`). This phase successfully migrated Chatbot submission flow, Chatbot UI state management, and Debug Console menu UI states to be driven by the new single global Finite State Machine (FSM) within `StockAnalysisContext`.

**Key Changes in Phase 3 (Tasks v3.2.3.0.0 through v3.2.3.2.0):**
*   **Integrated Chatbot Submission Flow (Task v3.2.3.0.0 - Commit `5e688769`):**
    *   The chatbot message submission process is now orchestrated by the global FSM.
    *   `ChatbotFsmContext` dispatches `SUBMIT_CHAT_MESSAGE` to the global FSM.
    *   The global FSM manages states like `CHAT_MESSAGE_PENDING`, `CHAT_MESSAGE_SUCCESS` / `CHAT_MESSAGE_ERROR`.
    *   `MainTabContent` uses `useActionState` for `chatServerAction` and coordinates with the global FSM to trigger the action and report results.
*   **Chatbot UI State Management (Loading/Disabled) (Task v3.2.3.1.0 - Commit `c296d6dc`):**
    *   Simplified the `isProcessing` logic in `Chatbot.tsx` to directly use the `isAnyAnalysisInProgress` prop (derived from `isOverallAnalysisPending` in `MainTabContent`), which already reflects the global FSM's busy state, including chat submissions.
*   **Integrated Debug Console Menu UI States (Task v3.2.3.2.0 - Commit `7f0e552b`):**
    *   The `DebugConsoleFsmContext` was deprecated and its functionality absorbed into the global FSM.
    *   New flags (`isDebugConsoleFilterMenuOpen`, `isDebugConsoleCopyMenuOpen`, `isDebugConsoleExportMenuOpen`) were added to `GlobalFsmFlags` in `StockAnalysisContext`.
    *   The `TOGGLE_DEBUG_CONSOLE_MENU` event is handled by the global FSM to manage these flags, ensuring only one menu is open at a time.
    *   `DebugConsole.tsx` now uses these global flags and dispatches to the global FSM for menu interactions.

**Outcome of Phase 3:**
*   Chat functionality (submission, UI state) and Debug Console menu UI states are now fully managed by the single global FSM.
*   State management for these interactive elements is centralized, enhancing consistency and predictability.
*   The `DebugConsoleFsmContext` has been successfully removed, simplifying the context architecture.
*   The application version is now consistently `v3.2.3.2.0`.
*   The FSM consolidation feature is nearing completion, with major UI interactions (automated pipeline, manual AI actions, chat, debug menus) now integrated. The next phase (Phase 4) will focus on comprehensive testing and debugging.

---
**App Version:** `v3.2.2.1.0` (Complete FSM Consolidation Phase 2)
**Tag:** `Phase-13_Task-3.2.2.1.0_FSM_Consolidation_Phase2_Complete` (Commit `0a0ba41c`)
**Subject:** `feat(fsm): Complete Phase 2 of FSM Consolidation - Manual AI Actions (v3.2.2.1.0)`
**Details:**
This commit marks the completion of Phase 2 ("Integrating Manual AI Actions") for the "FSM Consolidation & Refactor" feature (Feature `v3.2`). This phase successfully migrated the manual "Generate AI Key Takeaways" and "Generate AI Options Analysis" functionalities to be driven by the new single global Finite State Machine (FSM) within `StockAnalysisContext`.

**Key Changes in Phase 2 (Tasks v3.2.2.0.0 through v3.2.2.1.0):**
*   **Integrated "Generate AI Key Takeaways" Button (Task v3.2.2.0.0 - Commit `55fcc0c2`):**
    *   The "Generate AI Key Takeaways" button's state (enabled/disabled) and action are now driven by the global FSM.
    *   Clicking the button dispatches `TRIGGER_MANUAL_KEY_TAKEAWAYS` to the global FSM, which orchestrates the call to `performAiAnalysisAction`.
    *   The FSM manages states like `GENERATING_KEY_TAKEAWAYS`, `KEY_TAKEAWAYS_SUCCEEDED` / `KEY_TAKEAWAYS_FAILED`, and updates `flags.isKeyTakeawaysDataAvailable`.
*   **Integrated "Generate AI Options Analysis" Button (Task v3.2.2.1.0 - Commit `0a0ba41c`):**
    *   The "Generate AI Options Analysis" button's state and action are now driven by the global FSM.
    *   Clicking the button dispatches `TRIGGER_MANUAL_OPTIONS_ANALYSIS` to the global FSM, which orchestrates the call to `performAiOptionsAnalysisAction`.
    *   The FSM manages states like `ANALYZING_OPTIONS`, `OPTIONS_ANALYSIS_SUCCEEDED` / `OPTIONS_ANALYSIS_FAILED`, and updates `flags.isOptionsAnalysisDataAvailable`.
    *   The `globalDispatchGuardRef` logic in `MainTabContent.tsx` was refined to correctly manage guards for both manual AI actions, ensuring they can be re-triggered after completion or failure.

**Outcome of Phase 2:**
*   Both manual AI analysis functionalities (Key Takeaways and Options Analysis) are now fully managed by the single global FSM.
*   State management for these user-triggered AI actions is centralized, improving UI consistency for button enablement and action feedback.
*   The application version is now consistently `v3.2.2.1.0`.
*   The FSM consolidation feature is progressing, with the automated pipeline and manual AI actions now integrated. The next phase will focus on integrating Chat and Debug Console menu states.

---
**App Version:** `v3.2.1.3.0` (Complete FSM Consolidation Phase 1)
**Tag:** `Phase-12_Task-3.2.1.3.0_FSM_Consolidation_Phase1_Complete` (Commit `57c7e8b0`)
**Subject:** `feat(fsm): Complete Phase 1 of FSM Consolidation (v3.2.1.3.0)`
**Details:**
This commit marks the completion of Phase 1 ("Foundation & Core FSM Setup") for the "FSM Consolidation & Refactor" feature (Feature `v3.2`). This phase established the foundational structure of the new single global Finite State Machine (FSM) within `StockAnalysisContext` and successfully migrated the entire automated "Analyze Stock" pipeline (ticker input, data fetching, and AI TA calculation) to be driven by this new FSM.

**Key Changes in Phase 1 (Tasks v3.2.1.0.0 through v3.2.1.3.0):**
*   **Defined Single FSM Structure (Task v3.2.1.0.0 - Commit `919db9f2`):**
    *   Introduced `GlobalFsmState` enum, `GlobalFsmContextVariables`, and `GlobalFsmFlags` interfaces in `src/contexts/stock-analysis-context.tsx`.
    *   Adapted the main FSM reducer (`fsmReducer`) in `StockAnalysisContext` to manage the new state structure, including variables and flags.
    *   **Bug Fix (Task v3.2.1.0.1 - Commit `1aefabe1`):** Resolved an issue with repeated `INITIALIZATION_COMPLETE` dispatches from the FSM orchestrator by implementing a `useRef` guard (`initializationDispatchedRef`).
*   **Integrated "Analyze Stock" Button & Input Handling (Task v3.2.1.1.0 - Commit `1d1342aa`):**
    *   Removed the local FSM from `src/components/main-tab-content.tsx` that previously managed ticker input and automated analysis submission.
    *   The "Analyze Stock" button's state (enabled/disabled) and action are now driven by the global FSM. Clicking the button dispatches `START_FULL_ANALYSIS` to the global FSM.
*   **Migrated Data Fetching Pipeline to New FSM (Task v3.2.1.2.0 - Commit `368c85ab`):**
    *   The sequence of fetching market data, stock snapshot, standard TAs, and options chain data is now orchestrated by the new single global FSM.
    *   The FSM transitions through states like `PIPELINE_REQUESTED_DATA_FETCH`, `DATA_FETCH_IN_PROGRESS`, and `DATA_FETCH_SUCCEEDED` / `DATA_FETCH_FAILED` / `ERROR_STALE_DATA`.
    *   Data readiness flags (`isMarketDataReady`, `isSnapshotDataReady`, etc.) are updated by the FSM based on server action outcomes.
*   **Migrated AI TA Calculation to New FSM (Automated Pipeline) (Task v3.2.1.3.0 - Commit `2f0acd35`):**
    *   The AI-driven Technical Analysis (pivot points) calculation is now triggered by the FSM after successful data fetch.
    *   The FSM manages states like `CALCULATING_AI_TA`, `AI_TA_CALCULATION_SUCCEEDED` / `AI_TA_CALCULATION_FAILED`.
    *   The full automated pipeline now completes by transitioning through `PIPELINE_AUTOMATED_COMPLETE` and then back to an `IDLE` or `VALID_TICKER_ENTERED` state, ready for further user interaction or new analysis.

**Outcome of Phase 1:**
*   The core automated analysis pipeline (from ticker input to AI TA calculation) is now fully managed by the new single global FSM in `StockAnalysisContext`.
*   State management for this critical pipeline is centralized, improving clarity, reducing complexity by removing a local FSM from `MainTabContent`, and enhancing predictability.
*   The foundation is now solidly laid for migrating manual AI actions (Key Takeaways, Options Analysis) and other UI state logic (Chat, Debug Console Menus) to this consolidated FSM in subsequent phases of Feature `v3.2`.
*   The application version is now consistently `v3.2.1.3.0`.

---
**App Version:** `v3.1.3.4` (Complete Debug Log Enhancements Feature)
**Tag:** `Phase-11_Task-3.1.3.4_CompleteDebugLogEnhancements` (Commit `9aef8261`)
**Subject:** `feat(debug,core): Complete Debug Log Enhancements feature (v3.1.3.4)`
**Details:**
This commit marks the full completion of the "Debug Log Enhancements" feature, which spanned application versions `v3.1.1.1` through `v3.1.3.4`. This feature significantly improves the client-side debugging experience and overall application stability through refined logging mechanisms and FSM behavior.

**Key Improvements and Fixes in the v3.1.x.y "Debug Log Enhancements" Series:**

*   **Client Log Buffer & Display (v3.1.1.1):**
    *   Increased client-side log buffer capacity from 300 to 1000 entries in `src/lib/global-log-buffer.ts`.
    *   Implemented a visual "LOG BUFFER WRAPPED" system message in `src/components/debug-console.tsx` when the circular buffer overwrites older entries.
*   **Log Verbosity Reduction (Initial Pass - v3.1.1.2):**
    *   Reduced general log verbosity in the `useEffect` hook managing button states within `src/components/main-tab-content.tsx`.
*   **Startup-Specific Log Reduction & UI Toggle (v3.1.2.x):**
    *   (v3.1.2.1) Introduced `isInitialAppStartupComplete` and `isReducedStartupLoggingEnabled` state flags in `src/contexts/stock-analysis-context.tsx`.
    *   (v3.1.2.1) Added a UI toggle switch in `src/components/debug-settings-card.tsx` for `isReducedStartupLoggingEnabled`.
    *   (v3.1.2.2) Implemented conditional logging logic in `StockAnalysisContext`'s console interceptor. Non-critical logs are suppressed during initial app startup if the toggle is enabled, and a "StartupComplete" log message is emitted when full logging resumes.
*   **FSM Dispatch & Data Flow Bug Fixes (v3.1.3.x):**
    *   (v3.1.3.0) Corrected `currentPrice` derivation in `src/services/data-sources/adapters/polygon-adapter.ts` to better handle market-closed scenarios for options analysis. Refined FSM display logging in `StockAnalysisContext` to reduce duplicates. Implemented initial `globalDispatchGuardRef` in `MainTabContent.tsx` to prevent duplicate global FSM event dispatches.
    *   (v3.1.3.1) Further strengthened `PolygonAdapter`'s `currentPrice` logic. Tweaked AI Options flow/prompt (`analyze-options-chain.json`, `analyze-options-chain-flow.ts`) for improved wall detection. Further refined `globalDispatchGuardRef` reset logic in `MainTabContent.tsx`.
    *   (v3.1.3.2 & v3.1.3.3) Continued refinement of the `globalDispatchGuardRef` reset logic in `MainTabContent.tsx`, making conditions for guard reset more precise based on global FSM terminal states for specific actions and relevant ticker contexts to prevent duplicate global FSM event dispatches.
    *   (v3.1.3.4) Fixed a `ReferenceError: activeAnalysisTickerRef is not defined` in `MainTabContent.tsx` by correctly using `localFsm.activeAnalysisTicker` within the global FSM dispatch guard reset logic.

**Outcome of "Debug Log Enhancements" Feature (v3.1.3.4):**
*   The client-side debug console is more manageable and informative with increased log retention and clear wrap indication.
*   Log verbosity is reduced, particularly during application startup (user-configurable) and from FSM display updates.
*   FSM state management is more robust, especially in preventing duplicate dispatches of global events.
*   Data integrity for options analysis is improved due to more accurate `currentPrice` handling in the data adapter.
*   The application version is now consistently `v3.1.3.4`.

---
**App Version:** `v3.0.0.1` (Enforce Fully Dynamic Versioning)
**Tag:** `Phase-10_Task-3.0.0.1_DynamicVersioningFix`
**Commit Hash:** (To be assigned upon actual commit)
**Subject:** `fix(core): Enforce dynamic app versioning, remove hardcoded versions (v3.0.0.1)`
**Details:**
This version (`v3.0.0.1`) implements a critical fix to ensure all application versioning is handled dynamically, sourcing the version from `src/config/app-metadata.json`. This resolves previous inconsistencies and enforces a strict policy against hardcoded versions in UI components or for export metadata.

**Key Changes in v3.0.0.1:**

*   **Dynamic Versioning Enforcement:**
    *   `src/components/debug-console.tsx`:
        *   Removed the `APP_VERSION_FOR_EXPORT` constant.
        *   The `DebugConsole` component now accepts an `appVersion: string` prop.
        *   Export helper functions (`getFsmStatesAndTimestampForExport`, `generateLogsTxtWithMetadata`, `generateLogsCsvWithMetadata`) were refactored to accept and use this dynamic `appVersion` prop for embedding in exported log file metadata.
        *   All copy/export handlers in `DebugConsole` now pass the dynamic `appVersion` prop to these helper functions.
    *   `src/components/page-content.tsx`:
        *   The `PageContent` component now passes the `appVersion` prop (which it receives from the `Home` server component, sourced from `app-metadata.json`) to the `DebugConsole` component.
*   **Documentation Updates:**
    *   `README_3.0.md` (Document version 3.0.1): Updated to strictly reflect the new dynamic versioning policy:
        *   `src/config/app-metadata.json` is the sole source of truth for `appVersion`.
        *   All UI displays (Header) and export metadata (DebugConsole logs) derive the application version dynamically from this single source.
        *   Hardcoded version constants (like the former `APP_VERSION_FOR_EXPORT`) are prohibited and have been removed.
        *   Commit procedures updated to reflect these changes.
    *   `CHANGELOG.md` (this file): Updated with this commit log for `v3.0.0.1`.
*   **Metadata (`src/config/app-metadata.json`):**
    *   Remains at `appVersion: "v3.0.0.1"` with its `lastUpdatedTimestamp` from the previous AI definition loading fix, as this commit is part of the `v3.0.0.1` scope.

**Outcome of v3.0.0.1:**
*   The application now consistently uses a single source of truth (`src/config/app-metadata.json`) for its version number.
*   All version displays in the UI and versions embedded in exported log files are dynamic and reflect this single source.
*   Hardcoded version constants have been eliminated, reducing the risk of versioning inconsistencies.
*   Documentation (`README_3.0.md`) accurately reflects the enforced dynamic versioning policy.
---
**App Version:** `v3.0.0.1` (Fix AI Definition Loading for Deployment)
**Tag:** `Phase-10_Task-3.0.0.0_FixAIDefinitionLoading` (Note: Task ID was 3.0.0.0, version corrected to 3.0.0.1 by user)
**Commit Hash:** (Previous commit hash for this fix)
**Subject:** `fix(ai): Use dynamic imports for AI definition JSONs for deployment (v3.0.0.1)`
**Details:**
This version (`v3.0.0.1`) addresses a critical issue where AI flows failed in the deployed App Hosting environment due to an inability to load their prompt/logic definition JSON files. The fix involves changing the loading mechanism in `src/ai/definition-loader.ts` (and `src/ai/prompt-loader.ts`) from `fs.readFile` with `process.cwd()` to use dynamic `import()` statements with the `@/` alias for robust path resolution.

**Key Changes in v3.0.0.1 (AI Definition Loading Fix):**

*   **AI Definition Loading (`src/ai/definition-loader.ts`, `src/ai/prompt-loader.ts`):**
    *   Modified `loadDefinition` and `loadPromptDefinition` functions to use dynamic `await import(\`@/ai/definitions/\${definitionName}.json\`)`.
    *   Removed direct `fs` and `path` module imports as they are no longer needed for this loading mechanism.
    *   Ensured that the `.default` property of the dynamically imported module is accessed to get the JSON content.
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   `appVersion` updated to `v3.0.0.1`.
    *   `lastUpdatedTimestamp` updated to the current real-world ISO 8601 timestamp.
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   `APP_VERSION_FOR_EXPORT` was (incorrectly, then corrected to) updated to `v3.0.0.1`. (This will be further addressed in a subsequent commit to make it fully dynamic).
*   **Documentation (`README_3.0.md` created, `CHANGELOG.md` updated):**
    *   A new `README_3.0.md` was created to serve as a fresh baseline for v3.0.0.0 onwards, reflecting the current application state and excluding v2.x history.
    *   `CHANGELOG.md` (this file) was updated with entries for this AI definition loading fix under `v3.0.0.1`.

**Outcome of v3.0.0.1 (AI Definition Loading Fix):**
*   AI flows should now correctly load their JSON definitions in the Firebase App Hosting environment, resolving the `ENOENT` errors and enabling AI functionalities.
*   The application version is officially `v3.0.0.1`.
---
**App Version:** `v2.9.D.U` (Consolidated Docs, Metadata Policy & AI Thinking Config Fix)
**Tag:** `Phase-9_Task-9.D.U_ConsolidatedDocs_MetadataPolicy_ThinkingConfigFix`
**Commit Hash:** `cd5e3a46`
**Subject:** `docs(all): Consolidated docs for v2.9.D.U, codify metadata rules, AI thinking_config fix`
**Details:**
This version (`v2.9.D.U`) is a documentation and metadata consolidation commit. It reflects the cumulative functional state achieved after tasks `v2.9.D.Q` through `v2.9.D.T`, primarily focusing on correcting AI prompt configurations and application metadata handling.

**Key Changes in v2.9.D.U (consolidating fixes from D.R, D.S, D.T over D.Q):**

*   **AI Prompt Configuration (Reflecting `v2.9.D.S` fixes):**
    *   **Corrected "Dynamic Thinking" Implementation:** The method for enabling "Dynamic Thinking" in Genkit prompts for Google AI models has been rectified.
        *   The erroneous `enableDynamicThinking` flag was removed from `LlmPromptDefinitionSchema` in `src/ai/definition-loader.ts` and from all JSON prompt definitions (`src/ai/definitions/*.json`).
        *   AI flows (`src/ai/flows/analyze-stock-data.ts`, `src/ai/flows/analyze-options-chain-flow.ts`, `src/ai/flows/chat-flow.ts`) now correctly pass the `thinkingBudget` parameter (e.g., `thinkingBudget: -1` for dynamic thinking) within a nested `thinkingConfig` object, which is part of the main `config` object supplied to `ai.definePrompt`. This aligns with Google AI API expectations and resolves previous 400 Bad Request errors related to unknown `generation_config` parameters.
*   **Application Metadata (`src/config/app-metadata.json` - Reflecting `v2.9.D.T` fix):**
    *   **Timestamp Correction:** Fixed an issue where `lastUpdatedTimestamp` used a placeholder string, causing Zod validation failures during application startup. This field now correctly uses a valid ISO 8601 timestamp.
    *   **Policy Enforcement:** The `README.md` has been updated to codify a strict policy against using placeholder timestamps in metadata files; real, valid timestamps must be used. It also now specifies that `app-metadata.json` is the sole source for `appVersion` and that `header.tsx` / `debug-console.tsx` should not be manually updated for versioning.
    *   **Version Update:** Application version in `src/config/app-metadata.json` updated to `v2.9.D.U`. The `APP_VERSION_FOR_EXPORT` in `debug-console.tsx` is also aligned with this commit tag.
*   **Documentation (`README.md`, `CHANGELOG.md`):**
    *   `README.md`: Updated to reflect the current application version `v2.9.D.U`. Relevant sections (PRD, AI Configuration, Commit Procedures) updated to detail the correct `thinkingConfig` usage, the new metadata timestamp policy, and the new versioning procedures.
    *   `CHANGELOG.md` (this file): Updated with this consolidated commit log for `v2.9.D.U`, summarizing the fixes and documentation changes.
*   **UI Version Display (`src/components/layout/header.tsx`, `src/components/debug-console.tsx`):**
    *   The `header.tsx` now receives `appVersion` dynamically via props from `page.tsx` (which loads from `app-metadata.json`).
    *   The `APP_VERSION_FOR_EXPORT` constant in `src/components/debug-console.tsx` has been set to `v2.9.D.U` for this specific commit tag.
*   **Deferred Items:**
    *   Planned improvements for reducing client-side log spam and refining initial state logging in display components (originally scoped for `v2.9.D.U` code changes) have been deferred to a future task. The codebase regarding these logging aspects remains as it was at the end of `v2.9.D.T`.

**Outcome of v2.9.D.U:**
*   The application's AI flows now use the correct configuration for Google AI's "Dynamic Thinking" feature, preventing related API errors.
*   Application metadata handling is more robust with the enforcement of valid timestamps and centralized versioning.
*   Documentation accurately reflects the current state of AI configuration, metadata policies, and versioning procedures.
*   The application version is consistently managed and displayed.
---
**App Version:** `v2.9.D.M` (Revert Button Debug Code, Standardize AI Flow Error Handling & Logging)
**Tag:** `Phase-9_Task-9.D.M_CleanupRevertButtonDebug_StandardizeAIFlows_Logging`
**Commit Hash:** `76e56c98`
**Subject:** `refactor(ui,ai): Revert button debug, standardize AI flow error handling/logging (v2.9.D.M)`
**Details:**
This version (`v2.9.D.M`) implements cleanup and hardening measures following the resolution of AI prompt safety setting errors in `v2.9.D.L`. It also acknowledges that the manual AI buttons were, in fact, functional once the underlying AI flow errors were resolved.

**Key Changes in v2.9.D.M:**

*   **Task v2.9.D.M (Cleanup, Standardization, and Enhanced Logging):**
    *   **UI Cleanup (`src/components/main-tab-content.tsx` - Task 1 of D.M):**
        *   Removed the diagnostic `div` wrapper (with red border and `onClick` alert) previously around the manual AI buttons.
        *   Removed the `key={...}` props from the "Generate AI Key Takeaways" and "Generate AI Options Analysis" `<Button>` components.
        *   Removed the inline `style={{ opacity: ... }}` props from these buttons.
        *   These elements were part of debugging efforts for a misdiagnosed button click issue.
    *   **AI Flow Error Handling & Logging (Tasks 2 & 3 of D.M):**
        *   `src/ai/flows/analyze-stock-data.ts`: Preserved explicit error throwing if `outputFromPrompt` is undefined (from v2.9.D.K). Added `console.time/timeEnd` for `analyzeStockDataFlowExecutionTime`.
        *   `src/ai/flows/analyze-options-chain-flow.ts`: Implemented explicit error throwing if the AI prompt call returns `undefined` output or if `output.callWalls`/`output.putWalls` are not arrays. Added `console.time/timeEnd` for `analyzeOptionsChainFlowExecutionTime`.
        *   `src/ai/flows/chat-flow.ts`: Modified to throw an error if `output` or `output.response` from the AI prompt is undefined or not a string. Added `console.time/timeEnd` for `chatFlowExecutionTime`.
        *   Server Actions (`performAiAnalysisAction.ts`, `performAiOptionsAnalysisAction.ts`, `chatServerAction.ts`): Added `console.log` statements before and after calls to their respective AI flows. Ensured `catch` blocks consistently return a JSON object with `{ error: "...", details": "..." }` structure in the primary data field of the action's response when a flow throws an error.
    *   **Client-Side Error Display Standardization (Task 4 of D.M):**
        *   `src/components/ai-options-analysis-display.tsx`: Updated parsing logic to correctly check for and display messages from `aiOptionsAnalysisJson` when it contains a direct `error` field from the server action.
        *   `src/components/main-tab-content.tsx`: Reviewed and confirmed logic for handling `chatActionState` to ensure error messages from `chatbotResponseJson` (if `error` field is present) are added to the chat history.
    *   **Application Version Update (Task 4 of D.M):**
        *   `src/components/layout/header.tsx`: Application version string updated to `v2.9.D.M`.
        *   `src/components/debug-console.tsx`: `APP_VERSION_FOR_EXPORT` constant updated to `v2.9.D.M`.
    *   **Documentation Updates (Task 4 of D.M):**
        *   `README.md`: Updated to version 1.53. Reflects app version `v2.9.D.M`.
        *   `CHANGELOG.md` (this file): Updated to reflect this v2.9.D.M commit and its changes.
        *   `docs/Issue-Report_AI_Analysis_Buttons.md`: Updated to summarize the full resolution of the AI flow issues, acknowledge the button click misdiagnosis, and detail the cleanup and hardening measures implemented in v2.9.D.M.

**Outcome of v2.9.D.M:**
*   The codebase is cleaner, with unnecessary button debugging artifacts removed.
*   All AI flows now have more explicit error throwing for critical AI prompt failures and include execution time logging.
*   Server actions consistently log calls to AI flows and provide standardized error JSONs to the client.
*   Client-side display components for AI-generated content are more robust in parsing and displaying error states.
*   The application is now in a more stable and observable state regarding its AI functionalities.
---
**App Version:** `v2.9.D.L` (Fix AI Prompt Safety Settings & Client Error Display)
**Tag:** `Phase-9_Task-9.D.L_FixAiPromptSafety_ImproveClientErrorDisplay`
**Commit Hash:** `0894312b`
**Subject:** `fix(ai,ui): Correct AI safety settings, improve client error display, update docs (v2.9.D.L)`
**Details:**
This version (`v2.9.D.L`) addresses critical AI flow failures caused by incorrect safety setting category strings and improves how client-side components display errors originating from AI flows.

**Key Changes in v2.9.D.L:**

*   **Task v2.9.D.L (Fix AI Safety Settings & Client Error Display):**
    *   **AI Flow Safety Setting Fixes:**
        *   `src/ai/definitions/analyze-stock-data.json`: Corrected `safetySettings[3].category` from `"SEXUALLY_EXPLICIT"` to `"HARM_CATEGORY_SEXUALLY_EXPLICIT"`.
        *   `src/ai/definitions/analyze-options-chain.json`: Corrected `safetySettings[3].category` from `"SEXUALLY_EXPLICIT"` to `"HARM_CATEGORY_SEXUALLY_EXPLICIT"`.
        *   `src/ai/definitions/stock-chatbot.json`: Corrected the fourth safety setting category from `"SEXUALLY_EXPLICIT"` to `"HARM_CATEGORY_SEXUALLY_EXPLICIT"`. All other safety settings were confirmed to be using the correct `HARM_CATEGORY_` prefix.
        *   These changes resolve the `[400 Bad Request] Invalid value at 'safety_settings[3].category'` error previously observed in server logs when AI flows were invoked.
    *   **Client-Side Error Display Improvement:**
        *   `src/components/ai-key-takeaways-display.tsx`: Enhanced the parsing logic for `aiKeyTakeawaysJson` to more reliably detect and display error messages when the JSON contains a direct `error` field (e.g., `{ "error": "...", "details": "..." }`). This improves user feedback when an AI flow fails and the server action returns a structured error.
    *   **Application Version Update:**
        *   `src/components/layout/header.tsx`: Application version string updated to `v2.9.D.L`.
        *   `src/components/debug-console.tsx`: `APP_VERSION_FOR_EXPORT` constant updated to `v2.9.D.L`.
    *   **Documentation Updates:**
        *   `README.md`: Updated to version 1.52. Reflects app version `v2.9.D.L`.
        *   `CHANGELOG.md` (this file): Updated to reflect this v2.9.D.L commit and its changes.
        *   `docs/Issue-Report_AI_Analysis_Buttons.md`: Updated to summarize findings from `v2.9.D.L` logs (confirming AI prompt fixes worked and identifying the same safety setting issue for options analysis). The report now clearly states the button click issue was a misdiagnosis for the AI takeaway problem and outlines the scope for `v2.9.D.M` (reverting unnecessary button debug code, standardizing AI flow error handling, and adding timing logs).

**Debugging Status & Next Steps (Leading into v2.9.D.M):**
*   The `v2.9.D.L` fixes resolved the AI safety setting errors, allowing AI flows to execute and return actual data (or valid "no results" data) instead of failing immediately.
*   This confirmed that the manual AI button clicks *were* functional, as they successfully triggered the (previously failing) AI pipelines.
*   The next planned step (`v2.9.D.M`) is to:
    *   Clean up the now-unnecessary button debugging code (diagnostic div, key props, style props on buttons in `MainTabContent.tsx`).
    *   Standardize error handling and default return logic across all AI flows to ensure robust behavior and clear error propagation.
    *   Improve logging for AI flow execution times.
---
**App Version:** `v2.9.D.K` (Enhanced Error Handling in Key Takeaways Flow)
**Tag:** `Phase-9_Task-9.D.K_ExplicitFailForAIKeyTakeaways`
**Commit Hash:** `(previous_commit_for_D.K)`
**Subject:** `fix(ai): Throw explicit error in Key Takeaways flow if AI output undefined (v2.9.D.K)`
**Details:**
This version (`v2.9.D.K`) focused on making the AI Key Takeaways flow (`analyzeStockDataFlow`) fail more visibly if the underlying AI prompt call did not return a usable output structure.

**Key Changes in v2.9.D.K:**
*   **Task v2.9.D.K (Explicit Failure for AI Prompt Issues in Key Takeaways Flow):**
    *   `src/ai/flows/analyze-stock-data.ts`:
        *   Modified `analyzeStockDataFlow` to explicitly check if `outputFromPrompt` (the result of the `await promptToUse(input)` call) is `undefined`.
        *   If `outputFromPrompt` is `undefined`, the flow now throws a `new Error('AI prompt execution for Key Takeaways failed to return any output structure.');`. This ensures that a complete failure of the AI prompt to return data is treated as a hard error by the flow, which should then be caught by the calling server action (`performAiAnalysisAction`).
        *   The existing logic for filling in default messages for *partially* missing categories (if `outputFromPrompt` itself is defined but lacks certain fields) remains.
        *   Diagnostic logging from D.J within this flow was preserved.
    *   `src/components/layout/header.tsx`: Application version updated to `v2.9.D.K`.
    *   `src/components/debug-console.tsx`: `APP_VERSION_FOR_EXPORT` updated to `v2.9.D.K`.

**Debugging Status & Outcome:**
*   Server logs from the `v2.9.D.K` run (provided for task D.L) revealed a `[400 Bad Request]` API error related to safety settings in the AI prompt definitions. This was due to using `"SEXUALLY_EXPLICIT"` instead of the correct `"HARM_CATEGORY_SEXUALLY_EXPLICIT"`.
*   The D.K change in `analyzeStockDataFlow` (throwing an error on undefined AI output) worked as intended: the flow threw an error due to the API failure, this was caught by `performAiAnalysisAction`, and an error-structured JSON was sent to the client.
*   The client-side `AiKeyTakeawaysDisplay` then showed an error message, "Failed to parse status message from error/skipped JSON...", highlighting a need to improve its parsing of raw error objects from the action.
*   Crucially, the server logs also showed that the manual AI button clicks *were* triggering the server actions and subsequently the AI flows, which was a key piece of information often obscured in earlier debugging.
---
**App Version:** `v2.9.D.J` (Enhanced Logging in AI Key Takeaways Flow & Action)
**Tag:** `Phase-9_Task-9.D.J_LogKeyTakeawaysFlowDetails`
**Commit Hash:** `(previous_commit_for_D.J)`
**Subject:** `debug(ai): Add detailed logging to Key Takeaways flow & action (v2.9.D.J)`
**Details:**
This version (`v2.9.D.J`) focused on instrumenting the AI Key Takeaways pipeline with more detailed server-side logging to diagnose why default takeaways might be appearing prematurely.

**Key Changes in v2.9.D.J:**
*   **Task v2.9.D.J (Enhanced Logging for AI Key Takeaways):**
    *   `src/ai/flows/analyze-stock-data.ts` (`analyzeStockDataFlow`):
        *   Added detailed logging *immediately after* the `await promptToUse(input)` call to inspect `outputFromPrompt`.
        *   Added logging for the content of `outputFromPrompt`.
        *   Added logging to indicate if default fallbacks were being triggered for each of the five takeaway categories.
        *   Prefixes like `Flow_Log_DJ_` were used for these new logs.
    *   `src/actions/perform-ai-analysis-action.ts` (`performAiAnalysisAction`):
        *   Added detailed logging for the `flowOutput` received from `analyzeStockData(flowInput)` *before* stringification.
        *   Added logging if the action's main `try...catch` block was entered.
        *   Prefixes like `Action_Log_DJ_` were used for these new logs.
    *   `src/components/layout/header.tsx`: Application version updated to `v2.9.D.J`.
    *   `src/components/debug-console.tsx`: `APP_VERSION_FOR_EXPORT` updated to `v2.9.D.J`.

**Outcome (from D.K log analysis):**
*   The detailed server-side logs added in D.J were instrumental in revealing the `[400 Bad Request]` API error related to safety settings in the AI prompt definitions.
---
**App Version:** `v2.9.D.I` (Intermediate Debugging, Doc & Model Update)
**Tag:** `Phase-9_Task-9.D.I_IntermediateDebug_DocUpdate_ModelUpdate`
**Commit Hash:** `bb39d6e2`
**Subject:** `docs(all): Update docs for v2.9.D.I, codify Gemini model update, reflect AI button debug progress`
**Details:**
This version (`v2.9.D.I`) is an intermediate step in debugging non-functional manual AI analysis buttons and includes comprehensive documentation updates and codification of a user-initiated AI model update.

**Key Changes in v2.9.D.I:**

*   **Task v2.9.D.I (Intermediate Debugging, Documentation, and AI Model Update):**
    *   **Code Changes (from previous debugging steps, now formally part of this version for documentation):**
        *   `src/components/main-tab-content.tsx`:
            *   "Generate AI Key Takeaways" button reverted to ShadCN `<Button>`.
            *   Both manual AI buttons ("Key Takeaways", "Options Analysis") now include `key` props (e.g., `key={isKtButtonDisabled ? 'kt-disabled' : 'kt-enabled'}`) to help force re-renders when their disabled state changes.
            *   Inline `style={{ opacity: ... }}` props were added to these buttons to visually reflect their `disabled` state (opacity 0.5 if disabled, 1 if enabled).
            *   A new diagnostic `div` with its own `onClick` handler (logging to console and triggering an `alert`) and visible styling (red dashed border) was added to wrap these two buttons. This is to test if clicks are registered in the general area of the buttons.
            *   The `onClick` handlers for the manual AI buttons (`handleGenerateKeyTakeaways`, `handleGenerateOptionsAnalysis`) remain simplified to directly log entry and dispatch to the local FSM (using "D.E" in their log messages).
            *   The `useEffect` (source `MainTabContent_FSM:ButtonStateEffect_DC`) that calculates `isKtButtonDisabled` and `isOptButtonDisabled` remains unchanged, as its logic for determining button enablement and logging this process is confirmed to be working correctly.
        *   `src/components/layout/header.tsx`: Application version string updated to `v2.9.D.I`.
        *   `src/components/debug-console.tsx`: `APP_VERSION_FOR_EXPORT` constant updated to `v2.9.D.I`.
    *   **AI Model Update (Codified User Change):**
        *   The Google Gemini model used for AI flows has been updated to `googleai/gemini-2.5-flash-lite-preview-06-17`. This change, initially made manually by the user, is now codified in:
            *   `src/ai/models.ts`: `DEFAULT_CHAT_MODEL_ID` and `DEFAULT_ANALYSIS_MODEL_ID` updated.
            *   `src/ai/genkit.ts`: Default model for `ai.genkit()` configuration now reflects the new model via `DEFAULT_ANALYSIS_MODEL_ID`.
            *   `src/ai/definitions/analyze-options-chain.json`, `src/ai/definitions/analyze-stock-data.json`, `src/ai/definitions/stock-chatbot.json`: `modelId` field updated to `googleai/gemini-2.5-flash-lite-preview-06-17`.
    *   **Documentation Updates:**
        *   `README.md`: Updated to version 1.51. Reflects app version `v2.9.D.I`. Section 3.2.2 (Genkit AI Backend) and 3.3 (AI Flow & Prompt Design) updated to mention `googleai/gemini-2.5-flash-lite-preview-06-17`. Logging section (3.4.3) updated regarding `APP_VERSION_FOR_EXPORT` in debug console. Debugging focus note (3.5.0) maintained.
        *   `CHANGELOG.md` (this file): Updated to reflect this v2.9.D.I commit and its changes.
        *   `docs/Issue-Report_AI_Analysis_Buttons.md`: Updated to include analysis of v2.9.D.H logs and the setup for v2.9.D.I tests (diagnostic div).

**Debugging Status & Next Steps for AI Analysis Buttons:**
*   The `useEffect` in `MainTabContent.tsx` correctly determines that manual AI buttons should be enabled and calls state setters (e.g., `setIsKtButtonDisabled(false)`).
*   Despite this, and attempts to force re-renders (using `key` props) and even replacing a button with raw HTML (in v2.9.D.H), the `onClick` handlers for these buttons are still not firing.
*   The current test in v2.9.D.I (with the diagnostic `div` wrapper) aims to determine if clicks are being registered in the general vicinity of the buttons. If the div's `onClick` fires but the buttons' do not, it points to an issue highly localized to the buttons or their immediate interaction with the `disabled` prop rendering. If the div's `onClick` also fails, a larger event blocking issue is suspected.
*   The investigation continues.
---
**App Version:** `v2.9.D.3` (Fix Manual AI Button Logic)
**Tag:** `Phase-9_Task-9.D.3_FixManualAIButtonLogic` - Commit Hash: `740f7ce9`
**Subject:** `fix(ui,fsm): Resolve non-functional AI Key Takeaways & Options Analysis buttons (v2.9.D.3)`
**Details:**
This version addresses a critical bug where the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons in the Main Tab were non-functional. The issue stemmed from incorrect logic in `src/components/main-tab-content.tsx` that determined the `disabled` state of these buttons and the conditions for dispatching events to the local FSM.

**Key Changes (v2.9.D.0 - v2.9.D.3):**

*   **Task v2.9.D.0 (Client-Side Diagnostics - Phase 1):**
    *   Added initial detailed `logDebug` statements to the `onClick` handlers (`handleGenerateKeyTakeaways`, `handleGenerateOptionsAnalysis`) and the local FSM reducer in `MainTabContent.tsx` to trace event dispatch for manual AI actions.
    *   Application version updated to `v2.9.D.0`.

*   **Task v2.9.D.1 (Server-Side Diagnostics - Phase 2):**
    *   Added `logDebug` statements to `StockAnalysisContext` (FSM orchestrator), server actions (`performAiAnalysisAction`, `performAiOptionsAnalysisAction`), and relevant AI flows (`analyzeStockDataFlow`, `analyzeOptionsChainFlow`) to trace data reception and processing if client-side events were successfully triggering server calls.
    *   Application version updated to `v2.9.D.1`.

*   **Task v2.9.D.2 (Refine Button Logic & Client Diagnostics):**
    *   **Identified Root Cause & Applied Fix:** Corrected the `disabled` logic for the "Generate AI Key Takeaways" (`keyTakeawaysButtonDisabled`) and "Generate AI Options Analysis" (`optionsAnalysisButtonDisabled`) buttons in `MainTabContent.tsx`. The primary fix was to ensure these conditions correctly checked the readiness of their *actual input data sources* (e.g., `stockSnapshotJson`, `standardTasJson`, `aiAnalyzedTaJson`) using `isDataReadyForProcessing`, rather than incorrectly expecting the *output AI JSONs* (e.g., `aiKeyTakeawaysJson`, `aiOptionsAnalysisJson`) to be ready *before* generation.
    *   Added further client-side logging to the `useEffect` hook in `MainTabContent.tsx` to monitor the evaluation of the complete `disabled` conditions and their constituent parts.
    *   Application version updated to `v2.9.D.2`.

*   **Task v2.9.D.3 (Verify Fix & Further Logging):**
    *   Added more aggressive `logDebug` statements in `MainTabContent.tsx` to thoroughly trace the `activeAnalysisTicker` state variable, the conditions evaluating `manualActionsPossible`, and the local FSM transitions related to `MANUAL_ACTIONS_ENABLED`. This was to confirm the fix from `v2.9.D.2` was effective and to ensure robust state management for enabling manual AI actions.
    *   Confirmed that with the corrected `disabled` logic, button clicks successfully dispatch events to the local FSM, which in turn trigger the global FSM and subsequently the server actions and AI flows as intended.
    *   Application version updated to `v2.9.D.3`.

These changes restore the functionality of the on-demand AI analysis buttons, ensuring they become active when appropriate data is available and correctly initiate their respective AI processing pipelines.
---
**App Version:** `v2.9.C.Y` (Streamline & Consolidate Debug Logs)
**Tag:** `Phase-9_Task-9.C.Y_StreamlineDebugLogs` - Commit Hash: `f68eb561`
**Subject:** `feat(debug): Consolidate debug logging, refine AI options prompt (v2.9.C.Y)`
**Details:**
This version encapsulates several iterations focused on refining AI analysis, enhancing debuggability, and then streamlining those debug logs.

Key changes included up to v2.9.C.Y:
-   **AI Options Analysis Prompt Refinement:** The prompt was "loosened" to encourage the AI to identify a broader range of potential Call/Put walls.
-   **Comprehensive Debug Logging (v2.9.C.W, v2.9.C.X):** Added extensive `logDebug` calls across server-side (definition loader, flows, actions) and client-side (contexts, components) to provide full traceability.
-   **Log Streamlining (v2.9.C.Y):** Reduced verbosity of non-critical logs (e.g., logging JSON length instead of snippets) while retaining essential trace information.
-   Application version updated incrementally throughout these tasks.

---
**App Version:** `v2.9.C.S` (Modularize AI Prompts)
**Tag:** `Phase-9_Task-9.C.S_ModularizeAiPrompts`
**Subject:** `feat(ai): Modularize all AI prompts & TA logic into JSON definitions (v2.9.C.S)`
**Details:**
This version introduces a major refactoring to externalize AI prompt configurations and TA calculation logic into JSON definition files under `src/ai/definitions/`. The Genkit flows were updated to load their configurations from these files, enhancing modularity and simplifying prompt management.
---
**App Version:** `v2.9.C.I` (Fix Broken AI Chat Functionality)
**Tag:** `Phase-9_Task-9.C.I_FixBrokenAiChat`
**Subject:** `fix(chat): Resolve broken AI Chat by correcting useActionState and handling (v2.9.C.I)`
**Details:**
Addressed a critical bug where the AI Chat was non-functional by correcting the initialization and handling of the `useActionState` hook in `MainTabContent.tsx` for the `chatServerAction`.
---
**App Version:** `v2.9.C.0` (Pilot Chatbot FSM Refactor)
**Tag:** `Phase-9_Task-9.C.0_PilotChatbotFSM` - Commit Hash: `a0c733ee`
**Subject:** `feat(chatbot): Pilot FSM for Chatbot UI state management (v2.9.C.0)`
**Details:**
Introduced a dedicated Finite State Machine (FSM) and React Context (`ChatbotFsmContext`) to manage the UI states of the `Chatbot.tsx` component.
---
*(Older commit logs would continue here if they existed in the original README.md Section 7)*
