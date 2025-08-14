"use client";

import { useState, useEffect } from 'react';
import { Eye, Wifi, WifiOff, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { guestModeService } from '@/lib/auth/guest-mode';
import { sessionManager } from '@/lib/auth/session-manager';

interface GuestIndicatorProps {
  onEndSession: () => void;
}

export function GuestIndicator({ onEndSession }: GuestIndicatorProps) {
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  useEffect(() => {
    // Update session stats periodically
    const updateStats = () => {
      const stats = guestModeService.getSessionStats();
      setSessionStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEndSession = async () => {
    if (!showConfirmEnd) {
      setShowConfirmEnd(true);
      return;
    }

    try {
      await guestModeService.endGuestSession();
      sessionManager.endSession();
      onEndSession();
    } catch (error) {
      console.error('Error ending guest session:', error);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!sessionStats || !sessionStats.isActive) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm">Guest Mode</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Browsing privately - no data will be saved
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Duration:</span>
            </div>
            <div className="text-right font-medium">
              {formatDuration(sessionStats.duration)}
            </div>
            
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>Storage:</span>
            </div>
            <div className="text-right font-medium">
              {formatBytes(sessionStats.storageSize * 1024)}
            </div>
          </div>

          {/* Privacy Features */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <WifiOff className="h-3 w-3 text-green-500" />
              <span>Trackers blocked</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Trash2 className="h-3 w-3 text-green-500" />
              <span>Cookies cleared on exit</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Eye className="h-3 w-3 text-green-500" />
              <span>Browsing history disabled</span>
            </div>
          </div>

          {/* End Session Button */}
          {showConfirmEnd ? (
            <Alert className="border-orange-200 dark:border-orange-800">
              <AlertDescription className="text-xs">
                All guest data will be permanently deleted. Continue?
              </AlertDescription>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleEndSession}
                  className="flex-1 text-xs"
                >
                  End Session
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowConfirmEnd(false)}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </Alert>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEndSession}
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              End Guest Session
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}