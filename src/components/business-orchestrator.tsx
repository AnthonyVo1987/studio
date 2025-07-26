'use client';

import { useRef, useEffect, startTransition } from "react";
import { useStockAnalysis, BusinessFsmState } from "@/contexts/business-logic-context";
import { useToast } from "@/hooks/use-toast";

// Server Actions
import { fetchStockDataAction } from '@/actions/analyze-stock-server-action';
import { analyzeTaAction } from '@/actions/analyze-ta-action';
import { performAiAnalysisAction } from '@/actions/perform-ai-analysis-action';
import { performAiOptionsAnalysisAction } from '@/actions/perform-ai-options-analysis-action';

/**
 * BusinessOrchestrator - Pure business logic component
 * 
 * This component handles the business pipeline orchestration without any UI concerns.
 * It reacts to FSM state changes and executes server actions, updating business state accordingly.
 * 
 * SEPARATION OF CONCERNS:
 * - Only handles business logic execution
 * - No UI rendering or presentation logic
 * - Updates business context state
 * - Dispatches FSM events
 */
export function BusinessOrchestrator() {
  const { toast } = useToast();
  const {
    // Business FSM state
    fsmState: globalFsmStateFromContext,
    fsmVariables: globalFsmVariables,
    dispatchFsmEvent: dispatchGlobalFsmEvent,
    
    // Business data (for pipeline execution)
    marketStatusJson: contextMarketStatusJson,
    stockSnapshotJson: contextStockSnapshotJson,
    standardTasJson: contextStandardTasJson,
    optionsChainJson: contextOptionsChainJson,
    aiAnalyzedTaJson: contextAiAnalyzedTaJson,
    
    // Business data setters
    setAiKeyTakeawaysRequestJson, setAiKeyTakeawaysJson,
    setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson,
    setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson,
    setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
    setPolygonApiRequestLogJson, setPolygonApiResponseLogJson,
    
    // Options configuration (business domain)
    availableExpirationDates, selectedExpirationDate, setSelectedExpirationDate,
    optionType, strikeCount, tableDisplayType,
  } = useStockAnalysis();

  // Orchestrator execution control
  const previousFsmStateRef = useRef<BusinessFsmState | null>(null);
  const orchestratorExecutingRef = useRef<boolean>(false);
  
  // Capture business values for pipeline execution
  const latestBusinessValuesRef = useRef({
    activeTicker: globalFsmVariables.activeTicker,
    selectedExpirationDate,
    optionType,
    strikeCount,
    contextStockSnapshotJson,
    contextStandardTasJson,
    contextAiAnalyzedTaJson,
    contextMarketStatusJson,
    contextOptionsChainJson,
  });
  
  // Update business values ref on every render
  latestBusinessValuesRef.current = {
    activeTicker: globalFsmVariables.activeTicker,
    selectedExpirationDate,
    optionType,
    strikeCount,
    contextStockSnapshotJson,
    contextStandardTasJson,
    contextAiAnalyzedTaJson,
    contextMarketStatusJson,
    contextOptionsChainJson,
  };

  // Business Pipeline Orchestrator - Deterministic execution
  useEffect(() => {
    const orchestratorLogPrefix = 'BusinessOrchestrator:Pipeline';
    
    // Prevent duplicate execution and only react to actual state changes
    if (orchestratorExecutingRef.current || 
        previousFsmStateRef.current === globalFsmStateFromContext) {
      return;
    }

    const runBusinessPipelineStep = async () => {
      orchestratorExecutingRef.current = true;
      const currentValues = latestBusinessValuesRef.current;
      
      try {
        switch (globalFsmStateFromContext) {
          case BusinessFsmState.DATA_FETCH_IN_PROGRESS: {
            console.log(`[${orchestratorLogPrefix}] Executing DATA_FETCH_IN_PROGRESS step`);
            
            const result = await fetchStockDataAction({
              ticker: currentValues.activeTicker!,
              expirationDate: currentValues.selectedExpirationDate,
              optionType: currentValues.optionType,
              strikeCount: currentValues.strikeCount,
            });
            
            // Update business state
            startTransition(() => {
              if (result.status === 'success' && result.data) {
                setMarketStatusJson(result.data.marketStatusJson);
                setStockSnapshotJson(result.data.stockSnapshotJson);
                setStandardTasJson(result.data.standardTasJson);
                setOptionsChainJson(result.data.optionsChainJson);
                setPolygonApiRequestLogJson(result.data.polygonApiRequestLogJson);
                setPolygonApiResponseLogJson(result.data.polygonApiResponseLogJson);
                
                // Handle auto-selected expiration date from response
                try {
                  const responseLog = JSON.parse(result.data.polygonApiResponseLogJson);
                  if (responseLog.autoSelectedExpirationDate) {
                    setSelectedExpirationDate(responseLog.autoSelectedExpirationDate);
                  }
                } catch (e) { }
              } else if (result.status === 'error' && result.data) {
                // Handle failure case with partial data
                setMarketStatusJson(result.data.marketStatusJson || '{}');
                setStockSnapshotJson(result.data.stockSnapshotJson || '{}');
                setStandardTasJson(result.data.standardTasJson || '{}');
                setOptionsChainJson(result.data.optionsChainJson || '{}');
                setPolygonApiRequestLogJson(result.data.polygonApiRequestLogJson || '{}');
                setPolygonApiResponseLogJson(result.data.polygonApiResponseLogJson || '{}');
              }
            });
            
            // Dispatch FSM event
            dispatchGlobalFsmEvent({ 
              type: result.status === 'success' ? 'FETCH_DATA_SUCCESS' : 'FETCH_DATA_FAILURE', 
              payload: result 
            });
            
            if (result.status !== 'success') {
              toast({ title: "Data Fetch Failed", description: result.message, variant: 'destructive' });
            }
            break;
          }
          
          case BusinessFsmState.CALCULATING_AI_TA: {
            console.log(`[${orchestratorLogPrefix}] Executing CALCULATING_AI_TA step`);
            
            const result = await analyzeTaAction({ 
              stockSnapshotJson: currentValues.contextStockSnapshotJson, 
              ticker: currentValues.activeTicker! 
            });
            
            startTransition(() => {
              if (result.status === 'success' && result.data) {
                setAiAnalyzedTaRequestJson(result.data.aiAnalyzedTaRequestJson);
                setAiAnalyzedTaJson(result.data.aiAnalyzedTaJson);
              } else if (result.status === 'error') {
                const errorJson = JSON.stringify({ 
                  error: result.message || 'AI TA analysis failed', 
                  details: result.error 
                });
                setAiAnalyzedTaRequestJson(result.data?.aiAnalyzedTaRequestJson || errorJson);
                setAiAnalyzedTaJson(errorJson);
              }
            });
            
            dispatchGlobalFsmEvent({ 
              type: result.status === 'success' ? 'AI_TA_SUCCESS' : 'AI_TA_FAILURE', 
              payload: result 
            });
            
            if (result.status !== 'success') {
              toast({ title: "AI TA Calculation Failed", description: result.message, variant: 'destructive' });
            }
            break;
          }
          
          case BusinessFsmState.GENERATING_KEY_TAKEAWAYS: {
            console.log(`[${orchestratorLogPrefix}] Executing GENERATING_KEY_TAKEAWAYS step`);
            
            const result = await performAiAnalysisAction({
              ticker: currentValues.activeTicker!, 
              stockSnapshotJson: currentValues.contextStockSnapshotJson, 
              standardTasJson: currentValues.contextStandardTasJson, 
              aiAnalyzedTaJson: currentValues.contextAiAnalyzedTaJson, 
              marketStatusJson: currentValues.contextMarketStatusJson
            });
            
            startTransition(() => {
              if (result.status === 'success' && result.data) {
                setAiKeyTakeawaysRequestJson(result.data.aiKeyTakeawaysRequestJson);
                setAiKeyTakeawaysJson(result.data.aiKeyTakeawaysJson);
              } else if (result.status === 'error') {
                const errorJson = JSON.stringify({ 
                  error: result.message || 'Key takeaways generation failed', 
                  details: result.error 
                });
                setAiKeyTakeawaysRequestJson(result.data?.aiKeyTakeawaysRequestJson || errorJson);
                setAiKeyTakeawaysJson(errorJson);
              }
            });
            
            dispatchGlobalFsmEvent({ 
              type: result.status === 'success' ? 'KEY_TAKEAWAYS_SUCCESS' : 'KEY_TAKEAWAYS_FAILURE', 
              payload: result 
            });
            
            if (result.status !== 'success') {
              toast({ title: "Pipeline Step Failed: AI Key Takeaways", description: result.message, variant: 'destructive' });
              console.error(`[${orchestratorLogPrefix}] Failed to generate AI Key Takeaways: ${result.message}`);
            }
            break;
          }
          
          case BusinessFsmState.ANALYZING_OPTIONS: {
            console.log(`[${orchestratorLogPrefix}] Executing ANALYZING_OPTIONS step`);
            
            const result = await performAiOptionsAnalysisAction({
              ticker: currentValues.activeTicker!, 
              stockSnapshotJson: currentValues.contextStockSnapshotJson, 
              optionsChainJson: currentValues.contextOptionsChainJson,
            });
            
            startTransition(() => {
              if (result.status === 'success' && result.data) {
                setAiOptionsAnalysisRequestJson(result.data.aiOptionsAnalysisRequestJson);
                setAiOptionsAnalysisJson(result.data.aiOptionsAnalysisJson);
              } else if (result.status === 'error') {
                const errorJson = JSON.stringify({ 
                  error: result.message || 'Options analysis failed', 
                  details: result.error 
                });
                setAiOptionsAnalysisRequestJson(result.data?.aiOptionsAnalysisRequestJson || errorJson);
                setAiOptionsAnalysisJson(errorJson);
              }
            });
            
            dispatchGlobalFsmEvent({ 
              type: result.status === 'success' ? 'OPTIONS_ANALYSIS_SUCCESS' : 'OPTIONS_ANALYSIS_FAILURE', 
              payload: result 
            });
            
            if (result.status !== 'success') {
              toast({ title: "Pipeline Step Failed: AI Options Analysis", description: result.message, variant: 'destructive' });
              console.error(`[${orchestratorLogPrefix}] Failed to generate AI Options Analysis: ${result.message}`);
            }
            break;
          }
          
          default: 
            // Explicitly do nothing for other states
            break;
        }
      } finally {
        orchestratorExecutingRef.current = false;
        previousFsmStateRef.current = globalFsmStateFromContext;
      }
    };

    runBusinessPipelineStep();

  }, [globalFsmStateFromContext, dispatchGlobalFsmEvent, toast, 
      setMarketStatusJson, setStockSnapshotJson, setStandardTasJson, setOptionsChainJson,
      setPolygonApiRequestLogJson, setPolygonApiResponseLogJson, setSelectedExpirationDate,
      setAiAnalyzedTaRequestJson, setAiAnalyzedTaJson, setAiKeyTakeawaysRequestJson,
      setAiKeyTakeawaysJson, setAiOptionsAnalysisRequestJson, setAiOptionsAnalysisJson]);

  // This component renders nothing - it's purely for business logic orchestration
  return null;
}