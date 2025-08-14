/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import type { OmniorTab, TabId } from '../common/models';
import type { OmniorTabService } from './service';

interface TabsState {
  tabs: OmniorTab[];
  activeTabId: TabId | null;
  isLoading: boolean;
  error: string | null;
}

interface TabsActions {
  setTabs: (tabs: OmniorTab[]) => void;
  setActiveTabId: (id: TabId | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useTabsStore = create<TabsState & TabsActions>((set) => ({
  tabs: [],
  activeTabId: null,
  isLoading: false,
  error: null,
  
  setTabs: (tabs) => set({ tabs }),
  setActiveTabId: (activeTabId) => set({ activeTabId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ tabs: [], activeTabId: null, isLoading: false, error: null }),
}));

export class TabsStoreManager {
  private service: OmniorTabService;
  private store = useTabsStore.getState();

  constructor(service: OmniorTabService) {
    this.service = service;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.service.on('tab-created', (tab: OmniorTab) => {
      useTabsStore.getState().setTabs(this.service.list());
    });

    this.service.on('tab-updated', (tab: OmniorTab) => {
      useTabsStore.getState().setTabs(this.service.list());
    });

    this.service.on('tab-closed', (tab: OmniorTab) => {
      useTabsStore.getState().setTabs(this.service.list());
    });

    this.service.on('tab-moved', (tab: OmniorTab) => {
      useTabsStore.getState().setTabs(this.service.list());
    });

    this.service.on('tab-activated', (tab: OmniorTab) => {
      useTabsStore.getState().setActiveTabId(tab.id);
    });
  }

  async initialize(): Promise<void> {
    try {
      useTabsStore.getState().setLoading(true);
      await this.service.restore();
      useTabsStore.getState().setTabs(this.service.list());
      useTabsStore.getState().setActiveTabId(this.service.active()?.id || null);
    } catch (error) {
      useTabsStore.getState().setError(error instanceof Error ? error.message : 'Failed to initialize tabs');
    } finally {
      useTabsStore.getState().setLoading(false);
    }
  }
}