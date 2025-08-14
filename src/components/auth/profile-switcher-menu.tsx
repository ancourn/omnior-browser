/**
 * Profile Switcher Menu Component
 * Toolbar dropdown for profile switching and management
 */

'use client';

import React, { useState } from 'react';
import { 
  User, 
  Users, 
  Plus, 
  Settings, 
  Lock,
  LogOut,
  Shield,
  Clock,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Guest
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileManager, ProfileMetadata } from '@/auth/ProfileManager';

interface ProfileSwitcherMenuProps {
  profileManager: ProfileManager;
  activeProfile: ProfileMetadata | null;
  onProfileSwitch: (profileId: string, password: string) => Promise<void>;
  onProfileLock: () => Promise<void>;
  onProfileCreate: (name: string, password: string, options?: any) => Promise<string>;
  onProfileDelete: (profileId: string) => Promise<void>;
  onGuestCreate: () => Promise<string>;
  onLogout: () => void;
}

export function ProfileSwitcherMenu({
  profileManager,
  activeProfile,
  onProfileSwitch,
  onProfileLock,
  onProfileCreate,
  onProfileDelete,
  onGuestCreate,
  onLogout
}: ProfileSwitcherMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileMetadata | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileConfirmPassword, setNewProfileConfirmPassword] = useState('');
  const [deleteProfilePassword, setDeleteProfilePassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState<ProfileMetadata[]>([]);

  React.useEffect(() => {
    loadProfiles();
  }, [profileManager]);

  const loadProfiles = () => {
    try {
      const allProfiles = profileManager.getProfiles();
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Profile name is required');
      return;
    }

    if (!newProfilePassword) {
      setError('Password is required');
      return;
    }

    if (newProfilePassword !== newProfileConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onProfileCreate(newProfileName.trim(), newProfilePassword, {
        autoLockMinutes: 30
      });

      // Reset form
      setNewProfileName('');
      setNewProfilePassword('');
      setNewProfileConfirmPassword('');
      setIsCreateDialogOpen(false);
      
      // Reload profiles
      loadProfiles();
    } catch (error) {
      setError(`Failed to create profile: ${(error as Error).message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile || !deleteProfilePassword) {
      setError('Password is required to delete profile');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onProfileDelete(selectedProfile.id);
      
      // Reset form
      setDeleteProfilePassword('');
      setIsDeleteDialogOpen(false);
      setSelectedProfile(null);
      
      // Reload profiles
      loadProfiles();
    } catch (error) {
      setError(`Failed to delete profile: ${(error as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProfileClick = (profile: ProfileMetadata) => {
    if (profile.id === activeProfile?.id) {
      // Lock current profile
      onProfileLock();
    } else {
      // Switch to profile (will trigger password dialog)
      setSelectedProfile(profile);
      // This would typically open a password input dialog
      // For now, we'll just show an alert
      alert(`Switching to ${profile.name} would require password authentication`);
    }
  };

  const handleGuestSession = async () => {
    try {
      await onGuestCreate();
      loadProfiles();
    } catch (error) {
      console.error('Failed to create guest session:', error);
    }
  };

  const getProfileInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activeProfile?.avatar} alt={activeProfile?.name} />
              <AvatarFallback>
                {activeProfile ? getProfileInitials(activeProfile.name) : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {activeProfile?.name || 'No Profile'}
              </p>
              <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                {activeProfile?.isGuest ? 'Guest Session' : 'Secure Profile'}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Active Profile Actions */}
          {activeProfile && (
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onProfileLock}>
                <Lock className="mr-2 h-4 w-4" />
                <span>Lock Profile</span>
                <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>New Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleGuestSession}>
                <Guest className="mr-2 h-4 w-4" />
                <span>Guest Session</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Profile List */}
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>Profiles</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </DropdownMenuLabel>
          
          <div className="max-h-60 overflow-y-auto">
            {profiles.map((profile) => (
              <DropdownMenuItem
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="flex items-center gap-3 p-3"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-xs">
                    {getProfileInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {profile.name}
                    </span>
                    {profile.id === activeProfile?.id && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {profile.isGuest && (
                      <Badge variant="secondary" className="text-xs">
                        Guest
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatLastLogin(profile.lastLoginAt)}</span>
                  </div>
                </div>
                
                {profile.id === activeProfile?.id ? (
                  <Lock className="h-4 w-4 text-slate-400" />
                ) : (
                  <User className="h-4 w-4 text-slate-400" />
                )}
              </DropdownMenuItem>
            ))}
            
            {profiles.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No profiles found
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Bottom Actions */}
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Profile Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Profile</DialogTitle>
            <DialogDescription>
              Create a new secure profile with its own encrypted storage and settings.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Enter profile name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profilePassword">Password</Label>
              <Input
                id="profilePassword"
                type="password"
                value={newProfilePassword}
                onChange={(e) => setNewProfilePassword(e.target.value)}
                placeholder="Create a strong password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileConfirmPassword">Confirm Password</Label>
              <Input
                id="profileConfirmPassword"
                type="password"
                value={newProfileConfirmPassword}
                onChange={(e) => setNewProfileConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProfile} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All encrypted data for this profile will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedProfile && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedProfile.avatar} alt={selectedProfile.name} />
                  <AvatarFallback>
                    {getProfileInitials(selectedProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedProfile.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedProfile.isGuest ? 'Guest Session' : 'Secure Profile'}
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="deletePassword">Enter Password to Confirm</Label>
              <Input
                id="deletePassword"
                type="password"
                value={deleteProfilePassword}
                onChange={(e) => setDeleteProfilePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteProfile} 
                disabled={isDeleting || !deleteProfilePassword}
              >
                {isDeleting ? 'Deleting...' : 'Delete Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Profile picker component for browser startup
interface ProfilePickerProps {
  profileManager: ProfileManager;
  profiles: ProfileMetadata[];
  onProfileSelect: (profileId: string, password: string) => Promise<void>;
  onGuestCreate: () => Promise<void>;
  onProfileCreate: (name: string, password: string) => Promise<string>;
}

export function ProfilePicker({
  profileManager,
  profiles,
  onProfileSelect,
  onGuestCreate,
  onProfileCreate
}: ProfilePickerProps) {
  const [selectedProfile, setSelectedProfile] = useState<ProfileMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileConfirmPassword, setNewProfileConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProfileSelect = async () => {
    if (!selectedProfile || !password) {
      setError('Please select a profile and enter password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onProfileSelect(selectedProfile.id, password);
    } catch (error) {
      setError(`Failed to unlock profile: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim() || !newProfilePassword || newProfilePassword !== newProfileConfirmPassword) {
      setError('Please fill all fields correctly');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onProfileCreate(newProfileName.trim(), newProfilePassword);
      setNewProfileName('');
      setNewProfilePassword('');
      setNewProfileConfirmPassword('');
      setIsCreateMode(false);
    } catch (error) {
      setError(`Failed to create profile: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSession = async () => {
    setIsLoading(true);
    setError('');

    try {
      await onGuestCreate();
    } catch (error) {
      setError(`Failed to create guest session: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to Omnior</CardTitle>
          <CardDescription>
            Select a profile to continue or create a new one
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isCreateMode ? (
            /* Create Profile Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newProfileName">Profile Name</Label>
                <Input
                  id="newProfileName"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Enter profile name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newProfilePassword">Password</Label>
                <Input
                  id="newProfilePassword"
                  type="password"
                  value={newProfilePassword}
                  onChange={(e) => setNewProfilePassword(e.target.value)}
                  placeholder="Create a password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newProfileConfirmPassword">Confirm Password</Label>
                <Input
                  id="newProfileConfirmPassword"
                  type="password"
                  value={newProfileConfirmPassword}
                  onChange={(e) => setNewProfileConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreateMode(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateProfile} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Profile'}
                </Button>
              </div>
            </div>
          ) : (
            /* Profile Selection */
            <div className="space-y-4">
              {/* Profile List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProfile?.id === profile.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback>
                          {profile.name
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase())
                            .join('')
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{profile.name}</span>
                          {profile.isGuest && (
                            <Badge variant="secondary" className="text-xs">Guest</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          Last login: {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {profiles.length === 0 && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No profiles found. Create your first profile to get started.
                  </div>
                )}
              </div>
              
              {/* Password Input */}
              {selectedProfile && (
                <div className="space-y-2">
                  <Label htmlFor="profilePassword">Password for {selectedProfile.name}</Label>
                  <Input
                    id="profilePassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter profile password"
                    onKeyPress={(e) => e.key === 'Enter' && handleProfileSelect()}
                  />
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handleProfileSelect} 
                  disabled={!selectedProfile || !password || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Unlocking...' : 'Unlock Profile'}
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateMode(true)}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Profile
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleGuestSession}
                    disabled={isLoading}
                  >
                    <Guest className="h-4 w-4 mr-2" />
                    Guest Session
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Security Notice */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Shield className="h-3 w-3" />
              <span>All profiles are encrypted with AES-256-GCM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}