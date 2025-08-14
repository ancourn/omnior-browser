import { LoginManager } from '@/auth/LoginManager';
import { UserProfile } from './auth-service';

export interface GuestSession {
  id: string;
  startTime: string;
  temporaryProfile: UserProfile;
}

/**
 * Guest Mode Service for Omnior Browser
 * Provides ephemeral browsing experience with auto-wipe functionality
 */
export class GuestModeService {
  private static instance: GuestModeService;
  private loginManager: LoginManager;
  private currentGuestSession: GuestSession | null = null;
  private onSessionEnd?: () => void;

  private constructor() {
    this.loginManager = LoginManager.getInstance();
    // Listen for browser close events
    this.setupCleanupListeners();
  }

  static getInstance(): GuestModeService {
    if (!GuestModeService.instance) {
      GuestModeService.instance = new GuestModeService();
    }
    return GuestModeService.instance;
  }

  /**
   * Start a new guest session
   */
  async startGuestSession(): Promise<GuestSession> {
    // End any existing guest session
    await this.endGuestSession();

    // Use LoginManager to start guest mode
    await this.loginManager.startGuestMode();

    // Create guest session record
    const session: GuestSession = {
      id: 'guest_' + Date.now(),
      startTime: new Date().toISOString(),
      temporaryProfile: {
        id: 'guest_' + Date.now(),
        email: 'guest@omnior.local',
        name: 'Guest User',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        settings: {
          theme: 'light',
          privacy: {
            blockTrackers: true,
            clearCookies: true,
            disableHistory: true
          }
        },
        isGuest: true
      }
    };

    this.currentGuestSession = session;
    return session;
  }

  /**
   * End current guest session and wipe all data
   */
  async endGuestSession(): Promise<void> {
    if (!this.currentGuestSession) {
      return;
    }

    try {
      // Use LoginManager to logout (which handles guest session cleanup)
      await this.loginManager.logout();

      // Clear browser data
      await this.wipeBrowserData();

      // Clear session
      this.currentGuestSession = null;

      // Notify callback
      if (this.onSessionEnd) {
        this.onSessionEnd();
      }
    } catch (error) {
      console.error('Error ending guest session:', error);
    }
  }

  /**
   * Get current guest session
   */
  getCurrentGuestSession(): GuestSession | null {
    return this.currentGuestSession;
  }

  /**
   * Check if currently in guest mode
   */
  isGuestMode(): boolean {
    return this.loginManager.isGuest();
  }

  /**
   * Get guest session statistics
   */
  getSessionStats(): {
    isActive: boolean;
    duration: number;
    profile: UserProfile | null;
  } {
    if (!this.currentGuestSession) {
      return {
        isActive: false,
        duration: 0,
        profile: null
      };
    }

    const startTime = new Date(this.currentGuestSession.startTime).getTime();
    const duration = Date.now() - startTime;

    return {
      isActive: true,
      duration,
      profile: this.currentGuestSession.temporaryProfile
    };
  }

  /**
   * Set session end callback
   */
  onSessionEnded(callback: () => void): void {
    this.onSessionEnd = callback;
  }

  /**
   * Private helper methods
   */
  private async wipeBrowserData(): Promise<void> {
    try {
      // Clear localStorage (except omnior user data)
      const keysToPreserve: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('omnior_user_')) {
          keysToPreserve.push(key);
        }
      }

      // Clear all localStorage
      localStorage.clear();

      // Restore preserved keys
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear cache (if available)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear service workers (if available)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }

      console.log('Browser data wiped for guest session');
    } catch (error) {
      console.error('Error wiping browser data:', error);
    }
  }

  private setupCleanupListeners(): void {
    // Handle page unload
    const handleBeforeUnload = () => {
      if (this.currentGuestSession && typeof localStorage !== 'undefined') {
        // Clear localStorage (except user data)
        const keysToPreserve: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('omnior_user_')) {
            keysToPreserve.push(key);
          }
        }

        keysToPreserve.forEach(key => {
          const value = localStorage.getItem(key);
          localStorage.removeItem(key);
          if (value) {
            localStorage.setItem(key, value);
          }
        });

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
      }
    };

    // Handle page visibility change (user switching tabs/closing)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && this.currentGuestSession) {
        // Setup a timer to auto-wipe if user doesn't return within timeout
        setTimeout(async () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && this.currentGuestSession) {
            await this.endGuestSession();
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    };

    // Add event listeners (only on client side)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Store cleanup function for potential removal
      (this as any).cleanupListeners = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }
}

// Export singleton instance
export const guestModeService = GuestModeService.getInstance();