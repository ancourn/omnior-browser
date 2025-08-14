"use client"

import { useState, useEffect, useCallback } from 'react'

// Contextual AI interfaces
export interface ContextualAction {
  id: string
  name: string
  description: string
  category: 'text' | 'image' | 'link' | 'page' | 'selection' | 'form'
  icon: string
  handler: (context: AIContext) => Promise<ContextualActionResult>
  conditions?: ContextualCondition[]
  priority: number // higher number = higher priority
}

export interface ContextualCondition {
  type: 'text_length' | 'contains_url' | 'contains_email' | 'contains_image' | 'page_type' | 'domain'
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  value: string | number
}

export interface AIContext {
  selectedText?: string
  currentUrl?: string
  pageTitle?: string
  pageType?: 'article' | 'product' | 'search' | 'social' | 'video' | 'unknown'
  domain?: string
  images?: string[]
  links?: string[]
  forms?: FormField[]
  metadata?: Record<string, any>
  userPreferences?: {
    privacyMode: 'local' | 'hybrid' | 'cloud'
    preferredActions: string[]
  }
}

export interface FormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea'
  value?: string
  label?: string
}

export interface ContextualActionResult {
  success: boolean
  data?: any
  error?: string
  suggestedActions?: string[]
  modifiedContext?: Partial<AIContext>
}

// Contextual AI Service
export class ContextualAIService {
  private actions: Map<string, ContextualAction> = new Map()
  private context: AIContext = {}
  private listeners: Set<(context: AIContext) => void> = new Set()

  constructor() {
    this.initializeDefaultActions()
  }

  // Register a contextual action
  registerAction(action: ContextualAction): void {
    this.actions.set(action.id, action)
  }

  // Unregister an action
  unregisterAction(actionId: string): void {
    this.actions.delete(actionId)
  }

  // Get all actions
  getAllActions(): ContextualAction[] {
    return Array.from(this.actions.values())
  }

  // Get applicable actions for current context
  getApplicableActions(context?: AIContext): ContextualAction[] {
    const currentContext = context || this.context
    return this.getAllActions().filter(action => 
      this.isActionApplicable(action, currentContext)
    ).sort((a, b) => b.priority - a.priority)
  }

