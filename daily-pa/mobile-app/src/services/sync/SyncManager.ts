/**
 * Sync Manager
 * Orchestrates data synchronization between local storage and Supabase
 */

import { supabase } from '../supabase';
import { syncQueue } from './SyncQueue';
import { networkMonitor } from './NetworkMonitor';
import { pushSync } from './PushSync';
import { pullSync } from './PullSync';
import {
  SyncResult,
  SyncState,
  SyncError,
  SyncEntityType,
  SyncQueueItem,
  NetworkStatus,
  DEFAULT_SYNC_STATE,
} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SYNC_KEY = '@daily_pa_last_sync';
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 second

type SyncStateListener = (state: SyncState) => void;

class SyncManager {
  private state: SyncState = { ...DEFAULT_SYNC_STATE };
  private listeners: Set<SyncStateListener> = new Set();
  private syncInProgress: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private initialized: boolean = false;
  private networkUnsubscribe: (() => void) | null = null;

  /**
   * Initialize the sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize dependencies
    await networkMonitor.initialize();
    await syncQueue.initialize();

    // Load last sync time
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (lastSyncStr) {
      this.state.lastSyncTime = new Date(lastSyncStr);
    }

    // Get initial network status
    this.state.networkStatus = networkMonitor.getStatus();

    // Get pending changes count
    this.state.pendingChanges = await syncQueue.getPendingCount();

    // Listen for network changes
    this.networkUnsubscribe = networkMonitor.addListener((status) => {
      this.handleNetworkChange(status);
    });

    this.initialized = true;
    this.notifyListeners();

    // Trigger sync if online and have pending changes
    if (networkMonitor.isOnline() && this.state.pendingChanges > 0) {
      this.sync();
    }
  }

  /**
   * Handle network status changes
   */
  private async handleNetworkChange(status: NetworkStatus): Promise<void> {
    const wasOffline = !this.state.networkStatus.isConnected;
    this.state.networkStatus = status;
    this.notifyListeners();

    // If we just came online and have pending changes, trigger sync
    if (wasOffline && status.isConnected && status.isInternetReachable !== false) {
      const pendingCount = await syncQueue.getPendingCount();
      if (pendingCount > 0) {
        this.sync();
      }
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in sync state listener:', error);
      }
    });
  }

  /**
   * Add a listener for sync state changes
   */
  addListener(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Queue a change for sync
   */
  async queueChange(
    entityType: SyncEntityType,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>
  ): Promise<void> {
    await syncQueue.enqueue(entityType, entityId, operation, data);
    this.state.pendingChanges = await syncQueue.getPendingCount();
    this.notifyListeners();

    // If online, trigger immediate sync
    if (networkMonitor.isOnline()) {
      this.sync();
    }
  }

  /**
   * Perform full sync
   */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: [{ entityType: 'todos', entityId: '', operation: 'create', message: 'Sync already in progress' }],
        timestamp: new Date(),
      };
    }

    if (!networkMonitor.isOnline()) {
      return {
        success: false,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors: [{ entityType: 'todos', entityId: '', operation: 'create', message: 'No network connection' }],
        timestamp: new Date(),
      };
    }

    this.syncInProgress = true;
    this.state.isSyncing = true;
    this.state.errors = [];
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
      timestamp: new Date(),
    };

    try {
      // Push local changes
      const pushResult = await this.pushChanges();
      result.pushed = pushResult.pushed;
      result.errors.push(...pushResult.errors);

      // Pull remote changes
      const pullResult = await this.pullChanges();
      result.pulled = pullResult.pulled;
      result.conflicts = pullResult.conflicts;
      result.errors.push(...pullResult.errors);

      // Update last sync time
      this.state.lastSyncTime = new Date();
      await AsyncStorage.setItem(LAST_SYNC_KEY, this.state.lastSyncTime.toISOString());

      // Clean up synced items
      await syncQueue.removeSynced();
      this.state.pendingChanges = await syncQueue.getPendingCount();

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push({
        entityType: 'todos',
        entityId: '',
        operation: 'create',
        message: error instanceof Error ? error.message : 'Unknown sync error',
      });
    } finally {
      this.syncInProgress = false;
      this.state.isSyncing = false;
      this.state.errors = result.errors;
      this.notifyListeners();
    }

    // Schedule retry if there are failed items
    if (await syncQueue.hasRetryableItems(MAX_RETRIES)) {
      this.scheduleRetry();
    }

    return result;
  }

  /**
   * Push local changes to remote
   */
  private async pushChanges(): Promise<{ pushed: number; errors: SyncError[] }> {
    try {
      // Use PushSync service to detect and push changes
      const result = await pushSync.pushChanges(this.state.lastSyncTime);
      return result;
    } catch (error) {
      return {
        pushed: 0,
        errors: [
          {
            entityType: 'todos',
            entityId: '',
            operation: 'create',
            message: error instanceof Error ? error.message : 'Push sync failed',
          },
        ],
      };
    }
  }

  /**
   * Pull remote changes
   */
  private async pullChanges(): Promise<{ pulled: number; conflicts: number; errors: SyncError[] }> {
    const result = await pullSync.pullChanges(this.state.lastSyncTime);
    
    return {
      pulled: result.pulled,
      conflicts: result.conflicts,
      errors: result.errors,
    };
  }

  /**
   * Schedule a retry with exponential backoff
   */
  private scheduleRetry(): void {
    const pending = this.retryTimeouts.size;
    const delay = BASE_RETRY_DELAY * Math.pow(2, Math.min(pending, 5));

    const timeoutId = setTimeout(async () => {
      this.retryTimeouts.delete('retry');
      await syncQueue.resetFailed();
      this.sync();
    }, delay);

    this.retryTimeouts.set('retry', timeoutId);
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.state.lastSyncTime;
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    return await syncQueue.getPendingCount();
  }

  /**
   * Force sync (manual trigger)
   */
  async forceSync(): Promise<SyncResult> {
    // Reset any failed items
    await syncQueue.resetFailed();
    return this.sync();
  }

  /**
   * Check if sync is in progress
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return networkMonitor.isOnline();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.listeners.clear();
    this.initialized = false;
  }
}

export const syncManager = new SyncManager();
