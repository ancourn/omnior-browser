"use client"

import { useState, useEffect } from "react"
import { Download, Pause, Play, X, Trash2, FolderOpen, BarChart3, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DownloadJob, DownloadStatus } from "@/types/downloads"
import { formatBytes, formatTime, formatSpeed } from "@/lib/format"

interface DownloadManagerPanelProps {
  isOpen: boolean
  onClose: () => void
  downloads: DownloadJob[]
  onPauseDownload: (jobId: string) => void
  onResumeDownload: (jobId: string) => void
  onCancelDownload: (jobId: string) => void
  onRemoveDownload: (jobId: string) => void
  onOpenFile: (jobId: string) => void
}

export function DownloadManagerPanel({
  isOpen,
  onClose,
  downloads,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onRemoveDownload,
  onOpenFile
}: DownloadManagerPanelProps) {
  const [activeDownloads, setActiveDownloads] = useState<DownloadJob[]>([])
  const [completedDownloads, setCompletedDownloads] = useState<DownloadJob[]>([])

  useEffect(() => {
    const active = downloads.filter(d => d.status === "downloading" || d.status === "paused")
    const completed = downloads.filter(d => d.status === "completed" || d.status === "failed")
    
    setActiveDownloads(active)
    setCompletedDownloads(completed)
  }, [downloads])

  if (!isOpen) return null

  const getStatusColor = (status: DownloadStatus) => {
    switch (status) {
      case "downloading": return "bg-blue-500"
      case "paused": return "bg-yellow-500"
      case "completed": return "bg-green-500"
      case "failed": return "bg-red-500"
      case "cancelled": return "bg-gray-500"
      default: return "bg-gray-400"
    }
  }

  const getStatusText = (status: DownloadStatus) => {
    switch (status) {
      case "downloading": return "Downloading"
      case "paused": return "Paused"
      case "completed": return "Completed"
      case "failed": return "Failed"
      case "cancelled": return "Cancelled"
      case "queued": return "Queued"
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle>Download Manager</CardTitle>
            <Badge variant="secondary">{downloads.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Active Downloads */}
          {activeDownloads.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Active Downloads ({activeDownloads.length})
              </h3>
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {activeDownloads.map((download) => (
                    <DownloadItem
                      key={download.id}
                      download={download}
                      onPauseDownload={onPauseDownload}
                      onResumeDownload={onResumeDownload}
                      onCancelDownload={onCancelDownload}
                      onRemoveDownload={onRemoveDownload}
                      onOpenFile={onOpenFile}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Completed Downloads */}
          {completedDownloads.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Completed Downloads ({completedDownloads.length})
              </h3>
              <ScrollArea className="max-h-60">
                <div className="space-y-2">
                  {completedDownloads.map((download) => (
                    <DownloadItem
                      key={download.id}
                      download={download}
                      onPauseDownload={onPauseDownload}
                      onResumeDownload={onResumeDownload}
                      onCancelDownload={onCancelDownload}
                      onRemoveDownload={onRemoveDownload}
                      onOpenFile={onOpenFile}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {downloads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Download className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No downloads yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Start downloading media files and they'll appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface DownloadItemProps {
  download: DownloadJob
  onPauseDownload: (jobId: string) => void
  onResumeDownload: (jobId: string) => void
  onCancelDownload: (jobId: string) => void
  onRemoveDownload: (jobId: string) => void
  onOpenFile: (jobId: string) => void
  getStatusColor: (status: DownloadStatus) => string
  getStatusText: (status: DownloadStatus) => string
}

function DownloadItem({
  download,
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onRemoveDownload,
  onOpenFile,
  getStatusColor,
  getStatusText
}: DownloadItemProps) {
  const [showSegments, setShowSegments] = useState(false)

  const handleAction = () => {
    switch (download.status) {
      case "downloading":
        onPauseDownload(download.id)
        break
      case "paused":
        onResumeDownload(download.id)
        break
      case "completed":
        onOpenFile(download.id)
        break
      default:
        onCancelDownload(download.id)
        break
    }
  }

  const getActionIcon = () => {
    switch (download.status) {
      case "downloading":
        return <Pause className="h-4 w-4" />
      case "paused":
        return <Play className="h-4 w-4" />
      case "completed":
        return <FolderOpen className="h-4 w-4" />
      default:
        return <X className="h-4 w-4" />
    }
  }

  const getActionText = () => {
    switch (download.status) {
      case "downloading":
        return "Pause"
      case "paused":
        return "Resume"
      case "completed":
        return "Open"
      default:
        return "Cancel"
    }
  }

  return (
    <Card className="p-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate" title={download.filename}>
              {download.filename}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(download.status)} text-white`}
              >
                {getStatusText(download.status)}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatBytes(download.fileSize)}
              </span>
              {download.speed > 0 && (
                <span className="text-xs text-gray-500">
                  • {formatSpeed(download.speed)}
                </span>
              )}
              {download.eta > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(download.eta)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAction}
              className="h-8 w-8 p-0"
            >
              {getActionIcon()}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDownload(download.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {download.status === "downloading" && (
          <div className="space-y-1">
            <Progress value={download.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{download.progress.toFixed(1)}% complete</span>
              <span>{formatBytes(download.fileSize * download.progress / 100)} / {formatBytes(download.fileSize)}</span>
            </div>
          </div>
        )}

        {/* Segments Info */}
        {download.segments.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSegments(!showSegments)}
              className="text-xs h-6 px-2"
            >
              {download.segments.length} segments
              <span className="ml-1">{showSegments ? "▲" : "▼"}</span>
            </Button>
            
            {showSegments && (
              <div className="mt-2 space-y-1">
                {download.segments.slice(0, 5).map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Segment {segment.startByte}-{segment.endByte}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        segment.status === "completed" ? "border-green-500 text-green-700" :
                        segment.status === "downloading" ? "border-blue-500 text-blue-700" :
                        segment.status === "failed" ? "border-red-500 text-red-700" :
                        "border-gray-500 text-gray-700"
                      }`}
                    >
                      {segment.status}
                    </Badge>
                  </div>
                ))}
                {download.segments.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{download.segments.length - 5} more segments
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}