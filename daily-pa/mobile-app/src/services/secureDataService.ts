/**
 * Secure Data Service
 * Provides encrypted storage for sensitive data fields
 * Uses encryptionService for encryption/decryption
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptionService } from './encryptionService';

const SECURE_DATA_PREFIX = '@secure_';

interface SecureDataResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SecureDataService {
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await encryptionService.initialize();
  }

  /**
   * Store sensitive data with encryption
   */
  async setSecureItem(key: string, value: string): Promise<SecureDataResult> {
    try {
      const encryptResult = await encryptionService.encrypt(value);
      
      if (!encryptResult.success || !encryptResult.data) {
        return {
          success: false,
          error: encryptResult.error || 'Encryption failed',
        };
      }

      await AsyncStorage.setItem(SECURE_DATA_PREFIX + key, encryptResult.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store secure item',
      };
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  async getSecureItem(key: string): Promise<SecureDataResult<string>> {
    try {
      const encryptedData = await AsyncStorage.getItem(SECURE_DATA_PREFIX + key);
      
      if (!encryptedData) {
        return { success: true, data: undefined };
      }

      const decryptResult = await encryptionService.decrypt(encryptedData);
      
      if (!decryptResult.success) {
        return {
          success: false,
          error: decryptResult.error || 'Decryption failed',
        };
      }

      return { success: true, data: decryptResult.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve secure item',
      };
    }
  }

  /**
   * Store object with encryption
   */
  async setSecureObject(key: string, value: any): Promise<SecureDataResult> {
    try {
      const encryptResult = await encryptionService.encryptObject(value);
      
      if (!encryptResult.success || !encryptResult.data) {
        return {
          success: false,
          error: encryptResult.error || 'Encryption failed',
        };
      }

      await AsyncStorage.setItem(SECURE_DATA_PREFIX + key, encryptResult.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store secure object',
      };
    }
  }

  /**
   * Retrieve and decrypt object
   */
  async getSecureObject<T = any>(key: string): Promise<SecureDataResult<T>> {
    try {
      const encryptedData = await AsyncStorage.getItem(SECURE_DATA_PREFIX + key);
      
      if (!encryptedData) {
        return { success: true, data: undefined };
      }

      const decryptResult = await encryptionService.decryptObject<T>(encryptedData);
      
      if (!decryptResult.success) {
        return {
          success: false,
          error: decryptResult.error || 'Decryption failed',
        };
      }

      return { success: true, data: decryptResult.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve secure object',
      };
    }
  }

  /**
   * Remove secure item
   */
  async removeSecureItem(key: string): Promise<SecureDataResult> {
    try {
      await AsyncStorage.removeItem(SECURE_DATA_PREFIX + key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove secure item',
      };
    }
  }

  /**
   * Clear all secure data
   */
  async clearAllSecureData(): Promise<SecureDataResult> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const secureKeys = allKeys.filter(key => key.startsWith(SECURE_DATA_PREFIX));
      
      if (secureKeys.length > 0) {
        await AsyncStorage.multiRemove(secureKeys);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear secure data',
      };
    }
  }

  /**
   * Check if encryption is available
   */
  async isAvailable(): Promise<boolean> {
    return await encryptionService.isAvailable();
  }
}

export const secureDataService = new SecureDataService();
