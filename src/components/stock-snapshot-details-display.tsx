
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";

interface StockDetail {
  label: string;
  value: string;
}

const placeholderStockDetails: StockDetail[] = [
  { label: "Ticker", value: "NVDA" },
  { label: "Previous Close", value: "$118.00" },
  { label: "Open", value: "$119.00" },
  { label: "Day's High", value: "$121.50" },
  { label: "Day's Low", value: "$118.50" },
  { label: "Volume", value: "25,000,000" },
  { label: "Average Volume (10 day)", value: "30,500,000" },
];

export function StockSnapshotDetailsDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Snapshot Details</CardTitle>
        <CardDescription>Detailed information from the latest stock snapshot.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {placeholderStockDetails.map((detail) => (
              <TableRow key={detail.label}>
                <TableCell className="font-medium w-1/3">{detail.label}</TableCell>
                <TableCell>{detail.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
