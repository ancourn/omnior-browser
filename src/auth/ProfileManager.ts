/**
 * Profile Manager for Secure Multi-Profile Support
 * Handles profile creation, deletion, switching, and encrypted storage
 */

import { CryptoUtils } from '@/auth/CryptoUtils';
import { SecureStorage } from '@/storage/SecureStorage';

export interface ProfileMetadata {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  lastLoginAt?: number;
  isGuest: boolean;
  isActive: boolean;
  settings?: {
    autoLockMinutes: number;
    theme: string;
    language: string;
  };
}

export interface ProfileData {
  metadata: ProfileMetadata;
  encryptionKey: CryptoKey;
  salt: Uint8Array;
  secureStorage: SecureStorage;
}

export interface ProfileIndex {
  masterKeySalt: Uint8Array;
  profiles: Record<string, ProfileMetadata>;
  activeProfileId?: string;
  version: string;
}

export class ProfileManager {
  private static readonly PROFILE_INDEX_KEY = 'omnior_profile_index';
  private static readonly MASTER_KEY_DERIVATION_SALT = 'omnior_master_key_salt';
  private static readonly PROFILE_VERSION = '1.0.0';
  
  private masterKey: CryptoKey | null = null;
  private masterKeySalt: Uint8Array;
  private profileIndex: ProfileIndex;
  private activeProfile: ProfileData | null = null;
  private profiles: Map<string, ProfileData> = new Map();

  constructor() {
    this.masterKeySalt = CryptoUtils.generateSalt();
    this.profileIndex = {
      masterKeySalt: this.masterKeySalt,
      profiles: {},
      version: this.PROFILE_VERSION
    };
  }

