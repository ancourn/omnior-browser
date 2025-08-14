import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  DownloadTask, 
  DownloadId, 
  ProfileId, 
  DownloadOptions, 
  DownloadEvent, 
  BandwidthLimit,
  DownloadProgress 
} from './models';
import { MultiProfileSecureStorage } from '@/storage/MultiProfileSecureStorage';
import { WorkerPool } from './worker-pool';
import { BandwidthLimiter } from './bandwidth-limiter';
import path from 'path';

// Remove fs import - this will be handled by the storage adapter

export interface DownloadManager {
  list(profileId: ProfileId): Promise<DownloadTask[]>;
  enqueue(profileId: ProfileId, url: string, options?: DownloadOptions): Promise<DownloadTask>;
  pause(profileId: ProfileId, downloadId: DownloadId): Promise<void>;
  resume(profileId: ProfileId, downloadId: DownloadId): Promise<void>;
  cancel(profileId: ProfileId, downloadId: DownloadId): Promise<void>;
  setPriority(profileId: ProfileId, downloadId: DownloadId, priority: number): Promise<void>;
  setBandwidthLimit(profileId: ProfileId, limitBytesPerSec?: number): Promise<void>;
  schedule(profileId: ProfileId, downloadId: DownloadId, when: Date): Promise<void>;
  on(event: string, cb: (task: DownloadTask) => void): () => void;
  persist(profileId: ProfileId): Promise<void>;
  restore(profileId: ProfileId): Promise<void>;
  getProgress(profileId: ProfileId, downloadId: DownloadId): Promise<DownloadProgress>;
}

export class DownloadManagerImpl extends EventEmitter implements DownloadManager {
  private storage: MultiProfileSecureStorage;
  private workerPool: WorkerPool;
  private bandwidthLimiter: BandwidthLimiter;
  private tasks = new Map<DownloadId, DownloadTask>();
  private eventHandlers = new Map<string, Set<(task: DownloadTask) => void>>();
  private persistInterval: NodeJS.Timeout;
  private downloadDir: string;

  constructor(
    workerPool: WorkerPool,
    storage: MultiProfileSecureStorage,
    downloadDir: string = './downloads'
  ) {
    super();
    this.workerPool = workerPool;
    this.storage = storage;
    this.downloadDir = downloadDir;
    this.bandwidthLimiter = new BandwidthLimiter();
    
    // Setup worker pool event handlers
    this.workerPool.on('progress', this.handleWorkerProgress.bind(this));
    this.workerPool.on('completed', this.handleWorkerCompleted.bind(this));
    this.workerPool.on('failed', this.handleWorkerFailed.bind(this));
    
    // Auto-persist every 5 seconds
    this.persistInterval = setInterval(() => this.persistAll(), 5000);
    
    // Ensure download directory exists
    this.ensureDownloadDir();
  }

  private async ensureDownloadDir(): Promise<void> {
    // This will be handled by the storage adapter
    console.log('Download directory setup handled by storage adapter');
  }

  async list(profileId: ProfileId): Promise<DownloadTask[]> {
    const key = `profile:${profileId}:downloads`;
    const tasks = await this.storage.get<DownloadTask[]>(key) || [];
    return tasks;
  }

  async enqueue(profileId: ProfileId, url: string, options: DownloadOptions = {}): Promise<DownloadTask> {
    const downloadId: DownloadId = uuidv4();
    const fileName = options.fileName || this.extractFileName(url);
    const tempPath = path.join(this.downloadDir, 'tmp', downloadId);
    
    const task: DownloadTask = {
      id: downloadId,
      profileId,
      url,
      fileName,
      tempPath,
      downloadedBytes: 0,
      threads: options.threads || 8,
      chunkMap: [],
      status: 'queued',
      priority: options.priority || 0,
      createdAt: Date.now(),
      encryptAtRest: options.encryptAtRest || false,
      bandwidthLimit: options.bandwidthLimit,
      scheduledFor: options.scheduledFor?.getTime()
    };

    this.tasks.set(downloadId, task);
    await this.persistTask(profileId, task);
    
    // If scheduled for future, don't start immediately
    if (options.scheduledFor && options.scheduledFor > new Date()) {
      this.scheduleDownload(task, options.scheduledFor);
    } else {
      await this.startDownload(task);
    }

    this.emitEvent('started', task);
    return task;
  }

