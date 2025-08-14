/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import type { DownloadItem } from '../common/models';
import type { OmniorDownloadManager } from './manager';

interface DownloadsState {
  downloads: DownloadItem[];
  isLoading: boolean;
  error: string | null;
}

interface DownloadsActions {
  setDownloads: (downloads: DownloadItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDownloadsStore = create<DownloadsState & DownloadsActions>((set) => ({
  downloads: [],
  isLoading: false,
  error: null,
  
  setDownloads: (downloads) => set({ downloads }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ 
    downloads: [], 
    isLoading: false, 
    error: null 
  }),
}));

export class DownloadsStoreManager {
  private service: OmniorDownloadManager;
  private store = useDownloadsStore.getState();

  constructor(service: OmniorDownloadManager) {
    this.service = service;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('update', (download: DownloadItem) => {
      useDownloadsStore.getState().setDownloads(this.service.list());
    });

    this.service.on('completed', (download: DownloadItem) => {
      useDownloadsStore.getState().setDownloads(this.service.list());
    });

    this.service.on('failed', (download: DownloadItem) => {
      useDownloadsStore.getState().setDownloads(this.service.list());
    });
  }

  async initialize(): Promise<void> {
    try {
      useDownloadsStore.getState().setLoading(true);
      await this.service.restore();
      useDownloadsStore.getState().setDownloads(this.service.list());
    } catch (error) {
      useDownloadsStore.getState().setError(error instanceof Error ? error.message : 'Failed to initialize downloads');
    } finally {
      useDownloadsStore.getState().setLoading(false);
    }
  }
}