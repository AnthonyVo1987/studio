# StockSage Change History

## Changelog (CHANGELOG.md)
*   **Version 1.50 (Task v2.9.C.0):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.50) with version `v2.9.C.0` after Chatbot FSM pilot. Added new Task 9.C.0 to Phased Plan. Updated AI operational rules for XML output (Section 0.5).
*   **Version 1.1 (Task v2.9.B.9):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Updated `README.md` (to v1.49) with new AI operational rules (XML output, token efficiency, immediate coding post-approval).
*   **Version 1.0 (Task v2.9.B.4):** 2025-06-15 - Firebase Studio (AI Prototyper)
    *   Created `CHANGELOG.md` to decouple detailed changelogs from `README.md`.
    *   Migrated "StockSage Application Commit Log" from `README.md`.
    *   This section will track changes to `CHANGELOG.md` itself. Future updates to the application commit log will be prepended to the section below.

---
## StockSage Application Commit Log (v2.x.y.z)

This section tracks the commit history of the StockSage application, with versions corresponding to the `2.x.y.z` scheme. Latest commits are at the top.

---
**App Version:** `v2.9.C.Y` (Streamline & Consolidate Debug Logs)
**Tag:** `Phase-9_Task-9.C.Y_StreamlineDebugLogs` - Commit Hash: `f68eb561`
**Subject:** `feat(debug): Consolidate debug logging, refine AI options prompt (v2.9.C.Y)`
**Details:**
This version encapsulates several iterations focused on refining AI analysis, enhancing debuggability, and then streamlining those debug logs.

**Key Changes from v2.9.C.U to v2.9.C.Y:**

*   **Task v2.9.C.U (AI Key Takeaways & Options Analysis Refinement):**
    *   `src/ai/flows/analyze-stock-data.ts`: Further improved default/error object return for all five AI key takeaway categories to ensure a well-structured response even on AI generation failure.
    *   `src/ai/definitions/analyze-options-chain.json`: Continued to loosen the prompt for AI options analysis, aiming for more wall identification by emphasizing "noteworthy OI" and relative significance.
    *   Application version updated to `v2.9.C.U`.

*   **Task v2.9.C.V (AI Options - Enforce Min/Max Walls in Prompt):**
    *   `src/ai/definitions/analyze-options-chain.json`: Prompt significantly updated to explicitly request "AT LEAST 1 Call Wall and AT LEAST 1 Put Wall if any reasonable candidates exist," up to a maximum of 3. Instructions were made more insistent for the AI to make every effort to find walls, even if significance is moderate.
    *   `src/ai/flows/analyze-options-chain-flow.ts`: The flow logic continues to respect the AI's output; the emphasis for improvement was placed on the prompt's direct instructions.
    *   Application version updated to `v2.9.C.V`.

*   **Task v2.9.C.W (FEAT - Additional Debug Trace Logging - Phase 1: Server-Side):**
    *   `src/ai/definition-loader.ts`: Added detailed logging for definition loading, validation, and prompt string building processes.
    *   `src/ai/flows/*.ts` (all AI flows): Implemented comprehensive logging for flow entry, input parameters, prompt execution details (model, prompt snippets), output summaries, and detailed error capture.
    *   `src/actions/*.ts` (all server actions): Added extensive logging for action entry, payload validation, calls to AI flows, flow output handling, and detailed error capture.
    *   Resolved syntax errors in `src/ai/definition-loader.ts` (removed `'use server';`) and in `src/ai/flows/*.ts` (misplaced `console.log` statements within `ai.definePrompt` object definitions).
    *   Application version updated to `v2.9.C.W`.

*   **Task v2.9.C.X (FEAT - Additional Debug Trace Logging - Phase 2: Client-Side):**
    *   `src/contexts/stock-analysis-context.tsx`: Added detailed logging for Global FSM transitions, action result handling, and key state setters.
    *   `src/contexts/chatbot-fsm-context.tsx` & `src/contexts/debug-console-fsm-context.tsx`: Implemented logging for local FSM events and transitions.
    *   `src/components/main-tab-content.tsx`: Added logging for its internal local FSM and user interactions triggering analysis pipelines.
    *   Primary display components (e.g., `AiKeyTakeawaysDisplay`, `OptionsChainTable`, etc.): Added logging for incoming JSON props (status/length), parsed data summaries, and user actions like export/copy.
    *   `src/components/chatbot.tsx`, `src/components/debug-console.tsx`: Enhanced UI interaction logging.
    *   `src/lib/debug-log-types.ts`: Log source IDs and labels reviewed; existing toggles cover the new client-side log points.
    *   Application version updated to `v2.9.C.X`.

*   **Task v2.9.C.Y (FEAT - Streamline & Consolidate Older Debug Logs):**
    *   **Client-Side Display Components:** Reduced verbosity of initial JSON prop logging (now logs length/status instead of snippets). Summarized logging for large parsed data objects (e.g., Object.keys or item counts).
    *   `src/services/data-sources/adapters/polygon-adapter.ts`: Removed redundant cache-bust timestamp logging from individual TA API call logs (RSI, EMA, SMA).
    *   Critical logs in contexts (FSM, actions, flows), definition loader, and `MainTabContent` local FSM were reviewed and confirmed to be essential and retained.
    *   Application version updated to `v2.9.C.Y`.

These changes aim to improve the robustness of AI outputs, significantly enhance the debuggability of both server-side and client-side operations, and then refine the logging to reduce noise while maintaining critical trace information.
---
**App Version:** `v2.9.C.T` (Fix Takeaways Error, Refine Options Prompt)
**Tag:** `Phase-9_Task-9.C.T_FixTakeawaysLoosenOptionsPrompt` - Commit Hash: `(placeholder_for_C.T_commit)`
**Subject:** `fix(ai): Improve AI Takeaways error handling, loosen Options prompt (v2.9.C.T)`
**Details:**
This version focuses on two main areas:
1.  **AI Key Takeaways Error Handling (`src/ai/flows/analyze-stock-data.ts`):**
    *   Enhanced the `analyzeStockDataFlow` to provide more robust default/error takeaways for all five categories (priceAction, trend, volatility, momentum, patterns) if the AI prompt fails or returns incomplete/empty data for any category. This ensures the UI (`AiKeyTakeawaysDisplay.tsx`) always receives a well-structured object, preventing parsing errors when displaying error states.
    *   The default message for missing volatility takeaways was also refined.
