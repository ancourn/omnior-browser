/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { X, Pin, Volume2, VolumeX, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTabsStore } from '@/core/tabs/store';
import type { OmniorTab } from '@/core/common/models';

interface TabStripProps {
  service: any; // OmniorTabService - will be properly typed when imported
}

export function TabStrip({ service }: TabStripProps) {
  const { tabs, activeTabId, isLoading, error } = useTabsStore();
  const [draggingTab, setDraggingTab] = useState<OmniorTab | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tabId: string) => {
    service.activate(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    service.close(tabId);
  };

  const handleTabPin = (e: React.MouseEvent, tabId: string, pinned: boolean) => {
    e.stopPropagation();
    service.pin(tabId, !pinned);
  };

  const handleTabMute = (e: React.MouseEvent, tabId: string, audible: boolean) => {
    e.stopPropagation();
    service.update(tabId, { audible: !audible });
  };

  const handleNewTab = () => {
    service.create({ url: 'about:blank' });
  };

  const handleReopenClosedTab = () => {
    service.reopenClosedTab();
  };

  const handleDragStart = (e: React.DragEvent, tab: OmniorTab) => {
    setDraggingTab(tab);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tab.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTab: OmniorTab) => {
    e.preventDefault();
    if (!draggingTab || draggingTab.id === targetTab.id) return;

    const fromIndex = tabs.findIndex(tab => tab.id === draggingTab.id);
    const toIndex = tabs.findIndex(tab => tab.id === targetTab.id);
    
    if (fromIndex !== -1 && toIndex !== -1) {
      service.move(draggingTab.id, toIndex);
    }
    
    setDraggingTab(null);
  };

  const handleDragEnd = () => {
    setDraggingTab(null);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 200;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-12 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-12 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
      </div>
    );
  }

  // Separate pinned and unpinned tabs
  const pinnedTabs = tabs.filter(tab => tab.pinned);
  const unpinnedTabs = tabs.filter(tab => !tab.pinned);

  return (
    <div className="flex items-center h-12 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 select-none">
      {/* Scroll buttons */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-none"
        onClick={() => scrollTabs('left')}
      >
        ‹
      </Button>

      {/* Tabs container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex items-center overflow-x-auto scrollbar-hide"
      >
        {/* Pinned tabs */}
        {pinnedTabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            onClick={() => handleTabClick(tab.id)}
            onClose={(e) => handleTabClose(e, tab.id)}
            onPin={(e) => handleTabPin(e, tab.id, tab.pinned || false)}
            onMute={(e) => handleTabMute(e, tab.id, tab.audible || false)}
            onDragStart={(e) => handleDragStart(e, tab)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab)}
            onDragEnd={handleDragEnd}
            isPinned={true}
          />
        ))}

        {/* Divider between pinned and unpinned tabs */}
        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1" />
        )}

        {/* Unpinned tabs */}
        {unpinnedTabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            onClick={() => handleTabClick(tab.id)}
            onClose={(e) => handleTabClose(e, tab.id)}
            onPin={(e) => handleTabPin(e, tab.id, tab.pinned || false)}
            onMute={(e) => handleTabMute(e, tab.id, tab.audible || false)}
            onDragStart={(e) => handleDragStart(e, tab)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, tab)}
            onDragEnd={handleDragEnd}
            isPinned={false}
          />
        ))}
      </div>

      {/* New tab button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-none"
        onClick={handleNewTab}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Tab actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleReopenClosedTab}>
            Reopen Closed Tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => service.closeOthers(activeTabId || '')}>
            Close Other Tabs
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => tabs.forEach(tab => service.close(tab.id))}>
            Close All Tabs
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Scroll buttons */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-none"
        onClick={() => scrollTabs('right')}
      >
        ›
      </Button>
    </div>
  );
}

interface TabProps {
  tab: OmniorTab;
  isActive: boolean;
  isPinned: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  onPin: (e: React.MouseEvent) => void;
  onMute: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function Tab({
  tab,
  isActive,
  isPinned,
  onClick,
  onClose,
  onPin,
  onMute,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: TabProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`
        relative flex items-center h-full min-w-[120px] max-w-[240px] px-3 py-2 cursor-pointer
        border-r border-slate-200 dark:border-slate-700
        transition-all duration-150 ease-in-out
        ${isActive 
          ? 'bg-white dark:bg-slate-900' 
          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
        }
        ${isPinned ? 'border-l border-slate-200 dark:border-slate-700' : ''}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tab favicon */}
      {tab.favicon ? (
        <img 
          src={tab.favicon} 
          alt="" 
          className="w-4 h-4 mr-2 flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-4 h-4 mr-2 flex-shrink-0 bg-slate-300 dark:bg-slate-600 rounded" />
      )}

      {/* Tab title */}
      <span className="flex-1 text-sm font-medium truncate text-slate-900 dark:text-slate-100">
        {tab.title}
      </span>

      {/* Tab controls */}
      <div className="flex items-center gap-1 ml-2">
        {/* Mute button */}
        {tab.audible && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={onMute}
          >
            <Volume2 className="h-3 w-3" />
          </Button>
        )}

        {/* Pin button */}
        {isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={onPin}
          >
            <Pin className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`} />
          </Button>
        )}

        {/* Close button */}
        {(isHovered || isActive) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
      )}
    </div>
  );
}