/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ 
  title, 
  description, 
  actions, 
  className 
}: PanelHeaderProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700',
      className
    )}>
      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}