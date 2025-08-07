import { ipcMain, BrowserWindow, dialog, app } from 'electron';
import { WindowManager } from '../windows/WindowManager';
import { StorageManager } from '../../shared/utils/StorageManager';
import { SessionManager } from '../session/SessionManager';
import { DownloadManager } from '../downloads/DownloadManager';
import { ToolboxManager } from '../toolbox/ToolboxManager';
import { ExtensionStore } from '../store/ExtensionStore';
import {
  IPCMessage,
  CreateTabPayload,
  UpdateTabPayload,
  RemoveTabPayload,
  ActivateTabPayload,
  NavigateTabPayload,
  CreateBookmarkPayload,
  UpdateBookmarkPayload,
  RemoveBookmarkPayload,
  AddHistoryPayload,
  UpdateSettingsPayload
} from '../../types';

export class IPCHandler {
  private windowManager: WindowManager;
  private storageManager: StorageManager;
  private sessionManager: SessionManager;
  private downloadManager: DownloadManager;
  private toolboxManager: ToolboxManager;
  private extensionStore: ExtensionStore;

  constructor(
    windowManager: WindowManager, 
    storageManager: StorageManager, 
    sessionManager: SessionManager,
    downloadManager: DownloadManager,
    toolboxManager: ToolboxManager,
    extensionStore: ExtensionStore
  ) {
    this.windowManager = windowManager;
    this.storageManager = storageManager;
    this.sessionManager = sessionManager;
    this.downloadManager = downloadManager;
    this.toolboxManager = toolboxManager;
    this.extensionStore = extensionStore;
  }

  public setupHandlers(): void {
    this.setupTabHandlers();
    this.setupBookmarkHandlers();
    this.setupHistoryHandlers();
    this.setupSettingsHandlers();
    this.setupWindowHandlers();
    this.setupNavigationHandlers();
    this.setupUtilityHandlers();
    this.setupSessionHandlers();
    this.setupDownloadHandlers();
    this.setupToolboxHandlers();
    this.setupExtensionHandlers();
  }

  private setupTabHandlers(): void {
    // Create new tab
    ipcMain.handle('create-tab', async (event, payload: CreateTabPayload) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      return await this.windowManager.createNewTab(windowId, payload);
    });

