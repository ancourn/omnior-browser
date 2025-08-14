/**
 * useDownloads Hook
 * 
 * React hook for managing downloads with AI-powered features.
 * Provides easy access to download operations and state management.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  DownloadEntry, 
  DownloadQuery, 
  DownloadStats,
  DownloadManagerConfig
} from '@/lib/downloads/omnior-download-manager-service'
import { omniorDownloadManagerService } from '@/lib/downloads/omnior-download-manager-service'

interface UseDownloadsReturn {
  // State
  downloads: DownloadEntry[]
  stats: DownloadStats | null
  isLoading: boolean
  error: string | null
  config: DownloadManagerConfig
  
  // Actions
  searchDownloads: (query: DownloadQuery) => Promise<void>
  startDownload: (url: string, options?: any) => Promise<DownloadEntry>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  refreshStats: () => Promise<void>
  updateConfig: (newConfig: Partial<DownloadManagerConfig>) => Promise<void>
  
  // Utilities
  clearError: () => void
  formatFileSize: (bytes: number) => string
  formatSpeed: (bytesPerSecond: number) => string
  formatTime: (seconds: number) => string
}

export function useDownloads(): UseDownloadsReturn {
  const [downloads, setDownloads] = useState<DownloadEntry[]>([])
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<DownloadManagerConfig>({
    maxConcurrentDownloads: 5,
    defaultDownloadPath: '/downloads',
    enableSecurityScanning: true,
    enableBandwidthOptimization: true,
    autoCategorize: true,
    maxRetries: 3,
    connectionTimeout: 30000,
    scheduleDownloads: true,
    pauseOnInactivity: true,
    resumeOnActivity: true
  })

  // Initialize service on mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        await omniorDownloadManagerService.initialize()
        await refreshStats()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize download manager service')
      }
    }

    initializeService()
  }, [])

  // Auto-refresh active downloads
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeDownloads = downloads.filter(d => d.status === 'downloading')
      if (activeDownloads.length > 0) {
        await searchDownloads({ status: 'downloading' })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [downloads])

  const searchDownloads = useCallback(async (query: DownloadQuery) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await omniorDownloadManagerService.searchDownloads(query)
      setDownloads(result.entries)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search downloads'
      setError(errorMessage)
      console.error('Downloads search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startDownload = useCallback(async (
    url: string, 
    options: {
      filename?: string
      filePath?: string
      headers?: Record<string, string>
      category?: string
      tags?: string[]
      priority?: 'low' | 'medium' | 'high'
    } = {}
  ): Promise<DownloadEntry> => {
    setError(null)

    try {
      const newDownload = await omniorDownloadManagerService.startDownload(url, options)
      setDownloads(prev => [newDownload, ...prev])
      await refreshStats()
      return newDownload
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start download'
      setError(errorMessage)
      console.error('Start download error:', err)
      throw err
    }
  }, [])

  const pauseDownload = useCallback(async (id: string) => {
    setError(null)

    try {
      await omniorDownloadManagerService.pauseDownload(id)
      setDownloads(prev => 
        prev.map(download => 
          download.id === id 
            ? { ...download, status: 'paused' as const }
            : download
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pause download'
      setError(errorMessage)
      console.error('Pause download error:', err)
      throw err
    }
  }, [])

  const resumeDownload = useCallback(async (id: string) => {
    setError(null)

    try {
      await omniorDownloadManagerService.resumeDownload(id)
      setDownloads(prev => 
        prev.map(download => 
          download.id === id 
            ? { ...download, status: 'downloading' as const }
            : download
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume download'
      setError(errorMessage)
      console.error('Resume download error:', err)
      throw err
    }
  }, [])

  const cancelDownload = useCallback(async (id: string) => {
    setError(null)

    try {
      await omniorDownloadManagerService.cancelDownload(id)
      setDownloads(prev => prev.filter(download => download.id !== id))
      await refreshStats()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel download'
      setError(errorMessage)
      console.error('Cancel download error:', err)
      throw err
    }
  }, [])

  const refreshStats = useCallback(async () => {
    try {
      const newStats = await omniorDownloadManagerService.getStats()
      setStats(newStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stats'
      setError(errorMessage)
      console.error('Refresh stats error:', err)
    }
  }, [])

  const updateConfig = useCallback(async (newConfig: Partial<DownloadManagerConfig>) => {
    try {
      await omniorDownloadManagerService.updateConfig(newConfig)
      setConfig(prev => ({ ...prev, ...newConfig }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update config'
      setError(errorMessage)
      console.error('Update config error:', err)
      throw err
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s'
  }, [formatFileSize])

  const formatTime = useCallback((seconds: number): string => {
    if (seconds === 0) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }, [])

  return {
    // State
    downloads,
    stats,
    isLoading,
    error,
    config,
    
    // Actions
    searchDownloads,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    refreshStats,
    updateConfig,
    
    // Utilities
    clearError,
    formatFileSize,
    formatSpeed,
    formatTime
  }
}