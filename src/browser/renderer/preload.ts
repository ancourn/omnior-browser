import { contextBridge, ipcRenderer } from 'electron';
import { 
  CreateTabPayload,
  UpdateTabPayload,
  RemoveTabPayload,
  ActivateTabPayload,
  NavigateTabPayload,
  CreateBookmarkPayload,
  UpdateBookmarkPayload,
  RemoveBookmarkPayload,
  AddHistoryPayload,
  UpdateSettingsPayload,
  Tab,
  Bookmark,
  HistoryItem,
  BrowserSettings,
  WindowState
} from '../types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Tab Management
  createTab: (payload: CreateTabPayload) => ipcRenderer.invoke('create-tab', payload),
  updateTab: (payload: UpdateTabPayload) => ipcRenderer.invoke('update-tab', payload),
  removeTab: (payload: RemoveTabPayload) => ipcRenderer.invoke('remove-tab', payload),
  activateTab: (payload: ActivateTabPayload) => ipcRenderer.invoke('activate-tab', payload),
  getTabs: () => ipcRenderer.invoke('get-tabs'),
  getActiveTab: () => ipcRenderer.invoke('get-active-tab'),

  // Bookmark Management
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  createBookmark: (payload: CreateBookmarkPayload) => ipcRenderer.invoke('create-bookmark', payload),
  updateBookmark: (payload: UpdateBookmarkPayload) => ipcRenderer.invoke('update-bookmark', payload),
  removeBookmark: (payload: RemoveBookmarkPayload) => ipcRenderer.invoke('remove-bookmark', payload),

  // History Management
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (payload: AddHistoryPayload) => ipcRenderer.invoke('add-history', payload),
  searchHistory: (query: string) => ipcRenderer.invoke('search-history', query),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Settings Management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (payload: UpdateSettingsPayload) => ipcRenderer.invoke('update-settings', payload),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  // Window Management
  createWindow: () => ipcRenderer.invoke('create-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  getWindowState: () => ipcRenderer.invoke('get-window-state'),

  // Navigation
  navigateTab: (payload: NavigateTabPayload) => ipcRenderer.invoke('navigate-tab', payload),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  reload: () => ipcRenderer.invoke('reload'),
  stopLoading: () => ipcRenderer.invoke('stop-loading'),

  // Dialogs
  showDialog: (options: any) => ipcRenderer.invoke('show-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),

  // Data Management
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (jsonData: string) => ipcRenderer.invoke('import-data', jsonData),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),

  // Utility
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Event Listeners
  onTabCreated: (callback: (tab: Tab) => void) => {
    ipcRenderer.on('tab-created', (event, tab: Tab) => callback(tab));
  },
  onTabUpdated: (callback: (data: { id: string; updates: Partial<Tab> }) => void) => {
    ipcRenderer.on('tab-updated', (event, data: { id: string; updates: Partial<Tab> }) => callback(data));
  },
  onTabClosed: (callback: (tabId: string) => void) => {
    ipcRenderer.on('tab-closed', (event, tabId: string) => callback(tabId));
  },
  onTabActivated: (callback: (tab: Tab) => void) => {
    ipcRenderer.on('tab-activated', (event, tab: Tab) => callback(tab));
  },
  onTabNavigate: (callback: (data: { id: string; url: string }) => void) => {
    ipcRenderer.on('tab-navigate', (event, data: { id: string; url: string }) => callback(data));
  },

  // Remove all listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // AI Assistant
  openAIAssistant: () => ipcRenderer.invoke('open-ai-assistant'),
  closeAIAssistant: () => ipcRenderer.invoke('close-ai-assistant'),
  aiSummarizePage: (content: string, context?: string) => ipcRenderer.invoke('ai-summarize-page', content, context),
  aiTranslateContent: (content: string, targetLanguage: string, sourceLanguage?: string) => ipcRenderer.invoke('ai-translate-content', content, targetLanguage, sourceLanguage),
  aiAnalyzePage: (content: string, analysisType: string) => ipcRenderer.invoke('ai-analyze-page', content, analysisType),
  aiExplainContent: (content: string, context?: string) => ipcRenderer.invoke('ai-explain-content', content, context),
  aiCustomPrompt: (prompt: string, context?: string) => ipcRenderer.invoke('ai-custom-prompt', prompt, context),
  aiLearnBehavior: (action: string, context: string) => ipcRenderer.invoke('ai-learn-behavior', action, context),
  getAIStats: () => ipcRenderer.invoke('get-ai-stats'),
  getAIConfig: () => ipcRenderer.invoke('get-ai-config'),
  updateAIConfig: (config: any) => ipcRenderer.invoke('update-ai-config', config),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Tab Management
      createTab: (payload: CreateTabPayload) => Promise<Tab>;
      updateTab: (payload: UpdateTabPayload) => Promise<void>;
      removeTab: (payload: RemoveTabPayload) => Promise<void>;
      activateTab: (payload: ActivateTabPayload) => Promise<void>;
      getTabs: () => Promise<Tab[]>;
      getActiveTab: () => Promise<Tab | null>;

      // Bookmark Management
      getBookmarks: () => Promise<Bookmark[]>;
      createBookmark: (payload: CreateBookmarkPayload) => Promise<Bookmark>;
      updateBookmark: (payload: UpdateBookmarkPayload) => Promise<Bookmark | null>;
      removeBookmark: (payload: RemoveBookmarkPayload) => Promise<boolean>;

      // History Management
      getHistory: () => Promise<HistoryItem[]>;
      addHistory: (payload: AddHistoryPayload) => Promise<HistoryItem>;
      searchHistory: (query: string) => Promise<HistoryItem[]>;
      clearHistory: () => Promise<void>;

      // Settings Management
      getSettings: () => Promise<BrowserSettings>;
      updateSettings: (payload: UpdateSettingsPayload) => Promise<BrowserSettings>;
      resetSettings: () => Promise<BrowserSettings>;

      // Window Management
      createWindow: () => Promise<string>;
      closeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      getWindowState: () => Promise<WindowState | undefined>;

      // Navigation
      navigateTab: (payload: NavigateTabPayload) => Promise<void>;
      goBack: () => Promise<void>;
      goForward: () => Promise<void>;
      reload: () => Promise<void>;
      stopLoading: () => Promise<void>;

      // Dialogs
      showDialog: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;

      // Data Management
      exportData: () => Promise<string>;
      importData: (jsonData: string) => Promise<void>;
      clearAllData: () => Promise<void>;

      // Utility
      getVersion: () => Promise<any>;

      // Event Listeners
      onTabCreated: (callback: (tab: Tab) => void) => void;
      onTabUpdated: (callback: (data: { id: string; updates: Partial<Tab> }) => void) => void;
      onTabClosed: (callback: (tabId: string) => void) => void;
      onTabActivated: (callback: (tab: Tab) => void) => void;
      onTabNavigate: (callback: (data: { id: string; url: string }) => void) => void;

      // Remove all listeners
      removeAllListeners: (channel: string) => void;

      // AI Assistant
      openAIAssistant: () => Promise<boolean>;
      closeAIAssistant: () => Promise<boolean>;
      aiSummarizePage: (content: string, context?: string) => Promise<any>;
      aiTranslateContent: (content: string, targetLanguage: string, sourceLanguage?: string) => Promise<any>;
      aiAnalyzePage: (content: string, analysisType: string) => Promise<any>;
      aiExplainContent: (content: string, context?: string) => Promise<any>;
      aiCustomPrompt: (prompt: string, context?: string) => Promise<any>;
      aiLearnBehavior: (action: string, context: string) => Promise<boolean>;
      getAIStats: () => Promise<any>;
      getAIConfig: () => Promise<any>;
      updateAIConfig: (config: any) => Promise<any>;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}