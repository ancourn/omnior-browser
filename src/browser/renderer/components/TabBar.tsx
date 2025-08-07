import React from 'react';
import { X, Plus } from 'lucide-react';
import { Tab } from '../../types';

interface TabBarProps {
  tabs: Tab[];
  activeTab: Tab | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabClick,
  onTabClose,
  onNewTab
}) => {
  const handleTabClick = (tabId: string) => {
    onTabClick(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const getTabTitle = (tab: Tab): string => {
    if (tab.title && tab.title !== 'about:blank') {
      return tab.title;
    }
    if (tab.url && tab.url !== 'about:blank') {
      try {
        const url = new URL(tab.url);
        return url.hostname;
      } catch {
        return tab.url;
      }
    }
    return 'New Tab';
  };

  const getFaviconUrl = (tab: Tab): string => {
    if (tab.favicon) {
      return tab.favicon;
    }
    if (tab.url && tab.url.startsWith('http')) {
      try {
        const url = new URL(tab.url);
        return `${url.origin}/favicon.ico`;
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <div className="tab-bar">
      {/* Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <div className="tab-content">
              {/* Favicon */}
              {tab.isLoading ? (
                <div className="spinner tab-favicon" />
              ) : (
                getFaviconUrl(tab) && (
                  <img
                    src={getFaviconUrl(tab)}
                    alt=""
                    className="tab-favicon"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )
              )}
              
              {/* Title */}
              <span className="tab-title" title={getTabTitle(tab)}>
                {getTabTitle(tab)}
              </span>
              
              {/* Close Button */}
              <button
                className="tab-close"
                onClick={(e) => handleTabClose(e, tab.id)}
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Tab Button */}
      <button
        onClick={onNewTab}
        className="btn btn-ghost p-2"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};