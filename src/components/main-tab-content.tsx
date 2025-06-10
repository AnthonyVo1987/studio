
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KeyMetricsDisplay } from "@/components/key-metrics-display";
import { StockSnapshotDetailsDisplay } from "@/components/stock-snapshot-details-display";
import { MarketStatusDisplay } from "@/components/market-status-display";
import { StandardTaDisplay } from "@/components/standard-ta-display";
import { AiCalculatedTaDisplay } from "@/components/ai-calculated-ta-display";
import { AiKeyTakeawaysDisplay } from "@/components/ai-key-takeaways-display";
import { OptionsChainTable } from "@/components/options-chain-table"; // Added import

export function MainTabContent() {
  const handleAnalyzeStock = () => {
    console.log("Analyze Stock button clicked");
    // Logic to be implemented later
  };

  const handleAiFullAnalysis = () => {
    console.log("AI Full Stock Analysis button clicked");
    // Logic to be implemented later
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Analysis</CardTitle>
        <CardDescription>
          Enter a stock ticker and select a data source to begin your analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="ticker">Stock Ticker</Label>
              <Input id="ticker" defaultValue="NVDA" placeholder="e.g., AAPL, MSFT" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSource">Data Source</Label>
              <Select defaultValue="polygon">
                <SelectTrigger id="dataSource">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polygon">Polygon.io</SelectItem>
                  {/* Future data sources can be added here */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleAnalyzeStock} className="w-full sm:w-auto">
              Analyze Stock
            </Button>
            <Button onClick={handleAiFullAnalysis} variant="outline" className="w-full sm:w-auto">
              AI Full Stock Analysis
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <KeyMetricsDisplay />
          <StockSnapshotDetailsDisplay />
          <MarketStatusDisplay />
          <StandardTaDisplay />
          <AiCalculatedTaDisplay />
          <AiKeyTakeawaysDisplay />
          <OptionsChainTable /> {/* Replaced placeholder image with the component */}
        </div>
      </CardContent>
    </Card>
  );
}
