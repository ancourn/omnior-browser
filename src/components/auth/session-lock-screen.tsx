/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Lock, Eye, EyeOff } from 'lucide-react';

export function SessionLockScreen() {
  const { unlockSession, logout, isLoading, error, user } = useAuthStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      return;
    }

    try {
      await unlockSession(password.trim());
      setPassword('');
    } catch (error) {
      // Error is already handled by the store
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Omnior Browser
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-yellow-600" />
            <p className="text-slate-600 dark:text-slate-400">
              Session Locked
            </p>
          </div>
        </div>

        {/* Unlock Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Unlock Session</CardTitle>
            <CardDescription>
              {user ? `Welcome back, ${user.name || user.email}!` : 'Welcome back!'}
              <br />
              Enter your password to continue browsing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !password.trim()}
                >
                  {isLoading ? 'Unlocking...' : 'Unlock'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your session was locked due to inactivity. This helps protect your browsing data and privacy.
          </p>
        </div>
      </div>
    </div>
  );
}