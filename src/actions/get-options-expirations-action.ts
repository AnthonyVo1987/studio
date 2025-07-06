'use server';

import { getExpirationDates } from '@/services/data-sources/adapters/polygon-adapter';

export interface GetOptionsExpirationsResult {
  expirationDates: string[];
}

export interface GetOptionsExpirationsActionState {
  status: 'idle' | 'success' | 'error';
  data?: GetOptionsExpirationsResult;
  error?: string | null;
  message?: string | null;
}

interface GetOptionsExpirationsInputs {
  ticker: string;
}

export async function getOptionsExpirationsAction(
  payload: GetOptionsExpirationsInputs
): Promise<GetOptionsExpirationsActionState> {
  const { ticker } = payload;
  const actionLogPrefix = `[ServerAction:getOptionsExpirationsAction:Ticker:${ticker}]`;
  console.log(`${actionLogPrefix} Received request.`);

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    const errorMsg = 'Ticker symbol is required.';
    console.error(`${actionLogPrefix} Validation Error: ${errorMsg}`);
    return { status: 'error', error: errorMsg, message: 'Invalid ticker symbol.' };
  }

  try {
    const dates = await getExpirationDates(ticker);
    return {
      status: 'success',
      data: { expirationDates: dates },
      message: `Found ${dates.length} expiration dates for ${ticker}.`,
    };
  } catch (error: any) {
    console.error(`${actionLogPrefix} CRITICAL Error: ${error.message}`);
    return {
      status: 'error',
      error: error.message,
      message: `Failed to fetch expiration dates for ${ticker}.`,
    };
  }
}
