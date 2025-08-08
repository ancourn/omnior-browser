'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Code, 
  Search, 
  Download, 
  Upload, 
  Copy, 
  FileText, 
  Table,
  Expand,
  Collapse,
  Moon,
  Sun,
  FileJson,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface JsonViewerProps {
  onClose?: () => void
  initialJson?: string
}

interface JsonNode {
  key: string
  value: any
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  path: string
  expanded: boolean
  children?: JsonNode[]
}

export default function JsonViewer({ onClose, initialJson = '' }: JsonViewerProps) {
  const [jsonInput, setJsonInput] = useState(initialJson)
  const [parsedJson, setParsedJson] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse JSON
  const parseJson = useCallback(() => {
    try {
      if (!jsonInput.trim()) {
        setError('Please enter JSON data')
        return
      }
      
      const parsed = JSON.parse(jsonInput)
      setParsedJson(parsed)
      setError('')
      
      // Auto-expand first level
      const initialExpanded = new Set<string>()
      if (typeof parsed === 'object' && parsed !== null) {
        Object.keys(parsed).forEach(key => {
          initialExpanded.add(`root.${key}`)
        })
      }
      setExpandedNodes(initialExpanded)
      
      toast.success('JSON parsed successfully')
    } catch (err) {
      setError(`Invalid JSON: ${(err as Error).message}`)
      setParsedJson(null)
    }
  }, [jsonInput])

  // Convert JSON to tree structure
  const jsonToTree = useCallback((obj: any, path: string = 'root'): JsonNode[] => {
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj).map(([key, value]) => {
        const currentPath = `${path}.${key}`
        const nodeType = Array.isArray(value) ? 'array' : 'object'
        
        return {
          key,
          value,
          type: nodeType,
          path: currentPath,
          expanded: expandedNodes.has(currentPath),
          children: jsonToTree(value, currentPath)
        }
      })
    }
    return []
  }, [expandedNodes])

  // Toggle node expansion
  const toggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  // Expand all nodes
  const expandAll = useCallback(() => {
    const expandPaths = (obj: any, path: string = 'root'): string[] => {
      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).flatMap(([key, value]) => {
          const currentPath = `${path}.${key}`
          return [currentPath, ...expandPaths(value, currentPath)]
        })
      }
      return []
    }
    
    const allPaths = expandPaths(parsedJson)
    setExpandedNodes(new Set(allPaths))
  }, [parsedJson])

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())
  }, [])

  // Copy to clipboard
  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }, [])

  // Export as JSON
  const exportAsJson = useCallback(() => {
    if (!parsedJson) return
    
    const blob = new Blob([JSON.stringify(parsedJson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Exported as JSON')
  }, [parsedJson])

  // Export as CSV
  const exportAsCsv = useCallback(() => {
    if (!parsedJson || !Array.isArray(parsedJson)) {
      toast.error('CSV export requires an array of objects')
      return
    }
    
    if (parsedJson.length === 0) {
      toast.error('No data to export')
      return
    }
    
    // Get headers from first object
    const headers = Object.keys(parsedJson[0])
    const csvContent = [
      headers.join(','),
      ...parsedJson.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma or quote
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Exported as CSV')
  }, [parsedJson])

  // Import JSON file
  const importJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonInput(content)
      try {
        JSON.parse(content)
        toast.success('JSON file loaded successfully')
      } catch (error) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Format JSON
  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
      toast.success('JSON formatted')
    } catch (error) {
      toast.error('Invalid JSON')
    }
  }, [jsonInput])

  // Minify JSON
  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      const minified = JSON.stringify(parsed)
      setJsonInput(minified)
      toast.success('JSON minified')
    } catch (error) {
      toast.error('Invalid JSON')
    }
  }, [jsonInput])

  // Clear all
  const clearAll = useCallback(() => {
    setJsonInput('')
    setParsedJson(null)
    setError('')
    setSearchTerm('')
    setExpandedNodes(new Set())
  }, [])

  // Render JSON node
  const renderJsonNode = useCallback((node: JsonNode, level: number = 0): JSX.Element => {
    const indent = level * 20
    const isExpanded = expandedNodes.has(node.path)
    
    const renderValue = (value: any) => {
      switch (typeof value) {
        case 'string':
          return (
            <span className="text-green-600 dark:text-green-400">
              "{value}"
            </span>
          )
        case 'number':
          return (
            <span className="text-blue-600 dark:text-blue-400">
              {value}
            </span>
          )
        case 'boolean':
          return (
            <span className="text-purple-600 dark:text-purple-400">
              {value ? 'true' : 'false'}
            </span>
          )
        case 'object':
          if (value === null) {
            return (
              <span className="text-gray-500 dark:text-gray-400">
                null
              </span>
            )
          }
          return null
        default:
          return String(value)
      }
    }

    const matchesSearch = searchTerm && (
      node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(node.value).toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div key={node.path} className="font-mono text-sm">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer ${
            matchesSearch ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''
          }`}
          style={{ marginLeft: indent }}
          onClick={() => toggleNode(node.path)}
        >
          {(node.type === 'object' || node.type === 'array') && (
            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 mr-1">
              {isExpanded ? '▼' : '▶'}
            </Button>
          )}
          <span className="text-blue-600 dark:text-blue-400 mr-2">
            {node.key}:
          </span>
          {node.type !== 'object' && node.type !== 'array' && renderValue(node.value)}
          {node.type === 'array' && (
            <span className="text-gray-500 dark:text-gray-400">
              [{node.value.length}]
            </span>
          )}
          {node.type === 'object' && (
            <span className="text-gray-500 dark:text-gray-400">
              {Object.keys(node.value).length > 0 ? '{...}' : '{}'}
            </span>
          )}
        </div>
        
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderJsonNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }, [expandedNodes, searchTerm, toggleNode])

  const treeData = parsedJson ? jsonToTree(parsedJson) : []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-6xl max-h-[90vh] overflow-hidden ${darkMode ? 'dark' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            JSON Viewer
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                size="sm"
              />
              <Moon className="h-4 w-4" />
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="viewer">Viewer</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button onClick={parseJson} disabled={!jsonInput.trim()}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Parse JSON
                  </Button>
                  <Button onClick={formatJson} disabled={!jsonInput.trim()} variant="outline">
                    <Code className="h-4 w-4 mr-1" />
                    Format
                  </Button>
                  <Button onClick={minifyJson} disabled={!jsonInput.trim()} variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Minify
                  </Button>
                  <div className="flex-1"></div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importJson}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  <Button onClick={clearAll} variant="outline">
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">JSON Input</label>
                    {error && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </div>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your JSON here..."
                    className="font-mono text-sm min-h-[300px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="viewer" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'tree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('tree')}
                    >
                      <Expand className="h-4 w-4 mr-1" />
                      Tree
                    </Button>
                    <Button
                      variant={viewMode === 'raw' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('raw')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Raw
                    </Button>
                  </div>
                  
                  {viewMode === 'tree' && (
                    <>
                      <Button onClick={expandAll} size="sm" variant="outline">
                        <Expand className="h-4 w-4 mr-1" />
                        Expand All
                      </Button>
                      <Button onClick={collapseAll} size="sm" variant="outline">
                        <Collapse className="h-4 w-4 mr-1" />
                        Collapse All
                      </Button>
                    </>
                  )}
                  
                  <div className="flex-1"></div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                </div>

                <div className="border rounded-lg">
                  {parsedJson ? (
                    <ScrollArea className="max-h-96">
                      <div className="p-4">
                        {viewMode === 'tree' ? (
                          treeData.map(node => renderJsonNode(node))
                        ) : (
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(parsedJson, null, 2)}
                          </pre>
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-2" />
                        <p>No JSON data to display</p>
                        <p className="text-sm">Parse JSON first to view it here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON Export
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Export as formatted JSON file
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={exportAsJson} 
                        disabled={!parsedJson}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export as JSON
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV Export
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Export array data as CSV (requires array of objects)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={exportAsCsv} 
                        disabled={!parsedJson || !Array.isArray(parsedJson)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export as CSV
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Copy to Clipboard</CardTitle>
                    <CardDescription className="text-xs">
                      Copy JSON data in different formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(parsedJson, null, 2))}
                        disabled={!parsedJson}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Formatted
                      </Button>
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(parsedJson))}
                        disabled={!parsedJson}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Minified
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {!parsedJson && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No data to export</p>
                    <p className="text-sm">Parse JSON first to enable export options</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}