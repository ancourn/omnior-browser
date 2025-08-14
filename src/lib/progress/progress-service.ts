"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Progress interfaces
export interface ProgressItem {
  id: string
  type: 'action' | 'workflow' | 'download' | 'upload' | 'analysis' | 'search'
  title: string
  description?: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  total?: number
  current?: number
  speed?: number // items per second or bytes per second
  eta?: number // estimated time in seconds
  startTime: Date
  endTime?: Date
  error?: string
  metadata?: Record<string, any>
  parentId?: string // for nested progress
  children?: string[] // child progress item IDs
}

export interface ProgressUpdate {
  id: string
  progress?: number
  current?: number
  speed?: number
  eta?: number
  status?: ProgressItem['status']
  error?: string
  metadata?: Record<string, any>
}

export interface ProgressFilter {
  type?: ProgressItem['type']
  status?: ProgressItem['status']
  parentId?: string
  timeRange?: {
    start: Date
    end: Date
  }
}

// Progress Store
interface ProgressState {
  items: Map<string, ProgressItem>
  activeItems: Set<string>
  history: ProgressItem[]
  maxHistory: number
  
  // Actions
  addItem: (item: Omit<ProgressItem, 'startTime'>) => string
  updateItem: (id: string, update: ProgressUpdate) => void
  removeItem: (id: string) => void
  getItem: (id: string) => ProgressItem | undefined
  getItems: (filter?: ProgressFilter) => ProgressItem[]
  getActiveItems: () => ProgressItem[]
  pauseItem: (id: string) => void
  resumeItem: (id: string) => void
  cancelItem: (id: string) => void
  clearCompleted: () => void
  clearHistory: () => void
  retryItem: (id: string) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      items: new Map(),
      activeItems: new Set(),
      history: [],
      maxHistory: 100,

