'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clipboard, 
  Search, 
  Copy, 
  Pin, 
  PinOff, 
  Trash2, 
  Clock,
  Type,
  Link,
  Image as ImageIcon,
  Code,
  Check,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useClipboard } from '@/hooks/use-clipboard'
import type { ClipboardItem } from '@/lib/clipboard/clipboard-service'

interface ClipboardContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  onSelectItem: (content: string) => void
  targetElement?: HTMLElement | null
}

export default function ClipboardContextMenu({ 
  isOpen, 
  position, 
  onClose, 
  onSelectItem,
  targetElement 
}: ClipboardContextMenuProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { items, deleteItem, updateItem, isLoading } = useClipboard()
  const { toast } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredItems = items.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pinnedItems = filteredItems.filter(item => item.isPinned)
  const unpinnedItems = filteredItems.filter(item => !item.isPinned)

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied to clipboard",
        description: "Item has been copied to your clipboard"
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy item to clipboard",
        variant: "destructive"
      })
    }
  }

  const togglePin = (id: string) => {
    const item = items.find(item => item.id === id)
    if (item) {
      updateItem(id, { isPinned: !item.isPinned })
    }
  }

  const handleSelectItem = (content: string) => {
    onSelectItem(content)
    onClose()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />
      case 'link': return <Link className="h-4 w-4" />
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'code': return <Code className="h-4 w-4" />
      default: return <Clipboard className="h-4 w-4" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const renderContent = (item: ClipboardItem) => {
    switch (item.type) {
      case 'text':
        return (
          <div className="p-2 bg-muted rounded text-xs">
            <p className="break-words line-clamp-2">{item.content}</p>
          </div>
        )
      case 'link':
        return (
          <div className="p-2 bg-muted rounded text-xs">
            <a href={item.content} target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:text-blue-800 break-words line-clamp-2">
              {item.content}
            </a>
          </div>
        )
      case 'code':
        return (
          <div className="p-2 bg-muted rounded font-mono text-xs overflow-x-auto">
            <pre className="line-clamp-2">{item.content}</pre>
          </div>
        )
      case 'image':
        return (
          <div className="p-2 bg-muted rounded">
            {item.preview ? (
              <img src={item.preview} alt="Clipboard image" className="max-w-full h-12 object-cover rounded" />
            ) : (
              <div className="flex items-center justify-center h-8 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        )
      default:
        return <div className="p-2 bg-muted rounded text-xs line-clamp-2">{item.content}</div>
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  // Position menu within viewport
  const getMenuPosition = () => {
    if (!menuRef.current) return { top: position.y, left: position.x }

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = position.x
    let top = position.y

    // Adjust horizontal position if menu would go off-screen
    if (left + menuRect.width > viewportWidth) {
      left = position.x - menuRect.width
    }

    // Adjust vertical position if menu would go off-screen
    if (top + menuRect.height > viewportHeight) {
      top = position.y - menuRect.height
    }

    return { top, left }
  }

  if (!isOpen) return null

  const menuPosition = getMenuPosition()

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border rounded-lg shadow-lg w-80"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      <div className="flex flex-col max-h-96">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span className="text-sm font-semibold">Paste from Clipboard</span>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search clipboard items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-16">
                <p className="text-xs text-muted-foreground">No items found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pinned Items */}
                {pinnedItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Pinned</h4>
                    <div className="space-y-1">
                      {pinnedItems.map((item) => (
                        <Card key={item.id} className="border-primary/20 p-2 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              className="flex items-start gap-1 flex-1 min-w-0"
                              onClick={() => handleSelectItem(item.content)}
                            >
                              {getTypeIcon(item.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {item.title || 'Untitled'}
                                </div>
                                {renderContent(item)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePin(item.id)
                                }}
                              >
                                <Pin className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(item.content)
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-green-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectItem(item.content)
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-2 w-2" />
                              {formatTime(item.createdAt)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unpinned Items */}
                {unpinnedItems.length > 0 && (
                  <div>
                    {pinnedItems.length > 0 && <Separator className="my-2" />}
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Recent</h4>
                    <div className="space-y-1">
                      {unpinnedItems.map((item) => (
                        <Card key={item.id} className="p-2 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-start justify-between gap-2">
                            <div 
                              className="flex items-start gap-1 flex-1 min-w-0"
                              onClick={() => handleSelectItem(item.content)}
                            >
                              {getTypeIcon(item.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {item.title || 'Untitled'}
                                </div>
                                {renderContent(item)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  togglePin(item.id)
                                }}
                              >
                                <PinOff className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(item.content)
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-green-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectItem(item.content)
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-2 w-2" />
                              {formatTime(item.createdAt)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}