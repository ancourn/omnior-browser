"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ClipboardToolbar } from "@/components/clipboard/clipboard-toolbar"
import { useClipboard } from "@/hooks/use-clipboard"
import { 
  ArrowLeft, 
  Copy, 
  Type, 
  Link, 
  Code, 
  Image as ImageIcon, 
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const [testText, setTestText] = useState("")
  const [testLink, setTestLink] = useState("")
  const [testCode, setTestCode] = useState("")
  const { addItem, items, isLoading } = useClipboard()

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }

  const handleAddText = async () => {
    if (testText.trim()) {
      await copyToClipboard(testText)
      await addItem(testText, 'text')
      setTestText("")
    }
  }

  const handleAddLink = async () => {
    if (testLink.trim()) {
      await copyToClipboard(testLink)
      await addItem(testLink, 'link')
      setTestLink("")
    }
  }

  const handleAddCode = async () => {
    if (testCode.trim()) {
      await copyToClipboard(testCode)
      await addItem(testCode, 'code')
      setTestCode("")
    }
  }

  const sampleItems = [
    {
      type: 'text',
      title: 'Sample Text',
      content: 'This is a sample text item that demonstrates the clipboard manager functionality.',
      action: () => copyToClipboard('This is a sample text item that demonstrates the clipboard manager functionality.')
    },
    {
      type: 'link',
      title: 'GitHub Link',
      content: 'https://github.com/omnior/browser',
      action: () => copyToClipboard('https://github.com/omnior/browser')
    },
    {
      type: 'code',
      title: 'JavaScript Function',
      content: `function greet(name) {
  return \`Hello, \${name}! Welcome to Omnior Browser!\`;
}

console.log(greet('Developer'));`,
      action: () => copyToClipboard(`function greet(name) {
  return \`Hello, \${name}! Welcome to Omnior Browser!\`;
}

console.log(greet('Developer'));`)
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8">
                  <img src="/logo.svg" alt="Omnior Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-semibold">Omnior Browser</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Demo</Badge>
              <ClipboardToolbar />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Clipboard Manager Demo</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the power of Omnior's Long Clipboard Manager. Store, search, and manage your clipboard history with ease.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">{items.length}</div>
                <CardDescription className="text-base">Items Stored</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {items.filter(item => item.isPinned).length}
                </div>
                <CardDescription className="text-base">Pinned Items</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {new Set(items.map(item => item.type)).size}
                </div>
                <CardDescription className="text-base">Item Types</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <div className="text-3xl font-bold text-primary">∞</div>
                <CardDescription className="text-base">Storage Duration</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Add Items */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Test Items
                  </CardTitle>
                  <CardDescription>
                    Add different types of content to test the clipboard manager
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Text Content</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter text to copy..."
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                      />
                      <Button onClick={handleAddText} disabled={!testText.trim()}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link URL</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter URL to copy..."
                        value={testLink}
                        onChange={(e) => setTestLink(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
                      />
                      <Button onClick={handleAddLink} disabled={!testLink.trim()}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Code Snippet</label>
                    <Textarea
                      placeholder="Enter code to copy..."
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddCode} disabled={!testCode.trim()} className="w-full">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Samples</CardTitle>
                  <CardDescription>
                    Click to copy these sample items to your clipboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.type === 'text' && <Type className="h-4 w-4 text-muted-foreground" />}
                        {item.type === 'link' && <Link className="h-4 w-4 text-muted-foreground" />}
                        {item.type === 'code' && <Code className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.content.length > 60 ? item.content.substring(0, 60) + '...' : item.content}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={item.action}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Instructions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How to Use</CardTitle>
                  <CardDescription>
                    Learn how to use the Clipboard Manager effectively
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Copy Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Copy any text, links, or code using Ctrl+C or the copy buttons above
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Open Manager</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the clipboard icon in the toolbar or press Ctrl+Shift+C
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Manage Items</h4>
                      <p className="text-sm text-muted-foreground">
                        Search, pin, copy, or delete items from your clipboard history
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Configure Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the settings icon to customize storage limits and privacy options
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features Demonstrated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multi-item storage with different content types</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Real-time clipboard monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Search and filter functionality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Pin important items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Export clipboard data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Configurable settings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Persistent local storage</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keyboard Shortcuts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Open Clipboard Manager</span>
                      <Badge variant="outline">Ctrl+Shift+C</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Copy selected text</span>
                      <Badge variant="outline">Ctrl+C</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Paste</span>
                      <Badge variant="outline">Ctrl+V</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Cut</span>
                      <Badge variant="outline">Ctrl+X</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Current Items */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Current Clipboard Items</CardTitle>
              <CardDescription>
                Items currently stored in your clipboard history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading clipboard items...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No items in clipboard history</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Copy some text or use the test inputs above to add items
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.type === 'text' && <Type className="h-4 w-4 text-muted-foreground" />}
                        {item.type === 'link' && <Link className="h-4 w-4 text-muted-foreground" />}
                        {item.type === 'code' && <Code className="h-4 w-4 text-muted-foreground" />}
                        {item.type === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {item.title || 'Untitled'}
                            {item.isPinned && <Badge variant="secondary" className="text-xs">Pinned</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}