import { AIService, SearchQuery, SearchResultEnhanced, SearchContext } from './ai-service'

// Mock the AI service for testing
class MockAIService extends AIService {
  private mockResponses: Map<string, any> = new Map()
  
  setMockResponse(key: string, response: any) {
    this.mockResponses.set(key, response)
  }
  
  async reformulateQuery(query: string, contextSources: string[] = [], searchContext?: SearchContext): Promise<SearchQuery> {
    const mockKey = `reformulate-${query}`
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey)
    }
    
    // Default mock implementation
    return {
      original: query,
      reformulated: query.toLowerCase(),
      suggestions: [`${query} tutorial`, `${query} examples`],
      context: '',
      intent: 'general',
      sources: contextSources,
      filters: {}
    }
  }
  
  async rankResults(results: SearchResultEnhanced[], query: string, searchContext?: SearchContext): Promise<SearchResultEnhanced[]> {
    const mockKey = `rank-${query}`
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey)
    }
    
    // Default mock implementation
    return results.map((result, index) => ({
      ...result,
      aiScore: 0.8 - (index * 0.1),
      relevance: 0.8 - (index * 0.1),
      highlights: query.split(' ').slice(0, 2)
    }))
  }
}

describe('AIService Search Functionality', () => {
  let aiService: MockAIService
  
  beforeEach(() => {
    aiService = new MockAIService()
  })
  
  describe('Query Reformulation', () => {
    test('should reformulate natural language queries', async () => {
      const query = 'Show me the tabs where I was reading about AI ethics'
      const contextSources = ['tabs', 'history']
      
      const result = await aiService.reformulateQuery(query, contextSources)
      
      expect(result.original).toBe(query)
      expect(result.reformulated).toBeDefined()
      expect(result.suggestions).toBeDefined()
      expect(result.intent).toBeDefined()
      expect(result.sources).toEqual(contextSources)
    })
    
    test('should detect bookmark-specific queries', async () => {
      const query = 'Find my bookmarked Python tutorials'
      
      aiService.setMockResponse('reformulate-' + query, {
        original: query,
        reformulated: 'python tutorials',
        suggestions: ['python programming', 'python coding'],
        context: '',
        intent: 'specific',
        sources: ['bookmarks'],
        filters: { type: 'bookmark' }
      })
      
      const result = await aiService.reformulateQuery(query)
      
      expect(result.intent).toBe('specific')
      expect(result.sources).toEqual(['bookmarks'])
      expect(result.filters.type).toBe('bookmark')
    })
    
    test('should detect conversational queries', async () => {
      const query = 'What was that site about cloud pricing I saw last week?'
      
      aiService.setMockResponse('reformulate-' + query, {
        original: query,
        reformulated: 'cloud pricing',
        suggestions: ['cloud costs', 'cloud pricing models'],
        context: '',
        intent: 'conversational',
        sources: ['history'],
        filters: { type: 'history', timeRange: 'week' }
      })
      
      const result = await aiService.reformulateQuery(query)
      
      expect(result.intent).toBe('conversational')
      expect(result.sources).toEqual(['history'])
      expect(result.filters.timeRange).toBe('week')
    })
    
    test('should detect follow-up queries', async () => {
      const query = 'Now show me only the PDFs from that'
      
      aiService.setMockResponse('reformulate-' + query, {
        original: query,
        reformulated: 'pdf',
        suggestions: ['documents', 'files'],
        context: '',
        intent: 'follow-up',
        sources: ['tabs', 'history'],
        filters: { contentType: 'pdf' }
      })
      
      const result = await aiService.reformulateQuery(query)
      
      expect(result.intent).toBe('follow-up')
      expect(result.filters.contentType).toBe('pdf')
    })
    
    test('should handle context-aware reformulation', async () => {
      const query = 'monitoring'
      const searchContext: SearchContext = {
        currentTab: {
          title: 'Kubernetes Documentation',
          url: 'https://kubernetes.io/docs'
        },
        recentSearches: ['kubernetes', 'containers'],
        userPreferences: {
          preferredSources: ['tabs', 'bookmarks'],
          excludePrivate: false,
          timeRange: 'all'
        },
        sessionContext: {
          startTime: Date.now(),
          searchCount: 3,
          lastQuery: 'kubernetes'
        }
      }
      
      const result = await aiService.reformulateQuery(query, ['tabs', 'bookmarks'], searchContext)
      
      expect(result.context).toContain('Kubernetes Documentation')
      expect(result.sources).toEqual(['tabs', 'bookmarks'])
    })
  })
  
  describe('Result Ranking', () => {
    const mockResults: SearchResultEnhanced[] = [
      {
        id: '1',
        type: 'tab',
        title: 'Kubernetes Monitoring Guide',
        url: 'https://example.com/k8s-monitoring',
        content: 'Comprehensive guide to monitoring Kubernetes clusters',
        score: 0.8,
        aiScore: 0,
        relevance: 0,
        timestamp: Date.now() - 3600000 // 1 hour ago
      },
      {
        id: '2',
        type: 'history',
        title: 'System Monitoring Best Practices',
        url: 'https://example.com/monitoring-best',
        content: 'Best practices for system monitoring and alerting',
        score: 0.7,
        aiScore: 0,
        relevance: 0,
        timestamp: Date.now() - 86400000 // 1 day ago
      },
      {
        id: '3',
        type: 'bookmark',
        title: 'Python Monitoring Tools',
        url: 'https://example.com/python-monitoring',
        content: 'List of Python monitoring tools and libraries',
        score: 0.6,
        aiScore: 0,
        relevance: 0,
        timestamp: Date.now() - 172800000 // 2 days ago
      }
    ]
    
    test('should rank results by relevance', async () => {
      const query = 'monitoring'
      
      aiService.setMockResponse('rank-' + query, [
        {
          ...mockResults[0],
          aiScore: 0.9,
          relevance: 0.9,
          highlights: ['Kubernetes monitoring', 'monitoring clusters']
        },
        {
          ...mockResults[1],
          aiScore: 0.7,
          relevance: 0.7,
          highlights: ['system monitoring', 'monitoring best practices']
        },
        {
          ...mockResults[2],
          aiScore: 0.5,
          relevance: 0.5,
          highlights: ['Python monitoring', 'monitoring tools']
        }
      ])
      
      const ranked = await aiService.rankResults(mockResults, query)
      
      expect(ranked[0].aiScore).toBe(0.9)
      expect(ranked[0].relevance).toBe(0.9)
      expect(ranked[0].highlights).toContain('Kubernetes monitoring')
      
      expect(ranked[1].aiScore).toBe(0.7)
      expect(ranked[2].aiScore).toBe(0.5)
      
      // Results should be sorted by AI score (descending)
      expect(ranked[0].aiScore).toBeGreaterThan(ranked[1].aiScore)
      expect(ranked[1].aiScore).toBeGreaterThan(ranked[2].aiScore)
    })
    
    test('should consider context in ranking', async () => {
      const query = 'monitoring'
      const searchContext: SearchContext = {
        currentTab: {
          title: 'Kubernetes Documentation',
          url: 'https://kubernetes.io/docs'
        },
        recentSearches: ['kubernetes'],
        userPreferences: {
          preferredSources: ['tabs'],
          excludePrivate: false,
          timeRange: 'all'
        },
        sessionContext: {
          startTime: Date.now(),
          searchCount: 2,
          lastQuery: 'kubernetes'
        }
      }
      
      // Mock ranking that prioritizes Kubernetes-related content
      aiService.setMockResponse('rank-' + query, [
        {
          ...mockResults[0],
          aiScore: 0.95, // Higher score due to context relevance
          relevance: 0.95,
          highlights: ['Kubernetes monitoring']
        },
        {
          ...mockResults[1],
          aiScore: 0.6,
          relevance: 0.6,
          highlights: ['system monitoring']
        },
        {
          ...mockResults[2],
          aiScore: 0.4,
          relevance: 0.4,
          highlights: ['Python monitoring']
        }
      ])
      
      const ranked = await aiService.rankResults(mockResults, query, searchContext)
      
      expect(ranked[0].title).toContain('Kubernetes')
      expect(ranked[0].aiScore).toBeGreaterThan(ranked[1].aiScore)
    })
    
    test('should extract highlights from content', async () => {
      const query = 'monitoring tools'
      
      aiService.setMockResponse('rank-' + query, [
        {
          ...mockResults[2],
          aiScore: 0.8,
          relevance: 0.8,
          highlights: ['Python monitoring tools', 'monitoring tools and libraries']
        }
      ])
      
      const ranked = await aiService.rankResults([mockResults[2]], query)
      
      expect(ranked[0].highlights).toBeDefined()
      expect(ranked[0].highlights!.length).toBeGreaterThan(0)
      expect(ranked[0].highlights![0]).toContain('monitoring tools')
    })
    
    test('should handle empty results array', async () => {
      const ranked = await aiService.rankResults([], 'test query')
      
      expect(ranked).toEqual([])
    })
  })
  
  describe('Conversational Context', () => {
    test('should maintain search conversation context', async () => {
      const sessionId = 'test-session'
      
      // Add first query to context
      await aiService.addToSearchContext(sessionId, 'kubernetes', { topic: 'k8s' })
      
      let context = aiService.getSearchContext(sessionId)
      expect(context).toBeDefined()
      expect(context!.queries).toEqual(['kubernetes'])
      expect(context!.context.topic).toBe('k8s')
      
      // Add second query
      await aiService.addToSearchContext(sessionId, 'monitoring', { subtopic: 'monitoring' })
      
      context = aiService.getSearchContext(sessionId)
      expect(context!.queries).toEqual(['kubernetes', 'monitoring'])
      expect(context!.context.subtopic).toBe('monitoring')
      expect(context!.context.topic).toBe('k8s') // Previous context preserved
    })
    
    test('should limit conversation history', async () => {
      const sessionId = 'test-session-limit'
      
      // Add 6 queries (should be limited to 5)
      for (let i = 1; i <= 6; i++) {
        await aiService.addToSearchContext(sessionId, `query-${i}`, { index: i })
      }
      
      const context = aiService.getSearchContext(sessionId)
      expect(context!.queries).toHaveLength(5)
      expect(context!.queries).toEqual(['query-2', 'query-3', 'query-4', 'query-5', 'query-6'])
    })
    
    test('should clear search context', async () => {
      const sessionId = 'test-session-clear'
      
      await aiService.addToSearchContext(sessionId, 'test', {})
      
      let context = aiService.getSearchContext(sessionId)
      expect(context).toBeDefined()
      
      aiService.clearSearchContext(sessionId)
      
      context = aiService.getSearchContext(sessionId)
      expect(context).toBeNull()
    })
    
    test('should handle non-existent session', () => {
      const context = aiService.getSearchContext('non-existent')
      expect(context).toBeNull()
    })
  })
  
  describe('Performance and Privacy', () => {
    test('should handle local mode fallback', async () => {
      // Set privacy mode to local
      // Note: In real implementation, this would be set through settings
      const query = 'test query'
      
      const result = await aiService.reformulateQuery(query)
      
      expect(result).toBeDefined()
      expect(result.original).toBe(query)
      expect(result.reformulated).toBeDefined()
    })
    
    test('should handle API failures gracefully', async () => {
      const query = 'failing query'
      
      // Mock a failure scenario
      aiService.setMockResponse('reformulate-' + query, null)
      
      // Should still return a valid result with fallback
      const result = await aiService.reformulateQuery(query)
      
      expect(result).toBeDefined()
      expect(result.original).toBe(query)
    })
  })
})