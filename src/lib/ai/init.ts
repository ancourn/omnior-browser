import { registerDefaultActions } from './default-actions'

// Initialize AI actions registry
export function initializeAIActions() {
  registerDefaultActions()
  console.log('AI Actions initialized successfully')
}

// Auto-initialize when this module is imported
if (typeof window === 'undefined') {
  // Only run on server side
  initializeAIActions()
}