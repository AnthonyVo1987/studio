
# Feature Scope: Customizable Analysis & AI Augmented Web Search (StockSage v3.3.x.y.z)

**Document Version:** 1.0
**Date:** 2025-06-22
**Target Application Version Series:** 3.3.x.y.z
**Feature Status:** PLANNED

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

This component introduces a new layer of intelligence by using Google Search as a Genkit Tool to fetch specific financial metrics that are not available via the Polygon API. This augmentation will be controlled by two new toggles.

*   **[Toggle] AI Augmented Web Search: Technical Analysis Indicators:**
    *   **Behavior:** When enabled, a new AI flow will use the Google Search tool to find the latest values for the following indicators for the given ticker:
        *   ATR-14 (Average True Range)
        *   Support Levels (3 distinct levels)
        *   Resistance Levels (3 distinct levels)
        *   Bollinger Bands (Upper, Middle, Lower band values)
        *   Fibonacci Retracement Levels (3 distinct levels)
    *   **UI Impact:** A new display card will be added next to the "AI Analyzed Technical Analysis" card to show the raw data retrieved from the web search.
    *   **Logic Impact:** When this toggle is **ON**, the data retrieved from the web search **MUST** be passed as additional context to the AI prompts for "AI Key Takeaways" and all three "AI Chat" modules, enriching their analysis.

*   **[Toggle] AI Augmented Web Search: Options Chain Flow Analysis:**
    *   **Behavior:** When enabled, a new AI flow will use the Google Search tool to find the latest values for the following options-related metrics for the given ticker:
        *   Max Pain
        *   Volatility/IV Skew
        *   Implied Volatility (ATM)
        *   Historic Volatility
        *   IV Rank
        *   IV Percentile
        *   Put/Call Ratio
        *   Gamma Exposure (GEX)
    *   **UI Impact:** A new display card will be added next to the "AI Analyzed Options Chain" card to show the raw data retrieved from the web search.
    *   **Logic Impact:** When this toggle is **ON**, the data retrieved from the web search **MUST** be passed as additional context to the prompts for "AI Analyzed Options Chain", "AI Chat Stock Trader's Takeaways", and "AI Chat Options Trader's Takeaways".

### 2.3. Architectural Principles & Constraints
*   **Enforced Dynamic Thinking:** All AI prompts (`ai.definePrompt`) involved in this feature must have dynamic thinking enabled by default (`thinkingConfig: { thinkingBudget: -1 }`). This should be architecturally enforced to prevent it from being accidentally disabled.
*   **FSM & Debuggability:** The global FSM must be updated to manage the state of all new toggles and to orchestrate the highly conditional analysis pipeline. Debug logs must be added to trace which pipeline steps are being executed based on user selections.

## 3. Value Added Proposition

*   **User Empowerment:** Gives users direct control over the depth, scope, and cost of the analysis they wish to perform.
*   **Deeper Insights:** Enriches AI analysis by grounding it with real-time, web-sourced data points not available in the base API, leading to more sophisticated and accurate takeaways.
*   **Enhanced Performance & Cost-Efficiency:** Allows users to disable computationally expensive or unnecessary AI steps, resulting in faster analysis and reduced token consumption.
*   **Improved Transparency:** The new display cards for augmented search results show the user the exact data the AI is using for its deeper analysis.

## 4. Risks Assessment & Potential Pain Points

*   **High Risk - Prompt Reliability for Web Search:** Crafting AI prompts that can reliably use a search tool to find *specific, structured numerical data* (like ATR-14 or Max Pain) is very challenging. The AI may fail to find the data, find incorrect data, or hallucinate values. The flows must be highly robust to handle "not found" scenarios gracefully.
*   **UI/UX Complexity:** The addition of seven new toggles could clutter the main input card. Careful design is needed to group them logically (e.g., in an accordion or a separate settings area) to avoid overwhelming the user.
*   **FSM Orchestration Complexity:** The global FSM's orchestrator logic will become significantly more complex, managing a dynamic pipeline with numerous conditional branches. This increases the risk of state management bugs, race conditions, or dead-end states if not meticulously planned.
*   **Performance Latency:** Each web search-augmented analysis will introduce additional latency due to the multiple tool calls required by the AI. The user experience must be managed with clear loading indicators.
*   **Data Mismatches:** There's a risk of inconsistency between real-time data from the Polygon API and data found via Google Search (e.g., from different sources with different update frequencies). The AI prompts must be designed to acknowledge and handle such potential discrepancies.

## 5. Document Changelog

*   **v1.0 (2025-06-22):** Initial document creation, scoping the new customizable analysis and AI augmented web search features.

---
This document will be updated once the scope is approved and an implementation plan is formulated.
