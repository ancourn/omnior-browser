/**
 * useHistory Hook
 * 
 * React hook for managing browsing history with AI-powered features.
 * Provides easy access to history operations and state management.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  HistoryEntry, 
  SearchQuery, 
  SearchResult, 
  HistoryStats 
} from '@/lib/history/omnior-history-service'
import { omniorHistoryService } from '@/lib/history/omnior-history-service'

interface UseHistoryReturn {
  // State
  searchResults: SearchResult | null
  stats: HistoryStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  searchHistory: (query: SearchQuery) => Promise<void>
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'visitCount' | 'lastVisitTime'>) => Promise<HistoryEntry>
  deleteEntries: (ids: string[]) => Promise<void>
  clearAllHistory: () => Promise<void>
  toggleStarEntries: (ids: string[], starred: boolean) => Promise<void>
  refreshStats: () => Promise<void>
  
  // Utilities
  clearError: () => void
}

export function useHistory(): UseHistoryReturn {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize service on mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        await omniorHistoryService.initialize()
        await refreshStats()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize history service')
      }
    }

    initializeService()
  }, [])

  const searchHistory = useCallback(async (query: SearchQuery) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await omniorHistoryService.search(query)
      setSearchResults(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search history'
      setError(errorMessage)
      console.error('History search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addHistoryEntry = useCallback(async (
    entry: Omit<HistoryEntry, 'id' | 'visitCount' | 'lastVisitTime'>
  ): Promise<HistoryEntry> => {
    setError(null)

    try {
      const newEntry = await omniorHistoryService.addEntry(entry)
      await refreshStats() // Refresh stats after adding entry
      return newEntry
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add history entry'
      setError(errorMessage)
      console.error('Add history entry error:', err)
      throw err
    }
  }, [])

  const deleteEntries = useCallback(async (ids: string[]) => {
    setError(null)

    try {
      await omniorHistoryService.deleteEntries(ids)
      await refreshStats() // Refresh stats after deletion
      
      // Update search results if they exist
      if (searchResults) {
        const updatedEntries = searchResults.entries.filter(entry => !ids.includes(entry.id))
        setSearchResults({
          ...searchResults,
          entries: updatedEntries,
          total: updatedEntries.length
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete history entries'
      setError(errorMessage)
      console.error('Delete history entries error:', err)
      throw err
    }
  }, [searchResults])

  const clearAllHistory = useCallback(async () => {
    setError(null)

    try {
      await omniorHistoryService.clearAllHistory()
      setSearchResults(null)
      await refreshStats()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear history'
      setError(errorMessage)
      console.error('Clear history error:', err)
      throw err
    }
  }, [])

  const toggleStarEntries = useCallback(async (ids: string[], starred: boolean) => {
    setError(null)

    try {
      await omniorHistoryService.toggleStar(ids, starred)
      await refreshStats()
      
      // Update search results if they exist
      if (searchResults) {
        const updatedEntries = searchResults.entries.map(entry => 
          ids.includes(entry.id) ? { ...entry, isStarred: starred } : entry
        )
        setSearchResults({
          ...searchResults,
          entries: updatedEntries
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle star status'
      setError(errorMessage)
      console.error('Toggle star error:', err)
      throw err
    }
  }, [searchResults])

  const refreshStats = useCallback(async () => {
    try {
      const newStats = await omniorHistoryService.getStats()
      setStats(newStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stats'
      setError(errorMessage)
      console.error('Refresh stats error:', err)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    searchResults,
    stats,
    isLoading,
    error,
    
    // Actions
    searchHistory,
    addHistoryEntry,
    deleteEntries,
    clearAllHistory,
    toggleStarEntries,
    refreshStats,
    
    // Utilities
    clearError
  }
}