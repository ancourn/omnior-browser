"use client";

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { authService } from '@/lib/auth/auth-service';
import { sessionManager, useSessionManager } from '@/lib/auth/session-manager';

interface SessionLockProps {
  onUnlock: () => void;
  onLogout: () => void;
}

export function SessionLock({ onUnlock, onLogout }: SessionLockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const { sessionState } = useSessionManager();

  useEffect(() => {
    // Update time remaining
    const timer = setInterval(() => {
      setTimeRemaining(Math.max(0, sessionState.timeRemaining));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState.timeRemaining]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setError('No user session found');
        setIsLoading(false);
        return;
      }

      const success = await authService.reauthenticate(password);
      if (success) {
        sessionManager.updateActivity();
        onUnlock();
      } else {
        setError('Invalid password');
      }
    } catch (error) {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    sessionManager.endSession();
    onLogout();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Session Locked
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter your password to continue browsing
          </p>
        </div>

        {/* User Info */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <Badge variant={user.isGuest ? "secondary" : "default"}>
                  {user.isGuest ? "Guest" : "User"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Remaining */}
        {timeRemaining > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Session expires in:</span>
                <Badge variant="outline" className="ml-auto">
                  {formatTime(timeRemaining)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Unlock Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Unlock Session</CardTitle>
            <CardDescription>
              Your session was locked due to inactivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !password}
              >
                {isLoading ? 'Unlocking...' : 'Unlock Session'}
              </Button>
            </form>

            {/* Logout Option */}
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
                disabled={isLoading}
              >
                Switch User / Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 Your data remains encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}