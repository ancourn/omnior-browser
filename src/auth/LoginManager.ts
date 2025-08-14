/**
 * Login Manager - Handles user authentication, registration, and session management
 */

import { CryptoUtils } from './CryptoUtils';
import { SecureStorage, InMemoryStorage } from '@/storage/SecureStorage';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  salt: string; // base64 encoded salt
  passwordHash: string; // base64 encoded hash
  createdAt: number;
  lastLogin?: number;
  settings?: {
    sessionTimeout: number;
    autoLock: boolean;
    keepMeLoggedIn: boolean;
  };
}

export interface AuthSession {
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

export class LoginManager {
  private static instance: LoginManager;
  private profilesDb: IDBDatabase | null = null;
  private currentSession: AuthSession | null = null;
  private currentUser: UserProfile | null = null;
  private currentStorage: SecureStorage | InMemoryStorage | null = null;
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes default
  private inactivityTimer: NodeJS.Timeout | null = null;
  private keepMeLoggedIn: boolean = false;

  private constructor() {}

  static getInstance(): LoginManager {
    if (!LoginManager.instance) {
      LoginManager.instance = new LoginManager();
    }
    return LoginManager.instance;
  }

  /**
   * Initialize the authentication system
   */
  async initialize(): Promise<void> {
    await this.initializeProfilesDatabase();
    this.loadSessionFromStorage();
    this.setupActivityListeners();
  }

