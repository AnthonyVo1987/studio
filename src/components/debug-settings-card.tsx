
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { logSourceIds, logSourceLabels, type LogSourceId } from "@/lib/debug-log-types";

export function DebugSettingsCard() {
  const { 
    logSourceConfig, 
    setLogSourceEnabled, 
    enableAllLogSources,
    disableAllLogSources,
    logDebug 
  } = useStockAnalysis();

  const handleSwitchChange = (source: LogSourceId, checked: boolean) => {
    setLogSourceEnabled(source, checked);
    // logDebug is already called within setLogSourceEnabled in the context
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
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button 
            variant="outline" 
            onClick={() => {
              enableAllLogSources();
              logDebug('DebugSettingsCard', 'Enable All Sources button clicked.');
            }}
            className="w-full sm:w-auto"
          >
            Enable All Sources
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              disableAllLogSources();
              logDebug('DebugSettingsCard', 'Disable All Sources button clicked.');
            }}
            className="w-full sm:w-auto"
          >
            Disable All Sources
          </Button>
        </div>
        {logSourceIds.map((source) => (
          <div key={source} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
            <Label htmlFor={`debug-switch-${source}`} className="flex-grow">
              {logSourceLabels[source] || source}
            </Label>
            <Switch
              id={`debug-switch-${source}`}
              checked={logSourceConfig[source] ?? false}
              onCheckedChange={(checked) => handleSwitchChange(source, checked)}
              disabled={source === 'DebugConsole'} // Prevent disabling the console's own logs here
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
