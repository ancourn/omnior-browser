/**
 * Multi-Profile Secure Storage Extension
 * Extends SecureStorage to support multiple key contexts and profile isolation
 */

import { SecureStorage, StoredData } from '@/storage/SecureStorage';
import { CryptoUtils, EncryptedData } from '@/auth/CryptoUtils';
import { ProfileMetadata } from '@/auth/ProfileManager';

export interface ProfileStorageContext {
  profileId: string;
  encryptionKey: CryptoKey;
  profileMetadata: ProfileMetadata;
}

export class MultiProfileSecureStorage {
  private activeContext: ProfileStorageContext | null = null;
  private storageInstances: Map<string, SecureStorage> = new Map();
  private contextChangeCallbacks: Set<(context: ProfileStorageContext | null) => void> = new Set();

  /**
   * Set the active profile context
   */
  async setActiveContext(context: ProfileStorageContext): Promise<void> {
    // Clear previous context
    if (this.activeContext) {
      await this.clearContext(this.activeContext);
    }

    // Initialize new context
    let secureStorage = this.storageInstances.get(context.profileId);
    
    if (!secureStorage) {
      secureStorage = new SecureStorage(context.profileId, context.encryptionKey);
      await secureStorage.initialize();
      this.storageInstances.set(context.profileId, secureStorage);
    } else {
      // Update encryption key if needed
      (secureStorage as any).encryptionKey = context.encryptionKey;
    }

    this.activeContext = context;
    
    // Notify listeners
    this.contextChangeCallbacks.forEach(callback => callback(context));
  }

  /**
   * Clear the active context
   */
  async clearContext(context: ProfileStorageContext): Promise<void> {
    const secureStorage = this.storageInstances.get(context.profileId);
    if (secureStorage) {
      secureStorage.close();
    }
    
    this.activeContext = null;
    this.contextChangeCallbacks.forEach(callback => callback(null));
  }

  /**
   * Get the active context
   */
  getActiveContext(): ProfileStorageContext | null {
    return this.activeContext;
  }

  /**
   * Store data in the active profile context
   */
  async store(id: string, data: any, metadata?: Record<string, any>): Promise<void> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    // Add profile context to metadata
    const enhancedMetadata = {
      ...metadata,
      profileId: this.activeContext.profileId,
      profileName: this.activeContext.profileMetadata.name,
      timestamp: Date.now()
    };

