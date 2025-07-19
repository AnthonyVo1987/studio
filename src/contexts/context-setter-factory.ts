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

// Helper function to convert property name to setter method name
const toSetterMethodName = (propertyName: string): string => {
  // Convert "polygonApiRequestLogJson" to "setPolygonApiRequestLogJson"
  return `set${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`
}

// Batch setter creator for multiple related fields
export const createSetterBatch = (
  setters: Record<string, Dispatch<SetStateAction<string>>>,
  options: SetterFactoryOptions = {}
): Record<string, JsonSetter> => {
  return Object.entries(setters).reduce((acc, [key, setter]) => {
    const setterMethodName = toSetterMethodName(key)
    acc[setterMethodName] = createJsonSetter(setter, key, options)
    return acc
  }, {} as Record<string, JsonSetter>)
}