    // Update tab
    ipcMain.handle('update-tab', async (event, payload: UpdateTabPayload) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      await this.windowManager.updateTab(windowId, payload.id, payload.updates);
    });

    // Remove tab
    ipcMain.handle('remove-tab', async (event, payload: RemoveTabPayload) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      await this.windowManager.closeTab(windowId, payload.id);
    });

    // Activate tab
    ipcMain.handle('activate-tab', async (event, payload: ActivateTabPayload) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      await this.windowManager.activateTab(windowId, payload.id);
    });

    // Get window tabs
    ipcMain.handle('get-tabs', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      const state = this.windowManager.getWindowState(windowId);
      return state?.tabs || [];
    });

    // Get active tab
    ipcMain.handle('get-active-tab', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      const state = this.windowManager.getWindowState(windowId);
      if (!state || !state.activeTabId) return null;
      
      return state.tabs.find(tab => tab.id === state.activeTabId) || null;
    });
  }

  private setupBookmarkHandlers(): void {
    // Get bookmarks
    ipcMain.handle('get-bookmarks', async () => {
      return await this.storageManager.getBookmarks();
    });

    // Create bookmark
    ipcMain.handle('create-bookmark', async (event, payload: CreateBookmarkPayload) => {
      return await this.storageManager.addBookmark(payload);
    });

    // Update bookmark
    ipcMain.handle('update-bookmark', async (event, payload: UpdateBookmarkPayload) => {
      return await this.storageManager.updateBookmark(payload.id, payload.updates);
    });

    // Remove bookmark
    ipcMain.handle('remove-bookmark', async (event, payload: RemoveBookmarkPayload) => {
      return await this.storageManager.removeBookmark(payload.id);
    });
  }

  private setupHistoryHandlers(): void {
    // Get history
    ipcMain.handle('get-history', async () => {
      return await this.storageManager.getHistory();
    });

    // Add history item
    ipcMain.handle('add-history', async (event, payload: AddHistoryPayload) => {
      return await this.storageManager.addHistoryItem(payload);
    });

    // Search history
    ipcMain.handle('search-history', async (event, query: string) => {
      return await this.storageManager.searchHistory(query);
    });

    // Clear history
    ipcMain.handle('clear-history', async () => {
      await this.storageManager.clearHistory();
    });
  }

  private setupSettingsHandlers(): void {
    // Get settings
    ipcMain.handle('get-settings', async () => {
      return await this.storageManager.getSettings();
    });

    // Update settings
    ipcMain.handle('update-settings', async (event, payload: UpdateSettingsPayload) => {
      return await this.storageManager.updateSettings(payload.settings);
    });

    // Reset settings
    ipcMain.handle('reset-settings', async () => {
      const { DEFAULT_SETTINGS } = await import('../../types');
      await this.storageManager.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    });
  }

  private setupWindowHandlers(): void {
    // Create new window
    ipcMain.handle('create-window', async () => {
      const window = await this.windowManager.createWindow();
      return this.getWindowId(window);
    });

    // Create private window
    ipcMain.handle('create-private-window', async () => {
      const window = await this.windowManager.createPrivateWindow();
      return this.getWindowId(window);
    });

    // Close window
    ipcMain.handle('close-window', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.close();
      }
    });

    // Minimize window
    ipcMain.handle('minimize-window', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.minimize();
      }
    });

    // Maximize window
    ipcMain.handle('maximize-window', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
      }
    });

    // Get window state
    ipcMain.handle('get-window-state', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      return this.windowManager.getWindowState(windowId);
    });

    // Check if window is private
    ipcMain.handle('is-private-window', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      return this.windowManager.isPrivateWindow(windowId);
    });

    // Close all private windows
    ipcMain.handle('close-all-private-windows', async () => {
      this.windowManager.closeAllPrivateWindows();
    });

    // Clear all private data
    ipcMain.handle('clear-all-private-data', async () => {
      await this.windowManager.clearAllPrivateData();
    });

    // Get private stats
    ipcMain.handle('get-private-stats', async () => {
      return this.windowManager.getPrivateStats();
    });
  }

  private setupNavigationHandlers(): void {
    // Navigate tab
    ipcMain.handle('navigate-tab', async (event, payload: NavigateTabPayload) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      const windowId = this.getWindowId(window);
      await this.windowManager.navigateTab(windowId, payload.id, payload.url);
    });

    // Go back
    ipcMain.handle('go-back', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.goBack();
      }
    });

    // Go forward
    ipcMain.handle('go-forward', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.goForward();
      }
    });

    // Reload
    ipcMain.handle('reload', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.reload();
      }
    });

    // Stop loading
    ipcMain.handle('stop-loading', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.stop();
      }
    });
  }

  private setupUtilityHandlers(): void {
    // Show dialog
    ipcMain.handle('show-dialog', async (event, options: Electron.MessageBoxOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      return await dialog.showMessageBox(window, options);
    });

    // Show open dialog
    ipcMain.handle('show-open-dialog', async (event, options: Electron.OpenDialogOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      return await dialog.showOpenDialog(window, options);
    });

    // Show save dialog
    ipcMain.handle('show-save-dialog', async (event, options: Electron.SaveDialogOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) throw new Error('Window not found');
      
      return await dialog.showSaveDialog(window, options);
    });

    // Export data
    ipcMain.handle('export-data', async () => {
      return await this.storageManager.exportData();
    });

    // Import data
    ipcMain.handle('import-data', async (event, jsonData: string) => {
      await this.storageManager.importData(jsonData);
    });

    // Clear all data
    ipcMain.handle('clear-all-data', async () => {
      await this.storageManager.clearAllData();
    });

    // Get version
    ipcMain.handle('get-version', () => {
      return {
        version: app.getVersion(),
        name: app.getName(),
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
      };
    });
  }

  private setupSessionHandlers(): void {
    // Get session data
    ipcMain.handle('get-session-data', async () => {
      return this.sessionManager.getSessionData();
    });

    // Restore session
    ipcMain.handle('restore-session', async () => {
      return await this.sessionManager.restoreSession();
    });

    // Restore private session
    ipcMain.handle('restore-private-session', async () => {
      return await this.sessionManager.restorePrivateSession();
    });

    // Clear session
    ipcMain.handle('clear-session', async () => {
      this.sessionManager.clearSession();
    });

    // Clear private session
    ipcMain.handle('clear-private-session', async () => {
      this.sessionManager.clearPrivateSession();
    });

    // Export session
    ipcMain.handle('export-session', async () => {
      return this.sessionManager.exportSession();
    });

    // Import session
    ipcMain.handle('import-session', async (event, sessionJson: string) => {
      return await this.sessionManager.importSession(sessionJson);
    });
  }

  private setupDownloadHandlers(): void {
    // Note: Download handlers are already set up in the DownloadManager constructor
    // This method is for any additional download-related IPC handlers if needed
    
    // Get download stats
    ipcMain.handle('get-download-stats', async () => {
      return this.downloadManager.getDownloadStats();
    });

    // Get active downloads
    ipcMain.handle('get-active-downloads', async () => {
      return this.downloadManager.getActiveDownloads();
    });
  }

  private setupToolboxHandlers(): void {
    // Note: Toolbox handlers are already set up in the ToolboxManager constructor
    // This method is for any additional toolbox-related IPC handlers if needed
    
    // Get toolbox stats
    ipcMain.handle('get-toolbox-stats', async () => {
      return this.toolboxManager.getToolStats();
    });

    // Get tools by category
    ipcMain.handle('get-tools-by-category', async (event, category: string) => {
      return this.toolboxManager.getToolsByCategory(category);
    });
  }

  private setupExtensionHandlers(): void {
    // Note: Extension handlers are already set up in the ExtensionStore constructor
    // This method is for any additional extension-related IPC handlers if needed
    
    // Get extension stats
    ipcMain.handle('get-extension-stats', async () => {
      return this.extensionStore.getExtensionStats();
    });

    // Get extensions by category
    ipcMain.handle('get-extensions-by-category', async (event, category: string) => {
      return this.extensionStore.getExtensionsByCategory(category);
    });
  }

  private getWindowId(window: BrowserWindow): string {
    // This is a simplified approach - in a real implementation,
    // you'd want to store window IDs in a map or use window.id
    const windowIds = this.windowManager.getWindowIds();
    return windowIds[0] || 'default';
  }
}