
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
          await delay(finalConfig.retryDelay * attempt)
        }

        const data = await operation()
        
        if (attempt > 0) {
          console.log(`API retry succeeded on attempt ${attempt + 1}`);
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
        // Don't retry on certain error types
        if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
          break
        }
      }
    }

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

export { ApiError }