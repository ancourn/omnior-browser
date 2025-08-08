'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  X, 
  Play, 
  Pause, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Target,
  Bookmark,
  Layout,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AIAction, 
  ActionContext, 
  ActionExecutionResult, 
  ActionProgress,
  getAIActionsService 
} from '@/lib/ai/ai-actions-service'
import { SearchResultEnhanced } from '@/lib/ai/ai-service'
import { useToast } from '@/hooks/use-toast'

interface BatchActionToolbarProps {
  selectedResults: SearchResultEnhanced[]
  searchContext: any
  privacyMode: 'local' | 'hybrid' | 'cloud'
  onClearSelection: () => void
  onResultsUpdate: (results: SearchResultEnhanced[]) => void
}

const commonBatchActions = [
  {
    id: 'summarize',
    name: 'Summarize All',
    description: 'Generate summaries for all selected items',
    icon: <FileText className="h-4 w-4" />,
    category: 'ai'
  },
  {
    id: 'extract-key-points',
    name: 'Extract Key Points',
    description: 'Extract key points from all selected items',
    icon: <Target className="h-4 w-4" />,
    category: 'ai'
  },
  {
    id: 'save-to-notes',
    name: 'Save to Notes',
    description: 'Save all selected items to Quick Notes',
    icon: <Bookmark className="h-4 w-4" />,
    category: 'save'
  },
  {
    id: 'create-trello-card',
    name: 'Create Trello Cards',
    description: 'Create Trello cards from selected items',
    icon: <Layout className="h-4 w-4" />,
    category: 'automate'
  },
  {
    id: 'create-calendar-event',
    name: 'Create Calendar Events',
    description: 'Create calendar events from selected items',
    icon: <Calendar className="h-4 w-4" />,
    category: 'automate'
  }
]

export function BatchActionToolbar({ 
  selectedResults, 
  searchContext, 
  privacyMode, 
  onClearSelection,
  onResultsUpdate 
}: BatchActionToolbarProps) {
  const [availableActions, setAvailableActions] = useState<typeof commonBatchActions>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [batchProgress, setBatchProgress] = useState<{
    actionId: string
    current: number
    total: number
    results: ActionExecutionResult[]
    status: 'idle' | 'running' | 'completed' | 'failed'
  } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedResults.length > 0) {
      loadAvailableActions()
    }
  }, [selectedResults, privacyMode])

  const loadAvailableActions = () => {
    const actionsService = getAIActionsService()
    const filteredActions = commonBatchActions.filter(action => {
      // Check if action is available for at least one selected result
      return selectedResults.some(result => {
        const context: ActionContext = {
          result: result as any,
          searchContext,
          privacyMode
        }
        const actions = actionsService.getAvailableActions(context)
        return actions.some(a => a.id === action.id)
      })
    })
    setAvailableActions(filteredActions)
  }

  const handleBatchAction = async (actionId: string) => {
    if (selectedResults.length === 0) return

    setExecutingAction(actionId)
    setBatchProgress({
      actionId,
      current: 0,
      total: selectedResults.length,
      results: [],
      status: 'running'
    })

    try {
      const actionsService = getAIActionsService()
      const contexts: ActionContext[] = selectedResults.map(result => ({
        result: result as any,
        searchContext,
        privacyMode
      }))

      const results = await actionsService.executeBatchActions(actionId, contexts)

      setBatchProgress(prev => prev ? {
        ...prev,
        results,
        status: results.every(r => r.success) ? 'completed' : 'failed'
      } : null)

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      if (successCount === selectedResults.length) {
        toast({
          title: 'Batch Action Completed',
          description: `Successfully processed all ${selectedResults.length} items`
        })
      } else if (successCount > 0) {
        toast({
          title: 'Batch Action Partially Completed',
          description: `Processed ${successCount} of ${selectedResults.length} items successfully`
        })
      } else {
        toast({
          title: 'Batch Action Failed',
          description: 'Failed to process any items',
          variant: 'destructive'
        })
      }

    } catch (error) {
      setBatchProgress(prev => prev ? { ...prev, status: 'failed' } : null)
      toast({
        title: 'Batch Action Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setExecutingAction(null)
    }
  }

  const clearBatchProgress = () => {
    setBatchProgress(null)
    setShowResults(false)
  }

  if (selectedResults.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {selectedResults.length} selected
            </span>
            <Badge variant="secondary" className="text-xs">
              Batch Actions
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Batch Progress */}
        {batchProgress && (
          <Card className="mb-3">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                {batchProgress.status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : batchProgress.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium text-sm">
                  {batchProgress.status === 'running' ? 'Processing...' : 
                   batchProgress.status === 'completed' ? 'Completed' : 'Failed'}
                </span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {batchProgress.current}/{batchProgress.total}
                </Badge>
              </div>
              
              {batchProgress.status === 'running' && (
                <div className="w-full bg-muted rounded-full h-1 mb-2">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(batchProgress.current / batchProgress.total) * 100}%` 
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResults(!showResults)}
                  className="h-6 px-2 text-xs"
                >
                  {showResults ? 'Hide' : 'Show'} Results
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearBatchProgress}
                  className="h-6 px-2 text-xs ml-auto"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Results */}
        {showResults && batchProgress && (
          <Card className="mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Action Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-32">
                <div className="p-3 space-y-2">
                  {batchProgress.results.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {result.success ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                      {result.message && (
                        <span className="text-muted-foreground truncate">
                          - {result.message}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Available Actions */}
        {isExpanded && availableActions.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Available Batch Actions
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {availableActions.map((action) => {
                const isExecuting = executingAction === action.id
                const isInProgress = batchProgress?.actionId === action.id && batchProgress.status === 'running'
                
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="justify-start h-8 px-2 text-xs"
                    onClick={() => handleBatchAction(action.id)}
                    disabled={isExecuting || isInProgress}
                  >
                    {isExecuting || isInProgress ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <span className="mr-2">{action.icon}</span>
                    )}
                    <span className="flex-1 text-left">{action.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {action.category}
                    </Badge>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!isExpanded && (
          <div className="flex items-center gap-2">
            {availableActions.slice(0, 3).map((action) => {
              const isExecuting = executingAction === action.id
              const isInProgress = batchProgress?.actionId === action.id && batchProgress.status === 'running'
              
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleBatchAction(action.id)}
                  disabled={isExecuting || isInProgress}
                  title={action.description}
                >
                  {isExecuting || isInProgress ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    action.icon
                  )}
                </Button>
              )
            })}
            
            {availableActions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{availableActions.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}