  async pause(profileId: ProfileId, downloadId: DownloadId): Promise<void> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    if (task.status === 'downloading') {
      task.status = 'paused';
      await this.workerPool.pause(downloadId);
      await this.persistTask(profileId, task);
      this.emitEvent('paused', task);
    }
  }

  async resume(profileId: ProfileId, downloadId: DownloadId): Promise<void> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    if (task.status === 'paused') {
      task.status = 'downloading';
      await this.workerPool.resume(downloadId);
      await this.persistTask(profileId, task);
      this.emitEvent('resumed', task);
    }
  }

  async cancel(profileId: ProfileId, downloadId: DownloadId): Promise<void> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    task.status = 'canceled';
    await this.workerPool.cancel(downloadId);
    await this.cleanupDownload(task);
    this.tasks.delete(downloadId);
    await this.persistTask(profileId, task);
    this.emitEvent('canceled', task);
  }

  async setPriority(profileId: ProfileId, downloadId: DownloadId, priority: number): Promise<void> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    task.priority = priority;
    await this.workerPool.setPriority(downloadId, priority);
    await this.persistTask(profileId, task);
    this.emitEvent('update', task);
  }

  async setBandwidthLimit(profileId: ProfileId, limitBytesPerSec?: number): Promise<void> {
    await this.bandwidthLimiter.setGlobalLimit(limitBytesPerSec || 0);
    
    // Update all active downloads for this profile
    for (const task of this.tasks.values()) {
      if (task.profileId === profileId && task.status === 'downloading') {
        task.bandwidthLimit = limitBytesPerSec;
        await this.workerPool.setBandwidthLimit(task.id, limitBytesPerSec);
        await this.persistTask(profileId, task);
      }
    }
  }

  async schedule(profileId: ProfileId, downloadId: DownloadId, when: Date): Promise<void> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    task.scheduledFor = when.getTime();
    await this.persistTask(profileId, task);
    this.scheduleDownload(task, when);
  }

  on(event: string, cb: (task: DownloadTask) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(cb);
    
    return () => {
      this.eventHandlers.get(event)?.delete(cb);
    };
  }

  async persist(profileId: ProfileId): Promise<void> {
    const profileTasks = Array.from(this.tasks.values()).filter(task => task.profileId === profileId);
    const key = `profile:${profileId}:downloads`;
    await this.storage.set(key, profileTasks);
  }

  async restore(profileId: ProfileId): Promise<void> {
    const key = `profile:${profileId}:downloads`;
    const tasks = await this.storage.get<DownloadTask[]>(key) || [];
    
    for (const task of tasks) {
      this.tasks.set(task.id, task);
      
      // Restore downloading or paused tasks
      if (task.status === 'downloading' || task.status === 'paused') {
        await this.workerPool.restore(task);
      }
    }
  }

  async getProgress(profileId: ProfileId, downloadId: DownloadId): Promise<DownloadProgress> {
    const task = this.tasks.get(downloadId);
    if (!task || task.profileId !== profileId) {
      throw new Error('Download not found');
    }

    return this.workerPool.getProgress(downloadId);
  }

  private async startDownload(task: DownloadTask): Promise<void> {
    task.status = 'downloading';
    task.startedAt = Date.now();
    await this.workerPool.start(task);
    await this.persistTask(task.profileId, task);
  }

  private async persistTask(profileId: ProfileId, task: DownloadTask): Promise<void> {
    const key = `profile:${profileId}:downloads`;
    const profileTasks = Array.from(this.tasks.values()).filter(t => t.profileId === profileId);
    await this.storage.set(key, profileTasks);
  }

  private async persistAll(): Promise<void> {
    const profiles = new Set<ProfileId>();
    for (const task of this.tasks.values()) {
      profiles.add(task.profileId);
    }
    
    for (const profileId of profiles) {
      await this.persist(profileId);
    }
  }

  private async cleanupDownload(task: DownloadTask): Promise<void> {
    try {
      await this.workerPool.cleanup(task.id);
    } catch (error) {
      console.error('Failed to cleanup download:', error);
    }
  }

  private scheduleDownload(task: DownloadTask, when: Date): void {
    const delay = when.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        if (this.tasks.has(task.id)) {
          await this.startDownload(task);
        }
      }, delay);
    }
  }

  private handleWorkerProgress(downloadId: DownloadId, progress: DownloadProgress): void {
    const task = this.tasks.get(downloadId);
    if (task) {
      task.downloadedBytes = progress.downloadedBytes;
      task.totalBytes = progress.totalBytes;
      task.speedBytesPerSec = progress.speedBytesPerSec;
      task.etaMs = progress.etaMs;
      task.chunkMap = progress.chunks;
      
      this.emitEvent('progress', task);
      this.emitEvent('speed', task);
    }
  }

  private handleWorkerCompleted(downloadId: DownloadId): void {
    const task = this.tasks.get(downloadId);
    if (task) {
      task.status = 'completed';
      task.completedAt = Date.now();
      task.speedBytesPerSec = 0;
      task.etaMs = 0;
      
      this.emitEvent('completed', task);
    }
  }

  private handleWorkerFailed(downloadId: DownloadId, error: string): void {
    const task = this.tasks.get(downloadId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      task.speedBytesPerSec = 0;
      task.etaMs = 0;
      
      this.emitEvent('failed', task);
    }
  }

  private emitEvent(type: string, task: DownloadTask): void {
    const event: DownloadEvent = {
      type: type as any,
      task,
      timestamp: Date.now()
    };
    
    this.emit(type, task);
    
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(task));
    }
  }

  private extractFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'download';
      return fileName;
    } catch {
      return 'download';
    }
  }

  async destroy(): Promise<void> {
    clearInterval(this.persistInterval);
    await this.workerPool.destroy();
    this.tasks.clear();
    this.eventHandlers.clear();
  }
}

// Export the implementation as OmniorDownloadManager
export const OmniorDownloadManager = DownloadManagerImpl;