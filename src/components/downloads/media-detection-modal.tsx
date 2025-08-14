"use client"

import { useState } from "react"
import { Download, Play, Video, Music, FileText, AlertTriangle, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MediaDetectionResult, MediaQuality } from "@/types/downloads"
import { formatBytes } from "@/lib/format"

interface MediaDetectionModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItems: MediaDetectionResult[]
  onDownloadMedia: (media: MediaDetectionResult, quality?: MediaQuality) => void
  isLoading?: boolean
}

export function MediaDetectionModal({
  isOpen,
  onClose,
  mediaItems,
  onDownloadMedia,
  isLoading = false
}: MediaDetectionModalProps) {
  const [selectedQualities, setSelectedQualities] = useState<Record<string, MediaQuality>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "video":
      case "hls":
      case "dash":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case "video":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "audio":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "hls":
      case "dash":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleDownload = (media: MediaDetectionResult) => {
    const selectedQuality = selectedQualities[media.url]
    onDownloadMedia(media, selectedQuality)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            <CardTitle>Media Detection</CardTitle>
            <Badge variant="secondary">{mediaItems.length}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <CardDescription className="mb-4">
            Found {mediaItems.length} downloadable media file(s) on this page. Select quality options and click download.
          </CardDescription>
          
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {mediaItems.map((media) => (
                <Card key={media.url} className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getMediaIcon(media.mediaType)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate" title={media.url}>
                            {media.title || new URL(media.url).pathname.split('/').pop() || media.url}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={getMediaTypeColor(media.mediaType)}
                            >
                              {media.mediaType.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {media.contentType}
                            </span>
                            {media.fileSize && (
                              <span className="text-xs text-gray-500">
                                {formatBytes(media.fileSize)}
                              </span>
                            )}
                            {media.duration && (
                              <span className="text-xs text-gray-500">
                                {Math.floor(media.duration / 60)}:{Math.floor(media.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {media.isDRMProtected ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            DRM Protected
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleDownload(media)}
                            disabled={isLoading}
                            size="sm"
                            className="h-8"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* DRM Warning */}
                    {media.isDRMProtected && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">
                            This media is DRM protected and cannot be downloaded
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Streamable Content */}
                    {media.isStreamable && !media.isDRMProtected && (
                      <div className="space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(media.url)}
                          className="text-xs h-6 px-2 w-full justify-start"
                        >
                          Quality Options
                          <span className="ml-1">{expandedItems.has(media.url) ? "▲" : "▼"}</span>
                        </Button>
                        
                        {expandedItems.has(media.url) && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              Select quality for download:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Default quality option */}
                              <div
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  !selectedQualities[media.url]
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => {
                                  const newQualities = { ...selectedQualities }
                                  delete newQualities[media.url]
                                  setSelectedQualities(newQualities)
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border ${
                                    !selectedQualities[media.url] 
                                      ? 'border-blue-500 bg-blue-500' 
                                      : 'border-gray-300'
                                  }`}>
                                    {!selectedQualities[media.url] && (
                                      <Check className="h-2 w-2 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">Auto (Recommended)</div>
                                    <div className="text-xs text-gray-500">Best available quality</div>
                                  </div>
                                </div>
                              </div>

                              {/* Quality options would be populated here */}
                              {/* In real implementation, these would come from getMediaQualities */}
                              <div
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  selectedQualities[media.url]?.bitrate === 1000000
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => {
                                  setSelectedQualities({
                                    ...selectedQualities,
                                    [media.url]: {
                                      bitrate: 1000000,
                                      resolution: "720p",
                                      codec: "h264",
                                      url: media.url
                                    }
                                  })
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border ${
                                    selectedQualities[media.url]?.bitrate === 1000000
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedQualities[media.url]?.bitrate === 1000000 && (
                                      <Check className="h-2 w-2 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">720p HD</div>
                                    <div className="text-xs text-gray-500">1 Mbps</div>
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  selectedQualities[media.url]?.bitrate === 2000000
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => {
                                  setSelectedQualities({
                                    ...selectedQualities,
                                    [media.url]: {
                                      bitrate: 2000000,
                                      resolution: "1080p",
                                      codec: "h264",
                                      url: media.url
                                    }
                                  })
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border ${
                                    selectedQualities[media.url]?.bitrate === 2000000
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedQualities[media.url]?.bitrate === 2000000 && (
                                      <Check className="h-2 w-2 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">1080p Full HD</div>
                                    <div className="text-xs text-gray-500">2 Mbps</div>
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                                  selectedQualities[media.url]?.bitrate === 500000
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => {
                                  setSelectedQualities({
                                    ...selectedQualities,
                                    [media.url]: {
                                      bitrate: 500000,
                                      resolution: "480p",
                                      codec: "h264",
                                      url: media.url
                                    }
                                  })
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full border ${
                                    selectedQualities[media.url]?.bitrate === 500000
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedQualities[media.url]?.bitrate === 500000 && (
                                      <Check className="h-2 w-2 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">480p SD</div>
                                    <div className="text-xs text-gray-500">500 Kbps</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}