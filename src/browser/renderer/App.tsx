import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tab, BrowserSettings } from '../types';
import { useBrowserStore } from './store/browserStore';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/TabBar';
import { BookmarksBar } from './components/BookmarksBar';
import { ContentArea } from './components/ContentArea';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { BookmarksModal } from './components/BookmarksModal';
import { FindBar } from './components/FindBar';
import { useElectronAPI } from './hooks/useElectronAPI';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showBookmarksBar, setShowBookmarksBar] = useState(false);
  
  const { 
    tabs, 
    activeTab, 
    settings, 
    setSettings, 
    addTab, 
    removeTab, 
    activateTab, 
    updateTab 
  } = useBrowserStore();
  
  const electronAPI = useElectronAPI();
  const queryClient = useQueryClient();

  // Fetch initial data
  const { data: initialTabs } = useQuery({
    queryKey: ['tabs'],
    queryFn: () => electronAPI.getTabs(),
    initialData: []
  });

  const { data: initialSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => electronAPI.getSettings(),
    initialData: null
  });

  // Initialize tabs from main process
  useEffect(() => {
    if (initialTabs.length > 0) {
      initialTabs.forEach(tab => {
        addTab(tab);
      });
    }
  }, [initialTabs, addTab]);

  // Initialize settings from main process
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      setShowBookmarksBar(initialSettings.alwaysShowBookmarksBar);
    }
  }, [initialSettings, setSettings]);

  // Set up event listeners
  useEffect(() => {
    const handleTabCreated = (tab: Tab) => {
      addTab(tab);
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    };

    const handleTabUpdated = (data: { id: string; updates: Partial<Tab> }) => {
      updateTab(data.id, data.updates);
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    };

    const handleTabClosed = (tabId: string) => {
      removeTab(tabId);
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    };

    const handleTabActivated = (tab: Tab) => {
      activateTab(tab.id);
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    };

    const handleTabNavigate = (data: { id: string; url: string }) => {
      updateTab(data.id, { url: data.url, isLoading: true });
      queryClient.invalidateQueries({ queryKey: ['tabs'] });
    };

    // Register event listeners
    electronAPI.onTabCreated(handleTabCreated);
    electronAPI.onTabUpdated(handleTabUpdated);
    electronAPI.onTabClosed(handleTabClosed);
    electronAPI.onTabActivated(handleTabActivated);
    electronAPI.onTabNavigate(handleTabNavigate);

    // Set up keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + T: New tab
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        handleNewTab();
      }
      
      // Ctrl/Cmd + W: Close tab
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        if (activeTab) {
          handleRemoveTab(activeTab.id);
        }
      }
      
      // Ctrl/Cmd + F: Find
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowFindBar(!showFindBar);
      }
      
      // Ctrl/Cmd + L: Focus address bar
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        const addressBar = document.querySelector('[data-address-bar]');
        if (addressBar instanceof HTMLElement) {
          addressBar.focus();
        }
      }
      
      // Ctrl/Cmd + D: Bookmark page
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        handleBookmarkPage();
      }
      
      // Ctrl/Cmd + H: Show history
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        setShowHistory(!showHistory);
      }
      
      // Ctrl/Cmd + B: Toggle bookmarks bar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setShowBookmarksBar(!showBookmarksBar);
      }
      
      // Ctrl/Cmd + ,: Settings
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        setShowSettings(!showSettings);
      }
      
      // Escape: Close modals and find bar
      if (event.key === 'Escape') {
        setShowSettings(false);
        setShowHistory(false);
        setShowBookmarks(false);
        setShowFindBar(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      electronAPI.removeAllListeners('tab-created');
      electronAPI.removeAllListeners('tab-updated');
      electronAPI.removeAllListeners('tab-closed');
      electronAPI.removeAllListeners('tab-activated');
      electronAPI.removeAllListeners('tab-navigate');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [electronAPI, addTab, removeTab, activateTab, updateTab, activeTab, showFindBar, showBookmarksBar, queryClient]);

  const handleNewTab = async () => {
    await electronAPI.createTab({ active: true });
  };

  const handleRemoveTab = async (tabId: string) => {
    await electronAPI.removeTab({ id: tabId });
  };

  const handleNavigate = async (url: string) => {
    if (!activeTab) return;
    
    // Add https:// if no protocol is specified
    let navigableUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      navigableUrl = `https://${url}`;
    }
    
    await electronAPI.navigateTab({ id: activeTab.id, url: navigableUrl });
  };

  const handleBookmarkPage = async () => {
    if (!activeTab || !activeTab.url || activeTab.url === 'about:blank') return;
    
    try {
      await electronAPI.createBookmark({
        url: activeTab.url,
        title: activeTab.title || 'Untitled'
      });
    } catch (error) {
      console.error('Failed to bookmark page:', error);
    }
  };

  const handleSettingsSave = async (newSettings: Partial<BrowserSettings>) => {
    try {
      const updatedSettings = await electronAPI.updateSettings({ settings: newSettings });
      setSettings(updatedSettings);
      setShowBookmarksBar(updatedSettings.alwaysShowBookmarksBar);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <Toolbar
        onNewTab={handleNewTab}
        onNavigate={handleNavigate}
        onSettingsClick={() => setShowSettings(true)}
        onHistoryClick={() => setShowHistory(true)}
        onBookmarksClick={() => setShowBookmarks(true)}
        onBookmarkPage={handleBookmarkPage}
        onFindClick={() => setShowFindBar(!showFindBar)}
      />

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={activateTab}
        onTabClose={handleRemoveTab}
        onNewTab={handleNewTab}
      />

      {/* Bookmarks Bar */}
      {(showBookmarksBar || settings?.alwaysShowBookmarksBar) && (
        <BookmarksBar onBookmarkClick={handleNavigate} />
      )}

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <ContentArea activeTab={activeTab} />
        
        {/* Find Bar */}
        {showFindBar && (
          <FindBar onClose={() => setShowFindBar(false)} />
        )}
      </div>

      {/* Modals */}
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onNavigate={handleNavigate}
        />
      )}

      {showBookmarks && (
        <BookmarksModal
          onClose={() => setShowBookmarks(false)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default App;