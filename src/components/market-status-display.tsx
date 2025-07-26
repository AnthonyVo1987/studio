"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useUIState } from "@/contexts/ui-state-context";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for market data...
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow key={item.label}>
      <TableCell className="font-medium w-1/3">{item.label}</TableCell>
      <TableCell>{item.value ?? "N/A"}</TableCell>
    </TableRow>
  );
};

export function MarketStatusDisplay() {
  const { currentSnapshot, loadingStates } = useUIState();

  // Derive values directly from UI snapshot
  const marketStatus = currentSnapshot.marketStatus;
  const isLoading = loadingStates.isFetchingData || !marketStatus.isDataReady;

  // Build details array from market status data
  const details: MarketDetailItem[] = [];
  
  if (marketStatus.isDataReady) {
    details.push(
      { label: "Market Status", value: marketStatus.status || "N/A" },
      { label: "Market Open", value: marketStatus.isOpen ? "Yes" : "No" },
      { label: "Server Time (ET)", value: marketStatus.localDateTime || "N/A" }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Status</CardTitle>
        <CardDescription>Current status of relevant markets and exchanges.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => renderDetailRow({label: "", value: null}, index, true))
            ) : details.length > 0 ? (
              details.map((item, index) => renderDetailRow(item, index, false))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                  No market status data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}