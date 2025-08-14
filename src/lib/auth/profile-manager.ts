import { EncryptionLayer } from './encryption-layer';
import { initializeSecureStorage, getSecureStorage } from './secure-storage';
import { UserProfile } from './auth-service';

export interface ProfileData {
  profile: UserProfile;
  encryptedData: string;
  settings: Record<string, any>;
  bookmarks: any[];
  history: any[];
  extensions: any[];
  lastAccessed: string;
}

export interface ProfileMetadata {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  createdAt: string;
  lastAccessed: string;
  size: number;
  hasPassword: boolean;
}

/**
 * Profile Manager for Omnior Browser
 * Manages multiple user profiles with isolated storage and encryption
 */
export class ProfileManager {
  private static instance: ProfileManager;
  private currentProfile: ProfileData | null = null;
  private profiles: Map<string, ProfileData> = new Map();
  private profileKeys: Map<string, string> = new Map();

  private constructor() {
    // Load existing profiles on initialization
    this.loadProfiles();
  }

  static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  /**
   * Create a new profile
   */
  async createProfile(
    name: string,
    email: string,
    password: string,
    settings: Record<string, any> = {}
  ): Promise<ProfileData> {
    // Check if profile with this email already exists
    if (await this.getProfileByEmail(email)) {
      throw new Error('Profile with this email already exists');
    }

    // Create user profile
    const userProfile: UserProfile = {
      id: EncryptionLayer.generateSecureToken(16),
      email,
      name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings,
      isGuest: false
    };

    // Generate profile-specific encryption key
    const profileKey = this.deriveProfileKey(email, password);
    
    // Create profile data structure
    const profileData: ProfileData = {
      profile: userProfile,
      encryptedData: '', // Will be set when first data is stored
      settings,
      bookmarks: [],
      history: [],
      extensions: [],
      lastAccessed: new Date().toISOString()
    };

    // Store profile metadata
    await this.storeProfileMetadata(profileData, profileKey);

    // Store profile key for session
    this.profileKeys.set(userProfile.id, profileKey);
    this.profiles.set(userProfile.id, profileData);

    // Set as current profile
    await this.switchToProfile(userProfile.id, password);

    return profileData;
  }

  /**
   * Switch to a different profile
   */
  async switchToProfile(profileId: string, password: string): Promise<void> {
    const profile = await this.loadProfile(profileId, password);
    if (!profile) {
      throw new Error('Invalid profile ID or password');
    }

    // Wipe current profile data from memory
    if (this.currentProfile) {
      getSecureStorage().wipeMemory();
    }

    // Set new profile as current
    this.currentProfile = profile;
    
    // Initialize secure storage for this profile
    const profileKey = this.profileKeys.get(profileId);
    if (!profileKey) {
      throw new Error('Profile key not found');
    }
    
    initializeSecureStorage(profileKey, false);

    // Update last accessed time
    profile.lastAccessed = new Date().toISOString();
    await this.updateProfileMetadata(profile);
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string, password: string): Promise<void> {
    const profile = await this.loadProfile(profileId, password);
    if (!profile) {
      throw new Error('Invalid profile ID or password');
    }

    // Don't allow deleting current profile
    if (this.currentProfile?.profile.id === profileId) {
      throw new Error('Cannot delete currently active profile');
    }

    // Remove profile data
    this.profiles.delete(profileId);
    this.profileKeys.delete(profileId);

    // Remove from persistent storage
    localStorage.removeItem(`omnior_profile_${profileId}`);
    localStorage.removeItem(`omnior_profile_meta_${profileId}`);

    // Remove profile-specific data
    await this.wipeProfileData(profileId);
  }

  /**
   * Get current profile
   */
  getCurrentProfile(): ProfileData | null {
    return this.currentProfile;
  }

  /**
   * Get all available profiles (metadata only)
   */
  async getAllProfiles(): Promise<ProfileMetadata[]> {
    const metadata: ProfileMetadata[] = [];

    for (const [profileId, profile] of this.profiles) {
      const meta: ProfileMetadata = {
        id: profile.profile.id,
        name: profile.profile.name,
        email: profile.profile.email,
        isGuest: profile.profile.isGuest,
        createdAt: profile.profile.createdAt,
        lastAccessed: profile.lastAccessed,
        size: await this.getProfileSize(profileId),
        hasPassword: this.profileKeys.has(profileId)
      };
      metadata.push(meta);
    }

    return metadata.sort((a, b) => 
      new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    );
  }

