"use client"

import { useState, useRef, useEffect } from "react"
import { X, Sparkles, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useContextualAI, type ContextualAction, type AIContext } from "@/lib/contextual/contextual-ai-service"

interface ContextualActionsMenuProps {
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
  context?: Partial<AIContext>
  onActionExecuted?: (result: any) => void
}

export function ContextualActionsMenu({ 
  isOpen, 
  onClose, 
  position, 
  context, 
  onActionExecuted 
}: ContextualActionsMenuProps) {
  const { applicableActions, executeAction, updateContext } = useContextualAI()
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [actionResults, setActionResults] = useState<Array<{
    action: ContextualAction
    result: any
    timestamp: Date
  }>>([])
  const menuRef = useRef<HTMLDivElement>(null)

  // Update context when provided
  useEffect(() => {
    if (context && isOpen) {
      updateContext(context)
    }
  }, [context, isOpen, updateContext])

  // Handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleActionClick = async (action: ContextualAction) => {
    setExecutingAction(action.id)
    
    try {
      const result = await executeAction(action.id)
      
      setActionResults(prev => [{
        action,
        result,
        timestamp: new Date()
      }, ...prev])
      
      onActionExecuted?.(result)
      
      // Close menu if action was successful
      if (result.success) {
        setTimeout(() => onClose(), 1000)
      }
    } catch (error) {
      console.error('Action execution failed:', error)
    } finally {
      setExecutingAction(null)
    }
  }

  const getCategoryColor = (category: ContextualAction['category']) => {
    switch (category) {
      case 'text':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'image':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'link':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'page':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'selection':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'form':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (!isOpen) return null

  const menuStyle = position
    ? {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }
    : {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      }

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="w-80 max-h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">AI Actions</span>
          {applicableActions.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {applicableActions.length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col max-h-80">
        {/* Action Results */}
        {actionResults.length > 0 && (
          <div className="border-b border-slate-200 dark:border-slate-700">
            <ScrollArea className="max-h-32 p-3">
              <div className="space-y-2">
                {actionResults.map((item, index) => (
                  <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.action.name}</span>
                      <span className="text-slate-500">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                    {item.result.success ? (
                      <div className="text-green-600 dark:text-green-400">
                        ✓ {item.result.data?.message || 'Action completed'}
                      </div>
                    ) : (
                      <div className="text-red-600 dark:text-red-400">
                        ✗ {item.result.error || 'Action failed'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Actions List */}
        <ScrollArea className="flex-1 p-3">
          {applicableActions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No AI actions available</p>
              <p className="text-xs mt-1">Select text or content to see actions</p>
            </div>
          ) : (
            <div className="space-y-1">
              {applicableActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() => handleActionClick(action)}
                  disabled={executingAction === action.id}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 text-lg">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{action.name}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(action.category)}`}
                        >
                          {action.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                    {executingAction === action.id && (
                      <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Context-aware AI suggestions</span>
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for managing contextual menu
export function useContextualActionsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>()
  const [context, setContext] = useState<Partial<AIContext> | undefined>()

  const openMenu = (newPosition?: { x: number; y: number }, newContext?: Partial<AIContext>) => {
    setPosition(newPosition)
    setContext(newContext)
    setIsOpen(true)
  }

  const closeMenu = () => {
    setIsOpen(false)
    setPosition(undefined)
    setContext(undefined)
  }

  return {
    isOpen,
    position,
    context,
    openMenu,
    closeMenu,
    ContextualActionsMenu: (props: Omit<ContextualActionsMenuProps, 'isOpen' | 'onClose' | 'position' | 'context'>) => (
      <ContextualActionsMenu
        {...props}
        isOpen={isOpen}
        onClose={closeMenu}
        position={position}
        context={context}
      />
    )
  }
}