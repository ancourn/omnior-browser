import Fuse from 'fuse.js'

// Types for search results
export interface SearchResult {
  id: string
  type: 'tab' | 'history' | 'bookmark' | 'page-content' | 'extension'
  title: string
  url?: string
  content?: string
  favicon?: string
  score: number
  timestamp?: number
  isPrivate?: boolean
  categoryId?: string
}

export interface SearchSource {
  name: string
  icon: string
  search: (query: string) => Promise<SearchResult[]>
}

export interface SearchOptions {
  sources?: string[]
  excludePrivate?: boolean
  maxResults?: number
  threshold?: number
}

// Mock data for demonstration
const mockTabs = [
  {
    id: 'tab-1',
    title: 'GitHub - Omnior Browser',
    url: 'https://github.com/omnior/browser',
    favicon: 'https://github.com/favicon.ico',
    isPrivate: false,
    lastAccessed: Date.now() - 1000 * 60 * 5 // 5 minutes ago
  },
  {
    id: 'tab-2',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    favicon: 'https://developer.mozilla.org/favicon.ico',
    isPrivate: false,
    lastAccessed: Date.now() - 1000 * 60 * 15 // 15 minutes ago
  },
  {
    id: 'tab-3',
    title: 'Private Banking - My Bank',
    url: 'https://mybank.com/private',
    favicon: 'https://mybank.com/favicon.ico',
    isPrivate: true,
    lastAccessed: Date.now() - 1000 * 60 * 30 // 30 minutes ago
  }
]

const mockHistory = [
  {
    id: 'hist-1',
    title: 'React Documentation - Components',
    url: 'https://react.dev/learn/components',
    favicon: 'https://react.dev/favicon.ico',
    timestamp: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
  },
  {
    id: 'hist-2',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/',
    favicon: 'https://www.typescriptlang.org/favicon.ico',
    timestamp: Date.now() - 1000 * 60 * 60 * 5 // 5 hours ago
  },
  {
    id: 'hist-3',
    title: 'Tailwind CSS Documentation',
    url: 'https://tailwindcss.com/docs',
    favicon: 'https://tailwindcss.com/favicon.ico',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 // 1 day ago
  }
]

const mockBookmarks = [
  {
    id: 'bm-1',
    title: 'Omnior Browser - Official Site',
    url: 'https://omnior.dev',
    favicon: 'https://omnior.dev/favicon.ico',
    categoryId: 'development'
  },
  {
    id: 'bm-2',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    favicon: 'https://stackoverflow.com/favicon.ico',
    categoryId: 'development'
  },
  {
    id: 'bm-3',
    title: 'Design Inspiration - Dribbble',
    url: 'https://dribbble.com',
    favicon: 'https://dribbble.com/favicon.ico',
    categoryId: 'design'
  }
]

const mockPageContent = [
  {
    id: 'content-1',
    title: 'Current Page - Documentation',
    url: 'https://example.com/docs',
    content: 'This page contains comprehensive documentation about web development, including HTML, CSS, and JavaScript tutorials.',
    tabId: 'tab-1'
  },
  {
    id: 'content-2',
    title: 'Blog Post - Modern Web Development',
    url: 'https://example.com/blog/modern-web',
    content: 'Modern web development involves using frameworks like React, Vue, and Angular to build interactive user interfaces.',
    tabId: 'tab-2'
  }
]

const mockExtensions = [
  {
    id: 'ext-1',
    title: 'Dark Mode Toggle',
    description: 'Toggle dark mode for any website',
    command: 'dark-mode:toggle'
  },
  {
    id: 'ext-2',
    title: 'Screenshot Tool',
    description: 'Capture screenshots of web pages',
    command: 'screenshot:capture'
  },
  {
    id: 'ext-3',
    title: 'Code Highlighter',
    description: 'Syntax highlighting for code blocks',
    command: 'highlight:code'
  }
]

