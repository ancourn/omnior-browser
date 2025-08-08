import { SearchResult, SearchContext } from '@/lib/search/search-service'
import { AIService } from '@/lib/ai/ai-service'
import { NotesService } from '@/lib/notes/notes-service'

export interface ActionContext {
  result: SearchResult
  searchContext: SearchContext
  selectedResults?: SearchResult[]
  privacyMode: 'local' | 'hybrid' | 'cloud'
}

export interface AIAction {
  id: string
  name: string
  description: string
  category: 'ai' | 'save' | 'share' | 'automate'
  icon: string
  applicableTo: string[] // Result types this action applies to
  requiresAI: boolean
  requiresIntegration?: string // External service required
  priority: number // Higher = more recommended
  execute: (context: ActionContext) => Promise<ActionExecutionResult>
}

export interface ActionExecutionResult {
  success: boolean
  data?: any
  error?: string
  message?: string
  progress?: number
  isCancellable?: boolean
}

export interface ActionProgress {
  id: string
  actionId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  message: string
  result?: ActionExecutionResult
  startTime: Date
  endTime?: Date
}

export class AIActionsService {
  private actions: Map<string, AIAction> = new Map()
  private progressCallbacks: Map<string, (progress: ActionProgress) => void> = new Map()
  private activeActions: Map<string, ActionProgress> = new Map()
  private aiService: AIService
  private notesService: NotesService

  constructor(aiService: AIService, notesService: NotesService) {
    this.aiService = aiService
    this.notesService = notesService
    this.registerDefaultActions()
  }

  private registerDefaultActions() {
    // AI Actions
    this.registerAction({
      id: 'summarize',
      name: 'Summarize',
      description: 'Generate AI summary of content',
      category: 'ai',
      icon: 'FileText',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: true,
      priority: 10,
      execute: this.executeSummarize.bind(this)
    })

    this.registerAction({
      id: 'extract-key-points',
      name: 'Extract Key Points',
      description: 'Extract main points and insights',
      category: 'ai',
      icon: 'Target',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: true,
      priority: 8,
      execute: this.executeExtractKeyPoints.bind(this)
    })

    this.registerAction({
      id: 'translate',
      name: 'Translate',
      description: 'Translate content to another language',
      category: 'ai',
      icon: 'Languages',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: true,
      priority: 7,
      execute: this.executeTranslate.bind(this)
    })

    this.registerAction({
      id: 'generate-email',
      name: 'Generate Email',
      description: 'Create follow-up email from content',
      category: 'ai',
      icon: 'Mail',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: true,
      priority: 6,
      execute: this.executeGenerateEmail.bind(this)
    })

    this.registerAction({
      id: 'explain-code',
      name: 'Explain Code',
      description: 'Explain what code does',
      category: 'ai',
      icon: 'Code',
      applicableTo: ['code', 'webpage'],
      requiresAI: true,
      priority: 9,
      execute: this.executeExplainCode.bind(this)
    })

    this.registerAction({
      id: 'refactor-code',
      name: 'Refactor Code',
      description: 'Improve code structure and readability',
      category: 'ai',
      icon: 'GitBranch',
      applicableTo: ['code'],
      requiresAI: true,
      priority: 8,
      execute: this.executeRefactorCode.bind(this)
    })

    this.registerAction({
      id: 'generate-tests',
      name: 'Generate Tests',
      description: 'Create unit tests for code',
      category: 'ai',
      icon: 'CheckSquare',
      applicableTo: ['code'],
      requiresAI: true,
      priority: 7,
      execute: this.executeGenerateTests.bind(this)
    })

    // Save Actions
    this.registerAction({
      id: 'save-to-notes',
      name: 'Save to Notes',
      description: 'Save content to Quick Notes',
      category: 'save',
      icon: 'Bookmark',
      applicableTo: ['webpage', 'document', 'pdf', 'note', 'code'],
      requiresAI: false,
      priority: 9,
      execute: this.executeSaveToNotes.bind(this)
    })

    this.registerAction({
      id: 'save-to-notion',
      name: 'Save to Notion',
      description: 'Save to Notion workspace',
      category: 'save',
      icon: 'Book',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: false,
      requiresIntegration: 'notion',
      priority: 7,
      execute: this.executeSaveToNotion.bind(this)
    })

    this.registerAction({
      id: 'save-to-gdocs',
      name: 'Save to Google Docs',
      description: 'Save to Google Drive',
      category: 'save',
      icon: 'File',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: false,
      requiresIntegration: 'gdocs',
      priority: 7,
      execute: this.executeSaveToGDocs.bind(this)
    })

    // Automate Actions
    this.registerAction({
      id: 'create-trello-card',
      name: 'Create Trello Card',
      description: 'Create task in Trello',
      category: 'automate',
      icon: 'Layout',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: false,
      requiresIntegration: 'trello',
      priority: 6,
      execute: this.executeCreateTrelloCard.bind(this)
    })

    this.registerAction({
      id: 'create-calendar-event',
      name: 'Create Calendar Event',
      description: 'Schedule event from content',
      category: 'automate',
      icon: 'Calendar',
      applicableTo: ['webpage', 'document', 'pdf', 'note'],
      requiresAI: true,
      requiresIntegration: 'calendar',
      priority: 6,
      execute: this.executeCreateCalendarEvent.bind(this)
    })

    // Share Actions
    this.registerAction({
      id: 'share-link',
      name: 'Share Link',
      description: 'Copy shareable link',
      category: 'share',
      icon: 'Share2',
      applicableTo: ['webpage', 'document', 'pdf'],
      requiresAI: false,
      priority: 5,
      execute: this.executeShareLink.bind(this)
    })
  }

