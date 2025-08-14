/**
 * Omnior Store Framework
 * 
 * A custom extension system for Omnior Browser that provides:
 * - Sandboxed extension execution
 * - Secure API access
 * - Permission management
 * - Extension lifecycle management
 */

export interface ExtensionManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  icons?: {
    '16': string;
    '48': string;
    '128': string;
  };
  permissions: ExtensionPermission[];
  content_scripts?: ContentScript[];
  background?: BackgroundScript;
  browser_action?: BrowserAction;
  page_action?: PageAction;
  options_page?: string;
  web_accessible_resources?: string[];
  minimum_omnior_version: string;
}

export type ExtensionPermission = 
  | 'storage'
  | 'tabs'
  | 'downloads'
  | 'bookmarks'
  | 'history'
  | 'cookies'
  | 'webNavigation'
  | 'webRequest'
  | 'notifications'
  | 'clipboardRead'
  | 'clipboardWrite'
  | 'nativeMessaging'
  | 'unlimitedStorage';

export interface ContentScript {
  matches: string[];
  css?: string[];
  js?: string[];
  run_at: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
}

export interface BackgroundScript {
  scripts: string[];
  persistent?: boolean;
}

export interface BrowserAction {
  default_title?: string;
  default_icon?: string | Record<string, string>;
  default_popup?: string;
}

export interface PageAction {
  default_title?: string;
  default_icon?: string | Record<string, string>;
  default_popup?: string;
}

export interface ExtensionContext {
  id: string;
  manifest: ExtensionManifest;
  permissions: ExtensionPermission[];
  storage: ExtensionStorage;
  tabs: TabsAPI;
  downloads: DownloadsAPI;
  bookmarks: BookmarksAPI;
  runtime: RuntimeAPI;
}

export interface ExtensionStorage {
  local: StorageArea;
  sync: StorageArea;
  managed: StorageArea;
}

export interface StorageArea {
  get(keys?: string | string[] | Record<string, any>): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface TabsAPI {
  create(createProperties: any): Promise<Tab>;
  query(queryInfo: any): Promise<Tab[]>;
  get(tabId: number): Promise<Tab>;
  update(tabId: number, updateProperties: any): Promise<Tab>;
  remove(tabId: number): Promise<void>;
  onCreated: Event<(tab: Tab) => void>;
  onUpdated: Event<(tabId: number, changeInfo: any, tab: Tab) => void>;
  onRemoved: Event<(tabId: number, removeInfo: any) => void>;
}

export interface DownloadsAPI {
  download(options: any): Promise<number>;
  search(query: any): Promise<DownloadItem[]>;
  pause(id: number): Promise<void>;
  resume(id: number): Promise<void>;
  cancel(id: number): Promise<void>;
  erase(query: any): Promise<number[]>;
  onCreated: Event<(downloadItem: DownloadItem) => void>;
  onChanged: Event<(delta: any) => void>;
}

export interface BookmarksAPI {
  create(bookmark: any): Promise<BookmarkTreeNode>;
  getTree(): Promise<BookmarkTreeNode[]>;
  remove(id: string): Promise<void>;
  update(id: string, changes: any): Promise<void>;
  onCreated: Event<(id: string, bookmark: BookmarkTreeNode) => void>;
  onRemoved: Event<(id: string, removeInfo: any) => void>;
  onChanged: Event<(id: string, changeInfo: any) => void>;
}

export interface RuntimeAPI {
  id: string;
  getURL(path: string): string;
  getManifest(): ExtensionManifest;
  connect(extensionId?: string, connectInfo?: any): Port;
  sendMessage(extensionId: string, message: any): Promise<any>;
  onMessage: Event<(message: any, sender: any, sendResponse: (response: any) => void) => void>;
  onConnect: Event<(port: Port) => void>;
  onInstalled: Event<(details: any) => void>;
}

export interface Tab {
  id: number;
  index: number;
  windowId: number;
  active: boolean;
  pinned: boolean;
  highlighted: boolean;
  discarded: boolean;
  autoDiscardable: boolean;
  url: string;
  title: string;
  favIconUrl?: string;
  status?: 'loading' | 'complete';
  incognito?: boolean;
  width?: number;
  height?: number;
}

export interface DownloadItem {
  id: number;
  url: string;
  filename: string;
  danger: 'safe' | 'suspicious' | 'dangerous';
  mime: string;
  startTime: string;
  endTime?: string;
  estimatedEndTime?: string;
  state: 'in_progress' | 'interrupted' | 'complete';
  paused: boolean;
  canResume: boolean;
  error?: string;
  totalBytes: number;
  bytesReceived: number;
  estimatedTotalBytes?: number;
  fileSize?: number;
  exists: boolean;
}

export interface BookmarkTreeNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkTreeNode[];
}

export interface Port {
  name: string;
  sender: any;
  disconnect(): void;
  postMessage(message: any): void;
  onDisconnect: Event<(port: Port) => void>;
  onMessage: Event<(message: any) => void>;
}

export interface Event<T> {
  addListener(callback: T): void;
  removeListener(callback: T): void;
  hasListener(callback: T): boolean;
}

