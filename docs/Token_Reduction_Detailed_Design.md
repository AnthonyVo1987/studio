# StockSage Codebase Consolidation & Token Reduction
## Complete Implementation Plan for AI Coding Agents

---

## 📋 Executive Summary

**Objective**: Reduce codebase token count by ~7,400 tokens (7% reduction) while improving code quality and maintainability.

**Current Status**: 104K tokens (52% of 200K limit) - Not urgent, but strategic value for maintainability.

**Target Savings**: 
- Phase 1: ~2,000 tokens (Quick Wins)
- Phase 2: ~4,000 tokens (Core Consolidation)  
- Phase 3: ~1,400 tokens (Advanced Optimization)

**Application**: StockSage - Next.js financial analysis tool with AI-powered insights
/mcp
---

## 🏗️ Codebase Architecture Overview

### Critical Architecture Knowledge for AI Agents

**StockSage** is a Next.js 15 application with the following architecture:

#### Core Technologies
- **Next.js App Router** with Server Components and Server Actions
- **React 18** with Context API and custom hooks
- **TypeScript** with Zod schemas for validation
- **ShadCN UI** components with Tailwind CSS
- **Google Gemini AI** via Genkit for analysis
- **Polygon.io API** for financial data

#### State Management Architecture (CRITICAL - DO NOT MODIFY)
The application uses a **deterministic handler pattern** that is explicitly marked as "non-removable":

1. **React Context** (`StockAnalysisContext`) - Central provider for global state
2. **Global FSM** (Finite State Machine) - Simple repository for state flags and context variables
3. **Deterministic Handlers** - Async functions in `main-tab-content.tsx` using `await` patterns
4. **FSM Feedback Loop** - After each `await`, events are dispatched to FSM for UI feedback

⚠️ **MANDATORY PRESERVATION**: The FSM feedback loop and deterministic handlers MUST remain intact. UI components MUST derive loading state from global FSM `fsmState`, not from data content parsing.

#### Key Files to Understand
- `src/contexts/stock-analysis-context.tsx` - Global state provider
- `src/components/main-tab-content.tsx` - Primary orchestration logic
- `src/actions/` - Server Actions for data fetching
- `src/ai/flows/` - Genkit AI flows
- `src/config/app-metadata.json` - Single source of truth for app version

---

## 🔧 AI Agent Operating Procedures

### Mandatory Compliance Requirements

All AI Coding Agents MUST follow these procedures from the StockSage README:

#### 3. Version Management
- User provides exact new version (e.g., `v3.w.x.y.(z+1)`)
- AI MUST update `src/config/app-metadata.json` with new version
- Format: `appVersion` and `lastUpdatedTimestamp` (ISO 8601)

#### 4. Documentation Policy
- **NO documentation updates** unless explicitly requested
- Focus ONLY on code consolidation
- Preserve all existing functionality

#### 5. Error Handling Requirements
- Maintain ALL existing error handling patterns
- Preserve FSM state feedback mechanisms
- Test changes against existing behavior

---

## 📁 Phase 1: Quick Wins Implementation
**Estimated Time**: 8 hours | **Token Savings**: ~2,000 tokens

### Phase 1 new Version metadata: v3.7.1.0

### Background Context
Phase 1 focuses on low-risk, high-impact changes that remove redundancy without affecting core logic. These changes are safe because they don't modify the state management architecture or data flow patterns.

### 1.1 Remove Dead Code and Unused Imports

#### Step-by-Step Instructions:

**Step 1**: Audit all TypeScript files for unused imports
```bash
# Search pattern for AI agents
grep -r "^import.*from" src/ | grep -E "(unused|never referenced)"
```

**Step 2**: Common unused imports to remove:
- Unused React hooks (`useState`, `useEffect`, etc.)
- Unused TypeScript type imports  
- Unused utility functions
- Commented-out import statements

**Example Before/After**:
```typescript
// BEFORE - Multiple unused imports
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Copy, FileText, BarChart } from 'lucide-react'
import { logDebug } from '@/lib/debug-logger'
import type { StockAnalysisData } from '@/types'

// AFTER - Only used imports
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Copy } from 'lucide-react'
```

### 1.2 Consolidate PENDING_STATUS_JSON_VARIANTS

#### Current Problem:
The same pending status constants are duplicated across 6+ display components:

```typescript
// Duplicated in every component
const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "processing..." }',
  '{ "status": "analyzing..." }',
  '{ "status": "loading..." }'
]
```

#### Solution Implementation:

**Step 1**: Create shared constants file:
```typescript
// src/lib/constants.ts - NEW FILE
export const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "processing..." }',
  '{ "status": "analyzing..." }',
  '{ "status": "loading..." }'
] as const

export const ERROR_STATUS_JSON_VARIANTS = [
  '{ "status": "error" }',
  '{ "error": "',
  '"error":'
] as const

export const SUCCESS_STATUS_INDICATORS = [
  '"takeaways"',
  '"analysis"',
  '"summary"'
] as const
```

**Step 2**: Update all display components:
```typescript
// BEFORE - In each component file
const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  // ... duplicated constants
]

// AFTER - Import shared constants
import { PENDING_STATUS_JSON_VARIANTS, ERROR_STATUS_JSON_VARIANTS } from '@/lib/constants'
```

