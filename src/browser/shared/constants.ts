import { Settings, SearchEngine } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  general: {
    homepage: 'https://omnior.browser',
    startupBehavior: 'homepage',
    defaultSearchEngine: 'google',
    theme: 'system',
    language: 'en-US'
  },
  privacy: {
    blockTrackers: true,
    blockAds: true,
    sendDoNotTrack: true,
    clearBrowsingData: {
      cookies: false,
      cache: false,
      history: false,
      passwords: false
    }
  },
  security: {
    safeBrowsing: true,
    siteSettings: {}
  },
  advanced: {
    enableHardwareAcceleration: true,
    proxySettings: {
      mode: 'none'
    }
  }
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    name: 'Google',
    url: 'https://www.google.com/search?q={query}',
    icon: '🔍',
    shortcut: 'g'
  },
  {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q={query}',
    icon: '🦆',
    shortcut: 'd'
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com/search?q={query}',
    icon: '🔍',
    shortcut: 'b'
  },
  {
    name: 'Brave Search',
    url: 'https://search.brave.com/search?q={query}',
    icon: '🦁',
    shortcut: 'brave'
  }
]

export const DEFAULT_BOOKMARKS = [
  {
    id: 'toolbar',
    url: '',
    title: 'Bookmarks Toolbar',
    folder: true,
    createdAt: new Date(),
    children: [
      {
        id: 'omnior-home',
        url: 'https://omnior.browser',
        title: 'Omnior Browser',
        createdAt: new Date(),
        parentId: 'toolbar'
      },
      {
        id: 'github',
        url: 'https://github.com/ancourn/omnior-browser',
        title: 'Omnior on GitHub',
        createdAt: new Date(),
        parentId: 'toolbar'
      }
    ]
  }
]

export const PERMISSIONS = {
  // Tab permissions
  TABS: 'tabs',
  ACTIVE_TAB: 'activeTab',
  BOOKMARKS: 'bookmarks',
  HISTORY: 'history',
  STORAGE: 'storage',
  DOWNLOADS: 'downloads',
  NOTIFICATIONS: 'notifications',
  GEOLOCATION: 'geolocation',
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  COOKIES: 'cookies'
}

export const DEFAULT_PERMISSIONS = [
  PERMISSIONS.TABS,
  PERMISSIONS.ACTIVE_TAB,
  PERMISSIONS.BOOKMARKS,
  PERMISSIONS.HISTORY,
  PERMISSIONS.STORAGE
]

// Utility functions
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

export function getSearchUrl(query: string, searchEngine: string = 'google'): string {
  const engine = SEARCH_ENGINES.find(e => e.name.toLowerCase() === searchEngine.toLowerCase())
  if (!engine) return SEARCH_ENGINES[0].url.replace('{query}', encodeURIComponent(query))
  
  return engine.url.replace('{query}', encodeURIComponent(query))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}