"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface MarketDetailItem {
  label: string;
  value: string | null;
}

const renderDetailRow = (item: MarketDetailItem, index: number, isLoading: boolean) => {
  if (isLoading) {
    return (
      <TableRow key={`loading-spy-market-${index}`}>
        <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
          Waiting for SPY market data...
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

export function SpyMarketStatusDisplay() {
  // Static placeholder data - future task will connect to SPY context
  const marketData = {
    status: "Market data will be loaded here",
    isOpen: false,
    localDateTime: new Date().toISOString(),
    isDataReady: false
  };

  const isLoading = true; // Always loading for now since not connected to data

  const marketDetails: MarketDetailItem[] = [
    { label: "Market Status", value: marketData.status || "Unknown" },
    { label: "Is Open", value: marketData.isOpen ? "Yes" : "No" },
    { label: "Local Date/Time", value: marketData.localDateTime ? new Date(marketData.localDateTime).toLocaleString() : null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          SPY Market Status
        </CardTitle>
        <CardDescription>
          Current market status and trading hours for SPY
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={marketData.isOpen ? "default" : "secondary"}>
              {marketData.isOpen ? "Market Open" : "Market Closed"}
            </Badge>
            {isLoading && (
              <Badge variant="outline">Loading...</Badge>
            )}
          </div>

          {/* Market Details Table */}
          <Table>
            <TableBody>
              {marketDetails.map((item, index) => renderDetailRow(item, index, isLoading))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}