**Files to Update**:
- `src/components/ai-key-takeaways-display.tsx`
- `src/components/options-chain-display.tsx`
- `src/components/stock-snapshot-display.tsx`
- `src/components/ai-analysis-display.tsx`
- (All other display components with status validation)

### 1.3 Create Shared Export/Copy Utilities

#### Current Problem:
Repetitive export/copy button implementations across multiple components.

#### Solution Implementation:

**Step 1**: Create export utilities hook:
```typescript
// src/hooks/use-export-actions.ts - NEW FILE
import { useCallback } from 'react'

interface ExportData {
  data: any
  filename: string
  label: string
}

export const useExportActions = () => {
  const copyToClipboard = useCallback(async (data: any, label: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      // Use existing toast/notification system if available
      console.log(`${label} copied to clipboard`)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [])

  const downloadAsJson = useCallback((data: any, filename: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Failed to download JSON:', error)
      return false
    }
  }, [])

  const exportActions = useCallback((exportData: ExportData) => ({
    copy: () => copyToClipboard(exportData.data, exportData.label),
    download: () => downloadAsJson(exportData.data, exportData.filename)
  }), [copyToClipboard, downloadAsJson])

  return { copyToClipboard, downloadAsJson, exportActions }
}
```

**Step 2**: Update components to use shared hook:
```typescript
// BEFORE - Repetitive implementation in each component
const handleCopyJson = async () => {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(jsonString)
    console.log('Copied to clipboard')
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

// AFTER - Use shared hook
import { useExportActions } from '@/hooks/use-export-actions'

const { exportActions } = useExportActions()
const { copy, download } = exportActions({
  data: displayData,
  filename: 'key-takeaways',
  label: 'Key Takeaways'
})
```

### 1.4 Simplify Verbose Logging

#### Current Problem:
Overly verbose debug logging that increases token count without adding value.

#### Solution Implementation:

**Step 1**: Create logging utility with levels:
```typescript
// src/lib/logger.ts - NEW FILE
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogConfig {
  level: LogLevel
  enabledInProduction: boolean
}

const DEFAULT_CONFIG: LogConfig = {
  level: 'info',
  enabledInProduction: false
}

export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '')
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  }
}
```

**Step 2**: Replace verbose logging patterns:
```typescript
// BEFORE - Verbose logging
console.log(`[StockAnalysisContext] Setting polygon API request log JSON to:`, json)
console.log(`[StockAnalysisContext] Current state before update:`, currentState)
console.log(`[StockAnalysisContext] Updated state after setting:`, newState)

// AFTER - Concise logging  
logger.debug('Polygon API request updated', { length: json.length })
```

---

## 🔧 Phase 2: Core Consolidation Implementation
**Estimated Time**: 14 hours | **Token Savings**: ~4,000 tokens

### Phase 2 new Version metadata: v3.7.2.0

### Background Context
Phase 2 addresses the core redundancy patterns that affect the application's state management and data handling. These changes require careful attention to preserve the FSM feedback loop and deterministic handler patterns.

### 2.1 Create useJsonDataState Custom Hook

#### Current Problem:
Every data display component has 50-100 lines of similar state management logic for JSON parsing, loading states, and error handling.

#### Solution Implementation Using Modern React Patterns:

**Step 1**: Create the custom hook with proper TypeScript and modern patterns:
```typescript
// src/hooks/use-json-data-state.ts - NEW FILE
import { useState, useEffect, useCallback, useMemo } from 'react'
import { PENDING_STATUS_JSON_VARIANTS, ERROR_STATUS_JSON_VARIANTS } from '@/lib/constants'

interface JsonDataState<T = any> {
  data: T | null
  isLoading: boolean
  isError: boolean
  isPending: boolean
  isEmpty: boolean
  rawJson: string
}

interface UseJsonDataStateOptions {
  validateData?: (data: any) => boolean
  defaultValue?: any
  enableLogging?: boolean
}

export const useJsonDataState = <T = any>(
  jsonString: string,
  options: UseJsonDataStateOptions = {}
): JsonDataState<T> => {
  const { validateData, defaultValue = null, enableLogging = false } = options
  
  const [parsedData, setParsedData] = useState<T | null>(defaultValue)
  const [parseError, setParseError] = useState<Error | null>(null)

  // Memoized status checks for performance
  const statusChecks = useMemo(() => ({
    isPending: PENDING_STATUS_JSON_VARIANTS.some(variant => 
      jsonString.includes(variant)
    ),
    isError: ERROR_STATUS_JSON_VARIANTS.some(variant => 
      jsonString.includes(variant)
    ) || parseError !== null,
    isEmpty: !jsonString || jsonString.trim() === '' || jsonString === '{}'
  }), [jsonString, parseError])

  // Parse JSON with error handling
  useEffect(() => {
    if (statusChecks.isEmpty || statusChecks.isPending) {
      setParsedData(defaultValue)
      setParseError(null)
      return
    }

    try {
      const parsed = JSON.parse(jsonString)
      
      // Optional data validation
      if (validateData && !validateData(parsed)) {
        throw new Error('Data validation failed')
      }
      
      setParsedData(parsed)
      setParseError(null)
      
      if (enableLogging) {
        console.debug('JSON parsed successfully', { keys: Object.keys(parsed || {}) })
      }
    } catch (error) {
      setParseError(error as Error)
      setParsedData(defaultValue)
      
      if (enableLogging) {
        console.error('JSON parse error:', error)
      }
    }
  }, [jsonString, validateData, defaultValue, enableLogging, statusChecks.isEmpty, statusChecks.isPending])

  return {
    data: parsedData,
    isLoading: statusChecks.isPending,
    isError: statusChecks.isError,
    isPending: statusChecks.isPending,
    isEmpty: statusChecks.isEmpty,
    rawJson: jsonString
  }
}

// Specialized hook for components that need FSM state integration
export const useJsonDataStateWithFsm = <T = any>(
  jsonString: string,
  fsmState: string,
  options: UseJsonDataStateOptions = {}
): JsonDataState<T> & { fsmLoading: boolean } => {
  const jsonState = useJsonDataState<T>(jsonString, options)
  
  // Derive loading state from FSM as required by architecture
  const fsmLoading = fsmState.includes('LOADING') || fsmState.includes('PROCESSING')
  
  return {
    ...jsonState,
    isLoading: fsmLoading || jsonState.isLoading,
    fsmLoading
  }
}
```

