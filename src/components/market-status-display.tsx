
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from "@/components/ui/table";

interface MarketInfo {
  label: string;
  value: string;
}

const placeholderMarketInfo: MarketInfo[] = [
  { label: "Market", value: "NYSE" },
  { label: "Status", value: "Open" },
  { label: "Current Time (ET)", value: "10:35 AM" },
  { label: "Last Market Open", value: "2025-06-10 09:30 AM ET" },
  { label: "Last Market Close", value: "2025-06-09 04:00 PM ET" },
];

export function MarketStatusDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Status</CardTitle>
        <CardDescription>Current status of the primary market.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {placeholderMarketInfo.map((info) => (
              <TableRow key={info.label}>
                <TableCell className="font-medium w-1/3">{info.label}</TableCell>
                <TableCell>{info.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
