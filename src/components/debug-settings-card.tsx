
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { logSourceIds, logSourceLabels, type LogSourceId } from "@/lib/debug-log-types";
import { Separator } from "@/components/ui/separator";

export function DebugSettingsCard() {
  const { 
    logSourceConfig, 
    setLogSourceEnabled, 
    enableAllLogSources,
    disableAllLogSources,
    isReducedStartupLoggingEnabled, // New state
    setReducedStartupLoggingEnabled, // New setter
    logDebug 
  } = useStockAnalysis();

  const handleSwitchChange = (source: LogSourceId, checked: boolean) => {
    setLogSourceEnabled(source, checked);
  };

  const handleStartupLogToggle = (checked: boolean) => {
    setReducedStartupLoggingEnabled(checked);
    logDebug('DebugSettingsCard', `Reduced startup logging toggled to: ${checked}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Debug Log Settings</CardTitle>
        <CardDescription>
          Configure client-side debug logging behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-md font-medium mb-2">Startup Logging</h4>
          <div className="flex items-center justify-between space-x-2 p-2 border rounded-md">
            <Label htmlFor="startup-log-toggle" className="flex-grow text-sm">
              Enable Reduced Logging During Initial App Startup
            </Label>
            <Switch
              id="startup-log-toggle"
              checked={isReducedStartupLoggingEnabled}
              onCheckedChange={handleStartupLogToggle}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 px-2">
            When enabled (default), suppresses non-critical logs during the initial application load to reduce console noise.
          </p>
        </div>

        <Separator />
        
        <div>
          <h4 className="text-md font-medium mb-3">Log Source Toggles</h4>
           <p className="text-xs text-muted-foreground mb-3">
            Toggle specific sources of client-side debug logs. These settings only affect logs shown in the custom debug console panel below.
            When the main "Enable & Show Client Debug Console" switch is activated, all sources below are turned ON by default (except OptionsChainTable).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                logDebug('DebugSettingsCard', 'Enable All Log Sources button clicked.');
                enableAllLogSources();
              }}
              className="w-full sm:w-auto"
            >
              Enable All Log Sources
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                logDebug('DebugSettingsCard', 'Disable All Log Sources button clicked.');
                disableAllLogSources();
              }}
              className="w-full sm:w-auto"
            >
              Disable All Sources (Except Console Itself)
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {logSourceIds.map((source) => (
              <div key={source} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
                  <Label htmlFor={`debug-switch-${source}`} className="flex-grow text-sm">
                  {logSourceLabels[source] || source}
                  </Label>
                  <Switch
                  id={`debug-switch-${source}`}
                  checked={logSourceConfig[source] ?? false}
                  onCheckedChange={(checked) => handleSwitchChange(source, checked)}
                  disabled={source === 'DebugConsole'} 
                  />
              </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

