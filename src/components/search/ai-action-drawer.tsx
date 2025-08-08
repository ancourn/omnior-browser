'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  FileText, 
  Target, 
  Languages, 
  Mail, 
  Code, 
  GitBranch, 
  CheckSquare, 
  Bookmark, 
  Book, 
  Layout, 
  Calendar, 
  Share2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
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

interface AIActionDrawerProps {
  isOpen: boolean
  onClose: () => void
  result: SearchResultEnhanced
  searchContext: any
  privacyMode: 'local' | 'hybrid' | 'cloud'
}

const actionIcons = {
  'summarize': <FileText className="h-5 w-5" />,
  'extract-key-points': <Target className="h-5 w-5" />,
  'translate': <Languages className="h-5 w-5" />,
  'generate-email': <Mail className="h-5 w-5" />,
  'explain-code': <Code className="h-5 w-5" />,
  'refactor-code': <GitBranch className="h-5 w-5" />,
  'generate-tests': <CheckSquare className="h-5 w-5" />,
  'save-to-notes': <Bookmark className="h-5 w-5" />,
  'save-to-notion': <Book className="h-5 w-5" />,
  'save-to-gdocs': <FileText className="h-5 w-5" />,
  'create-trello-card': <Layout className="h-5 w-5" />,
  'create-calendar-event': <Calendar className="h-5 w-5" />,
  'share-link': <Share2 className="h-5 w-5" />
}

const categoryColors = {
  'ai': 'bg-blue-500',
  'save': 'bg-green-500',
  'share': 'bg-purple-500',
  'automate': 'bg-orange-500'
}

const categoryLabels = {
  'ai': 'AI Actions',
  'save': 'Save Actions',
  'share': 'Share Actions',
  'automate': 'Automate Actions'
}

export function AIActionDrawer({ 
  isOpen, 
  onClose, 
  result, 
  searchContext, 
  privacyMode 
}: AIActionDrawerProps) {
  const [availableActions, setAvailableActions] = useState<AIAction[]>([])
  const [groupedActions, setGroupedActions] = useState<Record<string, AIAction[]>>({})
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [actionResults, setActionResults] = useState<Record<string, ActionExecutionResult>>({})
  const [activeActions, setActiveActions] = useState<ActionProgress[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadAvailableActions()
      const actionsService = getAIActionsService()
      
      // Listen for action progress
      const progressCallback = (progress: ActionProgress) => {
        setActiveActions(prev => {
          const existing = prev.find(a => a.id === progress.id)
          if (existing) {
            return prev.map(a => a.id === progress.id ? progress : a)
          }
          return [...prev, progress]
        })
        
        if (progress.status === 'completed' || progress.status === 'failed') {
          if (progress.result) {
            setActionResults(prev => ({
              ...prev,
              [progress.actionId]: progress.result
            }))
          }
          setExecutingAction(null)
        }
      }
      
      // Listen to all actions
      availableActions.forEach(action => {
        actionsService.onProgress(action.id, progressCallback)
      })
      
      // Update active actions
      const interval = setInterval(() => {
        setActiveActions(actionsService.getActiveActions())
      }, 1000)
      
      return () => {
        clearInterval(interval)
        availableActions.forEach(action => {
          actionsService.offProgress(action.id)
        })
      }
    }
  }, [isOpen, availableActions])

  const loadAvailableActions = async () => {
    try {
      const actionsService = getAIActionsService()
      const context: ActionContext = {
        result: result as any,
        searchContext,
        privacyMode
      }
      const actions = actionsService.getAvailableActions(context)
      setAvailableActions(actions)
      
      // Group actions by category
      const grouped = actions.reduce((acc, action) => {
        if (!acc[action.category]) {
          acc[action.category] = []
        }
        acc[action.category].push(action)
        return acc
      }, {} as Record<string, AIAction[]>)
      
      setGroupedActions(grouped)
    } catch (error) {
      console.error('Failed to load available actions:', error)
    }
  }

  const handleActionClick = async (actionId: string) => {
    setExecutingAction(actionId)
    try {
      const actionsService = getAIActionsService()
      const context: ActionContext = {
        result: result as any,
        searchContext,
        privacyMode
      }
      
      const result = await actionsService.executeAction(actionId, context)
      
      if (result.success) {
        toast({
          title: 'Action Completed',
          description: result.message || 'Action completed successfully'
        })
      } else {
        toast({
          title: 'Action Failed',
          description: result.error || 'Failed to complete action',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Action Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setExecutingAction(null)
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const getStatusIcon = (status: ActionProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-end pt-20 p-4">
        <div className="w-full max-w-md bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">AI Actions</h3>
                <p className="text-sm text-muted-foreground">
                  {result.title}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="max-h-96 overflow-hidden">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-4">
                {/* Active Actions */}
                {activeActions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Active Actions</h4>
                    <div className="space-y-2">
                      {activeActions.map((progress) => {
                        const action = availableActions.find(a => a.id === progress.actionId)
                        return (
                          <Card key={progress.id} className="p-3">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(progress.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {action?.name || progress.actionId}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {progress.progress}%
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {progress.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDuration(progress.startTime, progress.endTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {progress.status === 'running' && (
                              <div className="mt-2">
                                <div className="w-full bg-muted rounded-full h-1">
                                  <div 
                                    className="bg-primary h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Action Categories */}
                {Object.entries(groupedActions).map(([category, actions]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`} />
                      <h4 className="text-sm font-medium">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </h4>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {actions.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {actions.map((action) => {
                        const isActive = activeActions.some(a => a.actionId === action.id)
                        const result = actionResults[action.id]
                        const isExecuting = executingAction === action.id
                        
                        return (
                          <Card 
                            key={action.id} 
                            className={`p-3 cursor-pointer transition-colors ${
                              isActive ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted'
                            }`}
                            onClick={() => !isActive && !isExecuting && handleActionClick(action.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-primary">
                                {actionIcons[action.id as keyof typeof actionIcons] || <FileText className="h-5 w-5" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium text-sm">{action.name}</h5>
                                  {action.requiresAI && (
                                    <Badge variant="outline" className="text-xs">
                                      AI
                                    </Badge>
                                  )}
                                  {action.requiresIntegration && (
                                    <Badge variant="secondary" className="text-xs">
                                      {action.requiresIntegration}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                                
                                {result && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <div className="flex items-center gap-1 mb-1">
                                      {result.success ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                      )}
                                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                                        {result.success ? 'Success' : 'Failed'}
                                      </span>
                                    </div>
                                    {result.message && (
                                      <p className="text-muted-foreground">{result.message}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                {isExecuting ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : isActive ? (
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleActionClick(action.id)
                                    }}
                                    disabled={isActive || isExecuting}
                                  >
                                    Run
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                    
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}