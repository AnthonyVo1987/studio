'use client';

/**
 * @fileOverview User Ticker Options Chain Table - Dynamic Ticker Component
 * 
 * This component is ticker-agnostic and works with any ticker symbol from
 * the user-ticker-analysis-context. It displays options chain data in a 
 * configurable table format for the currently selected ticker.
 * 
 * ARCHITECTURE PATTERN:
 * - Direct context consumption via useUserTickerAnalysis hook
 * - Safe JSON parsing with error handling
 * - Loading state derivation from FSM and data flags
 * - Dynamic ticker display with proper fallback handling
 * - Consistent error handling for cases with no ticker set
 * - Configurable table layout (side-by-side, top-bottom)
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUserTickerAnalysis } from '@/contexts/user-ticker-analysis-context';
import type { OptionsChainData, OptionsTableRow, StreamlinedOptionContract, StockSnapshotData } from '@/services/data-sources/types';
import { formatCurrency } from '@/lib/number-utils';
import { formatDisplayDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PENDING_STATUS_JSON_VARIANTS } from '@/lib/constants';
import { useQuickExport } from '@/hooks/use-export-actions';
import { getCallHeadersConfig, getPutHeadersConfig, getSingleTableHeadersConfig, type ColumnConfig } from '@/components/ui/table-config-factory';

// Using factory-generated configurations
const callHeadersConfig: ColumnConfig<StreamlinedOptionContract>[] = getCallHeadersConfig();
const putHeadersConfig: ColumnConfig<StreamlinedOptionContract>[] = getPutHeadersConfig();
const singleTableHeadersConfig: ColumnConfig<StreamlinedOptionContract>[] = getSingleTableHeadersConfig();

// Helper functions for JSON parsing and validation
interface OptionsChainParseResult {
  data: OptionsChainData | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
}

interface StockSnapshotParseResult {
  currentPrice: number | null;
  hasValidData: boolean;
}

function parseOptionsChainJson(optionsChainJson: string, ticker: string): OptionsChainParseResult {
  if (!optionsChainJson || optionsChainJson === '{}') {
    return {
      data: null,
      isLoading: false,
      isError: false,
      errorMessage: ticker 
        ? `No options chain data for ${ticker}. This data is fetched with "Get ${ticker} Stock Data".`
        : 'No options chain data. Select a ticker and fetch stock data.',
    };
  }

  if (PENDING_STATUS_JSON_VARIANTS.includes(optionsChainJson.trim())) {
    return {
      data: null,
      isLoading: true,
      isError: false,
      errorMessage: ticker ? `Loading ${ticker} options chain...` : 'Loading options chain...',
    };
  }

  if (optionsChainJson.includes('"status": "error"') || optionsChainJson.includes('"error":')) {
    try {
      const statusObj = JSON.parse(optionsChainJson);
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: statusObj.message || statusObj.error || `Error loading ${ticker || 'options'} data.`,
      };
    } catch (e) {
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: `Error loading ${ticker || 'options'} data (malformed error JSON).`,
      };
    }
  }

  if (optionsChainJson.includes('"status": "skipped"')) {
    try {
      const statusObj = JSON.parse(optionsChainJson);
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: statusObj.message || `${ticker || 'Options'} data loading was skipped.`,
      };
    } catch (e) {
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: `${ticker || 'Options'} data loading was skipped (malformed skipped JSON).`,
      };
    }
  }

  try {
    const data = JSON.parse(optionsChainJson) as OptionsChainData;
    if (data && typeof data === 'object' && !(data as any).error && Array.isArray(data.contracts)) {
      return {
        data,
        isLoading: false,
        isError: false,
        errorMessage: '',
      };
    } else {
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: `${ticker || 'Options'} data is malformed or incomplete.`,
      };
    }
  } catch (e) {
    return {
      data: null,
      isLoading: false,
      isError: true,
      errorMessage: `Failed to parse ${ticker || 'options'} data.`,
    };
  }
}

function parseStockSnapshotJson(stockSnapshotJson: string): StockSnapshotParseResult {
  if (!stockSnapshotJson || stockSnapshotJson === '{}') {
    return {
      currentPrice: null,
      hasValidData: false,
    };
  }

  try {
    if (!PENDING_STATUS_JSON_VARIANTS.includes(stockSnapshotJson.trim()) && 
        !stockSnapshotJson.includes('"status":') && 
        !stockSnapshotJson.includes('"error":')) {
      const parsedSnapshotData = JSON.parse(stockSnapshotJson) as StockSnapshotData;
      const currentPrice = parsedSnapshotData?.currentPrice ?? parsedSnapshotData?.day?.c ?? null;
      return {
        currentPrice,
        hasValidData: currentPrice !== null,
      };
    } else {
      return {
        currentPrice: null,
        hasValidData: false,
      };
    }
  } catch (e) {
    return {
      currentPrice: null,
      hasValidData: false,
    };
  }
}

// Render functions for table cells with consistent formatting
function renderCellValue(value: any, format: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return `${(value * 100).toFixed(2)}%`;
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date':
      return formatDisplayDate(value);
    default:
      return String(value);
  }
}

function renderTableRow(
  contract: StreamlinedOptionContract,
  config: ColumnConfig<StreamlinedOptionContract>[],
  currentPrice: number | null,
  key: string
): React.ReactNode {
  const isITM = currentPrice && contract.strike_price
    ? (contract.contract_type === 'call' ? currentPrice > contract.strike_price : currentPrice < contract.strike_price)
    : false;

  return (
    <TableRow key={key} className={cn(isITM && "bg-muted/50")}>
      {config.map((col) => (
        <TableCell key={col.key} className={col.className}>
          {renderCellValue(contract[col.dataKey], col.format)}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function UserTickerOptionsChainTable() {
  const userTickerState = useUserTickerAnalysis();
  const { toast } = useToast();
  const { handleCopyData, handleExportData } = useQuickExport();

  // Get current ticker for display
  const currentTicker = userTickerState.currentTicker || '';
  const displayTicker = currentTicker || 'No Ticker Selected';

  // Parse options chain data
  const optionsParseResult = parseOptionsChainJson(userTickerState.optionsChainJson, currentTicker);
  const stockSnapshotResult = parseStockSnapshotJson(userTickerState.stockSnapshotJson);

  // Derive overall loading state
  const isLoading = userTickerState.status === 'loading' || 
                   optionsParseResult.isLoading ||
                   (currentTicker && userTickerState.isTickerValid && !userTickerState.dataRetrievalComplete);

  // Get filtered contracts based on settings
  const getFilteredContracts = (contractType: 'call' | 'put' | 'both') => {
    if (!optionsParseResult.data?.contracts) return [];
    
    const filtered = contractType === 'both' 
      ? optionsParseResult.data.contracts
      : optionsParseResult.data.contracts.filter(c => c.contract_type === contractType);

    // Apply strike count limit
    return filtered.slice(0, userTickerState.strikeCount);
  };

  const callContracts = getFilteredContracts('call');
  const putContracts = getFilteredContracts('put');
  const allContracts = getFilteredContracts('both');

  // Export handlers
  const handleCopy = async () => {
    if (!optionsParseResult.data) {
      toast({
        title: 'No Data Available',
        description: `No options chain data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    await handleCopyData(
      optionsParseResult.data,
      `${displayTicker} Options Chain`,
      `${currentTicker || 'unknown'}-options-chain`
    );
  };

  const handleExport = () => {
    if (!optionsParseResult.data) {
      toast({
        title: 'No Data Available',
        description: `No options chain data available for ${displayTicker}.`,
        variant: 'destructive',
      });
      return;
    }

    handleExportData(
      optionsParseResult.data,
      `${displayTicker} Options Chain`,
      `${currentTicker || 'unknown'}-options-chain`
    );
  };

  // Render side-by-side table layout
  const renderSideBySideTable = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Options</CardTitle>
          <CardDescription>
            {callContracts.length} call contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {callHeadersConfig.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {callContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={callHeadersConfig.length} className="text-center text-muted-foreground">
                      {isLoading ? `Loading ${currentTicker} call options...` : 'No call options data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  callContracts.map((contract) =>
                    renderTableRow(
                      contract,
                      callHeadersConfig,
                      stockSnapshotResult.currentPrice,
                      `call-${contract.contract_id || contract.ticker}-${contract.strike_price}`
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Puts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Put Options</CardTitle>
          <CardDescription>
            {putContracts.length} put contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {putHeadersConfig.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {putContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={putHeadersConfig.length} className="text-center text-muted-foreground">
                      {isLoading ? `Loading ${currentTicker} put options...` : 'No put options data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  putContracts.map((contract) =>
                    renderTableRow(
                      contract,
                      putHeadersConfig,
                      stockSnapshotResult.currentPrice,
                      `put-${contract.contract_id || contract.ticker}-${contract.strike_price}`
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render top-bottom table layout
  const renderTopBottomTable = () => (
    <div className="space-y-6">
      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Options</CardTitle>
          <CardDescription>
            {callContracts.length} call contracts for {displayTicker}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {singleTableHeadersConfig.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {callContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={singleTableHeadersConfig.length} className="text-center text-muted-foreground">
                      {isLoading ? `Loading ${currentTicker} call options...` : 'No call options data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  callContracts.map((contract) =>
                    renderTableRow(
                      contract,
                      singleTableHeadersConfig,
                      stockSnapshotResult.currentPrice,
                      `call-${contract.contract_id || contract.ticker}-${contract.strike_price}`
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Puts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Put Options</CardTitle>
          <CardDescription>
            {putContracts.length} put contracts for {displayTicker}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {singleTableHeadersConfig.map((col) => (
                    <TableHead key={col.key} className={col.className}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {putContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={singleTableHeadersConfig.length} className="text-center text-muted-foreground">
                      {isLoading ? `Loading ${currentTicker} put options...` : 'No put options data'}
                    </TableCell>
                  </TableRow>
                ) : (
                  putContracts.map((contract) =>
                    renderTableRow(
                      contract,
                      singleTableHeadersConfig,
                      stockSnapshotResult.currentPrice,
                      `put-${contract.contract_id || contract.ticker}-${contract.strike_price}`
                    )
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {displayTicker} Options Chain
        </CardTitle>
        <CardDescription>
          {currentTicker 
            ? `Options contracts for ${currentTicker} - ${userTickerState.selectedExpirationDate || 'No expiration selected'}`
            : "Select a ticker symbol to view options chain"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={userTickerState.hasOptionsChainData ? "default" : "secondary"}>
                {userTickerState.hasOptionsChainData ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" />Data Available</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" />No Data</>
                )}
              </Badge>
              {isLoading && (
                <Badge variant="outline">Loading...</Badge>
              )}
              {!currentTicker && (
                <Badge variant="outline">No Ticker</Badge>
              )}
              {currentTicker && !userTickerState.isTickerValid && (
                <Badge variant="destructive">Invalid Ticker</Badge>
              )}
              {optionsParseResult.data && (
                <Badge variant="outline">
                  {allContracts.length} contracts
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!optionsParseResult.data}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!optionsParseResult.data}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* Settings Summary */}
          {currentTicker && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Option Type:</span>
                  <span className="ml-2 capitalize">{userTickerState.optionType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Strike Count:</span>
                  <span className="ml-2">{userTickerState.strikeCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Layout:</span>
                  <span className="ml-2 capitalize">{userTickerState.tableDisplayType.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="ml-2">
                    {stockSnapshotResult.currentPrice 
                      ? formatCurrency(stockSnapshotResult.currentPrice)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {optionsParseResult.isError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{optionsParseResult.errorMessage}</p>
            </div>
          )}

          {/* Options Chain Tables */}
          {optionsParseResult.data && !optionsParseResult.isError && (
            <>
              {userTickerState.tableDisplayType === 'side-by-side' 
                ? renderSideBySideTable() 
                : renderTopBottomTable()
              }
            </>
          )}

          {/* Empty State */}
          {!optionsParseResult.data && !optionsParseResult.isError && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              {!currentTicker 
                ? "Select a ticker symbol and fetch stock data to view options chain"
                : `No options chain data available for ${currentTicker}. Use "Get ${currentTicker} Stock Data" to fetch options data.`
              }
            </div>
          )}

          {/* Ticker Validation Error */}
          {userTickerState.tickerValidationError && (
            <div className="text-sm text-destructive">
              {userTickerState.tickerValidationError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}