  /**
   * Initialize the profile manager
   */
  async initialize(masterPassword: string): Promise<void> {
    try {
      // Derive master key from master password
      this.masterKey = await CryptoUtils.deriveKey(masterPassword, this.masterKeySalt);
      
      // Load or create profile index
      await this.loadProfileIndex();
      
      // Initialize all profiles
      await this.initializeAllProfiles();
      
    } catch (error) {
      throw new Error(`Failed to initialize ProfileManager: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(
    name: string, 
    password: string, 
    options: {
      avatar?: string;
      isGuest?: boolean;
      autoLockMinutes?: number;
    } = {}
  ): Promise<string> {
    if (!this.masterKey) {
      throw new Error('ProfileManager not initialized');
    }

    const profileId = this.generateProfileId();
    const profileSalt = CryptoUtils.generateSalt();
    const encryptionKey = await CryptoUtils.deriveKey(password, profileSalt);
    
    const metadata: ProfileMetadata = {
      id: profileId,
      name,
      avatar: options.avatar,
      createdAt: Date.now(),
      isGuest: options.isGuest || false,
      isActive: false,
      settings: {
        autoLockMinutes: options.autoLockMinutes || 30,
        theme: 'system',
        language: 'en-US'
      }
    };

    // Create secure storage for the profile
    const secureStorage = new SecureStorage(profileId, encryptionKey);
    await secureStorage.initialize();

    const profileData: ProfileData = {
      metadata,
      encryptionKey,
      salt: profileSalt,
      secureStorage
    };

    // Store profile data
    this.profiles.set(profileId, profileData);
    this.profileIndex.profiles[profileId] = metadata;

    // Save profile index
    await this.saveProfileIndex();

    return profileId;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    if (!this.masterKey) {
      throw new Error('ProfileManager not initialized');
    }

    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Delete profile data
    await profile.secureStorage.deleteDatabase();
    
    // Remove from memory
    this.profiles.delete(profileId);
    delete this.profileIndex.profiles[profileId];

    // If deleting active profile, clear active profile
    if (this.activeProfile?.metadata.id === profileId) {
      await this.lockProfile();
    }

    // Save profile index
    await this.saveProfileIndex();
  }

  /**
   * Switch to a different profile
   */
  async switchProfile(profileId: string, password: string): Promise<void> {
    if (!this.masterKey) {
      throw new Error('ProfileManager not initialized');
    }

    const targetProfile = this.profiles.get(profileId);
    if (!targetProfile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Lock current profile if active
    if (this.activeProfile) {
      await this.lockProfile();
    }

    try {
      // Authenticate target profile
      const isAuthenticated = await this.authenticateProfile(targetProfile, password);
      if (!isAuthenticated) {
        throw new Error('Invalid profile password');
      }

      // Activate target profile
      await this.activateProfile(targetProfile);
      
    } catch (error) {
      throw new Error(`Failed to switch profile: ${(error as Error).message}`);
    }
  }

  /**
   * Lock the current active profile
   */
  async lockProfile(): Promise<void> {
    if (!this.activeProfile) {
      return;
    }

    try {
      // Save current state
      await this.saveProfileState(this.activeProfile);
      
      // Clear decrypted data from memory
      await this.wipeProfileMemory(this.activeProfile);
      
      // Update profile index
      if (this.activeProfile.metadata.id) {
        this.profileIndex.activeProfileId = undefined;
        this.profileIndex.profiles[this.activeProfile.metadata.id].isActive = false;
        await this.saveProfileIndex();
      }
      
      this.activeProfile = null;
      
    } catch (error) {
      console.error('Failed to lock profile:', error);
      throw new Error(`Failed to lock profile: ${(error as Error).message}`);
    }
  }

  /**
   * Create and activate a guest profile
   */
  async createGuestProfile(): Promise<string> {
    const guestPassword = this.generateGuestPassword();
    const profileId = await this.createProfile('Guest Session', guestPassword, {
      isGuest: true,
      autoLockMinutes: 0 // No auto-lock for guest mode
    });

    // Activate guest profile
    const guestProfile = this.profiles.get(profileId);
    if (guestProfile) {
      await this.activateProfile(guestProfile);
    }

    return profileId;
  }

  /**
   * Get all available profiles
   */
  getProfiles(): ProfileMetadata[] {
    return Object.values(this.profileIndex.profiles);
  }

  /**
   * Get active profile metadata
   */
  getActiveProfile(): ProfileMetadata | null {
    return this.activeProfile?.metadata || null;
  }

  /**
   * Get profile by ID
   */
  getProfile(profileId: string): ProfileMetadata | null {
    return this.profileIndex.profiles[profileId] || null;
  }

  /**
   * Update profile metadata
   */
  async updateProfile(profileId: string, updates: Partial<ProfileMetadata>): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Update metadata
    Object.assign(profile.metadata, updates);
    this.profileIndex.profiles[profileId] = profile.metadata;

    // Save changes
    await this.saveProfileIndex();
  }

  /**
   * Authenticate a profile with password
   */
  private async authenticateProfile(profile: ProfileData, password: string): Promise<boolean> {
    try {
      // Test the password by deriving a key and comparing with stored key
      const testKey = await CryptoUtils.deriveKey(password, profile.salt);
      
      // We can't directly compare CryptoKey objects, so we'll test by encrypting/decrypting
      const testData = 'authentication_test';
      const encrypted = await CryptoUtils.encrypt(testKey, testData);
      const decrypted = await CryptoUtils.decrypt(profile.encryptionKey, encrypted);
      
      return decrypted === testData;
    } catch (error) {
      return false;
    }
  }

  /**
   * Activate a profile
   */
  private async activateProfile(profile: ProfileData): Promise<void> {
    // Update metadata
    profile.metadata.lastLoginAt = Date.now();
    profile.metadata.isActive = true;
    
    // Update profile index
    this.profileIndex.activeProfileId = profile.metadata.id;
    this.profileIndex.profiles[profile.metadata.id] = profile.metadata;
    
    // Set as active profile
    this.activeProfile = profile;
    
    // Save profile index
    await this.saveProfileIndex();
  }

  /**
   * Save profile state
   */
  private async saveProfileState(profile: ProfileData): Promise<void> {
    // Profile state is automatically saved by SecureStorage
    // This method can be extended for additional state saving
  }

  /**
   * Wipe profile data from memory
   */
  private async wipeProfileMemory(profile: ProfileData): Promise<void> {
    // Close secure storage to clear decrypted data
    profile.secureStorage.close();
    
    // Clear encryption key reference
    profile.encryptionKey = null as any;
    
    // Clear sensitive data from metadata
    if (profile.metadata.isGuest) {
      // For guest profiles, delete all data
      await profile.secureStorage.deleteDatabase();
    }
  }

  /**
   * Load profile index from encrypted storage
   */
  private async loadProfileIndex(): Promise<void> {
    try {
      // Check if profile index exists
      const storedIndex = localStorage.getItem(this.PROFILE_INDEX_KEY);
      
      if (storedIndex) {
        // Decrypt and parse profile index
        const decryptedIndex = await CryptoUtils.decrypt(this.masterKey!, storedIndex);
        this.profileIndex = JSON.parse(decryptedIndex);
        
        // Validate version
        if (this.profileIndex.version !== this.PROFILE_VERSION) {
          console.warn('Profile index version mismatch, creating new index');
          await this.migrateProfileIndex();
        }
      } else {
        // Create new profile index
        this.profileIndex = {
          masterKeySalt: this.masterKeySalt,
          profiles: {},
          version: this.PROFILE_VERSION
        };
        await this.saveProfileIndex();
      }
    } catch (error) {
      console.error('Failed to load profile index, creating new one:', error);
      this.profileIndex = {
        masterKeySalt: this.masterKeySalt,
        profiles: {},
        version: this.PROFILE_VERSION
      };
      await this.saveProfileIndex();
    }
  }

  /**
   * Save profile index to encrypted storage
   */
  private async saveProfileIndex(): Promise<void> {
    if (!this.masterKey) {
      throw new Error('ProfileManager not initialized');
    }

    try {
      const indexJson = JSON.stringify(this.profileIndex);
      const encryptedIndex = await CryptoUtils.encrypt(this.masterKey, indexJson);
      localStorage.setItem(this.PROFILE_INDEX_KEY, encryptedIndex);
    } catch (error) {
      throw new Error(`Failed to save profile index: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize all profiles from index
   */
  private async initializeAllProfiles(): Promise<void> {
    for (const [profileId, metadata] of Object.entries(this.profileIndex.profiles)) {
      try {
        // For guest profiles, we don't initialize storage as they're temporary
        if (metadata.isGuest) {
          continue;
        }

        // Create profile data structure (without encryption key - needs authentication)
        const profileData: ProfileData = {
          metadata,
          encryptionKey: null as any, // Will be set on authentication
          salt: new Uint8Array(), // Will be set on authentication
          secureStorage: new SecureStorage(profileId, null as any)
        };

        this.profiles.set(profileId, profileData);
      } catch (error) {
        console.error(`Failed to initialize profile ${profileId}:`, error);
      }
    }
  }

  /**
   * Migrate profile index for version changes
   */
  private async migrateProfileIndex(): Promise<void> {
    // Migration logic for future version changes
    console.log('Migrating profile index to version', this.PROFILE_VERSION);
    
    // Update version
    this.profileIndex.version = this.PROFILE_VERSION;
    
    // Save migrated index
    await this.saveProfileIndex();
  }

  /**
   * Generate unique profile ID
   */
  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate guest password
   */
  private generateGuestPassword(): string {
    return CryptoUtils.generateToken(32);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Lock active profile
    await this.lockProfile();
    
    // Clear all profiles
    this.profiles.clear();
    
    // Clear master key
    this.masterKey = null;
    
    // Clear profile index from localStorage
    localStorage.removeItem(this.PROFILE_INDEX_KEY);
  }

  /**
   * Emergency cleanup for crash recovery
   */
  async emergencyCleanup(): Promise<void> {
    try {
      // Lock active profile without saving state (for crash recovery)
      if (this.activeProfile) {
        await this.wipeProfileMemory(this.activeProfile);
        this.activeProfile = null;
      }
      
      // Clear all decrypted data
      this.profiles.clear();
      this.masterKey = null;
      
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }
}