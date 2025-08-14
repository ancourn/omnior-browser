/**
 * Floating Download Manager Button
 * 
 * Quick access button for the AI-powered download manager
 * with smart positioning and visual feedback.
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  TrendingUp, 
  Pause,
  Play,
  AlertTriangle,
  Plus,
  X
} from "lucide-react"
import { DownloadManagerPanel } from './download-manager-panel'

interface FloatingDownloadButtonProps {
  className?: string
}

export function FloatingDownloadButton({ className }: FloatingDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [totalDownloads, setTotalDownloads] = useState(0)
  const [activeDownloads, setActiveDownloads] = useState(0)
  const [completedDownloads, setCompletedDownloads] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // This would normally call the download manager service
        // For now, we'll use mock data
        setTotalDownloads(45)
        setActiveDownloads(3)
        setCompletedDownloads(38)
      } catch (error) {
        console.error('Failed to load download stats:', error)
      }
    }

    loadStats()
    
    // Update stats every 5 seconds
    const interval = setInterval(loadStats, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // Keep button within viewport bounds
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Keyboard shortcut (Ctrl+J or Cmd+J)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  // Handle file download from drag and drop
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      // Handle dropped files (would normally start download)
      console.log('Files dropped:', files)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  useEffect(() => {
    document.addEventListener('drop', handleDrop)
    document.addEventListener('dragover', handleDragOver)
    return () => {
      document.removeEventListener('drop', handleDrop)
      document.removeEventListener('dragover', handleDragOver)
    }
  }, [])

  if (!isVisible) return null

  return (
    <>
      {/* Floating Button */}
      <div
        className={`fixed z-40 transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <Button
          size="lg"
          className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
            activeDownloads > 0 ? 'animate-pulse' : ''
          }`}
          onClick={() => setIsOpen(true)}
          onMouseDown={handleMouseDown}
        >
          <Download className="h-6 w-6" />
        </Button>

        {/* Status Badge */}
        {(activeDownloads > 0 || totalDownloads > 0) && (
          <Card className="absolute -top-2 -right-2 p-1 min-w-[20px] h-5 flex items-center justify-center">
            <CardContent className="p-0 text-xs font-medium">
              {activeDownloads > 0 ? activeDownloads : totalDownloads}
            </CardContent>
          </Card>
        )}

        {/* Activity Indicator */}
        {activeDownloads > 0 && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
        )}

        {/* Quick Stats Tooltip */}
        <Card className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 p-3 min-w-[200px] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none hover:pointer-events-auto">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <Badge variant="secondary">{totalDownloads}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active</span>
              <Badge variant="default" className="bg-blue-100 text-blue-800">
                <Play className="h-3 w-3 mr-1" />
                {activeDownloads}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <Badge variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                {completedDownloads}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Press Ctrl+J to open
            </div>
            {activeDownloads > 0 && (
              <div className="text-xs text-green-600 font-medium">
                Downloads in progress
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Download Manager Panel */}
      <DownloadManagerPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* Hide/Show Toggle */}
      <Button
        size="sm"
        variant="ghost"
        className="fixed bottom-4 right-4 z-30 opacity-50 hover:opacity-100"
        onClick={() => setIsVisible(!isVisible)}
      >
        <X className="h-4 w-4" />
      </Button>
    </>
  )
}