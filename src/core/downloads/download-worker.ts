import { parentPort, workerData } from 'worker_threads';
import { DownloadTask, ChunkMeta, NetworkAdapter, StorageAdapter } from './models';
import { HttpNetworkAdapter } from './network-adapters/http-adapter';
import { FileSystemStorageAdapter } from './storage-adapters/fs-adapter';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface WorkerMessage {
  type: 'start' | 'pause' | 'resume' | 'cancel' | 'setPriority' | 'setBandwidthLimit' | 'getProgress';
  task?: DownloadTask;
  priority?: number;
  limit?: number;
}

interface ProgressUpdate {
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaMs: number;
  chunks: ChunkMeta[];
}

export class DownloadWorker {
  private task: DownloadTask;
  private networkAdapter: NetworkAdapter;
  private storageAdapter: StorageAdapter;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private isCanceled: boolean = false;
  private chunks: ChunkMeta[] = [];
  private downloadedBytes: number = 0;
  private totalBytes: number = 0;
  private startTime: number = 0;
  private lastProgressUpdate: number = 0;
  private bandwidthLimit: number = 0;
  private progressUpdateInterval: number = 500; // ms

  constructor(task: DownloadTask) {
    this.task = task;
    this.networkAdapter = new HttpNetworkAdapter();
    this.storageAdapter = new FileSystemStorageAdapter();
  }

  async start(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    this.isPaused = false;
    this.isCanceled = false;
    this.startTime = Date.now();
    this.lastProgressUpdate = Date.now();

    try {
      // Check if server supports range requests
      const supportsRange = await this.networkAdapter.supportsRange(this.task.url);
      
      if (supportsRange) {
        await this.downloadChunked();
      } else {
        await this.downloadSingleStream();
      }
    } catch (error) {
      this.sendMessage('failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  pause(): void {
    this.isPaused = true;
    this.sendMessage('paused');
  }

  resume(): void {
    this.isPaused = false;
    this.sendMessage('resumed');
  }

  cancel(): void {
    this.isCanceled = true;
    this.isActive = false;
    this.sendMessage('canceled');
  }

  setPriority(priority: number): void {
    // Priority handling would be implemented here
    // For now, just acknowledge
  }

  setBandwidthLimit(limit: number): void {
    this.bandwidthLimit = limit;
  }

  getProgress(): ProgressUpdate {
    return {
      downloadedBytes: this.downloadedBytes,
      totalBytes: this.totalBytes,
      speedBytesPerSec: this.calculateSpeed(),
      etaMs: this.calculateETA(),
      chunks: this.chunks
    };
  }

  private async downloadChunked(): Promise<void> {
    try {
      // Get content length
      this.totalBytes = await this.networkAdapter.getContentLength(this.task.url);
      
      // Create chunks
      const chunkSize = Math.ceil(this.totalBytes / this.task.threads);
      this.chunks = [];
      
      for (let i = 0; i < this.task.threads; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, this.totalBytes - 1);
        
        this.chunks.push({
          id: crypto.randomUUID(),
          start,
          end,
          downloaded: 0,
          status: 'pending',
          retryCount: 0
        });
      }

      // Download chunks in parallel
      const downloadPromises = this.chunks.map(chunk => this.downloadChunk(chunk));
      await Promise.all(downloadPromises);

      // Merge chunks
      if (!this.isCanceled) {
        await this.mergeChunks();
        this.sendMessage('completed');
      }
    } catch (error) {
      this.sendMessage('failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async downloadChunk(chunk: ChunkMeta): Promise<void> {
    if (this.isCanceled) return;

    chunk.status = 'in-progress';
    
    try {
      const chunkData = await this.networkAdapter.downloadChunk(
        this.task.url,
        chunk.start + chunk.downloaded,
        chunk.end,
        (downloaded) => {
          chunk.downloaded = downloaded;
          this.updateProgress();
        }
      );

      // Store chunk
      await this.storageAdapter.writeChunk(this.task.id, chunk.id, chunkData);
      chunk.status = 'done';
      chunk.downloaded = chunk.end - chunk.start + 1;
      
      this.updateProgress();
    } catch (error) {
      chunk.status = 'failed';
      chunk.lastError = error instanceof Error ? error.message : 'Unknown error';
      chunk.retryCount++;
      
      if (chunk.retryCount < 3 && !this.isCanceled) {
        // Retry with exponential backoff
        setTimeout(() => this.downloadChunk(chunk), Math.pow(2, chunk.retryCount) * 1000);
      } else {
        this.sendMessage('failed', undefined, `Chunk ${chunk.id} failed after ${chunk.retryCount} retries`);
      }
    }
  }

  private async downloadSingleStream(): Promise<void> {
    try {
      // For servers that don't support range requests, download as single stream
      const chunkData = await this.networkAdapter.downloadChunk(
        this.task.url,
        0,
        undefined,
        (downloaded) => {
          this.downloadedBytes = downloaded;
          this.updateProgress();
        }
      );

      if (!this.isCanceled) {
        // Store as single chunk
        await this.storageAdapter.writeChunk(this.task.id, 'main', chunkData);
        this.downloadedBytes = chunkData.length;
        this.totalBytes = chunkData.length;
        
        await this.mergeChunks();
        this.sendMessage('completed');
      }
    } catch (error) {
      this.sendMessage('failed', undefined, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async mergeChunks(): Promise<void> {
    const destPath = this.task.destPath || path.join(this.task.tempPath, '..', 'complete', this.task.fileName);
    await this.storageAdapter.mergeChunks(this.task.id, destPath, this.task.encryptAtRest);
  }

  private updateProgress(): void {
    const now = Date.now();
    if (now - this.lastProgressUpdate >= this.progressUpdateInterval) {
      this.downloadedBytes = this.chunks.reduce((sum, chunk) => sum + chunk.downloaded, 0);
      this.sendMessage('progress', this.getProgress());
      this.lastProgressUpdate = now;
    }
  }

  private calculateSpeed(): number {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    return elapsed > 0 ? this.downloadedBytes / elapsed : 0;
  }

  private calculateETA(): number {
    const speed = this.calculateSpeed();
    const remaining = this.totalBytes - this.downloadedBytes;
    return speed > 0 ? (remaining / speed) * 1000 : 0; // ms
  }

  private sendMessage(type: string, data?: any, error?: string): void {
    if (parentPort) {
      parentPort.postMessage({
        type,
        downloadId: this.task.id,
        data,
        error
      });
    }
  }
}

// Worker entry point
if (parentPort && workerData?.task) {
  const worker = new DownloadWorker(workerData.task);
  
  parentPort.on('message', (msg: WorkerMessage) => {
    switch (msg.type) {
      case 'start':
        worker.start();
        break;
      case 'pause':
        worker.pause();
        break;
      case 'resume':
        worker.resume();
        break;
      case 'cancel':
        worker.cancel();
        break;
      case 'setPriority':
        worker.setPriority(msg.priority!);
        break;
      case 'setBandwidthLimit':
        worker.setBandwidthLimit(msg.limit!);
        break;
      case 'getProgress':
        worker.sendMessage('progress', worker.getProgress());
        break;
    }
  });

  // Auto-start if task is provided
  if (workerData.task) {
    worker.start();
  }
}