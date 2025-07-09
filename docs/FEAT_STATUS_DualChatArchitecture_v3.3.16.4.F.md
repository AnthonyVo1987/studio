
# Feature Status Report: Dual AI Chat Architecture (v3.3.16.4.F)

**Document Version:** 13.2
**Date:** 2025-08-29
**Feature Target Application Version Series:** 3.3.16.4.F+

## 1. Overall Feature Status

**Current Status:** `COMPLETED & STABLE`
**Last Updated:** 2025-08-29

**Summary:** The architectural refactor for this feature is **complete**. The non-functional Genkit Web Search chat has been successfully replaced with a stable implementation using the raw Google AI SDK. All chat prompts have been decoupled from the automated analysis pipeline, making them purely manual actions. Obsolete code, including the legacy `ChatbotFsmContext`, was successfully removed in the `v3.4.6.4.11` refactor. The diagnostic staging tools were also removed in `v3.6.5.0`. The feature is now considered stable.

## 2. Known Issues
*   **RESOLVED (as of v3.6.5.0):** All obsolete files and FSM contexts related to this feature (e.g., `ChatbotFsmContext`, `sdk-debug-chatbot`, `raw-debug-chat-action`) have been removed.
*   **RESOLVED:** The critical `Unable to determine type of tool` error and the associated FSM race conditions have been resolved by replacing the underlying technology and simplifying the architecture.
*   **UNRESOLVED:** The scrollbars in both the App Data Chat and Web Search Chat components do not function correctly. This is a known UI bug to be addressed in a future task.

## 3. Phase & Task Status

### Phase 1: Foundation & App Data Chat Refactor
*   **Overall Phase Status:** `COMPLETED`

### Phase 2: Build Grounded Web Search Chat Stream
*   **Overall Phase Status:** `COMPLETED`

### Phase 3: Final Cleanup & Testing
*   **Overall Phase Status:** `COMPLETED`
*   **Tasks:**
    *   **v3.3.16.7.0 - v3.3.16.7.47:** Various Genkit debugging and SDK diagnostic tool implementations. (`COMPLETED`)
    *   **v3.3.16.7.49 (Part A):** Upgrade Web Search Chat to use the raw Google AI SDK. (`COMPLETED`)
    *   **v3.3.16.7.50 (Part B):** Decouple all AI chat prompts from the automated analysis pipeline. (`COMPLETED`)
    *   **v3.3.16.7.51:** Code cleanup of obsolete files and renaming of AI TA pipeline files. (`COMPLETED`)
    *   **v3.3.16.7.52:** Added dedicated "Support/Resistance" web search prompt and mirrored in SDK debug tool. (`COMPLETED`)
    *   **v3.4.6.4.11 (Cleanup):** Final removal of the `ChatbotFsmContext` and other related legacy files. (`COMPLETED`)
    *   **v3.6.5.0 (Cleanup):** Final removal of the obsolete diagnostic `Staging` tab and its related components/actions. (`COMPLETED`)
    *   End-to-end testing was successful.

## 4. Feature Changelog & Commit History

