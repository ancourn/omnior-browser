/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import type { Settings } from '../common/models';
import type { OmniorSettingsService } from './service';

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

interface SettingsActions {
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  settings: {
    homepage: 'about:blank',
    defaultSearch: 'https://duckduckgo.com/?q={query}',
    downloadDir: '~/Downloads',
    newTabBehavior: 'home',
    privacy: {
      doNotTrack: true,
      blockThirdPartyCookies: true,
    },
    appearance: {
      theme: 'system',
      density: 'cozy',
    },
    security: {
      autoLockMinutes: 30,
    },
  },
  isLoading: false,
  error: null,
  
  setSettings: (settings) => set({ settings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    settings: {
      homepage: 'about:blank',
      defaultSearch: 'https://duckduckgo.com/?q={query}',
      downloadDir: '~/Downloads',
      newTabBehavior: 'home',
      privacy: {
        doNotTrack: true,
        blockThirdPartyCookies: true,
      },
      appearance: {
        theme: 'system',
        density: 'cozy',
      },
      security: {
        autoLockMinutes: 30,
      },
    },
    isLoading: false, 
    error: null 
  }),
}));

export class SettingsStoreManager {
  private service: OmniorSettingsService;
  private store = useSettingsStore.getState();

  constructor(service: OmniorSettingsService) {
    this.service = service;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('settings-updated', (settings: Settings) => {
      useSettingsStore.getState().setSettings(settings);
    });

    this.service.on('settings-reset', () => {
      useSettingsStore.getState().setSettings(this.service.get());
    });
  }

  async initialize(): Promise<void> {
    try {
      useSettingsStore.getState().setLoading(true);
      await this.service.restore();
      useSettingsStore.getState().setSettings(this.service.get());
    } catch (error) {
      useSettingsStore.getState().setError(error instanceof Error ? error.message : 'Failed to initialize settings');
    } finally {
      useSettingsStore.getState().setLoading(false);
    }
  }
}