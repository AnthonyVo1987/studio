
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Assuming data will conform to StreamlinedOptionContract keys (snake_case)
// This interface is for the placeholder data shape.
interface PlaceholderOptionContract {
  gamma?: string | number;
  iv?: string | number;
  percent_change?: string | number; // Note: key changed to snake_case
  bid?: string | number;
  ask?: string | number;
  last_price?: string | number; // Note: key changed to snake_case
  volume?: string | number;
  open_interest?: string | number; // Note: key changed to snake_case
  delta?: string | number;
}

interface OptionsRow {
  call?: PlaceholderOptionContract;
  strike: string | number;
  put?: PlaceholderOptionContract;
}

const placeholderOptionsData: OptionsRow[] = [
  {
    call: { gamma: "0.05", iv: "55.2%", percent_change: "+2.5%", bid: "2.50", ask: "2.55", last_price: "2.52", volume: "150", open_interest: "1200", delta: "0.65" },
    strike: "130.00",
    put: { delta: "-0.35", open_interest: "950", volume: "90", last_price: "0.83",  bid: "0.80", ask: "0.85", percent_change: "-1.2%", iv: "60.1%", gamma: "0.03" },
  },
  {
    call: { gamma: "0.06", iv: "53.0%", percent_change: "+1.8%", bid: "1.80", ask: "1.85", last_price: "1.83", volume: "220", open_interest: "1500", delta: "0.55" },
    strike: "125.00",
    put: { delta: "-0.45", open_interest: "1100", volume: "180", last_price: "1.23", bid: "1.20", ask: "1.25", percent_change: "-0.9%", iv: "58.5%", gamma: "0.04" },
  },
  {
    call: { gamma: "0.07", iv: "50.5%", percent_change: "+0.5%", bid: "1.15", ask: "1.20", last_price: "1.18", volume: "300", open_interest: "1800", delta: "0.45" },
    strike: "120.00",
    put: { delta: "-0.55", open_interest: "1300", volume: "250", last_price: "1.93", bid: "1.90", ask: "1.95", percent_change: "+0.3%", iv: "56.2%", gamma: "0.05" },
  },
   {
    strike: "115.00", // Example with only a put
    put: { delta: "-0.65", open_interest: "1000", volume: "120", last_price: "2.83", bid: "2.80", ask: "2.85", percent_change: "+1.5%", iv: "54.0%", gamma: "0.06" },
  },
    {
    call: { gamma: "0.04", iv: "57.2%", percent_change: "-0.5%", bid: "3.50", ask: "3.55", last_price: "3.52", volume: "100", open_interest: "800", delta: "0.75" },
    strike: "110.00", // Example with only a call
  },
];

interface OptionHeaderConfig {
  key: keyof PlaceholderOptionContract;
  label: string;
}

const callHeadersConfig: OptionHeaderConfig[] = [
  { key: "gamma", label: "Gamma" },
  { key: "iv", label: "IV" },
  { key: "percent_change", label: "% Chg" },
  { key: "bid", label: "Bid" },
  { key: "ask", label: "Ask" },
  { key: "last_price", label: "Last" },
  { key: "volume", label: "Volume" },
  { key: "open_interest", label: "Open Int" },
  { key: "delta", label: "Delta" },
];

// Puts headers are in mirrored order relative to strike
const putHeadersConfig: OptionHeaderConfig[] = [
  { key: "delta", label: "Delta" },
  { key: "open_interest", label: "Open Int" },
  { key: "volume", label: "Volume" },
  { key: "last_price", label: "Last" },
  { key: "bid", label: "Bid" },
  { key: "ask", label: "Ask" },
  { key: "percent_change", label: "% Chg" },
  { key: "iv", label: "IV" },
  { key: "gamma", label: "Gamma" },
];


export function OptionsChainTable() {
  const ticker = "NVDA"; // Placeholder
  const expirationDate = "2025-07-18"; // Placeholder

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Chain</CardTitle>
        <CardDescription>
          Options chain for {ticker} - Expires: {expirationDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto p-2 md:p-3"> {/* Reduced padding and added overflow */}
        <Table className="min-w-max text-xs"> {/* min-w-max to allow table to expand, text-xs for smaller font */}
          <TableHeader>
            <TableRow>
              <TableHead colSpan={callHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">CALLS</TableHead>
              <TableHead className="text-center font-semibold text-base p-1.5 whitespace-nowrap sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r border-b-2">STRIKE</TableHead>
              <TableHead colSpan={putHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">PUTS</TableHead>
            </TableRow>
            <TableRow>
              {callHeadersConfig.map((header) => (
                <TableHead key={`call-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                  {header.label}
                </TableHead>
              ))}
              <TableHead className="p-1.5 whitespace-nowrap text-center sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r text-muted-foreground">Price</TableHead>
              {putHeadersConfig.map((header) => (
                <TableHead key={`put-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholderOptionsData.map((row, index) => (
              <TableRow key={`options-row-${index}`}>
                {/* Calls Data */}
                {callHeadersConfig.map((header) => (
                  <TableCell key={`call-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                    {row.call?.[header.key] ?? "-"}
                  </TableCell>
                ))}

                {/* Strike Price */}
                <TableCell className="p-1.5 whitespace-nowrap text-center font-semibold sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r">
                  {typeof row.strike === 'number' ? row.strike.toFixed(2) : row.strike}
                </TableCell>

                {/* Puts Data */}
                {putHeadersConfig.map((header) => (
                  <TableCell key={`put-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                    {row.put?.[header.key] ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