  registerAction(action: AIAction) {
    this.actions.set(action.id, action)
  }

  getAvailableActions(context: ActionContext): AIAction[] {
    const { result, searchContext, privacyMode } = context
    
    return Array.from(this.actions.values())
      .filter(action => {
        // Check if action applies to result type
        if (!action.applicableTo.includes(result.type)) {
          return false
        }

        // Check privacy mode constraints
        if (action.requiresAI && privacyMode === 'local') {
          return false
        }

        // Check integration requirements (simplified - in real app would check user permissions)
        if (action.requiresIntegration) {
          // For demo, assume integrations are available
          return true
        }

        return true
      })
      .sort((a, b) => b.priority - a.priority)
  }

  async executeAction(actionId: string, context: ActionContext): Promise<ActionExecutionResult> {
    const action = this.actions.get(actionId)
    if (!action) {
      return {
        success: false,
        error: `Action ${actionId} not found`
      }
    }

    const progressId = `${actionId}-${Date.now()}`
    const progress: ActionProgress = {
      id: progressId,
      actionId,
      status: 'pending',
      progress: 0,
      message: `Starting ${action.name}...`,
      startTime: new Date()
    }

    this.activeActions.set(progressId, progress)
    this.notifyProgress(progress)

    try {
      progress.status = 'running'
      progress.message = `Executing ${action.name}...`
      this.notifyProgress(progress)

      const result = await action.execute(context)

      progress.status = result.success ? 'completed' : 'failed'
      progress.progress = 100
      progress.message = result.message || (result.success ? 'Completed successfully' : 'Failed to complete')
      progress.result = result
      progress.endTime = new Date()

      this.notifyProgress(progress)
      return result
    } catch (error) {
      progress.status = 'failed'
      progress.progress = 100
      progress.message = `Error: ${error.message}`
      progress.endTime = new Date()

      this.notifyProgress(progress)
      return {
        success: false,
        error: error.message
      }
    } finally {
      this.activeActions.delete(progressId)
    }
  }

  async executeBatchActions(actionId: string, contexts: ActionContext[]): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = []
    
    for (let i = 0; i < contexts.length; i++) {
      const result = await this.executeAction(actionId, contexts[i])
      results.push(result)
      
      // Update progress for batch operation
      const progress = Math.round(((i + 1) / contexts.length) * 100)
      this.updateBatchProgress(actionId, progress, `Processed ${i + 1} of ${contexts.length} items`)
    }