**Step 2**: Update display components to use the hook:
```typescript
// BEFORE - Repetitive logic in every component (50-100 lines)
const AiKeyTakeawaysDisplay: React.FC<Props> = ({ aiKeyTakeawaysJson, fsmState }) => {
  const [displayData, setDisplayData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    // Check if pending...
    const isPending = PENDING_STATUS_JSON_VARIANTS.some(variant => 
      aiKeyTakeawaysJson.includes(variant)
    )
    
    if (isPending) {
      setIsLoading(true)
      setIsError(false)
      return
    }

    // Parse JSON...
    try {
      const parsed = JSON.parse(aiKeyTakeawaysJson)
      setDisplayData(parsed)
      setIsLoading(false)
      setIsError(false)
    } catch (error) {
      setIsError(true)
      setIsLoading(false)
    }
  }, [aiKeyTakeawaysJson])

  // Derive loading from FSM state...
  const isActuallyLoading = fsmState.includes('LOADING') || isLoading
  
  // ... rest of component logic
}

// AFTER - Clean implementation using custom hook (5-10 lines)
import { useJsonDataStateWithFsm } from '@/hooks/use-json-data-state'

const AiKeyTakeawaysDisplay: React.FC<Props> = ({ aiKeyTakeawaysJson, fsmState }) => {
  const { data: displayData, isLoading, isError, isEmpty } = useJsonDataStateWithFsm(
    aiKeyTakeawaysJson, 
    fsmState,
    { enableLogging: process.env.NODE_ENV === 'development' }
  )

  // ... rest of component logic focuses on rendering
}
```

### 2.2 Consolidate Context Setter Boilerplate

#### Current Problem:
The `stock-analysis-context.tsx` file has 20+ nearly identical setter functions.

#### Solution Implementation Using Factory Pattern:

**Step 1**: Create setter factory utility:
```typescript
// src/contexts/context-setter-factory.ts - NEW FILE
import { Dispatch, SetStateAction } from 'react'

export type JsonSetter = (json: string) => void

interface SetterFactoryOptions {
  enableLogging?: boolean
  validator?: (json: string) => boolean
}

export const createJsonSetter = (
  internalSetter: Dispatch<SetStateAction<string>>,
  fieldName: string,
  options: SetterFactoryOptions = {}
): JsonSetter => {
  const { enableLogging = false, validator } = options
  
  return (json: string) => {
    try {
      // Optional validation
      if (validator && !validator(json)) {
        console.warn(`Invalid JSON for ${fieldName}:`, json.substring(0, 100))
        return
      }
      
      // Update state
      internalSetter(json)
      
      // Optional logging
      if (enableLogging) {
        console.debug(`Updated ${fieldName}`, { 
          length: json.length, 
          isEmpty: !json || json.trim() === '' 
        })
      }
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error)
    }
  }
}

// Batch setter creator for multiple related fields
export const createSetterBatch = (
  setters: Record<string, Dispatch<SetStateAction<string>>>,
  options: SetterFactoryOptions = {}
): Record<string, JsonSetter> => {
  return Object.entries(setters).reduce((acc, [key, setter]) => {
    acc[key] = createJsonSetter(setter, key, options)
    return acc
  }, {} as Record<string, JsonSetter>)
}
```

