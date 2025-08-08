import { 
  Extension, 
  ExtensionManifest, 
  ExtensionPermission,
  UpdateInfo,
  UpdateResult
} from './types'
import { ExtensionError } from './types'

export interface UpdateConfig {
  checkInterval?: number
  autoUpdate?: boolean
  timeout?: number
  retryAttempts?: number
  userAgent?: string
}

export interface UpdateCheckResult {
  extensionId: string
  hasUpdate: boolean
  updateInfo?: UpdateInfo
  error?: string
}

export class ExtensionUpdater {
  private config: UpdateConfig
  private updateCheckInterval?: NodeJS.Timeout
  private updateQueue: Map<string, UpdateInfo> = new Map()

  constructor(config: UpdateConfig = {}) {
    this.config = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      autoUpdate: true,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      userAgent: 'Omnior-Extension-Updater/1.0',
      ...config
    }

    this.startPeriodicChecks()
  }

  /**
   * Check for updates for a specific extension
   */
  async checkForUpdate(extension: Extension): Promise<UpdateCheckResult> {
    try {
      if (!extension.manifest.update_url) {
        return {
          extensionId: extension.id,
          hasUpdate: false,
          error: 'No update URL specified in manifest'
        }
      }

      console.log(`Checking for updates for extension: ${extension.manifest.name}`)

      // Fetch update manifest
      const updateManifest = await this.fetchUpdateManifest(extension.manifest.update_url)
      
      // Compare versions
      const hasUpdate = this.compareVersions(extension.version, updateManifest.version) > 0
      
      if (hasUpdate) {
        const updateInfo: UpdateInfo = {
          extensionId: extension.id,
          currentVersion: extension.version,
          availableVersion: updateManifest.version,
          updateUrl: extension.manifest.update_url,
          downloadUrl: updateManifest.download_url || extension.manifest.update_url,
          checksum: updateManifest.checksum || '',
          size: updateManifest.size || 0,
          releaseNotes: updateManifest.release_notes
        }

        console.log(`Update available for ${extension.manifest.name}: ${extension.version} -> ${updateManifest.version}`)
        
        // Auto-update if enabled
        if (this.config.autoUpdate) {
          this.updateQueue.set(extension.id, updateInfo)
          await this.applyUpdate(extension, updateInfo)
        }

        return {
          extensionId: extension.id,
          hasUpdate: true,
          updateInfo
        }
      }

      return {
        extensionId: extension.id,
        hasUpdate: false
      }
    } catch (error) {
      console.error(`Failed to check update for extension ${extension.id}:`, error)
      return {
        extensionId: extension.id,
        hasUpdate: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Check for updates for multiple extensions
   */
  async checkForUpdates(extensions: Extension[]): Promise<UpdateCheckResult[]> {
    const results: UpdateCheckResult[] = []
    
    // Check updates in parallel with concurrency limit
    const concurrencyLimit = 5
    const chunks = this.chunkArray(extensions, concurrencyLimit)
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(extension => this.checkForUpdate(extension))
      )
      
      chunkResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Update check failed:', result.reason)
        }
      })
    }

    return results
  }

  /**
   * Apply an update to an extension
   */
  async applyUpdate(extension: Extension, updateInfo: UpdateInfo): Promise<UpdateResult> {
    try {
      console.log(`Applying update for extension: ${extension.manifest.name}`)

      // Download update package
      const updatePackage = await this.downloadUpdate(updateInfo)
      
      // Validate update package
      await this.validateUpdate(updatePackage, updateInfo)
      
      // Backup current extension
      const backup = await this.backupExtension(extension)
      
      try {
        // Install new version
        await this.installUpdate(extension, updatePackage)
        
        console.log(`Update successful for ${extension.manifest.name}: ${updateInfo.currentVersion} -> ${updateInfo.availableVersion}`)
        
        return {
          extensionId: extension.id,
          success: true,
          newVersion: updateInfo.availableVersion
        }
      } catch (installError) {
        console.error(`Installation failed for ${extension.manifest.name}, rolling back...`, installError)
        
        // Rollback to backup
        await this.rollbackExtension(extension, backup)
        
        return {
          extensionId: extension.id,
          success: false,
          error: `Installation failed: ${(installError as Error).message}`,
          rollbackRequired: true
        }
      }
    } catch (error) {
      console.error(`Update failed for extension ${extension.id}:`, error)
      return {
        extensionId: extension.id,
        success: false,
        error: (error as Error).message
      }
    }
  }

  /**
   * Fetch update manifest from URL
   */
  private async fetchUpdateManifest(updateUrl: string): Promise<any> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(updateUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent!,
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ExtensionError(`Failed to fetch update manifest: ${response.status} ${response.statusText}`)
      }

      const manifest = await response.json()
      
      // Validate manifest structure
      if (!manifest.version) {
        throw new ExtensionError('Invalid update manifest: missing version')
      }

      return manifest
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Download update package
   */
  private async downloadUpdate(updateInfo: UpdateInfo): Promise<ArrayBuffer> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(updateInfo.downloadUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent!
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new ExtensionError(`Failed to download update: ${response.status} ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      
      // Verify size if specified
      if (updateInfo.size > 0 && arrayBuffer.byteLength !== updateInfo.size) {
        throw new ExtensionError(`Size mismatch: expected ${updateInfo.size}, got ${arrayBuffer.byteLength}`)
      }

      return arrayBuffer
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Validate update package
   */
  private async validateUpdate(packageData: ArrayBuffer, updateInfo: UpdateInfo): Promise<void> {
    // Verify checksum if provided
    if (updateInfo.checksum) {
      const calculatedChecksum = await this.calculateChecksum(packageData)
      if (calculatedChecksum !== updateInfo.checksum) {
        throw new ExtensionError(`Checksum mismatch: expected ${updateInfo.checksum}, got ${calculatedChecksum}`)
      }
    }

    // Extract and validate manifest
    try {
      // In a real implementation, this would extract the ZIP file and read manifest.json
      // For demo purposes, we'll skip the actual extraction
      console.log('Update package validated successfully')
    } catch (error) {
      throw new ExtensionError(`Invalid update package: ${(error as Error).message}`)
    }
  }

  /**
   * Backup current extension
   */
  private async backupExtension(extension: Extension): Promise<any> {
    // In a real implementation, this would create a backup of the extension files
    console.log(`Creating backup for extension: ${extension.manifest.name}`)
    
    return {
      id: extension.id,
      manifest: extension.manifest,
      path: extension.path,
      timestamp: Date.now()
    }
  }

  /**
   * Install update
   */
  private async installUpdate(extension: Extension, packageData: ArrayBuffer): Promise<void> {
    // In a real implementation, this would:
    // 1. Extract the ZIP file
    // 2. Validate the new manifest
    // 3. Replace the old files
    // 4. Update extension metadata
    
    console.log(`Installing update for extension: ${extension.manifest.name}`)
    
    // Simulate installation delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Rollback extension to backup
   */
  private async rollbackExtension(extension: Extension, backup: any): Promise<void> {
    // In a real implementation, this would restore the extension from backup
    console.log(`Rolling back extension: ${extension.manifest.name}`)
    
    // Simulate rollback delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Calculate checksum of data
   */
  private async calculateChecksum(data: ArrayBuffer): Promise<string> {
    // Simple checksum calculation (in real implementation, use proper hashing like SHA-256)
    const buffer = new Uint8Array(data)
    let hash = 0
    
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i]
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16)
  }

  /**
   * Compare version strings
   * Returns: 1 if version1 > version2, 0 if equal, -1 if version1 < version2
   */
  private compareVersions(version1: string, version2: string): number {
    const normalizeVersion = (v: string): number[] => {
      return v.split('.').map(part => {
        const num = parseInt(part, 10)
        return isNaN(num) ? 0 : num
      })
    }

    const v1Parts = normalizeVersion(version1)
    const v2Parts = normalizeVersion(version2)

    const maxLength = Math.max(v1Parts.length, v2Parts.length)
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part > v2Part) return 1
      if (v1Part < v2Part) return -1
    }
    
    return 0
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Start periodic update checks
   */
  private startPeriodicChecks(): void {
    if (this.config.checkInterval && this.config.checkInterval > 0) {
      this.updateCheckInterval = setInterval(async () => {
        console.log('Performing periodic extension update check...')
        // This would be called with actual extensions from the manager
      }, this.config.checkInterval)
    }
  }

  /**
   * Stop periodic update checks
   */
  private stopPeriodicChecks(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = undefined
    }
  }

  /**
   * Get pending updates
   */
  getPendingUpdates(): UpdateInfo[] {
    return Array.from(this.updateQueue.values())
  }

  /**
   * Clear pending update
   */
  clearPendingUpdate(extensionId: string): void {
    this.updateQueue.delete(extensionId)
  }

  /**
   * Force update check for all extensions
   */
  async forceUpdateCheck(extensions: Extension[]): Promise<UpdateCheckResult[]> {
    console.log('Forcing update check for all extensions...')
    return await this.checkForUpdates(extensions)
  }

  /**
   * Destroy updater
   */
  destroy(): void {
    this.stopPeriodicChecks()
    this.updateQueue.clear()
    console.log('Extension updater destroyed')
  }
}