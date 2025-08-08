import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AIActionsService, ActionContext, AIAction, ActionExecutionResult } from './ai-actions-service'
import { AIService } from './ai-service'
import { NotesService } from '../notes/notes-service'
import { SearchResult, SearchContext } from '../search/search-service'

// Mock the AIService
vi.mock('./ai-service', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn(),
    reformulateQuery: vi.fn(),
    rankResults: vi.fn(),
    addToSearchContext: vi.fn(),
    getSearchContext: vi.fn(),
    clearSearchContext: vi.fn()
  }))
}))

// Mock the NotesService
vi.mock('../notes/notes-service', () => ({
  NotesService: vi.fn().mockImplementation(() => ({
    saveNote: vi.fn()
  }))
}))

describe('AIActionsService', () => {
  let aiActionsService: AIActionsService
  let mockAIService: AIService
  let mockNotesService: NotesService

  beforeEach(() => {
    mockAIService = new AIService()
    mockNotesService = new NotesService()
    aiActionsService = new AIActionsService(mockAIService, mockNotesService)
    
    // Clear all registered actions before each test
    (aiActionsService as any).actions.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Registration', () => {
    it('should register a new action', () => {
      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: vi.fn()
      }

      aiActionsService.registerAction(testAction)

      expect((aiActionsService as any).actions.has('test-action')).toBe(true)
    })

    it('should not allow duplicate action IDs', () => {
      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: vi.fn()
      }

      aiActionsService.registerAction(testAction)
      aiActionsService.registerAction(testAction) // Register same action again

      expect((aiActionsService as any).actions.size).toBe(1)
    })
  })

  describe('getAvailableActions', () => {
    let mockContext: ActionContext
    let mockResult: SearchResult

    beforeEach(() => {
      mockResult = {
        id: 'test-id',
        title: 'Test Result',
        type: 'webpage',
        url: 'https://example.com',
        content: 'Test content',
        score: 1.0,
        timestamp: Date.now()
      }

      mockContext = {
        result: mockResult,
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }

      // Register test actions
      const actions: AIAction[] = [
        {
          id: 'webpage-action',
          name: 'Webpage Action',
          description: 'Action for webpages',
          category: 'ai',
          icon: 'Web',
          applicableTo: ['webpage'],
          requiresAI: false,
          priority: 10,
          execute: vi.fn()
        },
        {
          id: 'document-action',
          name: 'Document Action',
          description: 'Action for documents',
          category: 'ai',
          icon: 'Doc',
          applicableTo: ['document'],
          requiresAI: false,
          priority: 5,
          execute: vi.fn()
        },
        {
          id: 'ai-action',
          name: 'AI Action',
          description: 'Action requiring AI',
          category: 'ai',
          icon: 'AI',
          applicableTo: ['webpage'],
          requiresAI: true,
          priority: 8,
          execute: vi.fn()
        }
      ]

      actions.forEach(action => aiActionsService.registerAction(action))
    })

    it('should return actions applicable to the result type', () => {
      const availableActions = aiActionsService.getAvailableActions(mockContext)

      expect(availableActions).toHaveLength(2) // webpage-action and ai-action
      expect(availableActions.some(a => a.id === 'webpage-action')).toBe(true)
      expect(availableActions.some(a => a.id === 'ai-action')).toBe(true)
      expect(availableActions.some(a => a.id === 'document-action')).toBe(false)
    })

    it('should filter out AI actions in local privacy mode', () => {
      mockContext.privacyMode = 'local'
      const availableActions = aiActionsService.getAvailableActions(mockContext)

      expect(availableActions).toHaveLength(1) // Only webpage-action
      expect(availableActions.some(a => a.id === 'webpage-action')).toBe(true)
      expect(availableActions.some(a => a.id === 'ai-action')).toBe(false)
    })

    it('should include AI actions in hybrid privacy mode', () => {
      mockContext.privacyMode = 'hybrid'
      const availableActions = aiActionsService.getAvailableActions(mockContext)

      expect(availableActions).toHaveLength(2) // Both webpage-action and ai-action
    })

    it('should include AI actions in cloud privacy mode', () => {
      mockContext.privacyMode = 'cloud'
      const availableActions = aiActionsService.getAvailableActions(mockContext)

      expect(availableActions).toHaveLength(2) // Both webpage-action and ai-action
    })

    it('should sort actions by priority (highest first)', () => {
      const availableActions = aiActionsService.getAvailableActions(mockContext)

      expect(availableActions[0].id).toBe('webpage-action') // Priority 10
      expect(availableActions[1].id).toBe('ai-action') // Priority 8
    })
  })

  describe('executeAction', () => {
    let mockContext: ActionContext
    let mockResult: SearchResult

    beforeEach(() => {
      mockResult = {
        id: 'test-id',
        title: 'Test Result',
        type: 'webpage',
        url: 'https://example.com',
        content: 'Test content',
        score: 1.0,
        timestamp: Date.now()
      }

      mockContext = {
        result: mockResult,
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }
    })

    it('should execute action successfully', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        success: true,
        data: 'test result',
        message: 'Action completed successfully'
      })

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const result = await aiActionsService.executeAction('test-action', mockContext)

      expect(result.success).toBe(true)
      expect(result.data).toBe('test result')
      expect(result.message).toBe('Action completed successfully')
      expect(mockExecute).toHaveBeenCalledWith(mockContext)
    })

    it('should handle action execution errors', async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error('Execution failed'))

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const result = await aiActionsService.executeAction('test-action', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution failed')
    })

    it('should return error for non-existent action', async () => {
      const result = await aiActionsService.executeAction('non-existent-action', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Action non-existent-action not found')
    })

    it('should track progress during execution', async () => {
      const mockExecute = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              data: 'test result',
              message: 'Action completed successfully'
            })
          }, 100)
        })
      })

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const progressCallback = vi.fn()
      aiActionsService.onProgress('test-action', progressCallback)

      const executionPromise = aiActionsService.executeAction('test-action', mockContext)

      // Check that progress is tracked
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(progressCallback).toHaveBeenCalled()

      const result = await executionPromise
      expect(result.success).toBe(true)

      aiActionsService.offProgress('test-action')
    })
  })

  describe('executeBatchActions', () => {
    let mockContexts: ActionContext[]
    let mockResults: SearchResult[]

    beforeEach(() => {
      mockResults = [
        {
          id: 'test-id-1',
          title: 'Test Result 1',
          type: 'webpage',
          url: 'https://example.com/1',
          content: 'Test content 1',
          score: 1.0,
          timestamp: Date.now()
        },
        {
          id: 'test-id-2',
          title: 'Test Result 2',
          type: 'webpage',
          url: 'https://example.com/2',
          content: 'Test content 2',
          score: 1.0,
          timestamp: Date.now()
        }
      ]

      mockContexts = mockResults.map(result => ({
        result,
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }))
    })

    it('should execute action on multiple contexts', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        success: true,
        data: 'test result',
        message: 'Action completed successfully'
      })

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const results = await aiActionsService.executeBatchActions('test-action', mockContexts)

      expect(results).toHaveLength(2)
      expect(results.every(r => r.success)).toBe(true)
      expect(mockExecute).toHaveBeenCalledTimes(2)
    })

    it('should handle partial failures in batch execution', async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce({
          success: true,
          data: 'test result 1',
          message: 'Action completed successfully'
        })
        .mockRejectedValueOnce(new Error('Second execution failed'))

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const results = await aiActionsService.executeBatchActions('test-action', mockContexts)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBe('Second execution failed')
    })
  })

  describe('Built-in Actions', () => {
    let mockContext: ActionContext
    let mockResult: SearchResult

    beforeEach(() => {
      mockResult = {
        id: 'test-id',
        title: 'Test Result',
        type: 'webpage',
        url: 'https://example.com',
        content: 'Test content for testing',
        score: 1.0,
        timestamp: Date.now()
      }

      mockContext = {
        result: mockResult,
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }

      // Re-register default actions
      ;(aiActionsService as any).registerDefaultActions()
    })

    describe('Summarize Action', () => {
      it('should generate summary using AI service', async () => {
        const mockResponse = 'This is a test summary'
        ;(mockAIService.generateResponse as any).mockResolvedValue(mockResponse)

        const result = await aiActionsService.executeAction('summarize', mockContext)

        expect(result.success).toBe(true)
        expect(result.data).toBe(mockResponse)
        expect(mockAIService.generateResponse).toHaveBeenCalledWith(
          expect.stringContaining('Please provide a comprehensive summary')
        )
      })

      it('should fail in local privacy mode', async () => {
        mockContext.privacyMode = 'local'
        const result = await aiActionsService.executeAction('summarize', mockContext)

        expect(result.success).toBe(false)
        expect(result.error).toContain('requires cloud or hybrid privacy mode')
      })
    })

    describe('Save to Notes Action', () => {
      it('should save content to notes', async () => {
        ;(mockNotesService.saveNote as any).mockResolvedValue(undefined)

        const result = await aiActionsService.executeAction('save-to-notes', mockContext)

        expect(result.success).toBe(true)
        expect(mockNotesService.saveNote).toHaveBeenCalledWith({
          title: mockResult.title,
          content: mockResult.content,
          url: mockResult.url,
          tags: ['saved-from-search'],
          createdAt: expect.any(String)
        })
      })

      it('should work in local privacy mode', async () => {
        mockContext.privacyMode = 'local'
        ;(mockNotesService.saveNote as any).mockResolvedValue(undefined)

        const result = await aiActionsService.executeAction('save-to-notes', mockContext)

        expect(result.success).toBe(true)
      })
    })

    describe('Share Link Action', () => {
      it('should copy URL to clipboard', async () => {
        // Mock clipboard API
        const mockWriteText = vi.fn().mockResolvedValue(undefined)
        Object.assign(navigator, {
          clipboard: {
            writeText: mockWriteText
          }
        })

        const result = await aiActionsService.executeAction('share-link', mockContext)

        expect(result.success).toBe(true)
        expect(mockWriteText).toHaveBeenCalledWith(mockResult.url)
      })

      it('should fail if no URL is available', async () => {
        const resultWithoutUrl = { ...mockResult }
        delete resultWithoutUrl.url
        mockContext.result = resultWithoutUrl

        const result = await aiActionsService.executeAction('share-link', mockContext)

        expect(result.success).toBe(false)
        expect(result.error).toBe('No URL available to share')
      })
    })
  })

  describe('Action Progress Management', () => {
    it('should track active actions', () => {
      const mockExecute = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true })
          }, 1000)
        })
      })

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const mockContext: ActionContext = {
        result: {
          id: 'test-id',
          title: 'Test Result',
          type: 'webpage',
          url: 'https://example.com',
          content: 'Test content',
          score: 1.0,
          timestamp: Date.now()
        },
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }

      // Start execution
      const executionPromise = aiActionsService.executeAction('test-action', mockContext)

      // Check that action is tracked as active
      const activeActions = aiActionsService.getActiveActions()
      expect(activeActions).toHaveLength(1)
      expect(activeActions[0].actionId).toBe('test-action')
      expect(activeActions[0].status).toBe('running')

      // Wait for completion
      return executionPromise.then(() => {
        const finalActiveActions = aiActionsService.getActiveActions()
        expect(finalActiveActions).toHaveLength(0)
      })
    })

    it('should allow cancelling actions', () => {
      const mockExecute = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true })
          }, 1000)
        })
      })

      const testAction: AIAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        category: 'ai',
        icon: 'Test',
        applicableTo: ['webpage'],
        requiresAI: false,
        priority: 1,
        execute: mockExecute
      }

      aiActionsService.registerAction(testAction)

      const mockContext: ActionContext = {
        result: {
          id: 'test-id',
          title: 'Test Result',
          type: 'webpage',
          url: 'https://example.com',
          content: 'Test content',
          score: 1.0,
          timestamp: Date.now()
        },
        searchContext: {} as SearchContext,
        privacyMode: 'hybrid'
      }

      // Start execution
      aiActionsService.executeAction('test-action', mockContext)

      // Get the progress ID
      const activeActions = aiActionsService.getActiveActions()
      expect(activeActions).toHaveLength(1)
      const progressId = activeActions[0].id

      // Cancel the action
      const cancelled = aiActionsService.cancelAction(progressId)
      expect(cancelled).toBe(true)

      // Verify action is no longer active
      const finalActiveActions = aiActionsService.getActiveActions()
      expect(finalActiveActions).toHaveLength(0)
    })
  })
})