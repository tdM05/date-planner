import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../api';
import { STORAGE_KEYS } from '../constants/config';
import { storage } from '../utils/storage';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Login
  login: async (credentials: LoginRequest) => {
    try {
      console.log('[AuthStore] Login attempt:', { email: credentials.email });
      set({ isLoading: true, error: null });
      const response = await authAPI.login(credentials);
      console.log('[AuthStore] Login response:', response);
      const token = response.access_token;

      // Store token
      await storage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });
      console.log('[AuthStore] Token stored, fetching user...');

      // Fetch user data
      await get().fetchUser();
      console.log('[AuthStore] Login successful');
    } catch (error: any) {
      console.error('[AuthStore] Login failed:', error);
      set({ error: error.message || 'Login failed', isAuthenticated: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Register
  register: async (data: RegisterRequest) => {
    try {
      console.log('[AuthStore] Register attempt:', { email: data.email, full_name: data.full_name });
      set({ isLoading: true, error: null });
      const response = await authAPI.register(data);
      console.log('[AuthStore] Register response:', response);
      const token = response.access_token;

      // Store token
      await storage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });
      console.log('[AuthStore] Token stored, fetching user...');

      // Fetch user data
      await get().fetchUser();
      console.log('[AuthStore] Registration successful');
    } catch (error: any) {
      console.error('[AuthStore] Registration failed:', error);
      // Set error but don't change isAuthenticated (should already be false)
      // Changing it might cause navigation stack to reset
      set({ error: error.message || 'Registration failed' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      // Clear storage
      await storage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);

      // Reset state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  // Load stored authentication
  loadStoredAuth: async () => {
    try {
      console.log('[AuthStore] Loading stored auth...');
      set({ isLoading: true });
      const token = await storage.getItem(STORAGE_KEYS.JWT_TOKEN);

      if (token) {
        console.log('[AuthStore] Found stored token, verifying...');
        set({ token, isAuthenticated: true });
        await get().fetchUser();
      } else {
        console.log('[AuthStore] No stored token found');
      }
    } catch (error: any) {
      console.error('[AuthStore] Load stored auth error:', error);
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
      console.log('[AuthStore] Load stored auth complete');
    }
  },

  // Set token (for OAuth flow)
  setToken: async (token: string) => {
    try {
      await storage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });

      // Try to fetch user data, but don't fail OAuth if it's just a network error
      try {
        await get().fetchUser();
      } catch (fetchError: any) {
        const isAbortedRequest = fetchError.message?.includes('aborted') || fetchError.message?.includes('timeout');
        if (isAbortedRequest) {
          console.log('[AuthStore] User fetch failed during OAuth, will retry on next load');
          // Token is already set, navigation will happen automatically
          // User data will be fetched when the app loads
        } else {
          // For other errors (like 401), rethrow
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error('Set token error:', error);
      throw error;
    }
  },

  // Fetch user data
  fetchUser: async () => {
    try {
      console.log('[AuthStore] Fetching user data...');
      const user = await authAPI.getMe();
      console.log('[AuthStore] User data received:', user);
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      set({ user });
      console.log('[AuthStore] User data stored');
    } catch (error: any) {
      console.error('[AuthStore] Fetch user error:', error);
      // Only clear auth if it's an actual auth error (401), not a network/timeout error
      // Aborted requests (from page reloads) or timeouts should not clear the token
      const isAuthError = error.status === 401;
      const isAbortedRequest = error.message?.includes('aborted') || error.message?.includes('timeout');

      if (isAuthError) {
        console.log('[AuthStore] Authentication failed, clearing token');
        await get().logout();
      } else if (isAbortedRequest) {
        console.log('[AuthStore] Request aborted/timed out, keeping token for retry');
        // Don't clear the token - it might still be valid
      } else {
        // For other errors, clear auth to be safe
        console.log('[AuthStore] Unknown error, clearing token');
        await get().logout();
      }
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
