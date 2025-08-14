/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm',
      className
    )}>
      {children}
    </div>
  );
}