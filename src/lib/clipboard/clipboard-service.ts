export interface ClipboardItem {
  id: string
  type: 'text' | 'link' | 'image' | 'code'
  content: string
  preview?: string
  title?: string
  isPinned: boolean
  isEncrypted: boolean
  createdAt: string
  updatedAt: string
}

export interface ClipboardSettings {
  maxItems: number
  autoDeleteDays: number
  encryptData: boolean
  captureImages: boolean
  captureCode: boolean
  showNotifications: boolean
  keyboardShortcut: string
}

export class ClipboardService {
  private static instance: ClipboardService
  private items: ClipboardItem[] = []
  private settings: ClipboardSettings = {
    maxItems: 100,
    autoDeleteDays: 30,
    encryptData: false,
    captureImages: true,
    captureCode: true,
    showNotifications: true,
    keyboardShortcut: 'Ctrl+Shift+C'
  }
  private isMonitoring = false
  private lastContent = ''

  private constructor() {
    this.loadSettings()
    this.loadItems()
  }

  static getInstance(): ClipboardService {
    if (!ClipboardService.instance) {
      ClipboardService.instance = new ClipboardService()
    }
    return ClipboardService.instance
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('clipboardSettings')
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Failed to load clipboard settings:', error)
    }
  }

  private loadItems(): void {
    try {
      const saved = localStorage.getItem('clipboardItems')
      if (saved) {
        this.items = JSON.parse(saved)
        this.cleanupOldItems()
      }
    } catch (error) {
      console.error('Failed to load clipboard items:', error)
      this.items = []
    }
  }

  private saveItems(): void {
    try {
      localStorage.setItem('clipboardItems', JSON.stringify(this.items))
    } catch (error) {
      console.error('Failed to save clipboard items:', error)
    }
  }

  private cleanupOldItems(): void {
    if (this.settings.autoDeleteDays > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.settings.autoDeleteDays)
      
      this.items = this.items.filter(item => 
        new Date(item.createdAt) > cutoffDate || item.isPinned
      )
    }
  }

  private generateTitle(content: string, type: string): string {
    if (type === 'link') {
      try {
        const url = new URL(content)
        return url.hostname
      } catch {
        return content.length > 50 ? content.substring(0, 50) + '...' : content
      }
    }
    
    if (type === 'code') {
      const lines = content.split('\n')
      return lines[0]?.substring(0, 50) || 'Code snippet'
    }
    
    return content.length > 50 ? content.substring(0, 50) + '...' : content
  }

  private detectType(content: string): 'text' | 'link' | 'image' | 'code' {
    // Check if it's a URL
    try {
      new URL(content)
      return 'link'
    } catch {
      // Not a URL
    }

    // Check if it's code (contains common code patterns)
    const codePatterns = [
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /if\s*\(/,
      /for\s*\(/,
      /while\s*\(/,
      /class\s+\w+/,
      /import\s+.*from/,
      /export\s+/,
      /return\s+/,
      /console\./,
      /document\./,
      /window\./
    ]

    if (codePatterns.some(pattern => pattern.test(content))) {
      return 'code'
    }

    // Default to text
    return 'text'
  }

  private async createImagePreview(content: string): Promise<string> {
    // In a real implementation, this would create a thumbnail
    // For now, we'll return a placeholder
    return ''
  }

  private async createCodePreview(content: string): Promise<string> {
    // In a real implementation, this would create a syntax-highlighted preview
    // For now, we'll return the first few lines
    const lines = content.split('\n').slice(0, 5)
    return lines.join('\n')
  }

  public async addItem(content: string, type?: 'text' | 'link' | 'image' | 'code'): Promise<ClipboardItem> {
    // Don't add duplicate content
    if (content === this.lastContent) {
      return this.items[0]
    }

    this.lastContent = content

    const detectedType = type || this.detectType(content)
    const newItem: ClipboardItem = {
      id: crypto.randomUUID(),
      type: detectedType,
      content,
      title: this.generateTitle(content, detectedType),
      isPinned: false,
      isEncrypted: this.settings.encryptData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add preview for specific types
    if (detectedType === 'image') {
      newItem.preview = await this.createImagePreview(content)
    } else if (detectedType === 'code') {
      newItem.preview = await this.createCodePreview(content)
    }

    // Add to beginning of array
    this.items.unshift(newItem)

    // Enforce max items limit
    if (this.items.length > this.settings.maxItems) {
      // Keep pinned items and remove oldest unpinned items
      const pinnedItems = this.items.filter(item => item.isPinned)
      const unpinnedItems = this.items.filter(item => !item.isPinned)
      
      if (unpinnedItems.length > this.settings.maxItems - pinnedItems.length) {
        unpinnedItems.splice(this.settings.maxItems - pinnedItems.length)
        this.items = [...pinnedItems, ...unpinnedItems]
      }
    }

    this.saveItems()
    this.showNotification('Item added to clipboard', newItem.title || 'New item')

    return newItem
  }

  public getItems(): ClipboardItem[] {
    return [...this.items]
  }

  public searchItems(query: string): ClipboardItem[] {
    const lowercaseQuery = query.toLowerCase()
    return this.items.filter(item =>
      item.content.toLowerCase().includes(lowercaseQuery) ||
      item.title?.toLowerCase().includes(lowercaseQuery)
    )
  }

  public getItem(id: string): ClipboardItem | undefined {
    return this.items.find(item => item.id === id)
  }

  public updateItem(id: string, updates: Partial<ClipboardItem>): boolean {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items[index] = { 
        ...this.items[index], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      }
      this.saveItems()
      return true
    }
    return false
  }

  public deleteItem(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
      this.saveItems()
      return true
    }
    return false
  }

  public clearAll(): void {
    this.items = []
    this.saveItems()
    this.showNotification('Clipboard cleared', 'All items have been removed')
  }

  public getSettings(): ClipboardSettings {
    return { ...this.settings }
  }

  public updateSettings(newSettings: Partial<ClipboardSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    localStorage.setItem('clipboardSettings', JSON.stringify(this.settings))
    
    // Apply new settings
    if (newSettings.maxItems !== undefined) {
      this.enforceMaxItems()
    }
    if (newSettings.autoDeleteDays !== undefined) {
      this.cleanupOldItems()
    }
  }

  private enforceMaxItems(): void {
    if (this.items.length > this.settings.maxItems) {
      const pinnedItems = this.items.filter(item => item.isPinned)
      const unpinnedItems = this.items.filter(item => !item.isPinned)
      
      if (unpinnedItems.length > this.settings.maxItems - pinnedItems.length) {
        unpinnedItems.splice(this.settings.maxItems - pinnedItems.length)
        this.items = [...pinnedItems, ...unpinnedItems]
        this.saveItems()
      }
    }
  }

  public exportData(): string {
    return JSON.stringify({
      items: this.items,
      settings: this.settings,
      exported_at: new Date().toISOString()
    }, null, 2)
  }

  public importData(data: string): boolean {
    try {
      const imported = JSON.parse(data)
      if (imported.items && Array.isArray(imported.items)) {
        this.items = imported.items
        this.saveItems()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import clipboard data:', error)
      return false
    }
  }

  private showNotification(title: string, message?: string): void {
    if (this.settings.showNotifications) {
      // In a real implementation, this would show a system notification
      console.log(`Notification: ${title} - ${message}`)
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    
    // Monitor clipboard changes
    setInterval(async () => {
      try {
        const clipboardItems = await navigator.clipboard.read()
        for (const item of clipboardItems) {
          if (item.types.includes('text/plain')) {
            const text = await item.getType('text/plain')
            const content = await text.text()
            
            if (content && content.trim()) {
              await this.addItem(content)
            }
          }
        }
      } catch (error) {
        // Ignore permission errors - they're normal when clipboard is not accessible
        if (error instanceof Error && !error.message.includes('NotAllowedError')) {
          console.error('Clipboard monitoring error:', error)
        }
      }
    }, 1000) // Check every second
  }

  public stopMonitoring(): void {
    this.isMonitoring = false
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring
  }
}