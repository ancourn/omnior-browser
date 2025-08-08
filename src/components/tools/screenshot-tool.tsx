'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Camera, 
  Download, 
  Copy, 
  Share, 
  Crop, 
  RotateCcw, 
  Maximize,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface ScreenshotToolProps {
  onClose?: () => void
}

interface ScreenshotData {
  dataUrl: string
  blob: Blob
  width: number
  height: number
  timestamp: number
}

export default function ScreenshotTool({ onClose }: ScreenshotToolProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [screenshot, setScreenshot] = useState<ScreenshotData | null>(null)
  const [captureMode, setCaptureMode] = useState<'full' | 'area'>('full')
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const captureScreenshot = useCallback(async () => {
    try {
      setIsCapturing(true)
      
      if (captureMode === 'full') {
        // Capture full screen using html2canvas-like approach
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get canvas context')

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        // For demo purposes, we'll create a simple representation
        // In a real implementation, you'd use html2canvas or similar
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#374151'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Omnior Browser Screenshot', canvas.width / 2, canvas.height / 2)
        ctx.font = '16px Arial'
        ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 40)

        const dataUrl = canvas.toDataURL('image/png')
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Could not create blob'))
          }, 'image/png')
        })

        setScreenshot({
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height,
          timestamp: Date.now()
        })
      } else {
        // Area selection mode
        setIsSelectingArea(true)
        toast.info('Click and drag to select an area to capture')
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      toast.error('Failed to capture screenshot')
    } finally {
      setIsCapturing(false)
    }
  }, [captureMode])

  const handleAreaSelection = useCallback((e: React.MouseEvent) => {
    if (!isSelectingArea) return

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (e.type === 'mousedown') {
      setSelectionStart({ x, y })
      setSelectionEnd({ x, y })
    } else if (e.type === 'mousemove') {
      setSelectionEnd({ x, y })
    } else if (e.type === 'mouseup') {
      setIsSelectingArea(false)
      captureSelectedArea()
    }
  }, [isSelectingArea])

  const captureSelectedArea = useCallback(async () => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')

      const width = Math.abs(selectionEnd.x - selectionStart.x)
      const height = Math.abs(selectionEnd.y - selectionStart.y)
      const x = Math.min(selectionStart.x, selectionEnd.x)
      const y = Math.min(selectionStart.y, selectionEnd.y)

      canvas.width = width
      canvas.height = height

      // Create a simple representation of the selected area
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(0, 0, width, height)
      ctx.setLineDash([])

      ctx.fillStyle = '#374151'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`Selected Area (${width}x${height})`, width / 2, height / 2)

      const dataUrl = canvas.toDataURL('image/png')
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Could not create blob'))
        }, 'image/png')
      })

      setScreenshot({
        dataUrl,
        blob,
        width,
        height,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error capturing selected area:', error)
      toast.error('Failed to capture selected area')
    }
  }, [selectionStart, selectionEnd])

  const saveScreenshot = useCallback(async () => {
    if (!screenshot) return

    try {
      const link = document.createElement('a')
      link.download = `omnior-screenshot-${screenshot.timestamp}.png`
      link.href = screenshot.dataUrl
      link.click()
      toast.success('Screenshot saved successfully')
    } catch (error) {
      console.error('Error saving screenshot:', error)
      toast.error('Failed to save screenshot')
    }
  }, [screenshot])

  const copyToClipboard = useCallback(async () => {
    if (!screenshot) return

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': screenshot.blob
        })
      ])
      toast.success('Screenshot copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }, [screenshot])

  const shareScreenshot = useCallback(async () => {
    if (!screenshot) return

    try {
      if (navigator.share) {
        // Web Share API support
        const file = new File([screenshot.blob], `screenshot-${screenshot.timestamp}.png`, {
          type: 'image/png'
        })

        await navigator.share({
          title: 'Omnior Browser Screenshot',
          text: 'Check out this screenshot from Omnior Browser',
          files: [file]
        })
        toast.success('Screenshot shared successfully')
      } else {
        // Fallback: create download link for manual sharing
        const link = document.createElement('a')
        link.download = `omnior-screenshot-${screenshot.timestamp}.png`
        link.href = screenshot.dataUrl
        link.click()
        toast.info('Web Share API not available. Screenshot downloaded for manual sharing.')
      }
    } catch (error) {
      console.error('Error sharing screenshot:', error)
      toast.error('Failed to share screenshot')
    }
  }, [screenshot])

  const resetCapture = useCallback(() => {
    setScreenshot(null)
    setIsSelectingArea(false)
    setSelectionStart({ x: 0, y: 0 })
    setSelectionEnd({ x: 0, y: 0 })
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Screenshot Tool
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {captureMode === 'full' ? 'Full Screen' : 'Area Selection'}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Capture Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={captureMode === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode('full')}
            >
              <Maximize className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
            <Button
              variant={captureMode === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCaptureMode('area')}
            >
              <Crop className="h-4 w-4 mr-2" />
              Select Area
            </Button>
            <Button
              onClick={captureScreenshot}
              disabled={isCapturing}
              className="ml-auto"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCapturing ? 'Capturing...' : 'Capture'}
            </Button>
          </div>

          <Separator />

          {/* Screenshot Preview */}
          <div className="relative bg-muted rounded-lg p-4 min-h-[300px] flex items-center justify-center">
            {isSelectingArea ? (
              <div
                className="absolute inset-0 cursor-crosshair"
                onMouseDown={handleAreaSelection}
                onMouseMove={handleAreaSelection}
                onMouseUp={handleAreaSelection}
              >
                <div className="w-full h-full bg-muted/50 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Click and drag to select area
                    </p>
                  </div>
                </div>
                {/* Selection overlay */}
                {selectionStart.x !== selectionEnd.x && selectionStart.y !== selectionEnd.y && (
                  <div
                    className="absolute border-2 border-primary bg-primary/20"
                    style={{
                      left: Math.min(selectionStart.x, selectionEnd.x),
                      top: Math.min(selectionStart.y, selectionEnd.y),
                      width: Math.abs(selectionEnd.x - selectionStart.x),
                      height: Math.abs(selectionEnd.y - selectionStart.y),
                    }}
                  />
                )}
              </div>
            ) : screenshot ? (
              <div className="space-y-4 w-full">
                <div className="text-center">
                  <img
                    src={screenshot.dataUrl}
                    alt="Screenshot"
                    className="max-w-full max-h-[400px] mx-auto rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {screenshot.width} × {screenshot.height} pixels
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click "Capture" to take a screenshot
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {screenshot && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveScreenshot} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button onClick={shareScreenshot} variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={resetCapture} variant="outline" className="ml-auto">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
          <video ref={videoRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  )
}