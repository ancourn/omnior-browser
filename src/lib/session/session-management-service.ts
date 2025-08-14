"use server"

import { db } from "@/lib/db"

export interface BrowserSession {
  id: string
  userId: string
  name: string
  tabs: SessionTab[]
  activeTabId?: string
  windowState: {
    width: number
    height: number
    x: number
    y: number
    isMaximized: boolean
    isFullscreen: boolean
  }
  createdAt: Date
  updatedAt: Date
  lastAccessed: Date
  isPinned: boolean
  isArchived: boolean
  metadata?: {
    totalTabs: number
    privateTabs: number
    memoryUsage: number
    tags: string[]
  }
}

export interface SessionTab {
  id: string
  sessionId: string
  url: string
  title: string
  favicon?: string
  isActive: boolean
  isPinned: boolean
  isPrivate: boolean
  isLoading: boolean
  statusCode?: number
  lastAccessed: Date
  createdAt: Date
  thumbnail?: string
  position: number
  metadata?: {
    scrollPosition: number
    zoomLevel: number
    formFields: Record<string, any>
    sessionStorage: Record<string, any>
  }
}

export interface SessionGroup {
  id: string
  userId: string
  name: string
  color: string
  sessionIds: string[]
  createdAt: Date
  updatedAt: Date
  isExpanded: boolean
}

