
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/business-logic-context";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "./ui/separator";
import { copyToClipboard } from "@/lib/export-utils";


interface JsonDisplayAreaProps {
  title: string;
  jsonContent: string;
  description?: string;
}

function JsonDisplayArea({ title, jsonContent, description }: JsonDisplayAreaProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={jsonContent}
          className="h-32 font-code text-xs bg-muted/30"
          placeholder={`{ "status": "loading..." }`}
        />
      </CardContent>
    </Card>
  );
}

export function DebugTabContent() {
  const {
    polygonApiRequestLogJson,
    polygonApiResponseLogJson,
    marketStatusJson,
    stockSnapshotJson,
    standardTasJson,
    optionsChainJson,
    aiAnalyzedTaRequestJson, 
    aiAnalyzedTaJson,        
    aiOptionsAnalysisRequestJson, 
    aiOptionsAnalysisJson,
    aiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson,
    userInputAppDataChatRequestJson,
    userInputAppDataChatResponseJson,
    stockTraderTakeawaysRequestJson,
    stockTraderTakeawaysResponseJson,
    optionsTraderTakeawaysRequestJson,
    optionsTraderTakeawaysResponseJson,
    holisticTakeawaysRequestJson,
    holisticTakeawaysResponseJson,
    userInputWebSearchChatRequestJson,
    userInputWebSearchChatResponseJson,
    rawTaWebSearchRequestJson,
    rawTaWebSearchResponseJson,
    rawOptionsWebSearchRequestJson,
    rawOptionsWebSearchResponseJson,
    rawSupportResistanceWebSearchRequestJson,
    rawSupportResistanceWebSearchResponseJson
  } = useStockAnalysis();
  const { toast } = useToast();

  const safeJsonParse = (jsonStr: string, fallback: any = {}) => {
    try {
      return JSON.parse(jsonStr || '{}');
    } catch (e) {
      return fallback;
    }
  };

  const handleCopyAll = () => {
    // Create a comprehensive debug data object
    const allDebugData = {
      timestamp: new Date().toISOString(),
      polygonApiRequestLog: safeJsonParse(polygonApiRequestLogJson),
      polygonApiResponseLog: safeJsonParse(polygonApiResponseLogJson),
      marketStatus: safeJsonParse(marketStatusJson),
      stockSnapshot: safeJsonParse(stockSnapshotJson),
      standardTas: safeJsonParse(standardTasJson),
      optionsChain: safeJsonParse(optionsChainJson),
      aiAnalyzedTaRequest: safeJsonParse(aiAnalyzedTaRequestJson),
      aiAnalyzedTa: safeJsonParse(aiAnalyzedTaJson),
      aiOptionsAnalysisRequest: safeJsonParse(aiOptionsAnalysisRequestJson),
      aiOptionsAnalysis: safeJsonParse(aiOptionsAnalysisJson),
      aiKeyTakeawaysRequest: safeJsonParse(aiKeyTakeawaysRequestJson),
      aiKeyTakeaways: safeJsonParse(aiKeyTakeawaysJson),
      userInputAppDataChatRequest: safeJsonParse(userInputAppDataChatRequestJson),
      userInputAppDataChatResponse: safeJsonParse(userInputAppDataChatResponseJson),
      stockTraderTakeawaysRequest: safeJsonParse(stockTraderTakeawaysRequestJson),
      stockTraderTakeawaysResponse: safeJsonParse(stockTraderTakeawaysResponseJson),
      optionsTraderTakeawaysRequest: safeJsonParse(optionsTraderTakeawaysRequestJson),
      optionsTraderTakeawaysResponse: safeJsonParse(optionsTraderTakeawaysResponseJson),
      holisticTakeawaysRequest: safeJsonParse(holisticTakeawaysRequestJson),
      holisticTakeawaysResponse: safeJsonParse(holisticTakeawaysResponseJson),
      userInputWebSearchChatRequest: safeJsonParse(userInputWebSearchChatRequestJson),
      userInputWebSearchChatResponse: safeJsonParse(userInputWebSearchChatResponseJson),
      rawTaWebSearchRequest: safeJsonParse(rawTaWebSearchRequestJson),
      rawTaWebSearchResponse: safeJsonParse(rawTaWebSearchResponseJson),
      rawOptionsWebSearchRequest: safeJsonParse(rawOptionsWebSearchRequestJson),
      rawOptionsWebSearchResponse: safeJsonParse(rawOptionsWebSearchResponseJson),
      rawSupportResistanceWebSearchRequest: safeJsonParse(rawSupportResistanceWebSearchRequestJson),
      rawSupportResistanceWebSearchResponse: safeJsonParse(rawSupportResistanceWebSearchResponseJson),
    };
    
    const allDebugDataJson = JSON.stringify(allDebugData, null, 2);
    
    copyToClipboard(allDebugDataJson)
      .then((success) => {
        if (success) {
          toast({ title: "Copied to Clipboard", description: "All debug data copied successfully." });
        } else {
          toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy debug data. The copy operation returned false." });
          console.error(`[DebugTabContent:CopyAll] Failed to copy all debug data. copyToClipboard returned false`);
        }
      })
      .catch(err => {
        const errorMessage = (err as Error).message || 'Unknown error';
        console.error('[DebugTabContent] Error copying all debug data to clipboard:', err);
        toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy debug data: ${errorMessage}` });
        console.error(`[DebugTabContent:CopyAll] Error caught while trying to copy all debug data:`, errorMessage, err);
      });
  };

  const debugAreasConfig = [
    { title: "Polygon Adapter Input JSON", data: polygonApiRequestLogJson, description: "Input parameters passed to the main Polygon data fetching adapter function." },
    { title: "Polygon Adapter Output Summary JSON", data: polygonApiResponseLogJson, description: "Summary of data successfully fetched or errors from the Polygon adapter." },
    { title: "Market Status JSON", data: marketStatusJson },
    { title: "Stock Snapshot JSON", data: stockSnapshotJson },
    { title: "Standard Technical Indicators JSON", data: standardTasJson },
    { title: "Options Chain JSON", data: optionsChainJson },
    { title: "AI Analyzed TA Request JSON", data: aiAnalyzedTaRequestJson }, 
    { title: "AI Analyzed TA JSON", data: aiAnalyzedTaJson },               
    { title: "AI Options Analysis Request JSON", data: aiOptionsAnalysisRequestJson }, 
    { title: "AI Options Analysis JSON", data: aiOptionsAnalysisJson },
    { title: "AI Key Takeaways Request JSON", data: aiKeyTakeawaysRequestJson },
    { title: "AI Key Takeaways JSON", data: aiKeyTakeawaysJson },
    { title: "User Input App Data Chat Request", data: userInputAppDataChatRequestJson, description: "Request for interactive app data chat." },
    { title: "User Input App Data Chat Response", data: userInputAppDataChatResponseJson, description: "Response for interactive app data chat." },
    { title: "Stock Trader Takeaways Request", data: stockTraderTakeawaysRequestJson, description: "Request for the 'Stock Trader's Takeaways' chat prompt." },
    { title: "Stock Trader Takeaways Response", data: stockTraderTakeawaysResponseJson, description: "Response for the 'Stock Trader's Takeaways' chat prompt." },
    { title: "Options Trader Takeaways Request", data: optionsTraderTakeawaysRequestJson, description: "Request for the 'Options Trader's Takeaways' chat prompt." },
    { title: "Options Trader Takeaways Response", data: optionsTraderTakeawaysResponseJson, description: "Response for the 'Options Trader's Takeaways' chat prompt." },
    { title: "Holistic Takeaways Request", data: holisticTakeawaysRequestJson, description: "Request for the 'Holistic Takeaways' chat prompt." },
    { title: "Holistic Takeaways Response", data: holisticTakeawaysResponseJson, description: "Response for the 'Holistic Takeaways' chat prompt." },
    { title: "User Input Web Search Request JSON", data: userInputWebSearchChatRequestJson, description: "Request for user-driven (interactive) web search." },
    { title: "User Input Web Search Response JSON", data: userInputWebSearchChatResponseJson, description: "Response for user-driven (interactive) web search." },
    { title: "TA Web Search Request JSON", data: rawTaWebSearchRequestJson, description: "Request for automated TA web search." },
    { title: "TA Web Search Response JSON", data: rawTaWebSearchResponseJson, description: "Response for automated TA web search." },
    { title: "Options Web Search Request JSON", data: rawOptionsWebSearchRequestJson, description: "Request for automated Options web search." },
    { title: "Options Web Search Response JSON", data: rawOptionsWebSearchResponseJson, description: "Response for automated Options web search." },
    { title: "S/R Web Search Request JSON", data: rawSupportResistanceWebSearchRequestJson, description: "Request for S/R web search." },
    { title: "S/R Web Search Response JSON", data: rawSupportResistanceWebSearchResponseJson, description: "Response for S/R web search." },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Raw JSON data from APIs and AI flows. Client-side logs are in the Debug Logs tab.
            </CardDescription>
          </div>
          <Button onClick={handleCopyAll} variant="outline" className="flex items-center gap-2">
            <ClipboardCopy className="h-4 w-4" />
            Copy All Debug Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
          <div className="space-y-4">
            {debugAreasConfig.map((area) => (
              <JsonDisplayArea
                key={area.title}
                title={area.title}
                jsonContent={area.data}
                description={area.description}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
