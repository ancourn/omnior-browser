import { EncryptionLayer } from './encryption-layer';

/**
 * Secure Storage Service for Omnior Browser
 * Provides encrypted storage API for all browser features
 */
export class SecureStorage {
  private profileKey: string;
  private isGuestMode: boolean;
  private memoryCache: Map<string, string> = new Map();

  constructor(profileKey: string, isGuestMode: boolean = false) {
    this.profileKey = profileKey;
    this.isGuestMode = isGuestMode;
  }

  /**
   * Store data securely (encrypted at rest)
   */
  async set(key: string, value: any): Promise<void> {
    if (this.isGuestMode) {
      // In guest mode, only store in memory
      this.memoryCache.set(key, JSON.stringify(value));
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const encrypted = EncryptionLayer.encrypt(serialized, this.profileKey);
      
      // Store in localStorage (encrypted)
      localStorage.setItem(`omnior_${key}`, encrypted);
      
      // Also cache in memory for performance
      this.memoryCache.set(key, serialized);
    } catch (error) {
      throw new Error(`Failed to store secure data: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      return JSON.parse(this.memoryCache.get(key)!);
    }

    if (this.isGuestMode) {
      return null; // Guest mode doesn't persist to disk
    }

    try {
      const encrypted = localStorage.getItem(`omnior_${key}`);
      if (!encrypted) {
        return null;
      }

      const decrypted = EncryptionLayer.decrypt(encrypted, this.profileKey);
      const parsed = JSON.parse(decrypted);
      
      // Cache in memory
      this.memoryCache.set(key, decrypted);
      
      return parsed;
    } catch (error) {
      console.warn(`Failed to retrieve secure data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove stored data
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    if (!this.isGuestMode) {
      localStorage.removeItem(`omnior_${key}`);
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      return true;
    }

    if (this.isGuestMode) {
      return false;
    }

    return localStorage.getItem(`omnior_${key}`) !== null;
  }

  /**
   * Get all stored keys
   */
  async keys(): Promise<string[]> {
    const allKeys: string[] = [];
    
    // Add memory cache keys
    this.memoryCache.forEach((_, key) => {
      if (!allKeys.includes(key)) {
        allKeys.push(key);
      }
    });

    if (!this.isGuestMode) {
      // Add localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('omnior_')) {
          const actualKey = key.substring(8); // Remove 'omnior_' prefix
          if (!allKeys.includes(actualKey)) {
            allKeys.push(actualKey);
          }
        }
      }
    }

    return allKeys;
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (!this.isGuestMode) {
      // Remove all omnior_ prefixed items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('omnior_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Wipe sensitive data from memory
   */
  wipeMemory(): void {
    this.memoryCache.clear();
  }

  /**
   * Export encrypted data (for backup/migration)
   */
  async export(): Promise<Record<string, string>> {
    if (this.isGuestMode) {
      throw new Error('Cannot export data in guest mode');
    }

    const exportData: Record<string, string> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('omnior_')) {
        exportData[key] = localStorage.getItem(key)!;
      }
    }

    return exportData;
  }

  /**
   * Import encrypted data (for restore/migration)
   */
  async import(data: Record<string, string>): Promise<void> {
    if (this.isGuestMode) {
      throw new Error('Cannot import data in guest mode');
    }

    // Clear existing data first
    await this.clear();

    // Import new data
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryKeys: number;
    diskKeys: number;
    isGuestMode: boolean;
  }> {
    const allKeys = await this.keys();
    const memoryKeys = this.memoryCache.size;
    
    let diskKeys = 0;
    if (!this.isGuestMode) {
      for (let i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i)?.startsWith('omnior_')) {
          diskKeys++;
        }
      }
    }

    return {
      totalKeys: allKeys.length,
      memoryKeys,
      diskKeys,
      isGuestMode: this.isGuestMode
    };
  }
}

// Global secure storage instance
let globalSecureStorage: SecureStorage | null = null;

/**
 * Initialize secure storage for the current profile
 */
export function initializeSecureStorage(profileKey: string, isGuestMode: boolean = false): void {
  globalSecureStorage = new SecureStorage(profileKey, isGuestMode);
}

/**
 * Get the global secure storage instance
 */
export function getSecureStorage(): SecureStorage {
  if (!globalSecureStorage) {
    throw new Error('Secure storage not initialized. Call initializeSecureStorage first.');
  }
  return globalSecureStorage;
}

/**
 * Convenience methods for direct access
 */
export const secureStore = {
  set: async (key: string, value: any) => getSecureStorage().set(key, value),
  get: async <T>(key: string) => getSecureStorage().get<T>(key),
  delete: async (key: string) => getSecureStorage().delete(key),
  has: async (key: string) => getSecureStorage().has(key),
  keys: async () => getSecureStorage().keys(),
  clear: async () => getSecureStorage().clear(),
  wipeMemory: () => getSecureStorage().wipeMemory(),
  export: async () => getSecureStorage().export(),
  import: async (data: Record<string, string>) => getSecureStorage().import(data),
  getStats: async () => getSecureStorage().getStats(),
};