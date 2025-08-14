/**
 * Floating History Button
 * 
 * Quick access button for the AI-powered history panel
 * with smart positioning and visual feedback.
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  TrendingUp, 
  Star,
  History,
  Plus,
  X
} from "lucide-react"
import { HistoryPanel } from './history-panel'

interface FloatingHistoryButtonProps {
  className?: string
}

export function FloatingHistoryButton({ className }: FloatingHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [recentCount, setRecentCount] = useState(0)
  const [starredCount, setStarredCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        // This would normally call the history service
        // For now, we'll use mock data
        setRecentCount(127)
        setStarredCount(23)
      } catch (error) {
        console.error('Failed to load history stats:', error)
      }
    }

    loadStats()
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

  // Keyboard shortcut (Ctrl+H or Cmd+H)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

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
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => setIsOpen(true)}
          onMouseDown={handleMouseDown}
        >
          <Clock className="h-6 w-6" />
        </Button>

        {/* Stats Badge */}
        {(recentCount > 0 || starredCount > 0) && (
          <Card className="absolute -top-2 -right-2 p-1 min-w-[20px] h-5 flex items-center justify-center">
            <CardContent className="p-0 text-xs font-medium">
              {recentCount + starredCount}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Tooltip */}
        <Card className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 p-3 min-w-[200px] opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none hover:pointer-events-auto">
          <CardContent className="p-0 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recent</span>
              <Badge variant="secondary">{recentCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Starred</span>
              <Badge variant="outline">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {starredCount}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Press Ctrl+H to open
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Panel */}
      <HistoryPanel
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