**Step 2**: Refactor stock-analysis-context.tsx:
```typescript
// BEFORE - 20+ repetitive setter functions
const StockAnalysisProvider: React.FC<Props> = ({ children }) => {
  // ... state declarations
  
  const setPolygonApiRequestLogJson = (json: string) => 
    setAndLogJson(_setPolygonApiRequestLogJson, 'polygonApiRequestLogJson', json)
  
  const setPolygonApiResponseLogJson = (json: string) => 
    setAndLogJson(_setPolygonApiResponseLogJson, 'polygonApiResponseLogJson', json)
    
  // ... 18 more identical patterns
}

// AFTER - Factory-generated setters
import { createSetterBatch } from './context-setter-factory'

const StockAnalysisProvider: React.FC<Props> = ({ children }) => {
  // ... state declarations
  
  // Create all setters at once using factory
  const jsonSetters = useMemo(() => createSetterBatch({
    polygonApiRequestLogJson: _setPolygonApiRequestLogJson,
    polygonApiResponseLogJson: _setPolygonApiResponseLogJson,
    stockSnapshotJson: _setStockSnapshotJson,
    optionsChainJson: _setOptionsChainJson,
    aiKeyTakeawaysJson: _setAiKeyTakeawaysJson,
    aiAnalyzedOptionsChainJson: _setAiAnalyzedOptionsChainJson,
    // ... all other setters
  }, { 
    enableLogging: process.env.NODE_ENV === 'development' 
  }), [
    _setPolygonApiRequestLogJson,
    _setPolygonApiResponseLogJson,
    // ... dependencies
  ])

  const contextValue = useMemo(() => ({
    // ... other context values
    ...jsonSetters, // Spread all generated setters
  }), [jsonSetters, /* other dependencies */])
}
```

### 2.3 Consolidate API Error Handling

#### Current Problem:
Repetitive try/catch blocks in `polygon-adapter.ts` and server actions.

#### Solution Implementation:

**Step 1**: Create API wrapper utility:
```typescript
// src/lib/api-wrapper.ts - NEW FILE
import { logger } from './logger'

interface ApiConfig {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
  retryCount: number
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const createApiWrapper = (defaultConfig: ApiConfig = {}) => {
  const config = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    ...defaultConfig
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  return async function apiCall<T>(
    operation: () => Promise<T>,
    endpoint: string,
    options: Partial<ApiConfig> = {}
  ): Promise<ApiResponse<T>> {
    const finalConfig = { ...config, ...options }
    let lastError: Error | null = null
    let retryCount = 0

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.debug(`Retrying API call to ${endpoint}`, { attempt, maxRetries: finalConfig.maxRetries })
          await delay(finalConfig.retryDelay * attempt)
        }

        const data = await operation()
        
        if (attempt > 0) {
          logger.info(`API call succeeded after ${attempt} retries`, { endpoint })
        }

        return {
          data,
          error: null,
          success: true,
          retryCount: attempt
        }
      } catch (error) {
        lastError = error as Error
        retryCount = attempt
        
        logger.warn(`API call failed`, { 
          endpoint, 
          attempt: attempt + 1, 
          maxRetries: finalConfig.maxRetries + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Don't retry on certain error types
        if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
          break
        }
      }
    }

    logger.error(`API call failed after all retries`, { 
      endpoint, 
      totalAttempts: retryCount + 1,
      finalError: lastError?.message 
    })

    return {
      data: null,
      error: lastError?.message || 'Unknown API error',
      success: false,
      retryCount
    }
  }
}

// Pre-configured wrapper for Polygon API
export const polygonApiCall = createApiWrapper({
  maxRetries: 2,
  retryDelay: 500,
  timeout: 8000
})

// Pre-configured wrapper for AI API calls
export const aiApiCall = createApiWrapper({
  maxRetries: 1,
  retryDelay: 1000,
  timeout: 30000
})
```

**Step 2**: Update polygon-adapter.ts:
```typescript
// BEFORE - Repetitive try/catch in every method
async getStockSnapshot(ticker: string): Promise<any> {
  try {
    await delay(this.apiCallDelay)
    const response = await this.client.stocks.snapshot(ticker)
    // process response
    return processedData
  } catch (error: any) {
    console.error(`Error fetching stock snapshot for ${ticker}:`, error)
    throw new Error(`Failed to fetch stock snapshot: ${error.message}`)
  }
}

async getOptionsChain(ticker: string, expiration: string): Promise<any> {
  try {
    await delay(this.apiCallDelay)
    const response = await this.client.options.chain(ticker, expiration)
    // process response  
    return processedData
  } catch (error: any) {
    console.error(`Error fetching options chain for ${ticker}:`, error)
    throw new Error(`Failed to fetch options chain: ${error.message}`)
  }
}

// AFTER - Clean implementation using wrapper
import { polygonApiCall, ApiError } from '@/lib/api-wrapper'

async getStockSnapshot(ticker: string): Promise<any> {
  const result = await polygonApiCall(
    async () => {
      await delay(this.apiCallDelay)
      const response = await this.client.stocks.snapshot(ticker)
      
      if (!response?.results) {
        throw new ApiError('No data in response', 404, 'stock-snapshot')
      }
      
      return this.processStockSnapshot(response.results)
    },
    `stock-snapshot-${ticker}`
  )

  if (!result.success) {
    throw new ApiError(result.error || 'Stock snapshot failed', 500, 'stock-snapshot')
  }

  return result.data
}

async getOptionsChain(ticker: string, expiration: string): Promise<any> {
  const result = await polygonApiCall(
    async () => {
      await delay(this.apiCallDelay)
      const response = await this.client.options.chain(ticker, expiration)
      
      if (!response?.results) {
        throw new ApiError('No options data available', 404, 'options-chain')
      }
      
      return this.processOptionsChain(response.results)
    },
    `options-chain-${ticker}-${expiration}`
  )

  if (!result.success) {
    throw new ApiError(result.error || 'Options chain failed', 500, 'options-chain')
  }

  return result.data
}
```

---

## 🚀 Phase 3: Advanced Optimization Implementation
**Estimated Time**: 18 hours | **Token Savings**: ~1,400 tokens

