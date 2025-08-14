/**
 * Authentication UI Components
 * Modern login/signup interface for Omnior Browser
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Chrome, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginManager, UserProfile } from './LoginManager';
import { ProfileManager, ProfileInfo } from '@/profiles/ProfileManager';

interface AuthUIProps {
  onAuthSuccess?: () => void;
  onGuestMode?: () => void;
}

export function AuthUI({ onAuthSuccess, onGuestMode }: AuthUIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [showProfiles, setShowProfiles] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginManager = LoginManager.getInstance();
  const profileManager = ProfileManager.getInstance();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const profileList = await profileManager.getAllProfiles();
      setProfiles(profileList);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await loginManager.login(loginEmail, loginPassword, keepMeLoggedIn);
      onAuthSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await loginManager.register(signupEmail, signupName, signupPassword);
      
      // Auto-login after successful registration
      await loginManager.login(signupEmail, signupPassword);
      onAuthSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loginManager.startGuestMode();
      onGuestMode?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start guest mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = async (profile: ProfileInfo) => {
    // This would typically open a password dialog
    // For now, we'll just switch to the login tab with the email pre-filled
    setLoginEmail(profile.email);
    setActiveTab('login');
    setShowProfiles(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Chrome className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Omnior Browser
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Secure, AI-powered browsing with your privacy in mind
          </p>
        </div>

        {/* Profiles Quick Access */}
        {profiles.length > 0 && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowProfiles(!showProfiles)}
            >
              <Users className="w-4 h-4 mr-2" />
              {showProfiles ? 'Hide Profiles' : `Quick Access (${profiles.length} profiles)`}
            </Button>

            {showProfiles && (
              <div className="mt-2 space-y-2">
                {profiles.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleProfileSelect(profile)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-slate-500">{profile.email}</div>
                      </div>
                      {profile.isCurrent && (
                        <Badge variant="secondary" className="ml-auto">
                          Current
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Authentication Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Welcome to Omnior
            </CardTitle>
            <CardDescription>
              Sign in to access your encrypted browsing experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keepMeLoggedIn}
                        onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Keep me logged in</span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type={showSignupPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                      >
                        {showSignupPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGuestMode}
                disabled={isLoading}
              >
                <Users className="w-4 h-4 mr-2" />
                Continue as Guest
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Guest mode: No data is saved after you close the browser
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>AES-256 Encryption</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <span>Local Storage</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>Privacy First</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Session Lock Screen Component
 */
interface SessionLockProps {
  onUnlock: (password: string) => Promise<void>;
  userProfile: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function SessionLock({ onUnlock, userProfile }: SessionLockProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onUnlock(password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold">
              {userProfile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <CardTitle>Session Locked</CardTitle>
          <CardDescription>
            Enter your password to unlock {userProfile.name}'s session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Unlocking...' : 'Unlock Session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}