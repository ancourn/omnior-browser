import React, { useEffect, useState } from 'react';
import { Tab } from '../../types';

interface ContentAreaProps {
  activeTab: Tab | null;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ activeTab }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab) {
      setIsLoading(activeTab.isLoading);
    }
  }, [activeTab]);

  const renderContent = () => {
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
            </div>
          </div>
        </div>
      );
    }

    if (activeTab.url === 'about:blank') {
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

    if (activeTab.url.startsWith('omnior:')) {
      // Handle internal omnior pages
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {activeTab.title || 'Omnior Page'}
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
      <div className="webview-container">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="spinner w-8 h-8" />
          </div>
        )}
        <iframe
          src={activeTab.url}
          className="webview"
          title={activeTab.title || 'Web Content'}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  };

  return (
    <div className="content-area">
      {renderContent()}
    </div>
  );
};