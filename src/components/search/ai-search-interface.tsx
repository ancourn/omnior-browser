/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Brain, Zap, Shield, BarChart3, Settings, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { searchService, type SearchResult, type SearchContext } from '@/lib/search/search-service'
import { useAIActions } from '@/hooks/use-ai-actions'
import type { ActionContext, AIAction, ActionProgress } from '@/lib/ai/client-ai-actions-service'

interface AISearchInterfaceProps {
  onClose?: () => void
}

export function AISearchInterface({ onClose }: AISearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [privacyMode, setPrivacyMode] = useState<'local' | 'hybrid' | 'cloud'>('hybrid')
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null)
  const [resultActions, setResultActions] = useState<Map<string, AIAction[]>>(new Map())
  
  const {
    availableActions,
    activeActions,
    getAvailableActions,
    executeAction,
    executeBatchActions,
    clearCache
  } = useAIActions()

  // Handle search with debouncing
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearchContext(null)
      return
    }

    setIsLoading(true)
    try {
      const { results: searchResults, context } = await searchService.search(searchQuery)
      setResults(searchResults)
      setSearchContext(context)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, handleSearch])

  // Handle action execution
  const handleExecuteAction = async (action: AIAction, result: SearchResult) => {
    const context: ActionContext = {
      result,
      privacyMode,
      selectedResults: Array.from(selectedResults).map(id => 
        results.find(r => r.id === id)!
      ).filter(Boolean)
    }

    try {
      const actionResult = await executeAction(action.id, context)
      console.log('Action executed:', actionResult)
    } catch (error) {
      console.error('Action execution failed:', error)
    }
  }

  // Handle batch action execution
  const handleExecuteBatchAction = async (action: AIAction) => {
    if (selectedResults.size === 0) return

    const contexts: ActionContext[] = Array.from(selectedResults).map(id => {
      const result = results.find(r => r.id === id)!
      return {
        result,
        privacyMode
      }
    })

    try {
      const batchResults = await executeBatchActions(action.id, contexts)
      console.log('Batch action executed:', batchResults)
      setSelectedResults(new Set())
    } catch (error) {
      console.error('Batch action execution failed:', error)
    }
  }

  // Load actions for results when they change
  useEffect(() => {
    const loadActionsForResults = async () => {
      const newResultActions = new Map<string, AIAction[]>()
      
      for (const result of results) {
        const cacheKey = `${result.type}-${privacyMode}`
        
        // Check if we already have actions for this type
        if (availableActions.has(cacheKey)) {
          newResultActions.set(result.id, availableActions.get(cacheKey)!)
        } else {
          try {
            const actions = await getAvailableActions(result.type, privacyMode)
            newResultActions.set(result.id, actions)
          } catch (error) {
            console.error('Error loading actions for result:', error)
            newResultActions.set(result.id, [])
          }
        }
      }
      
      setResultActions(newResultActions)
    }
    
    if (results.length > 0) {
      loadActionsForResults()
    }
  }, [results, privacyMode, availableActions, getAvailableActions])

  // Clear cache when privacy mode changes
  useEffect(() => {
    clearCache()
    setResultActions(new Map())
  }, [privacyMode, clearCache])

  // Toggle result selection
  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resultId)) {
        newSet.delete(resultId)
      } else {
        newSet.add(resultId)
      }
      return newSet
    })
  }

  // Get available actions for a result
  const getActionsForResult = (resultId: string): AIAction[] => {
    return resultActions.get(resultId) || []
  }

  // Get available batch actions
  const getAvailableBatchActions = (): AIAction[] => {
    if (selectedResults.size === 0) return []
    
    // Get actions that apply to all selected result types
    const selectedResultTypes = Array.from(selectedResults).map(id => {
      const result = results.find(r => r.id === id)!
      return result.type
    })
    
    const commonActions = new Set<AIAction>()
    
    selectedResultTypes.forEach(type => {
      const cacheKey = `${type}-${privacyMode}`
      if (availableActions.has(cacheKey)) {
        availableActions.get(cacheKey)!.forEach(action => {
          commonActions.add(action)
        })
      }
    })
    
    return Array.from(commonActions).filter(action => 
      selectedResultTypes.every(type => action.applicableTo.includes(type))
    )
  }

  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return ''
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Get status icon
  const getStatusIcon = (status: ActionProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              AI-Powered Search
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Search across tabs, history, bookmarks, and content with intelligent actions
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Intelligent Search
          </CardTitle>
          <CardDescription>
            Enter your query and let AI assist you with contextual actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search tabs, history, bookmarks, content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant={privacyMode === 'local' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPrivacyMode('local')}
              >
                <Shield className="h-4 w-4 mr-1" />
                Local
              </Button>
              <Button
                variant={privacyMode === 'hybrid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPrivacyMode('hybrid')}
              >
                <Brain className="h-4 w-4 mr-1" />
                Hybrid
              </Button>
              <Button
                variant={privacyMode === 'cloud' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPrivacyMode('cloud')}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Cloud
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Actions */}
      {activeActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeActions.map((action) => (
                <div key={action.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {getStatusIcon(action.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{action.actionId}</span>
                      <Badge variant="secondary">{action.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{action.message}</p>
                    {action.progress > 0 && action.progress < 100 && (
                      <Progress value={action.progress} className="mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results and Actions */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Search Results ({results.length})</span>
                  {selectedResults.size > 0 && (
                    <Badge variant="secondary">
                      {selectedResults.size} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {results.map((result) => {
                      const isSelected = selectedResults.has(result.id)
                      const actions = getActionsForResult(result.id)
                      
                      return (
                        <div
                          key={result.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                          onClick={() => toggleResultSelection(result.id)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleResultSelection(result.id)}
                              className="mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium truncate">{result.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {result.type}
                                </Badge>
                                {result.isPrivate && (
                                  <Badge variant="secondary" className="text-xs">
                                    Private
                                  </Badge>
                                )}
                              </div>
                              {result.url && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                                  {result.url}
                                </p>
                              )}
                              {result.content && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                  {result.content}
                                </p>
                              )}
                              {result.timestamp && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                  {formatTimestamp(result.timestamp)}
                                </p>
                              )}
                              
                              {/* Quick Actions */}
                              {actions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {actions.slice(0, 3).map((action) => (
                                    <Button
                                      key={action.id}
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleExecuteAction(action, result)
                                      }}
                                    >
                                      {action.name}
                                    </Button>
                                  ))}
                                  {actions.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{actions.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-4">
            {/* Batch Actions */}
            {selectedResults.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Actions</CardTitle>
                  <CardDescription>
                    Apply actions to {selectedResults.size} selected items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getAvailableBatchActions().map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleExecuteBatchAction(action)}
                      >
                        {action.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Actions</CardTitle>
                <CardDescription>
                  AI-powered actions for your search results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {Array.from(aiActionsService['actions'].values()).map((action) => (
                      <div
                        key={action.id}
                        className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{action.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {action.category}
                          </Badge>
                          {action.requiresAI && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {action.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {action.applicableTo.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Searching...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && query && results.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No results found for "{query}"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}