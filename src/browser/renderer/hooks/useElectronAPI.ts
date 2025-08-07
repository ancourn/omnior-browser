import { useEffect } from 'react';

export const useElectronAPI = () => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    // Return a mock API for development/testing
    return {
      // Tab Management
      createTab: async () => ({ id: 'mock-tab', url: 'about:blank', title: 'New Tab', isLoading: false, isActive: true, isIncognito: false, createdAt: Date.now(), lastAccessed: Date.now() }),
      updateTab: async () => {},
      removeTab: async () => {},
      activateTab: async () => {},
      getTabs: async () => [],
      getActiveTab: async () => null,

      // Bookmark Management
      getBookmarks: async () => [],
      createBookmark: async () => ({ id: 'mock-bookmark', url: 'https://example.com', title: 'Example', createdAt: Date.now() }),
      updateBookmark: async () => null,
      removeBookmark: async () => false,

      // History Management
      getHistory: async () => [],
      addHistory: async () => ({ id: 'mock-history', url: 'https://example.com', title: 'Example', visitTime: Date.now(), visitCount: 1 }),
      searchHistory: async () => [],
      clearHistory: async () => {},

      // Settings Management
      getSettings: async () => ({
        theme: 'system',
        startupBehavior: 'newTab',
        searchEngine: 'google',
        downloadPath: '/Downloads',
        alwaysShowBookmarksBar: false,
        blockAds: true,
        blockTrackers: true,
        enableJavaScript: true,
        enableCookies: true,
        clearBrowsingData: {
          cookies: true,
          cache: true,
          history: false,
          passwords: false,
          formData: true
        }
      }),
      updateSettings: async () => ({}),
      resetSettings: async () => ({}),

      // Window Management
      createWindow: async () => 'mock-window',
      closeWindow: async () => {},
      minimizeWindow: async () => {},
      maximizeWindow: async () => {},
      getWindowState: async () => undefined,

      // Navigation
      navigateTab: async () => {},
      goBack: async () => {},
      goForward: async () => {},
      reload: async () => {},
      stopLoading: async () => {},

      // Dialogs
      showDialog: async () => ({ response: 0 }),
      showOpenDialog: async () => ({ filePaths: [] }),
      showSaveDialog: async () => ({ filePath: '' }),

      // Data Management
      exportData: async () => '{}',
      importData: async () => {},
      clearAllData: async () => {},

      // Utility
      getVersion: async () => ({
        version: '1.0.0',
        name: 'Omnior Browser',
        electron: '25.0.0',
        chrome: '118.0.5993.88',
        node: '18.17.0'
      }),

      // Event Listeners
      onTabCreated: () => {},
      onTabUpdated: () => {},
      onTabClosed: () => {},
      onTabActivated: () => {},
      onTabNavigate: () => {},

      // Remove all listeners
      removeAllListeners: () => {}
    };
  }

  return window.electronAPI;
};