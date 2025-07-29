"use client";

/**
 * @fileOverview Base Options Chain Table Template
 * 
 * This template displays options chain data in a tabular format with
 * filtering and display options.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CandlestickChart, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

import type { TickerConfig, TickerContextResult, OptionType, StrikeCount, TableDisplayType } from '../types';

interface BaseOptionsChainTableProps<T extends TickerConfig> {
  config: T;
  context: TickerContextResult<T>;
}

interface OptionContract {
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  intrinsicValue: number;
  timeValue: number;
}

export function BaseOptionsChainTable<T extends TickerConfig>({
  config,
  context,
}: BaseOptionsChainTableProps<T>) {
  const state = context.hooks.useState();
  const dispatch = context.hooks.useDispatch();
  
  // Local display state
  const [displayMode, setDisplayMode] = useState<'all' | 'calls' | 'puts'>('all');

  // Safe JSON parsing for options chain data
  const optionsData = state.optionsChainJson ? (() => {
    try {
      const parsed = JSON.parse(state.optionsChainJson);
      
      return {
        underlyingPrice: parsed.underlying_price || parsed.underlyingPrice || 0,
        expirationDate: parsed.expiration_date || parsed.expirationDate || state.selectedExpirationDate,
        calls: parsed.calls || [],
        puts: parsed.puts || [],
        strikes: parsed.strikes || [],
        totalContracts: (parsed.calls?.length || 0) + (parsed.puts?.length || 0),
        isDataReady: state.hasOptionsChainData
      };
    } catch (e) {
      return {
        underlyingPrice: 0,
        expirationDate: state.selectedExpirationDate,
        calls: [],
        puts: [],
        strikes: [],
        totalContracts: 0,
        isDataReady: false
      };
    }
  })() : {
    underlyingPrice: 0,
    expirationDate: state.selectedExpirationDate,
    calls: [],
    puts: [],
    strikes: [],
    totalContracts: 0,
    isDataReady: false
  };

  const isLoading = state.status === 'loading' || !state.dataRetrievalComplete;
  const hasData = state.hasOptionsChainData && optionsData.isDataReady;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const getMoneyness = (strike: number, underlyingPrice: number, type: 'call' | 'put') => {
    if (type === 'call') {
      if (strike < underlyingPrice) return 'ITM'; // In the money
      if (strike === underlyingPrice) return 'ATM'; // At the money
      return 'OTM'; // Out of the money
    } else {
      if (strike > underlyingPrice) return 'ITM';
      if (strike === underlyingPrice) return 'ATM';
      return 'OTM';
    }
  };

  const getMoneynessColor = (moneyness: string) => {
    switch (moneyness) {
      case 'ITM': return 'text-green-600 bg-green-50';
      case 'ATM': return 'text-blue-600 bg-blue-50';
      case 'OTM': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600';
    }
  };

  const renderOptionsTable = (contracts: any[], type: 'calls' | 'puts') => {
    if (!contracts || contracts.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {type} data available
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Strike</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bid</TableHead>
              <TableHead>Ask</TableHead>
              <TableHead>Last</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Open Int</TableHead>
              <TableHead>IV</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Gamma</TableHead>
              <TableHead>Theta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract: any, index: number) => {
              const strike = contract.strike_price || contract.strike || 0;
              const moneyness = getMoneyness(strike, optionsData.underlyingPrice, type === 'calls' ? 'call' : 'put');
              
              return (
                <TableRow key={`${type}-${strike}-${index}`}>
                  <TableCell className="font-medium">
                    {formatCurrency(strike)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getMoneynessColor(moneyness)} variant="outline">
                      {moneyness}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(contract.bid || 0)}</TableCell>
                  <TableCell>{formatCurrency(contract.ask || 0)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(contract.last || contract.close || 0)}
                  </TableCell>
                  <TableCell>{formatNumber(contract.volume || 0)}</TableCell>
                  <TableCell>{formatNumber(contract.open_interest || contract.openInterest || 0)}</TableCell>
                  <TableCell>{formatPercent(contract.implied_volatility || contract.impliedVolatility || 0)}</TableCell>
                  <TableCell>
                    <span className={contract.delta > 0 ? 'text-green-600' : 'text-red-600'}>
                      {(contract.delta || 0).toFixed(3)}
                    </span>
                  </TableCell>
                  <TableCell>{(contract.gamma || 0).toFixed(3)}</TableCell>
                  <TableCell>
                    <span className="text-red-600">
                      {(contract.theta || 0).toFixed(3)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handleDisplayModeChange = (value: string) => {
    setDisplayMode(value as 'all' | 'calls' | 'puts');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-4 w-4" />
              {config.ticker} Options Chain
            </CardTitle>
            <CardDescription>
              Options contracts for {optionsData.expirationDate || 'selected expiration'}
              {optionsData.underlyingPrice > 0 && (
                <span className="ml-2">
                  • Underlying: {formatCurrency(optionsData.underlyingPrice)}
                </span>
              )}
            </CardDescription>
          </div>
          
          {hasData && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="display-mode" className="text-sm">Display:</Label>
                <Select value={displayMode} onValueChange={handleDisplayModeChange}>
                  <SelectTrigger id="display-mode" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Options</SelectItem>
                    <SelectItem value="calls">Calls Only</SelectItem>
                    <SelectItem value="puts">Puts Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {optionsData.totalContracts} contracts
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading {config.ticker} options chain...</p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-8">
            <CandlestickChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No options chain data available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Retrieve stock data to see options contracts
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Calls</p>
                <p className="text-lg font-semibold text-green-600">{optionsData.calls.length}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Puts</p>
                <p className="text-lg font-semibold text-red-600">{optionsData.puts.length}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Strike Range</p>
                <p className="text-lg font-semibold">
                  {optionsData.strikes.length > 0 
                    ? `${Math.min(...optionsData.strikes)}-${Math.max(...optionsData.strikes)}`
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Expiration</p>
                <p className="text-sm font-semibold">{optionsData.expirationDate}</p>
              </div>
            </div>

            {/* Options Tables */}
            {(displayMode === 'all' || displayMode === 'calls') && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Call Options ({optionsData.calls.length})
                </h4>
                {renderOptionsTable(optionsData.calls, 'calls')}
              </div>
            )}

            {(displayMode === 'all' || displayMode === 'puts') && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Put Options ({optionsData.puts.length})
                </h4>
                {renderOptionsTable(optionsData.puts, 'puts')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}