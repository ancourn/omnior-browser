"use server"

import { db } from "@/lib/db"

export interface UserPreferences {
  id?: string
  userId: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  fontSize: 'small' | 'medium' | 'large'
  privacyMode: 'standard' | 'strict' | 'custom'
  searchPreferences: {
    enableAIFiltering: boolean
    enableAICategorization: boolean
    enableAISummarization: boolean
    defaultSources: string[]
    maxResults: number
    excludePrivate: boolean
  }
  collaborationPreferences: {
    autoJoinSessions: boolean
    showPresence: boolean
    allowCursorSharing: boolean
    notificationSound: boolean
  }
  contentAnalysisPreferences: {
    defaultAnalysisType: 'summarize' | 'extract-keywords' | 'sentiment' | 'topics' | 'entities' | 'comprehensive'
    includeMetadata: boolean
    extractQuotes: boolean
    identifyTrends: boolean
    maxLength: number
  }
  aiPreferences: {
    processingMode: 'local' | 'hybrid' | 'cloud'
    autoSummarize: boolean
    suggestActions: boolean
    learningEnabled: boolean
  }
  interfacePreferences: {
    sidebarPosition: 'left' | 'right'
    panelWidth: number
    showStatusBar: boolean
    compactMode: boolean
    animationsEnabled: boolean
  }
  privacySettings: {
    collectAnalytics: boolean
    shareUsageData: boolean
    personalizedAds: boolean
    locationTracking: boolean
  }
  securitySettings: {
    sessionTimeout: number
    requireAuthForPrivate: boolean
    encryptSensitiveData: boolean
    twoFactorAuth: boolean
  }
  notificationSettings: {
    emailNotifications: boolean
    pushNotifications: boolean
    desktopNotifications: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  customSettings: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export interface UserPreferenceUpdate {
  theme?: UserPreferences['theme']
  language?: UserPreferences['language']
  timezone?: UserPreferences['timezone']
  fontSize?: UserPreferences['fontSize']
  privacyMode?: UserPreferences['privacyMode']
  searchPreferences?: Partial<UserPreferences['searchPreferences']>
  collaborationPreferences?: Partial<UserPreferences['collaborationPreferences']>
  contentAnalysisPreferences?: Partial<UserPreferences['contentAnalysisPreferences']>
  aiPreferences?: Partial<UserPreferences['aiPreferences']>
  interfacePreferences?: Partial<UserPreferences['interfacePreferences']>
  privacySettings?: Partial<UserPreferences['privacySettings']>
  securitySettings?: Partial<UserPreferences['securitySettings']>
  notificationSettings?: Partial<UserPreferences['notificationSettings']>
  customSettings?: Record<string, any>
}

class UserPreferencesService {
  private defaultPreferences: Omit<UserPreferences, 'userId' | 'id' | 'createdAt' | 'updatedAt'> = {
    theme: 'auto',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fontSize: 'medium',
    privacyMode: 'standard',
    searchPreferences: {
      enableAIFiltering: true,
      enableAICategorization: true,
      enableAISummarization: false,
      defaultSources: ['tabs', 'history', 'bookmarks', 'page-content'],
      maxResults: 50,
      excludePrivate: false
    },
    collaborationPreferences: {
      autoJoinSessions: false,
      showPresence: true,
      allowCursorSharing: true,
      notificationSound: true
    },
    contentAnalysisPreferences: {
      defaultAnalysisType: 'summarize',
      includeMetadata: true,
      extractQuotes: false,
      identifyTrends: false,
      maxLength: 200
    },
    aiPreferences: {
      processingMode: 'hybrid',
      autoSummarize: false,
      suggestActions: true,
      learningEnabled: true
    },
    interfacePreferences: {
      sidebarPosition: 'left',
      panelWidth: 384,
      showStatusBar: true,
      compactMode: false,
      animationsEnabled: true
    },
    privacySettings: {
      collectAnalytics: false,
      shareUsageData: false,
      personalizedAds: false,
      locationTracking: false
    },
    securitySettings: {
      sessionTimeout: 3600, // 1 hour
      requireAuthForPrivate: true,
      encryptSensitiveData: true,
      twoFactorAuth: false
    },
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: false,
      desktopNotifications: true,
      frequency: 'immediate'
    },
    customSettings: {}
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Try to get preferences from database
      let dbPreferences = await db.userPreferences.findUnique({
        where: { userId }
      })

      if (!dbPreferences) {
        // Create default preferences for new user
        dbPreferences = await this.createDefaultPreferences(userId)
      }

      // Merge with defaults to ensure all fields exist
      return this.mergeWithDefaults(dbPreferences, userId)
    } catch (error) {
      console.error('Error getting user preferences:', error)
      // Return default preferences if database fails
      return {
        userId,
        ...this.defaultPreferences
      }
    }
  }

