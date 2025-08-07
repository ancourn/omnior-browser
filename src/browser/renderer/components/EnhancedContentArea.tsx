import React, { useEffect, useState } from 'react';
import { Tab } from '../../types';
import { useBrowserStore } from '../store/browserStore';

interface EnhancedContentAreaProps {
  activeTab: Tab | null;
  splitViewEnabled: boolean;
  splitViewOrientation: 'horizontal' | 'vertical';
}

export const EnhancedContentArea: React.FC<EnhancedContentAreaProps> = ({
  activeTab,
  splitViewEnabled,
  splitViewOrientation
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { getLeftTab, getRightTab } = useBrowserStore();

  const leftTab = getLeftTab();
  const rightTab = getRightTab();

  useEffect(() => {
    if (activeTab) {
      setIsLoading(activeTab.isLoading);
    }
  }, [activeTab]);

  const renderTabContent = (tab: Tab | null) => {
    if (!tab) {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <p className="text-muted-foreground">
              Drop a tab here to enable split view
            </p>
          </div>
        </div>
      );
    }

    if (tab.url === 'about:blank') {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">New Tab</h2>
            <p className="text-muted-foreground">
              Enter a URL in the address bar to start browsing
            </p>
          </div>
        </div>
      );
    }

    if (tab.url.startsWith('omnior:')) {
      // Handle internal omnior pages
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {tab.title || 'Omnior Page'}
            </h2>
            <p className="text-muted-foreground">
              Internal Omnior browser page
            </p>
          </div>
        </div>
      );
    }

    // For external URLs, we'll use an iframe for now
    // In a real implementation, this would be a webview
    return (
      <div className="webview-container relative">
        {tab.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="spinner w-8 h-8" />
          </div>
        )}
        <iframe
          src={tab.url}
          className="webview"
          title={tab.title || 'Web Content'}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  };

  const renderSingleView = () => {
    if (!activeTab) {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Omnior</h2>
            <p className="text-muted-foreground mb-6">
              The world's most advanced web browser
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Press Ctrl+T to open a new tab</p>
              <p>• Press Ctrl+L to focus the address bar</p>
              <p>• Press Ctrl+D to bookmark the current page</p>
              <p>• Press Ctrl+F to find on page</p>
              <p>• Enable split view for side-by-side browsing</p>
            </div>
          </div>
        </div>
      );
    }

    return renderTabContent(activeTab);
  };

  const renderSplitView = () => {
    if (!leftTab && !rightTab) {
      return renderSingleView();
    }

    const containerClasses = splitViewOrientation === 'horizontal' 
      ? 'flex flex-row h-full' 
      : 'flex flex-col h-full';

    const paneClasses = splitViewOrientation === 'horizontal'
      ? 'flex-1 border-r border-border last:border-r-0'
      : 'flex-1 border-b border-border last:border-b-0';

    return (
      <div className={containerClasses}>
        {/* Left pane */}
        <div className={paneClasses}>
          {renderTabContent(leftTab)}
        </div>
        
        {/* Right pane */}
        <div className={paneClasses}>
          {renderTabContent(rightTab)}
        </div>
      </div>
    );
  };

  return (
    <div className="content-area">
      {splitViewEnabled ? renderSplitView() : renderSingleView()}
    </div>
  );
};