      addItem: (item) => {
        const id = item.id || `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newItem: ProgressItem = {
          ...item,
          id,
          startTime: new Date(),
          progress: item.progress || 0,
        }

        set((state) => {
          const newItems = new Map(state.items)
          newItems.set(id, newItem)
          
          const newActiveItems = new Set(state.activeItems)
          if (newItem.status === 'running') {
            newActiveItems.add(id)
          }

          return {
            items: newItems,
            activeItems: newActiveItems,
          }
        })

        return id
      },

      updateItem: (id, update) => {
        set((state) => {
          const item = state.items.get(id)
          if (!item) return state

          const updatedItem: ProgressItem = {
            ...item,
            ...update,
            // Calculate progress if current and total are provided
            progress: update.progress ?? 
              (update.current !== undefined && update.total !== undefined
                ? Math.round((update.current / update.total) * 100)
                : item.progress),
          }

          // Update end time if status is terminal
          if (update.status && ['completed', 'failed', 'cancelled'].includes(update.status)) {
            updatedItem.endTime = new Date()
          }

          const newItems = new Map(state.items)
          newItems.set(id, updatedItem)

          // Update active items
          const newActiveItems = new Set(state.activeItems)
          if (updatedItem.status === 'running') {
            newActiveItems.add(id)
          } else {
            newActiveItems.delete(id)
          }

          // Move to history if completed
          let newHistory = state.history
          if (updatedItem.status === 'completed' || updatedItem.status === 'failed') {
            newHistory = [updatedItem, ...state.history].slice(0, state.maxHistory)
          }

          return {
            items: newItems,
            activeItems: newActiveItems,
            history: newHistory,
          }
        })
      },

      removeItem: (id) => {
        set((state) => {
          const newItems = new Map(state.items)
          newItems.delete(id)
          
          const newActiveItems = new Set(state.activeItems)
          newActiveItems.delete(id)

          return {
            items: newItems,
            activeItems: newActiveItems,
          }
        })
      },

      getItem: (id) => {
        return get().items.get(id)
      },

      getItems: (filter) => {
        const items = Array.from(get().items.values())
        
        if (!filter) return items

        return items.filter((item) => {
          if (filter.type && item.type !== filter.type) return false
          if (filter.status && item.status !== filter.status) return false
          if (filter.parentId && item.parentId !== filter.parentId) return false
          if (filter.timeRange) {
            const itemTime = item.startTime.getTime()
            if (itemTime < filter.timeRange.start.getTime() || itemTime > filter.timeRange.end.getTime()) {
              return false
            }
          }
          return true
        })
      },

      getActiveItems: () => {
        return Array.from(get().activeItems).map(id => get().items.get(id)!).filter(Boolean)
      },

      pauseItem: (id) => {
        get().updateItem(id, { status: 'paused' })
      },

      resumeItem: (id) => {
        get().updateItem(id, { status: 'running' })
      },

      cancelItem: (id) => {
        get().updateItem(id, { status: 'cancelled' })
      },

      clearCompleted: () => {
        set((state) => {
          const newItems = new Map()
          state.items.forEach((item, id) => {
            if (!['completed', 'failed', 'cancelled'].includes(item.status)) {
              newItems.set(id, item)
            }
          })

          const newActiveItems = new Set(state.activeItems)
          state.items.forEach((item, id) => {
            if (['completed', 'failed', 'cancelled'].includes(item.status)) {
              newActiveItems.delete(id)
            }
          })

          return {
            items: newItems,
            activeItems: newActiveItems,
          }
        })
      },

      clearHistory: () => {
        set({ history: [] })
      },

      retryItem: (id) => {
        const item = get().items.get(id)
        if (!item) return

        const retryItem: Omit<ProgressItem, 'startTime'> = {
          ...item,
          status: 'pending',
          progress: 0,
          current: 0,
          speed: undefined,
          eta: undefined,
          error: undefined,
          endTime: undefined,
          id: `${item.id}_retry_${Date.now()}`,
        }

        get().addItem(retryItem)
      },
    }),
    {
      name: 'progress-storage',
      partialize: (state) => ({
        history: state.history,
        maxHistory: state.maxHistory,
      }),
    }
  )
)

// Progress Service Class
export class ProgressService {
  private static instance: ProgressService
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService()
    }
    return ProgressService.instance
  }

  // Create a new progress item
  createProgress(item: Omit<ProgressItem, 'startTime'>): string {
    return useProgressStore.getState().addItem(item)
  }

  // Update progress
  updateProgress(id: string, update: ProgressUpdate): void {
    useProgressStore.getState().updateItem(id, update)
  }

  // Simulate progress for testing/demonstration
  simulateProgress(
    item: Omit<ProgressItem, 'startTime' | 'progress' | 'current' | 'speed' | 'eta'>,
    duration: number = 5000,
    steps: number = 50
  ): string {
    const id = this.createProgress(item)
    
    let progress = 0
    const interval = setInterval(() => {
      progress += 100 / steps
      
      this.updateProgress(id, {
        progress: Math.min(progress, 100),
        current: Math.round((progress / 100) * (item.total || 100)),
        speed: (item.total || 100) / (duration / 1000),
        eta: Math.max(0, (duration - (progress / 100) * duration) / 1000),
      })

      if (progress >= 100) {
        clearInterval(interval)
        this.updateProgress(id, { 
          status: 'completed',
          progress: 100,
          current: item.total,
        })
        this.progressIntervals.delete(id)
      }
    }, duration / steps)

    this.progressIntervals.set(id, interval)
    return id
  }

  // Cancel simulated progress
  cancelProgress(id: string): void {
    const interval = this.progressIntervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.progressIntervals.delete(id)
    }
    this.updateProgress(id, { status: 'cancelled' })
  }

  // Get progress item
  getProgress(id: string): ProgressItem | undefined {
    return useProgressStore.getState().getItem(id)
  }

  // Get all progress items
  getProgressItems(filter?: ProgressFilter): ProgressItem[] {
    return useProgressStore.getState().getItems(filter)
  }

  // Get active progress items
  getActiveProgressItems(): ProgressItem[] {
    return useProgressStore.getState().getActiveItems()
  }

  // Pause progress
  pauseProgress(id: string): void {
    useProgressStore.getState().pauseItem(id)
  }

  // Resume progress
  resumeProgress(id: string): void {
    useProgressStore.getState().resumeItem(id)
  }

  // Cancel progress
  cancelProgress(id: string): void {
    this.cancelProgress(id) // This cancels simulation if running
    useProgressStore.getState().cancelItem(id)
  }

  // Clear completed items
  clearCompleted(): void {
    useProgressStore.getState().clearCompleted()
  }

  // Clear history
  clearHistory(): void {
    useProgressStore.getState().clearHistory()
  }

  // Retry failed item
  retryProgress(id: string): string | undefined {
    const originalItem = this.getProgress(id)
    if (!originalItem || originalItem.status !== 'failed') {
      return undefined
    }

    return useProgressStore.getState().retryItem(id)
  }

  // Create a batch progress (parent item with children)
  createBatchProgress(
    title: string,
    description: string,
    type: ProgressItem['type'],
    items: Omit<ProgressItem, 'startTime' | 'parentId' | 'children'>[]
  ): string {
    const parentId = this.createProgress({
      id: `batch_${Date.now()}`,
      type,
      title,
      description,
      status: 'running',
      progress: 0,
      total: items.length,
      current: 0,
    })

    const childIds: string[] = []
    items.forEach((item, index) => {
      const childId = this.createProgress({
        ...item,
        parentId,
        title: `${title} - ${index + 1}/${items.length}`,
      })
      childIds.push(childId)
    })

    // Update parent with children
    useProgressStore.getState().updateItem(parentId, {
      metadata: { childIds },
    })

    return parentId
  }

  // Update batch progress when child items complete
  updateBatchProgress(parentId: string): void {
    const parent = this.getProgress(parentId)
    if (!parent) return

    const childIds = parent.metadata?.childIds || []
    const children = childIds.map(id => this.getProgress(id)).filter(Boolean) as ProgressItem[]

    const completedChildren = children.filter(child => 
      child.status === 'completed'
    ).length

    const progress = children.length > 0 ? (completedChildren / children.length) * 100 : 0

    this.updateProgress(parentId, {
      progress,
      current: completedChildren,
      status: completedChildren === children.length ? 'completed' : 'running',
    })
  }
}

// Export singleton instance
export const progressService = ProgressService.getInstance()

// React hooks for progress management
export function useProgress(id?: string) {
  const items = useProgressStore((state) => 
    id ? [state.items.get(id)].filter(Boolean) as ProgressItem[] : state.getItems()
  )
  const activeItems = useProgressStore((state) => state.getActiveItems())
  
  const addItem = useProgressStore((state) => state.addItem)
  const updateItem = useProgressStore((state) => state.updateItem)
  const removeItem = useProgressStore((state) => state.removeItem)
  const pauseItem = useProgressStore((state) => state.pauseItem)
  const resumeItem = useProgressStore((state) => state.resumeItem)
  const cancelItem = useProgressStore((state) => state.cancelItem)
  const clearCompleted = useProgressStore((state) => state.clearCompleted)
  const retryItem = useProgressStore((state) => state.retryItem)

  return {
    items: id ? items : undefined,
    activeItems,
    addItem,
    updateItem,
    removeItem,
    pauseItem,
    resumeItem,
    cancelItem,
    clearCompleted,
    retryItem,
  }
}