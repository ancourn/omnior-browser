/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AISearchInterface } from './ai-search-interface'

export function FloatingSearchButton() {
  const [isOpen, setIsOpen] = useState(false)

  // Handle keyboard shortcut (Ctrl/Cmd + K)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      {/* Floating Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-6 w-6" />
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">AI Search</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-0">
            <AISearchInterface onClose={() => setIsOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}