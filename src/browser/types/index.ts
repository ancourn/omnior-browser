// Core browser types and interfaces

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  isActive: boolean;
  isIncognito: boolean;
  createdAt: number;
  lastAccessed: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  parentId?: string;
  createdAt: number;
  folder?: boolean;
  children?: Bookmark[];
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitTime: number;
  visitCount: number;
}

export interface TabData {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  isPrivate: boolean;
  createdAt: number;
  lastAccessed: number;
}

export interface SessionWindowData {
  id: number;
  tabs: TabData[];
  activeTabId: string | null;
  bounds: Electron.Rectangle | null;
  isPrivate: boolean;
  createdAt: number;
}

export interface SessionData {
  windows: SessionWindowData[];
  lastActiveWindow: number | null;
  privateWindows: SessionWindowData[];
  timestamp: number;
  version: string;
}

export interface BrowserSettings {
  theme: 'light' | 'dark' | 'system';
  startupBehavior: 'newTab' | 'continue' | 'specificPages';
  startupUrls?: string[];
  searchEngine: 'google' | 'bing' | 'duckduckgo' | 'custom';
  customSearchUrl?: string;
  downloadPath: string;
  alwaysShowBookmarksBar: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
  enableJavaScript: boolean;
  enableCookies: boolean;
  clearBrowsingData: {
    cookies: boolean;
    cache: boolean;
    history: boolean;
    passwords: boolean;
    formData: boolean;
  };
}

export interface WindowState {
  id: string;
  tabs: Tab[];
  activeTabId: string;
  isIncognito: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
  };
}

export interface BrowserProfile {
  id: string;
  name: string;
  isDefault: boolean;
  settings: BrowserSettings;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  sessions: WindowState[];
}

// IPC Communication Types
export interface IPCMessage {
  type: string;
  payload?: any;
  id?: string;
}

export interface CreateTabPayload {
  url?: string;
  active?: boolean;
  incognito?: boolean;
}

export interface UpdateTabPayload {
  id: string;
  updates: Partial<Tab>;
}

export interface RemoveTabPayload {
  id: string;
}

export interface ActivateTabPayload {
  id: string;
}

export interface NavigateTabPayload {
  id: string;
  url: string;
}

export interface CreateBookmarkPayload {
  url: string;
  title: string;
  parentId?: string;
}

export interface UpdateBookmarkPayload {
  id: string;
  updates: Partial<Bookmark>;
}

export interface RemoveBookmarkPayload {
  id: string;
}

export interface AddHistoryPayload {
  url: string;
  title: string;
}

export interface UpdateSettingsPayload {
  settings: Partial<BrowserSettings>;
}

// Search Engine Configurations
export const SEARCH_ENGINES = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q={query}'
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q={query}'
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q={query}'
  }
} as const;

// Default Settings
export const DEFAULT_SETTINGS: BrowserSettings = {
  theme: 'system',
  startupBehavior: 'newTab',
  searchEngine: 'google',
  downloadPath: '',
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
};