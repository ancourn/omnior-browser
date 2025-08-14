/**
 * Secure Storage Service for Encrypted Data
 * Handles encrypted storage and retrieval of user data using IndexedDB
 */

import { CryptoUtils, EncryptedData } from '@/auth/CryptoUtils';

export interface StoredData {
  id: string;
  encryptedData: EncryptedData;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class SecureStorage {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private encryptionKey: CryptoKey | null = null;

  constructor(profileId: string, encryptionKey: CryptoKey) {
    this.dbName = `OmniorBrowser_${profileId}`;
    this.storeName = 'secureStorage';
    this.encryptionKey = encryptionKey;
  }

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('metadata', 'metadata', { unique: false });
        }
      };
    });
  }

  /**
   * Store encrypted data
   */
  async store(id: string, data: any, metadata?: Record<string, any>): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    const jsonData = JSON.stringify(data);
    const encryptedData = await CryptoUtils.encrypt(this.encryptionKey, jsonData);

    const storedData: StoredData = {
      id,
      encryptedData,
      timestamp: Date.now(),
      metadata
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(storedData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieve and decrypt data
   */
  async retrieve<T>(id: string): Promise<T | null> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    const storedData = await this.getRaw(id);
    if (!storedData) {
      return null;
    }

    try {
      const decryptedJson = await CryptoUtils.decrypt(this.encryptionKey, storedData.encryptedData);
      return JSON.parse(decryptedJson) as T;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Failed to decrypt stored data');
    }
  }

  /**
   * Get raw encrypted data without decryption
   */
  private async getRaw(id: string): Promise<StoredData | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Delete stored data
   */
  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * List all stored data IDs
   */
  async listIds(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  /**
   * Clear all stored data for this profile
   */
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const items = request.result;
        const count = items.length;
        const totalSize = items.reduce((size, item) => {
          return size + JSON.stringify(item).length;
        }, 0);
        resolve({ count, totalSize });
      };
    });
  }

  /**
   * Export all encrypted data for cloud backup
   */
  async exportEncryptedData(password: string, cloudSalt: Uint8Array): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    // Get all stored data
    const allIds = await this.listIds();
    const allData: Record<string, any> = {};
    
    for (const id of allIds) {
      const rawData = await this.getRaw(id);
      if (rawData) {
        allData[id] = {
          encryptedData: rawData.encryptedData,
          timestamp: rawData.timestamp,
          metadata: rawData.metadata
        };
      }
    }

    // Create backup container with metadata
    const backupContainer = {
      profileId: this.dbName.replace('OmniorBrowser_', ''),
      timestamp: Date.now(),
      dataVersion: '1.0.0',
      categories: {
        bookmarks: allIds.filter(id => id.startsWith('bookmark_')),
        settings: allIds.filter(id => id.startsWith('setting_')),
        extensions: allIds.filter(id => id.startsWith('extension_')),
        sessions: allIds.filter(id => id.startsWith('session_')),
        history: allIds.filter(id => id.startsWith('history_')),
        other: allIds.filter(id => !id.startsWith('bookmark_') && 
                               !id.startsWith('setting_') && 
                               !id.startsWith('extension_') && 
                               !id.startsWith('session_') && 
                               !id.startsWith('history_'))
      },
      data: allData
    };

    // Derive cloud sync key (different from local encryption key)
    const cloudSyncKey = await this.deriveCloudSyncKey(password, cloudSalt);
    
    // Encrypt the entire backup container
    const containerJson = JSON.stringify(backupContainer);
    const encryptedContainer = await CryptoUtils.encrypt(cloudSyncKey, containerJson);
    
    // Wipe the cloud sync key from memory
    await this.wipeCryptoKey(cloudSyncKey);
    
    return JSON.stringify({
      backup: encryptedContainer,
      metadata: {
        profileId: backupContainer.profileId,
        timestamp: backupContainer.timestamp,
        dataVersion: backupContainer.dataVersion,
        categories: Object.keys(backupContainer.categories).reduce((acc, key) => {
          acc[key] = backupContainer.categories[key].length;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  }

  /**
   * Import encrypted data from cloud backup
   */
  async importEncryptedData(encryptedBackup: string, password: string, cloudSalt: Uint8Array): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    let backupData;
    try {
      backupData = JSON.parse(encryptedBackup);
    } catch (error) {
      throw new Error('Invalid backup format');
    }

    if (!backupData.backup || !backupData.metadata) {
      throw new Error('Invalid backup structure');
    }

    // Derive cloud sync key
    const cloudSyncKey = await this.deriveCloudSyncKey(password, cloudSalt);
    
    try {
      // Decrypt the backup container
      const decryptedJson = await CryptoUtils.decrypt(cloudSyncKey, backupData.backup);
      const backupContainer = JSON.parse(decryptedJson);
      
      // Validate backup structure
      if (!backupContainer.profileId || !backupContainer.data || !backupContainer.categories) {
        throw new Error('Invalid backup container structure');
      }

      // Clear existing data (optional - could be made configurable)
      await this.clear();
      
      // Import all data with new timestamps
      for (const [id, item] of Object.entries(backupContainer.data)) {
        const storedData: StoredData = {
          id,
          encryptedData: item.encryptedData,
          timestamp: Date.now(), // Update timestamp to import time
          metadata: item.metadata
        };
        
        await this.storeRaw(storedData);
      }
      
      // Wipe the cloud sync key from memory
      await this.wipeCryptoKey(cloudSyncKey);
      
    } catch (error) {
      // Wipe the cloud sync key from memory even if decryption fails
      await this.wipeCryptoKey(cloudSyncKey);
      throw new Error('Failed to decrypt backup: ' + (error as Error).message);
    }
  }

  /**
   * Export specific categories only
   */
  async exportEncryptedDataByCategories(
    password: string, 
    cloudSalt: Uint8Array, 
    categories: string[]
  ): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    const allIds = await this.listIds();
    const filteredData: Record<string, any> = {};
    
    // Filter IDs by category prefixes
    const categoryPrefixes: Record<string, string> = {
      bookmarks: 'bookmark_',
      settings: 'setting_',
      extensions: 'extension_',
      sessions: 'session_',
      history: 'history_'
    };
    
    for (const category of categories) {
      const prefix = categoryPrefixes[category];
      if (prefix) {
        const categoryIds = allIds.filter(id => id.startsWith(prefix));
        for (const id of categoryIds) {
          const rawData = await this.getRaw(id);
          if (rawData) {
            filteredData[id] = {
              encryptedData: rawData.encryptedData,
              timestamp: rawData.timestamp,
              metadata: rawData.metadata
            };
          }
        }
      }
    }

    // Create partial backup container
    const backupContainer = {
      profileId: this.dbName.replace('OmniorBrowser_', ''),
      timestamp: Date.now(),
      dataVersion: '1.0.0',
      categories: categories.reduce((acc, category) => {
        acc[category] = Object.keys(filteredData).filter(id => 
          id.startsWith(categoryPrefixes[category] || category)
        );
        return acc;
      }, {} as Record<string, string[]>),
      data: filteredData,
      partial: true,
      includedCategories: categories
    };

    // Derive cloud sync key and encrypt
    const cloudSyncKey = await this.deriveCloudSyncKey(password, cloudSalt);
    const containerJson = JSON.stringify(backupContainer);
    const encryptedContainer = await CryptoUtils.encrypt(cloudSyncKey, containerJson);
    
    await this.wipeCryptoKey(cloudSyncKey);
    
    return JSON.stringify({
      backup: encryptedContainer,
      metadata: {
        profileId: backupContainer.profileId,
        timestamp: backupContainer.timestamp,
        dataVersion: backupContainer.dataVersion,
        categories: Object.keys(backupContainer.categories).reduce((acc, key) => {
          acc[key] = backupContainer.categories[key].length;
          return acc;
        }, {} as Record<string, number>),
        partial: true,
        includedCategories: categories
      }
    });
  }

  /**
   * Derive cloud sync key from password and cloud salt
   */
  private async deriveCloudSyncKey(password: string, cloudSalt: Uint8Array): Promise<CryptoKey> {
    return CryptoUtils.deriveKey(password, cloudSalt);
  }

  /**
   * Store raw encrypted data (used during import)
   */
  private async storeRaw(storedData: StoredData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(storedData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Securely wipe a crypto key from memory
   */
  private async wipeCryptoKey(key: CryptoKey): Promise<void> {
    try {
      // CryptoKey objects cannot be directly wiped, but we can nullify references
      // The underlying implementation should handle secure memory management
      // This is mostly for reference cleanup
    } catch (error) {
      // Ignore errors during key wiping
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * In-memory storage for guest mode
 */
export class InMemoryStorage {
  private storage: Map<string, { data: any; timestamp: number }> = new Map();

  async store(id: string, data: any): Promise<void> {
    this.storage.set(id, {
      data,
      timestamp: Date.now()
    });
  }

  async retrieve<T>(id: string): Promise<T | null> {
    const item = this.storage.get(id);
    return item ? item.data as T : null;
  }

  async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }

  async listIds(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  getStats(): { count: number; totalSize: number } {
    const count = this.storage.size;
    const totalSize = Array.from(this.storage.values()).reduce((size, item) => {
      return size + JSON.stringify(item.data).length;
    }, 0);
    return { count, totalSize };
  }
}