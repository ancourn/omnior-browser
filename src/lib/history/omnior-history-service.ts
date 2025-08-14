/**
 * Omnior History Service
 * 
 * AI-powered browsing history management with intelligent search,
 * insights, categorization, and privacy-focused features.
 * 
 * Features:
 * - Smart history search with AI insights
 * - Intelligent categorization and organization
 * - Predictive search suggestions
 * - Privacy-focused management
 * - Usage pattern analysis
 * - Cross-device synchronization
 */

import { db } from '@/lib/db'
import { ZAI } from 'z-ai-web-dev-sdk'

export interface HistoryEntry {
  id: string
  url: string
  title: string
  visitTime: Date
  visitCount: number
  typedCount: number
  lastVisitTime: Date
  transitionType: 'link' | 'typed' | 'auto_bookmark' | 'auto_subframe' | 'manual_subframe' | 'generated' | 'auto_toplevel' | 'form_submit' | 'reload' | 'keyword' | 'keyword_generated'
  domain: string
  category?: string
  tags: string[]
  favicon?: string
  screenshot?: string
  contentPreview?: string
  aiInsights?: {
    summary: string
    keyTopics: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
    importance: 'low' | 'medium' | 'high'
    relatedTopics: string[]
    timeSpent?: number
    engagementScore: number
  }
  privacyLevel: 'public' | 'private' | 'sensitive'
  isDeleted: boolean
  isStarred: boolean
  metadata: {
    device?: string
    sessionId?: string
    referrer?: string
    loadTime?: number
    scrollDepth?: number
    interactionCount?: number
  }
}

export interface SearchQuery {
  text: string
  category?: string
  dateRange?: {
    start: Date
    end: Date
  }
  domain?: string
  tags?: string[]
  privacyLevel?: HistoryEntry['privacyLevel']
  limit?: number
  offset?: number
}

export interface SearchResult {
  entries: HistoryEntry[]
  total: number
  suggestions: string[]
  insights: {
    patterns: string[]
    trends: string[]
    recommendations: string[]
  }
  aiSummary?: string
}