  async updateUserPreferences(
    userId: string, 
    updates: UserPreferenceUpdate
  ): Promise<UserPreferences> {
    try {
      // Get current preferences
      const currentPrefs = await this.getUserPreferences(userId)
      
      // Merge updates with current preferences
      const updatedPrefs = this.mergePreferences(currentPrefs, updates)
      
      // Update in database
      await db.userPreferences.upsert({
        where: { userId },
        update: {
          ...updatedPrefs,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...updatedPrefs,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return updatedPrefs
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw new Error('Failed to update preferences')
    }
  }

  async resetUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const defaultPrefs = await this.createDefaultPreferences(userId)
      return this.mergeWithDefaults(defaultPrefs, userId)
    } catch (error) {
      console.error('Error resetting user preferences:', error)
      throw new Error('Failed to reset preferences')
    }
  }

  async exportUserPreferences(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId)
      return JSON.stringify(preferences, null, 2)
    } catch (error) {
      console.error('Error exporting user preferences:', error)
      throw new Error('Failed to export preferences')
    }
  }

  async importUserPreferences(
    userId: string, 
    preferencesData: string
  ): Promise<UserPreferences> {
    try {
      const importedPrefs = JSON.parse(preferencesData) as UserPreferences
      
      // Validate imported preferences
      if (!this.validatePreferences(importedPrefs)) {
        throw new Error('Invalid preferences data')
      }

      // Override userId and timestamps
      const validatedPrefs: UserPreferences = {
        ...importedPrefs,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to database
      await db.userPreferences.upsert({
        where: { userId },
        update: validatedPrefs,
        create: validatedPrefs
      })

      return validatedPrefs
    } catch (error) {
      console.error('Error importing user preferences:', error)
      throw new Error('Failed to import preferences')
    }
  }

  async deleteUserPreferences(userId: string): Promise<void> {
    try {
      await db.userPreferences.delete({
        where: { userId }
      })
    } catch (error) {
      console.error('Error deleting user preferences:', error)
      throw new Error('Failed to delete preferences')
    }
  }

  private async createDefaultPreferences(userId: string): Promise<any> {
    const defaultPrefs = {
      userId,
      ...this.defaultPreferences,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return await db.userPreferences.create({
      data: defaultPrefs
    })
  }

  private mergeWithDefaults(dbPreferences: any, userId: string): UserPreferences {
    const merged = { ...this.defaultPreferences }
    
    // Deep merge each section
    Object.keys(this.defaultPreferences).forEach(key => {
      const sectionKey = key as keyof typeof this.defaultPreferences
      
      if (typeof this.defaultPreferences[sectionKey] === 'object' && 
          this.defaultPreferences[sectionKey] !== null && 
          !Array.isArray(this.defaultPreferences[sectionKey])) {
        merged[sectionKey] = {
          ...this.defaultPreferences[sectionKey],
          ...(dbPreferences[sectionKey] || {})
        }
      } else {
        merged[sectionKey] = dbPreferences[sectionKey] ?? this.defaultPreferences[sectionKey]
      }
    })

    return {
      id: dbPreferences.id,
      userId,
      ...merged,
      createdAt: dbPreferences.createdAt,
      updatedAt: dbPreferences.updatedAt
    }
  }

  private mergePreferences(
    current: UserPreferences, 
    updates: UserPreferenceUpdate
  ): UserPreferences {
    const merged = { ...current }

    Object.keys(updates).forEach(key => {
      const updateKey = key as keyof UserPreferenceUpdate
      
      if (updates[updateKey] !== undefined) {
        if (typeof current[updateKey] === 'object' && 
            current[updateKey] !== null && 
            !Array.isArray(current[updateKey]) &&
            typeof updates[updateKey] === 'object' &&
            updates[updateKey] !== null) {
          // Deep merge objects
          merged[updateKey] = {
            ...current[updateKey],
            ...updates[updateKey]
          }
        } else {
          // Direct assignment
          merged[updateKey] = updates[updateKey] as any
        }
      }
    })

    return merged
  }

  private validatePreferences(preferences: any): boolean {
    try {
      // Basic validation
      if (!preferences || typeof preferences !== 'object') {
        return false
      }

      // Check required fields exist and have correct types
      const requiredFields = [
        'theme', 'language', 'timezone', 'fontSize', 'privacyMode',
        'searchPreferences', 'collaborationPreferences', 'contentAnalysisPreferences',
        'aiPreferences', 'interfacePreferences', 'privacySettings',
        'securitySettings', 'notificationSettings'
      ]

      for (const field of requiredFields) {
        if (!(field in preferences)) {
          return false
        }
      }

      // Validate specific field values
      const validThemes = ['light', 'dark', 'auto']
      const validFontSizes = ['small', 'medium', 'large']
      const validPrivacyModes = ['standard', 'strict', 'custom']

      if (!validThemes.includes(preferences.theme)) return false
      if (!validFontSizes.includes(preferences.fontSize)) return false
      if (!validPrivacyModes.includes(preferences.privacyMode)) return false

      return true
    } catch {
      return false
    }
  }

  // Helper methods for specific preference sections
  async getSearchPreferences(userId: string): Promise<UserPreferences['searchPreferences']> {
    const prefs = await this.getUserPreferences(userId)
    return prefs.searchPreferences
  }

  async updateSearchPreferences(
    userId: string, 
    updates: Partial<UserPreferences['searchPreferences']>
  ): Promise<void> {
    await this.updateUserPreferences(userId, { searchPreferences: updates })
  }

  async getCollaborationPreferences(userId: string): Promise<UserPreferences['collaborationPreferences']> {
    const prefs = await this.getUserPreferences(userId)
    return prefs.collaborationPreferences
  }

  async updateCollaborationPreferences(
    userId: string, 
    updates: Partial<UserPreferences['collaborationPreferences']>
  ): Promise<void> {
    await this.updateUserPreferences(userId, { collaborationPreferences: updates })
  }

  async getAIPreferences(userId: string): Promise<UserPreferences['aiPreferences']> {
    const prefs = await this.getUserPreferences(userId)
    return prefs.aiPreferences
  }

  async updateAIPreferences(
    userId: string, 
    updates: Partial<UserPreferences['aiPreferences']>
  ): Promise<void> {
    await this.updateUserPreferences(userId, { aiPreferences: updates })
  }

  async getThemePreference(userId: string): Promise<UserPreferences['theme']> {
    const prefs = await this.getUserPreferences(userId)
    return prefs.theme
  }

  async updateThemePreference(
    userId: string, 
    theme: UserPreferences['theme']
  ): Promise<void> {
    await this.updateUserPreferences(userId, { theme })
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService()