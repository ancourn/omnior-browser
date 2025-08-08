"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clipboard, Settings } from "lucide-react"
import { ClipboardManager } from "./clipboard-manager"
import { ClipboardSettings } from "./clipboard-settings"
import { useClipboard } from "@/hooks/use-clipboard"
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut"

interface ClipboardToolbarProps {
  onItemClick?: () => void
}

export function ClipboardToolbar({ onItemClick }: ClipboardToolbarProps) {
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { items, settings } = useClipboard()

  // Keyboard shortcut to open clipboard manager
  useKeyboardShortcut({
    shortcut: settings.keyboardShortcut,
    onPressed: () => setIsManagerOpen(true),
    disabled: isManagerOpen
  })

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsManagerOpen(true)}
          className="relative"
          title={`Open Clipboard Manager (${settings.keyboardShortcut})`}
        >
          <Clipboard className="h-4 w-4" />
          {items.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {items.length}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsSettingsOpen(true)}
          title="Clipboard Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <ClipboardManager 
        isOpen={isManagerOpen} 
        onClose={() => setIsManagerOpen(false)} 
      />

      <ClipboardSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
}