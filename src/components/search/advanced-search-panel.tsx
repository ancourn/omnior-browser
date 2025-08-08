'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Pin, Trash2, FolderOpen, ExternalLink, Clock, Star, FileText, Puzzle, Brain, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { searchService, SearchResult, SearchSource } from '@/lib/search/search-service'
import { AIService, SearchQuery, SearchResultEnhanced, SearchContext } from '@/lib/ai/ai-service'
import { AISuggestions } from './ai-suggestions'
import { SearchResultCard } from './search-result-card'
import { BatchActionToolbar } from './batch-action-toolbar'
import { ActionProgressManager } from './action-progress-manager'
import { useToast } from '@/hooks/use-toast'

interface AdvancedSearchPanelProps {
  isOpen: boolean
  onClose: () => void
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

export function AdvancedSearchPanel({ isOpen, onClose }: AdvancedSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultEnhanced[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>(['tabs', 'history', 'bookmarks', 'page-content', 'extensions'])
  const [excludePrivate, setExcludePrivate] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [aiEnabled, setAiEnabled] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null)
  const [sessionId] = useState(() => `search-${Date.now()}`)
  const [showProgressManager, setShowProgressManager] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [aiService] = useState(() => new AIService())

  const availableSources = searchService.getAvailableSources()

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultAction(results[selectedIndex], 'switch')
        }
        break
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          // Select all results for grouping
          setSelectedResults(new Set(results.map(r => r.id)))
        }
        break
    }
  }, [isOpen, onClose, results, selectedIndex])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      inputRef.current?.focus()
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      setQuery('')
      setResults([])
      setSelectedIndex(-1)
      setSelectedResults(new Set())
      setSearchQuery(null)
      aiService.clearSearchContext(sessionId)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown, aiService, sessionId])

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Enhanced search with AI integration
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearchQuery(null)
      return
    }

    performSearch()
  }, [query, selectedSources, excludePrivate, aiEnabled])

  const performSearch = async () => {
    setIsLoading(true)
    setIsAIProcessing(aiEnabled)
    
    try {
      let enhancedResults: SearchResultEnhanced[] = []
      let reformulatedQuery: SearchQuery | null = null
      
      // Step 1: AI Query Reformulation (if enabled)
      if (aiEnabled) {
        try {
          const searchContext: SearchContext = {
            currentTab: {
              title: document.title,
              url: window.location.href
            },
            recentSearches: aiService.getSearchContext(sessionId)?.queries || [],
            userPreferences: {
              preferredSources: selectedSources,
              excludePrivate,
              timeRange: 'all'
            },
            sessionContext: {
              startTime: Date.now(),
              searchCount: (aiService.getSearchContext(sessionId)?.queries.length || 0) + 1,
              lastQuery: query
            }
          }
          
          reformulatedQuery = await aiService.reformulateQuery(
            query, 
            selectedSources, 
            searchContext
          )
          
          setSearchQuery(reformulatedQuery)
          
          // Add to search context for conversational mode
          await aiService.addToSearchContext(sessionId, query, { reformulatedQuery })
          
        } catch (error) {
          console.error('AI query reformulation failed:', error)
          setIsAIProcessing(false)
        }
      }
      
      // Step 2: Perform traditional search
      const searchQueryToUse = reformulatedQuery?.reformulated || query
      const traditionalResults = await searchService.search(searchQueryToUse, {
        sources: selectedSources,
        excludePrivate,
        maxResults: 100
      })
      
      // Step 3: Convert to enhanced results
      enhancedResults = traditionalResults.map(result => ({
        ...result,
        type: result.type as any,
        aiScore: 0,
        relevance: result.score,
        snippet: result.content,
        highlights: []
      }))
      
      // Step 4: AI Result Ranking (if enabled)
      if (aiEnabled && reformulatedQuery && enhancedResults.length > 0) {
        try {
          const searchContext = aiService.getSearchContext(sessionId)?.context || {}
          enhancedResults = await aiService.rankResults(
            enhancedResults, 
            searchQueryToUse, 
            searchContext
          )
        } catch (error) {
          console.error('AI result ranking failed:', error)
        }
      }
      
      setResults(enhancedResults)
      setSelectedIndex(-1)
      
    } catch (error) {
      toast({
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsAIProcessing(false)
    }
  }

  const handleResultAction = async (result: SearchResultEnhanced, action: 'switch' | 'close' | 'pin' | 'toggle-select') => {
    try {
      switch (action) {
        case 'switch':
          if (result.type === 'tab') {
            await searchService.switchToTab(result.id)
            toast({
              title: 'Tab Switched',
              description: `Switched to: ${result.title}`
            })
          } else if (result.url) {
            // Open URL in new tab
            window.open(result.url, '_blank')
            toast({
              title: 'Opened',
              description: `Opened: ${result.title}`
            })
          }
          onClose()
          break
          
        case 'close':
          if (result.type === 'tab') {
            await searchService.closeTab(result.id)
            setResults(prev => prev.filter(r => r.id !== result.id))
            toast({
              title: 'Tab Closed',
              description: `Closed: ${result.title}`
            })
          }
          break
          
        case 'pin':
          if (result.type === 'tab') {
            await searchService.pinTab(result.id)
            toast({
              title: 'Tab Pinned',
              description: `Pinned: ${result.title}`
            })
          }
          break
          
        case 'toggle-select':
          const newSelected = new Set(selectedResults)
          if (newSelected.has(result.id)) {
            newSelected.delete(result.id)
          } else {
            newSelected.add(result.id)
          }
          setSelectedResults(newSelected)
          break
      }
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: 'Failed to perform action. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleMergeIntoGroup = async () => {
    if (selectedResults.size === 0) return
    
    try {
      const tabIds = Array.from(selectedResults).filter(id => 
        results.find(r => r.id === id && r.type === 'tab')
      )
      
      if (tabIds.length > 0) {
        await searchService.mergeTabsIntoGroup(tabIds)
        setSelectedResults(new Set())
        toast({
          title: 'Tabs Grouped',
          description: `Merged ${tabIds.length} tabs into a group`
        })
      }
    } catch (error) {
      toast({
        title: 'Grouping Failed',
        description: 'Failed to group tabs. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
  }

  const handleFilterApply = (filters: any) => {
    if (filters.contentType) {
      setQuery(`${query} ${filters.contentType}`)
    }
    if (filters.type) {
      setSelectedSources([filters.type])
    }
    if (filters.timeRange) {
      // Time range filtering would be implemented in search service
      toast({
        title: 'Filter Applied',
        description: `Showing results from last ${filters.timeRange}`
      })
    }
    if (filters.additionalSources) {
      setSelectedSources(prev => [...prev, ...filters.additionalSources])
    }
    if (filters.includeWeb) {
      // Web search would be implemented separately
      toast({
        title: 'Web Search',
        description: 'Web search integration coming soon'
      })
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

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResultEnhanced[]>)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-20 p-4">
        <div className="w-full max-w-4xl bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tabs, history, bookmarks, page content..."
                className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
              {aiEnabled && isAIProcessing && (
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs text-muted-foreground">AI</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Options */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex flex-wrap gap-2">
                {availableSources.map((source) => (
                  <Badge
                    key={source.name}
                    variant={selectedSources.includes(source.name.toLowerCase()) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const sourceKey = source.name.toLowerCase()
                      setSelectedSources(prev => 
                        prev.includes(sourceKey)
                          ? prev.filter(s => s !== sourceKey)
                          : [...prev, sourceKey]
                      )
                    }}
                  >
                    {source.icon} {source.name}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">AI</span>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                    size="sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Exclude private</label>
                  <input
                    type="checkbox"
                    checked={excludePrivate}
                    onChange={(e) => setExcludePrivate(e.target.checked)}
                    className="rounded border-border"
                  />
                </div>
              </div>
            </div>
            
            {/* AI Query Reformulation Display */}
            {searchQuery && aiEnabled && (
              <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>AI understood this as:</span>
                  <Badge variant="outline" className="text-xs">
                    {searchQuery.reformulated}
                  </Badge>
                  <span className="ml-auto">Intent: {searchQuery.intent}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Results */}
          <div className="max-h-96 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                {isAIProcessing ? 'AI is analyzing your query...' : 'Searching...'}
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                No results found for "{query}"
              </div>
            ) : query ? (
              <ScrollArea className="h-96" ref={resultsRef}>
                <div className="p-2">
                  {Object.entries(groupedResults).map(([type, typeResults]) => {
                    const source = availableSources.find(s => s.name.toLowerCase() === type)
                    return (
                      <div key={type} className="mb-4">
                        <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-muted-foreground">
                          {source?.icon}
                          {source?.name}
                          <Badge variant="secondary" className="ml-auto">
                            {typeResults.length}
                          </Badge>
                        </div>
                        <Separator className="mb-2" />
                        
                        {typeResults.map((result, index) => {
                          const globalIndex = results.findIndex(r => r.id === result.id)
                          const isSelected = selectedResults.has(result.id)
                          
                          return (
                            <SearchResultCard
                              key={result.id}
                              result={result}
                              isSelected={isSelected}
                              isHighlighted={globalIndex === selectedIndex}
                              onClick={() => handleResultAction(result, 'switch')}
                              onAction={handleResultAction}
                              privacyMode={aiEnabled ? 'hybrid' : 'local'}
                              searchContext={searchQuery?.context || {}}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                Type to search across tabs, history, bookmarks, and more
              </div>
            )}
          </div>
          
          {/* AI Suggestions */}
          {aiEnabled && query && (
            <AISuggestions
              query={query}
              searchQuery={searchQuery}
              results={results}
              onSuggestionClick={handleSuggestionClick}
              onFilterApply={handleFilterApply}
              isVisible={showSuggestions}
            />
          )}
          
          {/* Footer with Actions */}
          {selectedResults.size > 0 && (
            <div className="p-3 border-t border-border bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedResults.size} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedResults(new Set())}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleMergeIntoGroup}
                    className="gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Group Tabs
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Keyboard Shortcuts Help */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex gap-4">
                <span>↑↓ Navigate</span>
                <span>Enter Open</span>
                <span>Esc Close</span>
              </div>
              <div className="flex gap-4">
                <span>Ctrl+A Select All</span>
                <span>Click to select</span>
                {aiEnabled && <span>AI Enhanced</span>}
              </div>
            </div>
          </div>
          
          {/* Batch Action Toolbar */}
          {selectedResults.size > 0 && (
            <BatchActionToolbar
              selectedResults={Array.from(selectedResults).map(id => 
                results.find(r => r.id === id)!
              ).filter(Boolean)}
              searchContext={searchQuery?.context || {}}
              privacyMode={aiEnabled ? 'hybrid' : 'local'}
              onClearSelection={() => setSelectedResults(new Set())}
              onResultsUpdate={setResults}
            />
          )}
          
          {/* Action Progress Manager */}
          <ActionProgressManager
            isVisible={showProgressManager}
            onVisibilityChange={setShowProgressManager}
          />
        </div>
      </div>
    </div>
  )
}