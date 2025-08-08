'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  EyeDropper, 
  Copy, 
  Download, 
  Trash2, 
  Plus,
  Check,
  X,
  RotateCcw,
  Grid3X3,
  List,
  Type
} from 'lucide-react'
import { toast } from 'sonner'

interface Color {
  id: string
  value: string
  name?: string
  timestamp: number
  isPinned: boolean
}

interface ColorPickerProps {
  onClose?: () => void
}

export default function ColorPicker({ onClose }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [palette, setPalette] = useState<Color[]>([])
  const [colorName, setColorName] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [eyedropperActive, setEyedropperActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add color to palette
  const addToPalette = useCallback((color: string, name?: string) => {
    const newColor: Color = {
      id: Date.now().toString(),
      value: color,
      name: name || '',
      timestamp: Date.now(),
      isPinned: false
    }
    
    setPalette(prev => [newColor, ...prev])
    setColorName('')
    toast.success('Color added to palette')
  }, [])

  // Remove color from palette
  const removeFromPalette = useCallback((id: string) => {
    setPalette(prev => prev.filter(color => color.id !== id))
    toast.success('Color removed from palette')
  }, [])

  // Toggle pin status
  const togglePin = useCallback((id: string) => {
    setPalette(prev => prev.map(color => 
      color.id === id ? { ...color, isPinned: !color.isPinned } : color
    ))
  }, [])

  // Copy color to clipboard
  const copyColor = useCallback((color: string) => {
    navigator.clipboard.writeText(color)
    toast.success('Color copied to clipboard')
  }, [])

  // Handle eyedropper
  const activateEyedropper = useCallback(async () => {
    try {
      if ('EyeDropper' in window) {
        setEyedropperActive(true)
        const eyeDropper = new (window as any).EyeDropper()
        const result = await eyeDropper.open()
        setSelectedColor(result.sRGBHex)
        addToPalette(result.sRGBHex)
        setEyedropperActive(false)
      } else {
        toast.error('EyeDropper API not supported in this browser')
      }
    } catch (error) {
      setEyedropperActive(false)
      if (error !== 'AbortError') {
        toast.error('Failed to pick color')
      }
    }
  }, [addToPalette])

  // Export palette as JSON
  const exportPalette = useCallback(() => {
    const exportData = {
      name: 'Omnior Color Palette',
      exported: new Date().toISOString(),
      colors: palette.map(color => ({
        value: color.value,
        name: color.name || '',
        pinned: color.isPinned
      }))
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-palette-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Palette exported successfully')
  }, [palette])

  // Import palette from JSON
  const importPalette = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.colors && Array.isArray(data.colors)) {
          const importedColors: Color[] = data.colors.map((color: any, index: number) => ({
            id: `imported-${Date.now()}-${index}`,
            value: color.value,
            name: color.name || '',
            timestamp: Date.now() + index,
            isPinned: color.pinned || false
          }))
          
          setPalette(prev => [...importedColors, ...prev])
          toast.success(`Imported ${importedColors.length} colors`)
        } else {
          toast.error('Invalid palette file format')
        }
      } catch (error) {
        toast.error('Failed to import palette')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Clear palette
  const clearPalette = useCallback(() => {
    setPalette([])
    toast.success('Palette cleared')
  }, [])

  // Color format conversions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  const hexToHsl = (hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return null

    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s, l = (max + min) / 2

    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h! /= 6
    }

    return {
      h: Math.round(h! * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  const rgb = hexToRgb(selectedColor)
  const hsl = hexToHsl(selectedColor)

  const pinnedColors = palette.filter(color => color.isPinned)
  const unpinnedColors = palette.filter(color => !color.isPinned)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Picker
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {palette.length} colors
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="picker" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="picker">Color Picker</TabsTrigger>
              <TabsTrigger value="palette">Color Palette</TabsTrigger>
              <TabsTrigger value="formats">Formats</TabsTrigger>
            </TabsList>

            <TabsContent value="picker" className="space-y-4">
              {/* Color Picker Controls */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-16 h-16 rounded cursor-pointer"
                  />
                  <div className="space-y-1">
                    <Input
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-32 font-mono text-sm"
                      placeholder="#000000"
                    />
                    <Button
                      onClick={() => addToPalette(selectedColor, colorName)}
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add to Palette
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={activateEyedropper}
                    disabled={eyedropperActive}
                    variant={eyedropperActive ? "default" : "outline"}
                    size="sm"
                  >
                    <EyeDropper className="h-4 w-4 mr-2" />
                    {eyedropperActive ? 'Picking...' : 'Eyedropper'}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Color name (optional)"
                    className="w-40"
                  />
                </div>
              </div>

              {/* Color Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Selected Color</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="w-full h-24 rounded-lg border"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </CardContent>
                </Card>

                {rgb && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">RGB</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-sm font-mono">
                        R: {rgb.r}
                      </div>
                      <div className="text-sm font-mono">
                        G: {rgb.g}
                      </div>
                      <div className="text-sm font-mono">
                        B: {rgb.b}
                      </div>
                      <Button
                        onClick={() => copyColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy RGB
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {hsl && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">HSL</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-sm font-mono">
                        H: {hsl.h}°
                      </div>
                      <div className="text-sm font-mono">
                        S: {hsl.s}%
                      </div>
                      <div className="text-sm font-mono">
                        L: {hsl.l}%
                      </div>
                      <Button
                        onClick={() => copyColor(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy HSL
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="palette" className="space-y-4">
              {/* Palette Controls */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    variant="outline"
                    size="sm"
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                  <Badge variant="outline">
                    {viewMode === 'grid' ? 'Grid View' : 'List View'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importPalette}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  <Button
                    onClick={exportPalette}
                    variant="outline"
                    size="sm"
                    disabled={palette.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    onClick={clearPalette}
                    variant="outline"
                    size="sm"
                    disabled={palette.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Color Palette */}
              <ScrollArea className="max-h-96">
                {palette.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Palette className="h-8 w-8 mx-auto mb-2" />
                      <p>No colors in palette</p>
                      <p className="text-sm">Add colors using the color picker</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pinned Colors */}
                    {pinnedColors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Pinned</h4>
                        <div className={viewMode === 'grid' ? "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" : "space-y-2"}>
                          {pinnedColors.map((color) => (
                            <div
                              key={color.id}
                              className={`relative group cursor-pointer ${
                                viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-2 p-2 border rounded'
                              }`}
                              onClick={() => copyColor(color.value)}
                            >
                              <div
                                className={viewMode === 'grid' ? 'w-full h-full rounded border' : 'w-8 h-8 rounded border flex-shrink-0'}
                                style={{ backgroundColor: color.value }}
                              />
                              {viewMode === 'list' && (
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {color.name || 'Unnamed'}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {color.value}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      togglePin(color.id)
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeFromPalette(color.id)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unpinned Colors */}
                    {unpinnedColors.length > 0 && (
                      <div>
                        {pinnedColors.length > 0 && <Separator className="my-4" />}
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent</h4>
                        <div className={viewMode === 'grid' ? "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" : "space-y-2"}>
                          {unpinnedColors.map((color) => (
                            <div
                              key={color.id}
                              className={`relative group cursor-pointer ${
                                viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-2 p-2 border rounded'
                              }`}
                              onClick={() => copyColor(color.value)}
                            >
                              <div
                                className={viewMode === 'grid' ? 'w-full h-full rounded border' : 'w-8 h-8 rounded border flex-shrink-0'}
                                style={{ backgroundColor: color.value }}
                              />
                              {viewMode === 'list' && (
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {color.name || 'Unnamed'}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {color.value}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      togglePin(color.id)
                                    }}
                                  >
                                    <Type className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeFromPalette(color.id)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="formats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">HEX Format</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input value={selectedColor} readOnly className="font-mono" />
                    <Button
                      onClick={() => copyColor(selectedColor)}
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy HEX
                    </Button>
                  </CardContent>
                </Card>

                {rgb && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">RGB Format</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Input value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} readOnly className="font-mono" />
                      <Button
                        onClick={() => copyColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
                        size="sm"
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy RGB
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {hsl && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">HSL Format</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Input value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} readOnly className="font-mono" />
                      <Button
                        onClick={() => copyColor(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                        size="sm"
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy HSL
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CSS Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Input value={`--color: ${selectedColor};`} readOnly className="font-mono" />
                    <Button
                      onClick={() => copyColor(`--color: ${selectedColor};`)}
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy CSS Var
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}