/**
 * @fileOverview Displays the raw JSON output of the Augmented TA Search.
 * This component is part of the decoupled architecture to isolate augmented search features.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useStockAnalysis } from '@/contexts/stock-analysis-context';

export const AugmentedTaRawDisplay: React.FC = () => {
  const { augmentedTaSearchJson } = useStockAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Augmented TA Search Output (Raw JSON)</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={augmentedTaSearchJson || ''}
          placeholder="Augmented TA search results will appear here in raw JSON format..."
          className="h-48 w-full"
          data-testid="augmented-ta-raw-json-textarea"
        />
      </CardContent>
    </Card>
  );
};
