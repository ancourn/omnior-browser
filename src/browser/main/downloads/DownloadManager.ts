import { app, dialog, DownloadItem, ipcMain } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface DownloadItemData {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  endTime: number | null;
  speed: number;
  mimeType: string;
  referrer?: string;
  error?: string;
}

export interface DownloadOptions {
  url: string;
  filename?: string;
  savePath?: string;
  showSaveDialog?: boolean;
  referrer?: string;
}

export class DownloadManager {
  private downloads: Map<string, DownloadItemData> = new Map();
  private activeDownloads: Map<string, DownloadItem> = new Map();
  private downloadHistoryPath: string;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.downloadHistoryPath = join(app.getPath('userData'), 'downloads.json');
    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadDownloadHistory();
      this.setupDownloadHandlers();
      this.startAutoSave();
    } catch (error) {
      console.error('Failed to initialize DownloadManager:', error);
    }
  }

  private async loadDownloadHistory() {
    try {
      const data = await fs.readFile(this.downloadHistoryPath, 'utf-8');
      const saved = JSON.parse(data);
      
      if (saved && Array.isArray(saved)) {
        for (const downloadData of saved) {
          this.downloads.set(downloadData.id, downloadData);
        }
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.log('No existing download history found, starting fresh');
    }
  }

  private async saveDownloadHistory() {
    try {
      const history = Array.from(this.downloads.values());
      await fs.writeFile(
        this.downloadHistoryPath,
        JSON.stringify(history, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save download history:', error);
    }
  }

  private startAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveDownloadHistory();
    }, 30000);
  }

  private setupDownloadHandlers() {
    // Handle download requests from renderer
    ipcMain.handle('start-download', async (event, options: DownloadOptions) => {
      return await this.startDownload(options);
    });

    // Handle download control requests
    ipcMain.handle('pause-download', async (event, downloadId: string) => {
      return await this.pauseDownload(downloadId);
    });

    ipcMain.handle('resume-download', async (event, downloadId: string) => {
      return await this.resumeDownload(downloadId);
    });

    ipcMain.handle('cancel-download', async (event, downloadId: string) => {
      return await this.cancelDownload(downloadId);
    });

    ipcMain.handle('remove-download', async (event, downloadId: string) => {
      return await this.removeDownload(downloadId);
    });

    ipcMain.handle('get-downloads', async () => {
      return Array.from(this.downloads.values());
    });

    ipcMain.handle('get-download', async (event, downloadId: string) => {
      return this.downloads.get(downloadId) || null;
    });

    ipcMain.handle('clear-download-history', async () => {
      return await this.clearDownloadHistory();
    });

    ipcMain.handle('open-download-folder', async (event, downloadId: string) => {
      return await this.openDownloadFolder(downloadId);
    });

    ipcMain.handle('open-download-file', async (event, downloadId: string) => {
      return await this.openDownloadFile(downloadId);
    });
  }

  public async startDownload(options: DownloadOptions): Promise<string> {
    const downloadId = uuidv4();
    const downloadData: DownloadItemData = {
      id: downloadId,
      url: options.url,
      filename: options.filename || this.getFilenameFromUrl(options.url),
      savePath: options.savePath || join(app.getPath('downloads'), options.filename || this.getFilenameFromUrl(options.url)),
      totalBytes: 0,
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
      endTime: null,
      speed: 0,
      mimeType: '',
      referrer: options.referrer
    };

    this.downloads.set(downloadId, downloadData);

    try {
      // Show save dialog if requested
      if (options.showSaveDialog) {
        const result = await dialog.showSaveDialog({
          defaultPath: downloadData.savePath,
          filters: [
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (result.canceled) {
          this.downloads.delete(downloadId);
          throw new Error('Download cancelled by user');
        }

        downloadData.savePath = result.filePath || downloadData.savePath;
        downloadData.filename = this.getFilenameFromPath(downloadData.savePath);
      }

      // Create download item
      const { session } = await import('electron');
      const downloadItem = await session.defaultSession.downloadURL(options.url);

      // Set save path
      downloadItem.setSavePath(downloadData.savePath);

      // Store active download
      this.activeDownloads.set(downloadId, downloadItem);

      // Setup download event handlers
      this.setupDownloadItemHandlers(downloadItem, downloadId);

      return downloadId;
    } catch (error) {
      this.downloads.delete(downloadId);
      throw error;
    }
  }

  private setupDownloadItemHandlers(downloadItem: DownloadItem, downloadId: string) {
    const downloadData = this.downloads.get(downloadId);
    if (!downloadData) return;

    let lastUpdateTime = Date.now();
    let lastReceivedBytes = 0;

    downloadItem.on('updated', (event, state) => {
      const downloadData = this.downloads.get(downloadId);
      if (!downloadData) return;

      const now = Date.now();
      const timeDiff = (now - lastUpdateTime) / 1000; // seconds
      const bytesDiff = downloadItem.getReceivedBytes() - lastReceivedBytes;

      downloadData.state = state === 'progressing' ? 'progressing' : 'interrupted';
      downloadData.receivedBytes = downloadItem.getReceivedBytes();
      downloadData.totalBytes = downloadItem.getTotalBytes();
      downloadData.speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
      downloadData.mimeType = downloadItem.getMimeType();

      if (downloadItem.getFilename()) {
        downloadData.filename = downloadItem.getFilename();
      }

      lastUpdateTime = now;
      lastReceivedBytes = downloadItem.getReceivedBytes();

      // Notify renderer
      this.notifyDownloadUpdate(downloadId);
    });

    downloadItem.on('done', (event, state) => {
      const downloadData = this.downloads.get(downloadId);
      if (!downloadData) return;

      downloadData.state = state === 'completed' ? 'completed' : 'interrupted';
      downloadData.endTime = Date.now();
      downloadData.receivedBytes = downloadItem.getReceivedBytes();
      downloadData.totalBytes = downloadItem.getTotalBytes();

      if (state === 'interrupted') {
        downloadData.error = downloadItem.getSavePath() ? 'Download interrupted' : 'Download failed';
      }

      // Remove from active downloads
      this.activeDownloads.delete(downloadId);

      // Notify renderer
      this.notifyDownloadUpdate(downloadId);

      // Auto-save on completion
      this.saveDownloadHistory();
    });
  }

  private async notifyDownloadUpdate(downloadId: string) {
    const downloadData = this.downloads.get(downloadId);
    if (downloadData) {
      // Send to all windows
      const { BrowserWindow } = await import('electron');
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('download-updated', downloadData);
      });
    }
  }

  public async pauseDownload(downloadId: string): Promise<boolean> {
    const downloadItem = this.activeDownloads.get(downloadId);
    if (!downloadItem) return false;

    try {
      if (downloadItem.canResume()) {
        downloadItem.pause();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to pause download:', error);
      return false;
    }
  }

  public async resumeDownload(downloadId: string): Promise<boolean> {
    const downloadItem = this.activeDownloads.get(downloadId);
    if (!downloadItem) return false;

    try {
      if (downloadItem.isPaused()) {
        downloadItem.resume();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to resume download:', error);
      return false;
    }
  }

  public async cancelDownload(downloadId: string): Promise<boolean> {
    const downloadItem = this.activeDownloads.get(downloadId);
    if (!downloadItem) return false;

    try {
      downloadItem.cancel();
      this.activeDownloads.delete(downloadId);
      
      const downloadData = this.downloads.get(downloadId);
      if (downloadData) {
        downloadData.state = 'cancelled';
        downloadData.endTime = Date.now();
        this.notifyDownloadUpdate(downloadId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to cancel download:', error);
      return false;
    }
  }

  public async removeDownload(downloadId: string): Promise<boolean> {
    const downloadData = this.downloads.get(downloadId);
    if (!downloadData) return false;

    // Cancel if still active
    if (this.activeDownloads.has(downloadId)) {
      await this.cancelDownload(downloadId);
    }

    // Remove from history
    this.downloads.delete(downloadId);
    this.saveDownloadHistory();
    
    return true;
  }

  public async clearDownloadHistory(): Promise<boolean> {
    // Cancel all active downloads
    for (const downloadId of this.activeDownloads.keys()) {
      await this.cancelDownload(downloadId);
    }

    // Clear history
    this.downloads.clear();
    await this.saveDownloadHistory();
    
    return true;
  }

  public async openDownloadFolder(downloadId: string): Promise<boolean> {
    const downloadData = this.downloads.get(downloadId);
    if (!downloadData || !downloadData.savePath) return false;

    try {
      const { shell } = await import('electron');
      await shell.showItemInFolder(downloadData.savePath);
      return true;
    } catch (error) {
      console.error('Failed to open download folder:', error);
      return false;
    }
  }

  public async openDownloadFile(downloadId: string): Promise<boolean> {
    const downloadData = this.downloads.get(downloadId);
    if (!downloadData || !downloadData.savePath) return false;

    try {
      const { shell } = await import('electron');
      await shell.openPath(downloadData.savePath);
      return true;
    } catch (error) {
      console.error('Failed to open download file:', error);
      return false;
    }
  }

  public getDownloads(): DownloadItemData[] {
    return Array.from(this.downloads.values());
  }

  public getDownload(downloadId: string): DownloadItemData | null {
    return this.downloads.get(downloadId) || null;
  }

  public getActiveDownloads(): DownloadItemData[] {
    return Array.from(this.activeDownloads.keys())
      .map(id => this.downloads.get(id))
      .filter(Boolean) as DownloadItemData[];
  }

  public getDownloadStats(): {
    totalDownloads: number;
    activeDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalBytesDownloaded: number;
  } {
    const downloads = Array.from(this.downloads.values());
    
    return {
      totalDownloads: downloads.length,
      activeDownloads: downloads.filter(d => d.state === 'progressing').length,
      completedDownloads: downloads.filter(d => d.state === 'completed').length,
      failedDownloads: downloads.filter(d => d.state === 'interrupted' || d.state === 'cancelled').length,
      totalBytesDownloaded: downloads.reduce((sum, d) => sum + d.receivedBytes, 0)
    };
  }

  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'download';
      
      // Remove query parameters if present
      return filename.split('?')[0] || 'download';
    } catch {
      return 'download';
    }
  }

  private getFilenameFromPath(path: string): string {
    return path.split('/').pop() || 'download';
  }

  public destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveDownloadHistory();
  }
}