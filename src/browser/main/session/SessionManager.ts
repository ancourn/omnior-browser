import { app, BrowserWindow, session } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { TabData, SessionData } from '../../types';

export class SessionManager {
  private sessionDataPath: string;
  private currentSession: SessionData;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(userDataPath: string) {
    this.sessionDataPath = join(userDataPath, 'sessions.json');
    this.currentSession = {
      windows: [],
      lastActiveWindow: null,
      privateWindows: [],
      timestamp: Date.now(),
      version: '1.0.0'
    };
    
    this.initialize();
  }

  private async initialize() {
    try {
      await this.loadSession();
      this.startAutoSave();
    } catch (error) {
      console.error('Failed to initialize SessionManager:', error);
    }
  }

  private async loadSession() {
    try {
      const data = await fs.readFile(this.sessionDataPath, 'utf-8');
      const saved = JSON.parse(data);
      
      // Validate session data structure
      if (saved && saved.windows && Array.isArray(saved.windows)) {
        this.currentSession = {
          ...this.currentSession,
          ...saved,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      console.log('No existing session found, starting fresh');
    }
  }

  private async saveSession() {
    try {
      await fs.writeFile(
        this.sessionDataPath,
        JSON.stringify(this.currentSession, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private startAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveSession();
    }, 30000);
  }

  public registerWindow(windowId: number, isPrivate = false) {
    const windowData = {
      id: windowId,
      tabs: [],
      activeTabId: null,
      bounds: null as Electron.Rectangle | null,
      isPrivate,
      createdAt: Date.now()
    };

    if (isPrivate) {
      this.currentSession.privateWindows.push(windowData);
    } else {
      this.currentSession.windows.push(windowData);
    }

    this.currentSession.lastActiveWindow = windowId;
    this.saveSession();
  }

  public unregisterWindow(windowId: number) {
    // Remove from regular windows
    this.currentSession.windows = this.currentSession.windows.filter(
      w => w.id !== windowId
    );
    
    // Remove from private windows
    this.currentSession.privateWindows = this.currentSession.privateWindows.filter(
      w => w.id !== windowId
    );

    // Update last active window if needed
    if (this.currentSession.lastActiveWindow === windowId) {
      this.currentSession.lastActiveWindow = 
        this.currentSession.windows.length > 0 
          ? this.currentSession.windows[0].id 
          : null;
    }

    this.saveSession();
  }

  public updateWindowBounds(windowId: number, bounds: Electron.Rectangle) {
    const window = this.findWindow(windowId);
    if (window) {
      window.bounds = bounds;
      this.saveSession();
    }
  }

  public addTab(windowId: number, tabData: TabData) {
    const window = this.findWindow(windowId);
    if (window) {
      window.tabs.push(tabData);
      this.saveSession();
    }
  }

  public updateTab(windowId: number, tabId: string, updates: Partial<TabData>) {
    const window = this.findWindow(windowId);
    if (window) {
      const tabIndex = window.tabs.findIndex(t => t.id === tabId);
      if (tabIndex !== -1) {
        window.tabs[tabIndex] = { ...window.tabs[tabIndex], ...updates };
        this.saveSession();
      }
    }
  }

  public removeTab(windowId: number, tabId: string) {
    const window = this.findWindow(windowId);
    if (window) {
      window.tabs = window.tabs.filter(t => t.id !== tabId);
      
      // Update active tab if it was removed
      if (window.activeTabId === tabId) {
        window.activeTabId = window.tabs.length > 0 ? window.tabs[0].id : null;
      }
      
      this.saveSession();
    }
  }

  public setActiveTab(windowId: number, tabId: string) {
    const window = this.findWindow(windowId);
    if (window) {
      window.activeTabId = tabId;
      this.currentSession.lastActiveWindow = windowId;
      this.saveSession();
    }
  }

  public reorderTabs(windowId: number, tabIds: string[]) {
    const window = this.findWindow(windowId);
    if (window) {
      const reorderedTabs = tabIds.map(id => 
        window.tabs.find(t => t.id === id)
      ).filter(Boolean) as TabData[];
      
      window.tabs = reorderedTabs;
      this.saveSession();
    }
  }

  public getSessionData(): SessionData {
    return { ...this.currentSession };
  }

  public async restoreSession(): Promise<BrowserWindow[]> {
    const restoredWindows: BrowserWindow[] = [];
    
    // Restore regular windows
    for (const windowData of this.currentSession.windows) {
      const window = await this.createWindowFromData(windowData);
      if (window) {
        restoredWindows.push(window);
      }
    }

    return restoredWindows;
  }

  public async restorePrivateSession(): Promise<BrowserWindow[]> {
    const restoredWindows: BrowserWindow[] = [];
    
    // Restore private windows
    for (const windowData of this.currentSession.privateWindows) {
      const window = await this.createWindowFromData(windowData, true);
      if (window) {
        restoredWindows.push(window);
      }
    }

    return restoredWindows;
  }

  private async createWindowFromData(
    windowData: any, 
    isPrivate = false
  ): Promise<BrowserWindow | null> {
    try {
      // Import WindowManager dynamically to avoid circular dependency
      const { WindowManager } = await import('../windows/WindowManager');
      const windowManager = new WindowManager();
      
      const window = await windowManager.createWindow({
        isPrivate,
        bounds: windowData.bounds
      });

      // Restore tabs after window is ready
      if (window && windowData.tabs && windowData.tabs.length > 0) {
        // Send tabs to renderer process
        window.webContents.send('restore-tabs', {
          tabs: windowData.tabs,
          activeTabId: windowData.activeTabId
        });
      }

      return window;
    } catch (error) {
      console.error('Failed to restore window:', error);
      return null;
    }
  }

  private findWindow(windowId: number) {
    return this.currentSession.windows.find(w => w.id === windowId) ||
           this.currentSession.privateWindows.find(w => w.id === windowId);
  }

  public clearSession() {
    this.currentSession = {
      windows: [],
      lastActiveWindow: null,
      privateWindows: [],
      timestamp: Date.now(),
      version: '1.0.0'
    };
    this.saveSession();
  }

  public clearPrivateSession() {
    this.currentSession.privateWindows = [];
    this.saveSession();
  }

  public exportSession(): string {
    return JSON.stringify(this.currentSession, null, 2);
  }

  public async importSession(sessionJson: string): Promise<boolean> {
    try {
      const imported = JSON.parse(sessionJson);
      
      // Validate imported session
      if (imported && imported.windows && Array.isArray(imported.windows)) {
        this.currentSession = {
          ...this.currentSession,
          windows: imported.windows || [],
          privateWindows: imported.privateWindows || [],
          lastActiveWindow: imported.lastActiveWindow,
          timestamp: Date.now()
        };
        
        await this.saveSession();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import session:', error);
      return false;
    }
  }

  public destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveSession();
  }
}