2.  **AI Options Analysis Prompt Refinement (`src/ai/definitions/analyze-options-chain.json`):**
    *   The prompt was "loosened" to encourage the AI to identify a broader range of potential Call/Put walls. Instructions were changed to focus on "noteworthy Open Interest (OI)" relative to surroundings or the overall chain, with Volume as a secondary confirming factor, rather than strictly "High and/or Clustered Concentrations."
    *   The AI is still asked to return AT MOST 3 walls per type, ordered by perceived significance, even if that significance is now considered more moderate.
    *   This change aims to address the issue where the AI frequently returned no walls, even when some significant OI levels might have been present. The display component will continue to show "No significant walls identified by AI" if the flow successfully returns empty arrays.

- Application version updated to `v2.9.C.T` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect the new version, task completion, and these refinements.
---
**App Version:** `v2.9.C.S` (Modularize AI Prompts)
**Tag:** `Phase-9_Task-9.C.S_ModularizeAiPrompts` - Commit Hash: `(placeholder_for_C.S_commit)`
**Subject:** `feat(ai): Modularize all AI prompts & TA logic into JSON definitions (v2.9.C.S)`
**Details:**
This version introduces a major refactoring to externalize AI prompt configurations and the TA calculation logic into JSON definition files.
- Created a new directory `src/ai/definitions/` to store all JSON definition files.
- Implemented `src/ai/definition-loader.ts` with `LlmPromptDefinitionSchema`, `CalculationLogicDefinitionSchema`, and a `GenericDefinitionSchema` union.
    - `loadDefinition` function loads and validates these JSONs.
    - `buildPromptStringFromLlmDefinition` helper constructs prompt strings for LLM flows.
- Created JSON definition files:
    - `analyze-stock-data.json` (LLM Prompt)
    - `analyze-options-chain.json` (LLM Prompt)
    - `stock-chatbot.json` (LLM Prompt)
    - `analyze-ta-indicators.json` (Calculation Logic for pivot points)
    - `example-chat-prompts.json` (Simple array, moved to this directory)
- Updated Genkit flows (`analyze-stock-data.ts`, `analyze-options-chain-flow.ts`, `chat-flow.ts`, `analyze-ta-flow.ts`) to load their configurations/prompts from these JSON files using `definition-loader.ts`.
- `Chatbot.tsx` now loads example prompts from the new JSON file location.
- Application version updated to `v2.9.C.S`. `README.md` and `CHANGELOG.md` updated.
This enhances modularity, simplifies prompt management, and prepares the TA flow for future, more complex, definition-driven calculations.
---
**App Version:** `v2.9.C.R` (Simplify AI Options Analysis)
**Tag:** `Phase-9_Task-9.C.R_SimplifyOptionsAnalysis` - Commit Hash: `91dab923`
**Subject:** `refactor(options): Simplify AI Options Analysis prompt and output (v2.9.C.R)`
**Details:**
This version significantly simplifies the AI Analyzed Options Chain feature, moving away from a complex adaptive algorithm back to a more straightforward approach for identifying Call and Put walls. The primary goal was to improve reliability and make it easier for the AI to consistently identify significant option concentrations based on Open Interest (OI) and/or Volume.

Key changes included in v2.9.C.R:
- **Schema Update (`src/ai/schemas/ai-options-analysis-schemas.ts`):**
    - `WallDetailSchema`: Removed the `wallScore` field. Added an optional `volume` field to capture volume if it's a key factor in identifying a wall.
    - `AiOptionsAnalysisOutputSchema`: Removed `liquidityTier` and `analysisMethodology` fields, as they were tied to the previous complex algorithm. The schema continues to allow for up to 3 `callWalls` and 3 `putWalls`.
- **Prompt Revision (`src/ai/flows/analyze-options-chain-flow.ts` -> `src/ai/definitions/analyze-options-chain.json` post v2.9.C.S):**
    - The `analyzeOptionsChainPrompt` was completely rewritten to be much simpler. It now instructs the AI to identify up to 3 Call/Put walls based on "High and/or Clustered Concentrations of Open Interest (OI) and/or Volume," ordering them by perceived significance. It also explicitly requests the inclusion of `volume` in the output if it's a key factor.
    - The `analyzeOptionsChainFlow` function maintains its pre-check for insufficient input data and robust error handling, returning `{ callWalls: [], putWalls: [] }` on failure or if no walls are identified.
- **Display Component Update (`src/components/ai-options-analysis-display.tsx`):**
    - The table rendering logic was updated to remove the "Wall Score" column and add an optional "Volume" column, formatted using `formatCompactNumber`.
    - Removed display elements related to `liquidityTier` and `analysisMethodology`.
- Application version updated to `v2.9.C.R` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect the new version, task completion, and the simplification of the AI options analysis.

This refactor aims to provide more consistent and understandable AI-driven options analysis. The ability of the AI to *identify* significant walls consistently is still an area for future refinement.
---
**App Version:** `v2.9.C.Q` (Adaptive AI Options Analysis)
**Tag:** `Phase-9_Task-9.C.Q_AdaptiveOptionsAnalysis` - Commit Hash: `(previous_commit_for_C.Q)`
**Subject:** `feat(options): Implement Adaptive Call/Put Wall Detection algorithm (v2.9.C.Q)`
**Details:**
This version introduces a more sophisticated "Adaptive Call/Put Wall Detection" algorithm for the AI Options Analysis feature. The goal is to provide a more nuanced identification of significant option walls by considering liquidity tiers and relative OI normalization.

