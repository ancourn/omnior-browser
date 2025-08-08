'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QuickTranslate } from './quick-translate';
import { Languages, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface FloatingTranslateButtonProps {
  initialText?: string;
}

export function FloatingTranslateButton({ initialText }: FloatingTranslateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyT'], () => {
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

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-42 rounded-full w-14 h-14 shadow-lg z-40"
          style={{ right: 'calc(6rem + 88px)' }}
          onClick={() => setIsOpen(true)}
          title="Quick Translate (Ctrl+T)"
        >
          <Languages className="h-6 w-6" />
        </Button>
      )}

      {/* Quick Translate Panel */}
      <QuickTranslate
        isOpen={isOpen}
        onClose={handleClose}
        initialText={initialText || selectedText}
      />
    </>
  );
}