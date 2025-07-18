import { useCallback } from 'react'
import { logger } from '@/lib/logger'

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
      logger.info(`${label} copied to clipboard`)
      return true
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error)
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
      logger.error('Failed to download JSON:', error)
      return false
    }
  }, [])

  const exportActions = useCallback((exportData: ExportData) => ({
    copy: () => copyToClipboard(exportData.data, exportData.label),
    download: () => downloadAsJson(exportData.data, exportData.filename)
  }), [copyToClipboard, downloadAsJson])

  return { copyToClipboard, downloadAsJson, exportActions }
}
