
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { useStockAnalysis } from "@/contexts/stock-analysis-context";
import type { CalculateAiTaOutput } from "@/ai/schemas/ai-calculated-ta-schemas";
import { formatToTwoDecimals } from "@/lib/number-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TaPointDisplayInfo {
  key: keyof CalculateAiTaOutput;
  label: string;
}

const taPointDefinitions: TaPointDisplayInfo[] = [
  { key: "pivotPoint", label: "Pivot Point (PP)" },
  { key: "support1", label: "Support 1 (S1)" },
  { key: "support2", label: "Support 2 (S2)" },
  { key: "support3", label: "Support 3 (S3)" },
  { key: "resistance1", label: "Resistance 1 (R1)" },
  { key: "resistance2", label: "Resistance 2 (R2)" },
  { key: "resistance3", label: "Resistance 3 (R3)" },
];

export function AiCalculatedTaDisplay() {
  const { aiCalculatedTaJson } = useStockAnalysis();

  let isLoading = false;
  let isError = false;
  let parsedTaData: CalculateAiTaOutput | null = null;

  if (
    aiCalculatedTaJson.includes('"status": "initializing"') ||
    aiCalculatedTaJson.includes('"status": "pending"')
  ) {
    isLoading = true;
  } else if (
    aiCalculatedTaJson.includes('"status": "error"') ||
    aiCalculatedTaJson.includes('"status": "skipped"')
  ) {
    isError = true;
  } else {
    try {
      const data = JSON.parse(aiCalculatedTaJson);
      if (data && typeof data === 'object' && !data.error && !data.status) {
        parsedTaData = data as CalculateAiTaOutput;
      } else {
        // If JSON has a status/error field even after initial checks, treat as error/no data
        isError = true; 
        if (data.status === 'pending' || data.status === 'initializing') isLoading = true;
      }
    } catch (e) {
      console.error("Failed to parse aiCalculatedTaJson in AiCalculatedTaDisplay:", e);
      isError = true;
    }
  }
  // If loading due to a status field in JSON, override isError for parsedData checks
  if (isLoading) isError = false;


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Calculated Technical Analysis</CardTitle>
        <CardDescription>Daily Pivot Points based on previous day HLC.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Indicator</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taPointDefinitions.map((pointDef) => {
              if (isLoading) {
                return (
                  <TableRow key={pointDef.key}>
                    <TableCell className="font-medium">
                      <Skeleton className="h-5 w-3/4" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-1/2 ml-auto" />
                    </TableCell>
                  </TableRow>
                );
              }

              const value = parsedTaData ? parsedTaData[pointDef.key] : null;
              const displayValue = isError || value === null || value === undefined
                ? "N/A"
                : formatToTwoDecimals(value as number, "0.00");

              return (
                <TableRow key={pointDef.key}>
                  <TableCell className="font-medium">{pointDef.label}</TableCell>
                  <TableCell className="text-right">{displayValue}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
