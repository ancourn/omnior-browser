"use client"

import { useEffect } from "react"

interface KeyboardShortcutProps {
  shortcut: string
  onPressed: () => void
  disabled?: boolean
}

interface KeyboardShortcutArrayProps {
  keys: string[]
  onPressed: () => void
  disabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut({ shortcut, onPressed, disabled = false }: KeyboardShortcutProps) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Normalize the shortcut to lowercase for comparison
      const normalizedShortcut = shortcut.toLowerCase()
      
      // Parse the shortcut
      const parts = normalizedShortcut.split('+')
      const key = parts[parts.length - 1]
      const modifiers = parts.slice(0, -1)

      // Check if the key matches
      if (event.key.toLowerCase() !== key) return

      // Check modifiers
      const ctrlPressed = modifiers.includes('ctrl')
      const shiftPressed = modifiers.includes('shift')
      const altPressed = modifiers.includes('alt')
      const metaPressed = modifiers.includes('meta') // Command key on Mac

      // Verify all required modifiers are pressed
      if (
        (ctrlPressed && !event.ctrlKey) ||
        (shiftPressed && !event.shiftKey) ||
        (altPressed && !event.altKey) ||
        (metaPressed && !event.metaKey)
      ) {
        return
      }

      // Prevent default behavior
      event.preventDefault()
      event.stopPropagation()

      // Execute the callback
      onPressed()
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcut, onPressed, disabled])
}

export function useKeyboardShortcutArray({ keys, onPressed, disabled = false, preventDefault = true }: KeyboardShortcutArrayProps) {
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if all required keys are pressed
      const ctrlRequired = keys.includes('Control')
      const shiftRequired = keys.includes('Shift')
      const altRequired = keys.includes('Alt')
      const metaRequired = keys.includes('Meta')
      
      // Find the main key (non-modifier)
      const mainKey = keys.find(key => 
        !['Control', 'Shift', 'Alt', 'Meta'].includes(key)
      )

      // Check if the main key matches
      if (!mainKey || event.key !== mainKey) return

      // Check modifiers
      if (
        (ctrlRequired && !event.ctrlKey) ||
        (shiftRequired && !event.shiftKey) ||
        (altRequired && !event.altKey) ||
        (metaRequired && !event.metaKey)
      ) {
        return
      }

      // Prevent default behavior if requested
      if (preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Execute the callback
      onPressed()
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [keys, onPressed, disabled, preventDefault])
}