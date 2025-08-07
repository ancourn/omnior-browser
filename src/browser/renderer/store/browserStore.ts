import { create } from 'zustand';
import { Tab, BrowserSettings, Bookmark, HistoryItem } from '../../types';

interface BrowserState {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  
  // Settings
  settings: BrowserSettings | null;
  
  // Bookmarks
  bookmarks: Bookmark[];
  
  // History
  history: HistoryItem[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  // Tab Actions
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  setActiveTabId: (tabId: string | null) => void;
  
  // Settings Actions
  setSettings: (settings: BrowserSettings) => void;
  updateSettings: (updates: Partial<BrowserSettings>) => void;
  
  // Bookmark Actions
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  removeBookmark: (id: string) => void;
  
  // History Actions
  setHistory: (history: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  // Initial State
  tabs: [],
  activeTabId: null,
  settings: null,
  bookmarks: [],
  history: [],
  isLoading: false,
  error: null,

  // Tab Actions
  addTab: (tab) => {
    set((state) => {
      const newTabs = [...state.tabs, tab];
      
      // If this tab is active, deactivate others
      if (tab.isActive) {
        newTabs.forEach(t => {
          if (t.id !== tab.id) {
            t.isActive = false;
          }
        });
      }
      
      return {
        tabs: newTabs,
        activeTabId: tab.isActive ? tab.id : state.activeTabId
      };
    });
  },

  removeTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = state.activeTabId;
      
      // If we removed the active tab, activate another one
      if (state.activeTabId === tabId && newTabs.length > 0) {
        const removedTabIndex = state.tabs.findIndex(tab => tab.id === tabId);
        const newActiveTab = newTabs[Math.max(0, removedTabIndex - 1)];
        newActiveTab.isActive = true;
        newActiveTabId = newActiveTab.id;
      }
      
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    });
  },

  activateTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId
      }));
      
      return {
        tabs: newTabs,
        activeTabId: tabId
      };
    });
  },

  updateTab: (tabId, updates) => {
    set((state) => ({
      tabs: state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    }));
  },

  setActiveTabId: (tabId) => {
    set({ activeTabId: tabId });
  },

  // Settings Actions
  setSettings: (settings) => {
    set({ settings });
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updates } : null
    }));
  },

  // Bookmark Actions
  setBookmarks: (bookmarks) => {
    set({ bookmarks });
  },

  addBookmark: (bookmark) => {
    set((state) => ({
      bookmarks: [...state.bookmarks, bookmark]
    }));
  },

  updateBookmark: (id, updates) => {
    set((state) => ({
      bookmarks: state.bookmarks.map(bookmark =>
        bookmark.id === id ? { ...bookmark, ...updates } : bookmark
      )
    }));
  },

  removeBookmark: (id) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== id)
    }));
  },

  // History Actions
  setHistory: (history) => {
    set({ history });
  },

  addHistoryItem: (item) => {
    set((state) => {
      // Check if URL already exists
      const existingIndex = state.history.findIndex(h => h.url === item.url);
      
      if (existingIndex >= 0) {
        // Update existing item
        const newHistory = [...state.history];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          title: item.title,
          visitTime: item.visitTime,
          visitCount: newHistory[existingIndex].visitCount + 1
        };
        
        // Move to beginning
        newHistory.splice(existingIndex, 1);
        newHistory.unshift(item);
        
        return { history: newHistory };
      }
      
      // Add new item
      const newHistory = [item, ...state.history];
      
      // Limit history size
      if (newHistory.length > 10000) {
        newHistory.splice(10000);
      }
      
      return { history: newHistory };
    });
  },

  removeHistoryItem: (id) => {
    set((state) => ({
      history: state.history.filter(item => item.id !== id)
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  // UI Actions
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Selectors
  getActiveTab: () => {
    const state = get();
    return state.tabs.find(tab => tab.id === state.activeTabId) || null;
  },

  getTabById: (id: string) => {
    const state = get();
    return state.tabs.find(tab => tab.id === id) || null;
  },

  getBookmarksTree: () => {
    const state = get();
    const buildTree = (bookmarks: Bookmark[], parentId?: string): Bookmark[] => {
      return bookmarks
        .filter(bookmark => bookmark.parentId === parentId)
        .map(bookmark => ({
          ...bookmark,
          children: bookmark.folder ? buildTree(bookmarks, bookmark.id) : undefined
        }));
    };
    
    return buildTree(state.bookmarks);
  },

  searchHistory: (query: string) => {
    const state = get();
    const lowercaseQuery = query.toLowerCase();
    
    return state.history.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.url.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 100);
  }
}));