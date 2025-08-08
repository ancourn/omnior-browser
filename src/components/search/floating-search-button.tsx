'use client'

import React, { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKeyboardShortcutArray } from '@/hooks/use-keyboard-shortcut'
import { AdvancedSearchPanel } from './advanced-search-panel'

export function FloatingSearchButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Handle Windows/Linux keyboard shortcut
  useKeyboardShortcutArray({
    keys: ['Control', 'Shift', 'F'],
    onPressed: () => {
      setIsPanelOpen(true)
    },
    preventDefault: true
  })

  // Handle Mac keyboard shortcut
  useKeyboardShortcutArray({
    keys: ['Meta', 'Shift', 'F'],
    onPressed: () => {
      setIsPanelOpen(true)
    },
    preventDefault: true
  })

  const handleClose = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  return (
    <>
      {/* Floating Search Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setIsPanelOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        >
          <Search className="h-6 w-6" />
        </Button>
        
        {/* Keyboard Shortcut Hint */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded-md px-2 py-1 shadow-md">
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </Badge>
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              Shift
            </Badge>
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              F
            </Badge>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-background border-r border-b border-border" />
        </div>
      </div>

      {/* Advanced Search Panel */}
      <AdvancedSearchPanel
        isOpen={isPanelOpen}
        onClose={handleClose}
      />
    </>
  )
}