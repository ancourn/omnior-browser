/**
 * Omnior Download Manager Panel
 * 
 * AI-powered download management interface with intelligent categorization,
 * security scanning, bandwidth optimization, and smart organization.
 */

"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  Trash2, 
  Filter, 
  Calendar, 
  Folder, 
  Tag,
  TrendingUp,
  BarChart3,
  Shield,
  Zap,
  Settings,
  RefreshCw,
  Search,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  HardDrive
} from "lucide-react"
import { DownloadEntry, DownloadQuery, DownloadStats } from '@/lib/downloads/omnior-download-manager-service'
import { omniorDownloadManagerService } from '@/lib/downloads/omnior-download-manager-service'

interface DownloadManagerPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DownloadManagerPanel({ isOpen, onClose }: DownloadManagerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [downloads, setDownloads] = useState<DownloadEntry[]>([])
  const [stats, setStats] = useState<DownloadStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [newDownloadUrl, setNewDownloadUrl] = useState('')

  const categories = [
    'documents', 'images', 'videos', 'music', 'software', 
    'games', 'archives', 'ebooks', 'data', 'other'
  ]

  const statuses = [
    { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-800' },
    { value: 'downloading', label: 'Downloading', icon: Download, color: 'bg-blue-100 text-blue-800' },
    { value: 'paused', label: 'Paused', icon: Pause, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'failed', label: 'Failed', icon: X, color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', icon: X, color: 'bg-gray-100 text-gray-800' }
  ]

  const threatLevels = [
    { value: 'safe', label: 'Safe', icon: Shield, color: 'bg-green-100 text-green-800' },
    { value: 'suspicious', label: 'Suspicious', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'dangerous', label: 'Dangerous', icon: AlertTriangle, color: 'bg-red-100 text-red-800' }
  ]

  const categoryIcons: Record<string, React.ReactNode> = {
    documents: <FileText className="h-4 w-4" />,
    images: <Image className="h-4 w-4" />,
    videos: <Video className="h-4 w-4" />,
    music: <Music className="h-4 w-4" />,
    software: <HardDrive className="h-4 w-4" />,
    games: <HardDrive className="h-4 w-4" />,
    archives: <Archive className="h-4 w-4" />,
    ebooks: <FileText className="h-4 w-4" />,
    data: <HardDrive className="h-4 w-4" />,
    other: <FileText className="h-4 w-4" />
  }

  useEffect(() => {
    if (isOpen) {
      loadDownloads()
      loadStats()
    }
  }, [isOpen])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDownloads()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, selectedStatus, selectedThreat])

  const loadDownloads = async () => {
    setIsLoading(true)
    try {
      const query: DownloadQuery = {
        search: searchQuery,
        category: selectedCategory || undefined,
        status: selectedStatus as any,
        threatLevel: selectedThreat as any,
        limit: 50
      }

      const result = await omniorDownloadManagerService.searchDownloads(query)
      setDownloads(result.entries)
    } catch (error) {
      console.error('Failed to load downloads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const downloadStats = await omniorDownloadManagerService.getStats()
      setStats(downloadStats)
    } catch (error) {
      console.error('Failed to load download stats:', error)
    }
  }

  const handleStartDownload = async () => {
    if (!newDownloadUrl.trim()) return

    try {
      await omniorDownloadManagerService.startDownload(newDownloadUrl)
      setNewDownloadUrl('')
      loadDownloads()
      loadStats()
    } catch (error) {
      console.error('Failed to start download:', error)
    }
  }

  const handlePauseDownload = async (id: string) => {
    try {
      await omniorDownloadManagerService.pauseDownload(id)
      loadDownloads()
    } catch (error) {
      console.error('Failed to pause download:', error)
    }
  }

  const handleResumeDownload = async (id: string) => {
    try {
      await omniorDownloadManagerService.resumeDownload(id)
      loadDownloads()
    } catch (error) {
      console.error('Failed to resume download:', error)
    }
  }

  const handleCancelDownload = async (id: string) => {
    try {
      await omniorDownloadManagerService.cancelDownload(id)
      loadDownloads()
      loadStats()
    } catch (error) {
      console.error('Failed to cancel download:', error)
    }
  }

  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const deleteSelectedEntries = async () => {
    if (selectedEntries.size === 0) return

    try {
      for (const id of selectedEntries) {
        await omniorDownloadManagerService.cancelDownload(id)
      }
      setSelectedEntries(new Set())
      loadDownloads()
      loadStats()
    } catch (error) {
      console.error('Failed to delete entries:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s'
  }

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0s'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Download Manager</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered download management with intelligent categorization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Download */}
        <div className="p-6 border-b space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL to download..."
              value={newDownloadUrl}
              onChange={(e) => setNewDownloadUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStartDownload()}
              className="flex-1"
            />
            <Button onClick={handleStartDownload} disabled={!newDownloadUrl.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Category:</span>
            </div>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              >
                {categoryIcons[category]}
                <span className="ml-1">{category}</span>
              </Badge>
            ))}
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
            </div>
            {statuses.map(status => (
              <Badge
                key={status.value}
                variant={selectedStatus === status.value ? "default" : "outline"}
                className={`cursor-pointer ${selectedStatus === status.value ? status.color : ''}`}
                onClick={() => setSelectedStatus(selectedStatus === status.value ? null : status.value)}
              >
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="p-6 border-b bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Downloads</p>
                      <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                    </div>
                    <Download className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Size</p>
                      <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                    </div>
                    <HardDrive className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Speed</p>
                      <p className="text-2xl font-bold">{formatSpeed(stats.averageSpeed)}</p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Bandwidth Saved</p>
                      <p className="text-2xl font-bold">{formatFileSize(stats.bandwidthSavings)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Bar */}
        {selectedEntries.size > 0 && (
          <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedEntries.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedEntries}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Downloads List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : downloads.length === 0 ? (
                <div className="text-center py-12">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No downloads found</h3>
                  <p className="text-muted-foreground">
                    Start a new download by entering a URL above
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <Card
                      key={download.id}
                      className={`transition-colors cursor-pointer hover:bg-muted/50 ${
                        selectedEntries.has(download.id) ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => toggleEntrySelection(download.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {categoryIcons[download.category]}
                              <h3 className="font-medium truncate">{download.filename}</h3>
                              {download.isStarred && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>{formatFileSize(download.fileSize)}</span>
                              <span>•</span>
                              <span>{formatFileSize(download.downloadedSize)} downloaded</span>
                              {download.speed > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{formatSpeed(download.speed)}</span>
                                </>
                              )}
                              {download.eta > 0 && download.status === 'downloading' && (
                                <>
                                  <span>•</span>
                                  <span>{formatTime(download.eta)} remaining</span>
                                </>
                              )}
                            </div>

                            {/* Progress Bar */}
                            {download.status === 'downloading' && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>{download.progress.toFixed(1)}% complete</span>
                                  <span>{formatFileSize(download.downloadedSize)} / {formatFileSize(download.fileSize)}</span>
                                </div>
                                <Progress value={download.progress} className="h-2" />
                              </div>
                            )}

                            {/* Status and Threat Level */}
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  download.status === 'completed' ? 'border-green-200 text-green-700' :
                                  download.status === 'downloading' ? 'border-blue-200 text-blue-700' :
                                  download.status === 'paused' ? 'border-yellow-200 text-yellow-700' :
                                  download.status === 'failed' ? 'border-red-200 text-red-700' :
                                  'border-gray-200 text-gray-700'
                                }`}
                              >
                                {statuses.find(s => s.value === download.status)?.label}
                              </Badge>
                              
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  download.threatLevel === 'safe' ? 'border-green-200 text-green-700' :
                                  download.threatLevel === 'suspicious' ? 'border-yellow-200 text-yellow-700' :
                                  'border-red-200 text-red-700'
                                }`}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {download.threatLevel}
                              </Badge>
                              
                              <Badge variant="outline" className="text-xs">
                                <Folder className="h-3 w-3 mr-1" />
                                {download.category}
                              </Badge>
                            </div>

                            {/* AI Insights */}
                            {download.aiInsights && download.aiInsights.description && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span className="font-medium">AI Insights:</span>
                                </div>
                                <p className="text-muted-foreground">
                                  {download.aiInsights.description}
                                </p>
                                {download.aiInsights.suggestedActions.length > 0 && (
                                  <div className="mt-1">
                                    <span className="font-medium">Suggested: </span>
                                    <span className="text-muted-foreground">
                                      {download.aiInsights.suggestedActions.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-1">
                            {download.status === 'downloading' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePauseDownload(download.id)
                                }}
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            {download.status === 'paused' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResumeDownload(download.id)
                                }}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {['pending', 'failed'].includes(download.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResumeDownload(download.id)
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                            {['pending', 'paused', 'downloading', 'failed'].includes(download.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelDownload(download.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {downloads.length} downloads
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDownloads}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}