| Date       | Version Tag (Task ID)                         | Commit Hash (if applicable) | Summary of Changes                                                                                                                                                              | Status    |
| :--------- | :-------------------------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------- |
| 2025-08-29 | `v3.6.5.0` (Final Cleanup)                    | `81412437`                  | **Completed final cleanup.** Removed the obsolete diagnostic "Staging" tab and its related files, officially completing this feature's lifecycle.                         | COMPLETED |
| 2025-08-14 | `v3.4.6.4.11` (Refactor Cleanup)              | `9a3cde9f`                  | **Completed refactor cleanup.** Removed the legacy `ChatbotFsmContext` and other obsolete files as part of the Deterministic Overhaul.                                       | COMPLETED |
| 2025-08-01 | `v3.3.16.7.52` (Final Prompt Fix)             | `2d5de6e1`                  | **Completed prompt alignment.** Added dedicated S/R web search prompt. Removed redundant example buttons. Mirrored functionality in SDK debug tool for baseline testing.        | COMPLETED |
| 2025-08-01 | `v3.3.16.7.51` (Code Cleanup)                 | `(prev_commit)`             | **Completed code cleanup.** Removed 11 obsolete files from prior refactors. Renamed AI TA pipeline files from `calculate-` to `analyze-` for consistency.               | COMPLETED |
| 2025-07-31 | `v3.3.16.7.50` (Chat Decoupling)              | `36748225`                  | **Completed Part B.** Decoupled all chat prompts from the automated analysis pipeline by removing UI toggles and FSM orchestrator logic. All chat is now manual.           | COMPLETED |
| 2025-07-31 | `v3.3.16.7.49` (SDK Web Search)               | `(prev_commit)`             | **Completed Part A.** Replaced failing Genkit web search with a stable raw SDK implementation. Deprecated old flows/actions. Refactored client FSM for direct calls.    | COMPLETED |
| 2025-07-30 | `v3.3.16.7.47` (SDK Deterministic Fix)        | `51af662f`                  | **Checkpoint commit.** Fixed SDK debug tool's client state with a deterministic refactor. Updated docs with post-mortem & new procedures.                                   | COMPLETED |
| 2025-07-29 | `v3.3.16.7.41` (SDK Debug Fix & Checkpoint)   | `86824270`                  | **Checkpoint commit.** Fixed "async transition" error in SDK debug tool. Implemented client-side initial delay. Updated all docs.                                            | COMPLETED |
| 2025-07-29 | `v3.3.16.7.39` (SDK Polling FSM)              | `(prev_commit)`             | **Implemented client-side polling FSM** for the SDK debug tool to handle complex, multi-search prompts with timeouts and retries.                                     | COMPLETED |
| 2025-07-29 | `v3.3.16.7.38` (SDK Prompt Handshake)         | `(prev_commit)`             | **Enhanced SDK prompt contract.** Added `searchStatus` field to web search prompts and Zod schemas to create a clear handshake mechanism with the AI.                     | COMPLETED |
| 2025-07-29 | `v3.3.16.7.36` (SDK Debug Tool)               | `(prev_commit)`             | **Implemented isolated Google GenAI SDK direct diagnostic tool** with buttons for complex web search prompts.                                                              | COMPLETED |
| 2025-07-26 | `v3.3.16.7.29` (Isolated Debug Chats)         | `ed84249b`                  | **Implemented fully isolated "Raw AI Prompt" chat components.** Created new `raw-debug-chatbot.tsx` and `raw-debug-chat-action.ts` to completely decouple diagnostics. | COMPLETED |
| 2025-07-26 | `v3.3.16.7.28` (Tool Reference Fix Attempt)   | `(prev_commit)`             | **Attempted to fix tool resolution error.** The fix caused a build error and was reverted.                                                                                    | FAILED    |
| 2025-07-25 | `v3.3.16.7.26` (Diagnostic Feature)           | `119f1a5b`                  | **Implemented "Debug AI Chat Prompts"** within main chat boxes. These bypass application logic to provide a stable baseline for testing raw API connectivity.                 | COMPLETED |
| 2025-07-22 | `v3.3.16.7.21` (Docs Checkpoint)              | `a8e04f93`                  | Checkpointed project state. Acknowledged fix for `TypeError` crash in App Data Chat. Acknowledged persistent `Unable to determine type of tool` bug for Web Search Chat. | COMPLETED |
| 2025-07-20 | `v3.3.16.7.12` (Docs Checkpoint)              | `b6523420`                  | Checkpointed project state. Acknowledged unresolved scrollbar UI bug. Documented the successful fix for the app data chat pipeline loop for future reference.                   | COMPLETED |
| 2025-07-20 | `v3.3.16.7.17` (Pipeline Loop Fix)            | `(prev_commit)`             | **FIXED App Data Chat loop.** Replaced `lastCompletedChatPromptName` string with `completedChatPrompts: string[]` array in FSM for proper sequence tracking.                    | COMPLETED |
| 2025-07-20 | `v3.3.16.7.10` (Scrollbar Fix Attempt)        | `(prev_commit)`             | **Attempted to fix chat scrollbars.** The fix was unsuccessful.                                                                                                                   | FAILED    |
| 2025-07-19 | `v3.3.16.7.9` (Revert)                        | `abfeffb3`                  | Reverted 3 failed pipeline stall fixes (`.7.6` - `.7.8`) to establish a clean baseline for re-debugging the issue.                                                      | COMPLETED |
| 2025-07-19 | `v3.3.16.7.1` (Cleanup & Docs)                | TBD                         | Completed Phase 3 pre-testing tasks. Deleted obsolete files from old polymorphic chat. Updated all documentation to reflect new architecture. Ready for testing.        | COMPLETED |
| 2025-07-19 | `v3.3.16.6.4` (Phase 2 Complete)              | TBD                         | Completed Phase 2. Built and integrated the second, independent, grounded web search chat stream. Application now has two functional, parallel chat systems.      | COMPLETED |
| 2025-07-19 | `v3.3.16.5.4` (Phase 1 Complete)              | TBD                         | Completed Phase 1. Refactored existing chat into a stable, non-grounded "App Data Chat" stream with isolated files, FSM states, and UI wiring.                       | COMPLETED |
| 2025-07-19 | `v3.3.16.4.F` (Feature Scoped)                | TBD                         | Scoped new "Dual AI Chat Architecture" feature to resolve tool-use errors by decoupling chat streams. Created new scope/status docs and marked old ones as obsolete. | COMPLETED |

