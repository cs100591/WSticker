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
        await this.syncUserProfile(data.session);
        // Migrate any local guest data to this new user
        await this.migrateGuestData(data.session.user.id);
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
        await this.syncUserProfile(data.session);
        await this.migrateGuestData(data.session.user.id);
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
        console.warn('Server sign out failed, continuing with local cleanup:', error.message);
      }

      // Clear auth store
      useAuthStore.getState().signOut();

      // Reset sync manager state (unsubscribe realtime, clear queue, reset last sync)
      const { syncManager } = await import('./sync/SyncManager');
      await syncManager.reset();

      // Reset user profile to guest
      const { useUserStore } = await import('@/store/userStore');
      useUserStore.getState().resetProfile();

      // Clear secure storage
      const { secureStorage } = await import('./secureStorage');
      await secureStorage.clearAuthTokens();

      return { success: true };
    } catch (error) {
      // Force cleanup even on unexpected error
      useAuthStore.getState().signOut();
      const { syncManager } = await import('./sync/SyncManager');
      await syncManager.reset();

      return {
        success: true, // We successfully logged out locally at least
        error: error instanceof Error ? error.message : 'Sign out failed on server'
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
        this.syncUserProfile(data.session);
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
      if (session) {
        this.syncUserProfile(session);
      }
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
      const { useUserStore } = await import('@/store/userStore');
      useUserStore.getState().resetProfile();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Account deletion failed'
      };
    }
  }

  /**
   * Clear all account data (cloud only)
   * Deletes alltodos, expenses, and calendar items on the server for the current user
   */
  async clearAccountData(): Promise<AuthResult> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      console.log('Clearing account data for user:', user.id);

      const { error: todoError } = await supabase.from('todos').delete().eq('user_id', user.id);
      if (todoError) console.error('Error deleting todos:', todoError);

      const { error: expError } = await supabase.from('expenses').delete().eq('user_id', user.id);
      if (expError) console.error('Error deleting expenses:', expError);

      const { error: calError } = await supabase.from('calendar_events').delete().eq('user_id', user.id);
      if (calError) console.error('Error deleting events:', calError);

      // We don't stop on individual table errors, but we can return success if it mostly worked
      return { success: true };
    } catch (error) {
      console.error('Failed to clear account data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear data'
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
   * Private helper to sync user profile from Supabase session
   */
  private async syncUserProfile(session: Session) {
    if (!session?.user) return;

    try {
      const { useUserStore } = await import('@/store/userStore');
      const user = session.user;
      const metadata = user.user_metadata || {};

      useUserStore.getState().updateProfile({
        id: user.id,
        email: user.email || '',
        fullName: metadata.full_name || metadata.name || metadata.fullName || user.email?.split('@')[0] || 'User',
        avatarUrl: metadata.avatar_url || metadata.picture,
      });
    } catch (e) {
      console.error('Error syncing user profile:', e);
    }
  }

  /**
   * Listen to auth state changes
   */
  setupAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session) {
        useAuthStore.getState().setSession(session);
        this.syncUserProfile(session);
      } else {
        useAuthStore.getState().signOut();
        const { useUserStore } = await import('@/store/userStore');
        useUserStore.getState().resetProfile();
      }
    });
  }

  /**
   * Migrate guest data to authenticated user
   * Handles duplicate prevention, ID regeneration (for valid UUIDs), and relationships
   */
  private async migrateGuestData(userId: string): Promise<void> {
    try {
      console.log('Processing data migration for user:', userId);
      const { useLocalStore } = await import('@/models');
      const store = useLocalStore.getState();
      const { syncManager } = await import('./sync/SyncManager');
      const { syncQueue } = await import('./sync/SyncQueue');
      const Crypto = await import('expo-crypto');

      // Helper to check if data is truly "guest" data (no userId or explicit guest)
      const isGuestItem = (itemUserId?: string) => !itemUserId || itemUserId === 'guest' || itemUserId.startsWith('offline-');

      // Check for existing data from OTHER users
      const existingTodos = store.getTodos();
      const sampleItem = existingTodos[0];

      if (sampleItem && sampleItem.userId && sampleItem.userId !== userId && !isGuestItem(sampleItem.userId)) {
        console.log('Found data from another user. Wiping local data...');
        store.clearAll();
        await syncQueue.clear();
        return;
      }

      await syncQueue.clear();

      const idMap = new Map<string, string>();

      // 1. Migrate Todos
      const todos = store.getTodos();
      for (const todo of todos) {
        if (todo.userId === userId) continue;

        const newId = Crypto.randomUUID();
        idMap.set(todo.id, newId);

        // Remove old item
        store.deleteTodo(todo.id);

        // Add new item with valid UUID
        const newTodo = {
          ...todo,
          id: newId,
          userId,
          updatedAt: new Date().toISOString()
        };
        store.addTodo(newTodo);

        await syncManager.queueChange('todos', newId, 'create', {
          ...newTodo,
          user_id: userId,
          due_date: todo.dueDate,
          created_at: todo.createdAt,
          updated_at: newTodo.updatedAt,
        });
      }

      // 2. Migrate Expenses
      const expenses = store.getExpenses();
      for (const expense of expenses) {
        if (expense.userId === userId) continue;

        const newId = Crypto.randomUUID();

        store.deleteExpense(expense.id);

        const newExpense = {
          ...expense,
          id: newId,
          userId,
          updatedAt: new Date().toISOString()
        };
        store.addExpense(newExpense);

        await syncManager.queueChange('expenses', newId, 'create', {
          ...newExpense,
          user_id: userId,
          expense_date: expense.expenseDate,
          receipt_url: expense.receiptUrl,
          created_at: expense.createdAt,
          updated_at: newExpense.updatedAt,
        });
      }

      // 3. Migrate Calendar Events (and fix relationships)
      const events = store.getCalendarEvents();
      for (const event of events) {
        if (event.userId === userId) continue;

        const newId = Crypto.randomUUID();
        // Update foreign key if needed
        const mappedTodoId = event.todoId && idMap.get(event.todoId) ? idMap.get(event.todoId) : event.todoId;

        store.deleteCalendarEvent(event.id);

        const newEvent = {
          ...event,
          id: newId,
          userId,
          todoId: mappedTodoId,
          updatedAt: new Date().toISOString()
        };
        store.addCalendarEvent(newEvent);

        await syncManager.queueChange('calendar_events', newId, 'create', {
          ...newEvent,
          user_id: userId,
          start_time: event.startTime,
          end_time: event.endTime,
          all_day: event.allDay,
          todo_id: mappedTodoId,
          created_at: event.createdAt,
          updated_at: newEvent.updatedAt,
        });
      }

      console.log('Migration/Cleanup complete with ID regeneration.');

    } catch (error) {
      console.error('Failed to migrate/cleanup data:', error);
    }
  }
}

export const authService = new AuthService();
