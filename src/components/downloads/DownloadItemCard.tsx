"use client";

import { useState } from 'react';
import { 
  Pause, 
  Play, 
  X, 
  FolderOpen, 
  Trash2, 
  MoreVertical,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DownloadTask, ProfileId } from '@/core/downloads/models';

interface DownloadItemCardProps {
  download: DownloadTask;
  profileId: ProfileId;
  onPause: (profileId: ProfileId, downloadId: string) => Promise<void>;
  onResume: (profileId: ProfileId, downloadId: string) => Promise<void>;
  onCancel: (profileId: ProfileId, downloadId: string) => Promise<void>;
}

export function DownloadItemCard({ download, profileId, onPause, onResume, onCancel }: DownloadItemCardProps) {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await onPause(profileId, download.id);
    } catch (error) {
      console.error('Failed to pause download:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResume = async () => {
    setIsActionLoading(true);
    try {
      await onResume(profileId, download.id);
    } catch (error) {
      console.error('Failed to resume download:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsActionLoading(true);
    try {
      await onCancel(profileId, download.id);
    } catch (error) {
      console.error('Failed to cancel download:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenFile = async () => {
    try {
      // In a real implementation, this would open the file/folder
      console.log('Open file:', download.destPath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleOpenFolder = async () => {
    try {
      // In a real implementation, this would open the folder
      console.log('Open folder for:', download.fileName);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const formatSpeed = (bytesPerSec?: number): string => {
    if (!bytesPerSec) return '0 B/s';
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let size = bytesPerSec;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (ms?: number): string => {
    if (!ms) return '--';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getProgressPercentage = (): number => {
    if (!download.totalBytes || download.totalBytes === 0) return 0;
    return Math.round((download.downloadedBytes / download.totalBytes) * 100);
  };

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading':
        return <Download className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'canceled':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'canceled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (download.status) {
      case 'downloading':
        return 'Downloading';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Queued';
    }
  };

  const canPause = download.status === 'downloading';
  const canResume = download.status === 'paused';
  const canCancel = ['downloading', 'paused'].includes(download.status);
  const canOpen = download.status === 'completed' && download.destPath;
  const showProgress = ['downloading', 'paused'].includes(download.status);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-4">
          {/* Left side - File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h3 className="font-semibold truncate">{download.fileName}</h3>
              <Badge variant="secondary" className={`${getStatusColor()} text-white`}>
                {getStatusText()}
              </Badge>
              {download.encryptAtRest && (
                <Badge variant="outline">
                  Encrypted
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground truncate mb-2">
              {download.url}
            </p>
            
            {download.error && (
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">{download.error}</span>
              </div>
            )}
            
            {showProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {formatSize(download.downloadedBytes)} / {formatSize(download.totalBytes)}
                  </span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatSpeed(download.speedBytesPerSec)}</span>
                  <span>ETA: {formatTime(download.etaMs)}</span>
                </div>
              </div>
            )}
            
            {download.status === 'completed' && (
              <div className="text-sm text-muted-foreground">
                Completed {download.completedAt ? new Date(download.completedAt).toLocaleString() : ''}
              </div>
            )}
          </div>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={isActionLoading}
              >
                <Pause className="h-4 w-4" />
              </Button>
            )}
            
            {canResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={isActionLoading}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isActionLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {canOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFile}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenFolder}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenFolder}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from List
                </DropdownMenuItem>
                {download.status === 'failed' && (
                  <DropdownMenuItem onClick={handleResume}>
                    <Download className="h-4 w-4 mr-2" />
                    Retry Download
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Additional info */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Threads: {download.threads}</span>
            <span>Priority: {download.priority}</span>
            {download.bandwidthLimit && (
              <span>Limit: {formatSize(download.bandwidthLimit)}/s</span>
            )}
            {download.scheduledFor && (
              <span>Scheduled: {new Date(download.scheduledFor).toLocaleString()}</span>
            )}
          </div>
          <div>
            Added {new Date(download.createdAt).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}