  // Check if an action is applicable to the current context
  private isActionApplicable(action: ContextualAction, context: AIContext): boolean {
    if (!action.conditions || action.conditions.length === 0) {
      return true
    }

    return action.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    )
  }

  // Evaluate a condition against the context
  private evaluateCondition(condition: ContextualCondition, context: AIContext): boolean {
    const { type, operator, value } = condition

    switch (type) {
      case 'text_length':
        const textLength = context.selectedText?.length || 0
        return this.compareValues(textLength, operator, value)
      
      case 'contains_url':
        return this.containsUrl(context.selectedText || '')
      
      case 'contains_email':
        return this.containsEmail(context.selectedText || '')
      
      case 'contains_image':
        return (context.images?.length || 0) > 0
      
      case 'page_type':
        return this.compareValues(context.pageType || 'unknown', operator, value)
      
      case 'domain':
        return this.compareValues(context.domain || '', operator, value)
      
      default:
        return false
    }
  }

  // Compare values based on operator
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected
      case 'contains':
        return String(actual).includes(String(expected))
      case 'starts_with':
        return String(actual).startsWith(String(expected))
      case 'ends_with':
        return String(actual).endsWith(String(expected))
      case 'greater_than':
        return Number(actual) > Number(expected)
      case 'less_than':
        return Number(actual) < Number(expected)
      default:
        return false
    }
  }

  // Check if text contains URL
  private containsUrl(text: string): boolean {
    const urlRegex = /https?:\/\/[^\s]+/g
    return urlRegex.test(text)
  }

  // Check if text contains email
  private containsEmail(text: string): boolean {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g
    return emailRegex.test(text)
  }

  // Update the current context
  updateContext(newContext: Partial<AIContext>): void {
    this.context = { ...this.context, ...newContext }
    this.notifyListeners()
  }

  // Get current context
  getContext(): AIContext {
    return { ...this.context }
  }

  // Add context listener
  addContextListener(listener: (context: AIContext) => void): void {
    this.listeners.add(listener)
  }

  // Remove context listener
  removeContextListener(listener: (context: AIContext) => void): void {
    this.listeners.delete(listener)
  }

  // Notify all listeners of context changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.context))
  }

  // Execute a contextual action
  async executeAction(actionId: string, context?: AIContext): Promise<ContextualActionResult> {
    const action = this.actions.get(actionId)
    if (!action) {
      return {
        success: false,
        error: `Action ${actionId} not found`
      }
    }

    const executionContext = context || this.context
    try {
      const result = await action.handler(executionContext)
      
      // Update context if action modified it
      if (result.modifiedContext) {
        this.updateContext(result.modifiedContext)
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Initialize default contextual actions
  private initializeDefaultActions(): void {
    const defaultActions: ContextualAction[] = [
      {
        id: 'summarize_selection',
        name: 'Summarize Selection',
        description: 'Create a concise summary of the selected text',
        category: 'selection',
        icon: '📝',
        priority: 10,
        conditions: [
          { type: 'text_length', operator: 'greater_than', value: 50 }
        ],
        handler: async (context) => {
          // This would integrate with AI service
          return {
            success: true,
            data: { summary: 'AI-generated summary would appear here' },
            suggestedActions: ['extract_key_points', 'create_notes']
          }
        }
      },
      {
        id: 'extract_contact_info',
        name: 'Extract Contact Info',
        description: 'Extract names, emails, and phone numbers from selection',
        category: 'text',
        icon: '📇',
        priority: 8,
        conditions: [
          { type: 'contains_email', operator: 'equals', value: true }
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { contacts: [] }, // Would extract actual contacts
            suggestedActions: ['save_contacts', 'send_email']
          }
        }
      },
      {
        id: 'analyze_sentiment',
        name: 'Analyze Sentiment',
        description: 'Analyze the emotional tone and sentiment of the text',
        category: 'text',
        icon: '😊',
        priority: 7,
        conditions: [
          { type: 'text_length', operator: 'greater_than', value: 20 }
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { sentiment: 'neutral', confidence: 0.85 },
            suggestedActions: ['extract_keywords', 'create_report']
          }
        }
      },
      {
        id: 'translate_text',
        name: 'Translate Text',
        description: 'Translate the selected text to another language',
        category: 'text',
        icon: '🌐',
        priority: 6,
        conditions: [
          { type: 'text_length', operator: 'greater_than', value: 10 }
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { translatedText: 'Translated text would appear here' },
            suggestedActions: ['detect_language', 'save_translation']
          }
        }
      },
      {
        id: 'open_link_in_background',
        name: 'Open in Background Tab',
        description: 'Open the link in a new background tab',
        category: 'link',
        icon: '🔗',
        priority: 9,
        conditions: [
          { type: 'contains_url', operator: 'equals', value: true }
        ],
        handler: async (context) => {
          const url = this.extractUrl(context.selectedText || '')
          if (url) {
            // Would open in background tab
            return {
              success: true,
              data: { url, opened: true }
            }
          }
          return {
            success: false,
            error: 'No valid URL found'
          }
        }
      },
      {
        id: 'save_image',
        name: 'Save Image',
        description: 'Save the image to your device',
        category: 'image',
        icon: '💾',
        priority: 8,
        conditions: [
          { type: 'contains_image', operator: 'equals', value: true }
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { saved: true, path: '/downloads/image.jpg' }
          }
        }
      },
      {
        id: 'fill_form',
        name: 'Auto-Fill Form',
        description: 'Automatically fill form fields with saved information',
        category: 'form',
        icon: '📝',
        priority: 9,
        conditions: [
          { type: 'page_type', operator: 'equals', value: 'unknown' } // Would check for forms
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { filledFields: context.forms?.length || 0 },
            suggestedActions: ['save_form_data', 'validate_form']
          }
        }
      },
      {
        id: 'extract_product_info',
        name: 'Extract Product Info',
        description: 'Extract product details from the page',
        category: 'page',
        icon: '🛍️',
        priority: 8,
        conditions: [
          { type: 'page_type', operator: 'equals', value: 'product' }
        ],
        handler: async (context) => {
          return {
            success: true,
            data: { 
              name: 'Product Name',
              price: '$99.99',
              description: 'Product description'
            },
            suggestedActions: ['compare_prices', 'add_to_wishlist']
          }
        }
      }
    ]

    defaultActions.forEach(action => this.registerAction(action))
  }

  // Extract URL from text
  private extractUrl(text: string): string | null {
    const urlRegex = /https?:\/\/[^\s]+/g
    const match = text.match(urlRegex)
    return match ? match[0] : null
  }

  // Analyze page content and determine page type
  analyzePageContent(url: string, title: string, content: string): void {
    const domain = new URL(url).hostname
    let pageType: AIContext['pageType'] = 'unknown'

    // Simple page type detection
    if (domain.includes('amazon') || domain.includes('ebay')) {
      pageType = 'product'
    } else if (domain.includes('youtube') || domain.includes('vimeo')) {
      pageType = 'video'
    } else if (domain.includes('facebook') || domain.includes('twitter')) {
      pageType = 'social'
    } else if (domain.includes('google') || domain.includes('bing')) {
      pageType = 'search'
    } else if (title.includes('article') || content.includes('article')) {
      pageType = 'article'
    }

    this.updateContext({
      currentUrl: url,
      pageTitle: title,
      domain,
      pageType
    })
  }

  // Handle text selection
  handleTextSelection(selectedText: string): void {
    this.updateContext({ selectedText })
  }

  // Detect images on page
  detectImages(images: string[]): void {
    this.updateContext({ images })
  }

  // Detect links on page
  detectLinks(links: string[]): void {
    this.updateContext({ links })
  }

  // Detect forms on page
  detectForms(forms: FormField[]): void {
    this.updateContext({ forms })
  }
}

// Export singleton instance
export const contextualAIService = new ContextualAIService()

// React hook for contextual AI
export function useContextualAI() {
  const [context, setContext] = useState<AIContext>({})
  const [applicableActions, setApplicableActions] = useState<ContextualAction[]>([])

  useEffect(() => {
    const updateActions = (newContext: AIContext) => {
      setContext(newContext)
      setApplicableActions(contextualAIService.getApplicableActions(newContext))
    }

    contextualAIService.addContextListener(updateActions)

    // Initialize with current context
    updateActions(contextualAIService.getContext())

    return () => {
      contextualAIService.removeContextListener(updateActions)
    }
  }, [])

  const executeAction = useCallback(async (actionId: string) => {
    return await contextualAIService.executeAction(actionId)
  }, [])

  const updateContext = useCallback((newContext: Partial<AIContext>) => {
    contextualAIService.updateContext(newContext)
  }, [])

  return {
    context,
    applicableActions,
    executeAction,
    updateContext
  }
}