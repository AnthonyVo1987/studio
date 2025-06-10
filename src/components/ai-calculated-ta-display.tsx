
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";

interface TaPoint {
  label: string;
  value: string;
}

const placeholderTaPoints: TaPoint[] = [
  { label: "Pivot Point (PP)", value: "150.00" },
  { label: "Support 1 (S1)", value: "148.50" },
  { label: "Support 2 (S2)", value: "147.25" },
  { label: "Support 3 (S3)", value: "145.75" },
  { label: "Resistance 1 (R1)", value: "151.75" },
  { label: "Resistance 2 (R2)", value: "153.00" },
  { label: "Resistance 3 (R3)", value: "154.50" },
];

export function AiCalculatedTaDisplay() {
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
            {placeholderTaPoints.map((point) => (
              <TableRow key={point.label}>
                <TableCell className="font-medium">{point.label}</TableCell>
                <TableCell className="text-right">{point.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