Key changes included in v2.9.C.Q:
- **Schema Update (`src/ai/schemas/ai-options-analysis-schemas.ts`):**
    - `WallDetailSchema`: Added `wallScore` (optional number).
    - `AiOptionsAnalysisOutputSchema`: Added `liquidityTier` (optional enum: Low, Medium, High, NotApplicable) and `analysisMethodology` (optional string).
- **Prompt Revision (`src/ai/flows/analyze-options-chain-flow.ts` -> `src/ai/definitions/analyze-options-chain.json` post v2.9.C.S):**
    - `analyzeOptionsChainPrompt` updated to guide the LLM through a chain-of-thought process:
        - Parse options data, classify liquidity tier (Low <1000 avg OI, Medium 1000-4000, High >4000).
        - Normalize OI using Z-scores.
        - Detect local OI spikes (ratio to ±2 strike local average).
        - Apply tier-based thresholds for OI, Z_OI, and local_ratio to flag walls.
        - Optionally confirm with volume.
        - Output includes walls (with `wallScore`), `liquidityTier`, and `analysisMethodology`.
    - `analyzeOptionsChainFlow` retains pre-checks and error handling, returning a structured empty/error object.
- **Display Component Update (`src/components/ai-options-analysis-display.tsx`):**
    - Updated to render the new `wallScore` in the tables.
    - Added display for `liquidityTier` and `analysisMethodology`.
- Application version updated to `v2.9.C.Q`.
---
**App Version:** `v2.9.C.P` (Fix AI Options Display Logic)
**Tag:** `Phase-9_Task-9.C.P_FixOptionsDisplayLogic` - Commit Hash: `79e7cf4c`
**Subject:** `fix(options): Refactor AI Options Display logic & intermediate save (v2.9.C.P)`
**Details:**
This version addresses an issue in the AI Options Analysis display where it incorrectly showed "AI Options Analysis data not available" even when the AI flow successfully returned an empty set of walls (i.e., no significant walls were identified). The primary focus was to improve the robustness of the display component's rendering logic.

Key changes included in v2.9.C.P:
- **`src/components/ai-options-analysis-display.tsx`:**
    - The conditional rendering logic within the component was refactored to more clearly distinguish between various states:
        - **Loading:** Skeletons are displayed.
        - **Error:** A specific error message (from the server/flow or due to parsing issues) is shown.
        - **Successfully Parsed Data:**
            - If `parsedSuccessfullyData` exists and contains actual call or put walls, the accordion and tables are rendered.
            - If `parsedSuccessfullyData` is valid but both `callWalls` and `putWalls` are empty arrays (indicating the AI found no significant walls according to its criteria), a message "No significant walls identified by AI." is now correctly displayed.
        - **Initial/Unavailable:** If `aiOptionsAnalysisJson` is null, genuinely empty (`{}`), or represents an initial state before any relevant analysis, a message like "AI Options Analysis data not available" is displayed.
    - This ensures the UI accurately reflects the outcome of the AI options analysis, including valid "no walls found" scenarios.
- **Known Issue (Work In Progress):** The AI Options Analysis flow itself may still not be identifying walls as consistently or robustly as desired in all market conditions or for all tickers. This will be addressed in future iterations.
- Application version updated to `v2.9.C.P` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect the new version and completed task.
---
**App Version:** `v2.9.C.O` (Improve AI Options Wall Detection)
**Tag:** `Phase-9_Task-9.C.O_ImproveOptionsWallDetection` - Commit Hash: `(previous_commit_for_C.O)`
**Subject:** `refactor(options): Simplify AI Options Wall Detection prompt (v2.9.C.O)`
**Details:**
This version addresses the issue where the AI Options Analysis was frequently returning empty walls. The complex "Adaptive Call/Put Wall Detection Template" from v2.9.C.Q was proving too rigid or difficult for the LLM to consistently satisfy, leading to "AI Options Analysis data not available" being shown when the flow correctly returned `{"callWalls": [], "putWalls": []}`.

Key changes included in v2.9.C.O:
- **Prompt Revision (`src/ai/flows/analyze-options-chain-flow.ts` -> `src/ai/definitions/analyze-options-chain.json` post v2.9.C.S):**
    - The `analyzeOptionsChainPrompt` was significantly simplified. It now uses more qualitative guidance, instructing the AI to identify up to 3 Call/Put walls based on "High and/or Clustered Concentrations of Open Interest (OI) and/or Volume," ordered by perceived significance. The complex multi-step algorithm, liquidity tiers, Z-scores, and local ratios were removed from the prompt.
    - The prompt still requests an empty array if no significant walls are found.
- The schema (`src/ai/schemas/ai-options-analysis-schemas.ts`) and display component (`src/components/ai-options-analysis-display.tsx`) were reverted to not expect `wallScore`, `liquidityTier`, or `analysisMethodology` as these were specific to the removed complex algorithm. `volume` (optional) was re-added to `WallDetailSchema`.
- Application version updated to `v2.9.C.O`.
---
**App Version:** `v2.9.C.N` (Fix AI Options Flow/Action Robustness)
**Tag:** `Phase-9_Task-9.C.N_FixOptionsFlowActionRobustness` - Commit Hash: `(previous_commit_for_C.N)`
**Subject:** `fix(options): Improve AI Options flow & server action error handling (v2.9.C.N)`
**Details:**
This version addresses ongoing issues with the AI Analyzed Options Chain, focusing on improving the robustness of the AI flow and server action error handling.
- **`src/ai/flows/analyze-options-chain-flow.ts`:**
    - Implemented a more robust `try...catch` block around the `analyzeOptionsChainPrompt(input)` call (or equivalent if using JSON prompts). On prompt failure, it now logs the error comprehensively and returns a well-formed empty result (`{ callWalls: [], putWalls: [] }`).
    - The pre-check for insufficient input data (e.g., too few contracts) remains.
    - The post-prompt check for valid output structure also remains, ensuring an empty valid structure if the AI's output is malformed.
