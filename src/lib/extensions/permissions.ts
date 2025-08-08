import { 
  Extension, 
  ExtensionPermission,
  PermissionCheck
} from './types'
import { ExtensionError, PermissionError } from './types'

export interface PermissionRequest {
  extensionId: string
  extensionName: string
  permissions: ExtensionPermission[]
  optionalPermissions?: ExtensionPermission[]
  iconUrl?: string
  timestamp: Date
}

export interface PermissionDecision {
  extensionId: string
  permissions: ExtensionPermission[]
  granted: boolean
  timestamp: Date
}

export interface PermissionConfig {
  autoGrantSafePermissions?: boolean
  requireUserApproval?: boolean
  rememberDecisions?: boolean
  maxPermissionRequests?: number
}

export class PermissionManager {
  private config: PermissionConfig
  private permissionHistory: Map<string, PermissionCheck[]> = new Map()
  private permissionDecisions: Map<string, PermissionDecision[]> = new Map()
  private pendingRequests: Map<string, PermissionRequest> = new Map()

  constructor(config: PermissionConfig = {}) {
    this.config = {
      autoGrantSafePermissions: true,
      requireUserApproval: true,
      rememberDecisions: true,
      maxPermissionRequests: 10,
      ...config
    }

    this.loadPermissionData()
  }

  /**
   * Request permissions for an extension
   */
  async requestPermissions(
    extension: Extension, 
    permissions: ExtensionPermission[],
    isInstall: boolean = true
  ): Promise<boolean> {
    try {
      // Filter out already granted permissions
      const newPermissions = permissions.filter(permission => 
        !this.hasPermission(extension.id, permission)
      )

      if (newPermissions.length === 0) {
        return true // All permissions already granted
      }

      // Auto-grant safe permissions if enabled
      if (this.config.autoGrantSafePermissions) {
        const safePermissions = this.filterSafePermissions(newPermissions)
        const dangerousPermissions = newPermissions.filter(p => !safePermissions.includes(p))

        // Grant safe permissions automatically
        for (const permission of safePermissions) {
          await this.grantPermission(extension.id, permission)
        }

        // If only safe permissions were requested, we're done
        if (dangerousPermissions.length === 0) {
          return true
        }

        // Continue with dangerous permissions
        newPermissions.splice(0, newPermissions.length, ...dangerousPermissions)
      }

      // Check if we have a previous decision for these permissions
      if (this.config.rememberDecisions) {
        const previousDecision = this.getPreviousDecision(extension.id, newPermissions)
        if (previousDecision) {
          if (previousDecision.granted) {
            for (const permission of newPermissions) {
              await this.grantPermission(extension.id, permission)
            }
            return true
          } else {
            return false
          }
        }
      }

      // Create permission request
      const request: PermissionRequest = {
        extensionId: extension.id,
        extensionName: extension.manifest.name,
        permissions: newPermissions,
        optionalPermissions: extension.optionalPermissions,
        iconUrl: extension.manifest.icons?.['48'],
        timestamp: new Date()
      }

      // Store pending request
      this.pendingRequests.set(extension.id, request)

      // Request user approval
      const granted = await this.requestUserApproval(request)

      // Remove pending request
      this.pendingRequests.delete(extension.id)

      // Process decision
      if (granted) {
        for (const permission of newPermissions) {
          await this.grantPermission(extension.id, permission)
        }
      }

      // Store decision if remembering is enabled
      if (this.config.rememberDecisions) {
        await this.storeDecision(extension.id, newPermissions, granted)
      }

      return granted
    } catch (error) {
      console.error(`Failed to request permissions for extension ${extension.id}:`, error)
      throw error
    }
  }

  /**
   * Grant permission to extension
   */
  async grantPermission(extensionId: string, permission: ExtensionPermission): Promise<void> {
    try {
      // Check if extension exists (this would be handled by the extension manager)
      
      // Record permission grant
      const permissionCheck: PermissionCheck = {
        permission,
        granted: true,
        timestamp: new Date()
      }

      const history = this.permissionHistory.get(extensionId) || []
      history.push(permissionCheck)
      this.permissionHistory.set(extensionId, history)

      await this.savePermissionData()
      
      console.log(`Permission granted to extension ${extensionId}: ${permission}`)
    } catch (error) {
      console.error(`Failed to grant permission ${permission} to extension ${extensionId}:`, error)
      throw new PermissionError(`Failed to grant permission: ${(error as Error).message}`, extensionId)
    }
  }

