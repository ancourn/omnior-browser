"use server"

import { db } from "@/lib/db"
import ZAI from 'z-ai-web-dev-sdk'

// AI Action interface
export interface AIAction {
  id: string
  name: string
  description: string
  category: 'search' | 'automation' | 'analysis' | 'productivity' | 'privacy'
  handler: (context: AIContext) => Promise<AIActionResult>
  requiresAuth?: boolean
  privacyMode?: 'local' | 'hybrid' | 'cloud'
}

// AI Context interface
export interface AIContext {
  query: string
  sessionId: string
  userId?: string
  metadata?: Record<string, any>
  selectedText?: string
  currentUrl?: string
  pageTitle?: string
}

// AI Action Result interface
export interface AIActionResult {
  success: boolean
  data?: any
  error?: string
  progressId?: string
  requiresFollowUp?: boolean
  suggestedActions?: string[]
}

// AI Action Registry
class AIActionRegistry {
  private actions: Map<string, AIAction> = new Map()

  register(action: AIAction): void {
    this.actions.set(action.id, action)
  }

  get(id: string): AIAction | undefined {
    return this.actions.get(id)
  }

  getAll(): AIAction[] {
    return Array.from(this.actions.values())
  }

  getByCategory(category: AIAction['category']): AIAction[] {
    return this.getAll().filter(action => action.category === category)
  }

  search(query: string): AIAction[] {
    const normalizedQuery = query.toLowerCase()
    return this.getAll().filter(action => 
      action.name.toLowerCase().includes(normalizedQuery) ||
      action.description.toLowerCase().includes(normalizedQuery)
    )
  }
}

// Global registry instance
export const aiActionRegistry = new AIActionRegistry()

// AI Actions Service
export class AIActionsService {
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

  async executeAction(actionId: string, context: AIContext): Promise<AIActionResult> {
    const action = aiActionRegistry.get(actionId)
    if (!action) {
      return {
        success: false,
        error: `Action with ID ${actionId} not found`
      }
    }

    try {
      // Check authentication if required
      if (action.requiresAuth && !context.userId) {
        return {
          success: false,
          error: 'Authentication required for this action'
        }
      }

      // Execute the action handler
      const result = await action.handler(context)
      
      // Log the action execution
      await this.logActionExecution(actionId, context, result)
      
      return result
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getAvailableActions(userId?: string): Promise<AIAction[]> {
    const allActions = aiActionRegistry.getAll()
    
    if (!userId) {
      // Return only actions that don't require authentication
      return allActions.filter(action => !action.requiresAuth)
    }
    
    return allActions
  }

  async suggestActions(context: AIContext): Promise<AIAction[]> {
    try {
      if (!this.zai) {
        return []
      }

      // Use AI to analyze the context and suggest relevant actions
      const prompt = `
        Based on the following context, suggest the most relevant AI actions:
        
        Query: ${context.query}
        Current URL: ${context.currentUrl || 'N/A'}
        Page Title: ${context.pageTitle || 'N/A'}
        Selected Text: ${context.selectedText || 'N/A'}
        
        Available action categories: search, automation, analysis, productivity, privacy
        
        Return a JSON array of action IDs that would be most helpful.
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an AI action suggestion engine. Analyze user context and suggest the most relevant actions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })

      const response = completion.choices[0]?.message?.content
      if (!response) return []

      try {
        const suggestedIds = JSON.parse(response)
        return suggestedIds
          .map((id: string) => aiActionRegistry.get(id))
          .filter((action): action is AIAction => action !== undefined)
      } catch {
        return []
      }
    } catch (error) {
      console.error('Error suggesting actions:', error)
      return []
    }
  }

  private async logActionExecution(
    actionId: string, 
    context: AIContext, 
    result: AIActionResult
  ): Promise<void> {
    try {
      // Store action execution log in database
      await db.actionExecution.create({
        data: {
          actionId,
          sessionId: context.sessionId,
          userId: context.userId,
          query: context.query,
          success: result.success,
          error: result.error,
          metadata: context.metadata || {},
          executedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to log action execution:', error)
    }
  }
}

// Export singleton instance
export const aiActionsService = new AIActionsService()