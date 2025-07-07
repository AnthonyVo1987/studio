
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { getOptionsExpirationsAction } from '@/actions/get-options-expirations-action';
import { format } from 'date-fns';

export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;

interface StagingOptionsState {
  ticker: string;
  setTicker: (ticker: string) => void;
  expirationDates: string[];
  setExpirationDates: (dates: string[]) => void;
  selectedExpiration: string | undefined;
  setSelectedExpiration: (date: string | undefined) => void;
  optionType: OptionType;
  setOptionType: (type: OptionType) => void;
  strikeCount: StrikeCount;
  setStrikeCount: (count: StrikeCount) => void;
  optionsChainJson: string;
  setOptionsChainJson: (json: string) => void;
  requestJson: string;
  setRequestJson: (json: string) => void;
  isLoadingExpirations: boolean;
  setIsLoadingExpirations: (loading: boolean) => void;
  isLoadingOptions: boolean;
  setIsLoadingOptions: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const StagingOptionsContext = createContext<StagingOptionsState | undefined>(undefined);

export function StagingOptionsProvider({ children }: { children: ReactNode }) {
  const [ticker, setTicker] = useState('NVDA');
  const [expirationDates, setExpirationDates] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string | undefined>(undefined);
  const [optionType, setOptionType] = useState<OptionType>('both');
  const [strikeCount, setStrikeCount] = useState<StrikeCount>(20);
  const [optionsChainJson, setOptionsChainJson] = useState('{}');
  const [requestJson, setRequestJson] = useState('{}');
  const [isLoadingExpirations, setIsLoadingExpirations] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefaultExpiration = async () => {
      setIsLoadingExpirations(true);
      setError(null);
      
      const result = await getOptionsExpirationsAction({ ticker });

      if (result.status === 'success' && result.data && result.data.expirationDates.length > 0) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const allDates = result.data.expirationDates;
        
        let targetDate: string | undefined = undefined;

        // Find the first expiration date that is on or after today
        const firstAvailableIndex = allDates.findIndex(date => date >= todayStr);

        if (firstAvailableIndex !== -1) {
          const firstAvailableDate = allDates[firstAvailableIndex];
          // If today is an expiration day, we want the *next* one.
          if (firstAvailableDate === todayStr && allDates.length > firstAvailableIndex + 1) {
            targetDate = allDates[firstAvailableIndex + 1];
          } else {
            targetDate = firstAvailableDate;
          }
        }
        
        if (targetDate) {
          setExpirationDates([targetDate]);
          setSelectedExpiration(targetDate);
        } else {
          setError('Could not determine a valid upcoming expiration date.');
        }

      } else {
        setError(result.error || 'Failed to fetch any expiration dates.');
      }
      setIsLoadingExpirations(false);
    };

    fetchDefaultExpiration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount


  const value = {
    ticker, setTicker,
    expirationDates, setExpirationDates,
    selectedExpiration, setSelectedExpiration,
    optionType, setOptionType,
    strikeCount, setStrikeCount,
    optionsChainJson, setOptionsChainJson,
    requestJson, setRequestJson,
    isLoadingExpirations, setIsLoadingExpirations,
    isLoadingOptions, setIsLoadingOptions,
    error, setError
  };

  return (
    <StagingOptionsContext.Provider value={value}>
      {children}
    </StagingOptionsContext.Provider>
  );
}

export function useStagingOptions() {
  const context = useContext(StagingOptionsContext);
  if (context === undefined) {
    throw new Error('useStagingOptions must be used within a StagingOptionsProvider');
  }
  return context;
}
