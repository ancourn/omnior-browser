"use client"

import { AIAction, AIContext, AIActionResult } from './ai-actions-service'

// Client-side wrapper for AI Actions Service
export class ClientAIActionsService {
  async executeAction(actionId: string, context: AIContext): Promise<AIActionResult> {
    try {
      const response = await fetch('/api/ai-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId,
          context
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error executing action:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getAvailableActions(userId?: string): Promise<AIAction[]> {
    try {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)

      const response = await fetch(`/api/ai-actions?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting available actions:', error)
      return []
    }
  }

  async suggestActions(context: AIContext): Promise<AIAction[]> {
    try {
      const response = await fetch('/api/ai-actions/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting action suggestions:', error)
      return []
    }
  }
}

// Export singleton instance
export const clientAIActionsService = new ClientAIActionsService()