### Phase 3 new Version metadata: v3.7.3.0

### Background Context
Phase 3 addresses complex patterns that require deeper architectural understanding. These optimizations focus on table rendering, AI prompt management, and server action utilities.

### 3.1 Refactor Table Configuration Patterns

#### Current Problem:
The `options-chain-table.tsx` has repetitive header configurations for calls and puts.

#### Solution Implementation:

**Step 1**: Create table configuration factory:
```typescript
// src/components/ui/table-config-factory.ts - NEW FILE
import { formatPercentage, formatCurrency, formatNumber } from '@/lib/formatters'

export interface ColumnConfig<T = any> {
  key: keyof T
  label: string
  formatter?: (value: any) => string
  className?: string
  sortable?: boolean
  width?: string
}

export interface TableConfigOptions {
  defaultFormatter?: (value: any) => string
  emptyValue?: string
  sortable?: boolean
}

export const createTableConfig = <T>(
  baseColumns: Partial<ColumnConfig<T>>[],
  options: TableConfigOptions = {}
): ColumnConfig<T>[] => {
  const { defaultFormatter = (v) => String(v || '-'), emptyValue = '-', sortable = true } = options

  return baseColumns.map(col => ({
    sortable,
    formatter: defaultFormatter,
    className: '',
    width: 'auto',
    ...col,
  })) as ColumnConfig<T>[]
}

// Specialized formatters for options data
export const optionsFormatters = {
  price: (value: any) => formatCurrency(value, emptyValue),
  percentage: (value: any) => formatPercentage(value, emptyValue, false),
  volume: (value: any) => formatNumber(value, 0, emptyValue),
  openInterest: (value: any) => formatNumber(value, 0, emptyValue),
  delta: (value: any) => formatNumber(value, 4, emptyValue),
  gamma: (value: any) => formatNumber(value, 6, emptyValue),
  theta: (value: any) => formatNumber(value, 4, emptyValue),
  vega: (value: any) => formatNumber(value, 4, emptyValue)
}

// Factory for options table configurations
export const createOptionsTableConfig = (type: 'calls' | 'puts') => {
  const baseConfig: Partial<ColumnConfig>[] = [
    { key: 'strike_price', label: 'Strike', formatter: optionsFormatters.price },
    { key: 'last_quote_bid', label: 'Bid', formatter: optionsFormatters.price },
    { key: 'last_quote_ask', label: 'Ask', formatter: optionsFormatters.price },
    { key: 'last_trade_price', label: 'Last', formatter: optionsFormatters.price },
    { key: 'volume', label: 'Volume', formatter: optionsFormatters.volume },
    { key: 'open_interest', label: 'OI', formatter: optionsFormatters.openInterest },
    { key: 'implied_volatility', label: 'IV', formatter: optionsFormatters.percentage },
  ]

  // Add Greeks if needed
  const withGreeks: Partial<ColumnConfig>[] = [
    ...baseConfig,
    { key: 'delta', label: 'Δ', formatter: optionsFormatters.delta },
    { key: 'gamma', label: 'Γ', formatter: optionsFormatters.gamma },
    { key: 'theta', label: 'Θ', formatter: optionsFormatters.theta },
    { key: 'vega', label: 'ν', formatter: optionsFormatters.vega },
  ]

  return createTableConfig(withGreeks, {
    emptyValue: '-',
    sortable: true
  })
}
```

**Step 2**: Update options-chain-table.tsx:
```typescript
// BEFORE - Repetitive configurations (40+ lines)
const callHeadersConfig: OptionHeaderConfig[] = [
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) },
  { key: "delta", label: "Δ", formatter: (v) => formatNumber(v, 4, "-") },
  { key: "gamma", label: "Γ", formatter: (v) => formatNumber(v, 6, "-") },
  // ... 9 more similar entries
]

const putHeadersConfig: OptionHeaderConfig[] = [
  { key: "iv", label: "IV", formatter: (v) => formatPercentage(v, "-", false) },
  { key: "delta", label: "Δ", formatter: (v) => formatNumber(v, 4, "-") },
  { key: "gamma", label: "Γ", formatter: (v) => formatNumber(v, 6, "-") },
  // ... 9 more nearly identical entries
]

// AFTER - Generated configurations (5 lines)
import { createOptionsTableConfig } from '@/components/ui/table-config-factory'

const OptionsChainTable: React.FC<Props> = ({ data, type }) => {
  const tableConfig = useMemo(() => createOptionsTableConfig(type), [type])
  
  // ... rest of component uses tableConfig
}
```

### 3.2 Optimize AI Prompt Definitions

#### Current Problem:
AI prompt JSON files may contain redundant patterns and verbose instructions.

#### Solution Implementation:

