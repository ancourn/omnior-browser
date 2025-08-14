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
import { Brain, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onAuthenticated?: (user: any) => void;
  onGuestMode?: () => void;
}

export function LoginForm({ onAuthenticated, onGuestMode }: LoginFormProps) {
  const { login, startGuestSession, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      await login(email.trim(), password.trim());
      onAuthenticated?.({ email: email.trim(), id: 'user' });
    } catch (error) {
      // Error is already handled by the store
    }
  };

  const handleGuestMode = () => {
    startGuestSession();
    onGuestMode?.();
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
          <p className="text-slate-600 dark:text-slate-400">
            Secure, AI-powered browsing experience
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your personalized browsing experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

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

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-slate-500 dark:text-slate-400">Or</span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleGuestMode}
                disabled={isLoading}
              >
                Continue as Guest
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Don't have an account?{' '}
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Sign up
            </button>
          </p>
          <p className="mt-1">
            <button className="text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
              Forgot password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}