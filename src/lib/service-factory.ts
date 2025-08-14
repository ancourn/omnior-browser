/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { useAuthStore } from '@/lib/auth/store';
import { OmniorTabService } from '@/core/tabs/service';
import { OmniorBookmarkService } from '@/core/bookmarks/service';
import { OmniorHistoryService } from '@/core/history/service';
import { OmniorSettingsService } from '@/core/settings/service';
import { OmniorDownloadManager } from '@/core/downloads/manager';
import { TabsStoreManager } from '@/core/tabs/store';
import { BookmarksStoreManager } from '@/core/bookmarks/store';
import { HistoryStoreManager } from '@/core/history/store';
import { SettingsStoreManager } from '@/core/settings/store';
import { DownloadsStoreManager } from '@/core/downloads/store';

export interface BrowserServices {
  tabs: OmniorTabService;
  bookmarks: OmniorBookmarkService;
  history: OmniorHistoryService;
  settings: OmniorSettingsService;
  downloads: OmniorDownloadManager;
}

export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: BrowserServices | null = null;
  private storeManagers: {
    tabs: TabsStoreManager;
    bookmarks: BookmarksStoreManager;
    history: HistoryStoreManager;
    settings: SettingsStoreManager;
    downloads: DownloadsStoreManager;
  } | null = null;

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  async initializeServices(): Promise<BrowserServices> {
    if (this.services) {
      return this.services;
    }

    const { profileId, isGuest } = useAuthStore.getState();
    
    // Create services
    const settingsService = new OmniorSettingsService(profileId);
    const tabsService = new OmniorTabService(profileId);
    const bookmarksService = new OmniorBookmarkService(profileId);
    const historyService = new OmniorHistoryService(profileId, settingsService);
    const downloadsService = new OmniorDownloadManager(profileId);

    this.services = {
      tabs: tabsService,
      bookmarks: bookmarksService,
      history: historyService,
      settings: settingsService,
      downloads: downloadsService,
    };

    // Initialize store managers
    this.storeManagers = {
      tabs: new TabsStoreManager(tabsService),
      bookmarks: new BookmarksStoreManager(bookmarksService),
      history: new HistoryStoreManager(historyService),
      settings: new SettingsStoreManager(settingsService),
      downloads: new DownloadsStoreManager(downloadsService),
    };

    // Initialize all services in parallel
    await Promise.all([
      this.storeManagers.settings.initialize(),
      this.storeManagers.tabs.initialize(),
      this.storeManagers.bookmarks.initialize(),
      this.storeManagers.history.initialize(),
      this.storeManagers.downloads.initialize(),
    ]);

    return this.services;
  }

  getServices(): BrowserServices {
    if (!this.services) {
      throw new Error('Services not initialized. Call initializeServices() first.');
    }
    return this.services;
  }

  async destroy(): Promise<void> {
    if (this.services) {
      // Persist all services before destroying
      await Promise.all([
        this.services!.settings.persist(),
        this.services!.tabs.persist(),
        this.services!.bookmarks.persist(),
        this.services!.history.persist(),
        this.services!.downloads.persist(),
      ]);

      this.services = null;
      this.storeManagers = null;
    }
  }
}

export const serviceFactory = ServiceFactory.getInstance();