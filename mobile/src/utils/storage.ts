import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Platform-aware storage wrapper
 *
 * On web: Uses sessionStorage (isolated per browser tab)
 * On mobile: Uses AsyncStorage as normal
 *
 * This prevents issues where multiple browser tabs share localStorage
 * and overwrite each other's authentication tokens.
 */
class PlatformStorage {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
      return;
    }
    return AsyncStorage.removeItem(key);
  }
}

export const storage = new PlatformStorage();
