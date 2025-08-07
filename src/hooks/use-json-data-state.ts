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
      
      // Success logging removed to prevent render loops and reduce console noise
    } catch (error) {
      setParseError(error as Error)
      setParsedData(defaultValue)
      
      if (enableLogging) {
        console.warn('JSON parsing error:', error);
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