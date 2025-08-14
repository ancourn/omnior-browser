"use client"

import { useState } from "react"
import { AISearchInput } from "./ai-search-input"
import { SearchResults } from "./search-results"
import { useAIActions } from "@/hooks/use-ai-actions"
import { AIContext } from "@/lib/ai/ai-actions-service"

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

export function AISearchContainer() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [aiResults, setAiResults] = useState<AIActionResult[]>([])
  const [sessionId] = useState(() => `session_${Date.now()}`)
  
  const { executeAction } = useAIActions()

  const handleSearch = async (query: string) => {
    try {
      // Execute web search action
      const context: AIContext = {
        query,
        sessionId,
        metadata: { timestamp: new Date().toISOString() }
      }

      const result = await executeAction('web-search', context)
      
      if (result.success && result.data) {
        // Transform web search results to our format
        const webResults = result.data.map((item: any, index: number) => ({
          id: item.url || `result-${index}`,
          title: item.name || 'Untitled',
          url: item.url || '#',
          snippet: item.snippet || 'No description available',
          favicon: item.favicon,
          hostName: item.host_name,
          date: item.date
        }))
        setSearchResults(webResults)
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleAction = async (actionId: string, query: string) => {
    try {
      const context: AIContext = {
        query,
        sessionId,
        metadata: { timestamp: new Date().toISOString() }
      }

      const result = await executeAction(actionId, context)
      
      // Add to AI results
      setAiResults(prev => [{
        success: result.success,
        data: result.data,
        error: result.error,
        suggestedActions: result.suggestedActions,
        action: {
          id: actionId,
          name: getActionName(actionId),
          description: getActionDescription(actionId),
          category: getActionCategory(actionId)
        },
        timestamp: new Date()
      }, ...prev])
    } catch (error) {
      console.error('Action execution error:', error)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Open the result URL in a new tab
    if (result.url && result.url !== '#') {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleFollowUpAction = async (actionId: string) => {
    // Get the last query from AI results
    const lastQuery = aiResults[0]?.action?.name || ''
    if (lastQuery) {
      await handleAction(actionId, lastQuery)
    }
  }

  // Helper functions to get action info
  const getActionName = (actionId: string): string => {
    const actionNames: Record<string, string> = {
      'web-search': 'Web Search',
      'summarize-page': 'Summarize Page',
      'extract-data': 'Extract Data',
      'analyze-sentiment': 'Analyze Sentiment',
      'create-workflow': 'Create Workflow',
      'batch-process': 'Batch Process',
      'create-notes': 'Create Notes',
      'generate-report': 'Generate Report',
      'privacy-scan': 'Privacy Scan',
      'anonymize-data': 'Anonymize Data'
    }
    return actionNames[actionId] || actionId
  }

  const getActionDescription = (actionId: string): string => {
    const actionDescriptions: Record<string, string> = {
      'web-search': 'Search the web for information',
      'summarize-page': 'Create a concise summary of the current page content',
      'extract-data': 'Extract structured data from unstructured text',
      'analyze-sentiment': 'Analyze the sentiment and emotional tone of text',
      'create-workflow': 'Create an automated workflow based on your requirements',
      'batch-process': 'Process multiple items or URLs simultaneously',
      'create-notes': 'Create organized notes from content',
      'generate-report': 'Create a comprehensive report from analysis',
      'privacy-scan': 'Scan current page for privacy concerns',
      'anonymize-data': 'Remove personal information from text'
    }
    return actionDescriptions[actionId] || 'Execute AI action'
  }

  const getActionCategory = (actionId: string): string => {
    const actionCategories: Record<string, string> = {
      'web-search': 'search',
      'summarize-page': 'analysis',
      'extract-data': 'analysis',
      'analyze-sentiment': 'analysis',
      'create-workflow': 'automation',
      'batch-process': 'automation',
      'create-notes': 'productivity',
      'generate-report': 'productivity',
      'privacy-scan': 'privacy',
      'anonymize-data': 'privacy'
    }
    return actionCategories[actionId] || 'general'
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Search Input */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <AISearchInput 
          onSearch={handleSearch}
          onAction={handleAction}
          placeholder="What would you like to explore or automate?"
        />
      </div>

      {/* Results */}
      {(searchResults.length > 0 || aiResults.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <SearchResults
            searchResults={searchResults}
            aiResults={aiResults}
            onResultClick={handleResultClick}
            onActionClick={handleFollowUpAction}
          />
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && aiResults.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              AI-Powered Search & Automation
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Enter a query above to get intelligent search results and AI-powered actions tailored to your needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Smart Search
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get relevant web results with AI-powered ranking and filtering
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                AI Actions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automate tasks, analyze content, and extract insights instantly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Privacy First
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your data stays private with local processing and secure handling
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}