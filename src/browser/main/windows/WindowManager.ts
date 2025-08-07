import { BrowserWindow, ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Tab, WindowState, CreateTabPayload } from '../../types';
import { StorageManager } from '../../shared/utils/StorageManager';
import { PrivateModeManager } from '../private/PrivateModeManager';

export class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private windowStates: Map<string, WindowState> = new Map();
  private storageManager: StorageManager;
  private privateModeManager: PrivateModeManager;

  constructor() {
    this.storageManager = new StorageManager();
    this.privateModeManager = new PrivateModeManager();
  }

  async createWindow(options?: Electron.BrowserWindowConstructorOptions): Promise<BrowserWindow> {
    const windowId = uuidv4();
    
    const defaultOptions: Electron.BrowserWindowConstructorOptions = {
      width: 1200,
      height: 800,
      minWidth: 400,
      minHeight: 300,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../../renderer/preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      show: false,
      titleBarStyle: 'default',
      backgroundColor: '#ffffff'
    };

    const window = new BrowserWindow({
      ...defaultOptions,
      ...options
    });

    // Store window reference
    this.windows.set(windowId, window);

    // Initialize window state
    this.windowStates.set(windowId, {
      id: windowId,
      tabs: [],
      activeTabId: '',
      isIncognito: options?.webPreferences?.sandbox || false,
      bounds: {
        x: window.getPosition()[0],
        y: window.getPosition()[1],
        width: window.getSize()[0],
        height: window.getSize()[1],
        isMaximized: window.isMaximized()
      }
    });

    // Setup window event handlers
    this.setupWindowEvents(window, windowId);

    // Load the renderer
    await window.loadFile(path.join(__dirname, '../../renderer/index.html'));

    // Show window when ready
    window.once('ready-to-show', () => {
      window.show();
    });

    return window;
  }

  async createPrivateWindow(options?: Electron.BrowserWindowConstructorOptions): Promise<BrowserWindow> {
    const window = await this.privateModeManager.createPrivateWindow(options);
    const windowId = uuidv4();
    
    // Store window reference
    this.windows.set(windowId, window);

    // Initialize window state
    this.windowStates.set(windowId, {
      id: windowId,
      tabs: [],
      activeTabId: '',
      isIncognito: true,
      bounds: {
        x: window.getPosition()[0],
        y: window.getPosition()[1],
        width: window.getSize()[0],
        height: window.getSize()[1],
        isMaximized: window.isMaximized()
      }
    });

    // Setup window event handlers
    this.setupWindowEvents(window, windowId);

    // Load the renderer
    await window.loadFile(path.join(__dirname, '../../renderer/index.html'));

    // Show window when ready
    window.once('ready-to-show', () => {
      window.show();
    });

    return window;
  }

  private setupWindowEvents(window: BrowserWindow, windowId: string) {
    // Window close
    window.on('close', async () => {
      await this.saveWindowState(windowId);
      this.windows.delete(windowId);
      this.windowStates.delete(windowId);
    });

    // Window resize and move
    window.on('resize', () => {
      this.updateWindowBounds(windowId);
    });

    window.on('move', () => {
      this.updateWindowBounds(windowId);
    });

    window.on('maximize', () => {
      this.updateWindowBounds(windowId);
    });

    window.on('unmaximize', () => {
      this.updateWindowBounds(windowId);
    });

    // Page title update
    window.on('page-title-updated', (event, title) => {
      window.setTitle(title);
    });
  }

  private updateWindowBounds(windowId: string) {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (window && state) {
      state.bounds = {
        x: window.getPosition()[0],
        y: window.getPosition()[1],
        width: window.getSize()[0],
        height: window.getSize()[1],
        isMaximized: window.isMaximized()
      };
    }
  }

  private async saveWindowState(windowId: string) {
    const state = this.windowStates.get(windowId);
    if (state) {
      await this.storageManager.saveWindowState(state);
    }
  }

  async saveAllWindowStates() {
    for (const [windowId, state] of this.windowStates) {
      await this.saveWindowState(windowId);
    }
  }

  // Tab Management
  async createNewTab(windowId: string, options?: CreateTabPayload): Promise<Tab> {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (!window || !state) {
      throw new Error('Window not found');
    }

    const tab: Tab = {
      id: uuidv4(),
      url: options?.url || 'about:blank',
      title: 'New Tab',
      isLoading: false,
      isActive: options?.active || false,
      isIncognito: options?.incognito || state.isIncognito,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    // Add tab to state
    state.tabs.push(tab);

    // If this is the active tab, deactivate others
    if (tab.isActive) {
      state.tabs.forEach(t => {
        if (t.id !== tab.id) {
          t.isActive = false;
        }
      });
      state.activeTabId = tab.id;
    }

    // Notify renderer
    window.webContents.send('tab-created', tab);

    return tab;
  }

  async closeTab(windowId: string, tabId: string): Promise<void> {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (!window || !state) {
      throw new Error('Window not found');
    }

    const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) {
      throw new Error('Tab not found');
    }

    const tab = state.tabs[tabIndex];
    
    // Remove tab from state
    state.tabs.splice(tabIndex, 1);

    // If we closed the active tab, activate another one
    if (tab.isActive && state.tabs.length > 0) {
      const newActiveTab = state.tabs[Math.max(0, tabIndex - 1)];
      newActiveTab.isActive = true;
      state.activeTabId = newActiveTab.id;
      window.webContents.send('tab-activated', newActiveTab);
    }

    // If no tabs left, create a new one
    if (state.tabs.length === 0) {
      await this.createNewTab(windowId);
    }

    // Notify renderer
    window.webContents.send('tab-closed', tabId);
  }

  async closeActiveTab(windowId: string): Promise<void> {
    const state = this.windowStates.get(windowId);
    if (!state || !state.activeTabId) {
      return;
    }

    await this.closeTab(windowId, state.activeTabId);
  }

  async activateTab(windowId: string, tabId: string): Promise<void> {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (!window || !state) {
      throw new Error('Window not found');
    }

    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) {
      throw new Error('Tab not found');
    }

    // Deactivate all tabs
    state.tabs.forEach(t => {
      t.isActive = false;
    });

    // Activate the requested tab
    tab.isActive = true;
    tab.lastAccessed = Date.now();
    state.activeTabId = tabId;

    // Notify renderer
    window.webContents.send('tab-activated', tab);
  }

  async updateTab(windowId: string, tabId: string, updates: Partial<Tab>): Promise<void> {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (!window || !state) {
      throw new Error('Window not found');
    }

    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) {
      throw new Error('Tab not found');
    }

    // Update tab properties
    Object.assign(tab, updates);

    // Notify renderer
    window.webContents.send('tab-updated', { id: tabId, updates });
  }

  async navigateTab(windowId: string, tabId: string, url: string): Promise<void> {
    const window = this.windows.get(windowId);
    const state = this.windowStates.get(windowId);
    
    if (!window || !state) {
      throw new Error('Window not found');
    }

    const tab = state.tabs.find(t => t.id === tabId);
    if (!tab) {
      throw new Error('Tab not found');
    }

    // Update tab URL and loading state
    tab.url = url;
    tab.isLoading = true;

    // Notify renderer to navigate
    window.webContents.send('tab-navigate', { id: tabId, url });
  }

  // Utility Methods
  getFocusedWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow();
  }

  getWindowState(windowId: string): WindowState | undefined {
    return this.windowStates.get(windowId);
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  getWindowIds(): string[] {
    return Array.from(this.windows.keys());
  }

  // Private Mode Methods
  isPrivateWindow(windowId: string): boolean {
    const state = this.windowStates.get(windowId);
    return state?.isIncognito || false;
  }

  getPrivateWindows(): BrowserWindow[] {
    const privateWindows: BrowserWindow[] = [];
    for (const [windowId, window] of this.windows) {
      if (this.isPrivateWindow(windowId)) {
        privateWindows.push(window);
      }
    }
    return privateWindows;
  }

  closeAllPrivateWindows(): void {
    this.privateModeManager.closeAllPrivateWindows();
  }

  async clearAllPrivateData(): Promise<void> {
    await this.privateModeManager.clearAllPrivateData();
  }

  getPrivateStats() {
    return this.privateModeManager.getPrivateStats();
  }
}