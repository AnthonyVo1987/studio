
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { logSourceIds, logSourceLabels, type LogSourceId } from "@/lib/debug-log-types";

export function DebugSettingsCard() {
  const { logSourceConfig, setLogSourceEnabled, logDebug } = useStockAnalysis();

  const handleSwitchChange = (source: LogSourceId, checked: boolean) => {
    setLogSourceEnabled(source, checked);
    logDebug('StockAnalysisContext', `Log source '${logSourceLabels[source]}' ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Log Settings</CardTitle>
        <CardDescription>
          Toggle specific sources of client-side debug logs. Changes apply immediately.
          These settings only affect logs sent to the custom debug console.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logSourceIds.map((source) => (
          <div key={source} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
            <Label htmlFor={`debug-switch-${source}`} className="flex-grow">
              {logSourceLabels[source] || source}
            </Label>
            <Switch
              id={`debug-switch-${source}`}
              checked={logSourceConfig[source] ?? false}
              onCheckedChange={(checked) => handleSwitchChange(source, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
