"use client"

import { useState } from "react"
import { Search, ExternalLink, Clock, CheckCircle, XCircle, Zap, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SearchResult {
  id: string
  title: string
  url: string
  snippet: string
  favicon?: string
  hostName?: string
  date?: string
}

interface AIActionResult {
  success: boolean
  data?: any
  error?: string
  suggestedActions?: string[]
  action?: {
    id: string
    name: string
    description: string
    category: string
  }
  timestamp: Date
}

interface SearchResultsProps {
  searchResults?: SearchResult[]
  aiResults?: AIActionResult[]
  onActionClick?: (actionId: string) => void
  onResultClick?: (result: SearchResult) => void
}

export function SearchResults({ 
  searchResults = [], 
  aiResults = [], 
  onActionClick, 
  onResultClick 
}: SearchResultsProps) {
  const [selectedTab, setSelectedTab] = useState<'web' | 'ai'>('web')

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return `${Math.floor(minutes / 1440)}d ago`
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Tab Navigation */}
      {(searchResults.length > 0 || aiResults.length > 0) && (
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedTab('web')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'web'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Web Results ({searchResults.length})
          </button>
          <button
            onClick={() => setSelectedTab('ai')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === 'ai'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            AI Actions ({aiResults.length})
          </button>
        </div>
      )}

      {/* Web Search Results */}
      {selectedTab === 'web' && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <Card 
              key={result.id || index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onResultClick?.(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {result.favicon && (
                    <img 
                      src={result.favicon} 
                      alt="" 
                      className="w-4 h-4 mt-1 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate">
                        {result.title}
                      </h3>
                      <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <span className="truncate">{result.hostName}</span>
                      {result.date && (
                        <>
                          <span>•</span>
                          <span>{result.date}</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                      {result.snippet}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Action Results */}
      {selectedTab === 'ai' && aiResults.length > 0 && (
        <div className="space-y-4">
          {aiResults.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <CardTitle className="text-lg">
                      {result.action?.name || 'AI Action'}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(result.timestamp)}</span>
                  </div>
                </div>
                {result.action && (
                  <CardDescription>
                    {result.action.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {result.success ? (
                  <div className="space-y-3">
                    {/* Summary/Result Content */}
                    {result.data?.summary && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                          Summary
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {result.data.summary}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.analysis && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-purple-900 dark:text-purple-100 mb-2">
                          Analysis
                        </h4>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          {result.data.analysis}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.workflow && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-green-900 dark:text-green-100 mb-2">
                          Workflow Plan
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                          {result.data.workflow}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.extractedData && (
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100 mb-2">
                          Extracted Data
                        </h4>
                        <p className="text-sm text-orange-800 dark:text-orange-200 whitespace-pre-wrap">
                          {result.data.extractedData}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.notes && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-yellow-900 dark:text-yellow-100 mb-2">
                          Notes
                        </h4>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
                          {result.data.notes}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.privacyReport && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-red-900 dark:text-red-100 mb-2">
                          Privacy Report
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                          {result.data.privacyReport}
                        </p>
                      </div>
                    )}
                    
                    {result.data?.anonymizedText && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <h4 className="font-medium text-sm text-indigo-900 dark:text-indigo-100 mb-2">
                          Anonymized Text
                        </h4>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 whitespace-pre-wrap">
                          {result.data.anonymizedText}
                        </p>
                      </div>
                    )}
                    
                    {/* Suggested Follow-up Actions */}
                    {result.suggestedActions && result.suggestedActions.length > 0 && (
                      <div>
                        <Separator className="my-3" />
                        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-2">
                          Suggested Follow-up Actions
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.suggestedActions.map((action, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => onActionClick?.(action)}
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {result.error || 'Action failed to execute'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {selectedTab === 'web' && searchResults.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No web results found
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Try searching with different keywords or use AI actions to analyze your query.
          </p>
        </div>
      )}

      {selectedTab === 'ai' && aiResults.length === 0 && (
        <div className="text-center py-12">
          <Zap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No AI actions executed yet
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter a query above to get AI-powered suggestions and actions.
          </p>
        </div>
      )}
    </div>
  )
}