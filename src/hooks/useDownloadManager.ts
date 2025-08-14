'use client';

import { useState, useEffect, useCallback } from 'react';
import { DownloadTask, DownloadOptions, ProfileId, DownloadProgress } from '@/core/downloads/models';

interface DownloadManagerHook {
  downloads: DownloadTask[];
  loading: boolean;
  error: string | null;
  listDownloads: (profileId: ProfileId) => Promise<void>;
  enqueueDownload: (profileId: ProfileId, url: string, options?: DownloadOptions) => Promise<DownloadTask>;
  pauseDownload: (profileId: ProfileId, downloadId: string) => Promise<void>;
  resumeDownload: (profileId: ProfileId, downloadId: string) => Promise<void>;
  cancelDownload: (profileId: ProfileId, downloadId: string) => Promise<void>;
  setPriority: (profileId: ProfileId, downloadId: string, priority: number) => Promise<void>;
  setBandwidthLimit: (profileId: ProfileId, limit?: number) => Promise<void>;
  scheduleDownload: (profileId: ProfileId, downloadId: string, when: Date) => Promise<void>;
  getProgress: (profileId: ProfileId, downloadId: string) => Promise<DownloadProgress>;
  restoreDownloads: (profileId: ProfileId) => Promise<void>;
}

export function useDownloadManager(profileId: ProfileId): DownloadManagerHook {
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/downloads${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listDownloads = useCallback(async (profileId: ProfileId) => {
    try {
      const response = await apiCall<{ downloads: DownloadTask[] }>(`?profileId=${profileId}&action=list`);
      setDownloads(response.downloads);
    } catch (err) {
      // Error is already handled by apiCall
    }
  }, [apiCall]);

  const enqueueDownload = useCallback(async (profileId: ProfileId, url: string, options?: DownloadOptions) => {
    const response = await apiCall<{ task: DownloadTask }>('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'enqueue',
        url,
        options,
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
    return response.task;
  }, [apiCall, listDownloads]);

  const pauseDownload = useCallback(async (profileId: ProfileId, downloadId: string) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'pause',
        downloadId,
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  const resumeDownload = useCallback(async (profileId: ProfileId, downloadId: string) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'resume',
        downloadId,
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  const cancelDownload = useCallback(async (profileId: ProfileId, downloadId: string) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'cancel',
        downloadId,
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  const setPriority = useCallback(async (profileId: ProfileId, downloadId: string, priority: number) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'setPriority',
        downloadId,
        priority,
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  const setBandwidthLimit = useCallback(async (profileId: ProfileId, limit?: number) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'setBandwidthLimit',
        limit,
      }),
    });
  }, [apiCall]);

  const scheduleDownload = useCallback(async (profileId: ProfileId, downloadId: string, when: Date) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'schedule',
        downloadId,
        when: when.toISOString(),
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  const getProgress = useCallback(async (profileId: ProfileId, downloadId: string) => {
    const response = await apiCall<{ progress: DownloadProgress }>(`?profileId=${profileId}&action=progress&downloadId=${downloadId}`);
    return response.progress;
  }, [apiCall]);

  const restoreDownloads = useCallback(async (profileId: ProfileId) => {
    await apiCall('', {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        action: 'restore',
      }),
    });
    
    // Refresh the list
    await listDownloads(profileId);
  }, [apiCall, listDownloads]);

  // Auto-refresh downloads every 5 seconds
  useEffect(() => {
    if (profileId) {
      listDownloads(profileId);
      
      const interval = setInterval(() => {
        listDownloads(profileId);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [profileId, listDownloads]);

  return {
    downloads,
    loading,
    error,
    listDownloads,
    enqueueDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    setPriority,
    setBandwidthLimit,
    scheduleDownload,
    getProgress,
    restoreDownloads,
  };
}