export class OmniorStore {
  private extensions: Map<string, ExtensionContext> = new Map();
  private activeExtensions: Set<string> = new Set();
  private eventEmitter = new EventTarget();

  async installExtension(manifest: ExtensionManifest, extensionId: string): Promise<void> {
    // Validate manifest
    this.validateManifest(manifest);
    
    // Check permissions
    await this.checkPermissions(manifest.permissions);
    
    // Create extension context
    const context: ExtensionContext = {
      id: extensionId,
      manifest,
      permissions: manifest.permissions,
      storage: this.createStorageAPI(extensionId),
      tabs: this.createTabsAPI(),
      downloads: this.createDownloadsAPI(),
      bookmarks: this.createBookmarksAPI(),
      runtime: this.createRuntimeAPI(extensionId, manifest),
    };

    this.extensions.set(extensionId, context);
    
    // Emit installation event
    this.eventEmitter.dispatchEvent(new CustomEvent('extensionInstalled', {
      detail: { extensionId, manifest }
    }));
  }

  async uninstallExtension(extensionId: string): Promise<void> {
    const context = this.extensions.get(extensionId);
    if (!context) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    // Deactivate if active
    if (this.activeExtensions.has(extensionId)) {
      await this.deactivateExtension(extensionId);
    }

    // Remove extension
    this.extensions.delete(extensionId);
    
    // Emit uninstallation event
    this.eventEmitter.dispatchEvent(new CustomEvent('extensionUninstalled', {
      detail: { extensionId }
    }));
  }

  async activateExtension(extensionId: string): Promise<void> {
    const context = this.extensions.get(extensionId);
    if (!context) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    // Load background scripts if any
    if (context.manifest.background) {
      await this.loadBackgroundScripts(extensionId, context.manifest.background);
    }

    // Inject content scripts
    if (context.manifest.content_scripts) {
      await this.injectContentScripts(extensionId, context.manifest.content_scripts);
    }

    this.activeExtensions.add(extensionId);
    
    // Emit activation event
    this.eventEmitter.dispatchEvent(new CustomEvent('extensionActivated', {
      detail: { extensionId }
    }));
  }

  async deactivateExtension(extensionId: string): Promise<void> {
    const context = this.extensions.get(extensionId);
    if (!context) {
      throw new Error(`Extension ${extensionId} not found`);
    }

    // Remove content scripts
    if (context.manifest.content_scripts) {
      await this.removeContentScripts(extensionId, context.manifest.content_scripts);
    }

    // Unload background scripts
    if (context.manifest.background) {
      await this.unloadBackgroundScripts(extensionId);
    }

    this.activeExtensions.delete(extensionId);
    
    // Emit deactivation event
    this.eventEmitter.dispatchEvent(new CustomEvent('extensionDeactivated', {
      detail: { extensionId }
    }));
  }

