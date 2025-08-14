import { LoginManager } from '@/auth/LoginManager';
import { authService } from './auth-service';
import { guestModeService } from './guest-mode';

export interface SessionConfig {
  idleTimeout: number; // in minutes
  lockOnTimeout: boolean;
  requireReauthForSensitiveActions: boolean;
  notifyBeforeTimeout: number; // in minutes
}

export interface SessionState {
  isActive: boolean;
  isLocked: boolean;
  isGuest: boolean;
  userId: string | null;
  startTime: string;
  lastActivity: string;
  timeRemaining: number; // in seconds
  warnings: SessionWarning[];
}

export interface SessionWarning {
  type: 'timeout' | 'reauth' | 'security';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface SensitiveAction {
  type: 'settings_change' | 'extension_install' | 'profile_delete' | 'data_export';
  description: string;
  requiresReauth: boolean;
}

/**
 * Session Manager for Omnior Browser
 * Manages active sessions, auto-lock, and re-authentication
 */
export class SessionManager {
  private static instance: SessionManager;
  private loginManager: LoginManager;
  private config: SessionConfig = {
    idleTimeout: 10, // 10 minutes
    lockOnTimeout: true,
    requireReauthForSensitiveActions: true,
    notifyBeforeTimeout: 2 // 2 minutes
  };
  
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isLocked: boolean = false;
  private onSessionLock?: () => void;
  private onSessionExpire?: () => void;
  private onSessionUnlock?: () => void;
  private onWarning?: (warning: SessionWarning) => void;
  private onReauthRequired?: (action: SensitiveAction) => Promise<boolean>;

