/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { AIActionsService, type ActionContext, type ActionExecutionResult, type ActionProgress } from './ai-actions-service'
import { searchService, type SearchResult, type SearchContext } from '../search/search-service'

export interface WorkflowStep {
  id: string
  name: string
  description: string
  actionId: string
  dependsOn?: string[] // Step IDs this step depends on
  condition?: string // JavaScript condition to evaluate
  parameters?: Record<string, any> // Parameters to pass to the action
  retryCount?: number
  timeout?: number // Timeout in milliseconds
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'schedule' | 'event' | 'webhook'
  condition?: string
  schedule?: string // Cron expression for scheduled triggers
  event?: string // Event type for event-based triggers
  webhook?: string // Webhook URL for webhook triggers
}

export interface Workflow {
  id: string
  name: string
  description: string
  version: string
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  variables?: Record<string, any>
  timeout?: number // Overall workflow timeout
  retryPolicy?: {
    maxRetries: number
    backoffMultiplier: number
    maxDelay: number
  }
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  results: Record<string, ActionExecutionResult>
  context: WorkflowContext
  error?: string
  progress: number
}

export interface WorkflowContext {
  searchResults: SearchResult[]
  selectedResults: SearchResult[]
  variables: Record<string, any>
  stepResults: Record<string, any>
  metadata: Record<string, any>
  privacyMode: 'local' | 'hybrid' | 'cloud'
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
  tags: string[]
  estimatedDuration: number // In seconds
}

export class WorkflowAutomationService {
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private templates: Map<string, WorkflowTemplate> = new Map()
  private progressCallbacks: Map<string, (execution: WorkflowExecution) => void> = new Map()
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map()
  private aiActionsService: AIActionsService

  constructor() {
    this.aiActionsService = new AIActionsService()
    this.initializeDefaultTemplates()
  }

  private initializeDefaultTemplates() {
    // Research and Analysis Template
    this.registerTemplate({
      id: 'research-analysis',
      name: 'Research & Analysis',
      description: 'Comprehensive research and analysis workflow',
      category: 'research',
      icon: 'Search',
      workflow: {
        name: 'Research & Analysis',
        description: 'Search, analyze, and summarize information on a topic',
        version: '1.0.0',
        steps: [
          {
            id: 'search',
            name: 'Search for Information',
            description: 'Search across all available sources',
            actionId: 'search',
            parameters: {
              query: '${topic}',
              sources: ['tabs', 'history', 'bookmarks', 'page-content']
            }
          },
          {
            id: 'summarize',
            name: 'Summarize Findings',
            description: 'Generate comprehensive summary of search results',
            actionId: 'summarize',
            dependsOn: ['search'],
            condition: 'context.searchResults.length > 0'
          },
          {
            id: 'extract-key-points',
            name: 'Extract Key Points',
            description: 'Extract main insights and action items',
            actionId: 'extract-key-points',
            dependsOn: ['search'],
            condition: 'context.searchResults.length > 0'
          },
          {
            id: 'save-to-notes',
            name: 'Save Research Notes',
            description: 'Save all findings to notes',
            actionId: 'save-to-notes',
            dependsOn: ['summarize', 'extract-key-points']
          }
        ],
        triggers: [
          {
            id: 'manual',
            type: 'manual'
          }
        ],
        timeout: 300000 // 5 minutes
      },
      tags: ['research', 'analysis', 'documentation'],
      estimatedDuration: 120
    })

    // Content Processing Template
    this.registerTemplate({
      id: 'content-processing',
      name: 'Content Processing',
      description: 'Process and analyze multiple content items',
      category: 'content',
      icon: 'FileText',
      workflow: {
        name: 'Content Processing',
        description: 'Process multiple content items with AI analysis',
        version: '1.0.0',
        steps: [
          {
            id: 'analyze-content',
            name: 'Analyze Content',
            description: 'Analyze each selected content item',
            actionId: 'extract-key-points',
            parameters: {
              batch: true
            }
          },
          {
            id: 'generate-summary',
            name: 'Generate Summary',
            description: 'Create overall summary of all content',
            actionId: 'summarize',
            dependsOn: ['analyze-content'],
            condition: 'context.stepResults.analyzeContent && context.stepResults.analyzeContent.length > 0'
          },
          {
            id: 'create-report',
            name: 'Create Report',
            description: 'Generate comprehensive report',
            actionId: 'generate-email',
            dependsOn: ['generate-summary'],
            parameters: {
              template: 'report'
            }
          }
        ],
        triggers: [
          {
            id: 'manual',
            type: 'manual'
          }
        ],
        timeout: 600000 // 10 minutes
      },
      tags: ['content', 'analysis', 'reporting'],
      estimatedDuration: 300
    })

    // Code Review Template
    this.registerTemplate({
      id: 'code-review',
      name: 'Code Review',
      description: 'Automated code review and improvement workflow',
      category: 'development',
      icon: 'Code',
      workflow: {
        name: 'Code Review',
        description: 'Review code and suggest improvements',
        version: '1.0.0',
        steps: [
          {
            id: 'explain-code',
            name: 'Explain Code',
            description: 'Generate detailed explanation of the code',
            actionId: 'explain-code'
          },
          {
            id: 'refactor-code',
            name: 'Refactor Code',
            description: 'Suggest code improvements and refactoring',
            actionId: 'refactor-code',
            dependsOn: ['explain-code']
          },
          {
            id: 'generate-tests',
            name: 'Generate Tests',
            description: 'Create comprehensive unit tests',
            actionId: 'generate-tests',
            dependsOn: ['refactor-code']
          },
          {
            id: 'create-trello-card',
            name: 'Create Task Card',
            description: 'Create Trello card for implementation',
            actionId: 'create-trello-card',
            dependsOn: ['generate-tests']
          }
        ],
        triggers: [
          {
            id: 'manual',
            type: 'manual'
          }
        ],
        timeout: 900000 // 15 minutes
      },
      tags: ['code', 'review', 'testing'],
      estimatedDuration: 600
    })

    // Daily Briefing Template
    this.registerTemplate({
      id: 'daily-briefing',
      name: 'Daily Briefing',
      description: 'Generate daily briefing from recent activity',
      category: 'productivity',
      icon: 'Calendar',
      workflow: {
        name: 'Daily Briefing',
        description: 'Create daily briefing from recent browsing and activity',
        version: '1.0.0',
        steps: [
          {
            id: 'get-recent-history',
            name: 'Get Recent History',
            description: 'Fetch recent browsing history',
            actionId: 'search',
            parameters: {
              query: '',
              sources: ['history'],
              maxResults: 20
            }
          },
          {
            id: 'analyze-activity',
            name: 'Analyze Activity',
            description: 'Analyze recent activity patterns',
            actionId: 'extract-key-points',
            dependsOn: ['get-recent-history']
          },
          {
            id: 'generate-briefing',
            name: 'Generate Briefing',
            description: 'Create daily briefing summary',
            actionId: 'summarize',
            dependsOn: ['analyze-activity']
          },
          {
            id: 'schedule-tasks',
            name: 'Schedule Tasks',
            description: 'Create calendar events for important tasks',
            actionId: 'create-calendar-event',
            dependsOn: ['generate-briefing']
          }
        ],
        triggers: [
          {
            id: 'daily-schedule',
            type: 'schedule',
            schedule: '0 9 * * *' // 9 AM daily
          }
        ],
        timeout: 300000 // 5 minutes
      },
      tags: ['productivity', 'briefing', 'automation'],
      estimatedDuration: 60
    })
  }

  registerTemplate(template: WorkflowTemplate) {
    this.templates.set(template.id, template)
  }

  createWorkflowFromTemplate(templateId: string, customizations?: Partial<Workflow>): Workflow {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const workflow: Workflow = {
      ...template.workflow,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      ...customizations
    }

    return workflow
  }

  registerWorkflow(workflow: Workflow) {
    this.workflows.set(workflow.id, workflow)
    
    // Setup scheduled triggers
    workflow.triggers.forEach(trigger => {
      if (trigger.type === 'schedule' && trigger.schedule) {
        this.setupScheduledTrigger(workflow.id, trigger)
      }
    })
  }

  async executeWorkflow(workflowId: string, context: Partial<WorkflowContext> = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`)
    }

    const executionId = crypto.randomUUID()
    const fullContext: WorkflowContext = {
      searchResults: context.searchResults || [],
      selectedResults: context.selectedResults || [],
      variables: context.variables || {},
      stepResults: {},
      metadata: context.metadata || {},
      privacyMode: context.privacyMode || 'hybrid'
    }

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      results: {},
      context: fullContext,
      progress: 0
    }

    this.executions.set(executionId, execution)
    this.notifyProgress(execution)

    // Execute workflow in background
    this.runWorkflow(workflow, execution).catch(error => {
      console.error(`Workflow execution failed: ${error.message}`)
      execution.status = 'failed'
      execution.error = error.message
      execution.endTime = new Date()
      this.notifyProgress(execution)
    })

    return execution
  }

  private async runWorkflow(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    execution.status = 'running'
    this.notifyProgress(execution)

    const timeout = workflow.timeout || 300000 // Default 5 minutes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Workflow execution timeout')), timeout)
    })

    try {
      await Promise.race([
        this.executeSteps(workflow, execution),
        timeoutPromise
      ])

      execution.status = 'completed'
      execution.progress = 100
      execution.endTime = new Date()
      this.notifyProgress(execution)
    } catch (error: any) {
      execution.status = 'failed'
      execution.error = error.message
      execution.endTime = new Date()
      this.notifyProgress(execution)
      throw error
    }
  }

  private async executeSteps(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    const completedSteps = new Set<string>()
    const totalSteps = workflow.steps.length

    for (const step of workflow.steps) {
      // Check dependencies
      if (step.dependsOn && !step.dependsOn.every(dep => completedSteps.has(dep))) {
        console.log(`Skipping step ${step.id} due to unmet dependencies`)
        continue
      }

      // Check condition
      if (step.condition && !this.evaluateCondition(step.condition, execution.context)) {
        console.log(`Skipping step ${step.id} due to condition`)
        continue
      }

      try {
        console.log(`Executing step: ${step.name}`)
        
        // Prepare action context
        const actionContext = this.prepareActionContext(step, execution.context)
        
        // Execute action with retry logic
        const result = await this.executeActionWithRetry(step, actionContext)
        
        execution.results[step.id] = result
        execution.context.stepResults[step.id] = result.data
        completedSteps.add(step.id)
        
        // Update progress
        execution.progress = Math.round((completedSteps.size / totalSteps) * 100)
        this.notifyProgress(execution)
        
      } catch (error: any) {
        console.error(`Step ${step.id} failed: ${error.message}`)
        
        // Store error result
        execution.results[step.id] = {
          success: false,
          error: error.message
        }
        
        // Continue execution unless it's a critical step
        if (step.actionId === 'search' || step.actionId.includes('critical')) {
          throw error
        }
      }
    }
  }

  private prepareActionContext(step: WorkflowStep, workflowContext: WorkflowContext): ActionContext {
    // Create a mock search result for the action
    const mockResult: SearchResult = {
      id: crypto.randomUUID(),
      type: 'webpage',
      title: step.name,
      content: step.description,
      score: 0
    }

    // Apply step parameters
    const parameters = { ...step.parameters }
    
    // Replace template variables
    Object.keys(parameters).forEach(key => {
      if (typeof parameters[key] === 'string') {
        parameters[key] = this.replaceTemplateVariables(parameters[key], workflowContext)
      }
    })

    return {
      result: mockResult,
      selectedResults: workflowContext.selectedResults,
      privacyMode: workflowContext.privacyMode
    }
  }

  private replaceTemplateVariables(template: string, context: WorkflowContext): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, variable) => {
      // Try to get variable from context
      if (context.variables[variable] !== undefined) {
        return context.variables[variable]
      }
      
      // Try to get from step results
      if (context.stepResults[variable] !== undefined) {
        return JSON.stringify(context.stepResults[variable])
      }
      
      // Try to get from metadata
      if (context.metadata[variable] !== undefined) {
        return context.metadata[variable]
      }
      
      return match // Return original if not found
    })
  }

  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // Create a safe evaluation context
      const evalContext = {
        context,
        true: true,
        false: false,
        null: null,
        undefined: undefined
      }
      
      // Simple condition evaluation (in production, use a proper expression evaluator)
      const func = new Function('context', `return ${condition}`)
      return func(evalContext)
    } catch (error) {
      console.error(`Condition evaluation failed: ${error}`)
      return false
    }
  }

  private async executeActionWithRetry(step: WorkflowStep, context: ActionContext): Promise<ActionExecutionResult> {
    const maxRetries = step.retryCount || 1
    const timeout = step.timeout || 30000 // 30 seconds default
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Execute with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Step execution timeout')), timeout)
        })
        
        const result = await Promise.race([
          this.aiActionsService.executeAction(step.actionId, context),
          timeoutPromise
        ])
        
        return result
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private setupScheduledTrigger(workflowId: string, trigger: WorkflowTrigger) {
    if (trigger.type !== 'schedule' || !trigger.schedule) return

    // Simple cron-like scheduling (in production, use a proper cron library)
    const interval = setInterval(() => {
      this.executeWorkflow(workflowId).catch(error => {
        console.error(`Scheduled workflow execution failed: ${error.message}`)
      })
    }, 24 * 60 * 60 * 1000) // Daily for now

    this.scheduledJobs.set(`${workflowId}-${trigger.id}`, interval)
  }

  onProgress(executionId: string, callback: (execution: WorkflowExecution) => void) {
    this.progressCallbacks.set(executionId, callback)
  }

  offProgress(executionId: string) {
    this.progressCallbacks.delete(executionId)
  }

  private notifyProgress(execution: WorkflowExecution) {
    const callback = this.progressCallbacks.get(execution.id)
    if (callback) {
      callback(execution)
    }
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id)
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id)
  }

  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values())
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(e => e.status === 'running')
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId)
    if (execution && (execution.status === 'pending' || execution.status === 'running')) {
      execution.status = 'cancelled'
      execution.endTime = new Date()
      this.notifyProgress(execution)
      return true
    }
    return false
  }

  deleteWorkflow(workflowId: string): boolean {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return false

    // Cancel scheduled jobs
    workflow.triggers.forEach(trigger => {
      const jobKey = `${workflowId}-${trigger.id}`
      const interval = this.scheduledJobs.get(jobKey)
      if (interval) {
        clearInterval(interval)
        this.scheduledJobs.delete(jobKey)
      }
    })

    this.workflows.delete(workflowId)
    return true
  }
}

// Export singleton instance
export const workflowAutomationService = new WorkflowAutomationService()