  /**
   * Initialize profiles database
   */
  private async initializeProfilesDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OmniorBrowser_Profiles', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.profilesDb = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('profiles')) {
          const store = db.createObjectStore('profiles', { keyPath: 'id' });
          store.createIndex('email', 'email', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'token' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  /**
   * Register a new user
   */
  async register(email: string, name: string, password: string): Promise<UserProfile> {
    // Validate inputs
    if (!email || !name || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate salt and hash password
    const salt = CryptoUtils.generateSalt();
    const passwordHash = await CryptoUtils.hashPassword(password, salt);

    // Create user profile
    const profile: UserProfile = {
      id: CryptoUtils.generateToken(16),
      email,
      name,
      salt: CryptoUtils.arrayBufferToBase64(salt),
      passwordHash,
      createdAt: Date.now(),
      settings: {
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        autoLock: true,
        keepMeLoggedIn: false
      }
    };

    // Save profile
    await this.saveProfile(profile);

    return profile;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string, keepMeLoggedIn: boolean = false): Promise<AuthSession> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const salt = CryptoUtils.base64ToArrayBuffer(user.salt);
    const isValid = await CryptoUtils.verifyPassword(password, salt, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const session: AuthSession = {
      userId: user.id,
      token: CryptoUtils.generateToken(32),
      createdAt: Date.now(),
      expiresAt: keepMeLoggedIn ? Date.now() + (30 * 24 * 60 * 60 * 1000) : Date.now() + user.settings!.sessionTimeout,
      isActive: true
    };

    // Save session
    await this.saveSession(session);

    // Update user's last login
    user.lastLogin = Date.now();
    await this.saveProfile(user);

    // Set current session and user
    this.currentSession = session;
    this.currentUser = user;
    this.keepMeLoggedIn = keepMeLoggedIn;
    this.sessionTimeout = user.settings!.sessionTimeout;

    // Initialize secure storage
    const encryptionKey = await CryptoUtils.deriveKey(password, salt);
    this.currentStorage = new SecureStorage(user.id, encryptionKey);
    await this.currentStorage.initialize();

    // Store session in localStorage for persistence
    this.storeSessionInStorage(session);

    // Start inactivity timer
    this.startInactivityTimer();

    return session;
  }

  /**
   * Start guest mode
   */
  async startGuestMode(): Promise<void> {
    // Clear any existing session
    await this.logout();

    // Create guest user profile (not persisted)
    const guestProfile: UserProfile = {
      id: 'guest_' + CryptoUtils.generateToken(8),
      email: 'guest@omnior.local',
      name: 'Guest User',
      salt: '',
      passwordHash: '',
      createdAt: Date.now(),
      settings: {
        sessionTimeout: 0, // No timeout for guest
        autoLock: false,
        keepMeLoggedIn: false
      }
    };

    // Create guest session
    const session: AuthSession = {
      userId: guestProfile.id,
      token: 'guest_' + CryptoUtils.generateToken(16),
      createdAt: Date.now(),
      expiresAt: 0, // Never expires for guest
      isActive: true
    };

    this.currentSession = session;
    this.currentUser = guestProfile;
    this.currentStorage = new InMemoryStorage();

    // Don't store guest session in persistent storage
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Clear session
    if (this.currentSession) {
      await this.deleteSession(this.currentSession.token);
      this.currentSession = null;
    }

    // Clear user
    this.currentUser = null;

    // Close and clear storage
    if (this.currentStorage) {
      if (this.currentStorage instanceof SecureStorage) {
        await this.currentStorage.close();
      }
      this.currentStorage = null;
    }

    // Clear stored session
    localStorage.removeItem('omnior_session');

    // Clear inactivity timer
    this.clearInactivityTimer();

    // Clear sensitive data from memory
    this.wipeSensitiveData();
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Get current storage
   */
  getCurrentStorage(): SecureStorage | InMemoryStorage | null {
    return this.currentStorage;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentSession!.isActive;
  }

  /**
   * Check if current user is guest
   */
  isGuest(): boolean {
    return this.currentUser?.id.startsWith('guest_') || false;
  }

  /**
   * Refresh session (extend expiration)
   */
  async refreshSession(): Promise<void> {
    if (!this.currentSession || this.isGuest()) {
      return;
    }

    this.currentSession.expiresAt = Date.now() + this.sessionTimeout;
    await this.saveSession(this.currentSession);
    this.storeSessionInStorage(this.currentSession);
    this.startInactivityTimer();
  }

  /**
   * Lock browser (require password to unlock)
   */
  async lock(): Promise<void> {
    if (!this.isAuthenticated() || this.isGuest()) {
      return;
    }

    // Clear session but keep user data
    this.currentSession = null;
    localStorage.removeItem('omnior_session');
    this.clearInactivityTimer();
  }

  /**
   * Unlock browser with password
   */
  async unlock(password: string): Promise<AuthSession> {
    if (!this.currentUser || this.isGuest()) {
      throw new Error('No user to unlock');
    }

    return this.login(this.currentUser.email, password, this.keepMeLoggedIn);
  }

  /**
   * Get all user profiles
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<void> {
    // Delete profile
    await this.deleteProfileData(userId);

    // Delete user's encrypted storage
    const storage = new SecureStorage(userId, null as any);
    await storage.deleteDatabase();

    // Delete all sessions for this user
    await this.deleteSessionsForUser(userId);
  }

  /**
   * Private helper methods
   */
  private async getUserByEmail(email: string): Promise<UserProfile | null> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['profiles'], 'readonly');
      const store = transaction.objectStore('profiles');
      const index = store.index('email');
      const request = index.get(email);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async saveProfile(profile: UserProfile): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.put(profile);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async deleteProfileData(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['profiles'], 'readwrite');
      const store = transaction.objectStore('profiles');
      const request = store.delete(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async saveSession(session: AuthSession): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async deleteSession(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(token);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async deleteSessionsForUser(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.profilesDb) {
        reject(new Error('Profiles database not initialized'));
        return;
      }

      const transaction = this.profilesDb.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const index = store.index('userId');
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  private storeSessionInStorage(session: AuthSession): void {
    localStorage.setItem('omnior_session', JSON.stringify({
      token: session.token,
      expiresAt: session.expiresAt
    }));
  }

  private loadSessionFromStorage(): void {
    try {
      const stored = localStorage.getItem('omnior_session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        
        // Check if session is still valid
        if (sessionData.expiresAt > Date.now()) {
          // Session is valid, but we need to restore the full session
          // This will be handled by the authentication flow
        } else {
          // Session expired, remove it
          localStorage.removeItem('omnior_session');
        }
      }
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      localStorage.removeItem('omnior_session');
    }
  }

  private startInactivityTimer(): void {
    this.clearInactivityTimer();
    
    if (this.sessionTimeout > 0 && !this.isGuest()) {
      this.inactivityTimer = setTimeout(() => {
        this.lock();
      }, this.sessionTimeout);
    }
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private setupActivityListeners(): void {
    // Listen for user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (this.isAuthenticated() && !this.isGuest()) {
        this.refreshSession();
      }
    };

    activities.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  private wipeSensitiveData(): void {
    // Clear any sensitive data from memory
    this.currentUser = null;
    this.currentSession = null;
    this.keepMeLoggedIn = false;
    
    // Force garbage collection if available
    if (typeof gc === 'function') {
      gc();
    }
  }
}