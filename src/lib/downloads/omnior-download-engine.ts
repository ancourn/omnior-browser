"use server"

import { db } from "@/lib/db"
import { ZAI } from "z-ai-web-dev-sdk"
import { DownloadJob, DownloadSegment, DownloadStatus } from "@/types/downloads"

interface DownloadOptions {
  url: string
  filename?: string
  contentType?: string
  fileSize?: number
  maxConnections?: number
  resume?: boolean
  headers?: Record<string, string>
}

interface SegmentInfo {
  id: string
  startByte: number
  endByte: number
  size: number
  status: "pending" | "downloading" | "completed" | "failed"
  retries: number
  checksum?: string
}

export class OmniorDownloadEngine {
  private activeJobs: Map<string, DownloadJob> = new Map()
  private maxConcurrentSegments = 8
  private segmentSize = 1024 * 1024 // 1MB segments

  async createDownloadJob(options: DownloadOptions): Promise<DownloadJob> {
    // Check if this is DRM protected content
    const isDRMProtected = await this.checkDRMProtection(options.url)
    if (isDRMProtected) {
      throw new Error("DRM-protected content cannot be downloaded")
    }

    // Analyze media type and get file info
    const mediaInfo = await this.analyzeMedia(options.url, options.contentType)
    
    const job: DownloadJob = {
      id: crypto.randomUUID(),
      url: options.url,
      filename: options.filename || this.generateFilename(options.url, mediaInfo.contentType),
      contentType: mediaInfo.contentType,
      fileSize: mediaInfo.fileSize || options.fileSize || 0,
      status: "queued",
      progress: 0,
      speed: 0,
      eta: 0,
      segments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      maxConnections: options.maxConnections || 4,
      headers: options.headers || {}
    }

    // Save to database
    await db.downloadJob.create({
      data: {
        id: job.id,
        url: job.url,
        filename: job.filename,
        contentType: job.contentType,
        fileSize: job.fileSize,
        status: job.status,
        progress: job.progress,
        speed: job.speed,
        eta: job.eta,
        maxConnections: job.maxConnections,
        headers: job.headers,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }
    })

    this.activeJobs.set(job.id, job)
    
    // Start download process
    this.startDownload(job.id)
    
    return job
  }

