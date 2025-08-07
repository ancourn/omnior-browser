import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Refresh, Home, Star, Settings, History, BookOpen, Search, Plus, MoreVertical } from 'lucide-react';

interface ToolbarProps {
  onNewTab: () => void;
  onNavigate: (url: string) => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onBookmarksClick: () => void;
  onBookmarkPage: () => void;
  onFindClick: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewTab,
  onNavigate,
  onSettingsClick,
  onHistoryClick,
  onBookmarksClick,
  onBookmarkPage,
  onFindClick
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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