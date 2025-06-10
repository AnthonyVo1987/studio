
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KeyMetricProps {
  label: string;
  value: string;
  change?: number; // Optional change percentage
  icon?: React.ReactNode;
}

function KeyMetricCard({ label, value, change, icon }: KeyMetricProps) {
  let ChangeIcon = Minus;
  let changeColor = "text-muted-foreground";

  if (change && change > 0) {
    ChangeIcon = TrendingUp;
    changeColor = "text-green-500"; // Using a specific color for positive change for now
  } else if (change && change < 0) {
    ChangeIcon = TrendingDown;
    changeColor = "text-red-500"; // Using a specific color for negative change for now
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${changeColor} flex items-center`}>
            <ChangeIcon className="mr-1 h-4 w-4" />
            {change > 0 ? "+" : ""}
            {change.toFixed(2)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function KeyMetricsDisplay() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KeyMetricCard
        label="Ticker"
        value="NVDA"
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M4 4h16v16H4V4z"></path><path d="M9 9h6v6H9V9z"></path></svg>}
      />
      <KeyMetricCard
        label="Current Price"
        value="$120.50"
        icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}

      />
      <KeyMetricCard
        label="Day's Change"
        value="+1.25%"
        change={1.25}
      />
    </div>
  );
}
