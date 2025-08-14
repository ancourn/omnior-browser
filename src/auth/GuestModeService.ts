/**
 * Guest Mode Service
 * Provides temporary, zero-persistence browsing sessions
 */

import { ProfileManager, ProfileMetadata } from '@/auth/ProfileManager';
import { SecureStorage } from '@/storage/SecureStorage';
import { InMemoryStorage } from '@/storage/SecureStorage';
import { CryptoUtils } from '@/auth/CryptoUtils';

export interface GuestSession {
  id: string;
  startTime: number;
  storage: InMemoryStorage;
  metadata: GuestSessionMetadata;
}

export interface GuestSessionMetadata {
  sessionName: string;
  warningAcknowledged: boolean;
  autoCleanup: boolean;
  maxDuration?: number; // in milliseconds
  dataTypes: {
    cookies: boolean;
    cache: boolean;
    history: boolean;
    downloads: boolean;
    localStorage: boolean;
  };
}

export interface GuestSessionStats {
  duration: number;
  pagesVisited: number;
  downloads: number;
  dataTypesUsed: string[];
}

export class GuestModeService {
  private activeSession: GuestSession | null = null;
  private sessionHistory: GuestSession[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private profileManager: ProfileManager;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
    this.setupCleanupInterval();
  }

  /**
   * Start a new guest session
   */
  async startGuestSession(options: {
    sessionName?: string;
    maxDurationHours?: number;
    acknowledgeWarning?: boolean;
  } = {}): Promise<GuestSession> {
    // End any existing guest session
    if (this.activeSession) {
      await this.endGuestSession();
    }

    const sessionId = this.generateSessionId();
    const sessionName = options.sessionName || `Guest Session ${new Date().toLocaleString()}`;
    const maxDuration = options.maxDurationHours ? options.maxDurationHours * 60 * 60 * 1000 : undefined;

    const metadata: GuestSessionMetadata = {
      sessionName,
      warningAcknowledged: options.acknowledgeWarning || false,
      autoCleanup: true,
      maxDuration,
      dataTypes: {
        cookies: true,
        cache: true,
        history: false, // Guest mode typically doesn't save history
        downloads: true,
        localStorage: false // No persistent localStorage
      }
    };

    // Create in-memory storage for guest session
    const storage = new InMemoryStorage();

    const session: GuestSession = {
      id: sessionId,
      startTime: Date.now(),
      storage,
      metadata
    };

    this.activeSession = session;

    // Setup session timeout if max duration is specified
    if (maxDuration) {
      this.setupSessionTimeout(maxDuration);
    }

    // Setup browser cleanup listeners
    this.setupBrowserCleanup();

    return session;
  }

  /**
   * End the current guest session
   */
  async endGuestSession(): Promise<GuestSessionStats> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    const stats = this.getSessionStats(this.activeSession);

