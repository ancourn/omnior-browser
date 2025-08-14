"use client";

import { useState } from 'react';
import { 
  Clock, 
  X, 
  Plus, 
  Trash2, 
  Play, 
  Pause,
  Settings,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useDownloadManager } from '@/hooks/useDownloadManager';
import { DownloadTask, ProfileId } from '@/core/downloads/models';

interface DownloadSchedulerProps {
  profileId: ProfileId;
  onClose: () => void;
}

interface ScheduledDownload {
  id: string;
  url: string;
  fileName: string;
  scheduledTime: Date;
  status: 'pending' | 'scheduled' | 'executing';
}

export function DownloadScheduler({ profileId, onClose }: DownloadSchedulerProps) {
  const { setBandwidthLimit, enqueueDownload, cancelDownload } = useDownloadManager(profileId);
  const [scheduledDownloads, setScheduledDownloads] = useState<ScheduledDownload[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDownload, setNewDownload] = useState({
    url: '',
    fileName: '',
    scheduledTime: ''
  });
  const [globalBandwidthLimit, setGlobalBandwidthLimit] = useState([0]);
  const [globalPause, setGlobalPause] = useState(false);
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState([5]);

  const handleAddScheduled = async () => {
    if (!newDownload.url || !newDownload.scheduledTime) return;

    const scheduled: ScheduledDownload = {
      id: Math.random().toString(36).substr(2, 9),
      url: newDownload.url,
      fileName: newDownload.fileName || newDownload.url.split('/').pop() || 'download',
      scheduledTime: new Date(newDownload.scheduledTime),
      status: 'scheduled'
    };

    setScheduledDownloads(prev => [...prev, scheduled]);
    
    // Schedule the download
    try {
      await enqueueDownload(profileId, newDownload.url, {
        fileName: newDownload.fileName,
        scheduledFor: new Date(newDownload.scheduledTime)
      });
    } catch (error) {
      console.error('Failed to schedule download:', error);
    }

    setNewDownload({ url: '', fileName: '', scheduledTime: '' });
    setShowAddDialog(false);
  };

  const handleRemoveScheduled = async (id: string) => {
    setScheduledDownloads(prev => prev.filter(d => d.id !== id));
    try {
      await cancelDownload(profileId, id);
    } catch (error) {
      console.error('Failed to remove scheduled download:', error);
    }
  };

  const handleSetGlobalBandwidthLimit = async () => {
    try {
      await setBandwidthLimit(profileId, globalBandwidthLimit[0] || undefined);
    } catch (error) {
      console.error('Failed to set bandwidth limit:', error);
    }
  };

  const handleGlobalPause = async () => {
    try {
      if (globalPause) {
        // Resume all downloads - this would need to be implemented in the hook
        console.log('Resuming all downloads');
      } else {
        // Pause all downloads - this would need to be implemented in the hook
        console.log('Pausing all downloads');
      }
    } catch (error) {
      console.error('Failed to toggle global pause:', error);
    }
  };

  const formatSpeed = (bytesPerSec: number): string => {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let size = bytesPerSec;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const getTimeUntilScheduled = (scheduledTime: Date): string => {
    const now = new Date();
    const diff = scheduledTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Starting now...';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Download Scheduler & Settings
          </DialogTitle>
          <DialogDescription>
            Manage scheduled downloads and configure global download settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Global Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bandwidth Limit */}
              <div className="space-y-2">
                <Label>Global Bandwidth Limit</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={globalBandwidthLimit}
                    onValueChange={setGlobalBandwidthLimit}
                    max={100 * 1024 * 1024} // 100 MB/s
                    step={1024 * 1024} // 1 MB steps
                    className="flex-1"
                  />
                  <div className="w-32 text-sm text-muted-foreground">
                    {globalBandwidthLimit[0] === 0 ? 'Unlimited' : formatSpeed(globalBandwidthLimit[0])}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetGlobalBandwidthLimit}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              
              {/* Max Concurrent Downloads */}
              <div className="space-y-2">
                <Label>Max Concurrent Downloads</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={maxConcurrentDownloads}
                    onValueChange={setMaxConcurrentDownloads}
                    max={20}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <div className="w-16 text-sm text-muted-foreground">
                    {maxConcurrentDownloads[0]}
                  </div>
                </div>
              </div>
              
              {/* Global Pause */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Global Pause</Label>
                  <p className="text-sm text-muted-foreground">
                    Pause all active downloads
                  </p>
                </div>
                <Switch
                  checked={globalPause}
                  onCheckedChange={setGlobalPause}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Scheduled Downloads */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Scheduled Downloads
                  </CardTitle>
                  <CardDescription>
                    Downloads scheduled for future execution
                  </CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Scheduled
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Download</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          placeholder="https://example.com/file.zip"
                          value={newDownload.url}
                          onChange={(e) => setNewDownload(prev => ({ ...prev, url: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fileName">File Name (optional)</Label>
                        <Input
                          id="fileName"
                          placeholder="file.zip"
                          value={newDownload.fileName}
                          onChange={(e) => setNewDownload(prev => ({ ...prev, fileName: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="scheduledTime">Schedule Time</Label>
                        <Input
                          id="scheduledTime"
                          type="datetime-local"
                          value={newDownload.scheduledTime}
                          onChange={(e) => setNewDownload(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddScheduled}>
                          Schedule Download
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {scheduledDownloads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled downloads</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledDownloads.map((scheduled) => (
                    <div key={scheduled.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{scheduled.fileName}</h4>
                          <Badge variant="outline">
                            {getTimeUntilScheduled(scheduled.scheduledTime)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {scheduled.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Scheduled for: {formatTime(scheduled.scheduledTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveScheduled(scheduled.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}