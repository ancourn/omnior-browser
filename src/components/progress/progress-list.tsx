"use client"

import { useState } from "react"
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  RefreshCw,
  MoreVertical
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useProgressStore, type ProgressItem } from "@/lib/progress/progress-service"

interface ProgressListProps {
  title?: string
  showActiveOnly?: boolean
  maxHeight?: string
  onItemAction?: (item: ProgressItem, action: string) => void
}

export function ProgressList({ 
  title = "Progress", 
  showActiveOnly = false, 
  maxHeight = "400px",
  onItemAction 
}: ProgressListProps) {
  const activeItems = useProgressStore((state) => state.getActiveItems())
  const pauseItem = useProgressStore((state) => state.pauseItem)
  const resumeItem = useProgressStore((state) => state.resumeItem)
  const cancelItem = useProgressStore((state) => state.cancelItem)
  const retryItem = useProgressStore((state) => state.retryItem)
  const clearCompleted = useProgressStore((state) => state.clearCompleted)
  
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>(
    showActiveOnly ? 'active' : 'all'
  )

  const getStatusIcon = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'paused':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getTypeIcon = (type: ProgressItem['type']) => {
    switch (type) {
      case 'action':
        return '⚡'
      case 'workflow':
        return '🔄'
      case 'download':
        return '⬇️'
      case 'upload':
        return '⬆️'
      case 'analysis':
        return '🔍'
      case 'search':
        return '🔎'
      default:
        return '📋'
    }
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const duration = end.getTime() - startTime.getTime()
    
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatETA = (eta?: number) => {
    if (!eta) return ''
    
    const minutes = Math.floor(eta / 60)
    const seconds = Math.floor(eta % 60)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`
    } else {
      return `${seconds}s remaining`
    }
  }

  const formatSpeed = (speed?: number, type?: ProgressItem['type']) => {
    if (!speed) return ''
    
    switch (type) {
      case 'download':
      case 'upload':
        if (speed > 1024 * 1024) {
          return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
        } else if (speed > 1024) {
          return `${(speed / 1024).toFixed(1)} KB/s`
        } else {
          return `${speed.toFixed(0)} B/s`
        }
      default:
        return `${speed.toFixed(1)}/s`
    }
  }

  const handleItemAction = (item: ProgressItem, action: string) => {
    switch (action) {
      case 'pause':
        pauseItem(item.id)
        break
      case 'resume':
        resumeItem(item.id)
        break
      case 'cancel':
        cancelItem(item.id)
        break
      case 'retry':
        retryItem(item.id)
        break
      default:
        break
    }
    
    onItemAction?.(item, action)
  }

  const getFilteredItems = () => {
    const allItems = useProgressStore.getState().getItems()
    
    switch (filter) {
      case 'active':
        return allItems.filter(item => ['pending', 'running', 'paused'].includes(item.status))
      case 'completed':
        return allItems.filter(item => item.status === 'completed')
      case 'failed':
        return allItems.filter(item => item.status === 'failed')
      default:
        return allItems
    }
  }

  const filteredItems = getFilteredItems()
  const displayItems = showActiveOnly ? activeItems : filteredItems

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              {activeItems.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {activeItems.length} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Track the progress of your tasks and operations
            </CardDescription>
          </div>
          
          {!showActiveOnly && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All Items
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('active')}>
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('completed')}>
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('failed')}>
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Completed
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className={`max-h-[${maxHeight}]`}>
          {displayItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No progress items to display</p>
              <p className="text-xs mt-1">
                {filter === 'active' ? 'No active tasks' : 'Start a task to see progress here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-sm">{getTypeIcon(item.type)}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        
                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {item.progress}%
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              {item.current !== undefined && item.total !== undefined && (
                                <span>{item.current} / {item.total}</span>
                              )}
                              {item.speed && (
                                <span>{formatSpeed(item.speed, item.type)}</span>
                              )}
                              {item.eta && (
                                <span>{formatETA(item.eta)}</span>
                              )}
                            </div>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                        
                        {/* Error Message */}
                        {item.error && (
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                            {item.error}
                          </div>
                        )}
                        
                        {/* Time Info */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <span>Started: {item.startTime.toLocaleTimeString()}</span>
                          {item.endTime && (
                            <span>Duration: {formatDuration(item.startTime, item.endTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {item.status === 'running' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleItemAction(item, 'pause')}
                          className="h-8 w-8 p-0"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {item.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleItemAction(item, 'resume')}
                          className="h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {['pending', 'running', 'paused'].includes(item.status) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleItemAction(item, 'cancel')}
                          className="h-8 w-8 p-0"
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {item.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleItemAction(item, 'retry')}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Item details:', item)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}