    await secureStorage.store(id, data, enhancedMetadata);
  }

  /**
   * Retrieve data from the active profile context
   */
  async retrieve<T>(id: string): Promise<T | null> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    return secureStorage.retrieve<T>(id);
  }

  /**
   * Delete data from the active profile context
   */
  async delete(id: string): Promise<void> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    await secureStorage.delete(id);
  }

  /**
   * List all data IDs in the active profile context
   */
  async listIds(): Promise<string[]> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    return secureStorage.listIds();
  }

  /**
   * Clear all data in the active profile context
   */
  async clear(): Promise<void> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    await secureStorage.clear();
  }

  /**
   * Delete the entire database for the active profile
   */
  async deleteDatabase(): Promise<void> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (secureStorage) {
      await secureStorage.deleteDatabase();
      this.storageInstances.delete(this.activeContext.profileId);
    }
  }

  /**
   * Get storage statistics for the active profile
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      return { count: 0, totalSize: 0 };
    }

    return secureStorage.getStats();
  }

  /**
   * Export data from the active profile context
   */
  async exportEncryptedData(password: string, cloudSalt: Uint8Array): Promise<string> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    // Use the existing export functionality from SecureStorage
    return (secureStorage as any).exportEncryptedData(password, cloudSalt);
  }

  /**
   * Import data to the active profile context
   */
  async importEncryptedData(encryptedBackup: string, password: string, cloudSalt: Uint8Array): Promise<void> {
    if (!this.activeContext) {
      throw new Error('No active profile context');
    }

    const secureStorage = this.storageInstances.get(this.activeContext.profileId);
    if (!secureStorage) {
      throw new Error('SecureStorage not initialized for active profile');
    }

    // Use the existing import functionality from SecureStorage
    return (secureStorage as any).importEncryptedData(encryptedBackup, password, cloudSalt);
  }

  /**
   * Export data from a specific profile (requires authentication)
   */
  async exportProfileData(
    profileId: string, 
    password: string, 
    cloudSalt: Uint8Array,
    encryptionKey: CryptoKey
  ): Promise<string> {
    let secureStorage = this.storageInstances.get(profileId);
    
    if (!secureStorage) {
      secureStorage = new SecureStorage(profileId, encryptionKey);
      await secureStorage.initialize();
      this.storageInstances.set(profileId, secureStorage);
    } else {
      // Temporarily set the encryption key
      (secureStorage as any).encryptionKey = encryptionKey;
    }

    try {
      return (secureStorage as any).exportEncryptedData(password, cloudSalt);
    } finally {
      // Clear the encryption key for security
      if (!this.activeContext || this.activeContext.profileId !== profileId) {
        (secureStorage as any).encryptionKey = null;
      }
    }
  }

  /**
   * Import data to a specific profile (requires authentication)
   */
  async importProfileData(
    profileId: string,
    encryptedBackup: string,
    password: string,
    cloudSalt: Uint8Array,
    encryptionKey: CryptoKey
  ): Promise<void> {
    let secureStorage = this.storageInstances.get(profileId);
    
    if (!secureStorage) {
      secureStorage = new SecureStorage(profileId, encryptionKey);
      await secureStorage.initialize();
      this.storageInstances.set(profileId, secureStorage);
    } else {
      // Temporarily set the encryption key
      (secureStorage as any).encryptionKey = encryptionKey;
    }

    try {
      return (secureStorage as any).importEncryptedData(encryptedBackup, password, cloudSalt);
    } finally {
      // Clear the encryption key for security
      if (!this.activeContext || this.activeContext.profileId !== profileId) {
        (secureStorage as any).encryptionKey = null;
      }
    }
  }

  /**
   * Get statistics for all profiles
   */
  async getAllProfilesStats(): Promise<Record<string, { count: number; totalSize: number }>> {
    const stats: Record<string, { count: number; totalSize: number }> = {};
    
    for (const [profileId, secureStorage] of this.storageInstances.entries()) {
      try {
        stats[profileId] = await secureStorage.getStats();
      } catch (error) {
        stats[profileId] = { count: 0, totalSize: 0 };
      }
    }
    
    return stats;
  }

  /**
   * List all available profiles (from IndexedDB databases)
   */
  async listAvailableProfiles(): Promise<string[]> {
    const databases = await indexedDB.databases();
    return databases
      .map(db => db.name)
      .filter(name => name.startsWith('OmniorBrowser_'))
      .map(name => name.replace('OmniorBrowser_', ''));
  }

  /**
   * Delete a profile completely (database and all data)
   */
  async deleteProfile(profileId: string): Promise<void> {
    const secureStorage = this.storageInstances.get(profileId);
    if (secureStorage) {
      await secureStorage.deleteDatabase();
      this.storageInstances.delete(profileId);
    }

    // If deleting active profile, clear context
    if (this.activeContext?.profileId === profileId) {
      this.activeContext = null;
      this.contextChangeCallbacks.forEach(callback => callback(null));
    }
  }

  /**
   * Add context change listener
   */
  onContextChange(callback: (context: ProfileStorageContext | null) => void): () => void {
    this.contextChangeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.contextChangeCallbacks.delete(callback);
    };
  }

  /**
   * Wipe all sensitive data from memory
   */
  async wipeMemory(): Promise<void> {
    // Clear active context
    if (this.activeContext) {
      await this.clearContext(this.activeContext);
    }

    // Close all storage instances
    for (const secureStorage of this.storageInstances.values()) {
      secureStorage.close();
    }
    
    this.storageInstances.clear();
    this.contextChangeCallbacks.clear();
  }

  /**
   * Emergency cleanup for crash recovery
   */
  async emergencyCleanup(): Promise<void> {
    try {
      // Force close all storage instances without saving state
      for (const secureStorage of this.storageInstances.values()) {
        try {
          secureStorage.close();
        } catch (error) {
          console.error('Failed to close storage during emergency cleanup:', error);
        }
      }
      
      this.storageInstances.clear();
      this.activeContext = null;
      this.contextChangeCallbacks.clear();
      
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Get storage instance for a specific profile (advanced usage)
   */
  getStorageInstance(profileId: string): SecureStorage | null {
    return this.storageInstances.get(profileId) || null;
  }

  /**
   * Check if a profile has storage initialized
   */
  hasStorage(profileId: string): boolean {
    return this.storageInstances.has(profileId);
  }

  /**
   * Get the number of active storage instances
   */
  getActiveStorageCount(): number {
    return this.storageInstances.size;
  }
}

// Factory function to create a multi-profile secure storage instance
export function createMultiProfileSecureStorage(): MultiProfileSecureStorage {
  return new MultiProfileSecureStorage();
}

// Global instance for application-wide use
let globalMultiProfileStorage: MultiProfileSecureStorage | null = null;

export function getGlobalMultiProfileStorage(): MultiProfileSecureStorage {
  if (!globalMultiProfileStorage) {
    globalMultiProfileStorage = createMultiProfileSecureStorage();
  }
  return globalMultiProfileStorage;
}

export function resetGlobalMultiProfileStorage(): void {
  if (globalMultiProfileStorage) {
    globalMultiProfileStorage.wipeMemory();
    globalMultiProfileStorage = null;
  }
}