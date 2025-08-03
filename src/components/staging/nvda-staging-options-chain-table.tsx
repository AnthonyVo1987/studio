'use client';

/**
 * @fileOverview NVDA Staging Options Chain Table - Enterprise Experimental Component
 * 
 * Staging version of options chain table with orange/amber theming and staging context consumption.
 * Architecture Pattern: Direct staging context consumption with complex options data rendering.
 * 
 * REPLICATION PATTERN from baseline component:
 * 1. Adapted from nvda-options-chain-table.tsx for staging environment
 * 2. Updated imports: useNvdaAnalysis → useNvdaStagingAnalysis
 * 3. Updated component name: NvdaOptionsChainTable → NvdaStagingOptionsChainTable
 * 4. Updated loading text: "NVDA options data" → "NVDA staging options data"
 * 5. Added staging-specific orange/amber card styling and title suffix
 * 
 * STAGING ENHANCEMENTS:
 * - Orange/amber color scheme for staging differentiation
 * - "(Staging)" suffix in component title
 * - Staging context consumption via useNvdaStagingAnalysis()
 * - Identical options chain rendering with side-by-side and top-bottom layouts
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
import { Download, Copy } from 'lucide-react';
import { useNvdaStagingAnalysis } from '@/contexts/nvda-staging-analysis-context';
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

// Helper functions for JSON parsing and validation (identical to baseline)
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

function parseOptionsChainJson(optionsChainJson: string): OptionsChainParseResult {
  if (!optionsChainJson || optionsChainJson === '{}') {
    return {
      data: null,
      isLoading: false,
      isError: false,
      errorMessage: 'No options chain data. This data is fetched with "Get NVDA Stock Data".',
    };
  }

  if (PENDING_STATUS_JSON_VARIANTS.includes(optionsChainJson.trim() as any)) {
    return {
      data: null,
      isLoading: true,
      isError: false,
      errorMessage: 'Loading options chain...',
    };
  }

  if (optionsChainJson.includes('"status": "error"') || optionsChainJson.includes('"error":')) {
    try {
      const statusObj = JSON.parse(optionsChainJson);
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: statusObj.message || statusObj.error || 'Error loading options data.',
      };
    } catch (e) {
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: 'Error loading options data (malformed error JSON).',
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
        errorMessage: statusObj.message || 'Options data loading was skipped.',
      };
    } catch (e) {
      return {
        data: null,
        isLoading: false,
        isError: true,
        errorMessage: 'Options data loading was skipped (malformed skipped JSON).',
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
        errorMessage: 'Options data is malformed or incomplete.',
      };
    }
  } catch (e) {
    return {
      data: null,
      isLoading: false,
      isError: true,
      errorMessage: 'Failed to parse options data.',
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
    if (!PENDING_STATUS_JSON_VARIANTS.includes(stockSnapshotJson.trim() as any) && 
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

function calculateATMStrike(contracts: OptionsTableRow[], currentPrice: number | null, underlyingPrice?: number): number | null {
  if (!contracts || contracts.length === 0) {
    return null;
  }

  let priceToUse = currentPrice;
  if (priceToUse === null && underlyingPrice) {
    priceToUse = underlyingPrice;
  }

  if (priceToUse === null) {
    return null;
  }

  const atmStrike = contracts.reduce((prev, curr) => {
    return (Math.abs((curr.strike || 0) - priceToUse!) < Math.abs((prev.strike || 0) - priceToUse!)) ? curr : prev;
  }).strike;

  return atmStrike;
}

export function NvdaStagingOptionsChainTable() {
  const stagingState = useNvdaStagingAnalysis();
  const { toast } = useToast();

  const { 
    optionsChainJson, 
    stockSnapshotJson, 
    optionType, 
    tableDisplayType
  } = stagingState;
  
  // STAGING VERSION: Unified expiration access that prioritizes staging context
  const getActiveExpiration = React.useCallback(() => {
    // During staging macro execution, options should display data for the staging context's expiration
    // to prevent state contamination from UI changes
    
    // Check if there's an active staging macro context by looking for the staging macro state
    // This pattern allows the options table to stay synchronized with staging macro execution
    if (typeof window !== 'undefined') {
      // Look for staging macro execution context in the DOM (non-invasive approach)
      const stagingMacroIndicator = document.querySelector('[data-staging-macro-expiration]');
      if (stagingMacroIndicator) {
        const stagingMacroExpiration = stagingMacroIndicator.getAttribute('data-staging-macro-expiration');
        if (stagingMacroExpiration && stagingMacroExpiration !== 'null') {
          return stagingMacroExpiration;
        }
      }
    }
    
    // Fall back to staging UI context when no macro is executing
    return stagingState.selectedExpirationDate;
  }, [stagingState.selectedExpirationDate]);

  // Phase 3: Derived state calculations using helper functions (replaces useState hooks)
  const optionsParseResult = parseOptionsChainJson(optionsChainJson);
  const snapshotParseResult = parseStockSnapshotJson(stockSnapshotJson);
  
  // Direct derived values (no useState needed)
  const isLoadingState = optionsParseResult.isLoading;
  const isErrorState = optionsParseResult.isError;
  const errorOrSkippedMessageState = optionsParseResult.errorMessage;
  const parsedDataState = optionsParseResult.data;
  const currentPriceForATMState = snapshotParseResult.currentPrice;
  
  // Expensive calculation using useMemo (ATM strike calculation)
  const atmStrikeValueState = React.useMemo(() => {
    if (!parsedDataState?.contracts) return null;
    return calculateATMStrike(
      parsedDataState.contracts, 
      currentPriceForATMState, 
      parsedDataState.underlying_price ?? undefined
    );
  }, [parsedDataState?.contracts, currentPriceForATMState, parsedDataState?.underlying_price]);
  
  const showCalls = optionType === 'both' || optionType === 'calls';
  const showPuts = optionType === 'both' || optionType === 'puts';

  const displayTicker = parsedDataState?.ticker || (isLoadingState ? '' : 'N/A');
  // STAGING VERSION: Use unified expiration access for display consistency
  const activeExpiration = getActiveExpiration();
  const displayExpirationDate = parsedDataState?.expiration_date ? formatDisplayDate(parsedDataState.expiration_date) : (isLoadingState ? '' : 'N/A');
  const isUsingStagingMacroExpiration = activeExpiration !== stagingState.selectedExpirationDate;
  const contractsToDisplay = parsedDataState?.contracts || [];
  
  const isDataReadyForExport = !isLoadingState && !isErrorState && parsedDataState && (parsedDataState.contracts?.length || 0) > 0;

  const filenameTicker = parsedDataState?.ticker || 'NVDA';
  const filenameExpDate = parsedDataState?.expiration_date ? parsedDataState.expiration_date.replace(/-/g,'') : 'EXP';
  const exportActions = useQuickExport(
    parsedDataState || {},
    `${filenameTicker}_options_chain_${filenameExpDate}_staging`,
    'NVDA Options Chain (Staging)'
  );

  const handleExportOptionsJson = () => {
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'NVDA staging options chain data is not available for JSON export.' });
      return;
    }
    exportActions.download();
  };

  const handleCopyOptionsJson = async () => {
    if (!isDataReadyForExport || !parsedDataState) {
      toast({ variant: 'destructive', title: 'Data Not Ready', description: 'NVDA staging options chain data is not available for JSON copy.' });
      return;
    }
    await exportActions.copy();
  };
  
  const renderSideBySideTable = () => (
    <Table className="min-w-max text-xs">
        <TableHeader>
        <TableRow>
            {showCalls && <TableHead colSpan={callHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">CALLS</TableHead>}
            <TableHead className="text-center font-semibold text-base p-1.5 whitespace-nowrap bg-card border-l border-r border-b-2">STRIKE</TableHead>
            {showPuts && <TableHead colSpan={putHeadersConfig.length} className="text-center font-semibold text-base p-1.5 whitespace-nowrap border-b-2">PUTS</TableHead>}
        </TableRow>
        <TableRow>
            {showCalls && callHeadersConfig.slice().reverse().map((header) => (
            <TableHead key={`call-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                {header.label}
            </TableHead>
            ))}
            <TableHead className="p-1.5 whitespace-nowrap text-center bg-card border-l border-r text-muted-foreground">Price</TableHead>
            {showPuts && putHeadersConfig.map((header) => (
            <TableHead key={`put-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">
                {header.label}
            </TableHead>
            ))}
        </TableRow>
        </TableHeader>
        <TableBody>
          {contractsToDisplay.map((row: OptionsTableRow, index: number) => {
              const isATMRow = row.strike !== null && row.strike !== undefined && atmStrikeValueState !== null && row.strike === atmStrikeValueState;
              const rowClasses = cn(
                  'transition-colors',
                  isATMRow ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 font-semibold' :
                              (index % 2 !== 0 ? 'bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20' : 'hover:bg-muted/40 dark:hover:bg-muted/20')
              );
              return (
                  <TableRow key={`options-row-${row.strike}-${index}`} className={rowClasses}>
                      {showCalls && callHeadersConfig.slice().reverse().map((header) => (
                      <TableCell key={`call-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                          {header.formatter(row.call?.[header.key])}
                      </TableCell>
                      ))}
                      <TableCell className={cn(
                          'p-1.5 whitespace-nowrap text-center font-semibold border-l border-r',
                          isATMRow ? 'bg-primary/20 dark:bg-primary/30 text-primary-foreground' : (index % 2 !== 0 ? 'bg-muted/30 dark:bg-muted/15' : 'bg-card')
                      )}>
                      {formatCurrency(row.strike, '$', '-', true)}
                      </TableCell>
                      {showPuts && putHeadersConfig.map((header) => (
                      <TableCell key={`put-cell-${header.key}-${index}`} className="p-1.5 whitespace-nowrap text-center">
                          {header.formatter(row.put?.[header.key])}
                      </TableCell>
                      ))}
                  </TableRow>
              );
          })}
        </TableBody>
    </Table>
  );

  const renderTopBottomTable = (type: 'call' | 'put') => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">{type === 'call' ? 'Call Options' : 'Put Options'}</h3>
      <Table className="min-w-max text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="p-1.5 whitespace-nowrap text-left text-muted-foreground font-semibold">Strike</TableHead>
            {singleTableHeadersConfig.map(header => (
              <TableHead key={`${type}-tb-header-${header.key}`} className="p-1.5 whitespace-nowrap text-center text-muted-foreground">{header.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contractsToDisplay.map((row, index) => {
            const contract = row[type];
            if (!contract) return null;
            const isATMRow = row.strike === atmStrikeValueState;
            const rowClasses = cn(
              'transition-colors',
              isATMRow ? 'bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 font-semibold' :
                         (index % 2 !== 0 ? 'bg-muted/25 dark:bg-muted/10 hover:bg-muted/40 dark:hover:bg-muted/20' : 'hover:bg-muted/40 dark:hover:bg-muted/20')
            );
            return (
              <TableRow key={`${type}-tb-row-${row.strike}`} className={rowClasses}>
                <TableCell className="p-1.5 whitespace-nowrap text-left font-semibold">{formatCurrency(row.strike, '$', '-', true)}</TableCell>
                {singleTableHeadersConfig.map(header => (
                  <TableCell key={`${type}-tb-cell-${header.key}-${row.strike}`} className="p-1.5 whitespace-nowrap text-center">
                    {header.formatter(contract[header.key])}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderContent = () => {
    if (isLoadingState) {
      return <div className="p-4 text-center text-sm text-muted-foreground h-24 flex items-center justify-center">Waiting for NVDA staging options data...</div>;
    }
    if (isErrorState) {
      return <div className="text-center h-24 p-4 text-muted-foreground">{errorOrSkippedMessageState}</div>;
    }
    if (!parsedDataState || contractsToDisplay.length === 0) {
      return <div className="text-center h-24 p-4 text-muted-foreground">{errorOrSkippedMessageState || 'No NVDA staging option contracts found for this expiration and strike range.'}</div>;
    }

    if (tableDisplayType === 'top-bottom') {
      return (
        <div className="overflow-x-auto">
          {showCalls && renderTopBottomTable('call')}
          {showPuts && renderTopBottomTable('put')}
        </div>
      );
    }
    
    // Default to side-by-side
    return <div className="overflow-x-auto">{renderSideBySideTable()}</div>;
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-orange-900">NVDA Options Chain (Staging)</CardTitle>
                <CardDescription className="mt-1 text-orange-700">
                    {isLoadingState ? 'Waiting for NVDA staging options data...' : `NVDA options chain for ${displayTicker} - Expires: ${displayExpirationDate} - Staging Environment`}
                    {isUsingStagingMacroExpiration && (
                      <div className="mt-1 text-xs text-blue-600 font-medium">
                        🧪 Staging Macro Mode: Displaying data for {activeExpiration}
                      </div>
                    )}
                </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyOptionsJson} disabled={!isDataReadyForExport} title="Copy NVDA Staging Options Chain as JSON" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    <Copy className="mr-2 h-4 w-4" /> Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportOptionsJson} disabled={!isDataReadyForExport} title="Export NVDA Staging Options Chain as JSON" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    <Download className="mr-2 h-4 w-4" /> Export JSON
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}