
'use client'; 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy } from "lucide-react";
import { useStockAnalysis } from "@/contexts/stock-analysis-context"; // Import context hook
import { useToast } from "@/hooks/use-toast";


interface JsonDisplayAreaProps {
  title: string;
  jsonContent: string; 
  onCopy: () => void;
}

function JsonDisplayArea({ title, jsonContent, onCopy }: JsonDisplayAreaProps) { 
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
    aiCalculatedTaRequestJson,
    aiCalculatedTaJson,
    aiKeyTakeawaysRequestJson,
    aiKeyTakeawaysJson,
    chatbotRequestJson,
    chatbotResponseJson,
  } = useStockAnalysis();
  const { toast } = useToast();

  const handleCopy = (title: string, content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast({ title: "Copied to Clipboard", description: `${title} JSON copied.` });
      })
      .catch(err => {
        console.error(`Failed to copy ${title}: `, err);
        toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy ${title} JSON.` });
      });
  };

  const debugAreasConfig = [
    { title: "Polygon API Request Log JSON", data: polygonApiRequestLogJson },
    { title: "Polygon API Response Log JSON", data: polygonApiResponseLogJson },
    { title: "Market Status JSON", data: marketStatusJson },
    { title: "Stock Snapshot JSON", data: stockSnapshotJson },
    { title: "Standard Technical Indicators JSON", data: standardTasJson },
    { title: "Options Chain JSON", data: optionsChainJson },
    { title: "AI Calculated TA Request JSON", data: aiCalculatedTaRequestJson },
    { title: "AI Calculated TA JSON", data: aiCalculatedTaJson },
    { title: "AI Key Takeaways Request JSON", data: aiKeyTakeawaysRequestJson },
    { title: "AI Key Takeaways JSON", data: aiKeyTakeawaysJson },
    { title: "Chatbot Request JSON", data: chatbotRequestJson },
    { title: "Chatbot Response JSON", data: chatbotResponseJson },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
        <CardDescription>
          Raw JSON data from APIs and AI flows for debugging and verification. Scroll within cards to see full content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-20rem)] pr-4"> 
          <div className="space-y-4">
            {debugAreasConfig.map((area) => (
              <JsonDisplayArea
                key={area.title}
                title={area.title}
                jsonContent={area.data} 
                onCopy={() => handleCopy(area.title, area.data)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
