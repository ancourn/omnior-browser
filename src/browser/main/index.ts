import { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserProfile, DEFAULT_SETTINGS, Tab, Bookmark, HistoryItem, WindowState } from '../types';
import { WindowManager } from './windows/WindowManager';
import { MenuManager } from './menu/MenuManager';
import { IPCHandler } from './ipc/IPCHandler';
import { StorageManager } from '../shared/utils/StorageManager';
import { SessionManager } from './session/SessionManager';
import { DownloadManager } from './downloads/DownloadManager';
import { ToolboxManager } from './toolbox/ToolboxManager';
import { ExtensionStore } from './store/ExtensionStore';
import { AIAssistant } from './ai/AIAssistant';
import { PrivacyManager } from './privacy/PrivacyManager';
import { createDevConsole } from '../../core/DevConsoleManager';

class OmniorBrowser {
  private windowManager: WindowManager;
  private menuManager: MenuManager;
  private ipcHandler: IPCHandler;
  private storageManager: StorageManager;
  private sessionManager: SessionManager;
  private downloadManager: DownloadManager;
  private toolboxManager: ToolboxManager;
  private extensionStore: ExtensionStore;
  private aiAssistant: AIAssistant;
  private privacyManager: PrivacyManager;
  private isQuitting = false;

  constructor() {
    this.windowManager = new WindowManager();
    this.menuManager = new MenuManager();
    this.storageManager = new StorageManager();
    this.sessionManager = new SessionManager(app.getPath('userData'));
    this.downloadManager = new DownloadManager();
    this.toolboxManager = new ToolboxManager(app.getPath('userData'));
    this.extensionStore = new ExtensionStore();
    this.aiAssistant = new AIAssistant(app.getPath('userData'));
    this.privacyManager = new PrivacyManager(app.getPath('userData'));
    this.ipcHandler = new IPCHandler(
      this.windowManager, 
      this.storageManager, 
      this.sessionManager, 
      this.downloadManager,
      this.toolboxManager,
      this.extensionStore,
      this.aiAssistant,
      this.privacyManager
    );
  }

  async initialize() {
    // Handle app events
    this.setupAppEvents();
    
    // Setup IPC handlers
    this.ipcHandler.setupHandlers();
    
    // Setup global shortcuts
    this.setupGlobalShortcuts();
    
    // Create initial window
    await this.createInitialWindow();
    
    // Setup application menu
    this.menuManager.setupMenu();
  }

  private setupAppEvents() {
    // Prevent multiple instances
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window instead
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        if (window.isMinimized()) window.restore();
        window.focus();
      }
    });

    app.whenReady().then(async () => {
      await this.initialize();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await this.createInitialWindow();
      }
    });
  }

  private async createInitialWindow() {
    // Check if we should restore previous session
    const settings = await this.storageManager.getSettings();
    
    if (settings.startupBehavior === 'continue') {
      // Restore previous session
      const restoredWindows = await this.sessionManager.restoreSession();
      if (restoredWindows.length > 0) {
        return;
      }
    }
    
    // Create new window with default settings
    const window = await this.windowManager.createWindow();
    
    // Create new tab with default page
    await this.windowManager.createNewTab(window.id.toString());
  }

  private setupGlobalShortcuts() {
    // New Tab: Cmd/Ctrl + T
    globalShortcut.register('CommandOrControl+T', () => {
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        this.windowManager.createNewTab(window.id.toString());
      }
    });

    // New Window: Cmd/Ctrl + N
    globalShortcut.register('CommandOrControl+N', () => {
      this.windowManager.createWindow();
    });

    // Close Tab: Cmd/Ctrl + W
    globalShortcut.register('CommandOrControl+W', () => {
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        this.windowManager.closeActiveTab(window.id.toString());
      }
    });

    // Find: Cmd/Ctrl + F
    globalShortcut.register('CommandOrControl+F', () => {
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        window.webContents.send('toggle-find');
      }
    });

    // AI Assistant: Cmd/Ctrl + Shift + A
    globalShortcut.register('CommandOrControl+Shift+A', () => {
      this.aiAssistant.openAssistant();
    });

    // Developer Tools: Cmd/Ctrl + Shift + I
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        window.webContents.toggleDevTools();
      }
    });

    // Omnior DevConsole: Cmd/Ctrl + Shift + D
    globalShortcut.register('CommandOrControl+Shift+D', () => {
      const window = this.windowManager.getFocusedWindow();
      if (window) {
        window.webContents.send('omnior:openDevConsole');
      }
    });
  }

  public async shutdown() {
    // Save all window states before quitting
    await this.windowManager.saveAllWindowStates();
    
    // Clean up session manager
    this.sessionManager.destroy();
    
    // Clean up download manager
    this.downloadManager.destroy();
    
    // Close all tools
    await this.toolboxManager.closeAllTools();
    
    // Close AI Assistant
    await this.aiAssistant.closeAssistant();
    
    // Clean up privacy manager
    // (Privacy manager cleanup would be implemented here)
    
    // Clean up extension store
    // (Extension store cleanup would be implemented here)
    
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
    
    // Quit the application
    app.quit();
  }
}

// Start the browser
const browser = new OmniorBrowser();

// Handle process termination
process.on('SIGINT', () => {
  browser.shutdown();
});

process.on('SIGTERM', () => {
  browser.shutdown();
});

export default OmniorBrowser;