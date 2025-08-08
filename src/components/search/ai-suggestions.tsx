'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Sparkles, Clock, BookOpen, Globe, FileText, ExternalLink, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AIService, SearchQuery, SearchResultEnhanced } from '@/lib/ai/ai-service'

interface AISuggestionsProps {
  query: string
  searchQuery?: SearchQuery
  results: SearchResultEnhanced[]
  onSuggestionClick: (suggestion: string) => void
  onFilterApply: (filters: any) => void
  isVisible: boolean
}

interface SuggestionItem {
  id: string
  type: 'query' | 'filter' | 'context' | 'related'
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  relevance: number
}

export function AISuggestions({ 
  query, 
  searchQuery, 
  results, 
  onSuggestionClick, 
  onFilterApply, 
  isVisible 
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiService] = useState(() => new AIService())

  useEffect(() => {
    if (isVisible && query.trim() && searchQuery) {
      generateSuggestions()
    } else {
      setSuggestions([])
    }
  }, [isVisible, query, searchQuery, results])

  const generateSuggestions = async () => {
    setIsGenerating(true)
    
    try {
      const suggestionItems: SuggestionItem[] = []
      
      // Query suggestions based on AI reformulation
      if (searchQuery?.suggestions) {
        searchQuery.suggestions.slice(0, 3).forEach((suggestion, index) => {
          suggestionItems.push({
            id: `query-${index}`,
            type: 'query',
            title: 'Try searching for',
            description: suggestion,
            icon: <Sparkles className="h-4 w-4 text-purple-500" />,
            action: () => onSuggestionClick(suggestion),
            relevance: 0.9 - (index * 0.1)
          })
        })
      }
      
      // Context-aware filters based on query intent
      if (searchQuery?.filters) {
        const { filters } = searchQuery
        
        if (filters.contentType) {
          suggestionItems.push({
            id: 'filter-content',
            type: 'filter',
            title: 'Filter by content type',
            description: `Show only ${filters.contentType} content`,
            icon: <FileText className="h-4 w-4 text-blue-500" />,
            action: () => onFilterApply({ contentType: filters.contentType }),
            relevance: 0.8
          })
        }
        
        if (filters.type) {
          suggestionItems.push({
            id: 'filter-type',
            type: 'filter',
            title: 'Filter by source',
            description: `Show only ${filters.type}`,
            icon: getSourceIcon(filters.type),
            action: () => onFilterApply({ type: filters.type }),
            relevance: 0.8
          })
        }
        
        if (filters.timeRange) {
          suggestionItems.push({
            id: 'filter-time',
            type: 'filter',
            title: 'Filter by time',
            description: `Show results from last ${filters.timeRange}`,
            icon: <Clock className="h-4 w-4 text-orange-500" />,
            action: () => onFilterApply({ timeRange: filters.timeRange }),
            relevance: 0.7
          })
        }
      }
      
      // Context-aware suggestions based on current results
      if (results.length > 0) {
        // Suggest searching additional sources
        const foundTypes = new Set(results.map(r => r.type))
        const allTypes = ['tabs', 'history', 'bookmarks', 'page-content', 'extensions']
        const missingTypes = allTypes.filter(type => !foundTypes.has(type))
        
        if (missingTypes.length > 0) {
          suggestionItems.push({
            id: 'context-sources',
            type: 'context',
            title: 'Search more sources',
            description: `Also search in ${missingTypes.join(', ')}`,
            icon: <Brain className="h-4 w-4 text-green-500" />,
            action: () => onFilterApply({ additionalSources: missingTypes }),
            relevance: 0.6
          })
        }
        
        // Suggest web search if local results are limited
        if (results.length < 5 && !foundTypes.has('web')) {
          suggestionItems.push({
            id: 'context-web',
            type: 'context',
            title: 'Search the web',
            description: 'Find more results online',
            icon: <Globe className="h-4 w-4 text-blue-600" />,
            action: () => onFilterApply({ includeWeb: true }),
            relevance: 0.5
          })
        }
      }
      
      // Related search suggestions based on query content
      const relatedSuggestions = generateRelatedSearches(query, results)
      relatedSuggestions.slice(0, 2).forEach((suggestion, index) => {
        suggestionItems.push({
          id: `related-${index}`,
          type: 'related',
          title: 'Related search',
          description: suggestion,
          icon: <BookOpen className="h-4 w-4 text-indigo-500" />,
          action: () => onSuggestionClick(suggestion),
          relevance: 0.4 - (index * 0.1)
        })
      })
      
      // Sort by relevance and limit to top suggestions
      const sortedSuggestions = suggestionItems
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 6)
      
      setSuggestions(sortedSuggestions)
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      setSuggestions([])
    } finally {
      setIsGenerating(false)
    }
  }
  
  const generateRelatedSearches = (query: string, results: SearchResultEnhanced[]): string[] => {
    const related: string[] = []
    const lowerQuery = query.toLowerCase()
    
    // Generate related searches based on query content
    if (lowerQuery.includes('tutorial')) {
      related.push(`${query.replace('tutorial', 'examples')}`, `${query.replace('tutorial', 'guide')}`)
    } else if (lowerQuery.includes('examples')) {
      related.push(`${query.replace('examples', 'tutorial')}`, `${query.replace('examples', 'best practices')}`)
    } else if (lowerQuery.includes('how to')) {
      related.push(`${query.replace('how to', 'why')}`, `${query.replace('how to', 'when to')}`)
    } else {
      related.push(`${query} tutorial`, `${query} examples`, `${query} best practices`)
    }
    
    // Add suggestions based on result content
    if (results.length > 0) {
      const topResult = results[0]
      if (topResult.title) {
        const titleWords = topResult.title.split(' ').slice(0, 3)
        related.push(titleWords.join(' '))
      }
    }
    
    return related.filter(s => s.toLowerCase() !== lowerQuery).slice(0, 4)
  }
  
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'tab': return <ExternalLink className="h-4 w-4 text-blue-500" />
      case 'history': return <Clock className="h-4 w-4 text-orange-500" />
      case 'bookmark': return <Star className="h-4 w-4 text-yellow-500" />
      case 'page-content': return <FileText className="h-4 w-4 text-green-500" />
      case 'extension': return <Brain className="h-4 w-4 text-purple-500" />
      default: return <BookOpen className="h-4 w-4 text-gray-500" />
    }
  }
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'query': return 'border-purple-200 bg-purple-50'
      case 'filter': return 'border-blue-200 bg-blue-50'
      case 'context': return 'border-green-200 bg-green-50'
      case 'related': return 'border-indigo-200 bg-indigo-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  if (!isVisible || suggestions.length === 0) return null

  return (
    <div className="border-t border-border bg-muted/30">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Suggestions</h3>
          {isGenerating && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-xs text-muted-foreground">Generating...</span>
            </div>
          )}
        </div>
        
        <ScrollArea className="max-h-48">
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <Card 
                key={suggestion.id} 
                className={`cursor-pointer transition-colors hover:shadow-sm ${getTypeColor(suggestion.type)}`}
                onClick={suggestion.action}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {suggestion.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.relevance * 100)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
        
        <Separator className="my-3" />
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            <span>AI-powered suggestions based on your search</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {suggestions.length} suggestions
          </Badge>
        </div>
      </div>
    </div>
  )
}