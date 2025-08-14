/**
 * Session Manager - Handles session timeout, auto-lock, and activity monitoring
 */

import { LoginManager, AuthSession } from '@/auth/LoginManager';

export interface SessionConfig {
  timeout: number; // milliseconds
  autoLock: boolean;
  lockOnMinimize: boolean;
  lockOnIdle: boolean;
  idleThreshold: number; // milliseconds
  keepMeLoggedIn: boolean;
}

export interface SessionActivity {
  timestamp: number;
  type: 'mouse' | 'keyboard' | 'touch' | 'scroll' | 'focus';
  details?: any;
}

export class SessionManager {
  private static instance: SessionManager;
  private loginManager: LoginManager;
  private config: SessionConfig;
  private activityTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  lastActivity: number = Date.now();
  private isLocked: boolean = false;
  private isMinimized: boolean = false;
  private activityListeners: Array<(activity: SessionActivity) => void> = [];
  private sessionListeners: Array<(event: 'timeout' | 'lock' | 'unlock' | 'refresh') => void> = [];

  private constructor() {
    this.loginManager = LoginManager.getInstance();
    this.config = {
      timeout: 30 * 60 * 1000, // 30 minutes
      autoLock: true,
      lockOnMinimize: true,
      lockOnIdle: true,
      idleThreshold: 5 * 60 * 1000, // 5 minutes
      keepMeLoggedIn: false
    };
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize the session manager
   */
  async initialize(): Promise<void> {
    await this.loginManager.initialize();
    this.setupActivityListeners();
    this.setupVisibilityListeners();
    this.startSessionMonitoring();
  }

  /**
   * Update session configuration
   */
  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };
    this.restartSessionMonitoring();
  }

  /**
   * Get current session configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Get current session status
   */
  getSessionStatus(): {
    isActive: boolean;
    isLocked: boolean;
    isIdle: boolean;
    timeRemaining: number;
    lastActivity: number;
    session?: AuthSession;
  } {
    const session = this.loginManager.getCurrentSession();
    const isIdle = this.isIdle();
    let timeRemaining = 0;

    if (session && session.expiresAt > 0) {
      timeRemaining = Math.max(0, session.expiresAt - Date.now());
    }

    return {
      isActive: this.loginManager.isAuthenticated(),
      isLocked: this.isLocked,
      isIdle,
      timeRemaining,
      lastActivity: this.lastActivity,
      session
    };
  }

  /**
   * Lock the current session
   */
  async lock(): Promise<void> {
    if (!this.loginManager.isAuthenticated() || this.isLocked) {
      return;
    }

    this.isLocked = true;
    this.clearTimers();
    
    try {
      await this.loginManager.lock();
      this.notifySessionListeners('lock');
    } catch (error) {
      console.error('Failed to lock session:', error);
      this.isLocked = false;
    }
  }

  /**
   * Unlock the current session
   */
  async unlock(password: string): Promise<void> {
    if (!this.isLocked) {
      return;
    }

    try {
      await this.loginManager.unlock(password);
      this.isLocked = false;
      this.lastActivity = Date.now();
      this.startSessionMonitoring();
      this.notifySessionListeners('unlock');
    } catch (error) {
      console.error('Failed to unlock session:', error);
      throw error;
    }
  }

  /**
   * Refresh the current session
   */
  async refresh(): Promise<void> {
    if (!this.loginManager.isAuthenticated() || this.isLocked) {
      return;
    }

    try {
      await this.loginManager.refreshSession();
      this.lastActivity = Date.now();
      this.restartSessionMonitoring();
      this.notifySessionListeners('refresh');
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }

  /**
   * Force session timeout
   */
  async forceTimeout(): Promise<void> {
    if (!this.loginManager.isAuthenticated()) {
      return;
    }

    this.clearTimers();
    this.notifySessionListeners('timeout');
    
    try {
      await this.loginManager.logout();
    } catch (error) {
      console.error('Failed to logout on timeout:', error);
    }
  }

  /**
   * Add activity listener
   */
  addActivityListener(listener: (activity: SessionActivity) => void): void {
    this.activityListeners.push(listener);
  }

  /**
   * Remove activity listener
   */
  removeActivityListener(listener: (activity: SessionActivity) => void): void {
    const index = this.activityListeners.indexOf(listener);
    if (index > -1) {
      this.activityListeners.splice(index, 1);
    }
  }

  /**
   * Add session listener
   */
  addSessionListener(listener: (event: 'timeout' | 'lock' | 'unlock' | 'refresh') => void): void {
    this.sessionListeners.push(listener);
  }

  /**
   * Remove session listener
   */
  removeSessionListener(listener: (event: 'timeout' | 'lock' | 'unlock' | 'refresh') => void): void {
    const index = this.sessionListeners.indexOf(listener);
    if (index > -1) {
      this.sessionListeners.splice(index, 1);
    }
  }

  /**
   * Record user activity
   */
  private recordActivity(type: SessionActivity['type'], details?: any): void {
    const now = Date.now();
    const activity: SessionActivity = {
      timestamp: now,
      type,
      details
    };

    this.lastActivity = now;
    
    // Notify activity listeners
    this.activityListeners.forEach(listener => {
      try {
        listener(activity);
      } catch (error) {
        console.error('Activity listener error:', error);
      }
    });

    // Refresh session if needed
    if (this.loginManager.isAuthenticated() && !this.isLocked) {
      this.refresh();
    }
  }

  /**
   * Check if user is idle
   */
  private isIdle(): boolean {
    return Date.now() - this.lastActivity > this.config.idleThreshold;
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    // Mouse events
    document.addEventListener('mousedown', () => {
      this.recordActivity('mouse');
    });

    document.addEventListener('mousemove', () => {
      this.recordActivity('mouse');
    });

    // Keyboard events
    document.addEventListener('keydown', () => {
      this.recordActivity('keyboard');
    });

    document.addEventListener('keypress', () => {
      this.recordActivity('keyboard');
    });

    // Touch events
    document.addEventListener('touchstart', () => {
      this.recordActivity('touch');
    });

    document.addEventListener('touchmove', () => {
      this.recordActivity('touch');
    });

    // Scroll events
    window.addEventListener('scroll', () => {
      this.recordActivity('scroll');
    });

    // Focus events
    window.addEventListener('focus', () => {
      this.recordActivity('focus');
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.recordActivity('focus');
      }
    });
  }

  /**
   * Setup visibility listeners for minimize detection
   */
  private setupVisibilityListeners(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleMinimize();
      } else {
        this.handleRestore();
      }
    });

    window.addEventListener('blur', () => {
      this.handleMinimize();
    });

    window.addEventListener('focus', () => {
      this.handleRestore();
    });
  }

  /**
   * Handle window minimize
   */
  private handleMinimize(): void {
    this.isMinimized = true;
    
    if (this.config.lockOnMinimize && this.loginManager.isAuthenticated() && !this.isLocked) {
      // Lock after a delay to avoid immediate locking on alt-tab
      setTimeout(() => {
        if (this.isMinimized) {
          this.lock();
        }
      }, 5000); // 5 second delay
    }
  }

  /**
   * Handle window restore
   */
  private handleRestore(): void {
    this.isMinimized = false;
    this.recordActivity('focus');
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    this.clearTimers();
    
    if (!this.loginManager.isAuthenticated() || this.loginManager.isGuest()) {
      return;
    }

    // Start activity timeout timer
    if (this.config.timeout > 0) {
      this.activityTimer = setTimeout(() => {
        if (this.config.autoLock) {
          this.lock();
        } else {
          this.forceTimeout();
        }
      }, this.config.timeout);
    }

    // Start idle detection timer
    if (this.config.lockOnIdle && this.config.idleThreshold > 0) {
      this.idleTimer = setTimeout(() => {
        if (this.isIdle() && this.config.autoLock) {
          this.lock();
        }
      }, this.config.idleThreshold);
    }
  }

  /**
   * Restart session monitoring
   */
  private restartSessionMonitoring(): void {
    this.startSessionMonitoring();
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Notify session listeners
   */
  private notifySessionListeners(event: 'timeout' | 'lock' | 'unlock' | 'refresh'): void {
    this.sessionListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalActivities: number;
    activitiesByType: Record<SessionActivity['type'], number>;
    averageActivityInterval: number;
    sessionDuration: number;
  } {
    // This would normally track actual activities
    // For now, return mock data
    return {
      totalActivities: 0,
      activitiesByType: {
        mouse: 0,
        keyboard: 0,
        touch: 0,
        scroll: 0,
        focus: 0
      },
      averageActivityInterval: 0,
      sessionDuration: this.loginManager.getCurrentSession() 
        ? Date.now() - this.loginManager.getCurrentSession()!.createdAt 
        : 0
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimers();
    this.activityListeners = [];
    this.sessionListeners = [];
  }
}