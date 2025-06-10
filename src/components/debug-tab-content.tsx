
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JsonDisplayAreaProps {
  title: string;
  placeholderJson: string;
}

function JsonDisplayArea({ title, placeholderJson }: JsonDisplayAreaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={placeholderJson}
          className="h-32 font-code text-xs bg-muted/30"
          placeholder={`{ "status": "loading..." }`}
        />
      </CardContent>
    </Card>
  );
}

export function DebugTabContent() {
  const placeholderJsonTemplate = (label: string) => `{
  "status": "placeholder data for ${label}"
}`;

  const debugAreas = [
    { title: "Polygon API Request Log JSON", placeholder: placeholderJsonTemplate("Polygon API Request Log") },
    { title: "Polygon API Response Log JSON", placeholder: placeholderJsonTemplate("Polygon API Response Log") },
    { title: "Market Status JSON", placeholder: placeholderJsonTemplate("Market Status") },
    { title: "Stock Snapshot JSON", placeholder: placeholderJsonTemplate("Stock Snapshot") },
    { title: "Standard Technical Indicators JSON", placeholder: placeholderJsonTemplate("Standard Technical Indicators") },
    { title: "Options Chain JSON", placeholder: placeholderJsonTemplate("Options Chain") },
    { title: "AI Calculated TA Request JSON", placeholder: placeholderJsonTemplate("AI Calculated TA Request") },
    { title: "AI Calculated TA JSON", placeholder: placeholderJsonTemplate("AI Calculated TA") },
    { title: "AI Key Takeaways Request JSON", placeholder: placeholderJsonTemplate("AI Key Takeaways Request") },
    { title: "AI Key Takeaways JSON", placeholder: placeholderJsonTemplate("AI Key Takeaways") },
    { title: "Chatbot Request JSON", placeholder: placeholderJsonTemplate("Chatbot Request") },
    { title: "Chatbot Response JSON", placeholder: placeholderJsonTemplate("Chatbot Response") },
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
        <ScrollArea className="h-[calc(100vh-20rem)] pr-4"> {/* Adjust height as needed */}
          <div className="space-y-4">
            {debugAreas.map((area) => (
              <JsonDisplayArea key={area.title} title={area.title} placeholderJson={area.placeholder} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