- **`src/actions/perform-ai-options-analysis-action.ts`:**
    - Simplified the error message construction in the main `catch (error: any)` block. The `detailMsg` for `baseErrorReturn` is now a more generic user-friendly message, reducing the risk of complex error objects breaking JSON stringification for the client.
- Application version updated to `v2.9.C.N`.
---
**App Version:** `v2.9.C.M` (Fix AI Options Flow and Schema)
**Tag:** `Phase-9_Task-9.C.M_FixOptionsFlowSchema` - Commit Hash: `(previous_commit_for_C.M)`
**Subject:** `fix(options): Revert to 3 walls in AI Options Analysis, improve flow robustness (v2.9.C.M)`
**Details:**
This version reverts the AI Options Analysis to allow for up to 3 Call/Put walls (from 1 in v2.9.C.L) and improves flow robustness.
- **`src/ai/schemas/ai-options-analysis-schemas.ts`:** `AiOptionsAnalysisOutputSchema` updated to set `max(3)` for `callWalls` and `putWalls`.
- **`src/ai/flows/analyze-options-chain-flow.ts` (and its JSON prompt post v2.9.C.S):**
    - Prompt (`analyzeOptionsChainPrompt`) updated to request "AT MOST 3" significant walls per type, ordered by significance.
    - Added a pre-check in `analyzeOptionsChainFlow` to return empty walls if `input.optionsChainJson` is unparsable or contains insufficient contracts (less than 3), avoiding an unnecessary LLM call.
    - The flow logic updated to return up to 3 walls per type as provided by the AI, conforming to the updated schema.
- Application version updated to `v2.9.C.M`.
---
**App Version:** `v2.9.C.L` (Refine AI Displays, Chat Formatting & Options Analysis)
**Tag:** `Phase-9_Task-9.C.L_RefineAIDisplaysChatOptions` - Commit Hash: `(previous_commit_for_C.L)`
**Subject:** `fix(ui,ai): Improve AI Takeaways Volatility display, Chat formatting, and limit Options Walls (v2.9.C.L)`
**Details:**
This version addresses several UI display and AI generation issues:
- **AI Key Takeaways Volatility Display (`src/components/ai-key-takeaways-display.tsx`):**
    - Changed text color for "moderate" volatility sentiment to `text-foreground` to ensure readability on light card backgrounds.
- **AI Chat Word Wrap (`src/components/chatbot.tsx`):**
    - Changed `w-max` to `w-full` on the chat message container div for better word wrapping.
- **AI Chat Message Formatting (`src/ai/flows/chat-flow.ts` -> `src/ai/definitions/stock-chatbot.json` post v2.9.C.S):**
    - Updated `stockChatBotPrompt` to explicitly request bullet points and better line spacing in Markdown.
- **AI Analyzed Options Chain (`src/ai/schemas/ai-options-analysis-schemas.ts`, `src/ai/flows/analyze-options-chain-flow.ts` / JSON prompt):**
    - Schema updated to `max(1)` for `callWalls` and `putWalls`.
    - Prompt updated to request the "SINGLE MOST" significant wall per type.
    - Flow logic updated to slice output to ensure only one wall per type is returned.
- Application version updated to `v2.9.C.L`.
---
**App Version:** `v2.9.C.K` (BUG/FEAT - Refine AI Takeaways, Chat Prompt Details, and UI)
**Tag:** `Phase-9_Task-9.C.K_RefineTakeawaysChatUI` - Commit Hash: `(previous_commit_for_C.K)`
**Subject:** `fix(ai,ui): Improve AI Takeaways Volatility, Chat Prompts, and Chat UI (v2.9.C.K)`
**Details:**
- **AI Key Takeaways - Volatility (`src/ai/flows/analyze-stock-data.ts`):**
    - Added a programmatic check in `analyzeStockDataFlow`. If `output.volatility.takeaway` is empty or too short (less than 5 words), it's set to a default placeholder.
- **AI Chat - Word Wrapping (`src/components/chatbot.tsx`):**
    - Added `break-words` class to the chat message `div` for better text wrapping.
- **AI Chat - Example Prompts (`src/ai/schemas/chat-schemas.ts` -> `src/ai/definitions/example-chat-prompts.json` post v2.9.C.S):**
    - Enhanced "Stock Trader's Takeaways" to ask for entry/exit points.
    - Enhanced "Options Trader's Takeaways" to ask for example option trade ideas.
    - Reinforced "Additional 3 Holistic Takeaways" to request three full, distinct takeaways.
- Application version updated to `v2.9.C.K`.
---
**App Version:** `v2.9.C.J` (Deploy to Firebase App Hosting)
**Tag:** `Phase-9_Task-9.C.J_DeployToFirebase` - Commit Hash: `(previous_commit_for_C.J)`
**Subject:** `deploy(hosting): Prepare for and document Firebase App Hosting deployment (v2.9.C.J)`
**Details:**
This version represents a checkpoint for deployment to Firebase App Hosting. Key activities included:
- Final verification of all prior fixes and features up to v2.9.C.I.
- Ensured `.env` is correctly configured (though empty for commit, real values would be in Firebase).
- Updated `apphosting.yaml` with any necessary configurations (though it remained default for this phase).
- Added notes to `README.md` regarding deployment considerations and environment variables.
- Application version updated to `v2.9.C.J` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect this deployment task and version.
---
**App Version:** `v2.9.C.I` (Fix Broken AI Chat Functionality)
**Tag:** `Phase-9_Task-9.C.I_FixBrokenAiChat` - Commit Hash: `fb9041c0`
**Subject:** `fix(chat): Resolve broken AI Chat by correcting useActionState and handling (v2.9.C.I)`
**Details:**
This version addresses a critical bug where the AI Chat was completely non-functional (typing or pressing prompt buttons did nothing). The root cause was an incorrect initialization and handling of the `useActionState` hook in `MainTabContent.tsx` for the `chatServerAction`.

