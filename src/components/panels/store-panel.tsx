/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useEffect } from 'react';
import StoreManager from '@/components/store/StoreManager';

interface StorePanelProps {
  service: any; // We'll define proper service interface later
}

export function StorePanel({ service }: StorePanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Omnior Store
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage extensions and tools
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        <StoreManager />
      </div>
    </div>
  );
}