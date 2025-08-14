/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

export interface ProgressItem {
  id: string
  type: 'download' | 'upload' | 'ai-action' | 'workflow' | 'sync' | 'backup' | 'scan'
  title: string
  description?: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  startTime: Date
  endTime?: Date
  estimatedTimeRemaining?: number // in seconds
  error?: string
  metadata?: Record<string, any>
  isCancellable: boolean
  isPausable: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'system' | 'user' | 'background'
}

export interface ProgressGroup {
  id: string
  name: string
  description?: string
  items: ProgressItem[]
  status: ProgressItem['status']
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface ProgressFilter {
  type?: ProgressItem['type'][]
  status?: ProgressItem['status'][]
  category?: ProgressItem['category'][]
  priority?: ProgressItem['priority'][]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ProgressNotification {
  id: string
  type: 'start' | 'progress' | 'complete' | 'error' | 'cancel'
  itemId: string
  title: string
  message: string
  timestamp: Date
  isRead: boolean
}

export interface ProgressStatistics {
  totalItems: number
  completedItems: number
  failedItems: number
  runningItems: number
  averageCompletionTime: number // in seconds
  byType: Record<ProgressItem['type'], {
    total: number
    completed: number
    failed: number
    averageTime: number
  }>
  byCategory: Record<ProgressItem['category'], {
    total: number
    completed: number
    failed: number
    averageTime: number
  }>
}

export class ProgressManager {
  private items: Map<string, ProgressItem> = new Map()
  private groups: Map<string, ProgressGroup> = new Map()
  private notifications: Map<string, ProgressNotification> = new Map()
  private listeners: Map<string, Set<(item: ProgressItem) => void>> = new Map()
  private groupListeners: Map<string, Set<(group: ProgressGroup) => void>> = new Map()
  private notificationListeners: Set<(notification: ProgressNotification) => void> = new Set()
  private autoCleanupInterval: NodeJS.Timeout

  constructor() {
    // Auto-cleanup completed items older than 24 hours
    this.autoCleanupInterval = setInterval(() => {
      this.cleanupOldItems()
    }, 60 * 60 * 1000) // Every hour
  }

  // Create a new progress item
  createProgressItem(item: Omit<ProgressItem, 'id' | 'startTime' | 'progress'>): ProgressItem {
    const progressItem: ProgressItem = {
      ...item,
      id: crypto.randomUUID(),
      startTime: new Date(),
      progress: 0
    }

    this.items.set(progressItem.id, progressItem)
    this.notifyListeners(progressItem)
    this.createNotification('start', progressItem.id, progressItem.title, `${progressItem.title} started`)
    
    return progressItem
  }

  // Update progress item
  updateProgressItem(
    id: string,
    updates: Partial<Omit<ProgressItem, 'id' | 'startTime'>>
  ): ProgressItem | null {
    const item = this.items.get(id)
    if (!item) return null

    const updatedItem: ProgressItem = {
      ...item,
      ...updates,
      endTime: updates.status === 'completed' || updates.status === 'failed' || updates.status === 'cancelled' 
        ? new Date() 
        : item.endTime
    }

    this.items.set(id, updatedItem)
    this.notifyListeners(updatedItem)

    // Create notifications for status changes
    if (updates.status && updates.status !== item.status) {
      switch (updates.status) {
        case 'completed':
          this.createNotification('complete', id, updatedItem.title, `${updatedItem.title} completed`)
          break
        case 'failed':
          this.createNotification('error', id, updatedItem.title, `${updatedItem.title} failed: ${updates.error || 'Unknown error'}`)
          break
        case 'cancelled':
          this.createNotification('cancel', id, updatedItem.title, `${updatedItem.title} cancelled`)
          break
      }
    }

    // Create progress notification for significant progress updates
    if (updates.progress !== undefined && Math.abs(updates.progress - item.progress) >= 10) {
      this.createNotification('progress', id, updatedItem.title, `${updatedItem.title}: ${updates.progress}% complete`)
    }

    // Update associated groups
    this.updateAssociatedGroups(updatedItem)

    return updatedItem
  }

  // Get progress item
  getProgressItem(id: string): ProgressItem | null {
    return this.items.get(id) || null
  }

  // Get all progress items
  getAllProgressItems(filter?: ProgressFilter): ProgressItem[] {
    let items = Array.from(this.items.values())

    if (filter) {
      items = items.filter(item => {
        if (filter.type && !filter.type.includes(item.type)) return false
        if (filter.status && !filter.status.includes(item.status)) return false
        if (filter.category && !filter.category.includes(item.category)) return false
        if (filter.priority && !filter.priority.includes(item.priority)) return false
        if (filter.dateRange) {
          const itemDate = item.startTime
          if (itemDate < filter.dateRange.start || itemDate > filter.dateRange.end) return false
        }
        return true
      })
    }

    // Sort by priority and start time
    return items.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return b.startTime.getTime() - a.startTime.getTime()
    })
  }