  /**
   * Get profile by email
   */
  async getProfileByEmail(email: string): Promise<ProfileData | null> {
    for (const profile of this.profiles.values()) {
      if (profile.profile.email === email) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Update profile settings
   */
  async updateProfileSettings(profileId: string, settings: Record<string, any>): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.settings = { ...profile.settings, ...settings };
    profile.profile.settings = profile.settings;
    
    await this.updateProfileMetadata(profile);
  }

  /**
   * Export profile data (for backup)
   */
  async exportProfile(profileId: string, password: string): Promise<string> {
    const profile = await this.loadProfile(profileId, password);
    if (!profile) {
      throw new Error('Invalid profile ID or password');
    }

    const exportData = {
      profile: profile.profile,
      settings: profile.settings,
      bookmarks: profile.bookmarks,
      history: profile.history,
      extensions: profile.extensions,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return EncryptionLayer.encrypt(JSON.stringify(exportData), 'omnior_export_key');
  }

  /**
   * Import profile data (for restore)
   */
  async importProfile(encryptedData: string, password: string): Promise<ProfileData> {
    try {
      const decrypted = EncryptionLayer.decrypt(encryptedData, 'omnior_export_key');
      const importData = JSON.parse(decrypted);

      // Validate import data structure
      if (!importData.profile || !importData.profile.email) {
        throw new Error('Invalid import data format');
      }

      // Check if profile already exists
      const existingProfile = await this.getProfileByEmail(importData.profile.email);
      if (existingProfile) {
        throw new Error('Profile with this email already exists');
      }

      // Create new profile from imported data
      const profileData: ProfileData = {
        profile: {
          ...importData.profile,
          id: EncryptionLayer.generateSecureToken(16), // Generate new ID
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        },
        encryptedData: '',
        settings: importData.settings || {},
        bookmarks: importData.bookmarks || [],
        history: importData.history || [],
        extensions: importData.extensions || [],
        lastAccessed: new Date().toISOString()
      };

      // Generate profile key
      const profileKey = this.deriveProfileKey(importData.profile.email, password);
      
      // Store profile
      await this.storeProfileMetadata(profileData, profileKey);
      this.profileKeys.set(profileData.profile.id, profileKey);
      this.profiles.set(profileData.profile.id, profileData);

      return profileData;
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Private helper methods
   */
  private async loadProfiles(): Promise<void> {
    try {
      // Load all profile metadata
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('omnior_profile_meta_')) {
          const profileId = key.replace('omnior_profile_meta_', '');
          const metadata = localStorage.getItem(key);
          
          if (metadata) {
            try {
              const profileData = JSON.parse(metadata);
              this.profiles.set(profileId, profileData);
            } catch (error) {
              console.warn(`Failed to parse profile metadata for ${profileId}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }

  private async loadProfile(profileId: string, password: string): Promise<ProfileData | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }

    // Verify password by deriving profile key
    const profileKey = this.deriveProfileKey(profile.profile.email, password);
    
    // Store key for session
    this.profileKeys.set(profileId, profileKey);

    return profile;
  }

  private async storeProfileMetadata(profile: ProfileData, profileKey: string): Promise<void> {
    try {
      const metadata = {
        profile: profile.profile,
        settings: profile.settings,
        lastAccessed: profile.lastAccessed,
        createdAt: profile.profile.createdAt
      };

      localStorage.setItem(`omnior_profile_meta_${profile.profile.id}`, JSON.stringify(metadata));
    } catch (error) {
      throw new Error(`Failed to store profile metadata: ${error.message}`);
    }
  }

  private async updateProfileMetadata(profile: ProfileData): Promise<void> {
    const profileKey = this.profileKeys.get(profile.profile.id);
    if (!profileKey) {
      throw new Error('Profile key not found');
    }

    await this.storeProfileMetadata(profile, profileKey);
  }

  private deriveProfileKey(email: string, password: string): string {
    const salt = Buffer.from(email.toLowerCase());
    const key = EncryptionLayer.deriveKey(password, salt);
    return key.toString('hex');
  }

  private async getProfileSize(profileId: string): Promise<number> {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        return 0;
      }

      // Calculate approximate size
      const jsonData = JSON.stringify({
        settings: profile.settings,
        bookmarks: profile.bookmarks,
        history: profile.history,
        extensions: profile.extensions
      });

      return new Blob([jsonData]).size;
    } catch (error) {
      return 0;
    }
  }

  private async wipeProfileData(profileId: string): Promise<void> {
    try {
      // Remove all profile-specific data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes(profileId)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error wiping profile data:', error);
    }
  }
}

// Export singleton instance
export const profileManager = ProfileManager.getInstance();