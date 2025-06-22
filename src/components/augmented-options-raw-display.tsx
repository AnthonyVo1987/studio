/**
 * @fileOverview Displays the raw JSON output of the Augmented Options Search.
 * This component is part of the decoupled architecture to isolate augmented search features.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useStockAnalysis } from '@/contexts/stock-analysis-context';

export const AugmentedOptionsRawDisplay: React.FC = () => {
  const { augmentedOptionsSearchJson } = useStockAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Augmented Options Search Output (Raw JSON)</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={augmentedOptionsSearchJson || ''}
          placeholder="Augmented Options search results will appear here in raw JSON format..."
          className="h-48 w-full"
          data-testid="augmented-options-raw-json-textarea"
        />
      </CardContent>
    </Card>
  );
};
