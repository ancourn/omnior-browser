"use client"

import { useState, useEffect } from "react"
import { Download, Download as DownloadIcon, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadJob } from "@/types/downloads"

interface DownloadFloatingButtonProps {
  downloads: DownloadJob[]
  onOpenManager: () => void
  onShowDetection: () => void
}

export function DownloadFloatingButton({
  downloads,
  onOpenManager,
  onShowDetection
}: DownloadFloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeDownloads, setActiveDownloads] = useState<DownloadJob[]>([])
  const [recentDetections, setRecentDetections] = useState(0)

  useEffect(() => {
    const active = downloads.filter(d => d.status === "downloading")
    setActiveDownloads(active)
  }, [downloads])

  // Simulate media detection (in real implementation, this would come from browser extension)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate detecting media on current page
      const detectionCount = Math.floor(Math.random() * 3)
      setRecentDetections(detectionCount)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const totalDownloads = downloads.length
  const activeCount = activeDownloads.length
  const completedCount = downloads.filter(d => d.status === "completed").length

  const handleClick = () => {
    if (isExpanded) {
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Panel */}
      {isExpanded && (
        <Card className="absolute bottom-16 right-0 w-80 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DownloadIcon className="h-5 w-5" />
              Downloads
            </CardTitle>
            <CardDescription>
              Manage your downloads and detected media
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Download Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {activeCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {completedCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Complete</div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {totalDownloads}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>

            {/* Active Downloads Preview */}
            {activeDownloads.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Downloads</h4>
                {activeDownloads.slice(0, 2).map((download) => (
                  <div key={download.id} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate" title={download.filename}>
                        {download.filename.length > 20 ? download.filename.substring(0, 20) + '...' : download.filename}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(download.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
                {activeDownloads.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{activeDownloads.length - 2} more downloading...
                  </div>
                )}
              </div>
            )}

            {/* Media Detection */}
            {recentDetections > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Media Detected
                  </span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                  Found {recentDetections} downloadable media file(s) on this page
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onShowDetection}
                  className="w-full text-xs h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  View & Download
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={onOpenManager}
                className="w-full"
                size="sm"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Open Download Manager
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setIsExpanded(false)}
                className="w-full"
                size="sm"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Button */}
      <div className="relative">
        <Button
          onClick={handleClick}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Download className="h-6 w-6" />
        </Button>
        
        {/* Badge for active downloads */}
        {(activeCount > 0 || recentDetections > 0) && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full"
          >
            {activeCount > 0 ? activeCount : recentDetections}
          </Badge>
        )}
      </div>
    </div>
  )
}