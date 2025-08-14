/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Star, 
  History, 
  Download, 
  Settings, 
  Maximize2,
  Minimize2,
  Package,
  Brain,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabStrip } from '@/components/chrome/tab-strip';
import { Omnibox } from '@/components/chrome/omnibox';
import { BookmarksPanel } from '@/components/panels/bookmarks-panel';
import { HistoryPanel } from '@/components/panels/history-panel';
import { DownloadsPanel } from '@/components/panels/downloads-panel';
import { SettingsPanel } from '@/components/panels/settings-panel';
import { StorePanel } from '@/components/panels/store-panel';
import { ContentAnalysisPanel } from '@/components/panels/content-analysis-panel';
import { CollaborationPanel } from '@/components/panels/collaboration-panel';
import { FloatingSearchButton } from '@/components/search/floating-search-button';
import { useAuthStore } from '@/lib/auth/store';
import type { 
  OmniorTabService, 
  OmniorBookmarkService, 
  OmniorHistoryService, 
  OmniorSettingsService, 
  OmniorDownloadManager 
} from '@/core';

interface BrowserProps {
  services: {
    tabs: OmniorTabService;
    bookmarks: OmniorBookmarkService;
    history: OmniorHistoryService;
    settings: OmniorSettingsService;
    downloads: OmniorDownloadManager;
  };
}

type PanelType = 'none' | 'bookmarks' | 'history' | 'downloads' | 'settings' | 'store' | 'analysis' | 'collaboration';

export function Browser({ services }: BrowserProps) {
  const { user, isGuest } = useAuthStore();
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [isMaximized, setIsMaximized] = useState(false);

  const handlePanelToggle = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? 'none' : panel);
  };

  const getPanelIcon = (panel: PanelType) => {
    switch (panel) {
      case 'bookmarks': return <Star className="h-4 w-4" />;
      case 'history': return <History className="h-4 w-4" />;
      case 'downloads': return <Download className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      case 'store': return <Package className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      default: return <LayoutDashboard className="h-4 w-4" />;
    }
  };

  const getPanelName = (panel: PanelType) => {
    switch (panel) {
      case 'bookmarks': return 'Bookmarks';
      case 'history': return 'History';
      case 'downloads': return 'Downloads';
      case 'settings': return 'Settings';
      case 'store': return 'Store';
      case 'analysis': return 'Analysis';
      case 'collaboration': return 'Collab';
      default: return 'Dashboard';
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-50 dark:bg-slate-900 ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Chrome Bar */}
      <div className="flex-shrink-0">
        {/* System Title Bar */}
        <div className="flex items-center justify-between px-4 py-1 bg-slate-900 text-white text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded" />
            <span>Omnior Browser</span>
            {isGuest && (
              <Badge variant="secondary" className="text-xs bg-yellow-600 text-white">
                Guest Mode
              </Badge>
            )}
            {user && !isGuest && (
              <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                {user.email}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-slate-700"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Tab Strip */}
        <TabStrip service={services.tabs} />

        {/* Omnibox */}
        <Omnibox service={services.tabs} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 bg-slate-800 dark:bg-slate-950 border-r border-slate-700 dark:border-slate-800 flex flex-col items-center py-4 gap-2">
          {(['bookmarks', 'history', 'downloads', 'settings', 'store', 'analysis', 'collaboration'] as PanelType[]).map((panel) => (
            <Button
              key={panel}
              variant={activePanel === panel ? 'default' : 'ghost'}
              size="sm"
              className="h-12 w-12 p-0 flex flex-col gap-1"
              onClick={() => handlePanelToggle(panel)}
            >
              {getPanelIcon(panel)}
              <span className="text-xs">{getPanelName(panel).substring(0, 3)}</span>
            </Button>
          ))}
        </div>

        {/* Panel Content */}
        {activePanel !== 'none' && (
          <div className="w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
            {activePanel === 'bookmarks' && <BookmarksPanel service={services.bookmarks} />}
            {activePanel === 'history' && <HistoryPanel service={services.history} />}
            {activePanel === 'downloads' && <DownloadsPanel service={services.downloads} />}
            {activePanel === 'settings' && <SettingsPanel service={services.settings} />}
            {activePanel === 'store' && <StorePanel service={null} />}
            {activePanel === 'analysis' && <ContentAnalysisPanel />}
            {activePanel === 'collaboration' && <CollaborationPanel />}
          </div>
        )}

        {/* Main Browser Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {/* Mock Browser Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Welcome to Omnior Browser
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Your secure, AI-powered browsing experience
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                  <span>Secure Connection</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>AI Enhanced</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  <span>Privacy First</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>Ready</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-4">
              <span>JavaScript Enabled</span>
              <span>Cookies Allowed</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Search Button */}
      <FloatingSearchButton />
    </div>
  );
}