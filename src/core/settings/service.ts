/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import type { ProfileId, Settings } from '../common/models';
import { SimpleEventEmitter } from '../common/models';
import { StorageKeys } from '../common/storage-keys';
import { getDefaultSettings, validateSettings } from '../common/validators';
import { getSecureStorage } from '@/lib/auth/secure-storage';

export interface SettingsService {
  get(): Settings;
  set(patch: Partial<Settings>): Promise<Settings>;
  reset(): Promise<Settings>;
  restore(): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): () => void;
}

export class OmniorSettingsService extends SimpleEventEmitter implements SettingsService {
  private settings: Settings;
  private profileId: ProfileId;
  private persistTimeout: NodeJS.Timeout | null = null;

  constructor(profileId: ProfileId) {
    super();
    this.profileId = profileId;
    this.settings = getDefaultSettings();
  }

  get(): Settings {
    return { ...this.settings };
  }

  async set(patch: Partial<Settings>): Promise<Settings> {
    try {
      // Validate the patch
      const newSettings = { ...this.settings, ...patch };
      const validatedSettings = validateSettings(newSettings);
      
      this.settings = validatedSettings;
      this.schedulePersist();
      this.emit('settings-updated', this.settings);
      
      return this.settings;
    } catch (error) {
      throw new Error(`Invalid settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reset(): Promise<Settings> {
    this.settings = getDefaultSettings();
    this.schedulePersist();
    this.emit('settings-updated', this.settings);
    this.emit('settings-reset');
    
    return this.settings;
  }

  async restore(): Promise<void> {
    const storage = getSecureStorage();
    try {
      const savedSettings = await storage.get(StorageKeys.settings(this.profileId));
      if (savedSettings) {
        const validatedSettings = validateSettings(savedSettings);
        this.settings = validatedSettings;
        this.emit('settings-updated', this.settings);
      }
    } catch (error) {
      console.error('Failed to restore settings:', error);
      // Use default settings if restore fails
      this.settings = getDefaultSettings();
    }
  }

  private schedulePersist(): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persist();
    }, 300);
  }

  private async persist(): Promise<void> {
    const storage = getSecureStorage();
    await storage.set(StorageKeys.settings(this.profileId), this.settings);
  }
}