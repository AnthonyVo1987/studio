
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

interface OptionContract {
  gamma: string;
  iv: string;
  percentChange: string;
  bid: string;
  ask: string;
  last: string;
  volume: string;
  openInt: string;
  delta: string;
}

interface OptionsRow {
  call?: OptionContract;
  strike: string;
  put?: OptionContract;
}

const placeholderOptionsData: OptionsRow[] = [
  {
    call: { gamma: "0.05", iv: "55.2%", percentChange: "+2.5%", bid: "2.50", ask: "2.55", last: "2.52", volume: "150", openInt: "1200", delta: "0.65" },
    strike: "130.00",
    put: { gamma: "0.03", iv: "60.1%", percentChange: "-1.2%", bid: "0.80", ask: "0.85", last: "0.83", volume: "90", openInt: "950", delta: "-0.35" },
  },
  {
    call: { gamma: "0.06", iv: "53.0%", percentChange: "+1.8%", bid: "1.80", ask: "1.85", last: "1.83", volume: "220", openInt: "1500", delta: "0.55" },
    strike: "125.00",
    put: { gamma: "0.04", iv: "58.5%", percentChange: "-0.9%", bid: "1.20", ask: "1.25", last: "1.23", volume: "180", openInt: "1100", delta: "-0.45" },
  },
  {
    call: { gamma: "0.07", iv: "50.5%", percentChange: "+0.5%", bid: "1.15", ask: "1.20", last: "1.18", volume: "300", openInt: "1800", delta: "0.45" },
    strike: "120.00",
    put: { gamma: "0.05", iv: "56.2%", percentChange: "+0.3%", bid: "1.90", ask: "1.95", last: "1.93", volume: "250", openInt: "1300", delta: "-0.55" },
  },
  {
    strike: "115.00",
    put: { gamma: "0.06", iv: "54.0%", percentChange: "+1.5%", bid: "2.80", ask: "2.85", last: "2.83", volume: "120", openInt: "1000", delta: "-0.65" },
  },
    {
    call: { gamma: "0.04", iv: "57.2%", percentChange: "-0.5%", bid: "3.50", ask: "3.55", last: "3.52", volume: "100", openInt: "800", delta: "0.75" },
    strike: "110.00",
  },
];

const optionContractHeaders = ["Gamma", "IV", "% Chg", "Bid", "Ask", "Last", "Volume", "Open Int", "Delta"];

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
      <CardContent className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {optionContractHeaders.map((header) => (
                <TableHead key={`call-${header}`} className="text-center">{header}</TableHead>
              ))}
              <TableHead className="text-center sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r">Strike</TableHead>
              {optionContractHeaders.map((header) => (
                <TableHead key={`put-${header}`} className="text-center">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {placeholderOptionsData.map((row, index) => (
              <TableRow key={index}>
                {/* Calls */}
                {optionContractHeaders.map((headerKey) => {
                  const key = headerKey.toLowerCase().replace(/[^a-z0-9]/gi, '') as keyof OptionContract;
                  return (
                    <TableCell key={`call-${headerKey}-${index}`} className="text-center">
                      {row.call?.[key] ?? "-"}
                    </TableCell>
                  );
                })}

                {/* Strike */}
                <TableCell className="text-center font-semibold sticky left-1/2 -translate-x-1/2 bg-card z-10 border-l border-r">
                  {row.strike}
                </TableCell>

                {/* Puts */}
                {optionContractHeaders.map((headerKey) => {
                   const key = headerKey.toLowerCase().replace(/[^a-z0-9]/gi, '') as keyof OptionContract;
                  return (
                    <TableCell key={`put-${headerKey}-${index}`} className="text-center">
                      {row.put?.[key] ?? "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
