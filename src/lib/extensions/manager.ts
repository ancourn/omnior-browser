import { Extension, ExtensionManifest, ExtensionPermission } from './types'
import { ExtensionError } from './types'

export interface ExtensionManagerConfig {
  maxExtensions?: number
  allowedOrigins?: string[]
  autoUpdate?: boolean
  updateInterval?: number
}

export interface InstallOptions {
  force?: boolean
  skipPermissions?: boolean
  skipValidation?: boolean
}

export class ExtensionManager {
  private extensions: Map<string, Extension> = new Map()
  private config: ExtensionManagerConfig
  private updateIntervalId?: NodeJS.Timeout

  constructor(config: ExtensionManagerConfig = {}) {
    this.config = {
      maxExtensions: 100,
      allowedOrigins: ['https://extensions.omnior.com'],
      autoUpdate: true,
      updateInterval: 24 * 60 * 60 * 1000, // 24 hours
      ...config
    }

    this.loadExtensions()
    this.startAutoUpdate()
  }

  /**
   * Install extension from manifest
   */
  async installExtension(
    manifest: ExtensionManifest, 
    extensionPath: string, 
    options: InstallOptions = {}
  ): Promise<Extension> {
    try {
      // Validate manifest
      if (!options.skipValidation) {
        this.validateManifest(manifest)
      }

      // Check if extension already exists
      const existingExtension = this.extensions.get(manifest.name)
      if (existingExtension && !options.force) {
        throw new ExtensionError(`Extension '${manifest.name}' is already installed`)
      }

      // Check permissions if not skipped
      if (!options.skipPermissions) {
        await this.requestPermissions(manifest.permissions || [])
      }

      // Create extension object
      const extension: Extension = {
        id: this.generateExtensionId(manifest),
        manifest,
        path: extensionPath,
        enabled: true,
        installedAt: new Date(),
        lastUpdated: new Date(),
        permissions: manifest.permissions || [],
        optionalPermissions: manifest.optional_permissions || [],
        settings: {},
        version: manifest.version
      }

      // Check extension limit
      if (this.extensions.size >= this.config.maxExtensions!) {
        throw new ExtensionError(`Maximum number of extensions (${this.config.maxExtensions}) reached`)
      }

      // Store extension
      this.extensions.set(extension.id, extension)
      
      // Save to persistent storage
      await this.saveExtensions()

      console.log(`Extension installed: ${manifest.name} (${extension.id})`)
      return extension
    } catch (error) {
      console.error('Failed to install extension:', error)
      throw error
    }
  }

  /**
   * Install extension from URL
   */
  async installFromUrl(url: string, options: InstallOptions = {}): Promise<Extension> {
    try {
      // Fetch manifest
      const response = await fetch(url)
      if (!response.ok) {
        throw new ExtensionError(`Failed to fetch extension from ${url}`)
      }

      const manifest: ExtensionManifest = await response.json()
      
      // Extract extension path from URL
      const extensionPath = new URL(url).pathname
      
      return await this.installExtension(manifest, extensionPath, options)
    } catch (error) {
      console.error(`Failed to install extension from URL ${url}:`, error)
      throw error
    }
  }

