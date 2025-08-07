import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Refresh, Home, Star, Settings, History, BookOpen, Search, Plus, MoreVertical, Bot, Shield, Globe, Wrench } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { SmartShortcuts } from './SmartShortcuts';

interface ToolbarProps {
  onNewTab: () => void;
  onNavigate: (url: string) => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onBookmarksClick: () => void;
  onBookmarkPage: () => void;
  onFindClick: () => void;
  onAIAssistantClick: () => void;
  onDevConsoleClick: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewTab,
  onNavigate,
  onSettingsClick,
  onHistoryClick,
  onBookmarksClick,
  onBookmarkPage,
  onFindClick,
  onAIAssistantClick,
  onDevConsoleClick
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { tabs, activeTab } = useBrowserStore();

  // Calculate VPN status
  const vpnEnabledTabs = tabs.filter(tab => tab.vpnEnabled).length;
  const totalTabs = tabs.length;
  const activeTabVPN = activeTab?.vpnEnabled;
  const activeTabVPNCountry = activeTab?.vpnCountry;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onNavigate(url.trim());
      setIsLoading(true);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  // Update URL when page changes
  useEffect(() => {
    const updateUrl = () => {
      setUrl(window.location.href);
      setIsLoading(false);
    };

    window.addEventListener('popstate', updateUrl);
    updateUrl();

    return () => {
      window.removeEventListener('popstate', updateUrl);
    };
  }, []);

  return (
    <div className="toolbar">
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          className="btn btn-ghost p-2"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleForward}
          className="btn btn-ghost p-2"
          title="Forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleRefresh}
          className="btn btn-ghost p-2"
          title="Refresh"
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <Refresh className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onNavigate('about:blank')}
          className="btn btn-ghost p-2"
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Address Bar */}
      <form onSubmit={handleNavigate} className="address-bar">
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Search or enter website name"
          className="outline-none flex-1"
          data-address-bar
        />
      </form>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Smart Shortcuts */}
        <SmartShortcuts />
        
        {/* VPN Status Indicator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`vpn-status-indicator ${
                activeTabVPN ? 'vpn-status-connected' : 'vpn-status-disconnected'
              }`}
              title={`VPN: ${activeTabVPN ? `Connected to ${activeTabVPNCountry}` : 'Disconnected'}`}
            >
              <Shield className="w-4 h-4" />
              {vpnEnabledTabs > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {vpnEnabledTabs}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="p-3">
              <h4 className="font-medium mb-2">VPN Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Active Connections:</span>
                  <Badge variant={vpnEnabledTabs > 0 ? "default" : "secondary"}>
                    {vpnEnabledTabs} / {totalTabs}
                  </Badge>
                </div>
                {activeTabVPN && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Globe className="w-4 h-4" />
                    <span>Current tab: {activeTabVPNCountry}</span>
                  </div>
                )}
                {vpnEnabledTabs === 0 && (
                  <div className="text-muted-foreground">
                    No VPN connections active
                  </div>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Toggle VPN for all tabs
                  const allVPNEnabled = vpnEnabledTabs === totalTabs;
                  tabs.forEach(tab => {
                    // This would need to be implemented in the store
                    // For now, it's just a UI demonstration
                  });
                }}
              >
                {vpnEnabledTabs === totalTabs ? 'Disconnect All' : 'Connect All'}
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <button
          onClick={onFindClick}
          className="btn btn-ghost p-2"
          title="Find"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={onBookmarkPage}
          className="btn btn-ghost p-2"
          title="Bookmark Page"
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          onClick={onBookmarksClick}
          className="btn btn-ghost p-2"
          title="Bookmarks"
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button
          onClick={onHistoryClick}
          className="btn btn-ghost p-2"
          title="History"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onAIAssistantClick}
          className="btn btn-ghost p-2"
          title="AI Assistant (Ctrl+Shift+A)"
        >
          <Bot className="w-4 h-4" />
        </button>
        <button
          onClick={onDevConsoleClick}
          className="btn btn-ghost p-2"
          title="DevConsole (Ctrl+Shift+D)"
        >
          <Wrench className="w-4 h-4" />
        </button>
        <button
          onClick={onNewTab}
          className="btn btn-ghost p-2"
          title="New Tab"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={onSettingsClick}
            className="btn btn-ghost p-2"
            title="Settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};