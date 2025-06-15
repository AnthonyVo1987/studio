'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { useToast } from "@/hooks/use-toast";
import { DebugSettingsCard } from "./debug-settings-card";
import { Separator } from "./ui/separator";
import { copyToClipboard } from "@/lib/export-utils";


interface JsonDisplayAreaProps {
  title: string;
  jsonContent: string;
  onCopy: () => void;
  description?: string;
}

function JsonDisplayArea({ title, jsonContent, onCopy, description }: JsonDisplayAreaProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-1">{description}</CardDescription>}
        </div>
        <Button variant="outline" size="icon" onClick={onCopy} className="h-7 w-7">
          <ClipboardCopy className="h-4 w-4" />
          <span className="sr-only">Copy JSON for {title}</span>
        </Button>
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
    chatbotRequestJson,
    chatbotResponseJson,
    logDebug,
  } = useStockAnalysis();
  const { toast } = useToast();

  logDebug('DebugTabContent', "Rendering. Polygon API request log (start):", polygonApiRequestLogJson.substring(0,100));

  const handleCopy = (title: string, content: string) => {
    logDebug('DebugTabContent', `Attempting to copy JSON for: ${title}`);
    copyToClipboard(content)
      .then((success) => {
        if (success) {
          toast({ title: "Copied to Clipboard", description: `${title} JSON copied.` });
          logDebug('DebugTabContent', `Successfully copied ${title} JSON to clipboard.`);
        } else {
          toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy ${title} JSON. The copy operation returned false.` });
          logDebug('DebugTabContent', `Failed to copy ${title} JSON to clipboard. copyToClipboard returned false.`);
        }
      })
      .catch(err => {
        const errorMessage = (err as Error).message || 'Unknown error';
        console.error(`[DebugTabContent] Error copying ${title} JSON to clipboard:`, err);
        toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy ${title} JSON: ${errorMessage}` });
        logDebug('DebugTabContent', `Error caught while trying to copy ${title} JSON to clipboard:`, errorMessage, err);
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
    { title: "Chatbot Request JSON", data: chatbotRequestJson, description: "Chatbot Request JSON (includes interactive chat requests)." },
    { title: "Chatbot Response JSON", data: chatbotResponseJson, description: "Chatbot Response JSON (includes interactive chat responses)." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
        <CardDescription>
          Raw JSON data from APIs and AI flows. Client-side logs are in the Client Debug Console panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
          <div className="space-y-4">
            <DebugSettingsCard />
            <Separator className="my-6" />
            {debugAreasConfig.map((area) => (
              <JsonDisplayArea
                key={area.title}
                title={area.title}
                jsonContent={area.data}
                onCopy={() => handleCopy(area.title, area.data)}
                description={area.description}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