Key changes included in v2.9.C.I:
- **`src/components/main-tab-content.tsx`:**
    - Corrected the initialization of `useActionState` for `chatServerAction`. It now correctly uses the server action function (`chatServerAction`) and a locally defined `initialLocalChatActionState` as arguments.
    - Reinstated and refined the `useEffect` hook that listens to changes in `chatActionState`. This effect now properly:
        - Handles `status: 'success'`: Parses `chatActionState.data.chatbotResponseJson`, creates a `ChatMessage` of role 'model', and adds it to the global chat history via `addChatMessageToGlobalContext`. It includes a check to prevent duplicate model responses.
        - Handles `status: 'error'`: Logs the error and adds an appropriate error message to the chat history.
        - Updates debug JSONs (`chatbotRequestJson`, `chatbotResponseJson`) in both success and error cases.
    - Ensured `chatFormAction` (the dispatcher from `useActionState`) is correctly passed as a prop to `ChatbotFsmProvider`.
    - Ensured `contextChatHistoryRef` is used within the `useEffect` for `chatActionState` to prevent duplicate message dispatches if the effect re-runs.
- Application version updated to `v2.9.C.I` in `src/components/layout/header.tsx`.
- `README.md` and `CHANGELOG.md` updated to reflect the new version and completed task.

These changes restore the AI Chat functionality, allowing users to interact with the chatbot via text input and example prompt buttons.
---
**App Version:** `v2.9.C.H` (Chat/Export UX Fixes & Options Table JSON Export)
**Tag:** `Phase-9_Task-9.C.H_ChatUX-ExportLogic-OptionsJSON` - Commit Hash: `(previous_commit_for_C.H)`
**Subject:** `fix(chat,export): Improve Chat UX, refine export logic, add JSON export to Options Table (v2.9.C.H)`
**Details:**
This version addresses multiple UI/UX issues and adds new export functionality:
- **AI Chat Prompt Button Enhancement (`src/components/chatbot.tsx`):**
    - Clicking an example chat prompt button now immediately submits the prompt. The `handleExamplePromptClick` function was modified to dispatch `USER_INPUT_CHANGED` followed by `SUBMIT_MESSAGE_REQUESTED` to the `ChatbotFsmContext`, which then triggers the form submission logic via its internal effect.
- **Dynamic Combined Data Export/Copy Logic (`src/components/main-tab-content.tsx`):**
    - `getCombinedDataForExport` now dynamically includes `aiKeyTakeaways` and `aiOptionsAnalysis` JSONs only if their respective data is valid and available (checked using `isDataReadyForProcessing`). The base export always includes ticker, market status, stock snapshot, standard TAs, and AI analyzed TA.
    - The "Export All to JSON" and "Copy All to JSON" buttons are now disabled if any core analysis pipeline (automated, manual key takeaways, manual options analysis) is active, preventing data inconsistencies during export/copy.
    - `isAllDataReadyForCombinedExport` (now `isBaseDataReadyForCombinedExport`) was updated to only check the readiness of the base data components for enabling these buttons.
- **Options Chain Table - JSON Export/Copy (`src/components/options-chain-table.tsx`):**
    - Added "Export JSON" and "Copy JSON" buttons to the Options Chain Table card header.
    - Implemented `handleExportOptionsJson` to download the full `parsedData` (options chain data) as a JSON file.
    - Implemented `handleCopyOptionsJson` to copy the `parsedData` as a JSON string to the clipboard.
    - These new buttons are disabled if the options chain data is not ready for export.
- Application version updated to `v2.9.C.H` in `src/components/layout/header.tsx`.
---
**App Version:** `v2.9.C.G` (AI Options Analysis Fix & Simplification, Restore Options Table)
**Tag:** `Phase-9_Task-9.C.G_FixSimplifyAiOptionsRestoreTable` - Commit Hash: `(previous_commit_for_C.G)`
**Subject:** `fix(ai,ui): Simplify AI Options, fix crash & restore Options Table (v2.9.C.G)`
**Details:**
This version addresses a crash in AI Options Analysis, simplifies its output, and ensures the Options Chain Table is consistently rendered.
- **AI Options Analysis Simplification:**
    - **Schema (`src/ai/schemas/ai-options-analysis-schemas.ts`):** `AiOptionsAnalysisOutputSchema` modified to only include `callWalls` and `putWalls`. Removed `callClusters`, `putClusters`, and `analysisSummary`.
    - **Flow (`src/ai/flows/analyze-options-chain-flow.ts` / JSON prompt):**
        - Prompt updated to only request Call/Put Walls (max 3 each). Removed instructions for clusters and summary.
        - Flow now ensures output strictly conforms to the simplified schema, returning `{ callWalls: [], putWalls: [] }` on error or malformed AI response.
        - Explicitly limits walls to max 3 per type.
    - **Server Action (`src/actions/perform-ai-options-analysis-action.ts`):**
        - Expects simplified output from the flow.
        - `baseErrorReturn` updated to provide `{ callWalls: [], putWalls: [] }` in `aiOptionsAnalysisJson` on error.
        - Treats non-conforming flow output as an error.
    - **Display Component (`src/components/ai-options-analysis-display.tsx`):**
        - UI updated to only display Call/Put Walls. Removed cluster and summary rendering.
        - Export/Copy JSON now handles the simplified structure.
- **Options Chain Table Visibility (`src/components/options-chain-table.tsx`):**
    - Reviewed and ensured the component robustly renders its card shell and displays appropriate error/skipped messages if `optionsChainJson` indicates such states, preventing it from disappearing.