// Configure Fuse.js for each data type
const tabsFuse = new Fuse(mockTabs, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const historyFuse = new Fuse(mockHistory, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const bookmarksFuse = new Fuse(mockBookmarks, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const pageContentFuse = new Fuse(mockPageContent, {
  keys: ['title', 'content', 'url'],
  threshold: 0.4,
  includeScore: true
})

const extensionsFuse = new Fuse(mockExtensions, {
  keys: ['title', 'description', 'command'],
  threshold: 0.3,
  includeScore: true
})

// Search sources implementation
const searchSources: Record<string, SearchSource> = {
  tabs: {
    name: 'Tabs',
    icon: '🔵',
    search: async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      
      const results = tabsFuse.search(query)
      return results.map(result => ({
        id: result.item.id,
        type: 'tab' as const,
        title: result.item.title,
        url: result.item.url,
        favicon: result.item.favicon,
        score: result.score || 0,
        timestamp: result.item.lastAccessed,
        isPrivate: result.item.isPrivate
      }))
    }
  },
  
  history: {
    name: 'History',
    icon: '🕒',
    search: async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      
      const results = historyFuse.search(query)
      return results.map(result => ({
        id: result.item.id,
        type: 'history' as const,
        title: result.item.title,
        url: result.item.url,
        favicon: result.item.favicon,
        score: result.score || 0,
        timestamp: result.item.timestamp
      }))
    }
  },
  
  bookmarks: {
    name: 'Bookmarks',
    icon: '⭐',
    search: async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      
      const results = bookmarksFuse.search(query)
      return results.map(result => ({
        id: result.item.id,
        type: 'bookmark' as const,
        title: result.item.title,
        url: result.item.url,
        favicon: result.item.favicon,
        score: result.score || 0,
        categoryId: result.item.categoryId
      }))
    }
  },
  
  'page-content': {
    name: 'Page Content',
    icon: '📄',
    search: async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      
      const results = pageContentFuse.search(query)
      return results.map(result => ({
        id: result.item.id,
        type: 'page-content' as const,
        title: result.item.title,
        url: result.item.url,
        content: result.item.content,
        score: result.score || 0
      }))
    }
  },
  
  extensions: {
    name: 'Extensions',
    icon: '🧩',
    search: async (query: string): Promise<SearchResult[]> => {
      if (!query.trim()) return []
      
      const results = extensionsFuse.search(query)
      return results.map(result => ({
        id: result.item.id,
        type: 'extension' as const,
        title: result.item.title,
        content: result.item.description,
        score: result.score || 0
      }))
    }
  }
}

class SearchService {
  private debounceTimer: NodeJS.Timeout | null = null
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      sources = Object.keys(searchSources),
      excludePrivate = false,
      maxResults = 50,
      threshold = 0.5
    } = options
    
    if (!query.trim()) {
      return []
    }
    
    // Clear previous debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    // Return a promise that resolves after debounce
    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          const allResults: SearchResult[] = []
          
          // Search all enabled sources in parallel
          const searchPromises = sources
            .filter(source => searchSources[source])
            .map(async (source) => {
              const results = await searchSources[source].search(query)
              return results.filter(result => {
                // Filter out private results if excluded
                if (excludePrivate && result.isPrivate) {
                  return false
                }
                // Filter by score threshold
                return result.score <= threshold
              })
            })
          
          const sourceResults = await Promise.all(searchPromises)
          
          // Flatten and combine results
          sourceResults.forEach(results => {
            allResults.push(...results)
          })
          
          // Sort by score (lower is better) and timestamp (more recent is better)
          const sortedResults = allResults.sort((a, b) => {
            const scoreDiff = a.score - b.score
            if (Math.abs(scoreDiff) > 0.1) {
              return scoreDiff
            }
            // If scores are similar, prefer more recent items
            return (b.timestamp || 0) - (a.timestamp || 0)
          })
          
          // Limit results
          resolve(sortedResults.slice(0, maxResults))
        } catch (error) {
          console.error('Search error:', error)
          resolve([])
        }
      }, 200) // 200ms debounce
    })
  }
  
  getAvailableSources(): SearchSource[] {
    return Object.values(searchSources)
  }
  
  // Tab management actions
  async switchToTab(tabId: string): Promise<void> {
    // In a real implementation, this would use IPC to communicate with the main process
    console.log(`Switching to tab: ${tabId}`)
    // Simulate tab switching
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  async closeTab(tabId: string): Promise<void> {
    console.log(`Closing tab: ${tabId}`)
    // Simulate tab closing
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  async pinTab(tabId: string, pinned: boolean = true): Promise<void> {
    console.log(`${pinned ? 'Pinning' : 'Unpinning'} tab: ${tabId}`)
    // Simulate tab pinning
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  async mergeTabsIntoGroup(tabIds: string[], groupName?: string): Promise<void> {
    console.log(`Merging tabs ${tabIds.join(', ')} into group: ${groupName || 'New Group'}`)
    // Simulate tab grouping
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

export const searchService = new SearchService()
export type { SearchSource }