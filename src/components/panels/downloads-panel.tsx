/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { DownloadsPanel as TurboDownloadsPanel } from '@/components/downloads/DownloadsPanel';

interface DownloadsPanelProps {
  service: any; // OmniorDownloadManager - will be properly typed when imported
}

export function DownloadsPanel({ service }: DownloadsPanelProps) {
  const { user, isGuest } = useAuthStore();
  const [profileId, setProfileId] = useState<string>('');

  useEffect(() => {
    // Generate a profile ID based on user state
    if (isGuest) {
      setProfileId('guest');
    } else if (user) {
      setProfileId(user.id || user.email || 'default');
    } else {
      setProfileId('default');
    }
  }, [user, isGuest]);

  if (!profileId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TurboDownloadsPanel profileId={profileId} />
    </div>
  );
}