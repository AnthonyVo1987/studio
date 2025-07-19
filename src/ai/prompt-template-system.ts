/**
 * @fileOverview AI Prompt Template System for StockSage
 * Provides reusable prompt templates while maintaining exact content compatibility
 * with existing AI flows. This system reduces token count through factorization
 * without changing any prompt behavior or content.
 */

import type { LlmPromptDefinition } from './definition-loader';

// Common prompt configuration patterns
export interface PromptTemplateConfig {
  modelId?: string;
  thinkingBudget?: number;
  useGoogleSearch?: boolean;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

// Common chain of thought role patterns
export interface ChainOfThoughtTemplate {
  systemSetup?: string;
  dataStructureExplanation?: string;
  coreTask?: string;
  analysisCriteria?: string;
  outputRequirements?: string;
  outputFormattingInstructions?: string;
  dataContext?: string;
  finalInstruction?: string;
}

// Factory for creating standardized prompt configurations
export const createPromptConfig = (overrides: Partial<PromptTemplateConfig> = {}): PromptTemplateConfig => {
  return {
    modelId: "googleai/gemini-2.5-flash-lite-preview-06-17",
    thinkingBudget: -1,
    useGoogleSearch: false,
    safetySettings: [
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" }
    ],
    ...overrides
  };
};

// Factory for creating chain of thought structures
export const createChainOfThought = (template: ChainOfThoughtTemplate): Array<{
  role: string;
  parts: Array<{ text: string }>;
}> => {
  const steps: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (template.systemSetup) {
    steps.push({
      role: "SystemSetup",
      parts: [{ text: template.systemSetup }]
    });
  }

  if (template.dataStructureExplanation) {
    steps.push({
      role: "DataStructureExplanation", 
      parts: [{ text: template.dataStructureExplanation }]
    });
  }

  if (template.coreTask) {
    steps.push({
      role: "CoreTask",
      parts: [{ text: template.coreTask }]
    });
  }

  if (template.analysisCriteria) {
    steps.push({
      role: "AnalysisCriteria",
      parts: [{ text: template.analysisCriteria }]
    });
  }

  if (template.outputRequirements) {
    steps.push({
      role: "OutputRequirements",
      parts: [{ text: template.outputRequirements }]
    });
  }

  if (template.outputFormattingInstructions) {
    steps.push({
      role: "OutputFormattingInstructions",
      parts: [{ text: template.outputFormattingInstructions }]
    });
  }

  if (template.dataContext) {
    steps.push({
      role: "DataContext",
      parts: [{ text: template.dataContext }]
    });
  }

  if (template.finalInstruction) {
    steps.push({
      role: "FinalInstruction",
      parts: [{ text: template.finalInstruction }]
    });
  }

  return steps;
};

// Template factory for complete prompt definitions
export const createPromptDefinition = (
  promptName: string,
  description: string,
  outputSchemaHint: string,
  chainTemplate: ChainOfThoughtTemplate,
  config: Partial<PromptTemplateConfig> = {}
): LlmPromptDefinition => {
  const promptConfig = createPromptConfig(config);
  
  return {
    definitionType: "llm-prompt",
    promptName,
    description,
    outputSchemaHint,
    chainOfThought: createChainOfThought(chainTemplate),
    ...promptConfig
  };
};

// Pre-configured templates for common StockSage patterns
export const stockAnalysisTemplates = {
  // Stock data analysis template (matching existing analyze-stock-data.json)
  stockAnalysis: (overrides: Partial<PromptTemplateConfig> = {}): LlmPromptDefinition => 
    createPromptDefinition(
      "analyzeStockDataPrompt",
      "Generates key insights about a stock, emphasizing sentiment across various categories.",
      "StockAnalysisOutputSchema from '@/ai/schemas/stock-analysis-schemas'",
      {
        systemSetup: "You are an expert financial analyst tasked with providing key takeaways about a stock.\nYou will be given the stock ticker, a snapshot of its current and previous day data, standard technical indicators, AI-analyzed technical analysis (like pivot points), and current market status.",
        
        dataStructureExplanation: "The standard technical indicators JSON ({{{standardTasJson}}}) will have the following structure:\n- \"RSI\": An object with keys like \"7\", \"10\", \"14\" representing RSI values for those periods. e.g., {\"7\": 50.0, \"14\": 55.0}. The 14-period RSI is standard for overbought (>70) / oversold (<30) conditions.\n- \"MACD\": An object with \"value\", \"signal\", and \"histogram\" keys. e.g., {\"value\": 0.5, \"signal\": 0.4, \"histogram\": 0.1}. A positive histogram is generally bullish; negative is bearish.\n- \"VWAP\": An object with \"day\" and \"minute\" keys for Volume Weighted Average Price. e.g., {\"day\": 150.00, \"minute\": 150.05}.\n- \"EMA\": An object with keys for different Exponential Moving Average periods (\"5\", \"10\", \"20\", \"50\", \"200\"). e.g., {\"20\": 148.00, \"50\": 145.00}.\n- \"SMA\": An object with keys for different Simple Moving Average periods (\"5\", \"10\", \"20\", \"50\", \"200\"). e.g., {\"50\": 146.00, \"200\": 130.00}.\nIf a specific indicator or window was not available, it might be missing from the JSON or have a null value.",
        
        coreTask: "Analyze all the provided data comprehensively. Your goal is to generate 5 distinct key takeaways, each with a concise statement and an associated sentiment. The categories for these takeaways are:\n1.  **Price Action:** Observations about the stock's recent price movements and interactions with MAs or pivot points.\n2.  **Trend:** The prevailing direction (or lack thereof) of the stock's price over a relevant period, considering MAs.\n3.  **Volatility:** For Volatility, describe the stock's recent price variation characteristics (e.g., daily range, percentage change significance). **You MUST provide a meaningful textual description (at least 10-15 words) for this category, even if volatility is low or typical.** For example: 'Volatility is currently low, with {{{ticker}}} trading in a narrow range of X% over the past Y period, suggesting consolidation.' or 'Volatility for {{{ticker}}} is elevated, with significant price swings observed, indicating market uncertainty around recent events.'\n4.  **Momentum:** The speed or rate of price changes for the stock, considering RSI and MACD.\n5.  **Patterns:** Any significant chart patterns observed or noteworthy absence of clear patterns.",
        
        outputFormattingInstructions: "For each takeaway:\n- Provide a clear, insightful `takeaway` statement.\n- Assign a `sentiment`. Use terms like: bullish, bearish, neutral, positive, negative, high, low, increasing, decreasing, strong, weak, moderate, stable. Choose the most appropriate term for the category.\n\nFormatting instructions:\n- Ensure any numerical values mentioned in your takeaways are formatted to a maximum of two decimal places.\n- Monetary values (like price targets or levels) should be prefixed with a \"$\" sign.",
        
        dataContext: "Contextual Data:\nTicker: {{{ticker}}}\nStock Snapshot (current & prev day data, incl. minute VWAP in 'min' field): {{{stockSnapshotJson}}}\nStandard Technical Indicators (RSI, MACD, VWAP, EMA, SMA with multiple windows): {{{standardTasJson}}}\nAI Analyzed Technical Analysis (Pivot Points): {{{aiAnalyzedTaJson}}}\nMarket Status: {{{marketStatusJson}}}",
        
        finalInstruction: "Provide your analysis as a JSON object strictly conforming to the StockAnalysisOutputSchema."
      },
      overrides
    ),

  // Options chain analysis template (matching existing analyze-options-chain.json)
  optionsAnalysis: (overrides: Partial<PromptTemplateConfig> = {}): LlmPromptDefinition =>
    createPromptDefinition(
      "analyzeOptionsChainPrompt", 
      "Analyzes options chain data to identify significant Call/Put Walls based on noteworthy OI and/or Volume concentrations.",
      "AiOptionsAnalysisOutputSchema from '@/ai/schemas/ai-options-analysis-schemas'",
      {
        systemSetup: "You are an expert options market analyst.",
        
        coreTask: "Your task is to identify significant Call and Put \"Walls\" from the provided options chain data for the stock: {{{ticker}}}.",
        
        dataContext: "The current underlying price is ${{{currentUnderlyingPrice}}} for context.\nThe options chain data is provided as a JSON string: {{{optionsChainJson}}}\nThis JSON string represents an 'OptionsChainData' object with a 'contracts' array. Each element in 'contracts' is an 'OptionsTableRow' having 'strike', 'call' (StreamlinedOptionContract), and 'put' (StreamlinedOptionContract) properties. Each contract detail (call/put) includes 'open_interest' and 'volume'.",
        
        analysisCriteria: "Identify strikes that show potentially significant Open Interest (OI) that *might* act as support/resistance. Consider OI levels that are elevated compared to their immediate surroundings or that appear noteworthy within the context of the overall options chain for {{{ticker}}}. Also, consider strikes where Open Interest shows a notable increase relative to immediately adjacent strikes, even if the absolute OI is not exceptionally high across the entire chain. High volume at these strikes can be a confirming factor but is not strictly required if OI itself is notable. The goal is to highlight areas of interest, not just extreme concentrations. You should make every reasonable effort to find candidates.",
        
        outputRequirements: "Output Requirements:\n- Identify AT LEAST 1 Call Wall and AT LEAST 1 Put Wall if any reasonable candidates exist based on the criteria. Select a maximum of 3 for each type.\n- If multiple candidates exist, order them by your perceived significance (e.g., highest OI, most impactful cluster, significant volume confirmation), even if that significance is moderate.\n- If there are strikes with OI that stands out even moderately from its neighbors, consider including them.\n- If, after making a diligent effort, you absolutely cannot identify any discernible OI/Volume concentrations that could reasonably be considered a wall (even a minor one), then (and only then) return an empty array for that specific type (e.g., `callWalls: []`).\n- For each selected wall, populate the output JSON:\n    - `callWalls`: Array of wall objects: `{strike: number, openInterest: number, volume?: number, type: 'call'}`. Include `volume` if it's a key factor in your identification or particularly noteworthy.\n    - `putWalls`: Array of wall objects: `{strike: number, openInterest: number, volume?: number, type: 'put'}`. Include `volume` if it's a key factor in your identification or particularly noteworthy.",
        
        finalInstruction: "Strictly adhere to the output schema.\nIf optionsChainJson is empty or clearly insufficient (e.g., very few contracts or all zero OI/volume), return empty walls."
      },
      overrides
    )
};

// Utility for backward compatibility - converts template to existing JSON format
export const templateToLegacyJson = (template: LlmPromptDefinition): object => {
  return {
    definitionType: template.definitionType,
    promptName: template.promptName,
    description: template.description,
    modelId: template.modelId,
    safetySettings: template.safetySettings,
    thinkingBudget: template.thinkingBudget,
    useGoogleSearch: template.useGoogleSearch,
    outputSchemaHint: template.outputSchemaHint,
    chainOfThought: template.chainOfThought
  };
};