'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import ScreenshotTool from '@/components/tools/screenshot-tool'
import ClipboardManager from '@/components/clipboard/clipboard-manager'
import ColorPicker from '@/components/tools/color-picker'
import JsonViewer from '@/components/tools/json-viewer'
import ExtensionSettingsPanel from '@/components/extensions/extension-settings-panel'
import { 
  Camera, 
  Clipboard, 
  Palette, 
  Code,
  Settings,
  ExternalLink,
  Github,
  Puzzle
} from 'lucide-react'

export default function ToolsPage() {
  const [showScreenshotTool, setShowScreenshotTool] = useState(false)
  const [showClipboardManager, setShowClipboardManager] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showJsonViewer, setShowJsonViewer] = useState(false)
  const [showExtensionSettings, setShowExtensionSettings] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Internal Tools</h1>
              <p className="text-muted-foreground">
                Powerful built-in tools for enhanced productivity and development
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Github className="h-4 w-4 mr-2" />
                Source Code
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/demo/browser">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browser Demo
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/extensions">
                  <Settings className="h-4 w-4 mr-2" />
                  Extensions
                </a>
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              <TabsTrigger value="capture">Capture</TabsTrigger>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
              <TabsTrigger value="utilities">Utilities</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Screenshot Tool */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Camera className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle>Screenshot Tool</CardTitle>
                    <CardDescription>
                      Capture full screen or selected areas with save, copy, and share functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Full screen capture</li>
                          <li>• Area selection mode</li>
                          <li>• OS-native share sheet</li>
                          <li>• Copy to clipboard</li>
                          <li>• Save to file</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowScreenshotTool(true)}
                      >
                        Open Screenshot Tool
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Clipboard Manager */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Clipboard className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">Updated</Badge>
                    </div>
                    <CardTitle>Long Clipboard</CardTitle>
                    <CardDescription>
                      Persistent clipboard history with support for text, images, and code snippets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Multi-item storage</li>
                          <li>• Persistent across sessions</li>
                          <li>• Search and filter</li>
                          <li>• Pin important items</li>
                          <li>• Keyboard shortcuts</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowClipboardManager(true)}
                      >
                        Open Clipboard Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Color Picker */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Palette className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle>Color Picker</CardTitle>
                    <CardDescription>
                      Advanced color picker with palette saving and export functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Eyedropper tool</li>
                          <li>• Color palette save</li>
                          <li>• Export as JSON</li>
                          <li>• Session persistence</li>
                          <li>• Color format conversion</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowColorPicker(true)}
                      >
                        Open Color Picker
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* JSON Viewer */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Code className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle>JSON Viewer</CardTitle>
                    <CardDescription>
                      Advanced JSON viewer with search, filtering, and export capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Syntax highlighting</li>
                          <li>• Search and filter</li>
                          <li>• Export as JSON/CSV</li>
                          <li>• Collapsible sections</li>
                          <li>• Dark theme toggle</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setShowJsonViewer(true)}
                      >
                        Open JSON Viewer
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Extension Manager */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Settings className="h-8 w-8 text-primary" />
                      <Badge variant="outline">Planned</Badge>
                    </div>
                    <CardTitle>Extension Manager</CardTitle>
                    <CardDescription>
                      Manage browser extensions with sandboxed execution and permissions control
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Sandbox loader</li>
                          <li>• Permissions manager</li>
                          <li>• Auto-updates</li>
                          <li>• Settings panel</li>
                          <li>• Security controls</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        Planned
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Notes */}
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Code className="h-8 w-8 text-primary" />
                      <Badge variant="outline">Planned</Badge>
                    </div>
                    <CardTitle>Quick Notes</CardTitle>
                    <CardDescription>
                      Markdown-enabled note taking with sync and export capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <ul className="space-y-1">
                          <li>• Markdown support</li>
                          <li>• Profile sync</li>
                          <li>• Export as TXT/MD</li>
                          <li>• Quick access panel</li>
                          <li>• Search functionality</li>
                        </ul>
                      </div>
                      <Button className="w-full" disabled>
                        Planned
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="capture" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Camera className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Screenshot Tool</CardTitle>
                    <CardDescription>
                      Capture full screen or selected areas with save, copy, and share functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowScreenshotTool(true)}
                    >
                      Open Screenshot Tool
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="productivity" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Clipboard className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Long Clipboard</CardTitle>
                    <CardDescription>
                      Persistent clipboard history with support for text, images, and code snippets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowClipboardManager(true)}
                    >
                      Open Clipboard Manager
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="development" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Code className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>JSON Viewer</CardTitle>
                    <CardDescription>
                      Advanced JSON viewer with search, filtering, and export capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowJsonViewer(true)}
                    >
                      Open JSON Viewer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="utilities" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Palette className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Color Picker</CardTitle>
                    <CardDescription>
                      Advanced color picker with palette saving and export functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowColorPicker(true)}
                    >
                      Open Color Picker
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Modals */}
      {showScreenshotTool && (
        <ScreenshotTool onClose={() => setShowScreenshotTool(false)} />
      )}
      
      {showClipboardManager && (
        <ClipboardManager onClose={() => setShowClipboardManager(false)} />
      )}
      
      {showColorPicker && (
        <ColorPicker onClose={() => setShowColorPicker(false)} />
      )}
      
      {showJsonViewer && (
        <JsonViewer onClose={() => setShowJsonViewer(false)} />
      )}
    </div>
  )
}