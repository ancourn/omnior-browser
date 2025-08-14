/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import * as Fuse from 'fuse.js'
import ZAI from 'z-ai-web-dev-sdk'

// Types for search results
export interface SearchResult {
  id: string
  type: 'tab' | 'history' | 'bookmark' | 'page-content' | 'extension' | 'webpage' | 'document' | 'pdf' | 'note' | 'code'
  title: string
  url?: string
  content?: string
  description?: string
  favicon?: string
  score: number
  timestamp?: number
  isPrivate?: boolean
  categoryId?: string
  aiCategory?: string
  aiRelevance?: number
  aiSummary?: string
  aiTags?: string[]
  aiSentiment?: 'positive' | 'negative' | 'neutral'
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
  enableAIFiltering?: boolean
  enableAICategorization?: boolean
  enableAISummarization?: boolean
  aiFilterCategories?: string[]
  aiMinRelevance?: number
}

export interface SearchContext {
  query: string
  sources: string[]
  timestamp: number
  sessionId: string
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
const tabsFuse = new Fuse.default(mockTabs, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const historyFuse = new Fuse.default(mockHistory, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const bookmarksFuse = new Fuse.default(mockBookmarks, {
  keys: ['title', 'url'],
  threshold: 0.3,
  includeScore: true
})

const pageContentFuse = new Fuse.default(mockPageContent, {
  keys: ['title', 'content', 'url'],
  threshold: 0.4,
  includeScore: true
})

const extensionsFuse = new Fuse.default(mockExtensions, {
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
  private zai: ZAI | null = null
  
  constructor() {
    this.initializeZAI()
  }
  
  private async initializeZAI(): Promise<void> {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize ZAI:', error)
    }
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<{ results: SearchResult[], context: SearchContext }> {
    const {
      sources = Object.keys(searchSources),
      excludePrivate = false,
      maxResults = 50,
      threshold = 0.5,
      enableAIFiltering = false,
      enableAICategorization = false,
      enableAISummarization = false,
      aiFilterCategories = [],
      aiMinRelevance = 0.5
    } = options
    
    if (!query.trim()) {
      return { results: [], context: { query, sources, timestamp: Date.now(), sessionId: crypto.randomUUID() } }
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
          let limitedResults = sortedResults.slice(0, maxResults)
          
          // Apply AI-powered filtering and categorization if enabled
          if (enableAIFiltering || enableAICategorization || enableAISummarization) {
            limitedResults = await this.applyAIProcessing(limitedResults, query, {
              enableAIFiltering,
              enableAICategorization,
              enableAISummarization,
              aiFilterCategories,
              aiMinRelevance
            })
          }
          
          resolve({
            results: limitedResults,
            context: {
              query,
              sources,
              timestamp: Date.now(),
              sessionId: crypto.randomUUID()
            }
          })
        } catch (error) {
          console.error('Search error:', error)
          resolve({
            results: [],
            context: { query, sources, timestamp: Date.now(), sessionId: crypto.randomUUID() }
          })
        }
      }, 200) // 200ms debounce
    })
  }
  
  private async applyAIProcessing(
    results: SearchResult[], 
    query: string,
    options: {
      enableAIFiltering: boolean
      enableAICategorization: boolean
      enableAISummarization: boolean
      aiFilterCategories: string[]
      aiMinRelevance: number
    }
  ): Promise<SearchResult[]> {
    if (!this.zai) {
      console.warn('AI not available, skipping AI processing')
      return results
    }
    
    try {
      const processedResults = await Promise.all(
        results.map(async (result) => {
          const processedResult = { ...result }
          
          // AI categorization
          if (options.enableAICategorization) {
            const category = await this.categorizeResult(result, query)
            processedResult.aiCategory = category.category
            processedResult.aiRelevance = category.relevance
            processedResult.aiTags = category.tags
          }
          
          // AI summarization
          if (options.enableAISummarization && (result.content || result.description)) {
            const summary = await this.summarizeResult(result, query)
            processedResult.aiSummary = summary
          }
          
          // AI sentiment analysis
          if (result.content || result.description) {
            const sentiment = await this.analyzeSentiment(result)
            processedResult.aiSentiment = sentiment
          }
          
          return processedResult
        })
      )
      
      // AI filtering
      if (options.enableAIFiltering) {
        return processedResults.filter(result => {
          // Filter by AI categories if specified
          if (options.aiFilterCategories.length > 0 && result.aiCategory) {
            if (!options.aiFilterCategories.includes(result.aiCategory)) {
              return false
            }
          }
          
          // Filter by AI relevance score
          if (result.aiRelevance !== undefined && result.aiRelevance < options.aiMinRelevance) {
            return false
          }
          
          return true
        })
      }
      
      return processedResults
    } catch (error) {
      console.error('AI processing failed:', error)
      return results
    }
  }
  
  private async categorizeResult(
    result: SearchResult, 
    query: string
  ): Promise<{ category: string; relevance: number; tags: string[] }> {
    try {
      const prompt = `
        Analyze the following search result and categorize it based on the query "${query}":
        
        Title: ${result.title}
        URL: ${result.url || 'N/A'}
        Content: ${result.content || result.description || 'N/A'}
        Type: ${result.type}
        
        Provide:
        1. A single category (e.g., Technology, News, Documentation, Tutorial, Reference, Social Media, E-commerce, etc.)
        2. A relevance score from 0 to 1 (how relevant this result is to the query)
        3. 3-5 relevant tags
        
        Respond in JSON format: {"category": "string", "relevance": number, "tags": ["string", "string", ...]}
      `
      
      const completion = await this.zai!.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI-powered search categorization engine. Provide accurate categorization and relevance scoring.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
      
      const response = completion.choices[0]?.message?.content
      if (!response) {
        return { category: 'General', relevance: 0.5, tags: [] }
      }
      
      try {
        const parsed = JSON.parse(response)
        return {
          category: parsed.category || 'General',
          relevance: Math.max(0, Math.min(1, parsed.relevance || 0.5)),
          tags: parsed.tags || []
        }
      } catch {
        return { category: 'General', relevance: 0.5, tags: [] }
      }
    } catch (error) {
      console.error('Categorization failed:', error)
      return { category: 'General', relevance: 0.5, tags: [] }
    }
  }
  
  private async summarizeResult(result: SearchResult, query: string): Promise<string> {
    try {
      const content = result.content || result.description || ''
      if (content.length < 100) {
        return content
      }
      
      const prompt = `
        Summarize the following content in 1-2 sentences, focusing on aspects relevant to the query "${query}":
        
        Content: ${content}
        
        Provide a concise summary that captures the main points.
      `
      
      const completion = await this.zai!.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI-powered summarization engine. Provide concise, relevant summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 150
      })
      
      return completion.choices[0]?.message?.content || content.substring(0, 150) + '...'
    } catch (error) {
      console.error('Summarization failed:', error)
      return (result.content || result.description || '').substring(0, 150) + '...'
    }
  }
  
  private async analyzeSentiment(result: SearchResult): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      const content = result.content || result.description || ''
      if (content.length < 10) {
        return 'neutral'
      }
      
      const prompt = `
        Analyze the sentiment of the following text and respond with only one word: "positive", "negative", or "neutral":
        
        Text: ${content}
      `
      
      const completion = await this.zai!.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis engine. Provide accurate sentiment classification.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 10
      })
      
      const response = completion.choices[0]?.message?.content?.toLowerCase().trim()
      if (response?.includes('positive')) return 'positive'
      if (response?.includes('negative')) return 'negative'
      return 'neutral'
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return 'neutral'
    }
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