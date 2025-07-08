
'use client';

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { getOptionsExpirationsAction } from '@/actions/get-options-expirations-action';
import { format } from 'date-fns';

export type OptionType = 'both' | 'calls' | 'puts';
export type StrikeCount = 20 | 30 | 40;
export type TableDisplayType = 'side-by-side' | 'top-bottom';

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
  tableDisplayType: TableDisplayType;
  setTableDisplayType: (type: TableDisplayType) => void;
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
  const [tableDisplayType, setTableDisplayType] = useState<TableDisplayType>('side-by-side');
  const [optionsChainJson, setOptionsChainJson] = useState('{}');
  const [requestJson, setRequestJson] = useState('{}');
  const [isLoadingExpirations, setIsLoadingExpirations] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = {
    ticker, setTicker,
    expirationDates, setExpirationDates,
    selectedExpiration, setSelectedExpiration,
    optionType, setOptionType,
    strikeCount, setStrikeCount,
    tableDisplayType, setTableDisplayType,
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