  // Create progress group
  createProgressGroup(name: string, description?: string, itemIds?: string[]): ProgressGroup {
    const groupId = crypto.randomUUID()
    const items = itemIds ? itemIds.map(id => this.items.get(id)).filter(Boolean) as ProgressItem[] : []
    
    const group: ProgressGroup = {
      id: groupId,
      name,
      description,
      items,
      status: this.calculateGroupStatus(items),
      progress: this.calculateGroupProgress(items),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.groups.set(groupId, group)
    this.notifyGroupListeners(group)
    
    return group
  }

  // Add item to group
  addItemToGroup(groupId: string, itemId: string): boolean {
    const group = this.groups.get(groupId)
    const item = this.items.get(itemId)
    
    if (!group || !item) return false

    if (!group.items.find(i => i.id === itemId)) {
      group.items.push(item)
      group.status = this.calculateGroupStatus(group.items)
      group.progress = this.calculateGroupProgress(group.items)
      group.updatedAt = new Date()
      this.notifyGroupListeners(group)
    }
    
    return true
  }

  // Remove item from group
  removeItemFromGroup(groupId: string, itemId: string): boolean {
    const group = this.groups.get(groupId)
    if (!group) return false

    const index = group.items.findIndex(item => item.id === itemId)
    if (index !== -1) {
      group.items.splice(index, 1)
      group.status = this.calculateGroupStatus(group.items)
      group.progress = this.calculateGroupProgress(group.items)
      group.updatedAt = new Date()
      this.notifyGroupListeners(group)
      return true
    }
    
    return false
  }

  // Get progress group
  getProgressGroup(id: string): ProgressGroup | null {
    return this.groups.get(id) || null
  }

  // Get all progress groups
  getAllProgressGroups(): ProgressGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Cancel progress item
  cancelProgressItem(id: string): boolean {
    const item = this.items.get(id)
    if (!item || !item.isCancellable || item.status === 'completed' || item.status === 'failed') {
      return false
    }

    this.updateProgressItem(id, { status: 'cancelled' })
    return true
  }

  // Pause/resume progress item
  togglePauseProgressItem(id: string): boolean {
    const item = this.items.get(id)
    if (!item || !item.isPausable) return false

    const newStatus = item.status === 'paused' ? 'running' : 'paused'
    this.updateProgressItem(id, { status: newStatus })
    return true
  }

  // Get notifications
  getNotifications(unreadOnly: boolean = false): ProgressNotification[] {
    let notifications = Array.from(this.notifications.values())
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead)
    }
    
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Mark notification as read
  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.get(id)
    if (!notification || notification.isRead) return false

