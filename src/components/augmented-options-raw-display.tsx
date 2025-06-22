"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import { isDataReadyForProcessing } from '@/lib/data-validation-utils';
import { Badge } from './ui/badge';

export function AugmentedOptionsRawDisplay() {
  const { augmentedOptionsSearchJson, logDebug } = useStockAnalysis();
  const componentName = 'AugmentedOptionsRawDisplay';

  if (!isDataReadyForProcessing(augmentedOptionsSearchJson, logDebug, componentName, 'augmentedOptionsSearchJson', 'Validation')) {
    // Don't render anything if there's no ready data (initial state, pending, error, etc.)
    return null;
  }

  logDebug(componentName, 'Render', 'Rendering with raw augmented options data.');

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
