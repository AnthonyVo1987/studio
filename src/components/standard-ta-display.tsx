
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";

interface TaIndicator {
  label: string;
  value: string;
}

const placeholderTaIndicators: TaIndicator[] = [
  { label: "RSI (14)", value: "65.30" },
  { label: "EMA (20)", value: "$117.50" },
  { label: "SMA (50)", value: "$115.20" },
  { label: "MACD (12,26,9)", value: "1.25 / 0.90 / 0.35" },
  { label: "VWAP (Day)", value: "$120.10" },
];

export function StandardTaDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard Technical Indicators</CardTitle>
        <CardDescription>Commonly used technical indicators for the stock.</CardDescription>
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
            {placeholderTaIndicators.map((indicator) => (
              <TableRow key={indicator.label}>
                <TableCell className="font-medium">{indicator.label}</TableCell>
                <TableCell className="text-right">{indicator.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