  /**
   * Uninstall extension
   */
  async uninstallExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    try {
      // Disable extension first
      await this.disableExtension(extensionId)

      // Remove from storage
      this.extensions.delete(extensionId)
      await this.saveExtensions()

      console.log(`Extension uninstalled: ${extension.name} (${extensionId})`)
    } catch (error) {
      console.error(`Failed to uninstall extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Enable extension
   */
  async enableExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    if (extension.enabled) {
      return // Already enabled
    }

    try {
      extension.enabled = true
      extension.lastUpdated = new Date()
      await this.saveExtensions()

      console.log(`Extension enabled: ${extension.name} (${extensionId})`)
    } catch (error) {
      console.error(`Failed to enable extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Disable extension
   */
  async disableExtension(extensionId: string): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    if (!extension.enabled) {
      return // Already disabled
    }

    try {
      extension.enabled = false
      extension.lastUpdated = new Date()
      await this.saveExtensions()

      console.log(`Extension disabled: ${extension.name} (${extensionId})`)
    } catch (error) {
      console.error(`Failed to disable extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): Extension | undefined {
    return this.extensions.get(extensionId)
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): Extension[] {
    return Array.from(this.extensions.values())
  }

  /**
   * Get enabled extensions
   */
  getEnabledExtensions(): Extension[] {
    return this.getAllExtensions().filter(ext => ext.enabled)
  }

  /**
   * Get disabled extensions
   */
  getDisabledExtensions(): Extension[] {
    return this.getAllExtensions().filter(ext => !ext.enabled)
  }

  /**
   * Update extension settings
   */
  async updateExtensionSettings(
    extensionId: string, 
    settings: Record<string, any>
  ): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    try {
      extension.settings = { ...extension.settings, ...settings }
      extension.lastUpdated = new Date()
      await this.saveExtensions()

      console.log(`Extension settings updated: ${extension.name} (${extensionId})`)
    } catch (error) {
      console.error(`Failed to update extension settings ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Get extension settings
   */
  getExtensionSettings(extensionId: string): Record<string, any> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }
    return extension.settings
  }

  /**
   * Check if extension has permission
   */
  hasPermission(extensionId: string, permission: ExtensionPermission): boolean {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      return false
    }
    return extension.permissions.includes(permission)
  }

  /**
   * Grant permission to extension
   */
  async grantPermission(extensionId: string, permission: ExtensionPermission): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    if (extension.permissions.includes(permission)) {
      return // Already granted
    }

    try {
      extension.permissions.push(permission)
      extension.lastUpdated = new Date()
      await this.saveExtensions()

      console.log(`Permission granted to ${extension.name}: ${permission}`)
    } catch (error) {
      console.error(`Failed to grant permission ${permission} to extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Revoke permission from extension
   */
  async revokePermission(extensionId: string, permission: ExtensionPermission): Promise<void> {
    const extension = this.extensions.get(extensionId)
    if (!extension) {
      throw new ExtensionError(`Extension not found: ${extensionId}`)
    }

    const permissionIndex = extension.permissions.indexOf(permission)
    if (permissionIndex === -1) {
      return // Permission not granted
    }

    try {
      extension.permissions.splice(permissionIndex, 1)
      extension.lastUpdated = new Date()
      await this.saveExtensions()

      console.log(`Permission revoked from ${extension.name}: ${permission}`)
    } catch (error) {
      console.error(`Failed to revoke permission ${permission} from extension ${extensionId}:`, error)
      throw error
    }
  }

  /**
   * Validate extension manifest
   */
  private validateManifest(manifest: ExtensionManifest): void {
    // Check required fields
    if (!manifest.manifest_version) {
      throw new ExtensionError('Manifest version is required')
    }

    if (!manifest.name) {
      throw new ExtensionError('Extension name is required')
    }

    if (!manifest.version) {
      throw new ExtensionError('Extension version is required')
    }

    // Validate manifest version
    if (manifest.manifest_version !== 2 && manifest.manifest_version !== 3) {
      throw new ExtensionError('Unsupported manifest version')
    }

    // Validate version format
    if (!/^\d+(\.\d+)*$/.test(manifest.version)) {
      throw new ExtensionError('Invalid version format')
    }

    // Validate permissions
    if (manifest.permissions) {
      this.validatePermissions(manifest.permissions)
    }

    // Validate content scripts
    if (manifest.content_scripts) {
      manifest.content_scripts.forEach(script => {
        if (!script.matches || script.matches.length === 0) {
          throw new ExtensionError('Content script matches are required')
        }
      })
    }
  }

  /**
   * Validate permissions
   */
  private validatePermissions(permissions: ExtensionPermission[]): void {
    const validPermissions: ExtensionPermission[] = [
      'activeTab', 'alarms', 'bookmarks', 'browsingData', 'clipboardRead', 'clipboardWrite',
      'contentSettings', 'contextMenus', 'cookies', 'debugger', 'downloads', 'history',
      'identity', 'management', 'notifications', 'pageCapture', 'privacy', 'proxy',
      'scripting', 'search', 'sessions', 'storage', 'tabs', 'topSites', 'webNavigation',
      'webRequest', 'webRequestBlocking', '<all_urls>'
    ]

    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        throw new ExtensionError(`Invalid permission: ${permission}`)
      }
    }
  }

  /**
   * Request permissions from user
   */
  private async requestPermissions(permissions: ExtensionPermission[]): Promise<void> {
    if (permissions.length === 0) {
      return
    }

    // In a real implementation, this would show a permission dialog
    // For now, we'll auto-grant permissions for demo purposes
    console.log('Requesting permissions:', permissions)
    
    return new Promise((resolve) => {
      setTimeout(resolve, 1000) // Simulate user approval
    })
  }

  /**
   * Generate unique extension ID
   */
  private generateExtensionId(manifest: ExtensionManifest): string {
    // Generate ID based on extension name and version
    const base = `${manifest.name}@${manifest.version}`
    const hash = Array.from(base)
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(16)
    
    return `omnior-extension-${hash}`
  }

  /**
   * Save extensions to persistent storage
   */
  private async saveExtensions(): Promise<void> {
    try {
      const extensionsData = Array.from(this.extensions.values())
      localStorage.setItem('omnior-extensions', JSON.stringify(extensionsData))
    } catch (error) {
      console.error('Failed to save extensions:', error)
      throw new ExtensionError('Failed to save extensions to storage')
    }
  }

  /**
   * Load extensions from persistent storage
   */
  private loadExtensions(): void {
    try {
      const stored = localStorage.getItem('omnior-extensions')
      if (stored) {
        const extensionsData = JSON.parse(stored)
        extensionsData.forEach((extData: any) => {
          const extension: Extension = {
            ...extData,
            installedAt: new Date(extData.installedAt),
            lastUpdated: new Date(extData.lastUpdated)
          }
          this.extensions.set(extension.id, extension)
        })
        console.log(`Loaded ${extensionsData.length} extensions from storage`)
      }
    } catch (error) {
      console.error('Failed to load extensions:', error)
    }
  }

  /**
   * Start automatic updates
   */
  private startAutoUpdate(): void {
    if (this.config.autoUpdate) {
      this.updateIntervalId = setInterval(() => {
        this.checkForUpdates()
      }, this.config.updateInterval)
    }
  }

  /**
   * Stop automatic updates
   */
  private stopAutoUpdate(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId)
      this.updateIntervalId = undefined
    }
  }

  /**
   * Check for updates for all extensions
   */
  private async checkForUpdates(): Promise<void> {
    console.log('Checking for extension updates...')
    
    for (const extension of this.extensions.values()) {
      if (extension.enabled && extension.manifest.update_url) {
        try {
          await this.checkExtensionUpdate(extension)
        } catch (error) {
          console.error(`Failed to check update for extension ${extension.id}:`, error)
        }
      }
    }
  }

  /**
   * Check for update for specific extension
   */
  private async checkExtensionUpdate(extension: Extension): Promise<void> {
    // This would be implemented in the update mechanism
    console.log(`Checking update for extension: ${extension.name}`)
  }

  /**
   * Destroy extension manager
   */
  destroy(): void {
    this.stopAutoUpdate()
    this.extensions.clear()
    console.log('Extension manager destroyed')
  }
}