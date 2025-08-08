'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Pause, 
  Play,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionProgress, getAIActionsService } from '@/lib/ai/ai-actions-service'
import { useToast } from '@/hooks/use-toast'

interface ActionProgressManagerProps {
  isVisible: boolean
  onVisibilityChange: (visible: boolean) => void
}

export function ActionProgressManager({ isVisible, onVisibilityChange }: ActionProgressManagerProps) {
  const [activeActions, setActiveActions] = useState<ActionProgress[]>([])
  const [completedActions, setCompletedActions] = useState<ActionProgress[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const actionsService = getAIActionsService()
    
    const updateActions = () => {
      const allActions = actionsService.getActiveActions()
      const nowActive = allActions.filter(a => 
        a.status === 'pending' || a.status === 'running'
      )
      const nowCompleted = allActions.filter(a => 
        a.status === 'completed' || a.status === 'failed' || a.status === 'cancelled'
      )
      
      setActiveActions(nowActive)
      setCompletedActions(nowCompleted.slice(0, 10)) // Keep last 10 completed
    }

    const interval = setInterval(updateActions, 1000)
    updateActions() // Initial update

    return () => clearInterval(interval)
  }, [])

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
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: ActionProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'cancelled':
        return 'text-gray-600'
      case 'running':
        return 'text-blue-600'
      default:
        return 'text-yellow-600'
    }
  }

  const handleCancelAction = (progressId: string) => {
    const actionsService = getAIActionsService()
    if (actionsService.cancelAction(progressId)) {
      toast({
        title: 'Action Cancelled',
        description: 'Action has been cancelled successfully'
      })
    }
  }

  const clearCompleted = () => {
    setCompletedActions([])
  }

  const totalActions = activeActions.length + completedActions.length
  const hasActiveActions = activeActions.length > 0

  if (!isVisible && !hasActiveActions) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Compact View */}
      {!isExpanded && (
        <Card className="w-80 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasActiveActions ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="font-medium text-sm">
                  {hasActiveActions ? `${activeActions.length} active` : 'All actions completed'}
                </span>
                {totalActions > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {totalActions}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(true)}
                  className="h-6 w-6"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onVisibilityChange(false)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Progress Summary */}
            {activeActions.length > 0 && (
              <div className="mt-2 space-y-1">
                {activeActions.slice(0, 2).map((progress) => (
                  <div key={progress.id} className="flex items-center gap-2 text-xs">
                    {getStatusIcon(progress.status)}
                    <span className="truncate flex-1">
                      {progress.actionId.replace(/-/g, ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {progress.progress}%
                    </Badge>
                  </div>
                ))}
                {activeActions.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{activeActions.length - 2} more actions...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <Card className="w-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Action Progress</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onVisibilityChange(false)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-4">
                {/* Active Actions */}
                {activeActions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Active Actions</h4>
                      <Badge variant="secondary" className="text-xs">
                        {activeActions.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {activeActions.map((progress) => (
                        <Card key={progress.id} className="p-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(progress.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {progress.actionId.replace(/-/g, ' ')}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {progress.progress}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {progress.message}
                              </p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(progress.startTime)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {progress.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {progress.status === 'running' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelAction(progress.id)}
                                className="h-6 w-6 text-red-500 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
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
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Completed Actions */}
                {completedActions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Completed Actions</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {completedActions.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCompleted}
                          className="h-6 px-2 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {completedActions.map((progress) => (
                        <Card key={progress.id} className="p-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(progress.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium text-sm ${getStatusColor(progress.status)}`}>
                                  {progress.actionId.replace(/-/g, ' ')}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {progress.progress}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {progress.message}
                              </p>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(progress.startTime, progress.endTime)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {progress.status}
                                </Badge>
                              </div>
                              
                              {progress.result && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <div className="flex items-center gap-1 mb-1">
                                    {progress.result.success ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className={progress.result.success ? 'text-green-600' : 'text-red-600'}>
                                      {progress.result.success ? 'Success' : 'Failed'}
                                    </span>
                                  </div>
                                  {progress.result.message && (
                                    <p className="text-muted-foreground">
                                      {progress.result.message}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {activeActions.length === 0 && completedActions.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-muted-foreground">
                      No actions running or completed
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}