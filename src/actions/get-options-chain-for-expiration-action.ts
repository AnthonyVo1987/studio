'use server';

import { getOptionsChainForDate } from '@/services/data-sources/adapters/polygon-adapter';

export interface GetOptionsChainForExpirationResult {
  optionsChainJson: string;
}

export interface GetOptionsChainForExpirationActionState {
  status: 'idle' | 'success' | 'error';
  data?: GetOptionsChainForExpirationResult;
  error?: string | null;
  message?: string | null;
}

interface GetOptionsChainForExpirationInputs {
  ticker: string;
  expirationDate: string;
}

export async function getOptionsChainForExpirationAction(
  payload: GetOptionsChainForExpirationInputs
): Promise<GetOptionsChainForExpirationActionState> {
  const { ticker, expirationDate } = payload;
  const actionLogPrefix = `[ServerAction:getOptionsChainForExpirationAction:Ticker:${ticker}:Exp:${expirationDate}]`;
  console.log(`${actionLogPrefix} Received request.`);

  if (!ticker || !expirationDate) {
    const errorMsg = 'Ticker and expiration date are required.';
    console.error(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return { status: 'error', error: errorMsg, message: 'Invalid input.' };
  }

  try {
    const optionsChainData = await getOptionsChainForDate(ticker, expirationDate);
    
    if (optionsChainData.error) {
        console.error(`${actionLogPrefix} Adapter returned an error: ${optionsChainData.error}`);
        throw new Error(optionsChainData.error);
    }
      
    const optionsChainJson = JSON.stringify(optionsChainData, null, 2);

    return {
      status: 'success',
      data: { optionsChainJson },
      message: `Successfully fetched options chain for ${ticker} on ${expirationDate}.`,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message,
      message: `Failed to fetch options chain for ${ticker}.`,
    };
  }
}
