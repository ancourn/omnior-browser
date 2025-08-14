import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import path from 'path';
import { DownloadTask, DownloadProgress, ChunkMeta } from './models';
import { BandwidthLimiter } from './bandwidth-limiter';
import fs from 'fs/promises';

export interface WorkerPool {
  start(task: DownloadTask): Promise<void>;
  pause(downloadId: string): Promise<void>;
  resume(downloadId: string): Promise<void>;
  cancel(downloadId: string): Promise<void>;
  setPriority(downloadId: string, priority: number): Promise<void>;
  setBandwidthLimit(downloadId: string, limit: number): Promise<void>;
  restore(task: DownloadTask): Promise<void>;
  getProgress(downloadId: string): Promise<DownloadProgress>;
  cleanup(downloadId: string): Promise<void>;
  destroy(): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): this;
}

interface WorkerMessage {
  type: 'progress' | 'completed' | 'failed' | 'paused' | 'resumed' | 'canceled';
  downloadId: string;
  data?: any;
  error?: string;
}

interface WorkerTask {
  task: DownloadTask;
  worker: Worker;
  isActive: boolean;
  lastProgress: number;
}

export class WorkerPoolImpl extends EventEmitter implements WorkerPool {
  private workers = new Map<string, WorkerTask>();
  private bandwidthLimiter: BandwidthLimiter;
  private maxConcurrentDownloads: number = 5;
  private activeDownloads = new Set<string>();
  private workerScriptPath: string;

  constructor(bandwidthLimiter: BandwidthLimiter, maxConcurrent: number = 5) {
    super();
    this.bandwidthLimiter = bandwidthLimiter;
    this.maxConcurrentDownloads = maxConcurrent;
    this.workerScriptPath = path.join(__dirname, 'download-worker.js');
  }

  async start(task: DownloadTask): Promise<void> {
    if (this.workers.has(task.id)) {
      throw new Error(`Download ${task.id} is already running`);
    }

    // Check if we can start a new download
    if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
      // Queue the download or wait for slot
      await this.waitForAvailableSlot();
    }

    // Create temp directory for this download
    await fs.mkdir(task.tempPath, { recursive: true });

    // Create worker
    const worker = new Worker(this.workerScriptPath, {
      workerData: { task }
    });

    const workerTask: WorkerTask = {
      task,
      worker,
      isActive: true,
      lastProgress: Date.now()
    };

    this.workers.set(task.id, workerTask);
    this.activeDownloads.add(task.id);

    // Set up worker event handlers
    worker.on('message', (msg: WorkerMessage) => this.handleWorkerMessage(msg));
    worker.on('error', (error) => this.handleWorkerError(task.id, error));
    worker.on('exit', (code) => this.handleWorkerExit(task.id, code));

    // Set bandwidth limit if specified
    if (task.bandwidthLimit) {
      await this.bandwidthLimiter.setPerDownloadLimit(task.id, task.bandwidthLimit);
    }

    // Start the download
    worker.postMessage({ type: 'start', task });
  }

  async pause(downloadId: string): Promise<void> {
    const workerTask = this.workers.get(downloadId);
    if (workerTask && workerTask.isActive) {
      workerTask.worker.postMessage({ type: 'pause' });
    }
  }

  async resume(downloadId: string): Promise<void> {
    const workerTask = this.workers.get(downloadId);
    if (workerTask && workerTask.isActive) {
      workerTask.worker.postMessage({ type: 'resume' });
    }
  }

  async cancel(downloadId: string): Promise<void> {
    const workerTask = this.workers.get(downloadId);
    if (workerTask) {
      workerTask.worker.postMessage({ type: 'cancel' });
      workerTask.isActive = false;
      this.activeDownloads.delete(downloadId);
    }
  }

  async setPriority(downloadId: string, priority: number): Promise<void> {
    const workerTask = this.workers.get(downloadId);
    if (workerTask && workerTask.isActive) {
      workerTask.worker.postMessage({ type: 'setPriority', priority });
    }
  }

  async setBandwidthLimit(downloadId: string, limit: number): Promise<void> {
    await this.bandwidthLimiter.setPerDownloadLimit(downloadId, limit);
    
    const workerTask = this.workers.get(downloadId);
    if (workerTask && workerTask.isActive) {
      workerTask.worker.postMessage({ type: 'setBandwidthLimit', limit });
    }
  }

  async restore(task: DownloadTask): Promise<void> {
    // Check if temp directory exists and has partial data
    try {
      await fs.access(task.tempPath);
      // If temp directory exists, restore the download
      await this.start(task);
    } catch {
      // Temp directory doesn't exist, start fresh
      await this.start(task);
    }
  }

  async getProgress(downloadId: string): Promise<DownloadProgress> {
    const workerTask = this.workers.get(downloadId);
    if (!workerTask) {
      throw new Error(`Download ${downloadId} not found`);
    }

    // Request progress from worker
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Progress request timeout'));
      }, 5000);

      const handler = (msg: WorkerMessage) => {
        if (msg.type === 'progress' && msg.downloadId === downloadId) {
          clearTimeout(timeout);
          workerTask.worker.removeListener('message', handler);
          resolve(msg.data);
        }
      };

      workerTask.worker.on('message', handler);
      workerTask.worker.postMessage({ type: 'getProgress' });
    });
  }

  async cleanup(downloadId: string): Promise<void> {
    const workerTask = this.workers.get(downloadId);
    if (workerTask) {
      // Terminate worker
      await workerTask.worker.terminate();
      this.workers.delete(downloadId);
      this.activeDownloads.delete(downloadId);
      
      // Remove from bandwidth limiter
      await this.bandwidthLimiter.removeDownload(downloadId);
      
      // Clean up temp files
      try {
        await fs.rm(workerTask.task.tempPath, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to cleanup temp files for ${downloadId}:`, error);
      }
    }
  }

  async destroy(): Promise<void> {
    // Cancel all active downloads
    for (const downloadId of this.workers.keys()) {
      await this.cancel(downloadId);
    }

    // Terminate all workers
    for (const workerTask of this.workers.values()) {
      await workerTask.worker.terminate();
    }

    this.workers.clear();
    this.activeDownloads.clear();
    await this.bandwidthLimiter.destroy();
  }

  private async waitForAvailableSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.activeDownloads.size < this.maxConcurrentDownloads) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private handleWorkerMessage(msg: WorkerMessage): void {
    const { type, downloadId, data, error } = msg;
    
    switch (type) {
      case 'progress':
        this.emit('progress', downloadId, data);
        break;
      case 'completed':
        this.activeDownloads.delete(downloadId);
        this.emit('completed', downloadId);
        break;
      case 'failed':
        this.activeDownloads.delete(downloadId);
        this.emit('failed', downloadId, error || 'Unknown error');
        break;
      case 'paused':
        this.emit('paused', downloadId);
        break;
      case 'resumed':
        this.emit('resumed', downloadId);
        break;
      case 'canceled':
        this.activeDownloads.delete(downloadId);
        this.emit('canceled', downloadId);
        break;
    }
  }

  private handleWorkerError(downloadId: string, error: Error): void {
    console.error(`Worker error for download ${downloadId}:`, error);
    this.activeDownloads.delete(downloadId);
    this.emit('failed', downloadId, error.message);
  }

  private handleWorkerExit(downloadId: string, code: number): void {
    const workerTask = this.workers.get(downloadId);
    if (workerTask) {
      if (code !== 0 && code !== null && workerTask.isActive) {
        this.activeDownloads.delete(downloadId);
        this.emit('failed', downloadId, `Worker exited with code ${code}`);
      }
      this.workers.delete(downloadId);
    }
  }
}