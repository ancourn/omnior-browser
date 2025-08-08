"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  Code
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useClipboard } from "@/hooks/use-clipboard"
import type { ClipboardItem } from "@/lib/clipboard/clipboard-service"

interface ClipboardManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function ClipboardManager({ isOpen, onClose }: ClipboardManagerProps) {
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
          <div className="p-3 bg-muted rounded">
            <p className="text-sm break-words">{item.content}</p>
          </div>
        )
      case 'link':
        return (
          <div className="p-3 bg-muted rounded">
            <a href={item.content} target="_blank" rel="noopener noreferrer" 
               className="text-sm text-blue-600 hover:text-blue-800 break-words">
              {item.content}
            </a>
          </div>
        )
      case 'code':
        return (
          <div className="p-3 bg-muted rounded font-mono text-xs overflow-x-auto">
            <pre>{item.content}</pre>
          </div>
        )
      case 'image':
        return (
          <div className="p-3 bg-muted rounded">
            {item.preview ? (
              <img src={item.preview} alt="Clipboard image" className="max-w-full h-auto rounded" />
            ) : (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
        )
      default:
        return <div className="p-3 bg-muted rounded text-sm">{item.content}</div>
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Clipboard Manager</h2>
              <Badge variant="secondary">{items.length} items</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clipboard items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading clipboard items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No clipboard items found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pinned Items */}
              {pinnedItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Pinned</h3>
                  <div className="space-y-2">
                    {pinnedItems.map((item) => (
                      <Card key={item.id} className="border-primary/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <CardTitle className="text-sm">{item.title || 'Untitled'}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => togglePin(item.id)}>
                                <Pin className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.content)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderContent(item)}
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(item.createdAt)}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Unpinned Items */}
              {unpinnedItems.length > 0 && (
                <div>
                  {pinnedItems.length > 0 && <Separator className="my-4" />}
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
                  <div className="space-y-2">
                    {unpinnedItems.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(item.type)}
                              <CardTitle className="text-sm">{item.title || 'Untitled'}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => togglePin(item.id)}>
                                <PinOff className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(item.content)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderContent(item)}
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(item.createdAt)}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Press {settings.keyboardShortcut} to open</span>
            <span>Items stored locally</span>
          </div>
        </div>
      </div>
    </div>
  )
}