  /**
   * Revoke permission from extension
   */
  async revokePermission(extensionId: string, permission: ExtensionPermission): Promise<void> {
    try {
      // Check if permission is granted
      if (!this.hasPermission(extensionId, permission)) {
        return // Permission not granted
      }

      // Record permission revocation
      const permissionCheck: PermissionCheck = {
        permission,
        granted: false,
        timestamp: new Date()
      }

      const history = this.permissionHistory.get(extensionId) || []
      history.push(permissionCheck)
      this.permissionHistory.set(extensionId, history)

      await this.savePermissionData()
      
      console.log(`Permission revoked from extension ${extensionId}: ${permission}`)
    } catch (error) {
      console.error(`Failed to revoke permission ${permission} from extension ${extensionId}:`, error)
      throw new PermissionError(`Failed to revoke permission: ${(error as Error).message}`, extensionId)
    }
  }

  /**
   * Check if extension has permission
   */
  hasPermission(extensionId: string, permission: ExtensionPermission): boolean {
    const history = this.permissionHistory.get(extensionId) || []
    const latestCheck = history
      .filter(check => check.permission === permission)
      .pop()

    return latestCheck?.granted || false
  }

  /**
   * Get all permissions for extension
   */
  getExtensionPermissions(extensionId: string): ExtensionPermission[] {
    const history = this.permissionHistory.get(extensionId) || []
    const permissions = new Set<ExtensionPermission>()

    history.forEach(check => {
      if (check.granted) {
        permissions.add(check.permission)
      } else {
        permissions.delete(check.permission)
      }
    })

    return Array.from(permissions)
  }

  /**
   * Get permission history for extension
   */
  getPermissionHistory(extensionId: string): PermissionCheck[] {
    return this.permissionHistory.get(extensionId) || []
  }

  /**
   * Get all extensions with specific permission
   */
  getExtensionsWithPermission(permission: ExtensionPermission): string[] {
    const extensions: string[] = []
    
    for (const [extensionId, history] of this.permissionHistory.entries()) {
      if (this.hasPermission(extensionId, permission)) {
        extensions.push(extensionId)
      }
    }
    
    return extensions
  }

  /**
   * Check permission before API call
   */
  checkPermission(extensionId: string, permission: ExtensionPermission): void {
    if (!this.hasPermission(extensionId, permission)) {
      throw new PermissionError(
        `Permission '${permission}' not granted to extension ${extensionId}`,
        extensionId
      )
    }
  }

  /**
   * Request user approval for permissions
   */
  private async requestUserApproval(request: PermissionRequest): Promise<boolean> {
    if (!this.config.requireUserApproval) {
      return true // Auto-approve if user approval not required
    }

    // In a real implementation, this would show a dialog to the user
    // For demo purposes, we'll simulate user approval
    console.log(`Requesting user approval for permissions:`, request.permissions)
    
    return new Promise((resolve) => {
      // Simulate user dialog
      setTimeout(() => {
        // Auto-approve for demo (in real implementation, this would be user's choice)
        const approved = this.shouldAutoApprove(request.permissions)
        resolve(approved)
      }, 1000)
    })
  }

  /**
   * Filter safe permissions that can be auto-granted
   */
  private filterSafePermissions(permissions: ExtensionPermission[]): ExtensionPermission[] {
    const safePermissions: ExtensionPermission[] = [
      'storage',
      'activeTab',
      'alarms'
    ]

    return permissions.filter(permission => safePermissions.includes(permission))
  }

  /**
   * Get previous decision for permissions
   */
  private getPreviousDecision(extensionId: string, permissions: ExtensionPermission[]): PermissionDecision | null {
    const decisions = this.permissionDecisions.get(extensionId) || []
    
    // Find a decision that covers all requested permissions
    return decisions.find(decision => 
      permissions.every(permission => decision.permissions.includes(permission))
    ) || null
  }

