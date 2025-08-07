import { app, dialog, ipcMain, BrowserWindow } from 'electron';
import { join } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface Omnifest {
  manifest_version: number;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage_url?: string;
  icons: {
    '16': string;
    '48': string;
    '128': string;
  };
  category: 'developer' | 'designer' | 'student' | 'writer' | 'security' | 'productivity';
  permissions: ExtensionPermission[];
  background?: {
    scripts: string[];
    persistent?: boolean;
  };
  content_scripts?: ContentScript[];
  browser_action?: BrowserAction;
  page_action?: PageAction;
  options_page?: string;
  options_ui?: {
    page: string;
    open_in_tab: boolean;
  };
  web_accessible_resources?: string[];
  minimum_omnior_version: string;
}

export interface ExtensionPermission {
  name: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

export interface ContentScript {
  matches: string[];
  css?: string[];
  js?: string[];
  run_at: 'document_start' | 'document_end' | 'document_idle';
}

export interface BrowserAction {
  default_title: string;
  default_icon: string;
  default_popup?: string;
}

export interface PageAction {
  default_title: string;
  default_icon: string;
  default_popup?: string;
}

export interface Extension {
  id: string;
  omnifest: Omnifest;
  path: string;
  enabled: boolean;
  installedAt: number;
  lastUpdated: number;
  permissions: string[];
  backgroundScripts?: string[];
  contentScripts: ContentScript[];
  browserAction?: BrowserAction;
  pageAction?: PageAction;
  optionsPage?: string;
}

export interface ExtensionInstance {
  id: string;
  extensionId: string;
  context: any;
  backgroundPage?: Electron.BrowserView;
  contentScripts: Map<string, any>;
  installedAt: number;
}

export class ExtensionStore {
  private extensions: Map<string, Extension> = new Map();
  private extensionInstances: Map<string, ExtensionInstance> = new Map();
  private extensionsPath: string;
  private storeWindow: BrowserWindow | null = null;

  constructor() {
    this.extensionsPath = join(app.getPath('userData'), 'extensions');
    this.initialize();
  }

  private async initialize() {
    try {
      await this.ensureExtensionsDirectory();
      await this.loadInstalledExtensions();
      this.setupIPCHandlers();
    } catch (error) {
      console.error('Failed to initialize ExtensionStore:', error);
    }
  }