    return results
  }

  private notifyProgress(progress: ActionProgress) {
    const callback = this.progressCallbacks.get(progress.actionId)
    if (callback) {
      callback(progress)
    }
  }

  private updateBatchProgress(actionId: string, progress: number, message: string) {
    // Update all active actions for this batch
    for (const [id, actionProgress] of this.activeActions) {
      if (actionProgress.actionId === actionId) {
        actionProgress.progress = progress
        actionProgress.message = message
        this.notifyProgress(actionProgress)
      }
    }
  }

  onProgress(actionId: string, callback: (progress: ActionProgress) => void) {
    this.progressCallbacks.set(actionId, callback)
  }

  offProgress(actionId: string) {
    this.progressCallbacks.delete(actionId)
  }

  getActiveActions(): ActionProgress[] {
    return Array.from(this.activeActions.values())
  }

  cancelAction(progressId: string): boolean {
    const progress = this.activeActions.get(progressId)
    if (progress && progress.status === 'running') {
      progress.status = 'cancelled'
      progress.endTime = new Date()
      this.notifyProgress(progress)
      this.activeActions.delete(progressId)
      return true
    }
    return false
  }

  // Action implementations
  private async executeSummarize(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'AI summarization requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Please provide a comprehensive summary of the following content. Include key points, main arguments, and important details:

Title: ${result.title}
Content: ${result.content || result.description || result.url}

Please structure the summary with:
1. Main Summary (2-3 paragraphs)
2. Key Points (bullet points)
3. Important Details (if any)`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Summary generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate summary: ${error.message}`
      }
    }
  }

  private async executeExtractKeyPoints(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Key point extraction requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Extract the key points and main insights from the following content. Focus on the most important information that someone should know:

Title: ${result.title}
Content: ${result.content || result.description || result.url}

Please provide:
1. Main Key Points (3-5 bullet points)
2. Important Insights (2-3 bullet points)
3. Action Items (if applicable)`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Key points extracted successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract key points: ${error.message}`
      }
    }
  }

  private async executeTranslate(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Translation requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Translate the following content to English. If it's already in English, provide a clean, well-formatted version:

Title: ${result.title}
Content: ${result.content || result.description || result.url}

Please provide:
1. Translated Title
2. Translated Content
3. Original Language (detected)`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Content translated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to translate content: ${error.message}`
      }
    }
  }

  private async executeGenerateEmail(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Email generation requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Generate a professional follow-up email based on the following content. The email should be concise, actionable, and suitable for business communication:

Source: ${result.title}
Content: ${result.content || result.description || result.url}

Please create an email with:
1. Clear subject line
2. Professional greeting
3. Body content that summarizes key points
4. Clear call to action
5. Professional closing`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Email generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate email: ${error.message}`
      }
    }
  }

  private async executeExplainCode(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Code explanation requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Explain the following code in detail. Break down what it does, how it works, and any important concepts:

Code Title: ${result.title}
Code: ${result.content || result.description || result.url}

Please provide:
1. High-level overview of what the code does
2. Step-by-step explanation of the logic
3. Key functions/variables and their purposes
4. Any potential improvements or best practices`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Code explanation generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to explain code: ${error.message}`
      }
    }
  }

  private async executeRefactorCode(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Code refactoring requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Refactor the following code to improve its structure, readability, and maintainability. Follow best practices and modern coding standards:

Original Code: ${result.content || result.description || result.url}

Please provide:
1. Refactored code with improved structure
2. Explanation of changes made
3. Benefits of the refactoring
4. Any additional recommendations`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Code refactored successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to refactor code: ${error.message}`
      }
    }
  }

  private async executeGenerateTests(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Test generation requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Generate comprehensive unit tests for the following code. Include various test cases, edge cases, and proper assertions:

Code to Test: ${result.content || result.description || result.url}

Please provide:
1. Test file structure
2. Individual test cases with clear descriptions
3. Mock setup if needed
4. Edge case testing
5. Integration test suggestions`

      const response = await this.aiService.generateResponse(prompt)
      
      return {
        success: true,
        data: response,
        message: 'Tests generated successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate tests: ${error.message}`
      }
    }
  }

  private async executeSaveToNotes(context: ActionContext): Promise<ActionExecutionResult> {
    const { result } = context
    
    try {
      const note = {
        title: result.title,
        content: result.content || result.description || result.url,
        url: result.url,
        tags: ['saved-from-search'],
        createdAt: new Date().toISOString()
      }

      await this.notesService.saveNote(note)
      
      return {
        success: true,
        data: note,
        message: 'Saved to Notes successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save to Notes: ${error.message}`
      }
    }
  }

  private async executeSaveToNotion(context: ActionContext): Promise<ActionExecutionResult> {
    const { result } = context
    
    // Simulated Notion integration
    try {
      // In real implementation, this would call Notion API
      const notionData = {
        title: result.title,
        content: result.content || result.description || result.url,
        url: result.url,
        properties: {
          Type: result.type,
          Source: 'Omnior Search'
        }
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        data: notionData,
        message: 'Saved to Notion successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save to Notion: ${error.message}`
      }
    }
  }

  private async executeSaveToGDocs(context: ActionContext): Promise<ActionExecutionResult> {
    const { result } = context
    
    // Simulated Google Docs integration
    try {
      // In real implementation, this would call Google Docs API
      const gdocsData = {
        title: result.title,
        content: result.content || result.description || result.url,
        url: result.url,
        metadata: {
          type: result.type,
          source: 'Omnior Search',
          createdAt: new Date().toISOString()
        }
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        data: gdocsData,
        message: 'Saved to Google Docs successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save to Google Docs: ${error.message}`
      }
    }
  }

  private async executeCreateTrelloCard(context: ActionContext): Promise<ActionExecutionResult> {
    const { result } = context
    
    // Simulated Trello integration
    try {
      // In real implementation, this would call Trello API
      const trelloCard = {
        name: result.title,
        desc: result.content || result.description || result.url,
        url: result.url,
        labels: [result.type],
        source: 'Omnior Search'
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        data: trelloCard,
        message: 'Trello card created successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create Trello card: ${error.message}`
      }
    }
  }

  private async executeCreateCalendarEvent(context: ActionContext): Promise<ActionExecutionResult> {
    const { result, privacyMode } = context
    
    if (privacyMode === 'local') {
      return {
        success: false,
        error: 'Calendar event creation requires cloud or hybrid privacy mode'
      }
    }

    try {
      const prompt = `Analyze the following content and extract calendar event information. Create a structured calendar event with title, description, date/time, and any other relevant details:

Content: ${result.content || result.description || result.url}
Title: ${result.title}

Please provide:
1. Event Title
2. Event Description
3. Date and Time (if mentioned)
4. Duration (if mentioned)
5. Location (if mentioned)
6. Attendees (if mentioned)
7. Additional notes or context`

      const aiResponse = await this.aiService.generateResponse(prompt)
      
      // Parse AI response to extract event details
      const eventData = this.parseCalendarEventFromAI(aiResponse)
      
      // Simulate calendar API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        data: eventData,
        message: 'Calendar event created successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create calendar event: ${error.message}`
      }
    }
  }

  private async executeShareLink(context: ActionContext): Promise<ActionExecutionResult> {
    const { result } = context
    
    try {
      if (!result.url) {
        return {
          success: false,
          error: 'No URL available to share'
        }
      }

      // Copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result.url)
      }

      return {
        success: true,
        data: { url: result.url },
        message: 'Link copied to clipboard'
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to share link: ${error.message}`
      }
    }
  }

  private parseCalendarEventFromAI(aiResponse: string): any {
    // Simple parsing logic - in real implementation would use more sophisticated parsing
    const lines = aiResponse.split('\n')
    const eventData: any = {}

    lines.forEach(line => {
      if (line.includes('Event Title:')) {
        eventData.title = line.replace('Event Title:', '').trim()
      } else if (line.includes('Event Description:')) {
        eventData.description = line.replace('Event Description:', '').trim()
      } else if (line.includes('Date and Time:')) {
        eventData.datetime = line.replace('Date and Time:', '').trim()
      } else if (line.includes('Duration:')) {
        eventData.duration = line.replace('Duration:', '').trim()
      } else if (line.includes('Location:')) {
        eventData.location = line.replace('Location:', '').trim()
      }
    })

    return eventData
  }
}

// Singleton instance
let aiActionsServiceInstance: AIActionsService | null = null

export function getAIActionsService(): AIActionsService {
  if (!aiActionsServiceInstance) {
    const aiService = new AIService()
    const notesService = new NotesService()
    aiActionsServiceInstance = new AIActionsService(aiService, notesService)
  }
  return aiActionsServiceInstance
}