  private constructor() {
    this.loginManager = LoginManager.getInstance();
    this.setupActivityListeners();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Start a new authenticated session
   */
  startSession(userId: string, isGuest: boolean = false): void {
    this.lastActivity = Date.now();
    this.isLocked = false;
    
    // Clear existing timers
    this.clearTimers();
    
    // Start session monitoring
    this.startSessionMonitoring();
    
    console.log(`Session started for user ${userId}, guest mode: ${isGuest}`);
  }

  /**
   * End current session
   */
  endSession(): void {
    this.clearTimers();
    this.lastActivity = 0;
    this.isLocked = false;
    
    if (this.onSessionExpire) {
      this.onSessionExpire();
    }
    
    console.log('Session ended');
  }

  /**
   * Lock current session
   */
  async lockSession(): Promise<void> {
    if (!this.isLocked) {
      await this.loginManager.lock();
      this.isLocked = true;
      
      if (this.onSessionLock) {
        this.onSessionLock();
      }
      
      console.log('Session locked due to inactivity');
    }
  }

  /**
   * Unlock current session
   */
  async unlockSession(password: string): Promise<boolean> {
    try {
      await this.loginManager.unlock(password);
      this.isLocked = false;
      this.lastActivity = Date.now();
      this.startSessionMonitoring();
      
      if (this.onSessionUnlock) {
        this.onSessionUnlock();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if session is locked
   */
  isLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
    this.restartSessionMonitoring();
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const timeoutMs = this.config.idleTimeout * 60 * 1000;
    const timeRemaining = Math.max(0, timeoutMs - timeSinceActivity) / 1000;

    return {
      isActive: timeRemaining > 0 && !this.isLocked,
      isLocked: this.isLocked,
      isGuest: this.loginManager.isGuest(),
      userId: this.loginManager.getCurrentUser()?.id || null,
      startTime: new Date(now - timeoutMs + timeRemaining * 1000).toISOString(),
      lastActivity: new Date(this.lastActivity).toISOString(),
      timeRemaining,
      warnings: []
    };
  }

  /**
   * Configure session settings
   */
  configure(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    this.restartSessionMonitoring();
  }

  /**
   * Check if re-authentication is required for sensitive action
   */
  async requireReauthentication(action: SensitiveAction): Promise<boolean> {
    if (!action.requiresReauth || !this.config.requireReauthForSensitiveActions) {
      return true;
    }

    if (this.onReauthRequired) {
      return await this.onReauthRequired(action);
    }

    return false;
  }

  /**
   * Set session lock callback
   */
  onSessionLocked(callback: () => void): void {
    this.onSessionLock = callback;
  }

  /**
   * Set session expire callback
   */
  onSessionExpired(callback: () => void): void {
    this.onSessionExpire = callback;
  }

  /**
   * Set session unlock callback
   */
  onSessionUnlocked(callback: () => void): void {
    this.onSessionUnlock = callback;
  }

  /**
   * Set warning callback
   */
  onWarningReceived(callback: (warning: SessionWarning) => void): void {
    this.onWarning = callback;
  }

  /**
   * Set re-authentication callback
   */
  onReauthRequiredCallback(callback: (action: SensitiveAction) => Promise<boolean>): void {
    this.onReauthRequired = callback;
  }

  /**
   * Extend current session
   */
  extendSession(minutes: number): void {
    this.lastActivity = Date.now();
    this.config.idleTimeout = minutes;
    this.restartSessionMonitoring();
  }

  /**
   * Private helper methods
   */
  private startSessionMonitoring(): void {
    this.restartSessionMonitoring();
  }

  private restartSessionMonitoring(): void {
    this.clearTimers();

    const timeoutMs = this.config.idleTimeout * 60 * 1000;
    const warningMs = this.config.notifyBeforeTimeout * 60 * 1000;

    // Set warning timer
    if (warningMs > 0 && warningMs < timeoutMs) {
      this.warningTimer = setTimeout(() => {
        this.showWarning({
          type: 'timeout',
          message: `Session will timeout in ${this.config.notifyBeforeTimeout} minute(s)`,
          severity: 'warning',
          timestamp: new Date().toISOString()
        });
      }, timeoutMs - warningMs);
    }

    // Set session timeout timer
    this.sessionTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, timeoutMs);
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private async handleSessionTimeout(): Promise<void> {
    if (this.config.lockOnTimeout) {
      await this.lockSession();
    } else {
      this.endSession();
    }
  }

  private showWarning(warning: SessionWarning): void {
    if (this.onWarning) {
      this.onWarning(warning);
    }
  }

  private setupActivityListeners(): void {
    // Only set up listeners on client side
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return
    }

    // Track user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    const handleActivity = () => {
      this.updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track window focus
    const handleFocus = () => {
      this.updateActivity();
    };

    window.addEventListener('focus', handleFocus);

    // Store cleanup function
    (this as any).cleanupListeners = () => {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        return
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }

  /**
   * Predefined sensitive actions
   */
  static readonly SENSITIVE_ACTIONS = {
    SETTINGS_CHANGE: {
      type: 'settings_change' as const,
      description: 'Change browser settings',
      requiresReauth: true
    },
    EXTENSION_INSTALL: {
      type: 'extension_install' as const,
      description: 'Install browser extension',
      requiresReauth: true
    },
    PROFILE_DELETE: {
      type: 'profile_delete' as const,
      description: 'Delete user profile',
      requiresReauth: true
    },
    DATA_EXPORT: {
      type: 'data_export' as const,
      description: 'Export user data',
      requiresReauth: true
    }
  };
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// React hook for session management
export function useSessionManager() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    isLocked: false,
    isGuest: false,
    userId: null,
    startTime: '',
    lastActivity: '',
    timeRemaining: 0,
    warnings: []
  });

  const [warnings, setWarnings] = useState<SessionWarning[]>([]);

  useEffect(() => {
    // Update session state periodically
    const interval = setInterval(() => {
      setSessionState(sessionManager.getSessionState());
    }, 1000);

    // Setup callbacks
    sessionManager.onSessionLocked(() => {
      setSessionState(prev => ({ ...prev, isLocked: true }));
    });

    sessionManager.onSessionExpired(() => {
      setSessionState(prev => ({ ...prev, isActive: false }));
    });

    sessionManager.onWarningReceived((warning) => {
      setWarnings(prev => [...prev, warning]);
      // Auto-remove warnings after 5 seconds
      setTimeout(() => {
        setWarnings(prev => prev.filter(w => w.timestamp !== warning.timestamp));
      }, 5000);
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    sessionState,
    warnings,
    updateActivity: () => sessionManager.updateActivity(),
    extendSession: (minutes: number) => sessionManager.extendSession(minutes),
    requireReauth: (action: SensitiveAction) => sessionManager.requireReauthentication(action),
    clearWarnings: () => setWarnings([])
  };
}

// Import React hooks for the useSessionManager hook
import { useState, useEffect } from 'react';