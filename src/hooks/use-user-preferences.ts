'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { UserPreferences, UserPreferenceUpdate } from '@/lib/user/user-preferences-service'

export function useUserPreferences() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load preferences when session changes
  useEffect(() => {
    if (session?.user?.id) {
      loadPreferences()
    } else {
      setPreferences(null)
      setIsLoading(false)
    }
  }, [session])

  const loadPreferences = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/preferences')
      if (!response.ok) {
        throw new Error('Failed to load preferences')
      }

      const data = await response.json()
      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error loading preferences:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const updatePreferences = useCallback(async (updates: UserPreferenceUpdate) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const updatedPreferences = await response.json()
      setPreferences(updatedPreferences)
      return updatedPreferences
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error updating preferences:', err)
      throw err
    }
  }, [session?.user?.id])

  const resetPreferences = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to reset preferences')
      }

      await loadPreferences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error resetting preferences:', err)
      throw err
    }
  }, [session?.user?.id, loadPreferences])

  const exportPreferences = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/preferences/export')
      if (!response.ok) {
        throw new Error('Failed to export preferences')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `omnior-preferences-${session.user.id}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error exporting preferences:', err)
      throw err
    }
  }, [session?.user?.id])

  const importPreferences = useCallback(async (file: File) => {
    if (!session?.user?.id) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/preferences/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to import preferences')
      }

      const importedPreferences = await response.json()
      setPreferences(importedPreferences)
      return importedPreferences
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error importing preferences:', err)
      throw err
    }
  }, [session?.user?.id])

  // Helper methods for specific preference sections
  const updateTheme = useCallback((theme: UserPreferences['theme']) => {
    return updatePreferences({ theme })
  }, [updatePreferences])

  const updateSearchPreferences = useCallback((updates: Partial<UserPreferences['searchPreferences']>) => {
    return updatePreferences({ searchPreferences: updates })
  }, [updatePreferences])

  const updateCollaborationPreferences = useCallback((updates: Partial<UserPreferences['collaborationPreferences']>) => {
    return updatePreferences({ collaborationPreferences: updates })
  }, [updatePreferences])

  const updateAIPreferences = useCallback((updates: Partial<UserPreferences['aiPreferences']>) => {
    return updatePreferences({ aiPreferences: updates })
  }, [updatePreferences])

  const updateContentAnalysisPreferences = useCallback((updates: Partial<UserPreferences['contentAnalysisPreferences']>) => {
    return updatePreferences({ contentAnalysisPreferences: updates })
  }, [updatePreferences])

  const updateInterfacePreferences = useCallback((updates: Partial<UserPreferences['interfacePreferences']>) => {
    return updatePreferences({ interfacePreferences: updates })
  }, [updatePreferences])

  const updatePrivacySettings = useCallback((updates: Partial<UserPreferences['privacySettings']>) => {
    return updatePreferences({ privacySettings: updates })
  }, [updatePreferences])

  const updateSecuritySettings = useCallback((updates: Partial<UserPreferences['securitySettings']>) => {
    return updatePreferences({ securitySettings: updates })
  }, [updatePreferences])

  const updateNotificationSettings = useCallback((updates: Partial<UserPreferences['notificationSettings']>) => {
    return updatePreferences({ notificationSettings: updates })
  }, [updatePreferences])

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    exportPreferences,
    importPreferences,
    updateTheme,
    updateSearchPreferences,
    updateCollaborationPreferences,
    updateAIPreferences,
    updateContentAnalysisPreferences,
    updateInterfacePreferences,
    updatePrivacySettings,
    updateSecuritySettings,
    updateNotificationSettings,
    refetch: loadPreferences
  }
}