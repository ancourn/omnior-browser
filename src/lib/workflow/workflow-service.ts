"use server"

import { db } from "@/lib/db"
import ZAI from 'z-ai-web-dev-sdk'

// Workflow interfaces
export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'action' | 'condition' | 'loop' | 'delay' | 'parallel'
  config: Record<string, any>
  nextSteps: string[]
  condition?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  version: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  trigger: {
    type: 'manual' | 'schedule' | 'event' | 'webhook'
    config: Record<string, any>
  }
  steps: WorkflowStep[]
  variables: Record<string, any>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  currentStepId?: string
  variables: Record<string, any>
  results: Record<string, any>
  error?: string
  startedAt: Date
  completedAt?: Date
  triggerData?: Record<string, any>
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  workflow: Partial<Workflow>
  isPublic: boolean
  usageCount: number
  createdAt: Date
}

// Workflow Service
export class WorkflowService {
  private zai: ZAI | null = null

  constructor() {
    this.initializeZAI()
  }

  private async initializeZAI(): Promise<void> {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize ZAI:', error)
    }
  }

  // Create a new workflow
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    try {
      await db.workflow.create({
        data: {
          id: newWorkflow.id,
          name: newWorkflow.name,
          description: newWorkflow.description,
          version: newWorkflow.version,
          status: newWorkflow.status,
          trigger: JSON.stringify(newWorkflow.trigger),
          steps: JSON.stringify(newWorkflow.steps),
          variables: JSON.stringify(newWorkflow.variables),
          createdBy: newWorkflow.createdBy,
          createdAt: newWorkflow.createdAt,
          updatedAt: newWorkflow.updatedAt
        }
      })

      return newWorkflow
    } catch (error) {
      console.error('Failed to create workflow:', error)
      throw error
    }
  }

  // Execute a workflow
  async executeWorkflow(workflowId: string, triggerData?: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'pending',
      variables: { ...workflow.variables },
      results: {},
      startedAt: new Date(),
      triggerData
    }

    try {
      // Store execution in database
      await db.workflowExecution.create({
        data: {
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status,
          currentStepId: execution.currentStepId,
          variables: JSON.stringify(execution.variables),
          results: JSON.stringify(execution.results),
          error: execution.error,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
          triggerData: JSON.stringify(execution.triggerData)
        }
      })

      // Start execution
      await this.runWorkflowExecution(workflow, execution)
      
      return execution
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      await this.updateExecution(execution.id, execution)
      throw error
    }
  }

  // Generate workflow from natural language description
  async generateWorkflowFromDescription(description: string): Promise<Partial<Workflow>> {
    if (!this.zai) {
      throw new Error('ZAI not initialized')
    }

    const prompt = `
      Create a detailed workflow automation plan based on the following description:
      
      Description: "${description}"
      
      Please provide a JSON response with:
      1. name: A descriptive name for the workflow
      2. description: A clear description of what the workflow does
      3. trigger: The trigger type and configuration
      4. steps: An array of workflow steps with appropriate types and configurations
      5. variables: Any required variables for the workflow
      
      Each step should include:
      - id: unique identifier
      - name: step name
      - description: what the step does
      - type: one of 'action', 'condition', 'loop', 'delay', 'parallel'
      - config: configuration for the step
      - nextSteps: array of next step IDs
      - condition: (for conditional steps)
      
      Use realistic action types like 'web-search', 'extract-data', 'create-notes', 'send-email', etc.
    `

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a workflow automation expert that creates detailed, executable workflow plans from natural language descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      const workflowPlan = JSON.parse(response)
      
      // Validate and enhance the workflow
      return this.enhanceWorkflow(workflowPlan)
    } catch (error) {
      console.error('Failed to generate workflow:', error)
      throw error
    }
  }

  // Get workflow templates
  async getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
    // For now, return some default templates
    const templates: WorkflowTemplate[] = [
      {
        id: 'content_research',
        name: 'Content Research Workflow',
        description: 'Research a topic, extract key information, and create a summary report',
        category: 'research',
        tags: ['research', 'content', 'analysis'],
        workflow: {
          name: 'Content Research',
          description: 'Automated content research and analysis',
          version: '1.0.0',
          status: 'draft',
          trigger: {
            type: 'manual',
            config: {}
          },
          variables: {
            topic: '',
            searchDepth: 5,
            includeSources: true
          }
        },
        isPublic: true,
        usageCount: 0,
        createdAt: new Date()
      },
      {
        id: 'data_extraction',
        name: 'Data Extraction Pipeline',
        description: 'Extract structured data from web pages and export to various formats',
        category: 'data',
        tags: ['extraction', 'data', 'automation'],
        workflow: {
          name: 'Data Extraction',
          description: 'Extract and process data from web sources',
          version: '1.0.0',
          status: 'draft',
          trigger: {
            type: 'manual',
            config: {}
          },
          variables: {
            urls: [],
            outputFormat: 'json',
            dataSchema: {}
          }
        },
        isPublic: true,
        usageCount: 0,
        createdAt: new Date()
      },
      {
        id: 'social_media_monitor',
        name: 'Social Media Monitor',
        description: 'Monitor social media for keywords and generate sentiment analysis reports',
        category: 'monitoring',
        tags: ['social', 'monitoring', 'sentiment'],
        workflow: {
          name: 'Social Media Monitoring',
          description: 'Monitor and analyze social media content',
          version: '1.0.0',
          status: 'draft',
          trigger: {
            type: 'schedule',
            config: { interval: '1h' }
          },
          variables: {
            keywords: [],
            platforms: ['twitter', 'reddit'],
            sentimentThreshold: 0.5
          }
        },
        isPublic: true,
        usageCount: 0,
        createdAt: new Date()
      }
    ]

    if (category) {
      return templates.filter(t => t.category === category)
    }

    return templates
  }

  // Private methods
  private async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const workflow = await db.workflow.findUnique({
        where: { id: workflowId }
      })

      if (!workflow) return null

      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        status: workflow.status,
        trigger: JSON.parse(workflow.trigger),
        steps: JSON.parse(workflow.steps),
        variables: JSON.parse(workflow.variables),
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        createdBy: workflow.createdBy || undefined
      }
    } catch (error) {
      console.error('Failed to get workflow:', error)
      return null
    }
  }

  private async runWorkflowExecution(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    execution.status = 'running'
    await this.updateExecution(execution.id, execution)

    try {
      let currentStepId = workflow.steps[0]?.id
      execution.currentStepId = currentStepId

      while (currentStepId) {
        const step = workflow.steps.find(s => s.id === currentStepId)
        if (!step) break

        // Execute step
        const stepResult = await this.executeStep(step, execution)
        execution.results[currentStepId] = stepResult

        // Determine next step
        if (step.type === 'condition' && step.condition) {
          // Evaluate condition
          const conditionMet = await this.evaluateCondition(step.condition, execution)
          currentStepId = conditionMet ? step.nextSteps[0] : step.nextSteps[1]
        } else {
          currentStepId = step.nextSteps[0]
        }

        execution.currentStepId = currentStepId
        await this.updateExecution(execution.id, execution)
      }

      execution.status = 'completed'
      execution.completedAt = new Date()
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.completedAt = new Date()
    }

    await this.updateExecution(execution.id, execution)
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    switch (step.type) {
      case 'action':
        return await this.executeActionStep(step, execution)
      case 'delay':
        return await this.executeDelayStep(step, execution)
      case 'condition':
        return await this.executeConditionStep(step, execution)
      default:
        throw new Error(`Unsupported step type: ${step.type}`)
    }
  }

  private async executeActionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // This would integrate with the AI Actions Service
    // For now, simulate execution
    console.log(`Executing action step: ${step.name}`)
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      message: `Action "${step.name}" completed successfully`,
      timestamp: new Date()
    }
  }

  private async executeDelayStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    const delay = step.config.duration || 1000
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return {
      success: true,
      message: `Delay of ${delay}ms completed`,
      timestamp: new Date()
    }
  }

  private async executeConditionStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Condition evaluation is handled in the main execution loop
    return {
      success: true,
      message: `Condition "${step.name}" evaluated`,
      timestamp: new Date()
    }
  }

  private async evaluateCondition(condition: string, execution: WorkflowExecution): Promise<boolean> {
    // Simple condition evaluation - in a real implementation, this would be more sophisticated
    try {
      // This is a simplified evaluation - use proper expression evaluation in production
      const context = { ...execution.variables, ...execution.results }
      const evalCondition = condition.replace(/\${(\w+)}/g, (_, key) => {
        return JSON.stringify(context[key] || '')
      })
      
      // WARNING: eval is dangerous - use a proper expression evaluator in production
      return eval(evalCondition)
    } catch (error) {
      console.error('Condition evaluation failed:', error)
      return false
    }
  }

  private async updateExecution(executionId: string, execution: WorkflowExecution): Promise<void> {
    try {
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: execution.status,
          currentStepId: execution.currentStepId,
          variables: JSON.stringify(execution.variables),
          results: JSON.stringify(execution.results),
          error: execution.error,
          completedAt: execution.completedAt
        }
      })
    } catch (error) {
      console.error('Failed to update execution:', error)
    }
  }

  private enhanceWorkflow(workflow: any): Partial<Workflow> {
    // Ensure required fields are present and properly formatted
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      workflow.steps = []
    }

    // Add default values if missing
    workflow.version = workflow.version || '1.0.0'
    workflow.status = workflow.status || 'draft'
    workflow.variables = workflow.variables || {}
    workflow.trigger = workflow.trigger || { type: 'manual', config: {} }

    // Ensure steps have required fields
    workflow.steps.forEach((step: any, index: number) => {
      if (!step.id) {
        step.id = `step_${index + 1}`
      }
      if (!step.nextSteps) {
        step.nextSteps = index < workflow.steps.length - 1 ? [workflow.steps[index + 1].id] : []
      }
      if (!step.config) {
        step.config = {}
      }
    })

    return workflow
  }
}

// Export singleton instance
export const workflowService = new WorkflowService()