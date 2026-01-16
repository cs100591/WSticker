/**
 * Apple Authentication Service
 * Handles Sign in with Apple functionality (iOS only)
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';

export interface AppleAuthResult {
  success: boolean;
  error?: string;
}

class AppleAuthService {
  /**
   * Check if Apple Authentication is available
   * Only available on iOS 13+
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check Apple Auth availability:', error);
      return false;
    }
  }

  /**
   * Sign in with Apple
   * Requests user credentials and authenticates with Supabase
   */
  async signIn(): Promise<AppleAuthResult> {
    try {
      // Check if available
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Sign in with Apple is not available on this device',
        };
      }

      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract identity token
      const { identityToken, email, fullName } = credential;

      if (!identityToken) {
        return {
          success: false,
          error: 'No identity token received from Apple',
        };
      }

      // Sign in with Supabase using Apple identity token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Update user profile with Apple data if available
      if (data.session && (fullName?.givenName || fullName?.familyName)) {
        const displayName = [fullName?.givenName, fullName?.familyName]
          .filter(Boolean)
          .join(' ');

        if (displayName) {
          await supabase.auth.updateUser({
            data: {
              full_name: displayName,
            },
          });
        }
      }

      // Set session in auth store
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return { success: true };
    } catch (error: any) {
      // Handle user cancellation
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'Sign in was cancelled',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Apple sign in failed',
      };
    }
  }

  /**
   * Get credential state for a user
   * Useful for checking if user is still authorized
   */
  async getCredentialState(userID: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState | null> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return null;
      }

      return await AppleAuthentication.getCredentialStateAsync(userID);
    } catch (error) {
      console.error('Failed to get Apple credential state:', error);
      return null;
    }
  }
}

export const appleAuthService = new AppleAuthService();
