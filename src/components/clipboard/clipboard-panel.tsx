'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download, 
  Share2, 
  Clock,
  Type,
  Link,
  Image as ImageIcon,
  Code,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ChevronRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useClipboard } from '@/hooks/use-clipboard'
import type { ClipboardItem } from '@/lib/clipboard/clipboard-service'

interface ClipboardPanelProps {
  isExpanded: boolean
  onToggleExpand: () => void
  className?: string
}

export default function ClipboardPanel({ isExpanded, onToggleExpand, className }: ClipboardPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { items, settings, deleteItem, updateItem, exportData, isLoading } = useClipboard()
  const { toast } = useToast()

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

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipboard-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Export successful",
      description: "Clipboard items have been exported"
    })
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

  if (!isExpanded) {
    return (
      <div className={`border-l bg-background ${className}`}>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="w-full justify-start"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            <Clipboard className="h-4 w-4 mr-2" />
            <span className="text-xs">Clipboard</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {items.length}
            </Badge>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`border-l bg-background w-80 ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span className="text-sm font-semibold">Clipboard</span>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
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
                <p className="text-xs text-muted-foreground">No items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pinned Items */}
                {pinnedItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Pinned</h4>
                    <div className="space-y-1">
                      {pinnedItems.slice(0, 3).map((item) => (
                        <Card key={item.id} className="border-primary/20 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1 flex-1 min-w-0">
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
                                onClick={() => togglePin(item.id)}
                              >
                                <Pin className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(item.content)}
                              >
                                <Copy className="h-3 w-3" />
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
                      {pinnedItems.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{pinnedItems.length - 3} more pinned items
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Unpinned Items */}
                {unpinnedItems.length > 0 && (
                  <div>
                    {pinnedItems.length > 0 && <Separator className="my-2" />}
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Recent</h4>
                    <div className="space-y-1">
                      {unpinnedItems.slice(0, 5).map((item) => (
                        <Card key={item.id} className="p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1 flex-1 min-w-0">
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
                                onClick={() => togglePin(item.id)}
                              >
                                <PinOff className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(item.content)}
                              >
                                <Copy className="h-3 w-3" />
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
                      {unpinnedItems.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{unpinnedItems.length - 5} more recent items
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{settings.keyboardShortcut}</span>
            <span>Local storage</span>
          </div>
        </div>
      </div>
    </div>
  )
}