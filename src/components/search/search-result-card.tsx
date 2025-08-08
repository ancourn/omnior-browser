'use client'

import React, { useState } from 'react'
import { 
  ExternalLink, 
  Clock, 
  Star, 
  FileText, 
  Puzzle, 
  Pin, 
  Trash2, 
  MoreVertical,
  FileText as SummarizeIcon,
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
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchResultEnhanced } from '@/lib/ai/ai-service'
import { getAIActionsService, AIAction, ActionContext } from '@/lib/ai/ai-actions-service'
import { useToast } from '@/hooks/use-toast'

interface SearchResultCardProps {
  result: SearchResultEnhanced
  isSelected: boolean
  isHighlighted: boolean
  onClick: () => void
  onAction: (result: SearchResultEnhanced, action: 'switch' | 'close' | 'pin' | 'toggle-select') => void
  privacyMode: 'local' | 'hybrid' | 'cloud'
  searchContext: any
}

const typeIcons = {
  tab: <ExternalLink className="h-4 w-4" />,
  history: <Clock className="h-4 w-4" />,
  bookmark: <Star className="h-4 w-4" />,
  'page-content': <FileText className="h-4 w-4" />,
  extension: <Puzzle className="h-4 w-4" />,
  web: <ExternalLink className="h-4 w-4" />
}

const typeColors = {
  tab: 'text-blue-500',
  history: 'text-orange-500',
  bookmark: 'text-yellow-500',
  'page-content': 'text-green-500',
  extension: 'text-purple-500',
  web: 'text-blue-600'
}

const actionIcons = {
  'summarize': <SummarizeIcon className="h-4 w-4" />,
  'extract-key-points': <Target className="h-4 w-4" />,
  'translate': <Languages className="h-4 w-4" />,
  'generate-email': <Mail className="h-4 w-4" />,
  'explain-code': <Code className="h-4 w-4" />,
  'refactor-code': <GitBranch className="h-4 w-4" />,
  'generate-tests': <CheckSquare className="h-4 w-4" />,
  'save-to-notes': <Bookmark className="h-4 w-4" />,
  'save-to-notion': <Book className="h-4 w-4" />,
  'save-to-gdocs': <FileText className="h-4 w-4" />,
  'create-trello-card': <Layout className="h-4 w-4" />,
  'create-calendar-event': <Calendar className="h-4 w-4" />,
  'share-link': <Share2 className="h-4 w-4" />
}

export function SearchResultCard({ 
  result, 
  isSelected, 
  isHighlighted, 
  onClick, 
  onAction,
  privacyMode,
  searchContext
}: SearchResultCardProps) {
  const [availableActions, setAvailableActions] = useState<AIAction[]>([])
  const [isActionsLoading, setIsActionsLoading] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const { toast } = useToast()

  React.useEffect(() => {
    loadAvailableActions()
  }, [result, privacyMode])

  const loadAvailableActions = async () => {
    setIsActionsLoading(true)
    try {
      const actionsService = getAIActionsService()
      const context: ActionContext = {
        result: result as any,
        searchContext,
        privacyMode
      }
      const actions = actionsService.getAvailableActions(context)
      setAvailableActions(actions.slice(0, 3)) // Show top 3 actions
    } catch (error) {
      console.error('Failed to load available actions:', error)
    } finally {
      setIsActionsLoading(false)
    }
  }

  const handleActionClick = async (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
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
        
        // If result contains data that should be displayed, handle it
        if (result.data && (actionId === 'summarize' || actionId === 'extract-key-points')) {
          // Could open a modal or side panel to show the result
          console.log('Action result:', result.data)
        }
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
    if (days < 7) return `${days}d ago`
    
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isHighlighted
          ? 'bg-accent text-accent-foreground'
          : isSelected
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`mt-0.5 ${typeColors[result.type]}`}>
          {typeIcons[result.type]}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Badges */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{result.title}</h4>
            {result.isPrivate && (
              <Badge variant="outline" className="text-xs">
                Private
              </Badge>
            )}
            {result.aiScore > 0.5 && (
              <Badge variant="secondary" className="text-xs">
                AI: {Math.round(result.aiScore * 100)}%
              </Badge>
            )}
          </div>
          
          {/* URL */}
          {result.url && (
            <p className="text-sm text-muted-foreground truncate">
              {result.url}
            </p>
          )}
          
          {/* Snippet */}
          {result.snippet && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {result.snippet}
            </p>
          )}
          
          {/* Timestamp */}
          {result.timestamp && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimestamp(result.timestamp)}
            </p>
          )}
          
          {/* Inline Action Bar */}
          <div className="flex items-center gap-2 mt-2">
            {isActionsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              availableActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => handleActionClick(action.id, e)}
                  disabled={executingAction === action.id}
                >
                  {executingAction === action.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    actionIcons[action.id as keyof typeof actionIcons] || <FileText className="h-3 w-3" />
                  )}
                  <span className="ml-1">{action.name}</span>
                </Button>
              ))
            )}
            
            {/* More Actions Button */}
            {availableActions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMoreActions(!showMoreActions)
                }}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {/* More Actions Dropdown */}
          {showMoreActions && (
            <div className="absolute z-10 mt-1 w-48 bg-background border border-border rounded-md shadow-lg">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2">All Actions</div>
                {availableActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-xs"
                    onClick={(e) => handleActionClick(action.id, e)}
                    disabled={executingAction === action.id}
                  >
                    {executingAction === action.id ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : (
                      <span className="mr-2">
                        {actionIcons[action.id as keyof typeof actionIcons] || <FileText className="h-3 w-3" />}
                      </span>
                    )}
                    {action.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {result.type === 'tab' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction(result, 'pin')
                }}
              >
                <Pin className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onAction(result, 'close')
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}