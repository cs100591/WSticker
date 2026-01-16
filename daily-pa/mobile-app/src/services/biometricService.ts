/**
 * Biometric Authentication Service
 * Handles Face ID, Touch ID, and Fingerprint authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from './secureStorage';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  /**
   * Check if biometric hardware is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      });
    } catch (error) {
      console.error('Failed to get biometric types:', error);
      return [];
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(promptMessage?: string): Promise<BiometricResult> {
    try {
      const isAvailable = await this.isAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to continue',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Enable biometric authentication
   */
  async enable(): Promise<BiometricResult> {
    try {
      const isAvailable = await this.isAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      // Test authentication before enabling
      const authResult = await this.authenticate('Enable biometric authentication');
      
      if (authResult.success) {
        await secureStorage.setBiometricEnabled(true);
        return { success: true };
      }

      return authResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable biometric',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  async disable(): Promise<void> {
    await secureStorage.setBiometricEnabled(false);
  }

  /**
   * Check if biometric is enabled
   */
  async isEnabled(): Promise<boolean> {
    return await secureStorage.isBiometricEnabled();
  }

  /**
   * Authenticate on app launch if biometric is enabled
   */
  async authenticateOnLaunch(): Promise<BiometricResult> {
    try {
      const isEnabled = await this.isEnabled();
      
      if (!isEnabled) {
        return { success: true }; // Skip if not enabled
      }

      return await this.authenticate('Unlock Daily PA');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}

export const biometricService = new BiometricService();
