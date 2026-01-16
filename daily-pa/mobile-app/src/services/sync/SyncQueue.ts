/**
 * Sync Queue
 * Manages pending changes for synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncQueueItem, SyncOperation, SyncEntityType, SyncStatus } from './types';

const SYNC_QUEUE_KEY = '@daily_pa_sync_queue';

class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private initialized: boolean = false;

  /**
   * Initialize the queue from persistent storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize sync queue:', error);
      this.queue = [];
      this.initialized = true;
    }
  }

  /**
   * Persist the queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  /**
   * Add a change to the queue
   */
  async enqueue(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<SyncQueueItem> {
    await this.initialize();

    // Check if there's an existing item for this entity
    const existingIndex = this.queue.findIndex(
      (item) => item.entityType === entityType && item.entityId === entityId
    );

    const queueItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    if (existingIndex !== -1) {
      // Consolidate operations
      const existing = this.queue[existingIndex];
      
      // If existing is create and new is update, keep as create with new data
      if (existing.operation === 'create' && operation === 'update') {
        queueItem.operation = 'create';
      }
      // If existing is create and new is delete, remove from queue entirely
      else if (existing.operation === 'create' && operation === 'delete') {
        this.queue.splice(existingIndex, 1);
        await this.persist();
        return queueItem;
      }
      // If existing is update and new is delete, change to delete
      else if (existing.operation === 'update' && operation === 'delete') {
        queueItem.operation = 'delete';
      }

      // Replace existing item
      this.queue[existingIndex] = queueItem;
    } else {
      this.queue.push(queueItem);
    }

    await this.persist();
    return queueItem;
  }

  /**
   * Get all pending items
   */
  async getPending(): Promise<SyncQueueItem[]> {
    await this.initialize();
    return this.queue.filter((item) => item.status === 'pending');
  }

  /**
   * Get all items in the queue
   */
  async getAll(): Promise<SyncQueueItem[]> {
    await this.initialize();
    return [...this.queue];
  }

  /**
   * Get items by entity type
   */
  async getByEntityType(entityType: SyncEntityType): Promise<SyncQueueItem[]> {
    await this.initialize();
    return this.queue.filter((item) => item.entityType === entityType);
  }

  /**
   * Update item status
   */
  async updateStatus(id: string, status: SyncStatus, error?: string): Promise<void> {
    await this.initialize();
    
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue[index].status = status;
      if (error) {
        this.queue[index].lastError = error;
      }
      if (status === 'failed') {
        this.queue[index].retryCount += 1;
      }
      await this.persist();
    }
  }

  /**
   * Remove an item from the queue
   */
  async remove(id: string): Promise<void> {
    await this.initialize();
    this.queue = this.queue.filter((item) => item.id !== id);
    await this.persist();
  }

  /**
   * Remove all synced items
   */
  async removeSynced(): Promise<void> {
    await this.initialize();
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    await this.persist();
  }

  /**
   * Reset failed items to pending for retry
   */
  async resetFailed(): Promise<void> {
    await this.initialize();
    this.queue = this.queue.map((item) => {
      if (item.status === 'failed') {
        return { ...item, status: 'pending' as SyncStatus };
      }
      return item;
    });
    await this.persist();
  }

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    await this.initialize();
    return this.queue.filter((item) => item.status === 'pending').length;
  }

  /**
   * Clear the entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
  }

  /**
   * Check if there are items that need retry
   */
  async hasRetryableItems(maxRetries: number = 3): Promise<boolean> {
    await this.initialize();
    return this.queue.some(
      (item) => item.status === 'failed' && item.retryCount < maxRetries
    );
  }
}

export const syncQueue = new SyncQueue();
