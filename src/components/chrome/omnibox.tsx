/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Home, 
  Search, 
  Star,
  Lock,
  MoreVertical,
  X
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
import { useTabsStore } from '@/core/tabs/store';

interface OmniboxProps {
  service: any; // OmniorTabService - will be properly typed when imported
}

export function Omnibox({ service }: OmniboxProps) {
  const { activeTabId, tabs } = useTabsStore();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setUrl(activeTab.url);
    }
  }, [activeTab]);

  const handleNavigate = (direction: 'back' | 'forward') => {
    // Mock navigation - in real implementation would integrate with browser engine
    console.log(`Navigating ${direction}`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Mock refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleHome = () => {
    service.create({ url: 'about:home' });
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let finalUrl = url.trim();
    
    // Add https:// if no protocol and contains a dot
    if (!finalUrl.includes('://') && finalUrl.includes('.')) {
      finalUrl = `https://${finalUrl}`;
    }
    
    // Search if no protocol and no dot
    if (!finalUrl.includes('://') && !finalUrl.includes('.')) {
      finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
    }

    if (activeTab) {
      service.update(activeTab.id, { url: finalUrl, title: finalUrl });
    } else {
      service.create({ url: finalUrl });
    }
    
    setShowSuggestions(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    
    // Generate mock suggestions
    if (value.length > 0) {
      const mockSuggestions = [
        `https://duckduckgo.com/?q=${encodeURIComponent(value)}`,
        `https://www.google.com/search?q=${encodeURIComponent(value)}`,
        `https://${value}.com`,
        `https://www.${value}.com`,
      ];
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUrl(suggestion);
    setShowSuggestions(false);
    
    if (activeTab) {
      service.update(activeTab.id, { url: suggestion, title: suggestion });
    } else {
      service.create({ url: suggestion });
    }
  };

  const handleBookmark = () => {
    if (activeTab) {
      // Mock bookmark action - would integrate with bookmarks service
      console.log('Bookmarking:', activeTab.url);
    }
  };

  const getSecurityIcon = () => {
    if (!activeTab?.url) return null;
    
    if (activeTab.url.startsWith('https://')) {
      return <Lock className="h-4 w-4 text-green-600" />;
    } else if (activeTab.url.startsWith('http://')) {
      return <Lock className="h-4 w-4 text-red-600" />;
    }
    
    return null;
  };

  const getDomain = () => {
    if (!activeTab?.url) return '';
    
    try {
      const url = new URL(activeTab.url);
      return url.hostname;
    } catch {
      return activeTab.url;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleNavigate('back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => handleNavigate('forward')}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleHome}
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      {/* Omnibox */}
      <div className="flex-1 relative">
        <form onSubmit={handleUrlSubmit} className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {getSecurityIcon()}
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onFocus={() => setShowSuggestions(url.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search or enter website name"
            className="pl-12 pr-10 h-8 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-full"
          />
          
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setUrl('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search className="inline h-3 w-3 mr-2 text-slate-400" />
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleBookmark}
          disabled={!activeTab}
        >
          <Star className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              New Window
            </DropdownMenuItem>
            <DropdownMenuItem>
              New Incognito Window
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Bookmarks
            </DropdownMenuItem>
            <DropdownMenuItem>
              History
            </DropdownMenuItem>
            <DropdownMenuItem>
              Downloads
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              Help
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile badge */}
        <Badge variant="secondary" className="h-6 px-2 text-xs">
          Profile
        </Badge>
      </div>

      {/* Domain display */}
      {activeTab && (
        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-32 truncate">
          {getDomain()}
        </div>
      )}
    </div>
  );
}