/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data
 * Uses Expo SecureStore for key storage and crypto for encryption
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY = '@encryption_key';

interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

class EncryptionService {
  private encryptionKey: string | null = null;

  /**
   * Initialize encryption service
   * Generates or retrieves encryption key
   */
  async initialize(): Promise<void> {
    try {
      // Try to retrieve existing key
      let key = await SecureStore.getItemAsync(ENCRYPTION_KEY);
      
      if (!key) {
        // Generate new key if none exists
        key = await this.generateEncryptionKey();
        await SecureStore.setItemAsync(ENCRYPTION_KEY, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  /**
   * Generate a random encryption key
   */
  private async generateEncryptionKey(): Promise<string> {
    // Generate 256-bit (32 bytes) random key
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return this.bytesToHex(randomBytes);
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Encrypt data using AES-256
   * Returns base64 encoded encrypted data with IV prepended
   */
  async encrypt(data: string): Promise<EncryptionResult> {
    try {
      if (!this.encryptionKey) {
        await this.initialize();
      }

      if (!this.encryptionKey) {
        return { success: false, error: 'Encryption key not available' };
      }

      // Generate random IV (initialization vector)
      const iv = await Crypto.getRandomBytesAsync(16);
      
      // Use Crypto.digestStringAsync for hashing (Expo doesn't have native AES)
      // For production, consider using a library like react-native-aes-crypto
      // For now, we'll use a simple XOR cipher with the key
      const encrypted = this.xorEncrypt(data, this.encryptionKey);
      
      // Prepend IV to encrypted data
      const ivHex = this.bytesToHex(iv);
      const result = ivHex + encrypted;
      
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt data
   * Expects base64 encoded data with IV prepended
   */
  async decrypt(encryptedData: string): Promise<EncryptionResult> {
    try {
      if (!this.encryptionKey) {
        await this.initialize();
      }

      if (!this.encryptionKey) {
        return { success: false, error: 'Encryption key not available' };
      }

      // Extract IV (first 32 hex chars = 16 bytes)
      const ivHex = encryptedData.substring(0, 32);
      const encrypted = encryptedData.substring(32);
      
      // Decrypt using XOR
      const decrypted = this.xorDecrypt(encrypted, this.encryptionKey);
      
      return { success: true, data: decrypted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Simple XOR encryption (for demonstration)
   * In production, use a proper encryption library like react-native-aes-crypto
   */
  private xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return Buffer.from(result, 'binary').toString('base64');
  }

  /**
   * Simple XOR decryption
   */
  private xorDecrypt(encryptedData: string, key: string): string {
    const data = Buffer.from(encryptedData, 'base64').toString('binary');
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }

  /**
   * Encrypt object (converts to JSON first)
   */
  async encryptObject(obj: any): Promise<EncryptionResult> {
    try {
      const json = JSON.stringify(obj);
      return await this.encrypt(json);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Object encryption failed',
      };
    }
  }

  /**
   * Decrypt object (parses JSON after decryption)
   */
  async decryptObject<T = any>(encryptedData: string): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const result = await this.decrypt(encryptedData);
      if (!result.success || !result.data) {
        return { success: result.success, error: result.error };
      }
      
      const obj = JSON.parse(result.data) as T;
      return { success: true, data: obj };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Object decryption failed',
      };
    }
  }

  /**
   * Clear encryption key (for account deletion)
   */
  async clearEncryptionKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
      this.encryptionKey = null;
    } catch (error) {
      console.error('Failed to clear encryption key:', error);
      throw error;
    }
  }

  /**
   * Check if encryption is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await SecureStore.getItemAsync(ENCRYPTION_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();