    notification.isRead = true
    return true
  }

  // Mark all notifications as read
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(notification => {
      notification.isRead = true
    })
  }

  // Get progress statistics
  getStatistics(): ProgressStatistics {
    const items = Array.from(this.items.values())
    const now = Date.now()

    const stats: ProgressStatistics = {
      totalItems: items.length,
      completedItems: items.filter(i => i.status === 'completed').length,
      failedItems: items.filter(i => i.status === 'failed').length,
      runningItems: items.filter(i => i.status === 'running').length,
      averageCompletionTime: 0,
      byType: {} as any,
      byCategory: {} as any
    }

    // Calculate average completion time
    const completedItems = items.filter(i => i.status === 'completed' && i.endTime)
    if (completedItems.length > 0) {
      const totalTime = completedItems.reduce((sum, item) => sum + (item.endTime!.getTime() - item.startTime.getTime()), 0)
      stats.averageCompletionTime = totalTime / completedItems.length / 1000 // Convert to seconds
    }

    // Calculate by type
    const types: ProgressItem['type'][] = ['download', 'upload', 'ai-action', 'workflow', 'sync', 'backup', 'scan']
    types.forEach(type => {
      const typeItems = items.filter(i => i.type === type)
      const typeCompleted = typeItems.filter(i => i.status === 'completed' && i.endTime)
      const typeFailed = typeItems.filter(i => i.status === 'failed')
      
      let typeAverageTime = 0
      if (typeCompleted.length > 0) {
        const typeTotalTime = typeCompleted.reduce((sum, item) => sum + (item.endTime!.getTime() - item.startTime.getTime()), 0)
        typeAverageTime = typeTotalTime / typeCompleted.length / 1000
      }

      stats.byType[type] = {
        total: typeItems.length,
        completed: typeCompleted.length,
        failed: typeFailed.length,
        averageTime: typeAverageTime
      }
    })

    // Calculate by category
    const categories: ProgressItem['category'][] = ['system', 'user', 'background']
    categories.forEach(category => {
      const categoryItems = items.filter(i => i.category === category)
      const categoryCompleted = categoryItems.filter(i => i.status === 'completed' && i.endTime)
      const categoryFailed = categoryItems.filter(i => i.status === 'failed')
      
      let categoryAverageTime = 0
      if (categoryCompleted.length > 0) {
        const categoryTotalTime = categoryCompleted.reduce((sum, item) => sum + (item.endTime!.getTime() - item.startTime.getTime()), 0)
        categoryAverageTime = categoryTotalTime / categoryCompleted.length / 1000
      }

      stats.byCategory[category] = {
        total: categoryItems.length,
        completed: categoryCompleted.length,
        failed: categoryFailed.length,
        averageTime: categoryAverageTime
      }
    })

    return stats
  }

  // Listen to progress updates
  onProgressUpdate(itemId: string, callback: (item: ProgressItem) => void): () => void {
    if (!this.listeners.has(itemId)) {
      this.listeners.set(itemId, new Set())
    }
    this.listeners.get(itemId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const itemListeners = this.listeners.get(itemId)
      if (itemListeners) {
        itemListeners.delete(callback)
        if (itemListeners.size === 0) {
          this.listeners.delete(itemId)
        }
      }
    }
  }

  // Listen to group updates
  onGroupUpdate(groupId: string, callback: (group: ProgressGroup) => void): () => void {
    if (!this.groupListeners.has(groupId)) {
      this.groupListeners.set(groupId, new Set())
    }
    this.groupListeners.get(groupId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const groupListeners = this.groupListeners.get(groupId)
      if (groupListeners) {
        groupListeners.delete(callback)
        if (groupListeners.size === 0) {
          this.groupListeners.delete(groupId)
        }
      }
    }
  }

  // Listen to notifications
  onNotification(callback: (notification: ProgressNotification) => void): () => void {
    this.notificationListeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.notificationListeners.delete(callback)
    }
  }

  // Private helper methods
  private calculateGroupStatus(items: ProgressItem[]): ProgressItem['status'] {
    if (items.length === 0) return 'pending'
    
    const hasRunning = items.some(i => i.status === 'running')
    const hasPaused = items.some(i => i.status === 'paused')
    const hasFailed = items.some(i => i.status === 'failed')
    const hasCancelled = items.some(i => i.status === 'cancelled')
    const allCompleted = items.every(i => i.status === 'completed')

    if (hasFailed) return 'failed'
    if (hasCancelled) return 'cancelled'
    if (hasRunning) return 'running'
    if (hasPaused) return 'paused'
    if (allCompleted) return 'completed'
    return 'pending'
  }

  private calculateGroupProgress(items: ProgressItem[]): number {
    if (items.length === 0) return 0
    
    const totalProgress = items.reduce((sum, item) => sum + item.progress, 0)
    return Math.round(totalProgress / items.length)
  }

  private updateAssociatedGroups(item: ProgressItem): void {
    this.groups.forEach(group => {
      if (group.items.some(i => i.id === item.id)) {
        group.status = this.calculateGroupStatus(group.items)
        group.progress = this.calculateGroupProgress(group.items)
        group.updatedAt = new Date()
        this.notifyGroupListeners(group)
      }
    })
  }

  private notifyListeners(item: ProgressItem): void {
    const listeners = this.listeners.get(item.id)
    if (listeners) {
      listeners.forEach(callback => callback(item))
    }
  }

  private notifyGroupListeners(group: ProgressGroup): void {
    const listeners = this.groupListeners.get(group.id)
    if (listeners) {
      listeners.forEach(callback => callback(group))
    }
  }

  private createNotification(
    type: ProgressNotification['type'],
    itemId: string,
    title: string,
    message: string
  ): void {
    const notification: ProgressNotification = {
      id: crypto.randomUUID(),
      type,
      itemId,
      title,
      message,
      timestamp: new Date(),
      isRead: false
    }

    this.notifications.set(notification.id, notification)
    this.notificationListeners.forEach(callback => callback(notification))
  }

  private cleanupOldItems(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Remove completed items older than 24 hours
    for (const [id, item] of this.items) {
      if ((item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') && 
          item.startTime < oneDayAgo) {
        this.items.delete(id)
        this.listeners.delete(id)
      }
    }

    // Remove old notifications
    for (const [id, notification] of this.notifications) {
      if (notification.timestamp < oneDayAgo) {
        this.notifications.delete(id)
      }
    }

    // Clean up empty groups
    for (const [id, group] of this.groups) {
      if (group.items.length === 0 && group.updatedAt < oneDayAgo) {
        this.groups.delete(id)
        this.groupListeners.delete(id)
      }
    }
  }

  // Cleanup
  destroy(): void {
    if (this.autoCleanupInterval) {
      clearInterval(this.autoCleanupInterval)
    }
    this.items.clear()
    this.groups.clear()
    this.notifications.clear()
    this.listeners.clear()
    this.groupListeners.clear()
    this.notificationListeners.clear()
  }
}

// Export singleton instance
export const progressManager = new ProgressManager()