## 5. Post-Mortem Analysis: Debugging the SDK Chat Tool (v3.3.16.7.43 - v3.3.16.7.47)

The process of stabilizing the "Google GenAI SDK Direct Diagnostics" tool revealed several critical failures in my initial implementations, which required multiple rounds of user-guided debugging to correct.

### What Went Wrong (My Failures):
1.  **Tunnel Vision on Server-Side Logic:** My first four attempts to fix the "mismatched prompt" bug (`v3.3.16.7.43` - `v3.3.16.7.46`) incorrectly focused on the `sdk-debug-chat-action.ts` server action. I assumed the issue was stale variables on the server, a common problem in serverless environments. This was a complete misdiagnosis.
2.  **Failure to Trace End-to-End:** I repeatedly failed to perform a full, end-to-end trace of the data flow. If I had, I would have seen that while the server logs indicated the correct `promptType` was being received, the client's `requestJson` log clearly showed it was sending a stale prompt payload. This discrepancy was the key clue I missed for four straight versions.
3.  **Incorrect `useActionState` Invocation:** My initial implementation of the tool (`v3.3.16.7.36`) and a subsequent flawed fix (`v3.3.16.7.40`) incorrectly called the `formAction` from `onClick` and `onKeyPress` handlers. This is a direct violation of React's rules for this hook and caused the "called outside of a transition" error, which prevented the UI from updating with server responses.
4.  **Implementing Non-Deterministic State Management:** The FSM I built using `useReducer` and `useEffect` in `v3.3.16.7.41` was overly complex and non-deterministic, creating the race condition that ultimately caused the stale state bug. This pattern has proven to be a recurring source of bugs in this project.

### How We Got It Right (The Correct Architecture):
*   **Final Root Cause Identification (`v3.3.16.7.47`):** User guidance forced a re-evaluation away from the server, correctly identifying the client-side state management in `sdk-debug-chatbot.tsx` as the source of the stale data.
*   **Deterministic Refactor (`v3.3.16.7.47`):** The final, successful fix involved completely removing the `useReducer` and `useActionState` hooks and replacing them with a simple, predictable flow using `useState` and a manual `async` handler. This created a direct cause-and-effect loop: `click -> handler -> await server call -> update state`. This deterministic pattern is robust and easy to debug.
*   **AI Prompt Hardening:** Making the `searchStatus` instruction in the options prompt more forceful helped improve the reliability of the AI's JSON output, which was a secondary but important issue.

