
# Feature Scope: Customizable Analysis & AI Augmented Web Search (StockSage v3.3.x.y.z)

**Document Version:** 4.2
**Date:** 2025-06-26
**Target Application Version Series:** 3.3.x.y.z
**Feature Status:** IN PROGRESS

## 1. Introduction & Objective

This document outlines the scope, requirements, and high-level architectural considerations for the "Customizable Analysis & AI Augmented Web Search" feature. The primary objective is to evolve StockSage from an application with a rigid analysis pipeline into a dynamic and powerful tool that gives users granular control over the analyses they perform. This feature introduces two major enhancements: a user-configurable analysis pipeline and the augmentation of core AI analyses with real-time data sourced from Google Search.

## 2. Feature Scoping & Detailed Analysis

### 2.1. Core Problem Area Addressed
*   **Pipeline Rigidity:** The current "AI Full Analysis Macro" is an all-or-nothing process, which can be slow and may perform analyses the user is not interested in.
*   **Limited Data Scope:** The application's insights are confined to the data available from the Polygon.io API, which lacks certain advanced technical and options flow metrics.
*   **Lack of User Control:** Users cannot tailor the analysis to their specific needs, such as focusing only on key takeaways or options data.

### 2.2. Proposed Solution & Implementation Details

The solution is a two-pronged enhancement to the main analysis workflow, replacing the "AI Full Analysis Macro" button with a new, more interactive control panel.

#### Component 1: User-Configurable Analysis Pipeline

The "AI Full Analysis Macro" button and its associated hardcoded pipeline logic will be removed. In its place, a series of UI toggles will allow users to customize the analysis triggered by the main "Analyze Stock" button.

*   **Base Pipeline (Always-On, Non-Toggleable):** When "Analyze Stock" is clicked, the following analyses will always be performed as a baseline:
    1.  Stock Snapshot Details (Price, Volume, etc.)
    2.  Standard Technical Indicators (RSI, MACD, MAs from Polygon)
    3.  AI Analyzed Technical Analysis (Pivot Points based on Polygon data)

*   **Selectable Analysis Toggles (All Enabled by Default):** The user can choose to include the following AI-driven analyses:
    *   **[Toggle] AI Key Takeaways:** Generates the 5 key takeaways.
    *   **[Toggle] AI Analyzed Options Chain:** Identifies Call/Put walls.
    *   **[Toggle] AI Chat Stock Trader's Takeaways:** Generates the "Stock Trader's Takeaways" response in the chat window.
    *   **[Toggle] AI Chat Options Trader's Takeaways:** Generates the "Options Trader's Takeaways" response in the chat window.
    *   **[Toggle] AI Chat Additional Holistic Takeaways:** Generates the "Additional Holistic Takeaways" response in the chat window.

#### Component 2: AI Augmented Web Search

This component introduces a new layer of intelligence by using the **"Grounding with Google Search"** pattern to fetch financial metrics not available via the Polygon API. This augmentation will be controlled by new toggles.

*   **Architectural Pattern for Augmented Search (Mandatory):** To ensure the AI reliably uses the search tool, all augmented search flows will use the established "Grounding with Google Search" pattern. This involves:
    1.  Defining the Genkit prompt with the `googleSearch` tool enabled.
    2.  **Omitting** the `output: { schema: ... }` property from the prompt definition.
    3.  Instructing the AI in the prompt text to format its entire response as a single, valid JSON string.
    4.  The flow logic will then receive a plain text response from the AI, extract the JSON block, parse it, and validate it against a Zod schema.

*   **[Toggle] AI Augmented Web Search: Technical Analysis Indicators:**
    *   **Behavior:** When enabled, a new AI flow will use the "Grounding with Google Search" pattern to find the latest values for ATR-14, Support/Resistance Levels, Bollinger Bands, and Fibonacci Retracement Levels.
    *   **UI Impact:** A new display card will show the raw data retrieved from the web search.
    *   **Logic Impact:** When this toggle is **ON**, the data retrieved **MUST** be passed as additional context to the AI prompts for "AI Key Takeaways" and all three "AI Chat" modules, enriching their analysis.

*   **[Toggle] AI Augmented Web Search: Options Chain Flow Analysis:**
    *   **Behavior:** When enabled, a new AI flow will use the "Grounding with Google Search" pattern to find metrics like Max Pain, GEX, and Put/Call Ratio.
    *   **UI Impact:** A new display card will show the raw data retrieved from the web search.
    *   **Logic Impact:** When this toggle is **ON**, the data retrieved **MUST** be passed as additional context to the prompts for "AI Analyzed Options Chain", "AI Chat Stock Trader's Takeaways", and "AI Chat Options Trader's Takeaways".

### 2.3. Architectural Principles & Constraints
*   **Enforced Dynamic Thinking:** All AI prompts (`ai.definePrompt`) involved in this feature must have dynamic thinking enabled by default (`thinkingConfig: { thinkingBudget: -1 }`). This should be architecturally enforced to prevent it from being accidentally disabled.
*   **FSM & Debuggability:** The global FSM must be updated to manage the state of all new toggles and to orchestrate the highly conditional analysis pipeline. Debug logs must be added to trace which pipeline steps are being executed based on user selections.

