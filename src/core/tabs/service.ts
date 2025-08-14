/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import type { TabId, ProfileId, OmniorTab } from '../common/models';
import { SimpleEventEmitter } from '../common/models';
import { StorageKeys } from '../common/storage-keys';
import { getSecureStorage } from '@/lib/auth/secure-storage';

export interface TabService {
  list(): OmniorTab[];
  active(): OmniorTab | null;
  create(input: Partial<OmniorTab> & { url: string }): OmniorTab;
  update(id: TabId, patch: Partial<OmniorTab>): void;
  activate(id: TabId): void;
  close(id: TabId): void;
  closeOthers(id: TabId): void;
  move(id: TabId, toIndex: number): void;
  pin(id: TabId, pinned: boolean): void;
  persist(): Promise<void>;
  restore(): Promise<void>;
  on(event: string, callback: (...args: any[]) => void): () => void;
}

export class OmniorTabService extends SimpleEventEmitter implements TabService {
  private tabs: OmniorTab[] = [];
  private activeTabId: TabId | null = null;
  private closedTabs: OmniorTab[] = [];
  private profileId: ProfileId;
  private persistTimeout: NodeJS.Timeout | null = null;

  constructor(profileId: ProfileId) {
    super();
    this.profileId = profileId;
  }

  list(): OmniorTab[] {
    return [...this.tabs];
  }

  active(): OmniorTab | null {
    return this.tabs.find(tab => tab.id === this.activeTabId) || null;
  }

  create(input: Partial<OmniorTab> & { url: string }): OmniorTab {
    const tab: OmniorTab = {
      id: this.generateTabId(),
      title: input.title || input.url,
      url: input.url,
      favicon: input.favicon,
      pinned: input.pinned || false,
      audible: input.audible || false,
      groupId: input.groupId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.schedulePersist();
    this.emit('tab-created', tab);
    this.emit('tab-activated', tab);
    
    return tab;
  }

  update(id: TabId, patch: Partial<OmniorTab>): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === id);
    if (tabIndex === -1) {
      throw new Error(`Tab with id ${id} not found`);
    }

    this.tabs[tabIndex] = {
      ...this.tabs[tabIndex],
      ...patch,
      updatedAt: Date.now(),
    };

    this.schedulePersist();
    this.emit('tab-updated', this.tabs[tabIndex]);
  }

  activate(id: TabId): void {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab) {
      throw new Error(`Tab with id ${id} not found`);
    }

    this.activeTabId = id;
    this.emit('tab-activated', tab);
  }

  close(id: TabId): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === id);
    if (tabIndex === -1) {
      throw new Error(`Tab with id ${id} not found`);
    }

    const closedTab = this.tabs[tabIndex];
    this.tabs.splice(tabIndex, 1);

    // Add to closed tabs LRU (max 10)
    this.closedTabs.unshift(closedTab);
    if (this.closedTabs.length > 10) {
      this.closedTabs = this.closedTabs.slice(0, 10);
    }

    // Update active tab if needed
    if (this.activeTabId === id) {
      this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
      if (this.activeTabId) {
        this.emit('tab-activated', this.tabs.find(t => t.id === this.activeTabId)!);
      }
    }

    this.schedulePersist();
    this.emit('tab-closed', closedTab);
  }

  closeOthers(id: TabId): void {
    const tabsToClose = this.tabs.filter(tab => tab.id !== id && !tab.pinned);
    tabsToClose.forEach(tab => this.close(tab.id));
  }

  move(id: TabId, toIndex: number): void {
    const fromIndex = this.tabs.findIndex(tab => tab.id === id);
    if (fromIndex === -1) {
      throw new Error(`Tab with id ${id} not found`);
    }

    const [movedTab] = this.tabs.splice(fromIndex, 1);
    this.tabs.splice(toIndex, 0, movedTab);
    
    this.schedulePersist();
    this.emit('tab-moved', movedTab, fromIndex, toIndex);
  }

  pin(id: TabId, pinned: boolean): void {
    this.update(id, { pinned });
  }

  async persist(): Promise<void> {
    const storage = getSecureStorage();
    const tabsData = {
      tabs: this.tabs,
      activeTabId: this.activeTabId,
      closedTabs: this.closedTabs,
    };

    await storage.set(StorageKeys.tabs(this.profileId), tabsData);
    await storage.set(StorageKeys.closedTabs(this.profileId), this.closedTabs);
  }

  async restore(): Promise<void> {
    const storage = getSecureStorage();
    try {
      const tabsData = await storage.get(StorageKeys.tabs(this.profileId));
      if (tabsData) {
        this.tabs = tabsData.tabs || [];
        this.activeTabId = tabsData.activeTabId || null;
        this.closedTabs = tabsData.closedTabs || [];
      }

      const closedTabsData = await storage.get(StorageKeys.closedTabs(this.profileId));
      if (closedTabsData) {
        this.closedTabs = closedTabsData;
      }
    } catch (error) {
      console.error('Failed to restore tabs:', error);
    }
  }

  reopenClosedTab(): OmniorTab | null {
    if (this.closedTabs.length === 0) {
      return null;
    }

    const tab = this.closedTabs.shift()!;
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.schedulePersist();
    this.emit('tab-created', tab);
    this.emit('tab-activated', tab);
    
    return tab;
  }

  private schedulePersist(): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }

    this.persistTimeout = setTimeout(() => {
      this.persist();
    }, 300);
  }

  private generateTabId(): TabId {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}