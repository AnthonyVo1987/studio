"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { Badge } from './ui/badge';

export function AugmentedTaRawDisplay() {
  const { augmentedTaSearchJson, logDebug } = useStockAnalysis();
  const componentName = 'AugmentedTaRawDisplay';

  // Component will now always render to be persistent on the UI for debugging.
  // The content of augmentedTaSearchJson (placeholder, pending, error, or data)
  // will be displayed in the Textarea directly.

  logDebug(componentName, 'Render', 'Rendering raw augmented TA data box.');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Raw Augmented TA Search Output
          <Badge variant="outline">Web Search</Badge>
        </CardTitle>
        <CardDescription>
          This is the raw, unparsed JSON string returned by the augmented TA search flow.
          Used for debugging the AI's direct output.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={augmentedTaSearchJson || ''}
          className="h-48 font-code text-xs bg-muted/30"
          placeholder="{...}"
        />
      </CardContent>
    </Card>
  );
}
