import React, { useState, useRef } from 'react';
import { X, Plus, Search, LayoutGrid, LayoutList, Columns, GripVertical, MoreVertical } from 'lucide-react';
import { Tab, TabGroup } from '../../types';
import { useBrowserStore } from '../store/browserStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VPNManager } from './VPNManager';
import { TranslationManager } from './TranslationManager';

interface EnhancedTabBarProps {
  tabs: Tab[];
  activeTab: Tab | null;
  tabGroups: TabGroup[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  layout: 'horizontal' | 'vertical';
  onLayoutChange: (layout: 'horizontal' | 'vertical') => void;
  onToggleSplitView: () => void;
  splitViewEnabled: boolean;
}

export const EnhancedTabBar: React.FC<EnhancedTabBarProps> = ({
  tabs,
  activeTab,
  tabGroups,
  onTabClick,
  onTabClose,
  onNewTab,
  layout,
  onLayoutChange,
  onToggleSplitView,
  splitViewEnabled
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { addTabToGroup, removeTabFromGroup, addTabGroup, setSplitViewTabs } = useBrowserStore();

  // Focus search input when shown
  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleTabClick = (tabId: string) => {
    onTabClick(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string | null = null) => {
    e.preventDefault();
    if (!draggedTab) return;

    // Handle split view drop
    if (splitViewEnabled && targetTabId) {
      const targetTab = tabs.find(tab => tab.id === targetTabId);
      const draggedTabData = tabs.find(tab => tab.id === draggedTab);
      
      if (targetTab && draggedTabData) {
        // Determine drop position (left or right side)
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftSide = e.clientX - rect.left < rect.width / 2;
        
        if (isLeftSide) {
          setSplitViewTabs(draggedTab, targetTabId);
        } else {
          setSplitViewTabs(targetTabId, draggedTab);
        }
      }
    }

    setDraggedTab(null);
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

  const getTabGroup = (tab: Tab): TabGroup | null => {
    if (!tab.groupId) return null;
    return tabGroups.find(group => group.id === tab.groupId) || null;
  };

  const filteredTabs = tabs.filter(tab => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      getTabTitle(tab).toLowerCase().includes(query) ||
      (tab.url && tab.url.toLowerCase().includes(query))
    );
  });

  const groupedTabs = tabGroups.reduce((acc, group) => {
    const groupTabs = filteredTabs.filter(tab => tab.groupId === group.id);
    if (groupTabs.length > 0) {
      acc[group.id] = groupTabs;
    }
    return acc;
  }, {} as Record<string, Tab[]>);

  const ungroupedTabs = filteredTabs.filter(tab => !tab.groupId);

  const handleCreateGroup = () => {
    const selectedTabs = tabs.filter(tab => tab.isActive);
    if (selectedTabs.length === 0) return;

    const groupId = `group-${Date.now()}`;
    const newGroup: TabGroup = {
      id: groupId,
      name: `Group ${tabGroups.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      tabIds: selectedTabs.map(tab => tab.id),
      createdAt: Date.now()
    };

    addTabGroup(newGroup);
    selectedTabs.forEach(tab => addTabToGroup(tab.id, groupId));
  };

  const TabItem: React.FC<{ tab: Tab; isDragging?: boolean }> = ({ tab, isDragging }) => {
    const group = getTabGroup(tab);
    
    return (
      <div
        key={tab.id}
        className={`tab ${tab.isActive ? 'active' : ''} ${isDragging ? 'opacity-50' : ''} ${
          layout === 'vertical' ? 'vertical-tab' : ''
        }`}
        onClick={() => handleTabClick(tab.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, tab.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, tab.id)}
      >
        <div className="tab-content">
          {/* Group indicator */}
          {group && (
            <div 
              className="tab-group-indicator"
              style={{ backgroundColor: group.color }}
              title={group.name}
            />
          )}
          
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
          
          {/* VPN Manager */}
          <VPNManager tabId={tab.id} className="ml-1" />
          
          {/* Translation Manager */}
          <TranslationManager tabId={tab.id} className="ml-1" />
          
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
    );
  };

  const TabGroupItem: React.FC<{ group: TabGroup; groupTabs: Tab[] }> = ({ group, groupTabs }) => (
    <div className="tab-group">
      <div className="tab-group-header" style={{ backgroundColor: group.color }}>
        <span className="tab-group-name">{group.name}</span>
        <span className="tab-group-count">{groupTabs.length}</span>
      </div>
      <div className="tab-group-content">
        {groupTabs.map(tab => (
          <TabItem key={tab.id} tab={tab} />
        ))}
      </div>
    </div>
  );

  if (layout === 'vertical') {
    return (
      <div className="vertical-tab-bar">
        {/* Header */}
        <div className="vertical-tab-header">
          <div className="vertical-tab-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewTab}
              title="New Tab"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              title="Search Tabs"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSplitView}
              title={splitViewEnabled ? "Disable Split View" : "Enable Split View"}
            >
              <Columns className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onLayoutChange('horizontal')}>
                  <LayoutList className="w-4 h-4 mr-2" />
                  Horizontal Tabs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCreateGroup}>
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Create Group from Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {showSearch && (
            <div className="vertical-tab-search">
              <Input
                ref={searchInputRef}
                placeholder="Search tabs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tab-search-input"
              />
            </div>
          )}
        </div>
        
        {/* Tabs Content */}
        <div className="vertical-tab-content">
          {/* Tab Groups */}
          {Object.entries(groupedTabs).map(([groupId, groupTabs]) => {
            const group = tabGroups.find(g => g.id === groupId);
            if (!group) return null;
            return <TabGroupItem key={groupId} group={group} groupTabs={groupTabs} />;
          })}
          
          {/* Ungrouped Tabs */}
          {ungroupedTabs.map(tab => (
            <TabItem key={tab.id} tab={tab} />
          ))}
          
          {filteredTabs.length === 0 && (
            <div className="vertical-tab-empty">
              No tabs found
            </div>
          )}
        </div>
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className="tab-bar">
      {/* Controls */}
      <div className="tab-controls">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
          title="Search Tabs"
        >
          <Search className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSplitView}
          title={splitViewEnabled ? "Disable Split View" : "Enable Split View"}
        >
          <Columns className="w-4 h-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onLayoutChange('vertical')}>
              <LayoutList className="w-4 h-4 mr-2" />
              Vertical Tabs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateGroup}>
              <LayoutGrid className="w-4 h-4 mr-2" />
              Create Group from Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search Bar */}
      {showSearch && (
        <div className="tab-search-container">
          <Input
            ref={searchInputRef}
            placeholder="Search tabs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tab-search-input"
          />
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto">
        {/* Tab Groups */}
        {Object.entries(groupedTabs).map(([groupId, groupTabs]) => {
          const group = tabGroups.find(g => g.id === groupId);
          if (!group) return null;
          return (
            <div key={groupId} className="horizontal-tab-group">
              <div 
                className="horizontal-tab-group-header"
                style={{ backgroundColor: group.color }}
              >
                <span className="horizontal-tab-group-name">{group.name}</span>
                <span className="horizontal-tab-group-count">{groupTabs.length}</span>
              </div>
              <div className="horizontal-tab-group-content">
                {groupTabs.map(tab => (
                  <TabItem key={tab.id} tab={tab} />
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Ungrouped Tabs */}
        {ungroupedTabs.map(tab => (
          <TabItem key={tab.id} tab={tab} />
        ))}
      </div>

      {/* New Tab Button */}
      <Button
        onClick={onNewTab}
        variant="ghost"
        size="sm"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};