import { formatCurrency, formatPercentage, formatCompactNumber, formatToTwoDecimals } from "@/lib/number-utils";
import type { StreamlinedOptionContract } from "@/services/data-sources/types";

export interface ColumnConfig<T = any> {
  key: keyof T;
  label: string;
  formatter: (value: any) => string;
  className?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableConfigOptions {
  defaultFormatter?: (value: any) => string;
  emptyValue?: string;
  sortable?: boolean;
}

export const createTableConfig = <T>(
  baseColumns: Partial<ColumnConfig<T>>[],
  options: TableConfigOptions = {}
): ColumnConfig<T>[] => {
  const { defaultFormatter = (v) => String(v || '-'), emptyValue = '-', sortable = true } = options;

  return baseColumns.map(col => ({
    sortable,
    formatter: defaultFormatter,
    className: '',
    width: 'auto',
    ...col,
  })) as ColumnConfig<T>[];
};

// Specialized formatters for options data
export const optionsFormatters = {
  price: (value: any) => formatCurrency(value, "$", "-"),
  priceWithDecimals: (value: any) => formatCurrency(value, "$", "-", true),
  percentage: (value: any) => formatPercentage(value, "-", false),
  percentageWithSign: (value: any) => formatPercentage(value, "-", true),
  volume: (value: any) => formatCompactNumber(value, "-"),
  openInterest: (value: any) => formatCompactNumber(value, "-"),
  twoDecimals: (value: any) => formatToTwoDecimals(value, "-"),
};

// Base option contract column definitions
const baseOptionColumns: Partial<ColumnConfig<StreamlinedOptionContract>>[] = [
  { key: "iv", label: "IV", formatter: optionsFormatters.percentage },
  { key: "percent_change", label: "% Chg", formatter: optionsFormatters.percentageWithSign },
  { key: "bid", label: "Bid", formatter: optionsFormatters.price },
  { key: "ask", label: "Ask", formatter: optionsFormatters.price },
  { key: "last_price", label: "Last", formatter: optionsFormatters.price },
  { key: "volume", label: "Volume", formatter: optionsFormatters.volume },
  { key: "open_interest", label: "Open Int", formatter: optionsFormatters.openInterest },
  { key: "delta", label: "Delta", formatter: optionsFormatters.twoDecimals },
  { key: "gamma", label: "Gamma", formatter: optionsFormatters.twoDecimals },
];

// Factory for options table configurations
export const createOptionsTableConfig = (type: 'calls' | 'puts' | 'single') => {
  if (type === 'calls') {
    // Calls displayed in reverse order for side-by-side view
    return createTableConfig(baseOptionColumns.slice().reverse(), {
      emptyValue: '-',
      sortable: true
    });
  }
  
  if (type === 'puts') {
    // Puts displayed in normal order for side-by-side view  
    return createTableConfig(baseOptionColumns, {
      emptyValue: '-',
      sortable: true
    });
  }
  
  // Single table configuration (for top-bottom view)
  return createTableConfig(baseOptionColumns, {
    emptyValue: '-',
    sortable: true
  });
};

// Pre-configured header configs for backward compatibility
export const getCallHeadersConfig = () => createOptionsTableConfig('calls');
export const getPutHeadersConfig = () => createOptionsTableConfig('puts');
export const getSingleTableHeadersConfig = () => createOptionsTableConfig('single');