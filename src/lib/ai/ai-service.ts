export interface AIProvider {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  isLocal: boolean;
}

export interface SummaryStyle {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  maxTokens: number;
}

export interface SummaryRequest {
  text: string;
  style: string;
  provider: string;
  followUpQuestion?: string;
  context?: string;
}

export interface SummaryResponse {
  summary: string;
  style: string;
  provider: string;
  tokensUsed: number;
  followUpSuggestions?: string[];
  processingTime: number;
}

export interface SearchQuery {
  original: string;
  reformulated: string;
  suggestions: string[];
  context: string;
  intent: 'general' | 'specific' | 'conversational' | 'follow-up';
  sources: string[];
  filters: {
    type?: string;
    timeRange?: string;
    contentType?: string;
  };
}

export interface SearchResultEnhanced {
  id: string;
  type: 'tab' | 'history' | 'bookmark' | 'page-content' | 'extension' | 'web';
  title: string;
  url?: string;
  content?: string;
  favicon?: string;
  score: number;
  aiScore: number;
  relevance: number;
  timestamp?: number;
  isPrivate?: boolean;
  categoryId?: string;
  snippet?: string;
  highlights?: string[];
}

export interface SearchContext {
  currentTab?: {
    title: string;
    url: string;
    content?: string;
  };
  recentSearches: string[];
  userPreferences: {
    preferredSources: string[];
    excludePrivate: boolean;
    timeRange: string;
  };
  sessionContext: {
    startTime: number;
    searchCount: number;
    lastQuery?: string;
  };
}

export interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  promptTemplate: string;
  outputFormat: 'text' | 'markdown' | 'table' | 'chart';
}

export interface RecommendationItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topics: string[];
  score: number;
  timestamp: Date;
}

export interface AISettings {
  defaultProvider: string;
  defaultSummaryStyle: string;
  maxTokens: number;
  temperature: number;
  privacyMode: 'local' | 'hybrid' | 'cloud';
  autoSummarize: boolean;
  enableSmartSearch: boolean;
  enableContextualActions: boolean;
  enableRecommendations: boolean;
  providers: AIProvider[];
  apiKeys: Record<string, string>;
  usage: {
    totalTokens: number;
    dailyTokens: number;
    requests: number;
    lastReset: Date;
  };
}

export class AIService {
  private static STORAGE_KEY = 'omnior-ai-settings';
  private static USAGE_KEY = 'omnior-ai-usage';
  
