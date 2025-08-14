/**
 * Idle Timer Module for Auto-Profile Lock
 * Monitors user activity and triggers auto-lock after configurable inactivity period
 */

export interface IdleTimerConfig {
  timeoutMinutes: number;
  warningSeconds?: number;
  enableWarning?: boolean;
  activities: string[]; // Events to monitor
}

export interface IdleTimerEvents {
  onIdle: () => void;
  onWarning?: (remainingSeconds: number) => void;
  onActivity: () => void;
  onReset: () => void;
}

export class IdleTimer {
  private config: IdleTimerConfig;
  private events: IdleTimerEvents;
  private timeout: number; // in milliseconds
  private warningTimeout: number; // in milliseconds
  private timer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number;
  private isIdle: boolean;
  private isPaused: boolean;
  private activityListeners: Map<string, EventListener> = new Map();

  constructor(config: IdleTimerConfig, events: IdleTimerEvents) {
    this.config = {
      warningSeconds: 60, // 1 minute warning by default
      enableWarning: true,
      activities: [
        'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 
        'click', 'keydown', 'keyup', 'input', 'change', 'focus'
      ],
      ...config
    };

    this.events = events;
    this.timeout = this.config.timeoutMinutes * 60 * 1000;
    this.warningTimeout = (this.config.warningSeconds || 60) * 1000;
    this.lastActivity = Date.now();
    this.isIdle = false;
    this.isPaused = false;
  }

  /**
   * Start monitoring user activity
   */
  start(): void {
    if (this.timer) {
      this.stop();
    }

    this.setupActivityListeners();
    this.resetTimer();
  }

  /**
   * Stop monitoring user activity
   */
  stop(): void {
    this.clearTimers();
    this.removeActivityListeners();
    this.isIdle = false;
  }

  /**
   * Pause the idle timer (useful for videos, presentations, etc.)
   */
  pause(): void {
    this.isPaused = true;
    this.clearTimers();
  }

  /**
   * Resume the idle timer
   */
  resume(): void {
    this.isPaused = false;
    this.resetTimer();
  }

  /**
   * Reset the idle timer
   */
  reset(): void {
    this.lastActivity = Date.now();
    this.resetTimer();
    this.events.onReset();
  }

  /**
   * Get remaining time before idle (in seconds)
   */
  getRemainingTime(): number {
    if (this.isPaused) {
      return Infinity;
    }
    
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, Math.floor((this.timeout - elapsed) / 1000));
  }

  /**
   * Check if currently idle
   */
  isCurrentlyIdle(): boolean {
    return this.isIdle;
  }

  /**
   * Check if timer is paused
   */
  isTimerPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IdleTimerConfig>): void {
    const oldTimeout = this.timeout;
    
    this.config = { ...this.config, ...newConfig };
    this.timeout = this.config.timeoutMinutes * 60 * 1000;
    this.warningTimeout = (this.config.warningSeconds || 60) * 1000;

    // If timeout changed, reset the timer
    if (oldTimeout !== this.timeout) {
      this.resetTimer();
    }
  }

  /**
   * Force idle state (for testing or manual lock)
   */
  forceIdle(): void {
    this.clearTimers();
    this.isIdle = true;
    this.events.onIdle();
  }

  /**
   * Setup activity event listeners
   */
  private setupActivityListeners(): void {
    this.config.activities.forEach(eventType => {
      const listener = this.createActivityListener();
      this.activityListeners.set(eventType, listener);
      document.addEventListener(eventType, listener, { passive: true });
    });

    // Special handling for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { passive: true });
    
    // Handle page unload
    window.addEventListener('beforeunload', this.handleBeforeUnload, { passive: true });
  }

  /**
   * Remove activity event listeners
   */
  private removeActivityListeners(): void {
    this.activityListeners.forEach((listener, eventType) => {
      document.removeEventListener(eventType, listener);
    });
    this.activityListeners.clear();

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  /**
   * Create activity listener
   */
  private createActivityListener(): EventListener {
    return () => {
      if (!this.isPaused) {
        this.handleActivity();
      }
    };
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    const now = Date.now();
    
    // Debounce rapid events
    if (now - this.lastActivity < 100) {
      return;
    }

    this.lastActivity = now;

    // If we were idle, reset state
    if (this.isIdle) {
      this.isIdle = false;
      this.events.onActivity();
    }

    this.resetTimer();
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Page is hidden, consider pausing or adjusting timer
      // For now, we'll just note the time and continue
    } else {
      // Page is visible again, check if we should reset
      this.handleActivity();
    }
  };

  /**
   * Handle before unload
   */
  private handleBeforeUnload = (): void => {
    // Clean up timers before page unload
    this.clearTimers();
  };

  /**
   * Reset the main timer
   */
  private resetTimer(): void {
    this.clearTimers();
    
    if (this.isPaused) {
      return;
    }

    // Set main timeout
    this.timer = setTimeout(() => {
      this.handleTimeout();
    }, this.timeout);

    // Set warning timeout if enabled
    if (this.config.enableWarning && this.config.warningSeconds) {
      const warningTime = this.timeout - this.warningTimeout;
      if (warningTime > 0) {
        this.warningTimer = setTimeout(() => {
          this.handleWarning();
        }, warningTime);
      }
    }
  }

  /**
   * Handle main timeout
   */
  private handleTimeout(): void {
    this.isIdle = true;
    this.events.onIdle();
  }

  /**
   * Handle warning timeout
   */
  private handleWarning(): void {
    if (this.events.onWarning) {
      const remainingSeconds = this.config.warningSeconds || 60;
      this.events.onWarning(remainingSeconds);
    }
  }

  /**
   * Clear all active timers
   */
  private clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}

