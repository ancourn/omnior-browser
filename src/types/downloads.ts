export type DownloadStatus = "queued" | "downloading" | "paused" | "completed" | "failed" | "cancelled"

export interface DownloadJob {
  id: string
  url: string
  filename: string
  contentType: string
  fileSize: number
  status: DownloadStatus
  progress: number
  speed: number // bytes per second
  eta: number // estimated time in seconds
  segments: DownloadSegment[]
  createdAt: Date
  updatedAt: Date
  maxConnections: number
  headers: Record<string, string>
  mediaType?: "hls" | "dash" | "video" | "audio" | "file"
}

export interface DownloadSegment {
  id: string
  startByte: number
  endByte: number
  size: number
  status: "pending" | "downloading" | "completed" | "failed"
  retries: number
  checksum?: string
}

export interface MediaDetectionResult {
  url: string
  contentType: string
  fileSize?: number
  mediaType: "hls" | "dash" | "video" | "audio" | "file"
  isStreamable: boolean
  isDRMProtected: boolean
  title?: string
  thumbnail?: string
  duration?: number
  qualities?: MediaQuality[]
}

export interface MediaQuality {
  bitrate: number
  resolution?: string
  fps?: number
  codec?: string
  url: string
}

export interface DownloadOptions {
  url: string
  filename?: string
  contentType?: string
  fileSize?: number
  maxConnections?: number
  resume?: boolean
  headers?: Record<string, string>
  quality?: string
  includeSubtitles?: boolean
}