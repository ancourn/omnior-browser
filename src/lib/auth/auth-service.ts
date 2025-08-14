import { LoginManager, UserProfile as LoginUserProfile } from '@/auth/LoginManager';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
  settings: Record<string, any>;
  isGuest: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  requiresReauth?: boolean;
}

/**
 * User Authentication Service for Omnior Browser
 * Handles login, registration, and profile management using the new LoginManager
 */
export class AuthService {
  private static instance: AuthService;
  private loginManager: LoginManager;

  private constructor() {
    this.loginManager = LoginManager.getInstance();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user
   */
  async register(credentials: AuthCredentials, name?: string): Promise<AuthResult> {
    try {
      const userProfile = await this.loginManager.register(
        credentials.email, 
        name || credentials.email.split('@')[0], 
        credentials.password
      );

      const user: UserProfile = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        createdAt: new Date(userProfile.createdAt).toISOString(),
        lastLogin: userProfile.lastLogin ? new Date(userProfile.lastLogin).toISOString() : undefined,
        settings: userProfile.settings || {},
        isGuest: false
      };

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const session = await this.loginManager.login(credentials.email, credentials.password);
      const currentUser = this.loginManager.getCurrentUser();

      if (!currentUser) {
        return {
          success: false,
          error: 'Login failed: No user returned'
        };
      }

      const user: UserProfile = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        createdAt: new Date(currentUser.createdAt).toISOString(),
        lastLogin: currentUser.lastLogin ? new Date(currentUser.lastLogin).toISOString() : undefined,
        settings: currentUser.settings || {},
        isGuest: false
      };

      return {
        success: true,
        user
      };
    } catch (error) {
      return {
        success: false,
        error: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.loginManager.logout();
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    const currentUser = this.loginManager.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    return {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      createdAt: new Date(currentUser.createdAt).toISOString(),
      lastLogin: currentUser.lastLogin ? new Date(currentUser.lastLogin).toISOString() : undefined,
      settings: currentUser.settings || {},
      isGuest: currentUser.id.startsWith('guest_')
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.loginManager.isAuthenticated() && !this.loginManager.isGuest();
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Record<string, any>): Promise<void> {
    const currentUser = this.loginManager.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Update settings in the user profile
    currentUser.settings = { ...currentUser.settings, ...settings };
    
    // Note: We need to implement a method in LoginManager to save updated profile
    // For now, we'll save it directly to IndexedDB
    await this.saveUserProfile(currentUser);
  }

  /**
   * Get user settings
   */
  getSettings(): Record<string, any> {
    const currentUser = this.loginManager.getCurrentUser();
    return currentUser?.settings || {};
  }

  /**
   * Set session timeout
   */
  setSessionTimeout(minutes: number): void {
    const currentUser = this.loginManager.getCurrentUser();
    if (currentUser) {
      currentUser.settings = currentUser.settings || {};
      currentUser.settings.sessionTimeout = minutes * 60 * 1000;
      this.saveUserProfile(currentUser);
    }
  }

  /**
   * Force re-authentication for sensitive actions
   */
  async reauthenticate(password: string): Promise<boolean> {
    try {
      const currentUser = this.loginManager.getCurrentUser();
      if (!currentUser || this.loginManager.isGuest()) {
        return false;
      }

      // Try to unlock the session with the password
      await this.loginManager.unlock(password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize the authentication system
   */
  async initialize(): Promise<void> {
    await this.loginManager.initialize();
  }

  /**
   * Private helper methods
   */
  private async saveUserProfile(profile: LoginUserProfile): Promise<void> {
    // Save the updated profile to IndexedDB
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OmniorBrowser_Profiles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        const saveRequest = store.put(profile);
        
        saveRequest.onerror = () => reject(saveRequest.error);
        saveRequest.onsuccess = () => resolve();
      };
    });
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();