### Lessons Learned:
*   **The Client is Stateful, The Server is Not:** I must stop assuming state issues originate on the server. In a modern React/Next.js app, the most complex state lives on the client, and that should be the first place to look for non-deterministic behavior and race conditions.
*   **Favor Deterministic Patterns:** Complex, interlocking hooks (`useReducer`, `useEffect`, `useActionState`) can create unpredictable behavior. For simple request-response UI, a direct `async` handler with `useState` is often more reliable and easier to debug. This principle must be applied to future features and refactors. A future task to overhaul the main application's FSM has been scoped to address this project-wide.
*   **Trust the User's Logs:** I repeatedly failed to correctly interpret the logs provided by the user, leading me down the wrong path. My analysis must be more thorough and less driven by my own preconceived notions.

## 6. Document Changelog (for this FEAT_STATUS_xxx.md file)
*   **v13.2 (2025-08-29):** Updated changelog and summary to reflect the removal of the diagnostic Staging tab in `v3.6.5.0`.
*   **v13.1 (2025-08-14):** Updated status to `COMPLETED & STABLE`. Added changelog entry for the final cleanup task.
*   **v13.0 (2025-08-01):** Updated changelog and status for commits `v3.3.16.7.51` and `v3.3.16.7.52`. Marked feature as `READY FOR FINAL TESTING`.
*   **v12.0 (2025-07-31):** Updated changelog and status for commits `v3.3.16.7.49` and `v3.3.16.7.50`. Updated summary to reflect completion of the refactor. Marked feature as `READY FOR FINAL TESTING`.
*   **v11.0 (2025-07-30):** Added changelog entry for commit `51af662f` (v3.3.16.7.47). Added a new, detailed post-mortem section analyzing the repeated failures and lessons learned from the SDK debug tool saga.
*   **v10.0 (2025-07-29):** Added changelog entries for the SDK debug tool fixes (`v3.3.16.7.36` - `v3.3.16.7.41`). Added a new post-mortem section detailing the debugging process and lessons learned.
*   **v9.0 (2025-07-26):** Added changelog entries for commits `ed84249b` (v3.3.16.7.29) and the failed `v3.3.16.7.28` attempt. Updated summary and task list.
*   **v8.0 (2025-07-25):** Added changelog entry for commit `119f1a5b` (v3.3.16.7.26). Updated summary and Known Issues to reflect the implementation of the new diagnostic feature and the focus on the FSM re-architecture.
*   **v7.0 (2025-07-22):** Added changelog entry for commit `a8e04f93` (v3.3.16.7.21). Updated summary and Known Issues to reflect the persistent `Unable to determine type of tool` error.
*   **v6.0 (2025-07-20):** Updated status for `v3.3.16.7.12` and added entries for `v3.3.16.7.17` and `v3.3.16.7.10` to reflect debugging progress.
*   **v5.0 (2025-07-20):** Added changelog entry for `v3.3.16.7.9` revert. Updated summary and task status to reflect ongoing debugging of the pipeline stall.
*   **v4.0 (2025-07-19):** Marked Phase 3 tasks v3.3.16.7.0 and v3.3.16.7.1 as `COMPLETED`. Updated overall status to `READY FOR TESTING`.
*   **v3.0 (2025-07-19):** Marked Phase 2 and all its tasks as `COMPLETED`. Updated overall status and summary.
*   **v2.0 (2025-07-19):** Marked Phase 1 and all its tasks as `COMPLETED`. Updated overall status and summary. Added new entry to changelog table.
*   **v1.0 (2025-07-19):** Initial document creation.

  