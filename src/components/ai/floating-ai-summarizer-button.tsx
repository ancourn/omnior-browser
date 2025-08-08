'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISummarizerPanel } from './ai-summarizer-panel';
import { Brain, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useAI } from '@/hooks/use-ai';

interface FloatingAISummarizerButtonProps {
  initialText?: string;
}

export function FloatingAISummarizerButton({ initialText }: FloatingAISummarizerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const { usage, canUseCloud, isLocalOnly } = useAI();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'Shift', 'KeyS'], () => {
    setIsOpen(prev => !prev);
  });

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const getButtonColor = () => {
    if (isLocalOnly()) return 'bg-blue-600 hover:bg-blue-700';
    if (canUseCloud()) return 'bg-purple-600 hover:bg-purple-700';
    return 'bg-gray-600 hover:bg-gray-700';
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          size="lg"
          className={`fixed bottom-6 right-42 rounded-full w-14 h-14 shadow-lg z-40 ${getButtonColor()}`}
          style={{ right: 'calc(6rem + 264px)' }}
          onClick={() => setIsOpen(true)}
          title="AI Summarizer (Ctrl+Shift+S)"
        >
          <div className="relative">
            <Brain className="h-6 w-6" />
            {usage && usage.dailyTokens > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-5"
              >
                {usage.dailyTokens > 999 ? '999+' : usage.dailyTokens}
              </Badge>
            )}
          </div>
        </Button>
      )}

      {/* AI Summarizer Panel */}
      <AISummarizerPanel
        isOpen={isOpen}
        onClose={handleClose}
        initialText={initialText || selectedText}
      />
    </>
  );
}