  private async ensureExtensionsDirectory() {
    try {
      await fs.mkdir(this.extensionsPath, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private async loadInstalledExtensions() {
    try {
      const extensionsFile = join(this.extensionsPath, 'extensions.json');
      const data = await fs.readFile(extensionsFile, 'utf-8');
      const saved = JSON.parse(data);

      if (saved && Array.isArray(saved)) {
        for (const extensionData of saved) {
          this.extensions.set(extensionData.id, extensionData);
        }
      }
    } catch (error) {
      // No existing extensions file
      console.log('No existing extensions found, starting fresh');
    }
  }

  private async saveExtensions() {
    try {
      const extensionsFile = join(this.extensionsPath, 'extensions.json');
      const extensions = Array.from(this.extensions.values());
      await fs.writeFile(
        extensionsFile,
        JSON.stringify(extensions, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save extensions:', error);
    }
  }

  private setupIPCHandlers() {
    // Store management
    ipcMain.handle('open-store', async () => {
      return await this.openStore();
    });

    ipcMain.handle('close-store', async () => {
      return await this.closeStore();
    });

    ipcMain.handle('get-extensions', async () => {
      return Array.from(this.extensions.values());
    });

    ipcMain.handle('get-extension', async (event, extensionId: string) => {
      return this.extensions.get(extensionId) || null;
    });

    // Extension installation
    ipcMain.handle('install-extension', async (event, extensionPath: string) => {
      return await this.installExtension(extensionPath);
    });

    ipcMain.handle('install-extension-from-url', async (event, url: string) => {
      return await this.installExtensionFromUrl(url);
    });

    // Extension management
    ipcMain.handle('enable-extension', async (event, extensionId: string) => {
      return await this.enableExtension(extensionId);
    });

    ipcMain.handle('disable-extension', async (event, extensionId: string) => {
      return await this.disableExtension(extensionId);
    });

    ipcMain.handle('uninstall-extension', async (event, extensionId: string) => {
      return await this.uninstallExtension(extensionId);
    });

    ipcMain.handle('update-extension', async (event, extensionId: string) => {
      return await this.updateExtension(extensionId);
    });

    // Extension permissions
    ipcMain.handle('get-extension-permissions', async (event, extensionId: string) => {
      return await this.getExtensionPermissions(extensionId);
    });

    ipcMain.handle('grant-extension-permission', async (event, extensionId: string, permission: string) => {
      return await this.grantExtensionPermission(extensionId, permission);
    });

    ipcMain.handle('revoke-extension-permission', async (event, extensionId: string, permission: string) => {
      return await this.revokeExtensionPermission(extensionId, permission);
    });

    // Extension store data
    ipcMain.handle('get-featured-extensions', async () => {
      return await this.getFeaturedExtensions();
    });

    ipcMain.handle('search-extensions', async (event, query: string) => {
      return await this.searchExtensions(query);
    });

    ipcMain.handle('get-extensions-by-category', async (event, category: string) => {
      return await this.getExtensionsByCategory(category);
    });
  }

  public async openStore(): Promise<boolean> {
    if (this.storeWindow && !this.storeWindow.isDestroyed()) {
      this.storeWindow.focus();
      return true;
    }

    try {
      const { BrowserWindow } = await import('electron');
      
      this.storeWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          preload: (await import('path')).join(__dirname, '../../renderer/preload.js')
        },
        title: 'Omnior Extension Store',
        show: false
      });

      await this.storeWindow.loadFile((await import('path')).join(__dirname, '../../renderer/store.html'));

      this.storeWindow.once('ready-to-show', () => {
        this.storeWindow?.show();
      });

      this.storeWindow.on('closed', () => {
        this.storeWindow = null;
      });

      return true;
    } catch (error) {
      console.error('Failed to open store:', error);
      return false;
    }
  }

  public async closeStore(): Promise<boolean> {
    if (this.storeWindow && !this.storeWindow.isDestroyed()) {
      this.storeWindow.close();
      this.storeWindow = null;
      return true;
    }
    return false;
  }

  public async installExtension(extensionPath: string): Promise<string | null> {
    try {
      // Validate extension package
      const omnifest = await this.validateExtensionPackage(extensionPath);
      if (!omnifest) {
        throw new Error('Invalid extension package');
      }

      // Check permissions
      const permissionCheck = await this.checkExtensionPermissions(omnifest.permissions);
      if (!permissionCheck.allowed) {
        throw new Error(`Extension requires dangerous permissions: ${permissionCheck.denied.join(', ')}`);
      }

      // Generate extension ID
      const extensionId = uuidv4();
      
      // Copy extension files
      const extensionDir = join(this.extensionsPath, extensionId);
      await fs.mkdir(extensionDir, { recursive: true });
      
      // Copy all files from extension package
      // (In a real implementation, you'd extract a zip file here)
      
      // Create extension object
      const extension: Extension = {
        id: extensionId,
        omnifest,
        path: extensionDir,
        enabled: true,
        installedAt: Date.now(),
        lastUpdated: Date.now(),
        permissions: omnifest.permissions.map(p => p.name),
        backgroundScripts: omnifest.background?.scripts,
        contentScripts: omnifest.content_scripts || [],
        browserAction: omnifest.browser_action,
        pageAction: omnifest.page_action,
        optionsPage: omnifest.options_page || omnifest.options_ui?.page
      };

      this.extensions.set(extensionId, extension);
      await this.saveExtensions();

      // Initialize extension
      await this.initializeExtension(extension);

      return extensionId;
    } catch (error) {
      console.error('Failed to install extension:', error);
      return null;
    }
  }

  public async installExtensionFromUrl(url: string): Promise<string | null> {
    try {
      // Download extension from URL
      // In a real implementation, you'd download and extract the extension package
      console.log(`Installing extension from URL: ${url}`);
      
      // For now, return a mock implementation
      return null;
    } catch (error) {
      console.error('Failed to install extension from URL:', error);
      return null;
    }
  }

  private async validateExtensionPackage(extensionPath: string): Promise<Omnifest | null> {
    try {
      const manifestPath = join(extensionPath, 'omnifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      const omnifest = JSON.parse(manifestData);

      // Validate omnifest structure
      if (!this.validateOmnifest(omnifest)) {
        return null;
      }

      return omnifest;
    } catch (error) {
      console.error('Failed to validate extension package:', error);
      return null;
    }
  }

  private validateOmnifest(omnifest: any): boolean {
    const requiredFields = ['manifest_version', 'name', 'version', 'description', 'author', 'icons', 'category'];
    
    for (const field of requiredFields) {
      if (!omnifest[field]) {
        return false;
      }
    }

    // Validate manifest version
    if (omnifest.manifest_version !== 1) {
      return false;
    }

    // Validate icons
    const requiredIconSizes = ['16', '48', '128'];
    for (const size of requiredIconSizes) {
      if (!omnifest.icons[size]) {
        return false;
      }
    }

    return true;
  }

  private async checkExtensionPermissions(permissions: ExtensionPermission[]): Promise<{
    allowed: boolean;
    denied: string[];
  }> {
    const denied: string[] = [];
    
    for (const permission of permissions) {
      if (permission.risk === 'high') {
        denied.push(permission.name);
      }
    }

    return {
      allowed: denied.length === 0,
      denied
    };
  }

  private async initializeExtension(extension: Extension): Promise<void> {
    try {
      // Create extension instance
      const instanceId = uuidv4();
      const instance: ExtensionInstance = {
        id: instanceId,
        extensionId: extension.id,
        context: this.createExtensionContext(extension),
        installedAt: Date.now(),
        contentScripts: new Map()
      };

      this.extensionInstances.set(instanceId, instance);

      // Load background scripts if any
      if (extension.backgroundScripts && extension.backgroundScripts.length > 0) {
        await this.loadBackgroundScripts(extension, instance);
      }

      // Register content scripts
      if (extension.contentScripts.length > 0) {
        await this.registerContentScripts(extension, instance);
      }

      console.log(`Extension ${extension.omnifest.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize extension ${extension.omnifest.name}:`, error);
    }
  }

  private createExtensionContext(extension: Extension): any {
    return {
      id: extension.id,
      version: extension.omnifest.version,
      permissions: extension.permissions,
      storage: this.createExtensionStorage(extension.id),
      runtime: this.createExtensionRuntime(extension),
      tabs: this.createExtensionTabsAPI(),
      webNavigation: this.createExtensionWebNavigationAPI()
    };
  }

  private createExtensionStorage(extensionId: string): any {
    return {
      local: {
        get: async (keys: string | string[] | object) => {
          // Implement local storage
          return {};
        },
        set: async (items: object) => {
          // Implement local storage
        },
        remove: async (keys: string | string[]) => {
          // Implement local storage
        },
        clear: async () => {
          // Implement local storage
        }
      },
      sync: {
        get: async (keys: string | string[] | object) => {
          // Implement sync storage
          return {};
        },
        set: async (items: object) => {
          // Implement sync storage
        },
        remove: async (keys: string | string[]) => {
          // Implement sync storage
        },
        clear: async () => {
          // Implement sync storage
        }
      }
    };
  }

  private createExtensionRuntime(extension: Extension): any {
    return {
      id: extension.id,
      getURL: (path: string) => {
        return `omnior-extension://${extension.id}/${path}`;
      },
      getManifest: () => extension.omnifest,
      openOptionsPage: async () => {
        if (extension.optionsPage) {
          // Open options page
        }
      },
      reload: async () => {
        await this.reloadExtension(extension.id);
      }
    };
  }

  private createExtensionTabsAPI(): any {
    return {
      query: async (queryInfo: any) => {
        // Implement tabs query
        return [];
      },
      create: async (createProperties: any) => {
        // Implement tabs create
      },
      update: async (tabId: number, updateProperties: any) => {
        // Implement tabs update
      },
      remove: async (tabIds: number | number[]) => {
        // Implement tabs remove
      }
    };
  }

  private createExtensionWebNavigationAPI(): any {
    return {
      onBeforeNavigate: {
        addListener: (callback: (details: any) => void) => {
          // Implement navigation listener
        }
      },
      onCompleted: {
        addListener: (callback: (details: any) => void) => {
          // Implement navigation listener
        }
      }
    };
  }

  private async loadBackgroundScripts(extension: Extension, instance: ExtensionInstance): Promise<void> {
    // In a real implementation, you'd load and execute background scripts
    console.log(`Loading background scripts for ${extension.omnifest.name}`);
  }

  private async registerContentScripts(extension: Extension, instance: ExtensionInstance): Promise<void> {
    // In a real implementation, you'd register content scripts with the webContents
    console.log(`Registering content scripts for ${extension.omnifest.name}`);
  }

  public async enableExtension(extensionId: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    extension.enabled = true;
    await this.saveExtensions();
    await this.initializeExtension(extension);
    return true;
  }

  public async disableExtension(extensionId: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    extension.enabled = false;
    await this.saveExtensions();
    
    // Remove extension instances
    for (const [instanceId, instance] of this.extensionInstances) {
      if (instance.extensionId === extensionId) {
        this.extensionInstances.delete(instanceId);
      }
    }

    return true;
  }

  public async uninstallExtension(extensionId: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    // Disable extension first
    await this.disableExtension(extensionId);

    // Remove extension files
    try {
      await fs.rmdir(extension.path, { recursive: true });
    } catch (error) {
      console.error('Failed to remove extension files:', error);
    }

    // Remove from extensions map
    this.extensions.delete(extensionId);
    await this.saveExtensions();

    return true;
  }

  public async updateExtension(extensionId: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    // In a real implementation, you'd check for updates and install them
    console.log(`Updating extension ${extension.omnifest.name}`);
    return false;
  }

  public async getExtensionPermissions(extensionId: string): Promise<string[]> {
    const extension = this.extensions.get(extensionId);
    return extension?.permissions || [];
  }

  public async grantExtensionPermission(extensionId: string, permission: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    if (!extension.permissions.includes(permission)) {
      extension.permissions.push(permission);
      await this.saveExtensions();
    }

    return true;
  }

  public async revokeExtensionPermission(extensionId: string, permission: string): Promise<boolean> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return false;

    const index = extension.permissions.indexOf(permission);
    if (index > -1) {
      extension.permissions.splice(index, 1);
      await this.saveExtensions();
    }

    return true;
  }

  public async getFeaturedExtensions(): Promise<Extension[]> {
    // In a real implementation, this would fetch from a curated list
    return Array.from(this.extensions.values()).slice(0, 5);
  }

  public async searchExtensions(query: string): Promise<Extension[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.extensions.values()).filter(extension =>
      extension.omnifest.name.toLowerCase().includes(lowercaseQuery) ||
      extension.omnifest.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  public async getExtensionsByCategory(category: string): Promise<Extension[]> {
    return Array.from(this.extensions.values()).filter(extension =>
      extension.omnifest.category === category
    );
  }

  private async reloadExtension(extensionId: string): Promise<void> {
    await this.disableExtension(extensionId);
    await this.enableExtension(extensionId);
  }

  public getExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  public getExtension(extensionId: string): Extension | null {
    return this.extensions.get(extensionId) || null;
  }

  public getExtensionStats(): {
    totalExtensions: number;
    enabledExtensions: number;
    categories: string[];
  } {
    const extensions = Array.from(this.extensions.values());
    const categories = new Set(extensions.map(e => e.omnifest.category));

    return {
      totalExtensions: extensions.length,
      enabledExtensions: extensions.filter(e => e.enabled).length,
      categories: Array.from(categories)
    };
  }
}