  private async checkDRMProtection(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = response.headers.get("content-type") || ""
      
      // Check for DRM indicators
      const drmIndicators = [
        "widevine",
        "fairplay",
        "playready",
        "encryption",
        "drm"
      ]
      
      return drmIndicators.some(indicator => 
        contentType.toLowerCase().includes(indicator) ||
        url.toLowerCase().includes(indicator)
      )
    } catch {
      return false
    }
  }

  private async analyzeMedia(url: string, providedContentType?: string) {
    try {
      const response = await fetch(url, { method: "HEAD" })
      const contentType = providedContentType || response.headers.get("content-type") || ""
      const contentLength = response.headers.get("content-length")
      const fileSize = contentLength ? parseInt(contentLength) : 0

      // Detect media type
      const isHLS = contentType.includes("application/vnd.apple.mpegurl") || url.includes(".m3u8")
      const isDASH = contentType.includes("application/dash+xml") || url.includes(".mpd")
      const isVideo = contentType.startsWith("video/") || url.match(/\.(mp4|webm|avi|mov)$/i)
      const isAudio = contentType.startsWith("audio/") || url.match(/\.(mp3|wav|flac|aac)$/i)

      return {
        contentType,
        fileSize,
        mediaType: isHLS ? "hls" : isDASH ? "dash" : isVideo ? "video" : isAudio ? "audio" : "file",
        isStreamable: isHLS || isDASH
      }
    } catch (error) {
      return {
        contentType: providedContentType || "application/octet-stream",
        fileSize: 0,
        mediaType: "file",
        isStreamable: false
      }
    }
  }

  private generateFilename(url: string, contentType: string): string {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const extension = this.getFileExtension(contentType, pathname)
    const basename = pathname.split('/').pop()?.split('.')[0] || "download"
    
    return `${basename}_${Date.now()}${extension}`
  }

  private getFileExtension(contentType: string, pathname: string): string {
    const extensionMap: Record<string, string> = {
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/ogg": ".ogg",
      "audio/mp3": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
      "audio/aac": ".aac",
      "application/pdf": ".pdf",
      "application/zip": ".zip",
      "application/x-tar": ".tar",
      "application/x-gzip": ".gz",
      "text/plain": ".txt",
      "application/json": ".json"
    }

    // Check content type first
    if (extensionMap[contentType]) {
      return extensionMap[contentType]
    }

    // Check file extension in URL
    const extMatch = pathname.match(/\.[0-9a-z]+$/i)
    if (extMatch) {
      return extMatch[0]
    }

    return ".bin"
  }

  private async startDownload(jobId: string) {
    const job = this.activeJobs.get(jobId)
    if (!job) return

    try {
      // Update job status
      job.status = "downloading"
      job.updatedAt = new Date()
      await this.updateJobInDB(job)

      if (job.mediaType === "hls") {
        await this.downloadHLSStream(job)
      } else if (job.mediaType === "dash") {
        await this.downloadDASHStream(job)
      } else {
        await this.downloadDirectFile(job)
      }
    } catch (error) {
      console.error(`Download failed for job ${jobId}:`, error)
      job.status = "failed"
      job.updatedAt = new Date()
      await this.updateJobInDB(job)
    }
  }

  private async downloadDirectFile(job: DownloadJob) {
    const segments = this.createSegments(job.fileSize, job.maxConnections)
    job.segments = segments
    
    // Save segments to database
    await this.saveSegmentsToDB(job.id, segments)

    const activeDownloads = new Set<string>()
    const completedSegments = new Set<string>()

    // Start concurrent downloads
    for (const segment of segments) {
      if (activeDownloads.size >= this.maxConcurrentSegments) {
        await this.waitForSegmentCompletion(activeDownloads)
      }

      activeDownloads.add(segment.id)
      this.downloadSegment(job, segment).finally(() => {
        activeDownloads.delete(segment.id)
        completedSegments.add(segment.id)
      })
    }

    // Wait for all segments to complete
    while (completedSegments.size < segments.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Assemble file
    await this.assembleFile(job)
  }

  private createSegments(fileSize: number, maxConnections: number): SegmentInfo[] {
    const segments: SegmentInfo[] = []
    const segmentSize = Math.min(this.segmentSize, Math.ceil(fileSize / maxConnections))
    
    for (let i = 0; i < fileSize; i += segmentSize) {
      const startByte = i
      const endByte = Math.min(i + segmentSize - 1, fileSize - 1)
      const size = endByte - startByte + 1
      
      segments.push({
        id: crypto.randomUUID(),
        startByte,
        endByte,
        size,
        status: "pending",
        retries: 0
      })
    }

    return segments
  }

  private async downloadSegment(job: DownloadJob, segment: SegmentInfo) {
    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        segment.status = "downloading"
        await this.updateSegmentInDB(job.id, segment)

        const headers = {
          ...job.headers,
          Range: `bytes=${segment.startByte}-${segment.endByte}`
        }

        const response = await fetch(job.url, { headers })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.arrayBuffer()
        
        // Verify segment size
        if (data.byteLength !== segment.size) {
          throw new Error(`Size mismatch: expected ${segment.size}, got ${data.byteLength}`)
        }

        // Calculate checksum
        const checksum = await this.calculateChecksum(data)
        segment.checksum = checksum
        segment.status = "completed"

        // Save segment data
        await this.saveSegmentData(job.id, segment.id, data)
        await this.updateSegmentInDB(job.id, segment)

        // Update job progress
        await this.updateJobProgress(job.id)
        
        return
      } catch (error) {
        retryCount++
        segment.retries = retryCount
        segment.status = "failed"
        
        if (retryCount >= maxRetries) {
          console.error(`Segment ${segment.id} failed after ${maxRetries} retries`)
          await this.updateSegmentInDB(job.id, segment)
          throw error
        }

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    // Simple checksum implementation
    const buffer = new Uint8Array(data)
    let hash = 0
    
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i]
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16)
  }

  private async waitForSegmentCompletion(activeDownloads: Set<string>) {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (activeDownloads.size === 0) {
          clearInterval(checkInterval)
          resolve(undefined)
        }
      }, 100)
    })
  }

  private async updateJobProgress(jobId: string) {
    const job = this.activeJobs.get(jobId)
    if (!job) return

    // Calculate progress based on completed segments
    const completedSegments = job.segments.filter(s => s.status === "completed")
    const totalSegments = job.segments.length
    const progress = totalSegments > 0 ? (completedSegments.length / totalSegments) * 100 : 0

    job.progress = progress
    job.updatedAt = new Date()

    // Calculate speed and ETA (simplified)
    const timeElapsed = Date.now() - job.createdAt.getTime()
    const bytesDownloaded = completedSegments.reduce((sum, s) => sum + s.size, 0)
    job.speed = timeElapsed > 0 ? (bytesDownloaded / timeElapsed) * 1000 : 0 // bytes per second
    
    if (job.speed > 0 && job.fileSize > 0) {
      const remainingBytes = job.fileSize - bytesDownloaded
      job.eta = Math.ceil(remainingBytes / job.speed)
    }

    await this.updateJobInDB(job)
  }

  private async assembleFile(job: DownloadJob) {
    // This would assemble all segments into the final file
    // For now, we'll mark as completed
    job.status = "completed"
    job.progress = 100
    job.updatedAt = new Date()
    
    await this.updateJobInDB(job)
  }

  private async downloadHLSStream(job: DownloadJob) {
    // HLS stream download implementation
    // Parse m3u8 manifest, download segments, and remux to MP4
    console.log("Starting HLS download for:", job.url)
    
    // Placeholder implementation
    job.status = "completed"
    job.progress = 100
    await this.updateJobInDB(job)
  }

  private async downloadDASHStream(job: DownloadJob) {
    // DASH stream download implementation
    // Parse mpd manifest, download segments, and remux to MP4
    console.log("Starting DASH download for:", job.url)
    
    // Placeholder implementation
    job.status = "completed"
    job.progress = 100
    await this.updateJobInDB(job)
  }

  private async updateJobInDB(job: DownloadJob) {
    await db.downloadJob.update({
      where: { id: job.id },
      data: {
        status: job.status,
        progress: job.progress,
        speed: job.speed,
        eta: job.eta,
        updatedAt: job.updatedAt
      }
    })
  }

  private async saveSegmentsToDB(jobId: string, segments: SegmentInfo[]) {
    await db.downloadSegment.createMany({
      data: segments.map(segment => ({
        id: segment.id,
        jobId,
        startByte: segment.startByte,
        endByte: segment.endByte,
        size: segment.size,
        status: segment.status,
        retries: segment.retries,
        checksum: segment.checksum
      }))
    })
  }

  private async updateSegmentInDB(jobId: string, segment: SegmentInfo) {
    await db.downloadSegment.update({
      where: { id: segment.id },
      data: {
        status: segment.status,
        retries: segment.retries,
        checksum: segment.checksum
      }
    })
  }

  private async saveSegmentData(jobId: string, segmentId: string, data: ArrayBuffer) {
    // Save segment data to file system or database
    // This is a placeholder - in real implementation, you'd save to disk
    console.log(`Saving segment ${segmentId} for job ${jobId}, size: ${data.byteLength}`)
  }

  // Public methods
  async pauseDownload(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job || job.status !== "downloading") return false

    job.status = "paused"
    job.updatedAt = new Date()
    await this.updateJobInDB(job)
    return true
  }

  async resumeDownload(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job || job.status !== "paused") return false

    job.status = "downloading"
    job.updatedAt = new Date()
    await this.updateJobInDB(job)
    
    // Resume download process
    this.startDownload(jobId)
    return true
  }

  async cancelDownload(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) return false

    job.status = "cancelled"
    job.updatedAt = new Date()
    await this.updateJobInDB(job)
    
    this.activeJobs.delete(jobId)
    return true
  }

  async getDownloadJob(jobId: string): Promise<DownloadJob | null> {
    // Check active jobs first
    const activeJob = this.activeJobs.get(jobId)
    if (activeJob) return activeJob

    // Check database
    const dbJob = await db.downloadJob.findUnique({
      where: { id: jobId },
      include: { segments: true }
    })

    if (!dbJob) return null

    return {
      id: dbJob.id,
      url: dbJob.url,
      filename: dbJob.filename,
      contentType: dbJob.contentType,
      fileSize: dbJob.fileSize,
      status: dbJob.status as DownloadStatus,
      progress: dbJob.progress,
      speed: dbJob.speed,
      eta: dbJob.eta,
      segments: dbJob.segments.map(segment => ({
        id: segment.id,
        startByte: segment.startByte,
        endByte: segment.endByte,
        size: segment.size,
        status: segment.status as "pending" | "downloading" | "completed" | "failed",
        retries: segment.retries,
        checksum: segment.checksum || undefined
      })),
      createdAt: dbJob.createdAt,
      updatedAt: dbJob.updatedAt,
      maxConnections: dbJob.maxConnections,
      headers: dbJob.headers as Record<string, string>
    }
  }

  async getAllDownloadJobs(): Promise<DownloadJob[]> {
    const dbJobs = await db.downloadJob.findMany({
      include: { segments: true },
      orderBy: { createdAt: "desc" }
    })

    return dbJobs.map(dbJob => ({
      id: dbJob.id,
      url: dbJob.url,
      filename: dbJob.filename,
      contentType: dbJob.contentType,
      fileSize: dbJob.fileSize,
      status: dbJob.status as DownloadStatus,
      progress: dbJob.progress,
      speed: dbJob.speed,
      eta: dbJob.eta,
      segments: dbJob.segments.map(segment => ({
        id: segment.id,
        startByte: segment.startByte,
        endByte: segment.endByte,
        size: segment.size,
        status: segment.status as "pending" | "downloading" | "completed" | "failed",
        retries: segment.retries,
        checksum: segment.checksum || undefined
      })),
      createdAt: dbJob.createdAt,
      updatedAt: dbJob.updatedAt,
      maxConnections: dbJob.maxConnections,
      headers: dbJob.headers as Record<string, string>
    }))
  }
}

// Singleton instance
export const omniorDownloadEngine = new OmniorDownloadEngine()