## 4. Value Added Proposition

*   **User Empowerment:** Gives users direct control over the depth, scope, and cost of the analysis they wish to perform.
*   **Deeper Insights:** Enriches AI analysis by grounding it with real-time, web-sourced data points not available in the base API, leading to more sophisticated and accurate takeaways.
*   **Enhanced Performance & Cost-Efficiency:** Allows users to disable computationally expensive or unnecessary AI steps, resulting in faster analysis and reduced token consumption.
*   **Improved Transparency:** The new display cards for augmented search results show the user the exact data the AI is using for its deeper analysis.

## 5. Risks Assessment & Potential Pain Points

*   **High Risk - Prompt Reliability for Web Search & JSON Parsing:** Forcing the AI to use "Grounding with Google Search" and then return a valid JSON string within a text response is a fragile pattern. The AI may fail to find data, return malformed JSON, or add conversational text that breaks parsing. The flows must be highly robust to handle "not found" scenarios and parsing errors gracefully.
*   **UI/UX Complexity:** The addition of seven new toggles could clutter the main input card. Careful design is needed to group them logically (e.g., in an accordion or a separate settings area) to avoid overwhelming the user.
*   **FSM Orchestration Complexity:** The global FSM's orchestrator logic will become significantly more complex, managing a dynamic pipeline with numerous conditional branches. This increases the risk of state management bugs, race conditions, or dead-end states if not meticulously planned.
*   **Performance Latency:** Each web search-augmented analysis will introduce additional latency due to the multiple tool calls required by the AI. The user experience must be managed with clear loading indicators.
*   **Data Mismatches:** There's a risk of inconsistency between real-time data from the Polygon API and data found via Google Search (e.g., from different sources with different update frequencies). The AI prompts must be designed to acknowledge and handle such potential discrepancies.

## 6. Implementation Phased Plan & Task Breakdown

### Phase 1: UI Foundation (Target: v3.3.1.y.z)
*   **Objective:** Replace the "AI Full Analysis Macro" button with the new set of UI toggles for customizable analysis. This phase is UI-only; the toggles will not yet have any logic.
*   **Tasks:**
    *   **Task v3.3.1.0.0:** In `src/components/main-tab-content.tsx`, remove the "AI Full Analysis Macro" button. (`COMPLETED`)
    *   **Task v3.3.1.1.0:** In the same file, add the five new UI toggles for the selectable analysis pipeline, logically grouped under a new "Customizable Analysis" section. Ensure they are all enabled by default. (`COMPLETED`)
    *   **Task v3.3.1.2.0:** In the same file, add the two new UI toggles for "AI Augmented Web Search", grouped under a new "Augmented Intelligence" section. Ensure they are disabled by default. (`COMPLETED`)
    *   **Task v3.3.1.3.0:** **(Phase 1 Testing)** - Visually verify that the new UI components render correctly, the old button is gone, and the toggles are in their correct default states. (`COMPLETED`)

### Phase 2: FSM & State Management Integration (Target: v3.3.2.y.z)
*   **Objective:** Integrate the state of the new UI toggles with the global FSM.
*   **Tasks:**
    *   **Task v3.3.2.0.0:** In `src/contexts/stock-analysis-context.tsx`, add new boolean flags to `GlobalFsmFlags` for each of the seven new toggles (e.g., `isAiKeyTakeawaysSelected`, `isAugmentedTaSearchEnabled`). Set their default values. (`COMPLETED`)
    *   **Task v3.3.2.1.0:** In the same file, create a new FSM event (e.g., `ANALYSIS_TOGGLE_CHANGED`) and update the `fsmReducer` to handle this event, allowing it to update the new flags. (`COMPLETED`)
    *   **Task v3.3.2.2.0:** In `src/components/main-tab-content.tsx`, connect the `onCheckedChange` handler of each toggle to dispatch the new FSM event. Bind the `checked` prop of each toggle to its corresponding flag in the global FSM. (`COMPLETED`)
    *   **Task v3.3.2.3.0:** **(Phase 2 Testing)** - Verify in the "FSM Debug" tab that interacting with the UI toggles correctly updates their corresponding flags in the global FSM. (`COMPLETED`)

### Phase 3: Conditional Pipeline Logic Integration (Target: v3.3.3.y.z)
*   **Objective:** Make the primary analysis toggles functional by modifying the FSM orchestrator.
*   **Tasks:**
    *   **Task v3.3.3.0.0:** In `src/contexts/stock-analysis-context.tsx`, modify the main FSM orchestrator `useEffect` hook. Instead of a hardcoded macro, after `AI_TA_CALCULATION_SUCCEEDED`, it should now check the FSM flags. (`COMPLETED`)
    *   **Task v3.3.3.1.0:** Based on the flags, the orchestrator will conditionally dispatch the existing events (`TRIGGER_MANUAL_KEY_TAKEAWAYS`, `TRIGGER_MANUAL_OPTIONS_ANALYSIS`, and `SUBMIT_CHAT_MESSAGE` for the three chat prompts) in a sequence. (`COMPLETED`)
    *   **Task v3.3.3.2.0:** **(Phase 3 Testing)** - Run analyses with different combinations of the primary toggles enabled/disabled and verify that only the selected analyses are performed. (`COMPLETED`)