export interface SessionRule {
  id: string
  userId: string
  name: string
  conditions: SessionRuleCondition[]
  actions: SessionRuleAction[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SessionRuleCondition {
  field: 'url' | 'title' | 'domain' | 'time' | 'tabCount'
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'greaterThan' | 'lessThan'
  value: string | number
}

export interface SessionRuleAction {
  type: 'archive' | 'pin' | 'group' | 'close' | 'notify' | 'bookmark'
  parameters?: Record<string, any>
}

class SessionManagementService {
  private activeSessions: Map<string, BrowserSession> = new Map()
  private sessionRules: Map<string, SessionRule> = new Map()
  private sessionGroups: Map<string, SessionGroup> = new Map()

  // Session CRUD operations
  async createSession(userId: string, options: {
    name?: string
    tabs?: Omit<SessionTab, 'id' | 'sessionId' | 'createdAt'>[]
    windowState?: Partial<BrowserSession['windowState']>
  } = {}): Promise<BrowserSession> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const session: BrowserSession = {
      id: sessionId,
      userId,
      name: options.name || `Session ${new Date().toLocaleString()}`,
      tabs: options.tabs?.map((tab, index) => ({
        ...tab,
        id: `tab-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        createdAt: new Date(),
        position: index
      })) || [],
      windowState: {
        width: 1024,
        height: 768,
        x: 0,
        y: 0,
        isMaximized: false,
        isFullscreen: false,
        ...options.windowState
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessed: new Date(),
      isPinned: false,
      isArchived: false,
      metadata: {
        totalTabs: options.tabs?.length || 0,
        privateTabs: options.tabs?.filter(t => t.isPrivate).length || 0,
        memoryUsage: 0,
        tags: []
      }
    }

    // Save to database
    await this.saveSessionToDatabase(session)
    
    // Cache in memory
    this.activeSessions.set(sessionId, session)

    return session
  }

  async getSession(sessionId: string): Promise<BrowserSession | null> {
    // Check memory cache first
    const cachedSession = this.activeSessions.get(sessionId)
    if (cachedSession) {
      return cachedSession
    }

    // Load from database
    try {
      const dbSession = await db.browserSession.findUnique({
        where: { id: sessionId },
        include: {
          tabs: {
            orderBy: { position: 'asc' }
          }
        }
      })

      if (!dbSession) {
        return null
      }

      const session: BrowserSession = {
        id: dbSession.id,
        userId: dbSession.userId,
        name: dbSession.name,
        tabs: dbSession.tabs.map(tab => ({
          id: tab.id,
          sessionId: tab.sessionId,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon || undefined,
          isActive: tab.isActive,
          isPinned: tab.isPinned,
          isPrivate: tab.isPrivate,
          isLoading: tab.isLoading,
          statusCode: tab.statusCode || undefined,
          lastAccessed: tab.lastAccessed,
          createdAt: tab.createdAt,
          thumbnail: tab.thumbnail || undefined,
          position: tab.position,
          metadata: tab.metadata ? JSON.parse(tab.metadata) : undefined
        })),
        activeTabId: dbSession.activeTabId || undefined,
        windowState: JSON.parse(dbSession.windowState),
        createdAt: dbSession.createdAt,
        updatedAt: dbSession.updatedAt,
        lastAccessed: dbSession.lastAccessed,
        isPinned: dbSession.isPinned,
        isArchived: dbSession.isArchived,
        metadata: dbSession.metadata ? JSON.parse(dbSession.metadata) : undefined
      }

      // Cache in memory
      this.activeSessions.set(sessionId, session)

      return session
    } catch (error) {
      console.error('Error loading session:', error)
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<BrowserSession>): Promise<BrowserSession> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
      metadata: {
        ...session.metadata,
        ...updates.metadata,
        totalTabs: updates.tabs?.length || session.tabs.length,
        privateTabs: updates.tabs?.filter(t => t.isPrivate).length || 
          session.tabs.filter(t => t.isPrivate).length
      }
    }

    // Update in database
    await this.saveSessionToDatabase(updatedSession)
    
    // Update cache
    this.activeSessions.set(sessionId, updatedSession)

    return updatedSession
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Remove from database
    await db.browserSession.delete({
      where: { id: sessionId }
    })

    // Remove from cache
    this.activeSessions.delete(sessionId)

    // Remove from groups
    this.sessionGroups.forEach(group => {
      group.sessionIds = group.sessionIds.filter(id => id !== sessionId)
    })
  }

  async getUserSessions(userId: string, options: {
    includeArchived?: boolean
    limit?: number
    offset?: number
  } = {}): Promise<BrowserSession[]> {
    const { includeArchived = false, limit = 50, offset = 0 } = options

    try {
      const dbSessions = await db.browserSession.findMany({
        where: {
          userId,
          isArchived: includeArchived ? undefined : false
        },
        include: {
          tabs: {
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { lastAccessed: 'desc' },
        limit,
        skip: offset
      })

      return dbSessions.map(dbSession => ({
        id: dbSession.id,
        userId: dbSession.userId,
        name: dbSession.name,
        tabs: dbSession.tabs.map(tab => ({
          id: tab.id,
          sessionId: tab.sessionId,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon || undefined,
          isActive: tab.isActive,
          isPinned: tab.isPinned,
          isPrivate: tab.isPrivate,
          isLoading: tab.isLoading,
          statusCode: tab.statusCode || undefined,
          lastAccessed: tab.lastAccessed,
          createdAt: tab.createdAt,
          thumbnail: tab.thumbnail || undefined,
          position: tab.position,
          metadata: tab.metadata ? JSON.parse(tab.metadata) : undefined
        })),
        activeTabId: dbSession.activeTabId || undefined,
        windowState: JSON.parse(dbSession.windowState),
        createdAt: dbSession.createdAt,
        updatedAt: dbSession.updatedAt,
        lastAccessed: dbSession.lastAccessed,
        isPinned: dbSession.isPinned,
        isArchived: dbSession.isArchived,
        metadata: dbSession.metadata ? JSON.parse(dbSession.metadata) : undefined
      }))
    } catch (error) {
      console.error('Error getting user sessions:', error)
      return []
    }
  }

  // Tab management
  async addTab(sessionId: string, tabData: Omit<SessionTab, 'id' | 'sessionId' | 'createdAt'>): Promise<SessionTab> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const tab: SessionTab = {
      ...tabData,
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      createdAt: new Date(),
      position: session.tabs.length
    }

    // Add to session
    session.tabs.push(tab)
    session.updatedAt = new Date()
    session.lastAccessed = new Date()

    // Update session
    await this.updateSession(sessionId, session)

    return tab
  }

  async updateTab(sessionId: string, tabId: string, updates: Partial<SessionTab>): Promise<SessionTab> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    const tabIndex = session.tabs.findIndex(tab => tab.id === tabId)
    if (tabIndex === -1) {
      throw new Error('Tab not found')
    }

    session.tabs[tabIndex] = {
      ...session.tabs[tabIndex],
      ...updates,
      lastAccessed: new Date()
    }

    session.updatedAt = new Date()
    session.lastAccessed = new Date()

    // Update session
    await this.updateSession(sessionId, session)

    return session.tabs[tabIndex]
  }

  async removeTab(sessionId: string, tabId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.tabs = session.tabs.filter(tab => tab.id !== tabId)
    session.updatedAt = new Date()
    session.lastAccessed = new Date()

    // Update session
    await this.updateSession(sessionId, session)

    // Remove tab from database
    await db.sessionTab.delete({
      where: { id: tabId }
    })
  }

  async setActiveTab(sessionId: string, tabId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Deactivate all tabs
    session.tabs.forEach(tab => {
      tab.isActive = false
    })

    // Activate specified tab
    const activeTab = session.tabs.find(tab => tab.id === tabId)
    if (!activeTab) {
      throw new Error('Tab not found')
    }

    activeTab.isActive = true
    session.activeTabId = tabId
    session.updatedAt = new Date()
    session.lastAccessed = new Date()

    // Update session
    await this.updateSession(sessionId, session)
  }

  // Session groups
  async createGroup(userId: string, name: string, color: string = '#3B82F6'): Promise<SessionGroup> {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const group: SessionGroup = {
      id: groupId,
      userId,
      name,
      color,
      sessionIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isExpanded: true
    }

    // Save to database
    await db.sessionGroup.create({
      data: {
        id: groupId,
        userId,
        name,
        color,
        sessionIds: JSON.stringify([]),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        isExpanded: group.isExpanded
      }
    })

    // Cache in memory
    this.sessionGroups.set(groupId, group)

    return group
  }

  async addSessionToGroup(groupId: string, sessionId: string): Promise<void> {
    const group = this.sessionGroups.get(groupId)
    if (!group) {
      throw new Error('Group not found')
    }

    if (!group.sessionIds.includes(sessionId)) {
      group.sessionIds.push(sessionId)
      group.updatedAt = new Date()

      // Update in database
      await db.sessionGroup.update({
        where: { id: groupId },
        data: {
          sessionIds: JSON.stringify(group.sessionIds),
          updatedAt: group.updatedAt
        }
      })
    }
  }

  async removeSessionFromGroup(groupId: string, sessionId: string): Promise<void> {
    const group = this.sessionGroups.get(groupId)
    if (!group) {
      throw new Error('Group not found')
    }

    group.sessionIds = group.sessionIds.filter(id => id !== sessionId)
    group.updatedAt = new Date()

    // Update in database
    await db.sessionGroup.update({
      where: { id: groupId },
      data: {
        sessionIds: JSON.stringify(group.sessionIds),
        updatedAt: group.updatedAt
      }
    })
  }

  // Session rules
  async createRule(userId: string, name: string, conditions: SessionRuleCondition[], actions: SessionRuleAction[]): Promise<SessionRule> {
    const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const rule: SessionRule = {
      id: ruleId,
      userId,
      name,
      conditions,
      actions,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to database
    await db.sessionRule.create({
      data: {
        id: ruleId,
        userId,
        name,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
        isActive: rule.isActive,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }
    })

    // Cache in memory
    this.sessionRules.set(ruleId, rule)

    return rule
  }

  async evaluateRules(session: BrowserSession): Promise<void> {
    const userRules = Array.from(this.sessionRules.values()).filter(rule => 
      rule.userId === session.userId && rule.isActive
    )

    for (const rule of userRules) {
      if (await this.evaluateRuleConditions(rule.conditions, session)) {
        await this.executeRuleActions(rule.actions, session)
      }
    }
  }

  private async evaluateRuleConditions(conditions: SessionRuleCondition[], session: BrowserSession): Promise<boolean> {
    // Simple condition evaluation (can be enhanced)
    for (const condition of conditions) {
      let matches = false

      switch (condition.field) {
        case 'tabCount':
          const tabCount = session.tabs.length
          if (condition.operator === 'greaterThan') {
            matches = tabCount > (condition.value as number)
          } else if (condition.operator === 'lessThan') {
            matches = tabCount < (condition.value as number)
          }
          break
        case 'url':
          // Check if any tab URL matches
          matches = session.tabs.some(tab => {
            const url = tab.url.toLowerCase()
            const value = (condition.value as string).toLowerCase()
            
            switch (condition.operator) {
              case 'contains':
                return url.includes(value)
              case 'equals':
                return url === value
              case 'startsWith':
                return url.startsWith(value)
              case 'endsWith':
                return url.endsWith(value)
              default:
                return false
            }
          })
          break
      }

      if (!matches) {
        return false
      }
    }

    return true
  }

  private async executeRuleActions(actions: SessionRuleAction[], session: BrowserSession): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'archive':
          await this.updateSession(session.id, { isArchived: true })
          break
        case 'pin':
          await this.updateSession(session.id, { isPinned: true })
          break
        case 'close':
          // Close tabs older than specified time
          if (action.parameters?.olderThan) {
            const olderThan = new Date(Date.now() - action.parameters.olderThan)
            const tabsToClose = session.tabs.filter(tab => tab.lastAccessed < olderThan)
            
            for (const tab of tabsToClose) {
              await this.removeTab(session.id, tab.id)
            }
          }
          break
        case 'notify':
          // Send notification (would integrate with notification system)
          console.log(`Session rule triggered: ${action.parameters?.message || 'Session rule action'}`)
          break
      }
    }
  }

  private async saveSessionToDatabase(session: BrowserSession): Promise<void> {
    await db.browserSession.upsert({
      where: { id: session.id },
      update: {
        name: session.name,
        activeTabId: session.activeTabId,
        windowState: JSON.stringify(session.windowState),
        lastAccessed: session.lastAccessed,
        isPinned: session.isPinned,
        isArchived: session.isArchived,
        metadata: JSON.stringify(session.metadata),
        updatedAt: session.updatedAt
      },
      create: {
        id: session.id,
        userId: session.userId,
        name: session.name,
        activeTabId: session.activeTabId,
        windowState: JSON.stringify(session.windowState),
        lastAccessed: session.lastAccessed,
        isPinned: session.isPinned,
        isArchived: session.isArchived,
        metadata: JSON.stringify(session.metadata),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    })

    // Save tabs
    for (const tab of session.tabs) {
      await db.sessionTab.upsert({
        where: { id: tab.id },
        update: {
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          isActive: tab.isActive,
          isPinned: tab.isPinned,
          isPrivate: tab.isPrivate,
          isLoading: tab.isLoading,
          statusCode: tab.statusCode,
          lastAccessed: tab.lastAccessed,
          thumbnail: tab.thumbnail,
          position: tab.position,
          metadata: JSON.stringify(tab.metadata)
        },
        create: {
          id: tab.id,
          sessionId: tab.sessionId,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          isActive: tab.isActive,
          isPinned: tab.isPinned,
          isPrivate: tab.isPrivate,
          isLoading: tab.isLoading,
          statusCode: tab.statusCode,
          lastAccessed: tab.lastAccessed,
          thumbnail: tab.thumbnail,
          position: tab.position,
          metadata: JSON.stringify(tab.metadata),
          createdAt: tab.createdAt
        }
      })
    }
  }

  // Cleanup and maintenance
  async cleanupOldSessions(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge)
    
    const result = await db.browserSession.deleteMany({
      where: {
        lastAccessed: { lt: cutoffDate },
        isPinned: false,
        isArchived: false
      }
    })

    // Clear from cache
    result.forEach(deletedSession => {
      this.activeSessions.delete(deletedSession.id)
    })

    return result.count
  }

  async getSessionStatistics(userId: string): Promise<{
    totalSessions: number
    activeSessions: number
    archivedSessions: number
    totalTabs: number
    privateTabs: number
    averageTabsPerSession: number
    oldestSession: Date | null
    newestSession: Date | null
  }> {
    const sessions = await this.getUserSessions(userId, { includeArchived: true })

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => !s.isArchived).length,
      archivedSessions: sessions.filter(s => s.isArchived).length,
      totalTabs: sessions.reduce((sum, s) => sum + s.tabs.length, 0),
      privateTabs: sessions.reduce((sum, s) => sum + s.tabs.filter(t => t.isPrivate).length, 0),
      averageTabsPerSession: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.tabs.length, 0) / sessions.length : 0,
      oldestSession: sessions.length > 0 ? new Date(Math.min(...sessions.map(s => s.createdAt.getTime()))) : null,
      newestSession: sessions.length > 0 ? new Date(Math.max(...sessions.map(s => s.createdAt.getTime()))) : null
    }
  }
}

// Export singleton instance
export const sessionManagementService = new SessionManagementService()