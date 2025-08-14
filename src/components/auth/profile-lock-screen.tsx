/**
 * Profile Lock Screen Component
 * Displays when a profile is auto-locked or manually locked
 * Requires authentication to unlock the profile
 */

'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Clock, 
  AlertCircle,
  Shield,
  LogOut,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileManager, ProfileMetadata } from '@/auth/ProfileManager';

interface ProfileLockScreenProps {
  profileManager: ProfileManager;
  profileMetadata: ProfileMetadata;
  onUnlock: () => void;
  onSwitchProfile: () => void;
  onLogout: () => void;
  lockReason?: 'auto' | 'manual' | 'switch';
  remainingTime?: number; // For auto-lock countdown
}

export function ProfileLockScreen({
  profileManager,
  profileMetadata,
  onUnlock,
  onSwitchProfile,
  onLogout,
  lockReason = 'manual',
  remainingTime
}: ProfileLockScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 30000; // 30 seconds

  React.useEffect(() => {
    // Check for existing lockout
    const lockoutData = localStorage.getItem(`profile_lockout_${profileMetadata.id}`);
    if (lockoutData) {
      const { timestamp, attempts } = JSON.parse(lockoutData);
      const timeSinceLockout = Date.now() - timestamp;
      
      if (timeSinceLockout < LOCKOUT_DURATION) {
        setIsLockedOut(true);
        setLockoutTime(LOCKOUT_DURATION - timeSinceLockout);
        setAttempts(attempts);
      } else {
        // Lockout expired
        localStorage.removeItem(`profile_lockout_${profileMetadata.id}`);
      }
    }
  }, [profileMetadata.id]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLockedOut && lockoutTime > 0) {
      timer = setTimeout(() => {
        setLockoutTime(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            setIsLockedOut(false);
            localStorage.removeItem(`profile_lockout_${profileMetadata.id}`);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLockedOut, lockoutTime]);

  const handleUnlock = async () => {
    if (isLockedOut) {
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsUnlocking(true);
    setError('');

    try {
      // Attempt to unlock the profile
      const profile = profileManager.getProfile(profileMetadata.id);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Try to switch to the profile (which authenticates)
      await profileManager.switchProfile(profileMetadata.id, password);
      
      // Clear lockout data on successful unlock
      localStorage.removeItem(`profile_lockout_${profileMetadata.id}`);
      setAttempts(0);
      
      // Call unlock callback
      onUnlock();
      
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock out the user
        setIsLockedOut(true);
        setLockoutTime(LOCKOUT_DURATION);
        
        // Store lockout data
        localStorage.setItem(`profile_lockout_${profileMetadata.id}`, JSON.stringify({
          timestamp: Date.now(),
          attempts: newAttempts
        }));
        
        setError(`Too many failed attempts. Please wait ${Math.ceil(LOCKOUT_DURATION / 1000)} seconds before trying again.`);
      } else {
        setError(`Invalid password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSwitchProfile = () => {
    onSwitchProfile();
  };

  const handleLogout = () => {
    onLogout();
  };

  const getLockReasonMessage = () => {
    switch (lockReason) {
      case 'auto':
        return 'Profile locked due to inactivity';
      case 'switch':
        return 'Profile locked for switching';
      default:
        return 'Profile is locked';
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  if (isLockedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-xl">Profile Locked</CardTitle>
            <CardDescription>
              Too many failed unlock attempts. Please wait before trying again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
                {formatTime(lockoutTime)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Time remaining
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={handleSwitchProfile}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Switch Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-xl">Profile Locked</CardTitle>
          <CardDescription>
            {getLockReasonMessage()}
            {remainingTime !== undefined && (
              <span className="block mt-1 text-sm">
                Auto-lock in: {formatTime(remainingTime)}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Profile Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{profileMetadata.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {profileMetadata.isGuest ? 'Guest Session' : 'Secure Profile'}
              </div>
            </div>
            {profileMetadata.isGuest && (
              <Badge variant="secondary">Guest</Badge>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="unlockPassword">Enter Password</Label>
            <div className="relative">
              <Input
                id="unlockPassword"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your profile password"
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                className="pr-10"
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

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Attempt Counter */}
          {attempts > 0 && (
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Attempts remaining: {MAX_ATTEMPTS - attempts}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleUnlock} 
              disabled={isUnlocking || !password.trim() || isLockedOut}
              className="w-full"
            >
              {isUnlocking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock Profile
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={handleSwitchProfile}
                disabled={isUnlocking}
              >
                <Users className="h-4 w-4 mr-2" />
                Switch
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={isUnlocking}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Shield className="h-3 w-3" />
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Props for the lock screen overlay (when browser is already running)
interface ProfileLockOverlayProps {
  profileManager: ProfileManager;
  profileMetadata: ProfileMetadata;
  onUnlock: () => void;
  onSwitchProfile: () => void;
  onLogout: () => void;
  lockReason?: 'auto' | 'manual' | 'switch';
}

export function ProfileLockOverlay({
  profileManager,
  profileMetadata,
  onUnlock,
  onSwitchProfile,
  onLogout,
  lockReason = 'manual'
}: ProfileLockOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ProfileLockScreen
          profileManager={profileManager}
          profileMetadata={profileMetadata}
          onUnlock={onUnlock}
          onSwitchProfile={onSwitchProfile}
          onLogout={onLogout}
          lockReason={lockReason}
        />
      </div>
    </div>
  );
}