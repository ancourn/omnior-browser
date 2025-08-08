"use client"

import { useState, useEffect, useCallback } from 'react'
import { ClipboardItem, ClipboardService, ClipboardSettings } from '@/lib/clipboard/clipboard-service'

export function useClipboard() {
  const [items, setItems] = useState<ClipboardItem[]>([])
  const [settings, setSettings] = useState<ClipboardSettings>(ClipboardService.getInstance().getSettings())
  const [isLoading, setIsLoading] = useState(true)

  const service = ClipboardService.getInstance()

  const refreshItems = useCallback(() => {
    setItems(service.getItems())
    setIsLoading(false)
  }, [service])

  const addItem = useCallback(async (content: string, type?: 'text' | 'link' | 'image' | 'code') => {
    const item = await service.addItem(content, type)
    refreshItems()
    return item
  }, [service, refreshItems])

  const updateItem = useCallback((id: string, updates: Partial<ClipboardItem>) => {
    const success = service.updateItem(id, updates)
    if (success) {
      refreshItems()
    }
    return success
  }, [service, refreshItems])

  const deleteItem = useCallback((id: string) => {
    const success = service.deleteItem(id)
    if (success) {
      refreshItems()
    }
    return success
  }, [service, refreshItems])

  const clearAll = useCallback(() => {
    service.clearAll()
    refreshItems()
  }, [service, refreshItems])

  const searchItems = useCallback((query: string) => {
    return service.searchItems(query)
  }, [service])

  const updateSettings = useCallback((newSettings: Partial<ClipboardSettings>) => {
    service.updateSettings(newSettings)
    setSettings(service.getSettings())
    refreshItems()
  }, [service, refreshItems])

  const exportData = useCallback(() => {
    return service.exportData()
  }, [service])

  const importData = useCallback((data: string) => {
    const success = service.importData(data)
    if (success) {
      refreshItems()
    }
    return success
  }, [service, refreshItems])

  const startMonitoring = useCallback(() => {
    service.startMonitoring()
  }, [service])

  const stopMonitoring = useCallback(() => {
    service.stopMonitoring()
  }, [service])

  // Initialize items
  useEffect(() => {
    refreshItems()
  }, [refreshItems])

  // Start monitoring when component mounts
  useEffect(() => {
    startMonitoring()
    return () => stopMonitoring()
  }, [startMonitoring, stopMonitoring])

  return {
    items,
    settings,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    searchItems,
    updateSettings,
    exportData,
    importData,
    startMonitoring,
    stopMonitoring,
    refreshItems
  }
}