**Step 1**: Create prompt template system:
```typescript
// src/ai/prompt-template-system.ts - NEW FILE
interface PromptTemplate {
  id: string
  basePrompt: string
  variables: Record<string, string>
  metadata: {
    model: string
    maxTokens: number
    temperature: number
  }
}

interface PromptConfig {
  systemRole: string
  taskDescription: string
  outputFormat: string
  constraints: string[]
  examples?: { input: string; output: string }[]
}

export const createPromptTemplate = (config: PromptConfig): PromptTemplate => {
  const { systemRole, taskDescription, outputFormat, constraints, examples } = config
  
  const basePrompt = [
    `Role: ${systemRole}`,
    `Task: ${taskDescription}`,
    `Output Format: ${outputFormat}`,
    constraints.length > 0 ? `Constraints:\n${constraints.map(c => `- ${c}`).join('\n')}` : '',
    examples && examples.length > 0 ? 
      `Examples:\n${examples.map(ex => `Input: ${ex.input}\nOutput: ${ex.output}`).join('\n\n')}` : '',
    'Input: {{input}}',
    'Output:'
  ].filter(Boolean).join('\n\n')

  return {
    id: `prompt-${Date.now()}`,
    basePrompt,
    variables: {},
    metadata: {
      model: 'googleai/gemini-2.5-flash-lite-preview-06-17',
      maxTokens: 2048,
      temperature: 0.1
    }
  }
}

// Common prompt patterns for StockSage
export const stockAnalysisPrompts = {
  keyTakeaways: createPromptTemplate({
    systemRole: 'Expert financial analyst specializing in stock market analysis',
    taskDescription: 'Analyze stock data and provide key takeaways in structured format',
    outputFormat: 'JSON object with takeaways array containing analysis points',
    constraints: [
      'Focus on actionable insights',
      'Include risk assessment',
      'Provide confidence levels',
      'Stay objective and data-driven'
    ]
  }),

  optionsAnalysis: createPromptTemplate({
    systemRole: 'Options trading specialist with expertise in derivatives analysis',
    taskDescription: 'Analyze options chain data to identify key support/resistance levels',
    outputFormat: 'JSON object with call_wall, put_wall, and analysis summary',
    constraints: [
      'Identify significant open interest levels',
      'Calculate gamma exposure',
      'Assess implied volatility patterns',
      'Provide risk-reward analysis'
    ]
  })
}
```

**Step 2**: Update AI flow files to use templates:
```typescript
// BEFORE - Verbose JSON prompt definitions
// src/ai/definitions/ai-key-takeaways.json (verbose)
{
  "model": "googleai/gemini-2.5-flash-lite-preview-06-17",
  "config": { "thinkingConfig": { "thinkingBudget": -1 } },
  "system": "You are an expert financial analyst...[200+ words of instructions]",
  "prompt": "Given the following stock data...[100+ words of detailed instructions]"
}

// AFTER - Template-based approach
// src/ai/flows/ai-key-takeaways-flow.ts (updated)
import { stockAnalysisPrompts } from '@/ai/prompt-template-system'

const flow = defineFlow(
  {
    name: 'aiKeyTakeawaysFlow',
    inputSchema: aiKeyTakeawaysInputSchema,
    outputSchema: aiKeyTakeawaysOutputSchema,
  },
  async (input) => {
    const template = stockAnalysisPrompts.keyTakeaways
    const prompt = template.basePrompt.replace('{{input}}', JSON.stringify(input))
    
    const result = await generate({
      model: gemini,
      prompt,
      config: { 
        maxOutputTokens: template.metadata.maxTokens,
        temperature: template.metadata.temperature,
        thinkingConfig: { thinkingBudget: -1 }
      }
    })
    
    return result.text()
  }
)
```

### 3.3 Create Server Action Utilities

#### Current Problem:
Server actions have repetitive patterns for input validation, logging, and response formatting.

#### Solution Implementation:

**Step 1**: Create server action wrapper utility:
```typescript
// src/lib/server-action-wrapper.ts - NEW FILE
import { z } from 'zod'
import { logger } from './logger'

interface ActionOptions<TInput, TOutput> {
  name: string
  inputSchema?: z.ZodSchema<TInput>
  outputSchema?: z.ZodSchema<TOutput>
  requireAuth?: boolean
  rateLimitKey?: string
}

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export const createServerAction = <TInput = any, TOutput = any>(
  options: ActionOptions<TInput, TOutput>
) => {
  return (handler: (input: TInput) => Promise<TOutput>) => {
    return async (input: TInput): Promise<ActionResult<TOutput>> => {
      const startTime = Date.now()
      const actionId = `${options.name}-${startTime}`
      
      try {
        // Input validation
        if (options.inputSchema) {
          const validation = options.inputSchema.safeParse(input)
          if (!validation.success) {
            logger.warn(`Input validation failed for ${options.name}`, validation.error)
            return {
              success: false,
              error: 'Invalid input parameters',
              timestamp: new Date().toISOString()
            }
          }
          input = validation.data
        }

        logger.debug(`Starting server action: ${options.name}`, { actionId })

        // Execute handler
        const result = await handler(input)

        // Output validation
        if (options.outputSchema) {
          const validation = options.outputSchema.safeParse(result)
          if (!validation.success) {
            logger.error(`Output validation failed for ${options.name}`, validation.error)
            return {
              success: false,
              error: 'Invalid response format',
              timestamp: new Date().toISOString()
            }
          }
        }

        const duration = Date.now() - startTime
        logger.info(`Server action completed: ${options.name}`, { actionId, duration })

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }

      } catch (error) {
        const duration = Date.now() - startTime
        logger.error(`Server action failed: ${options.name}`, { 
          actionId, 
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown server error',
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

// Specialized wrapper for StockSage actions
export const createStockAnalysisAction = <TInput, TOutput>(
  name: string,
  inputSchema: z.ZodSchema<TInput>,
  outputSchema?: z.ZodSchema<TOutput>
) => createServerAction<TInput, TOutput>({
  name: `stock-analysis-${name}`,
  inputSchema,
  outputSchema,
  requireAuth: false, // StockSage doesn't require auth
})
```

**Step 2**: Update server actions to use wrapper:
```typescript
// BEFORE - Repetitive server action structure
// src/actions/fetch-stock-snapshot-action.ts
'use server'

import { z } from 'zod'
import { polygonAdapter } from '@/lib/polygon-adapter'

const inputSchema = z.object({
  ticker: z.string().min(1).max(10)
})

export async function fetchStockSnapshotAction(input: unknown) {
  try {
    console.log(`[fetchStockSnapshotAction] Starting with input:`, input)
    
    const validatedInput = inputSchema.parse(input)
    const { ticker } = validatedInput
    
    const startTime = Date.now()
    const result = await polygonAdapter.getStockSnapshot(ticker)
    const duration = Date.now() - startTime
    
    console.log(`[fetchStockSnapshotAction] Completed in ${duration}ms`)
    
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`[fetchStockSnapshotAction] Error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// AFTER - Clean implementation using wrapper
'use server'

import { z } from 'zod'
import { createStockAnalysisAction } from '@/lib/server-action-wrapper'
import { polygonAdapter } from '@/lib/polygon-adapter'

const inputSchema = z.object({
  ticker: z.string().min(1).max(10)
})

const outputSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  // ... other expected fields
})

export const fetchStockSnapshotAction = createStockAnalysisAction(
  'fetch-stock-snapshot',
  inputSchema,
  outputSchema
)(async (input) => {
  const { ticker } = input
  return await polygonAdapter.getStockSnapshot(ticker)
})
```

---

## 🧪 Validation & Testing Procedures

### Critical Testing Requirements

**⚠️ MANDATORY**: All changes MUST preserve existing functionality. The StockSage architecture has specific non-negotiable requirements.

#### 1. FSM State Validation
```typescript
// Test that FSM feedback loop still works
const testFsmIntegration = () => {
  // 1. Trigger analyze stock action
  // 2. Verify FSM state changes during processing
  // 3. Confirm UI components reflect loading states
  // 4. Validate final state transition to IDLE
}
```

#### 2. Data Flow Validation
```typescript
// Test that consolidation doesn't break data parsing
const testDataFlow = () => {
  // 1. Mock API responses with various data formats
  // 2. Verify JSON parsing still works correctly
  // 3. Confirm error states are handled properly
  // 4. Test with pending/loading states
}
```

#### 3. Export Functionality
```typescript
// Test that export features still work
const testExportFunctions = () => {
  // 1. Test JSON copy to clipboard
  // 2. Test JSON file download
  // 3. Verify data integrity in exports
  // 4. Test with various data sizes
}
```

#### 4. Performance Validation
```typescript
// Measure token reduction success
const validateTokenReduction = () => {
  // 1. Count tokens before consolidation
  // 2. Count tokens after each phase
  // 3. Verify target savings achieved
  // 4. Ensure no functionality regression
}
```

### Testing Script Template
```bash
#!/bin/bash
# StockSage Consolidation Validation Script

echo "🧪 Starting StockSage consolidation validation..."

# 1. Build check
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed - consolidation introduced errors"
  exit 1
fi

# 2. Type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed - TypeScript errors introduced"
  exit 1
fi

# 3. Linting
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed - code quality issues"
  exit 1
fi

# 4. Basic functionality test
npm run dev &
DEV_PID=$!
sleep 5

# Test basic page load
curl -f http://localhost:9002 > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Application failed to start"
  kill $DEV_PID
  exit 1
fi

kill $DEV_PID
echo "✅ All validation checks passed"
```

---
## 📋 AI Agent Implementation Checklist

### Pre-Implementation Requirements

- [ ] **README Review**: Understand FSM architecture and non-removable patterns
- [ ] **Version Planning**: User provides exact new version number
- [ ] **Backup Strategy**: Ensure ability to revert changes if needed

### Phase 1 Checklist (Quick Wins)

- [ ] **Dead Code Removal**
  - [ ] Audit all import statements
  - [ ] Remove unused React hooks
  - [ ] Remove unused TypeScript types
  - [ ] Remove commented-out code blocks
  
- [ ] **Shared Constants**
  - [ ] Create `src/lib/constants.ts`
  - [ ] Move PENDING_STATUS_JSON_VARIANTS
  - [ ] Update all consuming components
  - [ ] Verify no functional changes
  
- [ ] **Export Utilities**
  - [ ] Create `src/hooks/use-export-actions.ts`
  - [ ] Implement copyToClipboard function
  - [ ] Implement downloadAsJson function
  - [ ] Update all components with export features
  
- [ ] **Logging Optimization**
  - [ ] Create `src/lib/logger.ts`
  - [ ] Replace verbose console.log statements
  - [ ] Add development-only debug logs
  - [ ] Preserve error logging

### Phase 2 Checklist (Core Consolidation)

- [ ] **JSON Data State Hook**
  - [ ] Create `src/hooks/use-json-data-state.ts`
  - [ ] Implement useJsonDataStateWithFsm variant
  - [ ] Update all display components
  - [ ] ⚠️ **Critical**: Preserve FSM state integration
  
- [ ] **Context Setter Factory**
  - [ ] Create `src/contexts/context-setter-factory.ts`
  - [ ] Implement createJsonSetter factory
  - [ ] Refactor stock-analysis-context.tsx
  - [ ] Verify all setters work correctly
  
- [ ] **API Error Handling**
  - [ ] Create `src/lib/api-wrapper.ts`
  - [ ] Implement retry logic with exponential backoff
  - [ ] Update polygon-adapter.ts
  - [ ] Test error scenarios

### Phase 3 Checklist (Advanced Optimization)

- [ ] **Table Configuration**
  - [ ] Create `src/components/ui/table-config-factory.ts`
  - [ ] Implement createOptionsTableConfig
  - [ ] Update options-chain-table.tsx
  - [ ] Verify table rendering unchanged
  
- [ ] **AI Prompt Templates**
  - [ ] Create `src/ai/prompt-template-system.ts`
  - [ ] Refactor existing prompt definitions
  - [ ] Update AI flow files
  - [ ] Test AI analysis functionality
  
- [ ] **Server Action Utilities**
  - [ ] Create `src/lib/server-action-wrapper.ts`
  - [ ] Implement createStockAnalysisAction
  - [ ] Update server action files
  - [ ] Verify API endpoints work correctly

### Post-Implementation Validation

- [ ] **Functional Testing**
  - [ ] Stock analysis pipeline works end-to-end
  - [ ] FSM state transitions correctly
  - [ ] UI loading states display properly
  - [ ] Export functions work
  - [ ] Error handling unchanged
  
- [ ] **Performance Verification**
  - [ ] Measure actual token reduction
  - [ ] Verify build time unchanged
  - [ ] Check runtime performance
  - [ ] Validate memory usage
  
- [ ] **Code Quality**
  - [ ] TypeScript builds without errors
  - [ ] ESLint passes
  - [ ] No new console errors
  - [ ] No regression in functionality

### Version Update Requirements

- [ ] **Metadata Update**
  - [ ] Update `src/config/app-metadata.json`
  - [ ] Set new `appVersion` from user
  - [ ] Update `lastUpdatedTimestamp` (ISO 8601)
  
- [ ] **Documentation Policy**
  - [ ] ❌ **Do NOT** update README.md
  - [ ] ❌ **Do NOT** update CHANGELOG.md
  - [ ] ❌ **Do NOT** update any .md files
  - [ ] Focus ONLY on code consolidation

---

## ⚠️ Critical Success Factors

### 1. Architecture Preservation
The StockSage application has a specific architecture that CANNOT be modified:

- **FSM Feedback Loop**: Must remain intact
- **Deterministic Handlers**: Must use async/await pattern  
- **UI State Derivation**: Must come from FSM, not data content
- **Context Provider**: Must maintain current interface

### 2. Zero Functional Regression
Every feature must work exactly as before:

- Stock analysis pipeline
- AI-powered insights
- Options chain analysis
- Export functionality
- Error handling
- Loading states

### 3. Token Reduction Validation
Success criteria for each phase:

- **Phase 1**: Achieve ~2,000 token reduction
- **Phase 2**: Achieve ~4,000 token reduction  
- **Phase 3**: Achieve ~1,400 token reduction
- **Total**: ~7,400 token reduction (7%)

### 4. Code Quality Maintenance
Consolidation must improve, not degrade:

- TypeScript safety
- Error handling robustness
- Performance characteristics
- Maintainability
- Documentation clarity (in code comments)

---

## 🎯 Success Metrics

### Quantitative Metrics
- **Token Count**: Baseline 104K → Target 96.6K (-7,400 tokens)
- **File Count**: Track file additions/deletions
- **Build Time**: Should remain similar or improve
- **Bundle Size**: Should decrease or remain stable

### Qualitative Metrics
- **Code Duplication**: Eliminated repetitive patterns
- **Maintainability**: Easier to modify and extend
- **Error Handling**: More consistent and robust
- **Developer Experience**: Cleaner, more intuitive code

### Validation Methods
1. **Automated Testing**: Build, type-check, lint
2. **Manual Testing**: Full application walkthrough
3. **Token Counting**: Automated script to measure reduction
4. **Performance Testing**: Load time and interaction responsiveness

---

## 📝 Final Notes for AI Coding Agents

### Context Management
- Always issue `[DIRECTIVE: CONTEXT_PURGE | ID: timestamp]` before starting
- Re-read all relevant files to avoid hallucinations
- Follow the exact operating procedures from the README

### Risk Mitigation
- Make changes incrementally, testing after each phase
- Preserve all existing interfaces and contracts
- Document any deviations from the plan
- Be prepared to revert if issues arise

### Communication Protocol
- Provide clear status updates after each major change
- Explain any challenges or unexpected findings
- Ask for clarification if requirements are ambiguous
- Confirm completion of each phase before proceeding

### Quality Assurance
- Double-check all TypeScript types
- Verify all imports and exports
- Test error scenarios
- Validate against success criteria

**Remember**: The goal is code quality improvement with token reduction, not just token reduction at any cost. Functionality preservation is paramount.