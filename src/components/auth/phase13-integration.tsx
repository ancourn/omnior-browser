/**
 * Phase 1.3 Integration Component
 * Demonstrates complete Secure Profile Switching & Auto-Profile Lock functionality
 * This component integrates all Phase 1.3 modules for a complete user experience
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProfileManager, ProfileMetadata, ProfileData } from '@/auth/ProfileManager';
import { GuestModeService } from '@/auth/GuestModeService';
import { MultiProfileSecureStorage, ProfileStorageContext } from '@/storage/MultiProfileSecureStorage';
import { ProfileAutoLockManager, DEFAULT_AUTO_LOCK_CONFIG } from '@/auth/IdleTimer';
import { ProfileLockScreen, ProfileLockOverlay } from '@/components/auth/profile-lock-screen';
import { ProfileSwitcherMenu, ProfilePicker } from '@/components/auth/profile-switcher-menu';

interface Phase13IntegrationProps {
  masterPassword?: string; // For development/testing
  onReady?: () => void;
}

interface IntegrationState {
  phase: 'initializing' | 'profile-picker' | 'browser' | 'locked' | 'error';
  profileManager: ProfileManager | null;
  guestModeService: GuestModeService | null;
  multiProfileStorage: MultiProfileSecureStorage | null;
  autoLockManager: ProfileAutoLockManager | null;
  activeProfile: ProfileMetadata | null;
  activeProfileData: ProfileData | null;
  guestSession: any | null;
  error: string | null;
  lockReason: 'auto' | 'manual' | 'switch' | 'startup';
  remainingLockTime: number;
  profiles: ProfileMetadata[];
  warningRemainingSeconds: number | null;
}

export function Phase13Integration({ 
  masterPassword = 'default-master-password-123',
  onReady 
}: Phase13IntegrationProps) {
  const [state, setState] = useState<IntegrationState>({
    phase: 'initializing',
    profileManager: null,
    guestModeService: null,
    multiProfileStorage: null,
    autoLockManager: null,
    activeProfile: null,
    activeProfileData: null,
    guestSession: null,
    error: null,
    lockReason: 'startup',
    remainingLockTime: 0,
    profiles: [],
    warningRemainingSeconds: null
  });

  // Initialize all services
  const initializeServices = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, phase: 'initializing' }));

      // Create ProfileManager
      const profileManager = new ProfileManager();
      await profileManager.initialize(masterPassword);

      // Create GuestModeService
      const guestModeService = new GuestModeService(profileManager);

      // Create MultiProfileSecureStorage
      const multiProfileStorage = new MultiProfileSecureStorage();

      // Create AutoLockManager
      const autoLockManager = new ProfileAutoLockManager(
        DEFAULT_AUTO_LOCK_CONFIG,
        async () => {
          // Auto-lock callback
          setState(prev => ({
            ...prev,
            phase: 'locked',
            lockReason: 'auto'
          }));
        },
        (remainingSeconds) => {
          // Warning callback
          setState(prev => ({
            ...prev,
            warningRemainingSeconds: remainingSeconds
          }));
        }
      );

      // Get available profiles
      const profiles = profileManager.getProfiles();

      setState(prev => ({
        ...prev,
        profileManager,
        guestModeService,
        multiProfileStorage,
        autoLockManager,
        profiles,
        phase: profiles.length > 0 ? 'profile-picker' : 'profile-picker' // Start with picker even if no profiles
      }));

      // Notify parent component
      onReady?.();

    } catch (error) {
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: `Initialization failed: ${(error as Error).message}`
      }));
    }
  }, [masterPassword, onReady]);

  // Initialize on mount
  useEffect(() => {
    initializeServices();
  }, [initializeServices]);

  // Handle profile selection
  const handleProfileSelect = useCallback(async (profileId: string, password: string) => {
    if (!state.profileManager) return;

    try {
      // Switch to profile
      await state.profileManager.switchProfile(profileId, password);

      // Get active profile data
      const activeProfile = state.profileManager.getActiveProfile();
      const profiles = state.profileManager.getProfiles();

      // Setup auto-lock (skip for guest profiles)
      if (activeProfile && !activeProfile.isGuest) {
        state.autoLockManager?.start(profileId);
      }

      setState(prev => ({
        ...prev,
        phase: 'browser',
        activeProfile,
        profiles,
        warningRemainingSeconds: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to unlock profile: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager, state.autoLockManager]);

  // Handle guest session creation
  const handleGuestCreate = useCallback(async () => {
    if (!state.profileManager || !state.guestModeService) return;

    try {
      // Create guest profile
      const guestProfileId = await state.profileManager.createGuestProfile();
      
      // Start guest session
      const guestSession = await state.guestModeService.startGuestSession({
        sessionName: 'Guest Session',
        acknowledgeWarning: false
      });

      // Get active profile
      const activeProfile = state.profileManager.getActiveProfile();
      const profiles = state.profileManager.getProfiles();

      setState(prev => ({
        ...prev,
        phase: 'browser',
        activeProfile,
        guestSession,
        profiles
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to create guest session: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager, state.guestModeService]);

  // Handle profile creation
  const handleProfileCreate = useCallback(async (name: string, password: string) => {
    if (!state.profileManager) return;

    try {
      await state.profileManager.createProfile(name, password);
      
      const profiles = state.profileManager.getProfiles();
      setState(prev => ({ ...prev, profiles }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to create profile: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager]);

  // Handle profile lock
  const handleProfileLock = useCallback(async () => {
    if (!state.profileManager) return;

    try {
      await state.profileManager.lockProfile();
      state.autoLockManager?.stop();

      setState(prev => ({
        ...prev,
        phase: 'locked',
        lockReason: 'manual',
        activeProfile: null,
        warningRemainingSeconds: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to lock profile: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager, state.autoLockManager]);

  // Handle profile deletion
  const handleProfileDelete = useCallback(async (profileId: string) => {
    if (!state.profileManager) return;

    try {
      await state.profileManager.deleteProfile(profileId);
      
      const profiles = state.profileManager.getProfiles();
      setState(prev => ({ ...prev, profiles }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to delete profile: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // End guest session if active
      if (state.guestSession && state.guestModeService) {
        await state.guestModeService.endGuestSession();
      }

      // Lock active profile
      if (state.activeProfile && state.profileManager) {
        await state.profileManager.lockProfile();
      }

      // Stop auto-lock
      state.autoLockManager?.stop();

      setState(prev => ({
        ...prev,
        phase: 'profile-picker',
        activeProfile: null,
        guestSession: null,
        warningRemainingSeconds: null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to logout: ${(error as Error).message}`
      }));
    }
  }, [state.profileManager, state.guestModeService, state.activeProfile, state.guestSession, state.autoLockManager]);

  // Handle unlock
  const handleUnlock = useCallback(async () => {
    if (!state.activeProfile || !state.profileManager) return;

    try {
      // This would typically show a password dialog
      // For demo purposes, we'll use a hardcoded password
      const password = 'profile-password'; // In real app, this would come from user input
      
      await handleProfileSelect(state.activeProfile.id, password);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to unlock: ${(error as Error).message}`
      }));
    }
  }, [state.activeProfile, state.profileManager, handleProfileSelect]);

  // Handle profile switch
  const handleSwitchProfile = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'profile-picker',
      lockReason: 'switch'
    }));
  }, []);

  // Update remaining lock time for display
  useEffect(() => {
    if (state.phase === 'locked' && state.autoLockManager) {
      const timer = setInterval(() => {
        const remaining = state.autoLockManager.getRemainingTime();
        setState(prev => ({ ...prev, remainingLockTime: remaining }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.phase, state.autoLockManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      state.profileManager?.cleanup();
      state.guestModeService?.cleanup();
      state.multiProfileStorage?.wipeMemory();
      state.autoLockManager?.stop();
    };
  }, [state]);

  // Render based on current phase
  if (state.phase === 'initializing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Initializing Secure Profiles...</h2>
          <p className="text-slate-500 dark:text-slate-400">Setting up encryption and security features</p>
        </div>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Initialization Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{state.error}</p>
          <button
            onClick={initializeServices}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Initialization
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'profile-picker') {
    return (
      <ProfilePicker
        profileManager={state.profileManager!}
        profiles={state.profiles}
        onProfileSelect={handleProfileSelect}
        onGuestCreate={handleGuestCreate}
        onProfileCreate={handleProfileCreate}
      />
    );
  }

  if (state.phase === 'locked' && state.activeProfile) {
    return (
      <ProfileLockScreen
        profileManager={state.profileManager!}
        profileMetadata={state.activeProfile}
        onUnlock={handleUnlock}
        onSwitchProfile={handleSwitchProfile}
        onLogout={handleLogout}
        lockReason={state.lockReason}
        remainingTime={state.remainingLockTime}
      />
    );
  }

  // Main browser interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header with Profile Switcher */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <h1 className="text-xl font-semibold">Omnior Browser</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-lock warning */}
              {state.warningRemainingSeconds !== null && (
                <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 px-3 py-1 rounded-full">
                  Auto-lock in {state.warningRemainingSeconds}s
                </div>
              )}
              
              {/* Profile Switcher */}
              {state.profileManager && state.activeProfile && (
                <ProfileSwitcherMenu
                  profileManager={state.profileManager}
                  activeProfile={state.activeProfile}
                  onProfileSwitch={handleProfileSelect}
                  onProfileLock={handleProfileLock}
                  onProfileCreate={handleProfileCreate}
                  onProfileDelete={handleProfileDelete}
                  onGuestCreate={handleGuestCreate}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Info Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {state.activeProfile?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {state.activeProfile?.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {state.activeProfile?.isGuest ? 'Guest Session' : 'Secure Profile'}
                  {state.activeProfile?.isGuest && state.guestSession && (
                    <span className="ml-2 text-orange-600">
                      • Session will be erased when closed
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleProfileLock}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Lock Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Feature Demo Panels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Security */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Encryption</span>
                <span className="text-sm font-medium text-green-600">AES-256-GCM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Auto-Lock</span>
                <span className="text-sm font-medium text-blue-600">
                  {state.activeProfile?.isGuest ? 'Disabled' : `${DEFAULT_AUTO_LOCK_CONFIG.defaultTimeoutMinutes} min`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Data Isolation</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Session Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Profile ID</span>
                <span className="text-sm font-mono text-slate-800 dark:text-slate-200">
                  {state.activeProfile?.id.substring(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Created</span>
                <span className="text-sm font-medium">
                  {state.activeProfile?.createdAt 
                    ? new Date(state.activeProfile.createdAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Last Login</span>
                <span className="text-sm font-medium">
                  {state.activeProfile?.lastLoginAt 
                    ? new Date(state.activeProfile.lastLoginAt).toLocaleDateString()
                    : 'First session'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Available Profiles */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Available Profiles</h3>
            <div className="space-y-2">
              {state.profiles.map(profile => (
                <div
                  key={profile.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    profile.id === state.activeProfile?.id
                      ? 'bg-blue-50 dark:bg-blue-900'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-xs">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{profile.name}</span>
                  </div>
                  {profile.id === state.activeProfile?.id && (
                    <span className="text-xs text-blue-600">Active</span>
                  )}
                </div>
              ))}
              {state.profiles.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No other profiles available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Demo Actions */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Phase 1.3 Features Demo</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleProfileLock}
              className="p-4 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            >
              <div className="text-sm font-medium">Test Lock</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Manual profile lock</div>
            </button>
            
            <button
              onClick={handleSwitchProfile}
              className="p-4 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
            >
              <div className="text-sm font-medium">Switch Profile</div>
              <div className="text-xs text-green-600 dark:text-green-400">Profile picker</div>
            </button>
            
            <button
              onClick={handleGuestCreate}
              className="p-4 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
            >
              <div className="text-sm font-medium">Guest Mode</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Temporary session</div>
            </button>
            
            <button
              onClick={handleLogout}
              className="p-4 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
            >
              <div className="text-sm font-medium">Logout</div>
              <div className="text-xs text-red-600 dark:text-red-400">Return to picker</div>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span className="text-sm">⚠️</span>
              <span className="text-sm">{state.error}</span>
            </div>
          </div>
        )}
      </main>

      {/* Lock Overlay (for in-session locking) */}
      {state.phase === 'browser' && state.activeProfile && (
        <ProfileLockOverlay
          profileManager={state.profileManager!}
          profileMetadata={state.activeProfile}
          onUnlock={() => setState(prev => ({ ...prev, phase: 'browser' }))}
          onSwitchProfile={handleSwitchProfile}
          onLogout={handleLogout}
          lockReason="manual"
        />
      )}
    </div>
  );
}