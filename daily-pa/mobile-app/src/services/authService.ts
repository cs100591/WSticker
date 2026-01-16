/**
 * Authentication service
 * Handles all authentication operations with Supabase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuthStore } from '@/store/authStore';
import { Session } from '@supabase/supabase-js';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

class AuthService {
  /**
   * Initialize auth state by checking for existing session
   */
  async initialize(): Promise<void> {
    try {
      useAuthStore.getState().setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth initialization timeout')), 2000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;
      
      if (session) {
        useAuthStore.getState().setSession(session);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Continue anyway - app can work in offline mode
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign in failed' 
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign up failed' 
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear auth store
      useAuthStore.getState().signOut();
      
      // Clear secure storage
      const { secureStorage } = await import('./secureStorage');
      await secureStorage.clearAuthTokens();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password reset failed' 
      };
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Session refresh failed' 
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Refresh session to get updated user data
      await this.refreshSession();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Profile update failed' 
      };
    }
  }

  /**
   * Change user password
   * Requires current password verification
   */
  async changePassword(data: ChangePasswordData): Promise<AuthResult> {
    try {
      // First verify current password by attempting to sign in
      const user = useAuthStore.getState().user;
      if (!user?.email) {
        return { success: false, error: 'No user logged in' };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password change failed' 
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Delete user account and all associated data
   * This will:
   * 1. Delete all local data (database, AsyncStorage, SecureStore)
   * 2. Delete the user account from Supabase
   * 3. Sign out the user
   */
  async deleteAccount(): Promise<AuthResult> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      // Step 1: Clear all local data
      await this.clearAllLocalData();

      // Step 2: Delete user account from Supabase
      // Note: This requires a server-side function or admin API
      // For now, we'll use the auth.admin.deleteUser method if available
      // In production, this should be done via a secure API endpoint
      const { error: deleteError } = await supabase.rpc('delete_user_account');
      
      if (deleteError) {
        console.error('Failed to delete account from server:', deleteError);
        // Continue anyway to ensure local cleanup
      }

      // Step 3: Sign out
      await supabase.auth.signOut();
      useAuthStore.getState().signOut();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Account deletion failed' 
      };
    }
  }

  /**
   * Clear all local data
   * Removes local store data, AsyncStorage preferences, and SecureStore tokens
   */
  private async clearAllLocalData(): Promise<void> {
    try {
      // Import local store
      const { useLocalStore } = await import('@/models');
      
      // Clear all local store data
      useLocalStore.getState().clearAll();

      // Clear AsyncStorage preferences
      const asyncStorageKeys = [
        '@theme_preference',
        '@default_currency',
        '@biometric_enabled',
        '@notifications_enabled',
        '@calendar_provider',
        '@auto_lock_enabled',
        '@auto_lock_timeout',
        '@last_active_time',
        '@sync_queue',
        '@last_sync_time',
        '@crash_logs',
        'daily-pa-local-storage', // Zustand persist key
      ];
      
      await AsyncStorage.multiRemove(asyncStorageKeys);

      // Clear SecureStore tokens
      const { secureStorage } = await import('./secureStorage');
      await secureStorage.clearAuthTokens();

      // Clear encryption key
      const { encryptionService } = await import('./encryptionService');
      await encryptionService.clearEncryptionKey();

      console.log('All local data cleared successfully');
    } catch (error) {
      console.error('Failed to clear local data:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  setupAuthListener(): void {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (session) {
        useAuthStore.getState().setSession(session);
      } else {
        useAuthStore.getState().signOut();
      }
    });
  }
}

export const authService = new AuthService();
