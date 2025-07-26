/**
 * Custom hook for data export actions (copy/download)
 * Consolidates repetitive export logic across components
 */

import { useCallback } from 'react'
import { downloadJson, copyToClipboard } from '@/lib/export-utils'
import { useToast } from '@/hooks/use-toast'

interface ExportData {
  data: any
  filename: string
  label: string
}

interface ExportActions {
  copy: () => Promise<boolean>
  download: () => void
}

/**
 * Hook for handling data export actions
 * Provides copy to clipboard and download functionality
 */
export const useExportActions = () => {
  const { toast } = useToast()

  const copyJsonToClipboard = useCallback(async (data: any, label: string): Promise<boolean> => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const success = await copyToClipboard(jsonString)
      
      if (success) {
        toast({
          title: "Copied!",
          description: `${label} copied to clipboard`,
          duration: 2000,
        })
      } else {
        toast({
          title: "Copy Failed",
          description: `Failed to copy ${label} to clipboard`,
          variant: "destructive",
          duration: 3000,
        })
      }
      
      return success
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: `Failed to copy ${label} to clipboard`,
        variant: "destructive",
        duration: 3000,
      })
      return false
    }
  }, [toast])

  const downloadJsonFile = useCallback((data: any, filename: string, label: string) => {
    try {
      // Ensure filename has .json extension
      const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`
      downloadJson(data, jsonFilename)
      
      toast({
        title: "Downloaded!",
        description: `${label} downloaded as ${jsonFilename}`,
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: `Failed to download ${label}`,
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [toast])

  const createExportActions = useCallback((exportData: ExportData): ExportActions => {
    return {
      copy: () => copyJsonToClipboard(exportData.data, exportData.label),
      download: () => downloadJsonFile(exportData.data, exportData.filename, exportData.label)
    }
  }, [copyJsonToClipboard, downloadJsonFile])

  return { 
    copyJsonToClipboard, 
    downloadJsonFile, 
    createExportActions 
  }
}

/**
 * Simple hook for quick export actions with predefined data
 */
export const useQuickExport = (data: any, filename: string, label: string) => {
  const { createExportActions } = useExportActions()
  
  return createExportActions({ data, filename, label })
}