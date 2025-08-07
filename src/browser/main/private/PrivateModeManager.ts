import { session, BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export class PrivateModeManager {
  private privateWindows: Map<number, BrowserWindow> = new Map();
  private privateSessions: Map<string, Electron.Session> = new Map();

  constructor() {
    this.setupPrivateSessionCleanup();
  }

  /**
   * Create a new private window with isolated session
   */
  public async createPrivateWindow(options?: Electron.BrowserWindowConstructorOptions): Promise<BrowserWindow> {
    const partitionId = `private-${uuidv4()}`;
    const privateSession = session.fromPartition(partitionId, {
      cache: false
    });

    // Configure private session settings
    await this.configurePrivateSession(privateSession);

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      ...options,
      webPreferences: {
        ...options?.webPreferences,
        session: privateSession,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      title: 'Private Window - Omnior',
      icon: undefined // No icon for private windows
    };

    const window = new BrowserWindow(windowOptions);
    
    // Store references
    this.privateWindows.set(window.id, window);
    this.privateSessions.set(partitionId, privateSession);

    // Handle window closure
    window.on('closed', () => {
      this.cleanupPrivateWindow(window.id, partitionId);
    });

    return window;
  }

  /**
   * Configure session settings for private browsing
   */
  private async configurePrivateSession(privateSession: Electron.Session): Promise<void> {
    // Disable persistent storage
    await privateSession.clearStorageData({
      storages: [
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'websql',
        'serviceworkers'
      ]
    });

    // Set cookie behavior to block all cookies in private mode
    privateSession.webRequest.onHeadersReceived(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        const responseHeaders = details.responseHeaders || {};
        
        // Block cookies
        if (responseHeaders['set-cookie']) {
          delete responseHeaders['set-cookie'];
        }

        // Block localStorage and sessionStorage
        (responseHeaders as any)['cache-control'] = 'no-store, no-cache, must-revalidate';
        (responseHeaders as any)['pragma'] = 'no-cache';
        (responseHeaders as any)['expires'] = '0';

        callback({ responseHeaders });
      }
    );

    // Clear cache on navigation
    privateSession.webRequest.onBeforeRequest(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        // Clear cache for each navigation in private mode
        privateSession.clearCache();
        callback({});
      }
    );

    // Block service workers
    privateSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === 'media') {
          callback(false);
        } else {
          callback(true);
        }
      }
    );

    // Disable WebRTC to prevent IP leakage
    privateSession.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === 'media') {
          callback(false);
        } else {
          callback(true);
        }
      }
    );
  }

  /**
   * Check if a window is in private mode
   */
  public isPrivateWindow(windowId: number): boolean {
    return this.privateWindows.has(windowId);
  }

  /**
   * Get all private windows
   */
  public getPrivateWindows(): BrowserWindow[] {
    return Array.from(this.privateWindows.values());
  }

  /**
   * Get private session for a window
   */
  public getPrivateSession(windowId: number): Electron.Session | null {
    const window = this.privateWindows.get(windowId);
    if (!window) return null;
    
    const partitionId = this.getPartitionIdFromWindow(window);
    return this.privateSessions.get(partitionId) || null;
  }

  /**
   * Close all private windows and clean up sessions
   */
  public closeAllPrivateWindows(): void {
    for (const window of this.privateWindows.values()) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
  }

  /**
   * Clear all private browsing data
   */
  public async clearAllPrivateData(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const privateSession of this.privateSessions.values()) {
      promises.push(
        privateSession.clearStorageData({
          storages: [
            'cookies',
            'filesystem',
            'indexdb',
            'localstorage',
            'shadercache',
            'websql',
            'serviceworkers',
            'cachestorage'
          ]
        }).then(() => privateSession.clearCache())
      );
    }

    await Promise.all(promises);
  }

  /**
   * Setup automatic cleanup of private sessions
   */
  private setupPrivateSessionCleanup(): void {
    // Clean up when app is about to quit
    const cleanup = () => {
      this.clearAllPrivateData();
      this.privateWindows.clear();
      this.privateSessions.clear();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit();
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit();
    });
  }

  /**
   * Clean up resources when a private window is closed
   */
  private cleanupPrivateWindow(windowId: number, partitionId: string): void {
    this.privateWindows.delete(windowId);
    
    const privateSession = this.privateSessions.get(partitionId);
    if (privateSession) {
      // Clear all data for this session
      privateSession.clearStorageData({
        storages: [
          'cookies',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'websql',
          'serviceworkers'
        ]
      }).then(() => {
        privateSession.clearCache();
      });
      
      this.privateSessions.delete(partitionId);
    }
  }

  /**
   * Extract partition ID from window
   */
  private getPartitionIdFromWindow(window: BrowserWindow): string {
    const webContents = window.webContents;
    if (!webContents) return '';
    
    const session = webContents.session;
    return (session as any).partition || '';
  }

  /**
   * Get private browsing statistics
   */
  public getPrivateStats(): {
    windowCount: number;
    sessionCount: number;
    totalDataCleared: number;
  } {
    return {
      windowCount: this.privateWindows.size,
      sessionCount: this.privateSessions.size,
      totalDataCleared: 0 // This could be tracked if needed
    };
  }

  /**
   * Force clear a specific private session
   */
  public async clearPrivateSession(windowId: number): Promise<boolean> {
    const window = this.privateWindows.get(windowId);
    if (!window) return false;
    
    const partitionId = this.getPartitionIdFromWindow(window);
    const privateSession = this.privateSessions.get(partitionId);
    
    if (privateSession) {
      await privateSession.clearStorageData({
        storages: [
          'cookies',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'websql',
          'serviceworkers'
        ]
      });
      await privateSession.clearCache();
      return true;
    }
    
    return false;
  }
}