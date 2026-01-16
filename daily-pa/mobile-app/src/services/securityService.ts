/**
 * Security service
 * Handles security features including auto-lock, HTTPS enforcement, and secure logging
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

const AUTO_LOCK_TIMEOUT_KEY = '@auto_lock_timeout';
const LAST_ACTIVE_TIME_KEY = '@last_active_time';
const AUTO_LOCK_ENABLED_KEY = '@auto_lock_enabled';

export interface SecurityConfig {
  autoLockEnabled: boolean;
  autoLockTimeout: number; // in milliseconds
}

class SecurityService {
  private appStateSubscription: any = null;
  private lastActiveTime: number = Date.now();
  private autoLockEnabled: boolean = false;
  private autoLockTimeout: number = 5 * 60 * 1000; // 5 minutes default
  private lockCallback: (() => void) | null = null;

  /**
   * Initialize security service
   */
  async initialize(): Promise<void> {
    // Load auto-lock settings
    await this.loadAutoLockSettings();

    // Set up app state listener for auto-lock
    this.setupAppStateListener();

    // Update last active time
    this.updateLastActiveTime();
  }

  /**
   * Load auto-lock settings from storage
   */
  private async loadAutoLockSettings(): Promise<void> {
    try {
      const [enabled, timeout] = await Promise.all([
        AsyncStorage.getItem(AUTO_LOCK_ENABLED_KEY),
        AsyncStorage.getItem(AUTO_LOCK_TIMEOUT_KEY),
      ]);

      this.autoLockEnabled = enabled === 'true';
      this.autoLockTimeout = timeout ? parseInt(timeout, 10) : 5 * 60 * 1000;
    } catch (error) {
      console.error('Failed to load auto-lock settings:', error);
    }
  }

  /**
   * Enable or disable auto-lock
   */
  async setAutoLockEnabled(enabled: boolean): Promise<void> {
    this.autoLockEnabled = enabled;
    await AsyncStorage.setItem(AUTO_LOCK_ENABLED_KEY, enabled.toString());
  }

  /**
   * Set auto-lock timeout in minutes
   */
  async setAutoLockTimeout(minutes: number): Promise<void> {
    this.autoLockTimeout = minutes * 60 * 1000;
    await AsyncStorage.setItem(AUTO_LOCK_TIMEOUT_KEY, this.autoLockTimeout.toString());
  }

  /**
   * Get current auto-lock configuration
   */
  getAutoLockConfig(): SecurityConfig {
    return {
      autoLockEnabled: this.autoLockEnabled,
      autoLockTimeout: this.autoLockTimeout,
    };
  }

  /**
   * Register callback to be called when app should lock
   */
  setLockCallback(callback: () => void): void {
    this.lockCallback = callback;
  }

  /**
   * Update last active time
   */
  updateLastActiveTime(): void {
    this.lastActiveTime = Date.now();
    AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, this.lastActiveTime.toString());
  }

  /**
   * Check if app should be locked based on inactivity
   */
  private async checkAutoLock(): Promise<void> {
    if (!this.autoLockEnabled) {
      return;
    }

    try {
      const lastActiveStr = await AsyncStorage.getItem(LAST_ACTIVE_TIME_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
      const inactiveTime = Date.now() - lastActive;

      if (inactiveTime >= this.autoLockTimeout) {
        // Lock the app
        if (this.lockCallback) {
          this.lockCallback();
        }
      }
    } catch (error) {
      console.error('Failed to check auto-lock:', error);
    }
  }

  /**
   * Set up app state listener for auto-lock
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App came to foreground, check if should lock
      this.checkAutoLock();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background, save last active time
      this.updateLastActiveTime();
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  /**
   * Validate URL uses HTTPS
   */
  validateHttpsUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize sensitive data from logs
   * Removes passwords, tokens, and other sensitive information
   */
  sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'apiKey',
      'api_key',
      'secret',
      'authorization',
      'auth',
      'credential',
      'ssn',
      'social_security',
      'credit_card',
      'creditCard',
      'cvv',
      'pin',
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if key contains sensitive information
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeLogData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Safe console log that sanitizes sensitive data
   */
  safeLog(message: string, data?: any): void {
    if (data) {
      const sanitized = this.sanitizeLogData(data);
      console.log(message, sanitized);
    } else {
      console.log(message);
    }
  }

  /**
   * Safe console error that sanitizes sensitive data
   */
  safeError(message: string, error?: any): void {
    if (error) {
      const sanitized = this.sanitizeLogData(error);
      console.error(message, sanitized);
    } else {
      console.error(message);
    }
  }
}

export const securityService = new SecurityService();
