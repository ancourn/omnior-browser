'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TabGroupsManager } from './tab-groups-manager';
import { FolderOpen, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface FloatingTabGroupsButtonProps {
  windowId?: string;
}

export function FloatingTabGroupsButton({ windowId }: FloatingTabGroupsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyG'], () => {
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
          className="fixed bottom-6 right-24 rounded-full w-14 h-14 shadow-lg z-40"
          onClick={() => setIsOpen(true)}
          title="Tab Groups Manager (Ctrl+G)"
        >
          <FolderOpen className="h-6 w-6" />
        </Button>
      )}

      {/* Tab Groups Manager */}
      <TabGroupsManager
        isOpen={isOpen}
        onClose={handleClose}
        windowId={windowId}
      />
    </>
  );
}