  getExtension(extensionId: string): ExtensionContext | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): ExtensionContext[] {
    return Array.from(this.extensions.values());
  }

  getActiveExtensions(): ExtensionContext[] {
    return Array.from(this.activeExtensions).map(id => this.extensions.get(id)!);
  }

  isExtensionActive(extensionId: string): boolean {
    return this.activeExtensions.has(extensionId);
  }

  private validateManifest(manifest: ExtensionManifest): void {
    if (!manifest.name || !manifest.version) {
      throw new Error('Extension manifest must include name and version');
    }

    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      throw new Error('Extension manifest must include permissions array');
    }

    // Validate minimum version requirement
    if (manifest.minimum_omnior_version) {
      const currentVersion = '1.0.0'; // Current Omnior version
      if (!this.isVersionCompatible(currentVersion, manifest.minimum_omnior_version)) {
        throw new Error(`Extension requires Omnior ${manifest.minimum_omnior_version} or higher`);
      }
    }
  }

  private async checkPermissions(permissions: ExtensionPermission[]): Promise<void> {
    // Check if requested permissions are available and allowed
    const availablePermissions: ExtensionPermission[] = [
      'storage', 'tabs', 'downloads', 'bookmarks', 'history', 'cookies',
      'webNavigation', 'webRequest', 'notifications', 'clipboardRead',
      'clipboardWrite', 'nativeMessaging', 'unlimitedStorage'
    ];

    const invalidPermissions = permissions.filter(p => !availablePermissions.includes(p));
    if (invalidPermissions.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }
  }

  private createStorageAPI(extensionId: string): ExtensionStorage {
    return {
      local: this.createStorageArea(extensionId, 'local'),
      sync: this.createStorageArea(extensionId, 'sync'),
      managed: this.createStorageArea(extensionId, 'managed'),
    };
  }

  private createStorageArea(extensionId: string, area: string): StorageArea {
    return {
      get: async (keys?: any) => {
        // Implement storage retrieval logic
        return {};
      },
      set: async (items: Record<string, any>) => {
        // Implement storage setting logic
      },
      remove: async (keys: string | string[]) => {
        // Implement storage removal logic
      },
      clear: async () => {
        // Implement storage clearing logic
      },
    };
  }

  private createTabsAPI(): TabsAPI {
    return {
      create: async (createProperties: any) => {
        // Implement tab creation logic
        return {} as Tab;
      },
      query: async (queryInfo: any) => {
        // Implement tab query logic
        return [];
      },
      get: async (tabId: number) => {
        // Implement tab get logic
        return {} as Tab;
      },
      update: async (tabId: number, updateProperties: any) => {
        // Implement tab update logic
        return {} as Tab;
      },
      remove: async (tabId: number) => {
        // Implement tab removal logic
      },
      onCreated: this.createEvent<(tab: Tab) => void>(),
      onUpdated: this.createEvent<(tabId: number, changeInfo: any, tab: Tab) => void>(),
      onRemoved: this.createEvent<(tabId: number, removeInfo: any) => void>(),
    };
  }

  private createDownloadsAPI(): DownloadsAPI {
    return {
      download: async (options: any) => {
        // Implement download logic
        return 0;
      },
      search: async (query: any) => {
        // Implement download search logic
        return [];
      },
      pause: async (id: number) => {
        // Implement download pause logic
      },
      resume: async (id: number) => {
        // Implement download resume logic
      },
      cancel: async (id: number) => {
        // Implement download cancel logic
      },
      erase: async (query: any) => {
        // Implement download erase logic
        return [];
      },
      onCreated: this.createEvent<(downloadItem: DownloadItem) => void>(),
      onChanged: this.createEvent<(delta: any) => void>(),
    };
  }

  private createBookmarksAPI(): BookmarksAPI {
    return {
      create: async (bookmark: any) => {
        // Implement bookmark creation logic
        return {} as BookmarkTreeNode;
      },
      getTree: async () => {
        // Implement bookmark tree retrieval logic
        return [];
      },
      remove: async (id: string) => {
        // Implement bookmark removal logic
      },
      update: async (id: string, changes: any) => {
        // Implement bookmark update logic
      },
      onCreated: this.createEvent<(id: string, bookmark: BookmarkTreeNode) => void>(),
      onRemoved: this.createEvent<(id: string, removeInfo: any) => void>(),
      onChanged: this.createEvent<(id: string, changeInfo: any) => void>(),
    };
  }

  private createRuntimeAPI(extensionId: string, manifest: ExtensionManifest): RuntimeAPI {
    return {
      id: extensionId,
      getURL: (path: string) => {
        return `omnior-extension://${extensionId}/${path}`;
      },
      getManifest: () => manifest,
      connect: (extensionId?: string, connectInfo?: any) => {
        // Implement connection logic
        return {} as Port;
      },
      sendMessage: async (extensionId: string, message: any) => {
        // Implement message sending logic
        return null;
      },
      onMessage: this.createEvent<(message: any, sender: any, sendResponse: (response: any) => void) => void>(),
      onConnect: this.createEvent<(port: Port) => void>(),
      onInstalled: this.createEvent<(details: any) => void>(),
    };
  }

  private createEvent<T>(): Event<T> {
    return {
      addListener: (callback: T) => {
        // Implement listener addition
      },
      removeListener: (callback: T) => {
        // Implement listener removal
      },
      hasListener: (callback: T) => {
        // Implement listener check
        return false;
      },
    };
  }

  private async loadBackgroundScripts(extensionId: string, background: BackgroundScript): Promise<void> {
    // Implement background script loading logic
    console.log(`Loading background scripts for extension ${extensionId}`);
  }

  private async unloadBackgroundScripts(extensionId: string): Promise<void> {
    // Implement background script unloading logic
    console.log(`Unloading background scripts for extension ${extensionId}`);
  }

  private async injectContentScripts(extensionId: string, contentScripts: ContentScript[]): Promise<void> {
    // Implement content script injection logic
    console.log(`Injecting content scripts for extension ${extensionId}`);
  }

  private async removeContentScripts(extensionId: string, contentScripts: ContentScript[]): Promise<void> {
    // Implement content script removal logic
    console.log(`Removing content scripts for extension ${extensionId}`);
  }

  private isVersionCompatible(current: string, required: string): boolean {
    // Simple version comparison (can be enhanced)
    return current >= required;
  }

  // Event listeners for extension lifecycle
  onExtensionInstalled(callback: (extensionId: string, manifest: ExtensionManifest) => void): void {
    this.eventEmitter.addEventListener('extensionInstalled', (event: any) => {
      callback(event.detail.extensionId, event.detail.manifest);
    });
  }

  onExtensionUninstalled(callback: (extensionId: string) => void): void {
    this.eventEmitter.addEventListener('extensionUninstalled', (event: any) => {
      callback(event.detail.extensionId);
    });
  }

  onExtensionActivated(callback: (extensionId: string) => void): void {
    this.eventEmitter.addEventListener('extensionActivated', (event: any) => {
      callback(event.detail.extensionId);
    });
  }

  onExtensionDeactivated(callback: (extensionId: string) => void): void {
    this.eventEmitter.addEventListener('extensionDeactivated', (event: any) => {
      callback(event.detail.extensionId);
    });
  }
}

// Global store instance
export const omniorStore = new OmniorStore();