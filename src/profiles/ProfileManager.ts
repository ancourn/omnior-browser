/**
 * Profile Manager - Handles multi-user profile management with sandboxing
 */

import { LoginManager, UserProfile } from '@/auth/LoginManager';
import { CryptoUtils } from '@/auth/CryptoUtils';
import { SecureStorage } from '@/storage/SecureStorage';

export interface ProfileInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isCurrent: boolean;
  lastLogin?: number;
  createdAt: number;
  settings: {
    sessionTimeout: number;
    autoLock: boolean;
    keepMeLoggedIn: boolean;
  };
}

export interface ProfileStats {
  bookmarksCount: number;
  historyCount: number;
  settingsCount: number;
  storageSize: number;
  lastSync?: number;
}

export class ProfileManager {
  private static instance: ProfileManager;
  private loginManager: LoginManager;
  private currentProfile: UserProfile | null = null;

  private constructor() {
    this.loginManager = LoginManager.getInstance();
  }

  static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  /**
   * Initialize the profile manager
   */
  async initialize(): Promise<void> {
    await this.loginManager.initialize();
    this.currentProfile = this.loginManager.getCurrentUser();
  }

  /**
   * Get all available profiles
   */
  async getAllProfiles(): Promise<ProfileInfo[]> {
    const profiles = await this.loginManager.getAllProfiles();
    const currentProfile = this.currentProfile;

    return profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      isCurrent: profile.id === currentProfile?.id,
      lastLogin: profile.lastLogin,
      createdAt: profile.createdAt,
      settings: profile.settings || {
        sessionTimeout: 30 * 60 * 1000,
        autoLock: true,
        keepMeLoggedIn: false
      }
    }));
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): ProfileInfo | null {
    if (!this.currentProfile) {
      return null;
    }

    return {
      id: this.currentProfile.id,
      email: this.currentProfile.email,
      name: this.currentProfile.name,
      isCurrent: true,
      lastLogin: this.currentProfile.lastLogin,
      createdAt: this.currentProfile.createdAt,
      settings: this.currentProfile.settings || {
        sessionTimeout: 30 * 60 * 1000,
        autoLock: true,
        keepMeLoggedIn: false
      }
    };
  }

  /**
   * Create a new profile
   */
  async createProfile(email: string, name: string, password: string): Promise<ProfileInfo> {
    const profile = await this.loginManager.register(email, name, password);
    
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      isCurrent: false,
      createdAt: profile.createdAt,
      settings: profile.settings || {
        sessionTimeout: 30 * 60 * 1000,
        autoLock: true,
        keepMeLoggedIn: false
      }
    };
  }

  /**
   * Switch to a different profile
   */
  async switchToProfile(profileId: string, password: string): Promise<ProfileInfo> {
    // Get profile info
    const profiles = await this.loginManager.getAllProfiles();
    const targetProfile = profiles.find(p => p.id === profileId);
    
    if (!targetProfile) {
      throw new Error('Profile not found');
    }

    // Logout from current profile
    await this.loginManager.logout();

    // Login to target profile
    await this.loginManager.login(targetProfile.email, password);
    this.currentProfile = this.loginManager.getCurrentUser();

    return this.getCurrentProfile()!;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, password: string): Promise<void> {
    // Verify current user's password for security
    if (this.currentProfile) {
      const salt = CryptoUtils.base64ToArrayBuffer(this.currentProfile.salt);
      const isValid = await CryptoUtils.verifyPassword(password, salt, this.currentProfile.passwordHash);
      
      if (!isValid) {
        throw new Error('Invalid password');
      }
    }

    // Cannot delete current profile
    if (profileId === this.currentProfile?.id) {
      throw new Error('Cannot delete current profile. Switch to another profile first.');
    }

    // Delete the profile
    await this.loginManager.deleteProfile(profileId);
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(settings: {
    sessionTimeout?: number;
    autoLock?: boolean;
    keepMeLoggedIn?: boolean;
  }): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No current profile');
    }

    // Update settings
    this.currentProfile.settings = {
      ...this.currentProfile.settings,
      ...settings
    };

    // Save updated profile
    const profiles = await this.loginManager.getAllProfiles();
    const index = profiles.findIndex(p => p.id === this.currentProfile!.id);
    
    if (index !== -1) {
      profiles[index] = this.currentProfile;
      // Note: We need to add a method in LoginManager to update profile
      // For now, we'll save it directly
      await this.saveProfile(this.currentProfile);
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(profileId?: string): Promise<ProfileStats> {
    const targetProfileId = profileId || this.currentProfile?.id;
    
    if (!targetProfileId) {
      throw new Error('No profile specified');
    }

    // For now, return mock stats
    // In a real implementation, we would query the actual storage
    return {
      bookmarksCount: 0,
      historyCount: 0,
      settingsCount: 0,
      storageSize: 0,
      lastSync: Date.now()
    };
  }

  /**
   * Export profile data
   */
  async exportProfileData(profileId?: string): Promise<string> {
    const targetProfileId = profileId || this.currentProfile?.id;
    
    if (!targetProfileId) {
      throw new Error('No profile specified');
    }

    // For now, return empty export
    // In a real implementation, we would export all encrypted data
    return JSON.stringify({
      profileId: targetProfileId,
      exportedAt: Date.now(),
      data: {}
    });
  }

  /**
   * Import profile data
   */
  async importProfileData(exportData: string, password: string): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No current profile');
    }

    try {
      const data = JSON.parse(exportData);
      
      // Verify password
      const salt = CryptoUtils.base64ToArrayBuffer(this.currentProfile.salt);
      const isValid = await CryptoUtils.verifyPassword(password, salt, this.currentProfile.passwordHash);
      
      if (!isValid) {
        throw new Error('Invalid password');
      }

      // Import data (placeholder implementation)
      console.log('Importing profile data:', data);
      
    } catch (error) {
      throw new Error('Invalid export data format');
    }
  }

  /**
   * Get profile avatar
   */
  async getProfileAvatar(profileId?: string): Promise<string | null> {
    const targetProfileId = profileId || this.currentProfile?.id;
    
    if (!targetProfileId) {
      return null;
    }

    // For now, generate a default avatar
    const seed = targetProfileId;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  }

  /**
   * Set profile avatar
   */
  async setProfileAvatar(avatarData: string): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No current profile');
    }

    // Store avatar data (placeholder implementation)
    console.log('Setting avatar for profile:', this.currentProfile.id);
  }

  /**
   * Lock current profile
   */
  async lockProfile(): Promise<void> {
    await this.loginManager.lock();
  }

  /**
   * Unlock current profile
   */
  async unlockProfile(password: string): Promise<void> {
    await this.loginManager.unlock(password);
    this.currentProfile = this.loginManager.getCurrentUser();
  }

  /**
   * Check if profile is locked
   */
  isProfileLocked(): boolean {
    return !this.loginManager.isAuthenticated() && this.currentProfile !== null;
  }

  /**
   * Get available storage for profile
   */
  async getProfileStorage(profileId?: string): Promise<SecureStorage | null> {
    const targetProfileId = profileId || this.currentProfile?.id;
    
    if (!targetProfileId) {
      return null;
    }

    // For now, return null since we can't access other profiles' storage without password
    if (targetProfileId !== this.currentProfile?.id) {
      return null;
    }

    return this.loginManager.getCurrentStorage() as SecureStorage;
  }

  /**
   * Private helper methods
   */
  private async saveProfile(profile: UserProfile): Promise<void> {
    // This should be implemented in LoginManager
    // For now, we'll use a direct IndexedDB approach
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OmniorBrowser_Profiles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        const saveRequest = store.put(profile);
        
        saveRequest.onerror = () => reject(saveRequest.error);
        saveRequest.onsuccess = () => resolve();
      };
    });
  }

  /**
   * Clean up old profiles (utility method)
   */
  async cleanupOldProfiles(maxAge: number = 90 * 24 * 60 * 60 * 1000): Promise<number> {
    const profiles = await this.loginManager.getAllProfiles();
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;

    for (const profile of profiles) {
      if (profile.lastLogin && profile.lastLogin < cutoffTime) {
        // Skip current profile
        if (profile.id === this.currentProfile?.id) {
          continue;
        }

        try {
          await this.loginManager.deleteProfile(profile.id);
          cleanedCount++;
        } catch (error) {
          console.error(`Failed to delete old profile ${profile.id}:`, error);
        }
      }
    }

    return cleanedCount;
  }

  /**
   * Get profile usage statistics
   */
  async getProfileUsageStats(): Promise<{
    totalProfiles: number;
    activeProfiles: number;
    totalStorageSize: number;
    lastCleanup: number;
  }> {
    const profiles = await this.loginManager.getAllProfiles();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const activeProfiles = profiles.filter(p => 
      p.lastLogin && p.lastLogin > thirtyDaysAgo
    ).length;

    // Calculate total storage size (placeholder)
    const totalStorageSize = profiles.reduce((size, profile) => {
      return size + (1024 * 1024); // Mock 1MB per profile
    }, 0);

    return {
      totalProfiles: profiles.length,
      activeProfiles,
      totalStorageSize,
      lastCleanup: Date.now()
    };
  }
}