import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authAPI } from '../api';
import { STORAGE_KEYS } from '../constants/config';

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
      set({ isLoading: true, error: null });
      const response = await authAPI.login(credentials);
      const token = response.access_token;

      // Store token
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });

      // Fetch user data
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Login failed', isAuthenticated: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Register
  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.register(data);
      const token = response.access_token;

      // Store token
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });

      // Fetch user data
      await get().fetchUser();
    } catch (error: any) {
      set({ error: error.message || 'Registration failed', isAuthenticated: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    try {
      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

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
      set({ isLoading: true });
      const token = await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

      if (token) {
        set({ token, isAuthenticated: true });
        await get().fetchUser();
      }
    } catch (error: any) {
      console.error('Load stored auth error:', error);
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Set token (for OAuth flow)
  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      set({ token, isAuthenticated: true });
      await get().fetchUser();
    } catch (error: any) {
      console.error('Set token error:', error);
      throw error;
    }
  },

  // Fetch user data
  fetchUser: async () => {
    try {
      const user = await authAPI.getMe();
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      set({ user });
    } catch (error: any) {
      console.error('Fetch user error:', error);
      // If fetching user fails, clear auth
      await get().logout();
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
