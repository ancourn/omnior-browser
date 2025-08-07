import { create } from 'zustand';
import { Tab, BrowserSettings, Bookmark, HistoryItem, TabGroup } from '../../types';

interface BrowserState {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  
  // Tab Groups
  tabGroups: TabGroup[];
  
  // Settings
  settings: BrowserSettings | null;
  
  // Bookmarks
  bookmarks: Bookmark[];
  
  // History
  history: HistoryItem[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Layout State
  splitViewEnabled: boolean;
  splitViewOrientation: 'horizontal' | 'vertical';
  leftTabId: string | null;
  rightTabId: string | null;
  
  // Getters
  activeTab: Tab | null;
  getLeftTab: Tab | null;
  getRightTab: Tab | null;
  
  // Actions
  // Tab Actions
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  setActiveTabId: (tabId: string | null) => void;
  
  // Tab Group Actions
  addTabGroup: (group: TabGroup) => void;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  removeTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  
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
  
  // Layout Actions
  setSplitViewEnabled: (enabled: boolean) => void;
  setSplitViewOrientation: (orientation: 'horizontal' | 'vertical') => void;
  setSplitViewTabs: (leftTabId: string | null, rightTabId: string | null) => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  // Initial State
  tabs: [],
  activeTabId: null,
  tabGroups: [],
  settings: null,
  bookmarks: [],
  history: [],
  isLoading: false,
  error: null,
  splitViewEnabled: false,
  splitViewOrientation: 'horizontal',
  leftTabId: null,
  rightTabId: null,
  activeTab: null,
  getLeftTab: null,
  getRightTab: null,

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
        activeTabId: tab.isActive ? tab.id : state.activeTabId,
        activeTab: tab.isActive ? tab : state.activeTab
      };
    });
  },

  removeTab: (tabId) => {
    set((state) => {
      const newTabs = state.tabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = state.activeTabId;
      let newActiveTab = state.activeTab;
      
      // If we removed the active tab, activate another one
      if (state.activeTabId === tabId && newTabs.length > 0) {
        const removedTabIndex = state.tabs.findIndex(tab => tab.id === tabId);
        const newActiveTabObj = newTabs[Math.max(0, removedTabIndex - 1)];
        newActiveTabObj.isActive = true;
        newActiveTabId = newActiveTabObj.id;
        newActiveTab = newActiveTabObj;
      } else if (state.activeTabId === tabId) {
        newActiveTabId = null;
        newActiveTab = null;
      }
      
      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
        activeTab: newActiveTab
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
        activeTabId: tabId,
        activeTab: newTabs.find(tab => tab.id === tabId) || null
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
    set((state) => ({
      activeTabId: tabId,
      activeTab: state.tabs.find(tab => tab.id === tabId) || null
    }));
  },

  // Tab Group Actions
  addTabGroup: (group) => {
    set((state) => ({
      tabGroups: [...state.tabGroups, group]
    }));
  },

  updateTabGroup: (groupId, updates) => {
    set((state) => ({
      tabGroups: state.tabGroups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    }));
  },

  removeTabGroup: (groupId) => {
    set((state) => {
      // Remove group and ungroup all tabs in this group
      const updatedTabs = state.tabs.map(tab =>
        tab.groupId === groupId ? { ...tab, groupId: undefined } : tab
      );
      
      return {
        tabGroups: state.tabGroups.filter(group => group.id !== groupId),
        tabs: updatedTabs
      };
    });
  },

  addTabToGroup: (tabId, groupId) => {
    set((state) => {
      const updatedTabs = state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, groupId } : tab
      );
      
      // Update group's tabIds
      const updatedGroups = state.tabGroups.map(group =>
        group.id === groupId 
          ? { ...group, tabIds: [...group.tabIds, tabId] }
          : group
      );
      
      return {
        tabs: updatedTabs,
        tabGroups: updatedGroups
      };
    });
  },

  removeTabFromGroup: (tabId) => {
    set((state) => {
      const updatedTabs = state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, groupId: undefined } : tab
      );
      
      // Remove tabId from all groups
      const updatedGroups = state.tabGroups.map(group => ({
        ...group,
        tabIds: group.tabIds.filter(id => id !== tabId)
      }));
      
      return {
        tabs: updatedTabs,
        tabGroups: updatedGroups
      };
    });
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

  // Layout Actions
  setSplitViewEnabled: (enabled) => {
    set({ splitViewEnabled: enabled });
  },

  setSplitViewOrientation: (orientation) => {
    set({ splitViewOrientation: orientation });
  },

  setSplitViewTabs: (leftTabId, rightTabId) => {
    set((state) => ({
      leftTabId,
      rightTabId,
      getLeftTab: state.tabs.find(tab => tab.id === leftTabId) || null,
      getRightTab: state.tabs.find(tab => tab.id === rightTabId) || null
    }));
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
  },

  // Tab Group Selectors
  getTabGroupById: (groupId: string) => {
    const state = get();
    return state.tabGroups.find(group => group.id === groupId) || null;
  },

  getTabsInGroup: (groupId: string) => {
    const state = get();
    return state.tabs.filter(tab => tab.groupId === groupId);
  },

  getUngroupedTabs: () => {
    const state = get();
    return state.tabs.filter(tab => !tab.groupId);
  },

  // Layout Selectors
  getLeftTab: () => {
    const state = get();
    return state.tabs.find(tab => tab.id === state.leftTabId) || null;
  },

  getRightTab: () => {
    const state = get();
    return state.tabs.find(tab => tab.id === state.rightTabId) || null;
  },

  getSplitViewTabs: () => {
    const state = get();
    return {
      left: state.tabs.find(tab => tab.id === state.leftTabId) || null,
      right: state.tabs.find(tab => tab.id === state.rightTabId) || null
    };
  }
}));