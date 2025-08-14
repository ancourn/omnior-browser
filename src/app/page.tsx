/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Browser } from '@/components/browser';
import { serviceFactory } from '@/lib/service-factory';
import { useAuthStore } from '@/lib/auth/store';
import { LoginForm } from '@/components/auth/login-form';
import { SessionLockScreen } from '@/components/auth/session-lock-screen';

export default function Home() {
  const { isAuthenticated, isSessionLocked, checkSession } = useAuthStore();
  const [services, setServices] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeBrowser = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the authentication system first
        await authService.initialize();
        await checkSession();
        
        if (isAuthenticated) {
          const browserServices = await serviceFactory.initializeServices();
          setServices(browserServices);
        }
      } catch (error) {
        console.error('Failed to initialize browser:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBrowser();
  }, [isAuthenticated, checkSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Initializing Omnior Browser...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (isSessionLocked) {
    return <SessionLockScreen />;
  }

  if (!services) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to initialize browser services</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <Browser services={services} />;
}