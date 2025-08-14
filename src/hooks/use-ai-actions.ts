"use client"

import { useState, useCallback } from 'react'
import { AIAction, AIContext, AIActionResult } from '@/lib/ai/ai-actions-service'
import { clientAIActionsService } from '@/lib/ai/client-ai-actions-service'

export function useAIActions(userId?: string) {
  const [actions, setActions] = useState<AIAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available actions
  const loadActions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const availableActions = await clientAIActionsService.getAvailableActions(userId)
      setActions(availableActions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Execute an action
  const executeAction = useCallback(async (actionId: string, context: AIContext) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await clientAIActionsService.executeAction(actionId, context)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute action'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      } as AIActionResult
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get action suggestions
  const suggestActions = useCallback(async (context: AIContext) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const suggestions = await clientAIActionsService.suggestActions(context)
      return suggestions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get actions by category
  const getActionsByCategory = useCallback((category: AIAction['category']) => {
    return actions.filter(action => action.category === category)
  }, [actions])

  // Search actions
  const searchActions = useCallback((query: string) => {
    const normalizedQuery = query.toLowerCase()
    return actions.filter(action => 
      action.name.toLowerCase().includes(normalizedQuery) ||
      action.description.toLowerCase().includes(normalizedQuery)
    )
  }, [actions])

  return {
    actions,
    isLoading,
    error,
    loadActions,
    executeAction,
    suggestActions,
    getActionsByCategory,
    searchActions
  }
}