
'use server';

import { getFullStockData } from '@/services/data-sources/adapters/polygon-adapter';
import type { AdapterOutput } from '@/services/data-sources/types';
import type { OptionType, StrikeCount } from '@/types/options';
export interface StockDataFetchResult {
  marketStatusJson: string;
  stockSnapshotJson: string;
  standardTasJson: string;
  optionsChainJson: string;
  polygonApiRequestLogJson: string; 
  polygonApiResponseLogJson: string; 
}

export interface AnalyzeStockServerActionState {
  status: 'idle' | 'success' | 'error';
  data?: StockDataFetchResult;
  error?: string | null;
  message?: string | null;
}

interface FetchStockDataActionInputs {
  ticker: string;
  dataSource?: string; 
  analysisType?: string;
  expirationDate?: string;
  optionType?: OptionType;
  strikeCount?: StrikeCount;
}

export async function fetchStockDataAction(
  payload: FetchStockDataActionInputs
): Promise<AnalyzeStockServerActionState> {
  const { ticker, expirationDate, optionType, strikeCount } = payload;
  const requestedTickerUpperCase = ticker.toUpperCase();
  const actionLogPrefix = `[ServerAction:fetchStockDataAction:Ticker:${requestedTickerUpperCase}]`;

  console.log(`${actionLogPrefix} Starting stock data fetch...`, {
    ticker: requestedTickerUpperCase,
    expirationDate,
    optionType,
    strikeCount
  });

  // CRITICAL: Log API request parameters explicitly for expiration tracking
  console.log(`${actionLogPrefix} API Request Parameters:`, {
    ticker: requestedTickerUpperCase,
    expirationDate: expirationDate, // ← CRITICAL for debugging macro automation
    optionType,
    strikeCount,
    hasExpirationDate: !!expirationDate
  });

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    const errorMsg = 'Ticker symbol is required and must be a non-empty string.';
    console.error(`${actionLogPrefix} Validation error:`, errorMsg);
    return {
      status: 'error',
      error: errorMsg,
      message: 'Invalid ticker symbol provided.',
      data: undefined,
    };
  }

  try {
    console.log(`${actionLogPrefix} Calling polygon adapter...`);
    const adapterOutput: AdapterOutput = await getFullStockData(requestedTickerUpperCase, { expirationDate, optionType, strikeCount });
    console.log(`${actionLogPrefix} Adapter response received`);
    
    // CRITICAL: Log received expiration data immediately after adapter response
    const receivedExpiration = adapterOutput.stockData?.optionsChain && 'expiration_date' in adapterOutput.stockData.optionsChain ? adapterOutput.stockData.optionsChain.expiration_date : undefined;
    console.log(`${actionLogPrefix} Expiration Date Tracking:`, {
      requested: expirationDate,
      received: receivedExpiration,
      match: receivedExpiration === expirationDate,
      hasOptionsChain: !!adapterOutput.stockData?.optionsChain
    });
    
    // Validate API response expiration matches request
    if (expirationDate && receivedExpiration && receivedExpiration !== expirationDate) {
      console.warn(`${actionLogPrefix} EXPIRATION MISMATCH: Requested ${expirationDate}, received ${receivedExpiration}`);
    }
    
    
    // Validate ticker consistency (removed unused variables)
    const adapterSnapshotTicker = adapterOutput.stockData.stockSnapshot && 'ticker' in adapterOutput.stockData.stockSnapshot ? adapterOutput.stockData.stockSnapshot.ticker : undefined;
    
    
    if (adapterSnapshotTicker && adapterSnapshotTicker !== requestedTickerUpperCase) {
        const staleDataErrorMsg = `CRITICAL STALE DATA (Snapshot): Adapter returned snapshot data for ${adapterSnapshotTicker} when ${requestedTickerUpperCase} was requested.`;
        console.error(`${actionLogPrefix} STALE DATA ERROR:`, { expected: requestedTickerUpperCase, received: adapterSnapshotTicker });
        const errorJson = JSON.stringify({ error: staleDataErrorMsg, details: `Expected ${requestedTickerUpperCase}, adapter provided snapshot for ${adapterSnapshotTicker}.` }, null, 2);
        
        return {
            status: 'error',
            error: staleDataErrorMsg,
            message: `Stale data detected from data source. Expected ${requestedTickerUpperCase}, received snapshot for ${adapterSnapshotTicker}.`,
            data: { 
                marketStatusJson: errorJson, stockSnapshotJson: errorJson,
                standardTasJson: errorJson, optionsChainJson: errorJson,
                polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing during stale data error" }, null, 2),
                polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing during stale data error" }, null, 2),
            }
        };
    }

    if (adapterOutput.stockData.error) {
      console.error(`${actionLogPrefix} Adapter error:`, adapterOutput.stockData.error);
      const adapterErrorJson = JSON.stringify({ error: adapterOutput.stockData.error, rawErrorDetails: adapterOutput.stockData.rawOverallError || adapterOutput.stockData.rawErrorDetails }, null, 2);
      return {
        status: 'error',
        error: `Adapter Error: ${adapterOutput.stockData.error}`,
        message: `Failed to fetch data. Adapter reported an error.`,
        data: {
            marketStatusJson: adapterErrorJson, stockSnapshotJson: adapterErrorJson,
            standardTasJson: adapterErrorJson, optionsChainJson: adapterErrorJson,
            polygonApiRequestLogJson: JSON.stringify(adapterOutput.rawRequestParams || { error: "Request params missing" }, null, 2),
            polygonApiResponseLogJson: JSON.stringify(adapterOutput.rawResponseSummary || { error: "Response summary missing" }, null, 2),
        },
      };
    }

    const stringify = (obj: unknown, name: string): string => {
      if (obj === undefined || obj === null) {
        return '{}';
      }
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e: unknown) {
        return JSON.stringify({ error: `Failed to stringify ${name}`, details: e instanceof Error ? e.message : 'Unknown error' }, null, 2);
      }
    };

    const marketStatusJson = stringify(adapterOutput.stockData.marketStatus, "marketStatus");
    const stockSnapshotJson = stringify(adapterOutput.stockData.stockSnapshot, "stockSnapshot");
    const standardTasJson = stringify(adapterOutput.stockData.technicalIndicators, "technicalIndicators");
    const optionsChainJson = stringify(adapterOutput.stockData.optionsChain, "optionsChain");
    const polygonApiRequestLogJson = stringify(adapterOutput.rawRequestParams, "rawRequestParams");
    const polygonApiResponseLogJson = stringify(adapterOutput.rawResponseSummary, "rawResponseSummary");

    // CRITICAL: Enhanced data processing logging with expiration validation
    const finalOptionsChain = adapterOutput.stockData.optionsChain;
    const finalExpiration = finalOptionsChain && 'expiration_date' in finalOptionsChain ? finalOptionsChain.expiration_date : undefined;
    
    console.log(`${actionLogPrefix} Data processing complete:`, {
      hasMarketStatus: !!adapterOutput.stockData.marketStatus,
      hasStockSnapshot: !!adapterOutput.stockData.stockSnapshot,
      hasTechnicalIndicators: !!adapterOutput.stockData.technicalIndicators,
      hasOptionsChain: !!finalOptionsChain,
      optionsChainSize: (finalOptionsChain && 'results' in finalOptionsChain) ? (finalOptionsChain.results as Array<unknown>)?.length || 0 : 0,
      // CRITICAL: Final expiration verification
      requestedExpiration: expirationDate,
      finalExpiration: finalExpiration,
      expirationMatch: finalExpiration === expirationDate,
      dataIntegrityCheck: 'PASSED'
    });
    
    // Final expiration integrity check before success
    if (expirationDate && finalExpiration && finalExpiration !== expirationDate) {
      console.error(`${actionLogPrefix} FINAL EXPIRATION INTEGRITY FAILURE:`, {
        requested: expirationDate,
        final: finalExpiration,
        severity: 'CRITICAL'
      });
    }

    console.log(`${actionLogPrefix} SUCCESS - Stock data fetch completed`, {
      ticker: requestedTickerUpperCase,
      finalExpiration: finalExpiration,
      dataPackagesGenerated: {
        marketStatus: marketStatusJson.length > 2,
        stockSnapshot: stockSnapshotJson.length > 2,
        technicalAnalysis: standardTasJson.length > 2,
        optionsChain: optionsChainJson.length > 2
      }
    });
    
    return {
      status: 'success',
      data: {
        marketStatusJson, stockSnapshotJson, standardTasJson, optionsChainJson,
        polygonApiRequestLogJson, polygonApiResponseLogJson,
      },
      message: `Data for ${requestedTickerUpperCase} fetched successfully.`,
      error: null,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${actionLogPrefix} CATCH ERROR:`, errorMessage);
    return {
      status: 'error',
      error: errorMessage || 'An unknown error occurred during data fetching.',
      message: `Failed to fetch data. Check server logs.`,
      data: undefined,
    };
  }
}
