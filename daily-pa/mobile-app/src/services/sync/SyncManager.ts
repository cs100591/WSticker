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
import { RealtimeChannel } from '@supabase/supabase-js';

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
  private realtimeChannel: RealtimeChannel | null = null;

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

    // Setup Realtime Subscription
    this.setupRealtimeSubscription();

    this.initialized = true;
    this.notifyListeners();

    // Sanitize IDs (Migration for bad IDs)
    await this.sanitizeIds();

    // Trigger sync if online
    if (networkMonitor.isOnline()) {
      this.sync();
    }
  }

  /**
   * Handle first sync after login
   * Inspects remote data to decide whether to push local data or wipe and pull
   */
  async handleFirstSync(userId: string): Promise<void> {
    console.log('Handling first sync for user:', userId);

    // 1. Sanitize IDs first to ensure push is possible
    await this.sanitizeIds();

    // 2. Check remote count (using todos as a proxy for "has data")
    const { count, error } = await supabase
      .from('todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to check remote data:', error);
      // Fallback: Safe Default -> Pull (assume existing) or Just Sync?
      // Let's just standard sync
      await this.sync(true);
      return;
    }

    // 3. Logic
    // 3. Logic
    if (count !== null && count > 0) {
      console.log('Remote data found (count: ' + count + '). Wiping local and pulling.');
      // Existing Account: Wipe Local -> Pull Remote
      const { useLocalStore } = await import('@/store/localStore');
      useLocalStore.getState().clearAll();

      // Reset sync state to ensure full pull
      this.state.lastSyncTime = null;
      await AsyncStorage.removeItem(LAST_SYNC_KEY);

      // Force a full pull
      await this.pullChanges(null);
    } else {
      console.log('No remote data. Pushing local data.');
      // New Account (or empty): Push Local
      await this.pushChanges(true);
    }
  }

  /**
   * Sanitize IDs to ensure they are valid UUIDs
   * Replaces any non-UUID IDs with valid ones to prevent sync errors
   */
  private async sanitizeIds(): Promise<void> {
    const { useLocalStore } = await import('@/store/localStore');
    const store = useLocalStore.getState();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let hasChanges = false;
    let fixCount = 0;

    // Helper to fix ID and update references
    const fixId = (oldId: string): string => {
      // If it's already a valid UUID, keep it
      if (uuidRegex.test(oldId)) return oldId;

      // Generate new UUID
      // We need Crypto here. Since we can't easily import it inside this method if not top-level, 
      // rely on the fact that localStore generates valid ones now, or perform a manual fix.
      // Ideally we import Crypto properly.
      // But we can validly generate a v4 UUID with JS if needed, or stick to import.
      const { randomUUID } = require('expo-crypto');
      return randomUUID();
    };

    // 1. Fix Todos
    const todos = store.getTodos();
    const idMap = new Map<string, string>(); // oldId -> newId

    const fixedTodos = todos.map(todo => {
      if (!uuidRegex.test(todo.id)) {
        const newId = fixId(todo.id);
        idMap.set(todo.id, newId);
        hasChanges = true;
        fixCount++;
        return { ...todo, id: newId, updatedAt: new Date().toISOString() }; // Mark updated to force sync
      }
      return todo;
    });

    if (hasChanges) {
      store.setTodos(fixedTodos);
    }

    // 2. Fix Expenses
    const expenses = store.getExpenses();
    const fixedExpenses = expenses.map(expense => {
      if (!uuidRegex.test(expense.id)) {
        const { randomUUID } = require('expo-crypto');
        const newId = randomUUID();
        hasChanges = true;
        fixCount++;
        return { ...expense, id: newId, updatedAt: new Date().toISOString() };
      }
      return expense;
    });

    if (hasChanges) {
      store.setExpenses(fixedExpenses);
    }

    // 3. Fix Calendar Events
    const events = store.getCalendarEvents();
    const fixedEvents = events.map(event => {
      let changed = false;
      let newId = event.id;
      let newTodoId = event.todoId;

      // Fix Event ID
      if (!uuidRegex.test(event.id)) {
        const { randomUUID } = require('expo-crypto');
        newId = randomUUID();
        changed = true;
        fixCount++;
      }

      // Fix Todo ID reference
      if (event.todoId && idMap.has(event.todoId)) {
        newTodoId = idMap.get(event.todoId);
        changed = true;
      }

      if (changed) {
        hasChanges = true;
        return { ...event, id: newId, todoId: newTodoId, updatedAt: new Date().toISOString() };
      }
      return event;
    });

    if (hasChanges) {
      store.setCalendarEvents(fixedEvents);
      console.log(`Sanitized ${fixCount} items with invalid IDs.`);
      // If we changed IDs, the sync queue is likely invalid for those items.
      // It's safest to clear the queue to avoid syncing errors for old IDs, 
      // and let the next sync pick up the "updatedAt" changes.
      await syncQueue.clear();
    }
  }

  /**
   * Setup Supabase Realtime subscription
   */
  private setupRealtimeSubscription(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    // Subscribe to changes on core tables
    this.realtimeChannel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => this.handleRealtimeEvent(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => this.handleRealtimeEvent(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        (payload) => this.handleRealtimeEvent(payload)
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
  }

  // Debounce sync trigger
  private syncDebounceTimer: NodeJS.Timeout | null = null;

  private handleRealtimeEvent(payload: any): void {
    console.log('Realtime change received:', payload.table, payload.eventType);

    // Check if the change is from this device (optional optimization, but hard without unique client ID in DB rows)
    // For now, simplistically trigger a pull/sync.

    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // Debounce sync to avoid spamming on batch updates
    this.syncDebounceTimer = setTimeout(() => {
      if (networkMonitor.isOnline() && !this.syncInProgress) {
        console.log('Triggering live sync...');
        this.sync();
      }
    }, 500); // Wait 500ms to capture bursts
  }

  /**
   * Handle network status changes
   */
  private async handleNetworkChange(status: NetworkStatus): Promise<void> {
    const wasOffline = !this.state.networkStatus.isConnected;
    this.state.networkStatus = status;
    this.notifyListeners();

    // If we just came online
    if (wasOffline && status.isConnected && status.isInternetReachable !== false) {
      // Re-establish realtime connection if needed
      if (!this.realtimeChannel) {
        this.setupRealtimeSubscription();
      }

      this.sync();
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
  async sync(forceFullSync: boolean = false): Promise<SyncResult> {
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
      // Push local changes (forced full sync if requested)
      const pushResult = await this.pushChanges(forceFullSync);
      result.pushed = pushResult.pushed;
      result.errors.push(...pushResult.errors);

      // Pull remote changes
      // If forceFullSync is true, ignore last sync time (pass null)
      const pullTime = forceFullSync ? null : this.state.lastSyncTime;
      const pullResult = await this.pullChanges(pullTime);
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
  private async pushChanges(forceFullSync: boolean = false): Promise<{ pushed: number; errors: SyncError[] }> {
    try {
      // Use PushSync service to detect and push changes
      const result = await pushSync.pushChanges(this.state.lastSyncTime, forceFullSync);
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
  private async pullChanges(syncTime: Date | null = this.state.lastSyncTime): Promise<{ pulled: number; conflicts: number; errors: SyncError[] }> {
    const result = await pullSync.pullChanges(syncTime);

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
  async forceSync(forceFullSync: boolean = false): Promise<SyncResult> {
    // Reset any failed items
    await syncQueue.resetFailed();
    return this.sync(forceFullSync);
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

    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();
    this.listeners.clear();
    this.initialized = false;
  }
  /**
   * Reset sync state (e.g. on user change)
   */
  async reset(): Promise<void> {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    this.state.lastSyncTime = null;
    this.state.errors = [];
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts.clear();

    // Clear last sync time from storage
    await AsyncStorage.removeItem(LAST_SYNC_KEY);

    // Reset queue state
    this.state.pendingChanges = await syncQueue.getPendingCount();

    this.notifyListeners();

    // Trigger fresh full sync
    if (this.initialized && networkMonitor.isOnline()) {
      this.setupRealtimeSubscription();
      this.sync();
    }
  }
}

export const syncManager = new SyncManager();
