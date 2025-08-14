/**
 * Omnior History Panel
 * 
 * AI-powered history management interface with intelligent search,
 * insights, categorization, and privacy controls.
 */

"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Clock, 
  Star, 
  Trash2, 
  Filter, 
  Calendar, 
  Globe, 
  Tag,
  TrendingUp,
  BarChart3,
  Eye,
  Lock,
  Settings,
  X,
  RefreshCw,
  Download,
  Share2
} from "lucide-react"
import { HistoryEntry, SearchQuery, SearchResult, HistoryStats } from '@/lib/history/omnior-history-service'
import { omniorHistoryService } from '@/lib/history/omnior-history-service'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPrivacy, setSelectedPrivacy] = useState<string | null>(null)
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())

  const categories = [
    'news', 'social', 'entertainment', 'education', 'technology', 
    'shopping', 'finance', 'health', 'travel', 'food', 'sports', 
    'music', 'video', 'games', 'productivity', 'reference', 'general'
  ]

  const privacyLevels = [
    { value: 'public', label: 'Public', icon: Globe, color: 'bg-green-100 text-green-800' },
    { value: 'private', label: 'Private', icon: Lock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sensitive', label: 'Sensitive', icon: Eye, color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadStats()
      performSearch('')
    }
  }, [isOpen])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery || selectedCategory || selectedPrivacy) {
        performSearch(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, selectedPrivacy])

  const loadStats = async () => {
    try {
      const historyStats = await omniorHistoryService.getStats()
      setStats(historyStats)
    } catch (error) {
      console.error('Failed to load history stats:', error)
    }
  }

  const performSearch = async (query: string) => {
    setIsLoading(true)
    try {
      const searchParams: SearchQuery = {
        text: query,
        category: selectedCategory || undefined,
        privacyLevel: selectedPrivacy as any,
        limit: 50
      }

      const results = await omniorHistoryService.search(searchParams)
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery)
  }

  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const deleteSelectedEntries = async () => {
    if (selectedEntries.size === 0) return

    try {
      await omniorHistoryService.deleteEntries(Array.from(selectedEntries))
      setSelectedEntries(new Set())
      performSearch(searchQuery)
      loadStats()
    } catch (error) {
      console.error('Failed to delete entries:', error)
    }
  }

  const toggleStarSelected = async (starred: boolean) => {
    if (selectedEntries.size === 0) return

    try {
      await omniorHistoryService.toggleStar(Array.from(selectedEntries), starred)
      setSelectedEntries(new Set())
      performSearch(searchQuery)
    } catch (error) {
      console.error('Failed to toggle star status:', error)
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all browsing history? This action cannot be undone.')) {
      return
    }

    try {
      await omniorHistoryService.clearAllHistory()
      setSearchResults(null)
      setSelectedEntries(new Set())
      loadStats()
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Browsing History</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered search and insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history with AI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Category:</span>
            </div>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {category}
              </Badge>
            ))}
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Privacy:</span>
            </div>
            {privacyLevels.map(level => (
              <Badge
                key={level.value}
                variant={selectedPrivacy === level.value ? "default" : "outline"}
                className={`cursor-pointer ${selectedPrivacy === level.value ? level.color : ''}`}
                onClick={() => setSelectedPrivacy(selectedPrivacy === level.value ? null : level.value)}
              >
                <level.icon className="h-3 w-3 mr-1" />
                {level.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="p-6 border-b bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Domains</p>
                      <p className="text-2xl font-bold">{stats.totalDomains.toLocaleString()}</p>
                    </div>
                    <Globe className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Avg</p>
                      <p className="text-2xl font-bold">{Math.round(stats.averageDailyVisits)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Peak Hour</p>
                      <p className="text-2xl font-bold">{stats.mostActiveHour}:00</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Bar */}
        {selectedEntries.size > 0 && (
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedEntries.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStarSelected(true)}
              >
                <Star className="h-4 w-4 mr-2" />
                Star
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleStarSelected(false)}
              >
                <Star className="h-4 w-4 mr-2 fill-current" />
                Unstar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedEntries}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults?.entries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No history found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Summary */}
                  {searchResults?.aiSummary && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-blue-800">
                          {searchResults.aiSummary}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Suggestions */}
                  {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Related Searches
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {searchResults.suggestions.map((suggestion, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => setSearchQuery(suggestion)}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* History Entries */}
                  <div className="space-y-2">
                    {searchResults?.entries.map((entry) => (
                      <Card
                        key={entry.id}
                        className={`transition-colors cursor-pointer hover:bg-muted/50 ${
                          selectedEntries.has(entry.id) ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => toggleEntrySelection(entry.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {entry.favicon && (
                                  <img
                                    src={entry.favicon}
                                    alt=""
                                    className="w-4 h-4"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                <h3 className="font-medium truncate">{entry.title || entry.url}</h3>
                                {entry.isStarred && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate mb-2">
                                {entry.url}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(entry.visitTime)}</span>
                                <span>•</span>
                                <span>{entry.visitCount} visits</span>
                                {entry.category && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.category}
                                    </Badge>
                                  </>
                                )}
                              </div>

                              {entry.contentPreview && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {entry.contentPreview}
                                </p>
                              )}

                              {entry.aiInsights && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span className="font-medium">AI Insights:</span>
                                  </div>
                                  <p className="text-muted-foreground">
                                    {entry.aiInsights.summary}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  entry.privacyLevel === 'sensitive' ? 'border-red-200 text-red-700' :
                                  entry.privacyLevel === 'private' ? 'border-yellow-200 text-yellow-700' :
                                  'border-green-200 text-green-700'
                                }`}
                              >
                                {entry.privacyLevel}
                              </Badge>
                              
                              {entry.aiInsights && (
                                <div className="text-xs text-muted-foreground">
                                  Score: {entry.aiInsights.engagementScore}/100
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {searchResults?.total && (
              Showing {Math.min(searchResults.entries.length, searchResults.total)} of {searchResults.total} results
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAllHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}