
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { DebugLogCategory, debugLogCategoryLabels } from "@/lib/debug-log-types";

export function DebugSettingsCard() {
  const { debugLogConfig, setDebugLogCategoryEnabled, logDebug } = useStockAnalysis();

  const handleSwitchChange = (category: DebugLogCategory, checked: boolean) => {
    setDebugLogCategoryEnabled(category, checked);
    logDebug(DebugLogCategory.CONTEXT_INTERNALS, `Debug category '${debugLogCategoryLabels[category]}' ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Log Settings</CardTitle>
        <CardDescription>
          Toggle specific categories of client-side debug logs. Changes apply immediately.
          These settings only affect logs sent to the custom debug console via `logDebug()`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.values(DebugLogCategory).map((category) => (
          <div key={category} className="flex items-center justify-between space-x-2 p-2 border rounded-md">
            <Label htmlFor={`debug-switch-${category}`} className="flex-grow">
              {debugLogCategoryLabels[category] || category}
            </Label>
            <Switch
              id={`debug-switch-${category}`}
              checked={debugLogConfig[category] ?? false}
              onCheckedChange={(checked) => handleSwitchChange(category, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
