export type DownloadId = string;
export type ProfileId = string;

export interface DownloadTask {
  id: DownloadId;
  profileId: ProfileId;
  url: string;
  fileName: string;
  mimeType?: string;
  destPath?: string; // final path (encrypted if user wants)
  tempPath: string;  // where chunks go
  totalBytes?: number;
  downloadedBytes: number;
  threads: number;
  chunkMap: ChunkMeta[]; // start-end, status
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';
  priority: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  speedBytesPerSec?: number;
  etaMs?: number;
  error?: string;
  encryptAtRest?: boolean;
  bandwidthLimit?: number;
  scheduledFor?: number;
}

export interface ChunkMeta {
  id: string;
  start: number;
  end: number;
  downloaded: number;
  status: 'pending' | 'in-progress' | 'done' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface DownloadOptions {
  fileName?: string;
  threads?: number;
  priority?: number;
  encryptAtRest?: boolean;
  bandwidthLimit?: number;
  scheduledFor?: Date;
}

export interface BandwidthLimit {
  global: number; // bytes per second
  perDownload: number; // bytes per second
}

export interface DownloadProgress {
  downloadId: DownloadId;
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaMs: number;
  chunks: ChunkMeta[];
}

export interface DownloadEvent {
  type: 'update' | 'completed' | 'failed' | 'progress' | 'speed' | 'started' | 'paused' | 'resumed' | 'canceled';
  task: DownloadTask;
  timestamp: number;
}

export interface NetworkAdapter {
  supportsRange(url: string): Promise<boolean>;
  getContentLength(url: string): Promise<number>;
  downloadChunk(url: string, start: number, end: number, onProgress?: (downloaded: number) => void): Promise<Buffer>;
}

export interface StorageAdapter {
  writeChunk(downloadId: string, chunkId: string, data: Buffer): Promise<void>;
  readChunk(downloadId: string, chunkId: string): Promise<Buffer>;
  mergeChunks(downloadId: string, destPath: string, encrypt?: boolean): Promise<void>;
  cleanupTempFiles(downloadId: string): Promise<void>;
  getTempPath(downloadId: string): string;
}