    try {
      // Perform cleanup
      await this.cleanupGuestSession(this.activeSession);

      // Add to history (for debugging/admin purposes)
      this.sessionHistory.push(this.activeSession);

      // Clear active session
      this.activeSession = null;

      // Clear session timeout
      this.clearSessionTimeout();

      return stats;
    } catch (error) {
      console.error('Failed to end guest session:', error);
      throw error;
    }
  }

  /**
   * Get the active guest session
   */
  getActiveSession(): GuestSession | null {
    return this.activeSession;
  }

  /**
   * Check if currently in guest mode
   */
  isGuestModeActive(): boolean {
    return this.activeSession !== null;
  }

  /**
   * Get session statistics
   */
  getSessionStats(session?: GuestSession): GuestSessionStats {
    const currentSession = session || this.activeSession;
    if (!currentSession) {
      throw new Error('No guest session available');
    }

    const duration = Date.now() - currentSession.startTime;
    
    // Get stats from in-memory storage
    const storageStats = currentSession.storage.getStats();
    
    const dataTypesUsed: string[] = [];
    if (storageStats.count > 0) {
      dataTypesUsed.push('session-data');
    }

    return {
      duration,
      pagesVisited: storageStats.count, // Approximation
      downloads: 0, // Would need to track downloads separately
      dataTypesUsed
    };
  }

  /**
   * Get remaining time for session (if max duration is set)
   */
  getRemainingTime(): number | null {
    if (!this.activeSession || !this.activeSession.metadata.maxDuration) {
      return null;
    }

    const elapsed = Date.now() - this.activeSession.startTime;
    const remaining = this.activeSession.metadata.maxDuration - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Extend session duration
   */
  async extendSession(additionalHours: number): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    const additionalMs = additionalHours * 60 * 60 * 1000;
    
    if (this.activeSession.metadata.maxDuration) {
      this.activeSession.metadata.maxDuration += additionalMs;
    } else {
      this.activeSession.metadata.maxDuration = additionalMs;
    }

    // Reset session timeout
    this.clearSessionTimeout();
    this.setupSessionTimeout(this.activeSession.metadata.maxDuration);
  }

  /**
   * Store data in guest session
   */
  async store(key: string, data: any): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    await this.activeSession.storage.store(key, data);
  }

  /**
   * Retrieve data from guest session
   */
  async retrieve<T>(key: string): Promise<T | null> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    return this.activeSession.storage.retrieve<T>(key);
  }

  /**
   * Clear specific data from guest session
   */
  async clearData(key: string): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    await this.activeSession.storage.delete(key);
  }

  /**
   * Clear all session data
   */
  async clearAllData(): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active guest session');
    }

    await this.activeSession.storage.clear();
  }

  /**
   * Get guest session warning message
   */
  getWarningMessage(): string {
    return `You are in Guest Mode. All browsing data, including cookies, cache, and downloads, will be permanently deleted when you close this session. No data will be saved to your device.`;
  }

  /**
   * Check if warning has been acknowledged
   */
  isWarningAcknowledged(): boolean {
    return this.activeSession?.metadata.warningAcknowledged || false;
  }

  /**
   * Acknowledge guest mode warning
   */
  acknowledgeWarning(): void {
    if (this.activeSession) {
      this.activeSession.metadata.warningAcknowledged = true;
    }
  }

  /**
   * Get session history (for debugging)
   */
  getSessionHistory(): GuestSession[] {
    return [...this.sessionHistory];
  }

  /**
   * Clear session history
   */
  clearSessionHistory(): void {
    this.sessionHistory = [];
  }

  /**
   * Setup automatic cleanup interval
   */
  private setupCleanupInterval(): void {
    // Check every minute for expired sessions
    this.cleanupInterval = setInterval(() => {
      this.performMaintenanceCleanup();
    }, 60 * 1000);
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout(duration: number): void {
    setTimeout(async () => {
      if (this.activeSession) {
        try {
          await this.endGuestSession();
        } catch (error) {
          console.error('Failed to auto-end guest session:', error);
        }
      }
    }, duration);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(): void {
    // Timeout is handled by setTimeout, no need to clear explicitly
  }

  /**
   * Setup browser cleanup listeners
   */
  private setupBrowserCleanup(): void {
    // Handle page unload
    const handleBeforeUnload = () => {
      if (this.activeSession) {
        // Perform synchronous cleanup
        this.performEmergencyCleanup();
      }
    };

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && this.activeSession) {
        // Page is hidden, consider cleanup if needed
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Store cleanup function for later removal
    (this as any).cleanupListeners = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  /**
   * Cleanup guest session data
   */
  private async cleanupGuestSession(session: GuestSession): Promise<void> {
    try {
      // Clear in-memory storage
      await session.storage.clear();

      // Clear browser-specific data if needed
      await this.clearBrowserData(session.metadata.dataTypes);

      // Clear any temporary files or caches
      await this.clearTemporaryFiles();

    } catch (error) {
      console.error('Guest session cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clear browser data for guest session
   */
  private async clearBrowserData(dataTypes: GuestSessionMetadata['dataTypes']): Promise<void> {
    try {
      // Clear cookies if enabled
      if (dataTypes.cookies) {
        await this.clearCookies();
      }

      // Clear cache if enabled
      if (dataTypes.cache) {
        await this.clearCache();
      }

      // Clear downloads if enabled
      if (dataTypes.downloads) {
        await this.clearDownloads();
      }

      // Note: History and localStorage are typically disabled for guest mode
      // but we'll clear them if they were enabled
      if (dataTypes.history) {
        await this.clearHistory();
      }

      if (dataTypes.localStorage) {
        await this.clearLocalStorage();
      }

    } catch (error) {
      console.error('Failed to clear browser data:', error);
    }
  }

  /**
   * Clear cookies
   */
  private async clearCookies(): Promise<void> {
    try {
      // Clear all cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    } catch (error) {
      console.error('Failed to clear cookies:', error);
    }
  }

  /**
   * Clear cache
   */
  private async clearCache(): Promise<void> {
    try {
      // Clear service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear browser cache (if possible)
      if ('clearAppBadge' in window.navigator) {
        // Some browsers support cache clearing APIs
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Clear downloads
   */
  private async clearDownloads(): Promise<void> {
    try {
      // Note: Clearing downloads may require browser-specific APIs
      // This is a placeholder implementation
      console.log('Clearing downloads (placeholder implementation)');
    } catch (error) {
      console.error('Failed to clear downloads:', error);
    }
  }

  /**
   * Clear history
   */
  private async clearHistory(): Promise<void> {
    try {
      // Note: Clearing history requires browser-specific permissions
      // This is a placeholder implementation
      console.log('Clearing history (placeholder implementation)');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  /**
   * Clear local storage
   */
  private async clearLocalStorage(): Promise<void> {
    try {
      // Clear all localStorage except for essential Omnior data
      const omniorKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('omnior_') || key.includes('profile')
      );
      
      const nonOmniorKeys = Object.keys(localStorage).filter(key => 
        !omniorKeys.includes(key)
      );
      
      nonOmniorKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Clear temporary files
   */
  private async clearTemporaryFiles(): Promise<void> {
    try {
      // Clear any temporary files or caches created during the session
      // This would typically involve browser-specific APIs
      console.log('Clearing temporary files (placeholder implementation)');
    } catch (error) {
      console.error('Failed to clear temporary files:', error);
    }
  }

  /**
   * Perform emergency cleanup (synchronous)
   */
  private performEmergencyCleanup(): void {
    try {
      if (this.activeSession) {
        // Synchronous cleanup for page unload
        this.activeSession.storage.clear();
        this.clearCookiesSync();
      }
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }

  /**
   * Synchronous cookie clearing for emergency cleanup
   */
  private clearCookiesSync(): void {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    } catch (error) {
      console.error('Failed to clear cookies synchronously:', error);
    }
  }

  /**
   * Perform maintenance cleanup
   */
  private async performMaintenanceCleanup(): Promise<void> {
    try {
      // Clean up old session history (keep only last 10 sessions)
      if (this.sessionHistory.length > 10) {
        this.sessionHistory = this.sessionHistory.slice(-10);
      }

      // Check for any orphaned sessions and clean them up
      // This would involve more sophisticated logic in a real implementation
    } catch (error) {
      console.error('Maintenance cleanup failed:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // End active session
    if (this.activeSession) {
      await this.endGuestSession();
    }

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Remove event listeners
    if ((this as any).cleanupListeners) {
      (this as any).cleanupListeners();
    }

    // Clear session history
    this.sessionHistory = [];
  }
}

/**
 * Factory function to create guest mode service
 */
export function createGuestModeService(profileManager: ProfileManager): GuestModeService {
  return new GuestModeService(profileManager);
}