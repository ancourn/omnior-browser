/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ContentAnalysisPanel } from '@/components/ai/content-analysis-panel';
import { PanelHeader } from '@/components/ui/panel-header';
import { Panel } from '@/components/ui/panel';

export function ContentAnalysisPanel() {
  const [selectedText, setSelectedText] = useState('');

  // Handle text selection from the current tab
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  }, []);

  // Clear selected text
  const handleClearSelection = useCallback(() => {
    setSelectedText('');
  }, []);

  React.useEffect(() => {
    // Listen for text selection events
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keyup', handleTextSelection);
    };
  }, [handleTextSelection]);

  return (
    <Panel className="h-full flex flex-col">
      <PanelHeader
        title="Content Analysis"
        description="AI-powered content analysis and summarization"
        actions={
          selectedText && (
            <button
              onClick={handleClearSelection}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Clear Selection
            </button>
          )
        }
      />
      
      <div className="flex-1 overflow-hidden">
        <ContentAnalysisPanel 
          initialContent={selectedText}
          onAnalysisComplete={(result) => {
            console.log('Analysis complete:', result);
          }}
        />
      </div>
    </Panel>
  );
}