  /**
   * Store permission decision
   */
  private async storeDecision(extensionId: string, permissions: ExtensionPermission[], granted: boolean): Promise<void> {
    const decision: PermissionDecision = {
      extensionId,
      permissions,
      granted,
      timestamp: new Date()
    }

    const decisions = this.permissionDecisions.get(extensionId) || []
    decisions.push(decision)
    this.permissionDecisions.set(extensionId, decisions)

    await this.savePermissionData()
  }

  /**
   * Determine if permissions should be auto-approved
   */
  private shouldAutoApprove(permissions: ExtensionPermission[]): boolean {
    // Auto-approve if all permissions are safe
    const safePermissions = this.filterSafePermissions(permissions)
    return safePermissions.length === permissions.length
  }

  /**
   * Save permission data to persistent storage
   */
  private async savePermissionData(): Promise<void> {
    try {
      const data = {
        permissionHistory: Object.fromEntries(this.permissionHistory),
        permissionDecisions: Object.fromEntries(this.permissionDecisions)
      }
      
      localStorage.setItem('omnior-extension-permissions', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save permission data:', error)
      throw new ExtensionError('Failed to save permission data to storage')
    }
  }

  /**
   * Load permission data from persistent storage
   */
  private loadPermissionData(): void {
    try {
      const stored = localStorage.getItem('omnior-extension-permissions')
      if (stored) {
        const data = JSON.parse(stored)
        
        // Restore permission history
        if (data.permissionHistory) {
          for (const [extensionId, history] of Object.entries(data.permissionHistory)) {
            const convertedHistory = (history as any[]).map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }))
            this.permissionHistory.set(extensionId, convertedHistory)
          }
        }
        
        // Restore permission decisions
        if (data.permissionDecisions) {
          for (const [extensionId, decisions] of Object.entries(data.permissionDecisions)) {
            const convertedDecisions = (decisions as any[]).map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }))
            this.permissionDecisions.set(extensionId, convertedDecisions)
          }
        }
        
        console.log('Permission data loaded from storage')
      }
    } catch (error) {
      console.error('Failed to load permission data:', error)
    }
  }

  /**
   * Get pending permission requests
   */
  getPendingRequests(): PermissionRequest[] {
    return Array.from(this.pendingRequests.values())
  }

  /**
   * Clear permission history for extension
   */
  async clearPermissionHistory(extensionId: string): Promise<void> {
    this.permissionHistory.delete(extensionId)
    this.permissionDecisions.delete(extensionId)
    await this.savePermissionData()
    
    console.log(`Permission history cleared for extension: ${extensionId}`)
  }

  /**
   * Get permission statistics
   */
  getPermissionStats(): {
    totalExtensions: number
    totalPermissions: number
    mostCommonPermissions: Array<{ permission: ExtensionPermission; count: number }>
    recentGrants: number
    recentRevocations: number
  } {
    const totalExtensions = this.permissionHistory.size
    const permissionCounts = new Map<ExtensionPermission, number>()
    let recentGrants = 0
    let recentRevocations = 0
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Count permissions and recent activity
    for (const history of this.permissionHistory.values()) {
      history.forEach(check => {
        permissionCounts.set(
          check.permission,
          (permissionCounts.get(check.permission) || 0) + 1
        )

        if (check.timestamp > oneWeekAgo) {
          if (check.granted) {
            recentGrants++
          } else {
            recentRevocations++
          }
        }
      })
    }

    // Get most common permissions
    const sortedPermissions = Array.from(permissionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([permission, count]) => ({ permission, count }))

    return {
      totalExtensions,
      totalPermissions: permissionCounts.size,
      mostCommonPermissions: sortedPermissions,
      recentGrants,
      recentRevocations
    }
  }

  /**
   * Destroy permission manager
   */
  destroy(): void {
    this.permissionHistory.clear()
    this.permissionDecisions.clear()
    this.pendingRequests.clear()
    console.log('Permission manager destroyed')
  }
}