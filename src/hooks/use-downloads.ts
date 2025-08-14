"use client"

import { useState, useEffect, useCallback } from "react"
import { DownloadJob, DownloadStatus, MediaDetectionResult, MediaQuality, DownloadOptions } from "@/types/downloads"
import { omniorDownloadEngine } from "@/lib/downloads/omnior-download-engine"
import { mediaDetectionService } from "@/lib/downloads/media-detection-service"

interface UseDownloadsReturn {
  downloads: DownloadJob[]
  isLoading: boolean
  error: string | null
  
  // Download management
  createDownload: (options: DownloadOptions) => Promise<DownloadJob>
  pauseDownload: (jobId: string) => Promise<boolean>
  resumeDownload: (jobId: string) => Promise<boolean>
  cancelDownload: (jobId: string) => Promise<boolean>
  removeDownload: (jobId: string) => Promise<boolean>
  openFile: (jobId: string) => Promise<void>
  
  // Media detection
  detectMedia: (url: string, html?: string) => Promise<MediaDetectionResult[]>
  downloadMedia: (media: MediaDetectionResult, quality?: MediaQuality) => Promise<void>
  
  // UI state
  isManagerOpen: boolean
  setIsManagerOpen: (open: boolean) => void
  isDetectionModalOpen: boolean
  setIsDetectionModalOpen: (open: boolean) => void
  detectedMedia: MediaDetectionResult[]
  setDetectedMedia: (media: MediaDetectionResult[]) => void
}

export function useDownloads(): UseDownloadsReturn {
  const [downloads, setDownloads] = useState<DownloadJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [isDetectionModalOpen, setIsDetectionModalOpen] = useState(false)
  const [detectedMedia, setDetectedMedia] = useState<MediaDetectionResult[]>([])

  // Load downloads from database on mount
  useEffect(() => {
    loadDownloads()
    
    // Set up periodic refresh for active downloads
    const interval = setInterval(() => {
      refreshActiveDownloads()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDownloads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const allJobs = await omniorDownloadEngine.getAllDownloadJobs()
      setDownloads(allJobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load downloads")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshActiveDownloads = useCallback(async () => {
    const activeDownloads = downloads.filter(d => d.status === "downloading")
    if (activeDownloads.length === 0) return

    try {
      const updatedJobs = await Promise.all(
        activeDownloads.map(job => omniorDownloadEngine.getDownloadJob(job.id))
      )
      
      const validJobs = updatedJobs.filter((job): job is DownloadJob => job !== null)
      
      setDownloads(prev => 
        prev.map(job => {
          const updated = validJobs.find(uj => uj.id === job.id)
          return updated || job
        })
      )
    } catch (err) {
      console.error("Error refreshing downloads:", err)
    }
  }, [downloads])

  const createDownload = useCallback(async (options: DownloadOptions): Promise<DownloadJob> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const job = await omniorDownloadEngine.createDownloadJob(options)
      
      setDownloads(prev => [job, ...prev])
      return job
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create download"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const pauseDownload = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const success = await omniorDownloadEngine.pauseDownload(jobId)
      if (success) {
        setDownloads(prev =>
          prev.map(job =>
            job.id === jobId ? { ...job, status: "paused" as DownloadStatus } : job
          )
        )
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause download")
      return false
    }
  }, [])

  const resumeDownload = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const success = await omniorDownloadEngine.resumeDownload(jobId)
      if (success) {
        setDownloads(prev =>
          prev.map(job =>
            job.id === jobId ? { ...job, status: "downloading" as DownloadStatus } : job
          )
        )
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume download")
      return false
    }
  }, [])

  const cancelDownload = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const success = await omniorDownloadEngine.cancelDownload(jobId)
      if (success) {
        setDownloads(prev =>
          prev.map(job =>
            job.id === jobId ? { ...job, status: "cancelled" as DownloadStatus } : job
          )
        )
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel download")
      return false
    }
  }, [])

  const removeDownload = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      // In a real implementation, you'd also remove the file from disk
      setDownloads(prev => prev.filter(job => job.id !== jobId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove download")
      return false
    }
  }, [])

  const openFile = useCallback(async (jobId: string): Promise<void> => {
    try {
      const job = downloads.find(d => d.id === jobId)
      if (!job || job.status !== "completed") {
        throw new Error("Download not completed")
      }

      // In a real implementation, this would open the file in the system
      console.log("Opening file:", job.filename)
      
      // For now, we'll just log it
      alert(`Would open file: ${job.filename}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open file")
    }
  }, [downloads])

  const detectMedia = useCallback(async (url: string, html?: string): Promise<MediaDetectionResult[]> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const media = await mediaDetectionService.detectMediaOnPage(url, html)
      setDetectedMedia(media)
      return media
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to detect media"
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const downloadMedia = useCallback(async (media: MediaDetectionResult, quality?: MediaQuality): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const options: DownloadOptions = {
        url: quality?.url || media.url,
        filename: media.title || undefined,
        contentType: media.contentType,
        fileSize: media.fileSize,
        maxConnections: 4,
        headers: {}
      }

      await createDownload(options)
      
      // Close detection modal and open download manager
      setIsDetectionModalOpen(false)
      setIsManagerOpen(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to download media"
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [createDownload])

  return {
    downloads,
    isLoading,
    error,
    
    createDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    openFile,
    
    detectMedia,
    downloadMedia,
    
    isManagerOpen,
    setIsManagerOpen,
    isDetectionModalOpen,
    setIsDetectionModalOpen,
    detectedMedia,
    setDetectedMedia
  }
}