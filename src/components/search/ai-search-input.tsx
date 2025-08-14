"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAIActions } from "@/hooks/use-ai-actions"
import { AIContext } from "@/lib/ai/ai-actions-service"

interface AISearchInputProps {
  onSearch?: (query: string) => void
  onAction?: (actionId: string, query: string) => void
  placeholder?: string
  className?: string
}

export function AISearchInput({ 
  onSearch, 
  onAction, 
  placeholder = "What would you like to explore or automate?",
  className = "" 
}: AISearchInputProps) {
  const [query, setQuery] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestedActions, setSuggestedActions] = useState<any[]>([])
  const [sessionId] = useState(() => `session_${Date.now()}`)
  
  const { actions, suggestActions, executeAction } = useAIActions()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setIsProcessing(true)
    
    try {
      const context: AIContext = {
        query,
        sessionId,
        metadata: { timestamp: new Date().toISOString() }
      }

      // Get AI-powered action suggestions
      const suggestions = await suggestActions(context)
      setSuggestedActions(suggestions)

      if (suggestions.length > 0) {
        // Show suggestions for user to choose
        setShowSuggestions(true)
      } else {
        // Fallback to generic search
        onSearch?.(query)
        await executeAction('web-search', context)
      }
    } catch (error) {
      console.error('Search error:', error)
      onSearch?.(query)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleActionSelect = async (actionId: string) => {
    if (!query.trim()) return
    
    setIsProcessing(true)
    setShowSuggestions(false)
    
    try {
      const context: AIContext = {
        query,
        sessionId,
        metadata: { timestamp: new Date().toISOString() }
      }

      const result = await executeAction(actionId, context)
      onAction?.(actionId, query)
    } catch (error) {
      console.error('Action execution error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickAction = async (actionId: string) => {
    if (!query.trim()) return
    await handleActionSelect(actionId)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSuggestedActions([])
    }
  }

  const quickActions = [
    { id: 'summarize-page', label: 'Summarize', icon: '📝' },
    { id: 'extract-data', label: 'Extract', icon: '📊' },
    { id: 'analyze-sentiment', label: 'Analyze', icon: '🔍' },
    { id: 'create-workflow', label: 'Automate', icon: '⚡' }
  ]

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          className="pr-24 text-base"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("")
                setShowSuggestions(false)
                setSuggestedActions([])
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            onClick={handleSearch}
            disabled={isProcessing || !query.trim()}
            className="h-8 px-3"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {query && (
        <div className="mt-2 flex flex-wrap gap-1">
          {quickActions.map((action) => (
            <Badge
              key={action.id}
              variant="secondary"
              className="cursor-pointer hover:bg-slate-200 text-xs px-2 py-1"
              onClick={() => handleQuickAction(action.id)}
            >
              <span className="mr-1">{action.icon}</span>
              {action.label}
            </Badge>
          ))}
        </div>
      )}

      {/* AI Suggestions */}
      {showSuggestions && suggestedActions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg border-slate-200 dark:border-slate-700"
        >
          <CardContent className="p-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Sparkles className="h-4 w-4" />
                AI suggests these actions for "{query}"
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionSelect(action.id)}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {action.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs ml-2 shrink-0"
                    >
                      {action.category}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}