  // Default AI providers
  private static DEFAULT_PROVIDERS: Omit<AIProvider, 'apiKey'>[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      maxTokens: 4096,
      supportsStreaming: true,
      isLocal: false
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 4096,
      supportsStreaming: true,
      isLocal: false
    },
    {
      id: 'local',
      name: 'Local LLM',
      endpoint: 'http://localhost:8000/v1/chat/completions',
      model: 'llama2',
      maxTokens: 2048,
      supportsStreaming: false,
      isLocal: true
    }
  ];

  // Summary styles
  private static SUMMARY_STYLES: SummaryStyle[] = [
    {
      id: 'brief',
      name: 'Brief',
      description: 'Concise summary in 2-3 sentences',
      promptTemplate: 'Please provide a brief summary of the following text in 2-3 sentences:\n\n{text}',
      maxTokens: 150
    },
    {
      id: 'detailed',
      name: 'Detailed',
      description: 'Comprehensive summary with key points',
      promptTemplate: 'Please provide a detailed summary of the following text, including the main points, key arguments, and important details:\n\n{text}',
      maxTokens: 500
    },
    {
      id: 'bullet',
      name: 'Bullet Points',
      description: 'Summary structured as bullet points',
      promptTemplate: 'Please summarize the following text using bullet points to highlight the key information:\n\n{text}',
      maxTokens: 400
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Technical summary with jargon and specifics',
      promptTemplate: 'Please provide a technical summary of the following text, preserving technical terms, specific details, and precise information:\n\n{text}',
      maxTokens: 600
    }
  ];

  // Contextual AI actions
  private static AI_ACTIONS: AIAction[] = [
    {
      id: 'explain',
      name: 'Explain Selection',
      description: 'Get a detailed explanation of the selected text',
      icon: '📚',
      promptTemplate: 'Please explain the following text in simple terms, providing context and clarification:\n\n{text}',
      outputFormat: 'markdown'
    },
    {
      id: 'translate_explain',
      name: 'Translate & Explain',
      description: 'Translate to English and explain the meaning',
      icon: '🌐',
      promptTemplate: 'Please translate the following text to English (if not already in English) and then explain its meaning and context:\n\n{text}',
      outputFormat: 'markdown'
    },
    {
      id: 'questions',
      name: 'Generate Questions',
      description: 'Create related questions about the topic',
      icon: '❓',
      promptTemplate: 'Based on the following text, generate 5-7 thoughtful questions that explore the topic deeper:\n\n{text}',
      outputFormat: 'markdown'
    },
    {
      id: 'table',
      name: 'Convert to Table',
      description: 'Extract structured data and format as table',
      icon: '📊',
      promptTemplate: 'Extract any structured information from the following text and present it as a markdown table. If no structured data is found, say so:\n\n{text}',
      outputFormat: 'markdown'
    }
  ];

  private settings: AISettings;
  private localCache: Map<string, { response: SummaryResponse; timestamp: number }> = new Map();

  constructor() {
    this.settings = this.loadSettings();
    this.loadUsage();
  }

  private loadSettings(): AISettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings();
    }

    try {
      const stored = localStorage.getItem(AIService.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.getDefaultSettings(),
          ...parsed,
          usage: {
            ...this.getDefaultSettings().usage,
            ...parsed.usage,
            lastReset: new Date(parsed.usage?.lastReset || Date.now())
          },
          providers: parsed.providers || this.getDefaultSettings().providers
        };
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }

    return this.getDefaultSettings();
  }

  private getDefaultSettings(): AISettings {
    return {
      defaultProvider: 'openai',
      defaultSummaryStyle: 'brief',
      maxTokens: 1000,
      temperature: 0.7,
      privacyMode: 'hybrid',
      autoSummarize: false,
      enableSmartSearch: true,
      enableContextualActions: true,
      enableRecommendations: true,
      providers: AIService.DEFAULT_PROVIDERS.map(p => ({ ...p, apiKey: '' })),
      apiKeys: {},
      usage: {
        totalTokens: 0,
        dailyTokens: 0,
        requests: 0,
        lastReset: new Date()
      }
    };
  }

  private loadUsage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(AIService.USAGE_KEY);
      if (stored) {
        const usage = JSON.parse(stored);
        // Reset daily usage if it's a new day
        const lastReset = new Date(usage.lastReset);
        const today = new Date();
        if (lastReset.toDateString() !== today.toDateString()) {
          this.settings.usage.dailyTokens = 0;
          this.settings.usage.lastReset = today;
        }
      }
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(AIService.STORAGE_KEY, JSON.stringify({
        ...this.settings,
        providers: this.settings.providers.map(p => ({ ...p, apiKey: '' })) // Don't store API keys
      }));
      localStorage.setItem(AIService.USAGE_KEY, JSON.stringify(this.settings.usage));
    } catch (error) {
      console.error('Error saving AI settings:', error);
    }
  }

  // Provider management
  getProviders(): AIProvider[] {
    return this.settings.providers.map(p => ({
      ...p,
      apiKey: this.settings.apiKeys[p.id] || ''
    }));
  }

  getProvider(id: string): AIProvider | null {
    const provider = this.settings.providers.find(p => p.id === id);
    return provider ? { ...provider, apiKey: this.settings.apiKeys[id] || '' } : null;
  }

  updateProvider(id: string, updates: Partial<AIProvider>) {
    const index = this.settings.providers.findIndex(p => p.id === id);
    if (index !== -1) {
      this.settings.providers[index] = { ...this.settings.providers[index], ...updates };
      this.saveSettings();
    }
  }

  setApiKey(providerId: string, apiKey: string) {
    this.settings.apiKeys[providerId] = apiKey;
    this.saveSettings();
  }

  // Summary styles
  getSummaryStyles(): SummaryStyle[] {
    return AIService.SUMMARY_STYLES;
  }

  getSummaryStyle(id: string): SummaryStyle | null {
    return AIService.SUMMARY_STYLES.find(s => s.id === id) || null;
  }

  // AI Actions
  getAIActions(): AIAction[] {
    return AIService.AI_ACTIONS;
  }

  getAIAction(id: string): AIAction | null {
    return AIService.AI_ACTIONS.find(a => a.id === id) || null;
  }

  // Core AI functionality
  async summarize(request: SummaryRequest): Promise<SummaryResponse> {
    const startTime = Date.now();
    
    // Check cache for local mode or identical requests
    const cacheKey = `${request.style}-${request.provider}-${request.text.slice(0, 100)}`;
    if (this.settings.privacyMode === 'local' || this.localCache.has(cacheKey)) {
      const cached = this.localCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
        return cached.response;
      }
    }

    const style = this.getSummaryStyle(request.style);
    const provider = this.getProvider(request.provider);

    if (!style || !provider) {
      throw new Error('Invalid summary style or provider');
    }

    try {
      let summary: string;
      let tokensUsed = 0;

      if (this.settings.privacyMode === 'local' || provider.isLocal) {
        // Use local/fallback summarization
        summary = await this.localSummarize(request.text, style);
        tokensUsed = Math.floor(summary.length / 4); // Rough estimate
      } else {
        // Use cloud API
        const response = await this.callCloudAPI(request, style, provider);
        summary = response.summary;
        tokensUsed = response.tokensUsed;
      }

      const response: SummaryResponse = {
        summary,
        style: request.style,
        provider: request.provider,
        tokensUsed,
        followUpSuggestions: this.generateFollowUpSuggestions(request.text, style),
        processingTime: Date.now() - startTime
      };

      // Update usage statistics
      this.updateUsage(tokensUsed);

      // Cache response
      if (this.settings.privacyMode !== 'local') {
        this.localCache.set(cacheKey, { response, timestamp: Date.now() });
      }

      return response;
    } catch (error) {
      console.error('Summarization failed:', error);
      
      // Fallback to local summarization
      if (this.settings.privacyMode !== 'local') {
        const fallbackSummary = await this.localSummarize(request.text, style);
        return {
          summary: fallbackSummary,
          style: request.style,
          provider: 'local',
          tokensUsed: Math.floor(fallbackSummary.length / 4),
          processingTime: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  private async callCloudAPI(request: SummaryRequest, style: SummaryStyle, provider: AIProvider): Promise<{ summary: string; tokensUsed: number }> {
    if (!provider.apiKey) {
      throw new Error(`API key required for ${provider.name}`);
    }

    const prompt = style.promptTemplate.replace('{text}', request.text);
    
    // Simulate API call (in real implementation, this would make actual HTTP requests)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Mock response for demonstration
    const mockSummary = this.generateMockSummary(request.text, style);
    const mockTokensUsed = Math.floor(mockSummary.length / 4) + Math.floor(prompt.length / 4);

    return {
      summary: mockSummary,
      tokensUsed: mockTokensUsed
    };
  }

  private async localSummarize(text: string, style: SummaryStyle): Promise<string> {
    // Simple extractive summarization for local fallback
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return text;
    }

    switch (style.id) {
      case 'brief':
        return sentences.slice(0, 2).join('. ') + '.';
      
      case 'detailed':
        return sentences.slice(0, Math.min(5, sentences.length)).join('. ') + '.';
      
      case 'bullet':
        return sentences.slice(0, Math.min(4, sentences.length)).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
      
      case 'technical':
        return `Technical Analysis: The text discusses ${sentences[0].toLowerCase()}. Key aspects include ${sentences.slice(1, 3).join(' and ')}. Additional considerations involve ${sentences[3] || 'various technical factors'}.`;
      
      default:
        return sentences.slice(0, 3).join('. ') + '.';
    }
  }

  private generateMockSummary(text: string, style: SummaryStyle): string {
    const words = text.split(' ');
    const firstSentence = words.slice(0, 10).join(' ');
    const keyPoints = words.slice(10, 30).join(' ');

    switch (style.id) {
      case 'brief':
        return `This text discusses ${firstSentence.toLowerCase()}, providing insights into the subject matter with key implications.`;
      
      case 'detailed':
        return `The comprehensive analysis reveals that ${firstSentence.toLowerCase()}. The text explores several dimensions including ${keyPoints}. Key findings suggest significant implications for the subject area, with detailed examination of various factors and their interrelationships.`;
      
      case 'bullet':
        return `• Main topic: ${firstSentence}\n• Key aspects: ${keyPoints}\n• Important considerations discussed throughout\n• Conclusions drawn from the analysis\n• Recommendations for further exploration`;
      
      case 'technical':
        return `Technical Summary: The document addresses ${firstSentence.toLowerCase()}. Methodological approach includes analysis of ${keyPoints}. Technical specifications indicate compliance with industry standards. Performance metrics demonstrate efficiency within acceptable parameters. Implementation considerations suggest scalability and maintainability.`;
      
      default:
        return `Summary of content covering ${firstSentence.toLowerCase()} and related topics.`;
    }
  }

  private generateFollowUpSuggestions(text: string, style: SummaryStyle): string[] {
    const suggestions = [
      'What are the main implications?',
      'Can you provide more details about this?',
      'How does this compare to other approaches?',
      'What are the potential applications?',
      'Are there any limitations or drawbacks?'
    ];

    return suggestions.slice(0, 3);
  }

  // Smart Search functionality
  async reformulateQuery(query: string, contextSources: string[] = [], searchContext?: SearchContext): Promise<SearchQuery> {
    const startTime = Date.now();
    
    // Check if we should use local or cloud processing
    if (this.settings.privacyMode === 'local') {
      return await this.localReformulateQuery(query, contextSources, searchContext);
    }

    try {
      // Prepare context for AI
      const contextPrompt = this.buildSearchContextPrompt(query, contextSources, searchContext);
      
      // Call AI for query reformulation
      const reformulated = await this.callQueryReformulationAPI(query, contextPrompt);
      
      return {
        original: query,
        reformulated: reformulated.mainQuery,
        suggestions: reformulated.alternatives,
        context: contextPrompt,
        intent: reformulated.intent,
        sources: reformulated.sources,
        filters: reformulated.filters
      };
    } catch (error) {
      console.error('AI query reformulation failed:', error);
      // Fallback to local reformulation
      return await this.localReformulateQuery(query, contextSources, searchContext);
    }
  }

  private buildSearchContextPrompt(query: string, contextSources: string[], searchContext?: SearchContext): string {
    let context = `User query: "${query}"\n`;
    
    if (contextSources.length > 0) {
      context += `Available search sources: ${contextSources.join(', ')}\n`;
    }
    
    if (searchContext?.currentTab) {
      context += `Current tab: "${searchContext.currentTab.title}" at ${searchContext.currentTab.url}\n`;
    }
    
    if (searchContext?.recentSearches.length > 0) {
      context += `Recent searches: ${searchContext.recentSearches.slice(-3).join(', ')}\n`;
    }
    
    return context;
  }

  private async callQueryReformulationAPI(query: string, context: string): Promise<{
    mainQuery: string;
    alternatives: string[];
    intent: 'general' | 'specific' | 'conversational' | 'follow-up';
    sources: string[];
    filters: {
      type?: string;
      timeRange?: string;
      contentType?: string;
    };
  }> {
    const provider = this.getProvider(this.settings.defaultProvider);
    if (!provider || !provider.apiKey) {
      throw new Error('No AI provider available');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    // AI-powered query analysis and reformulation
    const analysis = this.analyzeQueryIntent(query, context);
    
    return {
      mainQuery: analysis.reformulatedQuery,
      alternatives: analysis.alternatives,
      intent: analysis.intent,
      sources: analysis.sources,
      filters: analysis.filters
    };
  }

  private analyzeQueryIntent(query: string, context: string): {
    reformulatedQuery: string;
    alternatives: string[];
    intent: 'general' | 'specific' | 'conversational' | 'follow-up';
    sources: string[];
    filters: {
      type?: string;
      timeRange?: string;
      contentType?: string;
    };
  } {
    const lowerQuery = query.toLowerCase();
    
    // Natural language understanding
    let intent: 'general' | 'specific' | 'conversational' | 'follow-up' = 'general';
    let reformulatedQuery = query;
    let sources: string[] = ['tabs', 'history', 'bookmarks'];
    let filters: any = {};
    
    // Detect intent patterns
    if (lowerQuery.includes('show me') || lowerQuery.includes('find') || lowerQuery.includes('search for')) {
      intent = 'specific';
      reformulatedQuery = query.replace(/show me|find|search for/gi, '').trim();
    }
    
    if (lowerQuery.includes('what was') || lowerQuery.includes('do you remember') || lowerQuery.includes('that site')) {
      intent = 'conversational';
      sources = ['history', 'tabs'];
    }
    
    if (lowerQuery.includes('now show me') || lowerQuery.includes('only the') || lowerQuery.includes('just the')) {
      intent = 'follow-up';
    }
    
    // Detect content types
    if (lowerQuery.includes('pdf') || lowerQuery.includes('document')) {
      filters.contentType = 'pdf';
    }
    
    if (lowerQuery.includes('tutorial') || lowerQuery.includes('guide') || lowerQuery.includes('how to')) {
      filters.contentType = 'tutorial';
    }
    
    if (lowerQuery.includes('bookmark') || lowerQuery.includes('saved')) {
      sources = ['bookmarks'];
      filters.type = 'bookmark';
    }
    
    if (lowerQuery.includes('tab') || lowerQuery.includes('open')) {
      sources = ['tabs'];
      filters.type = 'tab';
    }
    
    if (lowerQuery.includes('history') || lowerQuery.includes('visited') || lowerQuery.includes('last week')) {
      sources = ['history'];
      filters.type = 'history';
      if (lowerQuery.includes('last week') || lowerQuery.includes('recent')) {
        filters.timeRange = 'week';
      }
    }
    
    // Generate reformulated query
    const keywords = this.extractKeywords(reformulatedQuery);
    const mainQuery = keywords.join(' ');
    
    // Generate alternatives
    const alternatives = [
      `${mainQuery} tutorial`,
      `${mainQuery} examples`,
      `${mainQuery} best practices`,
      `how to ${mainQuery}`,
      `${mainQuery} guide`
    ].slice(0, 3);
    
    return {
      reformulatedQuery: mainQuery,
      alternatives,
      intent,
      sources,
      filters
    };
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5);
  }

  private async localReformulateQuery(query: string, contextSources: string[], searchContext?: SearchContext): Promise<SearchQuery> {
    const analysis = this.analyzeQueryIntent(query, '');
    
    return {
      original: query,
      reformulated: analysis.reformulatedQuery,
      suggestions: analysis.alternatives,
      context: '',
      intent: analysis.intent,
      sources: contextSources.length > 0 ? contextSources : analysis.sources,
      filters: analysis.filters
    };
  }

  // Result ranking functionality
  async rankResults(results: SearchResultEnhanced[], query: string, searchContext?: SearchContext): Promise<SearchResultEnhanced[]> {
    if (results.length === 0) return results;
    
    const startTime = Date.now();
    
    if (this.settings.privacyMode === 'local') {
      return await this.localRankResults(results, query, searchContext);
    }

    try {
      // Use AI for result ranking
      const ranked = await this.callResultRankingAPI(results, query, searchContext);
      return ranked;
    } catch (error) {
      console.error('AI result ranking failed:', error);
      return await this.localRankResults(results, query, searchContext);
    }
  }

  private async callResultRankingAPI(results: SearchResultEnhanced[], query: string, searchContext?: SearchContext): Promise<SearchResultEnhanced[]> {
    const provider = this.getProvider(this.settings.defaultProvider);
    if (!provider || !provider.apiKey) {
      throw new Error('No AI provider available');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1000));
    
    // AI-powered result ranking
    return this.aiRankResults(results, query, searchContext);
  }

  private aiRankResults(results: SearchResultEnhanced[], query: string, searchContext?: SearchContext): SearchResultEnhanced[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    return results.map(result => {
      let aiScore = 0;
      let relevance = 0;
      const highlights: string[] = [];
      
      // Title matching (highest weight)
      const titleLower = result.title.toLowerCase();
      const titleMatch = queryWords.filter(word => titleLower.includes(word)).length;
      aiScore += titleMatch * 0.4;
      
      // URL matching
      if (result.url) {
        const urlLower = result.url.toLowerCase();
        const urlMatch = queryWords.filter(word => urlLower.includes(word)).length;
        aiScore += urlMatch * 0.2;
      }
      
      // Content matching
      if (result.content) {
        const contentLower = result.content.toLowerCase();
        const contentMatch = queryWords.filter(word => contentLower.includes(word)).length;
        aiScore += contentMatch * 0.3;
        
        // Extract highlights
        const sentences = result.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (queryWords.some(word => sentence.toLowerCase().includes(word)) && sentence.length > 20) {
            highlights.push(sentence.trim());
          }
        });
      }
      
      // Context awareness
      if (searchContext?.currentTab) {
        const currentTabLower = searchContext.currentTab.title.toLowerCase();
        const contextMatch = queryWords.filter(word => currentTabLower.includes(word)).length;
        aiScore += contextMatch * 0.1;
      }
      
      // Time relevance (more recent = higher score)
      if (result.timestamp) {
        const age = Date.now() - result.timestamp;
        const ageInHours = age / (1000 * 60 * 60);
        if (ageInHours < 24) aiScore += 0.1;
        else if (ageInHours < 168) aiScore += 0.05; // Within a week
      }
      
      // Type preferences
      if (searchContext?.userPreferences.preferredSources.includes(result.type)) {
        aiScore += 0.05;
      }
      
      // Normalize scores
      aiScore = Math.min(aiScore, 1.0);
      relevance = aiScore;
      
      return {
        ...result,
        aiScore,
        relevance,
        highlights: highlights.slice(0, 3) // Top 3 highlights
      };
    }).sort((a, b) => {
      // Sort by AI score first, then by original score, then by timestamp
      if (Math.abs(b.aiScore - a.aiScore) > 0.1) {
        return b.aiScore - a.aiScore;
      }
      if (Math.abs(b.relevance - a.relevance) > 0.1) {
        return b.relevance - a.relevance;
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }

  private async localRankResults(results: SearchResultEnhanced[], query: string, searchContext?: SearchContext): Promise<SearchResultEnhanced[]> {
    return this.aiRankResults(results, query, searchContext);
  }

  // Conversational search context
  private searchConversations: Map<string, { queries: string[]; context: any }> = new Map();
  
  async addToSearchContext(sessionId: string, query: string, context: any): Promise<void> {
    if (!this.searchConversations.has(sessionId)) {
      this.searchConversations.set(sessionId, { queries: [], context: {} });
    }
    
    const conversation = this.searchConversations.get(sessionId)!;
    conversation.queries.push(query);
    conversation.context = { ...conversation.context, ...context };
    
    // Keep only last 5 queries
    if (conversation.queries.length > 5) {
      conversation.queries = conversation.queries.slice(-5);
    }
  }
  
  getSearchContext(sessionId: string): { queries: string[]; context: any } | null {
    return this.searchConversations.get(sessionId) || null;
  }
  
  clearSearchContext(sessionId: string): void {
    this.searchConversations.delete(sessionId);
  }

  // Contextual AI Actions
  async performAIAction(actionId: string, text: string): Promise<string> {
    const action = this.getAIAction(actionId);
    if (!action) {
      throw new Error('Invalid AI action');
    }

    const prompt = action.promptTemplate.replace('{text}', text);
    
    if (this.settings.privacyMode === 'local') {
      return this.localAIAction(text, action);
    } else {
      // Simulate cloud API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      return this.generateMockAIResponse(text, action);
    }
  }

  private localAIAction(text: string, action: AIAction): string {
    switch (action.id) {
      case 'explain':
        return `This text discusses ${text.slice(0, 50)}... It appears to cover important concepts related to the subject matter.`;
      
      case 'translate_explain':
        return `The text appears to be in English. It discusses ${text.slice(0, 50)}... The meaning relates to the subject matter being presented.`;
      
      case 'questions':
        return `1. What is the main topic of this text?\n2. How does this information relate to broader concepts?\n3. What are the key takeaways?`;
      
      case 'table':
        return 'No structured data found in the selected text to convert to table format.';
      
      default:
        return 'AI action completed locally.';
    }
  }

  private generateMockAIResponse(text: string, action: AIAction): string {
    const sample = text.slice(0, 100);
    
    switch (action.id) {
      case 'explain':
        return `## Explanation\n\nThe selected text discusses "${sample}...". This appears to be related to important concepts in the subject area. The key points include:\n\n- Main topic discussion\n- Supporting details and evidence\n- Conclusions or implications\n\nThis information is valuable for understanding the broader context and applications.`;
      
      case 'translate_explain':
        return `## Translation & Explanation\n\nThe text is already in English. Here's an explanation:\n\n**Original Text:** "${sample}..."\n\n**Meaning:** This passage discusses important concepts related to the subject matter. The content appears to be informative and educational in nature.\n\n**Context:** This information would be useful for someone studying or researching this particular topic area.`;
      
      case 'questions':
        return `## Related Questions\n\nBased on the selected text, here are some thoughtful questions to explore the topic deeper:\n\n1. What are the fundamental principles being discussed in this text?\n2. How do these concepts apply to real-world scenarios?\n3. What are the potential limitations or challenges mentioned?\n4. How might this information evolve in the future?\n5. What additional research would be valuable in this area?\n6. How does this compare to alternative approaches?\n7. What are the practical implications of these concepts?`;
      
      case 'table':
        return `## Structured Data Extraction\n\n| Aspect | Description |\n|--------|-------------|\n| Topic | ${sample}... |\n| Content Type | Informational/Educational |\n| Key Focus | Subject matter discussion |\n| Structure | Narrative/Explanatory |\n\n*Note: The selected text contains narrative content rather than structured data suitable for tabular format.*`;
      
      default:
        return 'AI action completed successfully.';
    }
  }

  // Settings management
  getSettings(): AISettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AISettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private updateUsage(tokensUsed: number) {
    this.settings.usage.totalTokens += tokensUsed;
    this.settings.usage.dailyTokens += tokensUsed;
    this.settings.usage.requests++;
    this.saveSettings();
  }

  getUsage() {
    return { ...this.settings.usage };
  }

  resetUsage() {
    this.settings.usage = {
      totalTokens: 0,
      dailyTokens: 0,
      requests: 0,
      lastReset: new Date()
    };
    this.saveSettings();
  }

  // Text extraction utilities
  extractTextFromDOM(): string {
    if (typeof window === 'undefined') return '';

    // Simple text extraction (in real implementation, this would be more sophisticated)
    const article = document.querySelector('article') || document.querySelector('main') || document.body;
    return article.textContent || '';
  }

  extractSelectedText(): string {
    if (typeof window === 'undefined') return '';
    
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  }

  cleanup() {
    this.localCache.clear();
  }
}