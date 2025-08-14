"use server"

import ZAI from 'z-ai-web-dev-sdk'

export interface ContentAnalysisRequest {
  content: string
  type: 'text' | 'article' | 'document' | 'webpage' | 'code'
  analysisType: 'summarize' | 'extract-keywords' | 'sentiment' | 'topics' | 'entities' | 'comprehensive'
  options?: {
    maxLength?: number
    language?: string
    includeMetadata?: boolean
    extractQuotes?: boolean
    identifyTrends?: boolean
  }
}

export interface ContentAnalysisResult {
  success: boolean
  summary?: string
  keywords?: string[]
  sentiment?: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
  }
  topics?: string[]
  entities?: Array<{
    text: string
    type: 'person' | 'organization' | 'location' | 'date' | 'other'
    confidence: number
  }>
  metadata?: {
    wordCount: number
    readingTime: number
    complexity: 'simple' | 'moderate' | 'complex'
    language: string
  }
  quotes?: Array<{
    text: string
    context: string
    relevance: number
  }>
  trends?: Array<{
    topic: string
    frequency: number
    sentiment: number
  }>
  error?: string
}

export class AIContentAnalysisService {
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

  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    if (!this.zai) {
      return {
        success: false,
        error: 'AI service not available'
      }
    }

    try {
      const prompt = this.buildAnalysisPrompt(request)
      
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an advanced content analysis AI. Provide detailed, structured analysis of text content with high accuracy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        return {
          success: false,
          error: 'No response from AI service'
        }
      }

      return this.parseAnalysisResponse(response, request)
    } catch (error) {
      console.error('Content analysis failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  private buildAnalysisPrompt(request: ContentAnalysisRequest): string {
    const { content, type, analysisType, options } = request
    
    let prompt = `Analyze the following ${type} content:\n\n${content}\n\n`
    
    switch (analysisType) {
      case 'summarize':
        prompt += `Provide a comprehensive summary`
        if (options?.maxLength) {
          prompt += ` in ${options.maxLength} words or less`
        }
        prompt += '. Include key points and main ideas.'
        break
        
      case 'extract-keywords':
        prompt += 'Extract the most important keywords and phrases. Rank them by importance.'
        break
        
      case 'sentiment':
        prompt += 'Analyze the sentiment and provide a detailed breakdown including confidence scores.'
        break
        
      case 'topics':
        prompt += 'Identify the main topics and themes discussed in the content.'
        break
        
      case 'entities':
        prompt += 'Extract named entities (people, organizations, locations, dates) with their context.'
        break
        
      case 'comprehensive':
        prompt += 'Provide a comprehensive analysis including:'
        prompt += '\n1. Summary (200 words max)'
        prompt += '\n2. Key topics and themes'
        prompt += '\n3. Sentiment analysis with confidence'
        prompt += '\n4. Important keywords and phrases'
        prompt += '\n5. Named entities with types'
        prompt += '\n6. Notable quotes if applicable'
        if (options?.identifyTrends) {
          prompt += '\n7. Trending topics and patterns'
        }
        break
    }
    
    if (options?.includeMetadata) {
      prompt += '\n\nAlso provide metadata including word count, estimated reading time, complexity level, and detected language.'
    }
    
    if (options?.extractQuotes) {
      prompt += '\nExtract and highlight the most impactful quotes with context.'
    }
    
    if (options?.language) {
      prompt += `\n\nRespond in ${options.language}.`
    }
    
    prompt += '\n\nProvide the response in a structured JSON format.'
    
    return prompt
  }

  private parseAnalysisResponse(response: string, request: ContentAnalysisRequest): ContentAnalysisResult {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return this.transformParsedResponse(parsed, request)
      }
      
      // Fallback to text-based parsing
      return this.parseTextResponse(response, request)
    } catch (error) {
      console.error('Failed to parse analysis response:', error)
      return {
        success: false,
        error: 'Failed to parse analysis results'
      }
    }
  }

  private transformParsedResponse(parsed: any, request: ContentAnalysisRequest): ContentAnalysisResult {
    const result: ContentAnalysisResult = {
      success: true
    }

    // Map parsed data to result structure
    if (parsed.summary) result.summary = parsed.summary
    if (parsed.keywords) result.keywords = parsed.keywords
    if (parsed.topics) result.topics = parsed.topics
    if (parsed.entities) result.entities = parsed.entities
    if (parsed.quotes) result.quotes = parsed.quotes
    if (parsed.trends) result.trends = parsed.trends
    
    // Parse sentiment
    if (parsed.sentiment) {
      result.sentiment = {
        score: parsed.sentiment.score || 0,
        label: parsed.sentiment.label || 'neutral',
        confidence: parsed.sentiment.confidence || 0
      }
    }
    
    // Parse metadata
    if (parsed.metadata) {
      result.metadata = {
        wordCount: parsed.metadata.wordCount || 0,
        readingTime: parsed.metadata.readingTime || 0,
        complexity: parsed.metadata.complexity || 'moderate',
        language: parsed.metadata.language || 'en'
      }
    }

    return result
  }

  private parseTextResponse(response: string, request: ContentAnalysisRequest): ContentAnalysisResult {
    const result: ContentAnalysisResult = {
      success: true
    }

    // Extract summary based on analysis type
    if (request.analysisType === 'summarize' || request.analysisType === 'comprehensive') {
      const sentences = response.split(/[.!?]+/)
      result.summary = sentences.slice(0, 3).join('. ') + '.'
    }

    // Extract keywords (simple heuristic)
    const words = response.toLowerCase().split(/\s+/)
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })
    
    result.keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    return result
  }

  async batchAnalyzeContent(requests: ContentAnalysisRequest[]): Promise<ContentAnalysisResult[]> {
    const results: ContentAnalysisResult[] = []
    
    for (const request of requests) {
      try {
        const result = await this.analyzeContent(request)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Batch analysis failed'
        })
      }
    }
    
    return results
  }

  async generateContentInsights(content: string): Promise<{
    insights: string[]
    recommendations: string[]
    questions: string[]
  }> {
    if (!this.zai) {
      return {
        insights: [],
        recommendations: [],
        questions: []
      }
    }

    try {
      const prompt = `
        Analyze the following content and provide:
        1. Key insights (3-5 important observations)
        2. Actionable recommendations (2-4 suggestions)
        3. Thought-provoking questions (2-3 questions for further exploration)
        
        Content: ${content}
        
        Respond in JSON format with keys: insights, recommendations, questions
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyst providing deep insights and recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        return {
          insights: [],
          recommendations: [],
          questions: []
        }
      }

      try {
        const parsed = JSON.parse(response)
        return {
          insights: parsed.insights || [],
          recommendations: parsed.recommendations || [],
          questions: parsed.questions || []
        }
      } catch {
        return {
          insights: [],
          recommendations: [],
          questions: []
        }
      }
    } catch (error) {
      console.error('Failed to generate content insights:', error)
      return {
        insights: [],
        recommendations: [],
        questions: []
      }
    }
  }
}

// Export singleton instance
export const aiContentAnalysisService = new AIContentAnalysisService()