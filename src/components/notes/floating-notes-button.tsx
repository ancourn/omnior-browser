'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuickNotesPanel } from './quick-notes-panel';
import { FileText, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface FloatingNotesButtonProps {
  profileId?: string;
}

export function FloatingNotesButton({ profileId }: FloatingNotesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyN'], () => {
    setIsOpen(prev => !prev);
  });

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-40"
          onClick={() => setIsOpen(true)}
          title="Quick Notes (Ctrl+N)"
        >
          <FileText className="h-6 w-6" />
        </Button>
      )}

      {/* Quick Notes Panel */}
      <QuickNotesPanel
        isOpen={isOpen}
        onClose={handleClose}
        profileId={profileId}
      />
    </>
  );
}