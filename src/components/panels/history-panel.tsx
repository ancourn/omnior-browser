/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Trash2, 
  Clock, 
  Globe, 
  MoreVertical,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHistoryStore } from '@/core/history/store';
import type { HistoryEntry } from '@/core/common/models';

interface HistoryPanelProps {
  service: any; // OmniorHistoryService - will be properly typed when imported
}

export function HistoryPanel({ service }: HistoryPanelProps) {
  const { 
    history, 
    isLoading, 
    error, 
    searchQuery, 
    selectedDate,
    setHistory,
    setLoading,
    setError,
    setSearchQuery,
    setSelectedDate
  } = useHistoryStore();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterRange, setFilterRange] = useState<{ from: number; to: number } | null>(null);

  const groupedHistory = useMemo(() => {
    const entries = searchQuery 
      ? service.search(searchQuery, filterRange || undefined)
      : Array.from(history.values()).flat();

    // Group by date
    const grouped = new Map<string, HistoryEntry[]>();
    
    entries.forEach(entry => {
      const date = new Date(entry.visitTime);
      const dateKey = getDateKey(date);
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      
      grouped.get(dateKey)!.push(entry);
    });

    // Sort entries within each day by visit time (newest first)
    grouped.forEach(entries => {
      entries.sort((a, b) => b.visitTime - a.visitTime);
    });

    // Sort date keys (newest first)
    const sortedDateKeys = Array.from(grouped.keys()).sort((a, b) => {
      const dateA = parseDateKey(a);
      const dateB = parseDateKey(b);
      return dateB.getTime() - dateA.getTime();
    });

    return { grouped, sortedDateKeys };
  }, [history, searchQuery, filterRange]);

  const handleClearHistory = async (range?: { from: number; to: number }) => {
    try {
      setLoading(true);
      service.clear(range);
      setShowClearDialog(false);
      setFilterRange(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clear history');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      setFilterRange({
        from: startOfDay.getTime(),
        to: endOfDay.getTime()
      });
    } else {
      setFilterRange(null);
    }
    setShowFilterDialog(false);
  };

  const formatVisitTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const visitDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (visitDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getRelativeDate = (dateKey: string): string => {
    const date = parseDateKey(dateKey);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const parseDateKey = (dateKey: string): Date => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button variant="outline" onClick={() => setError(null)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <div className="flex items-center gap-2">
            <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded"
                      value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleDateFilter(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setShowFilterDialog(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Are you sure you want to clear your browsing history?
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleClearHistory()}
                      className="justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Clear all history
                    </Button>
                    {filterRange && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleClearHistory(filterRange)}
                        className="justify-start"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Clear filtered history
                      </Button>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Active filters */}
        {(selectedDate || searchQuery) && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
            {selectedDate && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedDate.toLocaleDateString()}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                {searchQuery}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setSelectedDate(null);
                setSearchQuery('');
                setFilterRange(null);
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {groupedHistory.sortedDateKeys.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchQuery || selectedDate ? 'No history found' : 'No browsing history yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedHistory.sortedDateKeys.map(dateKey => (
                <div key={dateKey}>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2">
                    {getRelativeDate(dateKey)}
                  </h3>
                  <div className="space-y-2">
                    {groupedHistory.grouped.get(dateKey)!.map(entry => (
                      <HistoryEntryCard
                        key={entry.id}
                        entry={entry}
                        formatTime={formatVisitTime}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HistoryEntryCardProps {
  entry: HistoryEntry;
  formatTime: (timestamp: number) => string;
}

function HistoryEntryCard({ entry, formatTime }: HistoryEntryCardProps) {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  
  React.useEffect(() => {
    if (entry.url) {
      try {
        const url = new URL(entry.url);
        setFaviconUrl(`${url.origin}/favicon.ico`);
      } catch {
        setFaviconUrl('');
      }
    }
  }, [entry.url]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-shadow group">
      <div className="flex-shrink-0">
        {faviconUrl ? (
          <img 
            src={faviconUrl} 
            alt="" 
            className="w-8 h-8 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
            <Globe className="h-4 w-4 text-slate-500" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer">
          {entry.title || entry.url}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {entry.url}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">
            {formatTime(entry.visitTime)}
          </span>
          {entry.durationMs && (
            <span className="text-xs text-slate-400">
              • {Math.round(entry.durationMs / 1000)}s
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => window.open(entry.url, '_blank')}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.316C18.114 15.062 18 14.518 18 14c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Add to Bookmarks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove from History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}