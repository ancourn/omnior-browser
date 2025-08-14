"use client";

import { useState, useEffect } from 'react';
import { Brain, Eye, EyeOff, UserPlus, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { authService } from '@/lib/auth/auth-service';
import { guestModeService } from '@/lib/auth/guest-mode';
import { profileManager } from '@/lib/auth/profile-manager';
import { sessionManager } from '@/lib/auth/session-manager';

interface AuthGatewayProps {
  onAuthenticated: (user: any) => void;
  onGuestMode: () => void;
}

export function AuthGateway({ onAuthenticated, onGuestMode }: AuthGatewayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');

  // Available profiles
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);

  useEffect(() => {
    // Load available profiles
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const profiles = await profileManager.getAllProfiles();
      setAvailableProfiles(profiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login({
        email: loginEmail,
        password: loginPassword
      });

      if (result.success && result.user) {
        // Start session
        sessionManager.startSession(result.user.id, false);
        onAuthenticated(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.register({
        email: registerEmail,
        password: registerPassword
      }, registerName);

      if (result.success && result.user) {
        // Start session
        sessionManager.startSession(result.user.id, false);
        onAuthenticated(result.user);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await guestModeService.startGuestSession();
      sessionManager.startSession('guest', true);
      onGuestMode();
    } catch (error) {
      setError('Failed to start guest mode');
      setIsLoading(false);
    }
  };

  const handleProfileLogin = async (profile: any) => {
    setIsLoading(true);
    setError(null);

    try {
      // For profile login, we need the password
      const password = prompt(`Enter password for ${profile.name}:`);
      if (!password) {
        setIsLoading(false);
        return;
      }

      await profileManager.switchToProfile(profile.id, password);
      
      // Get the user from auth service
      const user = authService.getCurrentUser();
      if (user) {
        sessionManager.startSession(user.id, false);
        onAuthenticated(user);
      } else {
        setError('Failed to load user profile');
      }
    } catch (error) {
      setError('Invalid profile password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Omnior Browser
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Secure, private, AI-powered browsing
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Auth Card */}
        <Card className="shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
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
                    disabled={isLoading || !loginEmail || !loginPassword}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Existing Profiles */}
                {availableProfiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Existing Profiles</span>
                    </div>
                    <div className="space-y-2">
                      {availableProfiles.slice(0, 3).map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => handleProfileLogin(profile)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {profile.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{profile.name}</p>
                              <p className="text-xs text-slate-500">{profile.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {profile.isGuest ? 'Guest' : 'User'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join Omnior Browser for a secure browsing experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      disabled={isLoading}
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
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !registerEmail || !registerPassword || registerPassword !== confirmPassword}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>

          {/* Guest Mode */}
          <div className="p-6 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGuestMode}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Surf as Guest
            </Button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Browse privately without saving any data
            </p>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 All data is encrypted with AES-256-GCM • No passwords stored in plaintext
          </p>
        </div>
      </div>
    </div>
  );
}