export interface HistoryStats {
  totalEntries: number
  totalDomains: number
  topDomains: Array<{ domain: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
  averageDailyVisits: number
  mostActiveHour: number
  searchTrends: Array<{ term: string; frequency: number }>
  privacyDistribution: {
    public: number
    private: number
    sensitive: number
  }
}

class OmniorHistoryService {
  private zai: ZAI | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.zai = await ZAI.create()
      this.isInitialized = true
      console.log('✅ Omnior History Service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Omnior History Service:', error)
      throw error
    }
  }

  /**
   * Add a new history entry
   */
  async addEntry(entry: Omit<HistoryEntry, 'id' | 'visitCount' | 'lastVisitTime'>): Promise<HistoryEntry> {
    await this.ensureInitialized()

    try {
      // Check if entry already exists
      const existingEntry = await db.history.findFirst({
        where: { url: entry.url }
      })

      if (existingEntry) {
        // Update existing entry
        const updated = await db.history.update({
          where: { id: existingEntry.id },
          data: {
            visitCount: existingEntry.visitCount + 1,
            lastVisitTime: new Date(),
            title: entry.title || existingEntry.title,
            tags: [...new Set([...existingEntry.tags, ...entry.tags])],
            metadata: {
              ...existingEntry.metadata,
              ...entry.metadata,
              interactionCount: (existingEntry.metadata?.interactionCount || 0) + 1
            }
          }
        })
        return this.mapToHistoryEntry(updated)
      }

      // Create new entry with AI insights
      const aiInsights = await this.generateAIInsights(entry.url, entry.title)
      const category = await this.categorizeEntry(entry.url, entry.title)

      const newEntry = await db.history.create({
        data: {
          url: entry.url,
          title: entry.title,
          visitTime: entry.visitTime,
          visitCount: 1,
          typedCount: entry.typedCount,
          lastVisitTime: entry.visitTime,
          transitionType: entry.transitionType,
          domain: this.extractDomain(entry.url),
          category,
          tags: entry.tags,
          favicon: entry.favicon,
          screenshot: entry.screenshot,
          contentPreview: entry.contentPreview,
          aiInsights,
          privacyLevel: entry.privacyLevel,
          isDeleted: false,
          isStarred: false,
          metadata: entry.metadata
        }
      })

      return this.mapToHistoryEntry(newEntry)
    } catch (error) {
      console.error('❌ Failed to add history entry:', error)
      throw error
    }
  }

  /**
   * Search history with AI-powered features
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    await this.ensureInitialized()

    try {
      const { text, category, dateRange, domain, tags, privacyLevel, limit = 20, offset = 0 } = query

      // Build search conditions
      const where: any = {
        isDeleted: false,
        AND: []
      }

      if (text) {
        where.AND.push({
          OR: [
            { title: { contains: text, mode: 'insensitive' } },
            { url: { contains: text, mode: 'insensitive' } },
            { contentPreview: { contains: text, mode: 'insensitive' } },
            { tags: { has: text } }
          ]
        })
      }

      if (category) {
        where.AND.push({ category })
      }

      if (dateRange) {
        where.AND.push({
          visitTime: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      }

      if (domain) {
        where.AND.push({ domain })
      }

      if (tags && tags.length > 0) {
        where.AND.push({
          OR: tags.map(tag => ({ tags: { has: tag } }))
        })
      }

      if (privacyLevel) {
        where.AND.push({ privacyLevel })
      }

      // Execute search
      const [entries, total] = await Promise.all([
        db.history.findMany({
          where,
          orderBy: { visitTime: 'desc' },
          take: limit,
          skip: offset
        }),
        db.history.count({ where })
      ])

      const historyEntries = entries.map(this.mapToHistoryEntry)

      // Generate AI-powered enhancements
      const [suggestions, insights, aiSummary] = await Promise.all([
        this.generateSearchSuggestions(text, historyEntries),
        this.generateSearchInsights(historyEntries),
        this.generateAISummary(text, historyEntries)
      ])

      return {
        entries: historyEntries,
        total,
        suggestions,
        insights,
        aiSummary
      }
    } catch (error) {
      console.error('❌ Failed to search history:', error)
      throw error
    }
  }

  /**
   * Get history statistics and analytics
   */
  async getStats(): Promise<HistoryStats> {
    await this.ensureInitialized()

    try {
      const [
        totalEntries,
        domainsData,
        categoriesData,
        hourlyData,
        privacyData
      ] = await Promise.all([
        db.history.count({ where: { isDeleted: false } }),
        db.history.groupBy({
          by: ['domain'],
          where: { isDeleted: false },
          _count: { domain: true },
          orderBy: { _count: { domain: 'desc' } },
          take: 10
        }),
        db.history.groupBy({
          by: ['category'],
          where: { isDeleted: false, category: { not: null } },
          _count: { category: true },
          orderBy: { _count: { category: 'desc' } },
          take: 10
        }),
        db.history.findMany({
          where: { isDeleted: false },
          select: { visitTime: true }
        }),
        db.history.groupBy({
          by: ['privacyLevel'],
          where: { isDeleted: false },
          _count: { privacyLevel: true }
        })
      ])

      // Calculate hourly activity
      const hourlyActivity = new Array(24).fill(0)
      hourlyData.forEach(entry => {
        const hour = new Date(entry.visitTime).getHours()
        hourlyActivity[hour]++
      })

      const mostActiveHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))

      // Calculate average daily visits
      const daysDiff = Math.max(1, Math.ceil(
        (Date.now() - Math.min(...hourlyData.map(h => h.visitTime.getTime()))) / (1000 * 60 * 60 * 24)
      ))
      const averageDailyVisits = totalEntries / daysDiff

      return {
        totalEntries,
        totalDomains: domainsData.length,
        topDomains: domainsData.map(d => ({ domain: d.domain, count: d._count.domain })),
        topCategories: categoriesData.map(c => ({ category: c.category!, count: c._count.category })),
        averageDailyVisits,
        mostActiveHour,
        searchTrends: [], // TODO: Implement search trend analysis
        privacyDistribution: {
          public: privacyData.find(p => p.privacyLevel === 'public')?._count.privacyLevel || 0,
          private: privacyData.find(p => p.privacyLevel === 'private')?._count.privacyLevel || 0,
          sensitive: privacyData.find(p => p.privacyLevel === 'sensitive')?._count.privacyLevel || 0
        }
      }
    } catch (error) {
      console.error('❌ Failed to get history stats:', error)
      throw error
    }
  }

  /**
   * Delete history entries
   */
  async deleteEntries(ids: string[]): Promise<void> {
    await this.ensureInitialized()

    try {
      await db.history.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true }
      })
    } catch (error) {
      console.error('❌ Failed to delete history entries:', error)
      throw error
    }
  }

  /**
   * Clear all history
   */
  async clearAllHistory(): Promise<void> {
    await this.ensureInitialized()

    try {
      await db.history.updateMany({
        where: { isDeleted: false },
        data: { isDeleted: true }
      })
    } catch (error) {
      console.error('❌ Failed to clear history:', error)
      throw error
    }
  }

  /**
   * Toggle star status for history entries
   */
  async toggleStar(ids: string[], starred: boolean): Promise<void> {
    await this.ensureInitialized()

    try {
      await db.history.updateMany({
        where: { id: { in: ids } },
        data: { isStarred: starred }
      })
    } catch (error) {
      console.error('❌ Failed to toggle star status:', error)
      throw error
    }
  }

  // Private helper methods

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  private async generateAIInsights(url: string, title: string): Promise<HistoryEntry['aiInsights']> {
    if (!this.zai) return undefined

    try {
      const prompt = `
        Analyze this webpage and provide insights:
        URL: ${url}
        Title: ${title}
        
        Provide a JSON response with:
        - summary: Brief summary of what this page is about
        - keyTopics: Array of main topics covered
        - sentiment: "positive", "neutral", or "negative"
        - importance: "low", "medium", or "high"
        - relatedTopics: Array of related topics
        - engagementScore: Number from 0-100 indicating engagement potential
      `

      const response = await this.zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (!content) return undefined

      return JSON.parse(content)
    } catch (error) {
      console.error('❌ Failed to generate AI insights:', error)
      return undefined
    }
  }

  private async categorizeEntry(url: string, title: string): Promise<string> {
    if (!this.zai) return 'general'

    try {
      const prompt = `
        Categorize this webpage into one of these categories:
        - news
        - social
        - entertainment
        - education
        - technology
        - shopping
        - finance
        - health
        - travel
        - food
        - sports
        - music
        - video
        - games
        - productivity
        - reference
        - general
        
        URL: ${url}
        Title: ${title}
        
        Respond with only the category name.
      `

      const response = await this.zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      })

      const category = response.choices[0]?.message?.content?.trim().toLowerCase()
      return category || 'general'
    } catch (error) {
      console.error('❌ Failed to categorize entry:', error)
      return 'general'
    }
  }

  private async generateSearchSuggestions(query: string, entries: HistoryEntry[]): Promise<string[]> {
    if (!this.zai || !query) return []

    try {
      const context = entries.slice(0, 5).map(e => `${e.title}: ${e.url}`).join('\n')
      
      const prompt = `
        Based on this search query and recent history, suggest 5 related search terms:
        
        Query: ${query}
        
        Recent History:
        ${context}
        
        Provide 5 suggestions as a JSON array of strings.
      `

      const response = await this.zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })

      const content = response.choices[0]?.message?.content
      if (!content) return []

      return JSON.parse(content)
    } catch (error) {
      console.error('❌ Failed to generate search suggestions:', error)
      return []
    }
  }

  private async generateSearchInsights(entries: HistoryEntry[]): Promise<SearchResult['insights']> {
    if (!this.zai) {
      return {
        patterns: [],
        trends: [],
        recommendations: []
      }
    }

    try {
      const context = entries.slice(0, 10).map(e => ({
        title: e.title,
        url: e.url,
        category: e.category,
        visitTime: e.visitTime
      }))

      const prompt = `
        Analyze these history entries and provide insights:
        
        Entries: ${JSON.stringify(context, null, 2)}
        
        Provide a JSON response with:
        - patterns: Array of browsing behavior patterns
        - trends: Array of emerging trends
        - recommendations: Array of actionable recommendations
      `

      const response = await this.zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return {
          patterns: [],
          trends: [],
          recommendations: []
        }
      }

      return JSON.parse(content)
    } catch (error) {
      console.error('❌ Failed to generate search insights:', error)
      return {
        patterns: [],
        trends: [],
        recommendations: []
      }
    }
  }

  private async generateAISummary(query: string, entries: HistoryEntry[]): Promise<string | undefined> {
    if (!this.zai || !query || entries.length === 0) return undefined

    try {
      const context = entries.slice(0, 5).map(e => `${e.title}: ${e.url}`).join('\n')
      
      const prompt = `
        Summarize these search results for the query "${query}":
        
        Results:
        ${context}
        
        Provide a concise summary that helps the user understand what they've been searching for.
      `

      const response = await this.zai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })

      return response.choices[0]?.message?.content || undefined
    } catch (error) {
      console.error('❌ Failed to generate AI summary:', error)
      return undefined
    }
  }

  private mapToHistoryEntry(dbEntry: any): HistoryEntry {
    return {
      id: dbEntry.id,
      url: dbEntry.url,
      title: dbEntry.title,
      visitTime: new Date(dbEntry.visitTime),
      visitCount: dbEntry.visitCount,
      typedCount: dbEntry.typedCount,
      lastVisitTime: new Date(dbEntry.lastVisitTime),
      transitionType: dbEntry.transitionType,
      domain: dbEntry.domain,
      category: dbEntry.category,
      tags: dbEntry.tags || [],
      favicon: dbEntry.favicon,
      screenshot: dbEntry.screenshot,
      contentPreview: dbEntry.contentPreview,
      aiInsights: dbEntry.aiInsights,
      privacyLevel: dbEntry.privacyLevel,
      isDeleted: dbEntry.isDeleted,
      isStarred: dbEntry.isStarred,
      metadata: dbEntry.metadata || {}
    }
  }
}

// Export singleton instance
export const omniorHistoryService = new OmniorHistoryService()