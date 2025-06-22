"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { Badge } from './ui/badge';

export function AugmentedOptionsRawDisplay() {
  const { augmentedOptionsSearchJson, logDebug } = useStockAnalysis();
  const componentName = 'AugmentedOptionsRawDisplay';

  // Component will now always render to be persistent on the UI for debugging.
  // The content of augmentedOptionsSearchJson (placeholder, pending, error, or data)
  // will be displayed in the Textarea directly.

  logDebug(componentName, 'Render', 'Rendering raw augmented options data box.');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Raw Augmented Options Search Output
          <Badge variant="outline">Web Search</Badge>
        </CardTitle>
        <CardDescription>
          This is the raw, unparsed JSON string returned by the augmented options search flow.
          Used for debugging the AI's direct output.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={augmentedOptionsSearchJson || ''}
          className="h-48 font-code text-xs bg-muted/30"
          placeholder="{...}"
        />
      </CardContent>
    </Card>
  );
}
