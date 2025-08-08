'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import ClipboardPanel from '@/components/clipboard/clipboard-panel'
import ClipboardContextMenu from '@/components/clipboard/clipboard-context-menu'
import { useClipboardContextMenuAttachment } from '@/hooks/use-clipboard-context-menu'
import { 
  ChevronRight, 
  Clipboard, 
  Type, 
  Globe, 
  FileText, 
  Image,
  Code,
  Settings,
  Home,
  Star,
  Plus
} from 'lucide-react'

export default function BrowserDemoPage() {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const { contextMenuState, hideContextMenu, handlePasteItem } = useClipboardContextMenuAttachment()

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Browser Chrome */}
      <div className="border-b">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search or enter website name"
                  className="pl-10 h-8"
                  value="omnior://demo/browser"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={togglePanel}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-2 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="home" className="text-xs">
                <Home className="h-3 w-3 mr-1" />
                Home
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="h-3 w-3 mr-1" />
                Text
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Code
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Browser Content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-4xl">
            <Tabs value={activeTab} className="w-full">
              <TabsContent value="home" className="mt-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Omnior Browser Demo</h1>
                    <p className="text-muted-foreground">
                      Experience the power of integrated clipboard management
                    </p>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Clipboard Integration Demo</CardTitle>
                      <CardDescription>
                        Try right-clicking on any text field below to access your clipboard history
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Text Input</label>
                        <Input 
                          placeholder="Right-click here to see clipboard history..."
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Textarea</label>
                        <Textarea 
                          placeholder="Right-click here for larger text paste options..."
                          className="w-full"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content Editable Area</label>
                        <div 
                          className="w-full p-3 border rounded-md min-h-[100px] bg-muted/50"
                          contentEditable
                          suppressContentEditableWarning
                        >
                          Right-click here to paste from clipboard history...
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Features</CardTitle>
                      <CardDescription>
                        The clipboard panel is now integrated as a browser sidebar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Persistent clipboard history</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Context menu integration</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Search and filtering</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Pin important items</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Quick access panel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm">Keyboard shortcuts</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Text Editor</CardTitle>
                    <CardDescription>
                      Right-click in the editor to paste from clipboard history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Start typing or right-click to paste from clipboard..."
                      className="w-full min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Editor</CardTitle>
                    <CardDescription>
                      Right-click to paste code snippets from clipboard history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="// Right-click to paste code..."
                      className="w-full min-h-[400px] font-mono text-sm"
                      defaultValue={`// Welcome to Omnior Code Editor
function helloWorld() {
  console.log("Hello, Omnior!");
}

// Try right-clicking and selecting from clipboard history`}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Notes</CardTitle>
                    <CardDescription>
                      Right-click to paste content from clipboard into your notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Right-click to paste from clipboard history..."
                      className="w-full min-h-[400px]"
                      defaultValue={`# My Notes

Right-click anywhere in this area to access your clipboard history and paste content directly into your notes.

## Features:
- Persistent storage
- Search functionality  
- Pin important items
- Quick access via context menu

Try it now!`}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Clipboard Panel */}
        <ClipboardPanel 
          isExpanded={isPanelExpanded}
          onToggleExpand={togglePanel}
          className="h-full"
        />
      </div>

      {/* Context Menu */}
      <ClipboardContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        onClose={hideContextMenu}
        onSelectItem={handlePasteItem}
        targetElement={contextMenuState.targetElement}
      />
    </div>
  )
}