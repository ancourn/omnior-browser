/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

import { create } from 'zustand';
import { authService } from './auth-service';
import { guestModeService } from './guest-mode';
import { sessionManager } from './session-manager';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isSessionLocked: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setIsGuest: (guest: boolean) => void;
  setIsSessionLocked: (locked: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  startGuestSession: () => void;
  endGuestSession: () => void;
  checkSession: () => Promise<void>;
  unlockSession: (password: string) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isSessionLocked: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setIsSessionLocked: (isSessionLocked) => set({ isSessionLocked }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const user = await authService.login(email, password);
      if (!user) {
        throw new Error('Login failed');
      }

      set({ 
        user, 
        isAuthenticated: true, 
        isGuest: false,
        isSessionLocked: false 
      });

      // Start session
      sessionManager.startSession(user.id, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      
      await authService.logout();
      guestModeService.endGuestSession();
      sessionManager.endSession();
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        isGuest: false,
        isSessionLocked: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  startGuestSession: () => {
    guestModeService.startGuestSession();
    sessionManager.startSession('guest', true);
    
    set({ 
      user: { 
        id: 'guest', 
        email: 'guest@omnior.local', 
        name: 'Guest User' 
      }, 
      isAuthenticated: true, 
      isGuest: true,
      isSessionLocked: false 
    });
  },

  endGuestSession: () => {
    guestModeService.endGuestSession();
    sessionManager.endSession();
    
    set({ 
      user: null, 
      isAuthenticated: false, 
      isGuest: false,
      isSessionLocked: false 
    });
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });
      
      const user = authService.getCurrentUser();
      const isGuest = guestModeService.isGuestMode();
      
      if (user) {
        set({ 
          user, 
          isAuthenticated: true, 
          isGuest: false,
          isSessionLocked: sessionManager.isLocked() 
        });
        sessionManager.startSession(user.id, false);
      } else if (isGuest) {
        set({ 
          user: { 
            id: 'guest', 
            email: 'guest@omnior.local', 
            name: 'Guest User' 
          }, 
          isAuthenticated: true, 
          isGuest: true,
          isSessionLocked: sessionManager.isLocked() 
        });
        sessionManager.startSession('guest', true);
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isGuest: false,
          isSessionLocked: false 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session check failed';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  unlockSession: async (password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const success = await sessionManager.unlockSession(password);
      if (!success) {
        throw new Error('Invalid password');
      }

      set({ isSessionLocked: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unlock failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isGuest: false,
    isSessionLocked: false,
    isLoading: false,
    error: null 
  }),
}));

// Setup session event listeners
sessionManager.onSessionLocked(() => {
  useAuthStore.getState().setIsSessionLocked(true);
});

sessionManager.onSessionExpired(() => {
  useAuthStore.getState().logout();
});

sessionManager.onSessionUnlocked(() => {
  useAuthStore.getState().setIsSessionLocked(false);
});