"use client";

import { useState, useEffect } from 'react';
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  FolderOpen, 
  Trash2, 
  Settings, 
  Clock,
  Zap,
  Shield,
  Filter,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DownloadItemCard } from './DownloadItemCard';
import { DownloadScheduler } from './DownloadScheduler';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { DownloadTask, ProfileId } from '@/core/downloads/models';

interface DownloadsPanelProps {
  profileId: ProfileId;
}

export function DownloadsPanel({ profileId }: DownloadsPanelProps) {
  const {
    downloads,
    loading,
    error,
    listDownloads,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    setBandwidthLimit
  } = useDownloadManager(profileId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (profileId) {
      listDownloads(profileId);
    }
  }, [profileId, listDownloads]);

  const filteredDownloads = downloads.filter(download => {
    const matchesSearch = download.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         download.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || download.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const downloadsByStatus = {
    all: downloads.length,
    downloading: downloads.filter(d => d.status === 'downloading').length,
    paused: downloads.filter(d => d.status === 'paused').length,
    completed: downloads.filter(d => d.status === 'completed').length,
    failed: downloads.filter(d => d.status === 'failed').length
  };

  const handlePauseAll = async () => {
    const downloadingDownloads = downloads.filter(d => d.status === 'downloading');
    for (const download of downloadingDownloads) {
      await pauseDownload(profileId, download.id);
    }
  };

  const handleResumeAll = async () => {
    const pausedDownloads = downloads.filter(d => d.status === 'paused');
    for (const download of pausedDownloads) {
      await resumeDownload(profileId, download.id);
    }
  };

  const handleCancelAll = async () => {
    const activeDownloads = downloads.filter(d => ['downloading', 'paused'].includes(d.status));
    for (const download of activeDownloads) {
      await cancelDownload(profileId, download.id);
    }
  };

  const handleClearCompleted = async () => {
    const completedDownloads = downloads.filter(d => d.status === 'completed');
    for (const download of completedDownloads) {
      await cancelDownload(profileId, download.id);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'canceled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Downloads</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduler(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Scheduler
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{downloadsByStatus.all}</p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Downloading</p>
                <p className="text-2xl font-bold">{downloadsByStatus.downloading}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">{downloadsByStatus.paused}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{downloadsByStatus.completed}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{downloadsByStatus.failed}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Download Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseAll}
              disabled={downloadsByStatus.downloading === 0}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResumeAll}
              disabled={downloadsByStatus.paused === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelAll}
              disabled={downloadsByStatus.downloading + downloadsByStatus.paused === 0}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCompleted}
              disabled={downloadsByStatus.completed === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Completed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search downloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant={activeTab === 'all' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setActiveTab('all')}>
                All ({downloadsByStatus.all})
              </Badge>
              <Badge variant={activeTab === 'downloading' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setActiveTab('downloading')}>
                Active ({downloadsByStatus.downloading})
              </Badge>
              <Badge variant={activeTab === 'completed' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setActiveTab('completed')}>
                Completed ({downloadsByStatus.completed})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downloads List */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No downloads found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDownloads.map((download) => (
            <DownloadItemCard
              key={download.id}
              download={download}
              profileId={profileId}
              onPause={pauseDownload}
              onResume={resumeDownload}
              onCancel={cancelDownload}
            />
          ))
        )}
      </div>

      {/* Scheduler Modal */}
      {showScheduler && (
        <DownloadScheduler
          profileId={profileId}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}