- Application version updated to `v2.9.C.G`.
---
**App Version:** `v2.9.C.F` (Fix Header Parsing Error)
**Tag:** `Phase-9_Task-9.C.F_FixHeaderParseError` - Commit Hash: `(previous_commit_for_C.F)`
**Subject:** `fix(ui): Remove extraneous backtick from header.tsx (v2.9.C.F)`
**Details:**
Removed a stray triple backtick (```) from the end of `src/components/layout/header.tsx` that was causing a parsing error and preventing the application from rendering. Application version updated to `v2.9.C.F`.
---
**App Version:** `v2.9.C.E` (Resolve FsmStateDebugCard ReferenceError)
**Tag:** `Phase-9_Task-9.C.E_FixFsmCardRefError` - Commit Hash: `08df82c7`
**Subject:** `fix(ui): Resolve ReferenceError for console states in FsmStateDebugCard (v2.9.C.E)`
**Details:**
This version addresses a `ReferenceError` in `FsmStateDebugCard.tsx` where `isClientDebugConsoleEnabled` and `isClientDebugConsoleOpen` were used without being destructured from the `useStockAnalysis()` hook. The fix ensures these values are correctly obtained from the context, allowing the FSM Debug Card to accurately calculate its position relative to the Client Debug Console. Application version updated to `v2.9.C.E`.
---
**App Version:** `v2.9.C.D` (Fix FSM Debug Card Context Provider Error)
**Tag:** `Phase-9_Task-9.C.D_FixFsmCardContextProvider` - Commit Hash: `(previous_commit_for_C.D)`
**Subject:** `fix(fsm): Resolve ChatbotFSM context error in FsmStateDebugCard & prevent update loops (v2.9.C.D)`
**Details:**
Addressed an error where `FsmStateDebugCard` attempted to use `useChatbotFsm` without being a descendant of `ChatbotFsmProvider`. The fix involved reverting to a model where local FSM contexts (`ChatbotFsmContext`, `DebugConsoleFsmContext`) report their display state tuples (Previous, Current, Target) to `StockAnalysisContext`. `FsmStateDebugCard` now consumes these display states from `StockAnalysisContext`. Setters in `StockAnalysisContext` for these display tuples were made more robust to prevent re-renders if the actual display data hasn't changed, mitigating potential "maximum update depth" errors. Application version updated to `v2.9.C.D`.
---
**App Version:** `v2.9.C.C` (Fix FSM Display Maximum Update Depth Error)
**Tag:** `Phase-9_Task-9.C.C_FixFsmDisplayMaxUpdateDepth` - Commit Hash: `(previous_commit_for_C.C)`
**Subject:** `fix(fsm): Refactor FSM state display to prevent maximum update depth error (v2.9.C.C)`
**Details:**
Refactored the FSM state display mechanism to prevent "Maximum update depth exceeded" errors. Removed centralized FSM display state variables (`mainTabFsmDisplay`, `chatbotFsmDisplay`, `debugConsoleMenuFsmDisplay`) from `StockAnalysisContext`. `ChatbotFsmContext` and `DebugConsoleFsmContext` now directly expose their FSM states (previous, current, target). `FsmStateDebugCard.tsx` was updated to consume these states directly from their respective contexts and receive Main Tab FSM state via props. This decentralization breaks update loops. Application version updated to `v2.9.C.C`.
---
**App Version:** `v2.9.C.B` (Fix Debug Console FSM Display Prop Error)
**Tag:** `Phase-9_Task-9.C.B_FixDebugConsoleFsmProp` - Commit Hash: `(previous_commit_for_C.B)`
**Subject:** `fix(fsm): Correctly pass setDebugConsoleMenuFsmDisplayState prop (v2.9.C.B)`
**Details:**
Resolved a `TypeError: setDebugConsoleMenuFsmDisplayState is not a function` by ensuring the `setDebugConsoleMenuFsmDisplay` function from `StockAnalysisContext` is correctly passed as the `setDebugConsoleMenuFsmDisplayState` prop to `DebugConsoleFsmProvider` in `page.tsx`. Application version updated to `v2.9.C.B`.
---
**App Version:** `v2.9.C.A` (Consolidated FSM Debug Card Feature)
**Tag:** `Phase-9_Task-9.C.A_ConsolidatedFsmDebugCard` - Commit Hash: `(previous_commit_for_C.A)`
**Subject:** `feat(debug): Implement consolidated FSM State Debug Card & relocate Global FSM display (v2.9.C.A)`
**Details:**
Implemented a new "FSM State Debug Card" to provide a centralized view of Previous, Current, and Target states for all major FSMs (Global App, Main Tab UI, Chatbot UI, Debug Console Menu UI).
- Global FSM display (Prev/Curr/Target) relocated to the main application header.
- Added a new toggle switch on the main page to show/hide the FSM State Debug Card (enabled by default).
- The FSM State Debug Card appears above the Client Debug Console and includes "Copy JSON" and "Export JSON" functionality for all displayed FSM states.
- Local FSM display details removed from individual component headers and now reported to `StockAnalysisContext` for consumption by the new debug card.
- Application version updated to `v2.9.C.A`.
---
**App Version:** `v2.9.C.9` (Consolidated Bug Fixes & Feature Enhancements)
**Tag:** `Phase-9_Task-9.C.9_ConsolidatedFixesAndFeatures` - Commit Hash: `3684d4d6`
**Subject:** `fix(fsm,ui): Consolidate fixes for FSMs, button states, exports & enhance debug (v2.9.C.9)`
**Details:**
This version encapsulates a series of critical bug fixes and feature enhancements made from v2.9.C.0 through v2.9.C.9, improving application stability, FSM behavior, and debuggability.

Key changes included up to v2.9.C.9:
-   **Chatbot FSM Pilot (v2.9.C.0):** Introduced a dedicated FSM for `Chatbot.tsx` UI state management.
-   **Server Action Initial State Export Fixes (v2.9.C.1 - v2.9.C.5):**
    -   Resolved multiple build/runtime errors caused by missing exports for `initialStockDataFetchResult`, `initialAnalyzeTaState`, `initialPerformAiAnalysisState`, and `initialPerformAiOptionsAnalysisState` from their respective server action files.
    -   Corrected the approach by defining these initial states directly in the client-side `StockAnalysisContext.tsx` where `useActionState` is used, as server actions cannot export non-function values. This addressed the "A 'use server' file can only export async functions" error.
-   **"Analyze Stock" Button Re-enable Fix (v2.9.C.6):** Modified the local FSM in `MainTabContent.tsx` to correctly transition to `INPUT_VALID` when the global FSM returns to `IDLE` after a full analysis, ensuring the button becomes active again.
-   **On-Demand AI Button Availability Fix (v2.9.C.7):** Refined local FSM logic in `MainTabContent.tsx` to ensure `activeAnalysisTicker` is preserved correctly after a successful automated pipeline, allowing manual AI buttons ("Generate AI Key Takeaways", "Generate AI Options Analysis") to become enabled.
-   **Granular FSM State Display Feature (v2.9.C.8):** Enhanced debuggability by adding "Previous", "Current", and "Target" state displays for all local FSMs (`MainTabContent`, `ChatbotFSMContext`, `DebugConsoleFSMContext`) in their respective UI components.
-   **Number Formatting TypeError Fix (v2.9.C.9):** Refactored `formatNumber` in `src/lib/number-utils.ts` to prevent `TypeError` when handling potentially undefined inputs, resolving unexpected server response errors originating from server actions using these utilities.
-   Application version updated incrementally in `src/components/layout/header.tsx` and relevant documentation throughout these changes.

These consolidated changes result in a more robust, debuggable, and user-friendly application state.
---
**App Version:** `v2.9.C.0` (Pilot Chatbot FSM Refactor)
**Tag:** `Phase-9_Task-9.C.0_PilotChatbotFSM` - Commit Hash: `a0c733ee`
**Subject:** `feat(chatbot): Pilot FSM for Chatbot UI state management (v2.9.C.0)`
**Details:**
Introduced a dedicated Finite State Machine (FSM) and React Context (`ChatbotFsmContext`) to manage the UI states of the `Chatbot.tsx` component. This refactor encapsulates Chatbot's internal UI logic (input handling, submission state) within its own FSM, improving modularity and predictability.

Key changes included in v2.9.C.0:
- Created `src/contexts/chatbot-fsm-context.tsx` defining:
    - `ChatbotFsmInternalState` (IDLE, PROCESSING_USER_INPUT, SUBMITTING_MESSAGE).
    - `ChatbotFsmEvent` (USER_INPUT_CHANGED, SUBMIT_MESSAGE_REQUESTED, SUBMISSION_CONCLUDED).
    - `ChatbotFsmProvider` to manage and provide the FSM state and dispatch.
    - `useChatbotFsm` hook.
- Refactored `src/components/chatbot.tsx`:
    - Now consumes `ChatbotFsmContext` via `useChatbotFsm`.
    - Internal `userInput` state removed; FSM now manages `userInput`.
    - `handleSubmit` (triggered by form submission or Enter key) now dispatches `SUBMIT_MESSAGE_REQUESTED` to the Chatbot FSM.
    - An effect in `ChatbotFsmProvider` handles the actual server action call (`chatFormAction`) and global chat message addition when the FSM is in `SUBMITTING_MESSAGE`.
    - `isChatPending` prop (from `MainTabContent`) is used by `ChatbotFsmProvider`'s effect to dispatch `SUBMISSION_CONCLUDED` to the Chatbot FSM when the server action completes.
- Modified `src/components/main-tab-content.tsx`:
    - Wraps the `<Chatbot />` component with `<ChatbotFsmProvider />`.
    - Passes necessary props to `ChatbotFsmProvider`, including `chatFormAction`, `addChatMessageToGlobalContext`, relevant data JSONs, and `isChatPending`.
- Updated application version to `v2.9.C.0` in `src/components/layout/header.tsx`.
- Updated `README.md` and `CHANGELOG.md` to reflect the new version, completed task, new AI operational rules, and commit details.

This pilot refactor improves the `Chatbot` component's state management, making it more robust and easier to maintain, while decoupling its UI logic from the main application FSM.
---
**App Version:** `v2.9.B.9` (Correct Default Log Source Configuration)
**Tag:** `Phase-9_Task-9.B.9_CorrectDefaultLogConfig` - Commit Hash: `c4637481`
**Subject:** `fix(debug): Correct default log source config & update AI rules (v2.9.B.9)`
**Details:**
Corrected `defaultLogSourceConfig` in `src/lib/debug-log-types.ts` to ensure all log sources (except `OptionsChainTable`) are set to `true` by default when the client debug console is active. This provides a better initial debugging experience. Updated README.md (v1.49) to include new AI operational rules regarding XML output and interaction efficiency. UI Header updated to `v2.9.B.9`.
---
**App Version:** `v2.9.B.8` (Enhance Debug Console Defaults & FSM State Display)
**Tag:** `Phase-9_Task-9.B.8_EnhanceDebugConsole` - Commit Hash: `(previous_commit_hash_for_B8)`
**Subject:** `feat(debug): Enhance console defaults, display Prev/Curr/Target FSM states (v2.9.B.8)`
**Details:**
Enabled client debug console by default, increased max log entries to 1000. `OptionsChainTable` log source now defaults to OFF when console is enabled. Added Previous, Current, and Target FSM state display to the debug console banner for easier FSM debugging. UI Header updated to `v2.9.B.8`.
---
**App Version:** `v2.9.B.7` (Fix On-Demand AI Button Availability)
**Tag:** `Phase-9_Task-9.B.7_FixOnDemandButtonAvailability` - Commit Hash: `(previous_commit_hash_for_B7)`
**Subject:** `fix(ui): Preserve activeAnalysisTicker to enable on-demand AI buttons (v2.9.B.7)`
**Details:**
Modified `MainTabContent.tsx` to stop resetting `activeAnalysisTicker` to `null` when the FSM transitions to `IDLE`. This ensures that the `activeAnalysisTicker` (for which data has been loaded) persists, allowing the "Generate AI Key Takeaways" and "Generate AI Options Analysis" buttons to become enabled after the main "Analyze Stock" pipeline completes. UI Header updated to `v2.9.B.7`.
---
**App Version:** `v2.9.B.6` (Fix Chatbot Issues)
**Tag:** `Phase-9_Task-9.B.6_FixChatIssues` - Commit Hash: `(previous_commit_hash_for_B6)`
**Subject:** `fix(chat): Prevent duplicate messages & wrap action in startTransition (v2.9.B.6)`
**Details:**
Wrapped `chatFormAction` call in `Chatbot.tsx` in `React.startTransition` to resolve `useActionState` warning. Refined `useEffect` for `chatActionState` in `MainTabContent.tsx` by adjusting dependencies and adding a check against the last message in `contextChatHistoryRef.current` to prevent duplicate message dispatches to the FSM. UI Header updated to `v2.9.B.6`.
---
**App Version:** `v2.9.B.5` (Safer Error Serialization in Polygon Adapter)
**Tag:** `Phase-9_Task-9.B.5_SaferErrorSerialization` - Commit Hash: `(previous_commit_for_B5)`
**Subject:** `fix(server): Implement safer error serialization in Polygon adapter (v2.9.B.5)`
**Details:**
Modified `getFullStockData` in `src/services/data-sources/adapters/polygon-adapter.ts` to serialize caught errors into plain objects with specific, known-safe properties (`name`, `message`, limited `stack`, `code`) for `rawErrorDetails` and `rawOverallError`. This prevents issues with complex error objects causing client-side deserialization failures in server action responses. UI Header updated to `v2.9.B.5`.
---
**App Version:** `v2.9.B.4` (Decouple Changelogs to CHANGELOG.md)
**Tag:** `Phase-9_Task-9.B.4_DecoupleChangelogs` - Commit Hash: `(user_provided_hash_for_B4_or_placeholder)`
**Subject:** `docs(changelog): Decouple changelogs into new CHANGELOG.md (v2.9.B.4)`
**Details:**
Created `CHANGELOG.md` and migrated detailed PRD/Operating Manual changelog and application commit log from `README.md`. `README.md` (v1.48) now refers to `CHANGELOG.md` for this information.
---
**App Version:** `v2.9.B.3` (Fix Stuck UI Loop - Event-Driven FSM Transition)
**Tag:** `Phase-9_Task-9.B.3_FixFSMLoopEventDriven` - Commit Hash: `6b456a93`
**Subject:** `fix(fsm): Implement event-driven transition to FULL_ANALYSIS_COMPLETE (v2.9.B.3)`
**Details:**
Modified FSM to use an explicit `FINALIZE_AUTOMATED_PIPELINE` event dispatched from `MainTabContent` when `AI_TA_SUCCEEDED` or `AI_TA_FAILED`. The `fsmReducer` now handles this event to transition to `FULL_ANALYSIS_COMPLETE`. This resolves the stuck UI issue by ensuring the FSM correctly reaches an `IDLE` state. UI Header updated to `v2.9.B.3`.
---
**App Version:** `v2.9.B.2` (Further Debug Stuck UI - FSM Reducer Hardening)
**Tag:** `Phase-9_Task-9.B.2_DebugFSMLoopReducer` - Commit Hash: `9e57850e`
**Subject:** `feat(fsm): Add entry logging to reducer and simplify AI_TA terminal states for debug (v2.9.B.2)`
**Details:**
Added entry logging to `fsmReducer` and simplified `AI_TA_SUCCEEDED`/`FAILED` cases by removing internal logs to ensure direct transition to `FULL_ANALYSIS_COMPLETE`. UI Header updated to `v2.9.B.2`.
---
**App Version:** `v2.9.B.1` (Fix Stuck UI Loop - FSM Reducer)
**Tag:** `Phase-9_Task-9.B.1_FixFSMLoopReducer` - Commit Hash: `45af28c8`
**Subject:** `fix(fsm): Correct FSM transition to fix stuck UI (v2.9.B.1)`
**Details:**
Corrected the `fsmReducer` in `StockAnalysisContext` to ensure `AI_TA_SUCCEEDED` and `AI_TA_FAILED` states explicitly return `FsmState.FULL_ANALYSIS_COMPLETE`, aiming to fix the UI getting stuck. UI Header updated to `v2.9.B.1`.
---
**App Version:** `v2.9.B.0` (Fix SSR ReferenceError for context functions)
**Tag:** `Phase-9_Task-9.B.0_FixContextFuncSSR` - Commit Hash: `31e36f14`
**Subject:** `fix(ssr): Define context log source functions plainly to resolve ReferenceError (v2.9.B.0)`
**Details:**
Addressed SSR ReferenceError for `disableAllLogSources` by changing it and `enableAllLogSources` to plain functions in `StockAnalysisContext`. UI Header updated to `v2.9.B.0`.
---
**App Version:** `v2.9.A.Z` (Attempt to Fix Stuck UI & Broken Logs - ISSUES PERSIST)
**Tag:** `Phase-9_Task-9.A.Z_AttemptFixUI-Logs` - Commit Hash: `2c7498c4`
**Subject:** `fix(app): Attempt to resolve stuck UI and broken console logs (v2.9.A.Z)`
**Details:**
This commit includes changes intended to address two critical issues:
1. Stuck UI after 'Analyze Stock': Ensured FSM transitions correctly from AI_TA_SUCCEEDED/FAILED to FULL_ANALYSIS_COMPLETE and then to IDLE. Added robust logging in MainTabContent's useEffect for PROCEED_TO_IDLE dispatch. (Note: This issue remained unresolved post-commit.)
2. Broken Client Console Logs: Re-verified and ensured simplified dependency array for console interception useEffect in StockAnalysisContext. Added extensive diagnostic logging. (Note: This issue also remained unresolved post-commit.)
UI Header updated to `v2.9.A.Z`. `README.md` updated.
---
*(Older commit logs would continue here if they existed in the original README.md Section 7)*