/**
 * Profile Auto-Lock Manager
 * Integrates idle timer with profile management for automatic locking
 */

export interface ProfileAutoLockConfig {
  defaultTimeoutMinutes: number;
  warningSeconds: number;
  enableWarning: boolean;
  lockOnSleep: boolean;
  lockOnBlur: boolean;
  excludedProfiles: string[]; // Profiles that shouldn't auto-lock
}

export class ProfileAutoLockManager {
  private idleTimer: IdleTimer;
  private config: ProfileAutoLockConfig;
  private onLockCallback: () => Promise<void>;
  private onWarningCallback?: (remainingSeconds: number) => void;
  private isActive: boolean;

  constructor(
    config: ProfileAutoLockConfig,
    onLock: () => Promise<void>,
    onWarning?: (remainingSeconds: number) => void
  ) {
    this.config = config;
    this.onLockCallback = onLock;
    this.onWarningCallback = onWarning;
    this.isActive = false;

    this.idleTimer = new IdleTimer(
      {
        timeoutMinutes: config.defaultTimeoutMinutes,
        warningSeconds: config.warningSeconds,
        enableWarning: config.enableWarning,
        activities: [
          'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 
          'click', 'keydown', 'keyup', 'input', 'change', 'focus', 'visibilitychange'
        ]
      },
      {
        onIdle: this.handleIdle.bind(this),
        onWarning: this.handleWarning.bind(this),
        onActivity: this.handleActivity.bind(this),
        onReset: this.handleReset.bind(this)
      }
    );
  }

  /**
   * Start auto-lock monitoring
   */
  start(profileId?: string): void {
    if (profileId && this.config.excludedProfiles.includes(profileId)) {
      // Don't start auto-lock for excluded profiles (e.g., guest mode)
      return;
    }

    this.isActive = true;
    this.idleTimer.start();
  }

  /**
   * Stop auto-lock monitoring
   */
  stop(): void {
    this.isActive = false;
    this.idleTimer.stop();
  }

  /**
   * Pause auto-lock temporarily
   */
  pause(): void {
    if (this.isActive) {
      this.idleTimer.pause();
    }
  }

  /**
   * Resume auto-lock
   */
  resume(): void {
    if (this.isActive) {
      this.idleTimer.resume();
    }
  }

  /**
   * Reset the auto-lock timer
   */
  reset(): void {
    if (this.isActive) {
      this.idleTimer.reset();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ProfileAutoLockConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.idleTimer.updateConfig({
      timeoutMinutes: this.config.defaultTimeoutMinutes,
      warningSeconds: this.config.warningSeconds,
      enableWarning: this.config.enableWarning
    });
  }

  /**
   * Get remaining time before auto-lock (in seconds)
   */
  getRemainingTime(): number {
    return this.idleTimer.getRemainingTime();
  }

  /**
   * Check if auto-lock is currently active
   */
  isAutoLockActive(): boolean {
    return this.isActive;
  }

  /**
   * Force immediate lock (for testing or manual trigger)
   */
  async forceLock(): Promise<void> {
    await this.onLockCallback();
  }

  /**
   * Handle idle timeout
   */
  private async handleIdle(): Promise<void> {
    try {
      await this.onLockCallback();
    } catch (error) {
      console.error('Failed to execute auto-lock callback:', error);
    }
  }

  /**
   * Handle warning timeout
   */
  private handleWarning(remainingSeconds: number): void {
    if (this.onWarningCallback) {
      this.onWarningCallback(remainingSeconds);
    }
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    // Additional activity handling if needed
  }

  /**
   * Handle timer reset
   */
  private handleReset(): void {
    // Additional reset handling if needed
  }
}

/**
 * Factory function to create a profile auto-lock manager
 */
export function createProfileAutoLockManager(
  config: ProfileAutoLockConfig,
  onLock: () => Promise<void>,
  onWarning?: (remainingSeconds: number) => void
): ProfileAutoLockManager {
  return new ProfileAutoLockManager(config, onLock, onWarning);
}

/**
 * Default configuration for profile auto-lock
 */
export const DEFAULT_AUTO_LOCK_CONFIG: ProfileAutoLockConfig = {
  defaultTimeoutMinutes: 30,
  warningSeconds: 60,
  enableWarning: true,
  lockOnSleep: true,
  lockOnBlur: false,
  excludedProfiles: ['guest'] // Guest profiles don't auto-lock
};

/**
 * Utility function to detect system sleep/wake events
 */
export function setupSleepDetection(onSleep: () => void, onWake: () => void): () => void {
  let lastTime = Date.now();
  
  const checkTime = () => {
    const now = Date.now();
    const diff = now - lastTime;
    
    // If more than 2 seconds have passed, assume system was asleep
    if (diff > 2000) {
      onSleep();
      // Small delay before calling onWake to ensure system is fully awake
      setTimeout(onWake, 100);
    }
    
    lastTime = now;
  };

  const interval = setInterval(checkTime, 1000);
  
  return () => clearInterval(interval);
}