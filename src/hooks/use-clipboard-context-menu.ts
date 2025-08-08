'use client'

import { useState, useCallback, useEffect } from 'react'

interface UseClipboardContextMenuReturn {
  showContextMenu: (event: React.MouseEvent, element: HTMLElement) => void
  contextMenuState: {
    isOpen: boolean
    position: { x: number; y: number }
    targetElement: HTMLElement | null
  }
  hideContextMenu: () => void
  handlePasteItem: (content: string) => void
}

export function useClipboardContextMenu(): UseClipboardContextMenuReturn {
  const [contextMenuState, setContextMenuState] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetElement: null as HTMLElement | null,
  })

  const showContextMenu = useCallback((event: React.MouseEvent, element: HTMLElement) => {
    event.preventDefault()
    event.stopPropagation()
    
    setContextMenuState({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      targetElement: element,
    })
  }, [])

  const hideContextMenu = useCallback(() => {
    setContextMenuState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handlePasteItem = useCallback((content: string) => {
    const targetElement = contextMenuState.targetElement
    
    if (targetElement) {
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
        const inputElement = targetElement as HTMLInputElement | HTMLTextAreaElement
        
        // Get current selection or cursor position
        const start = inputElement.selectionStart || 0
        const end = inputElement.selectionEnd || 0
        const currentValue = inputElement.value
        
        // Insert the content at the cursor position or replace selection
        const newValue = 
          currentValue.substring(0, start) + 
          content + 
          currentValue.substring(end)
        
        // Update the element value
        inputElement.value = newValue
        
        // Set cursor position after the inserted content
        const newCursorPos = start + content.length
        inputElement.setSelectionRange(newCursorPos, newCursorPos)
        
        // Trigger input event to notify React of the change
        const inputEvent = new Event('input', { bubbles: true })
        inputElement.dispatchEvent(inputEvent)
        
        // Focus the element
        inputElement.focus()
      } else if (targetElement.isContentEditable) {
        // Handle contenteditable elements
        const selection = window.getSelection()
        if (selection) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          
          const textNode = document.createTextNode(content)
          range.insertNode(textNode)
          
          // Move cursor after the inserted content
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }
  }, [contextMenuState.targetElement])

  // Add global event listeners to close context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenuState.isOpen) {
        hideContextMenu()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contextMenuState.isOpen) {
        hideContextMenu()
      }
    }

    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [contextMenuState.isOpen, hideContextMenu])

  return {
    showContextMenu,
    contextMenuState,
    hideContextMenu,
    handlePasteItem,
  }
}

// Hook to add context menu functionality to text inputs and textareas
export function useClipboardContextMenuAttachment() {
  const { showContextMenu, hideContextMenu, handlePasteItem, contextMenuState } = useClipboardContextMenu()

  const attachContextMenu = useCallback((element: HTMLElement) => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      
      // Check if it's a text input, textarea, or contenteditable element
      if (
        element.tagName === 'INPUT' && 
        (element as HTMLInputElement).type === 'text'
      ) {
        showContextMenu(event as unknown as React.MouseEvent, element)
      } else if (element.tagName === 'TEXTAREA') {
        showContextMenu(event as unknown as React.MouseEvent, element)
      } else if (element.isContentEditable) {
        showContextMenu(event as unknown as React.MouseEvent, element)
      }
    }

    element.addEventListener('contextmenu', handleContextMenu)

    return () => {
      element.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [showContextMenu])

  // Auto-attach to all text inputs and textareas
  useEffect(() => {
    const attachToElements = () => {
      const textInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
      
      textInputs.forEach(element => {
        attachContextMenu(element as HTMLElement)
      })
    }

    // Initial attachment
    attachToElements()

    // Use MutationObserver to watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            
            // Check if the added element or its children match our criteria
            if (
              (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
              element.tagName === 'TEXTAREA' ||
              element.isContentEditable
            ) {
              attachContextMenu(element)
            }
            
            // Check children
            const textInputs = element.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
            textInputs.forEach(child => {
              attachContextMenu(child as HTMLElement)
            })
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [attachContextMenu])

  return {
    contextMenuState,
    hideContextMenu,
    handlePasteItem,
  }
}