### Phase 4: AI Augmented Web Search - Technical Analysis (Target: v3.3.4.y.z)
*   **Objective:** Implement the AI-driven web search for augmented technical indicators using the "Grounding with Google Search" pattern.
*   **Tasks:**
    *   **Task v3.3.4.0.0:** Create a new AI flow file: `src/ai/flows/augmented-ta-search-flow.ts`. (`COMPLETED`)
    *   **Task v3.3.4.1.0:** Create a new display component: `src/components/augmented-ta-display.tsx`. (`COMPLETED`)
    *   **Task v3.3.4.2.0:** In `stock-analysis-context.tsx`, update the FSM to call this new flow when its toggle is enabled and store the resulting JSON in the context. (`COMPLETED`)
    *   **Task v3.3.4.3.0:** In `main-tab-content.tsx`, add the new `AugmentedTaDisplay` component to the UI. (`COMPLETED`)
    *   **Task v3.3.4.4.0 (Correction):** Correct the search flow to use the "Grounding with Google Search" pattern (text response with JSON string) instead of a direct JSON output schema. (`COMPLETED`)
    *   **Task v3.3.4.5.0:** **(Phase 4 Testing)** - Verify that the web search is performed and the results are correctly displayed in the new UI card. (`COMPLETED`)

### Phase 5: AI Augmented Web Search - Options Flow (Target: v3.3.5.y.z)
*   **Objective:** Implement the AI-driven web search for augmented options metrics.
*   **Tasks:**
    *   **Task v3.3.5.0.0:** Create `src/ai/flows/augmented-options-search-flow.ts` to find metrics like Max Pain, GEX, etc., using the "Grounding with Google Search" pattern. (`PLANNED`)
    *   **Task v3.3.5.1.0:** Create `src/components/augmented-options-display.tsx` to render the results. (`PLANNED`)
    *   **Task v3.3.5.2.0:** Update the FSM in `stock-analysis-context.tsx` to orchestrate this flow and store its results. (`PLANNED`)
    *   **Task v3.3.5.3.0:** Add the new `AugmentedOptionsDisplay` component to `main-tab-content.tsx`. (`PLANNED`)
    *   **Task v3.3.5.4.0:** **(Phase 5 Testing)** - Enable the augmented options toggle, run an analysis, and verify the search and display work correctly. (`PLANNED`)

### Phase 6: Augmented Data Integration (Target: v3.3.6.y.z)
*   **Objective:** Feed the new augmented data back into the main analysis and chat prompts.
*   **Tasks:**
    *   **Task v3.3.6.0.0:** Update the input schemas and prompts for `analyze-stock-data-flow.ts` and `analyze-options-chain-flow.ts` to accept the new optional augmented data JSONs. (`PLANNED`)
    *   **Task v3.3.6.1.0:** Update the input schema and prompt for `chat-flow.ts` to accept the new augmented data. (`PLANNED`)
    *   **Task v3.3.6.2.0:** In `stock-analysis-context.tsx`, modify the calls to these flows to pass the augmented data if it's available (based on the toggle flags). (`PLANNED`)
    *   **Task v3.3.6.3.0:** **(Phase 6 Testing)** - Run an analysis with augmented toggles enabled and confirm through prompts and debug logs that the main AI analyses are receiving and considering the augmented data. (`PLANNED`)

### Phase 7: Final Testing & Debugging (Target: v3.3.7.y.z)
*   **Objective:** Perform end-to-end testing of the entire feature, checking various combinations of toggles and ensuring stability.
*   **Tasks:**
    *   **Task v3.3.7.0.0:** Conduct comprehensive testing of all new UI elements, FSM states, and conditional pipeline logic. (`PLANNED`)
    *   **Task v3.3.7.1.0:** Test edge cases: running analysis with no toggles, all toggles, and random combinations. Test for tickers where augmented search might fail. (`PLANNED`)
    *   **Task v3.3.7.2.0:** Review and refine all new debug logs for clarity and completeness. Address any bugs found during testing. (`PLANNED`)

## 6. Document Changelog

*   **v4.2 (2025-06-26):** Updated Phase 4 status to `COMPLETED` and added detail about the critical "Grounding with Google Search" pattern correction. Updated "Architectural Pattern for Augmented Search" to reflect mandatory use of the corrected pattern.
*   **v4.1 (2025-06-26):** Updated Phase 4 status to `COMPLETED` and added detail about the critical "Grounding with Google Search" pattern correction.
*   **v4.0 (2025-06-25):** Marked Phase 4 as COMPLETE.
*   **v3.0 (2025-06-23):** Marked Phase 3 as COMPLETE.
*   **v2.0 (2025-06-22):** Added detailed, phased implementation plan with testing tasks per phase.
*   **v1.0 (2025-06-22):** Initial document creation, scoping the new customizable analysis and AI augmented web search features.

---
This document will be updated as the feature progresses through its implementation phases.

    