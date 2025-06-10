
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Takeaway {
  category: string;
  sentiment: "bullish" | "bearish" | "neutral";
  text: string;
}

const placeholderTakeaways: Takeaway[] = [
  {
    category: "Price Action",
    sentiment: "bullish",
    text: "Price is showing strong upward movement, breaking key resistance levels.",
  },
  {
    category: "Trend",
    sentiment: "bullish",
    text: "The medium-term trend remains positive, supported by moving averages.",
  },
  {
    category: "Volatility",
    sentiment: "neutral",
    text: "Volatility is moderate, suggesting stable trading conditions for now.",
  },
  {
    category: "Momentum",
    sentiment: "bearish",
    text: "Short-term momentum indicators are showing signs of weakening.",
  },
  {
    category: "Patterns",
    sentiment: "neutral",
    text: "A potential consolidation pattern is forming on the daily chart.",
  },
];

const getSentimentClasses = (sentiment: Takeaway["sentiment"]): string => {
  switch (sentiment) {
    case "bullish":
      return "bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600";
    case "bearish":
      return "bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600";
    case "neutral":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600";
  }
};

export function AiKeyTakeawaysDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Key Takeaways</CardTitle>
        <CardDescription>Sentiment-focused insights based on current data analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {placeholderTakeaways.map((takeaway) => (
          <div key={takeaway.category} className="p-3 border rounded-md bg-card/60 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <h4 className="font-semibold text-md">{takeaway.category}</h4>
              <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 text-xs", getSentimentClasses(takeaway.sentiment))}>
                {takeaway.sentiment}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{takeaway.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
