'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdBlockerManager } from './adblocker-manager';
import { Shield, X } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { useAdBlocker } from '@/hooks/use-adblocker';

interface FloatingAdBlockerButtonProps {
  showStats?: boolean;
}

export function FloatingAdBlockerButton({ showStats = false }: FloatingAdBlockerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { getTodayBlockedCount, settings } = useAdBlocker();

  // Keyboard shortcut to toggle panel
  useKeyboardShortcut(['Control', 'KeyB'], () => {
    setIsOpen(prev => !prev);
  });

  const handleClose = () => {
    setIsOpen(false);
  };

  const todayBlocked = getTodayBlockedCount();

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          size="lg"
          className={`fixed bottom-6 right-42 rounded-full w-14 h-14 shadow-lg z-40 ${
            settings.enabled ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
          style={{ right: 'calc(6rem + 176px)' }}
          onClick={() => setIsOpen(true)}
          title="Ad Blocker (Ctrl+B)"
        >
          <div className="relative">
            <Shield className="h-6 w-6" />
            {settings.enabled && showStats && todayBlocked > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-5"
              >
                {todayBlocked > 999 ? '999+' : todayBlocked}
              </Badge>
            )}
          </div>
        </Button>
      )}

      {/* Ad Blocker Manager */}
      <AdBlockerManager
        isOpen={isOpen}
        onClose={handleClose}
      />
    </>
  );
}