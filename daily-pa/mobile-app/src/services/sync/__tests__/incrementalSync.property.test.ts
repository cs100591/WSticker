/**
 * Property-Based Tests for Incremental Sync
 * Feature: mobile-apps
 * Properties: 32, 35
 * Validates: Requirements 9.3, 9.7
 */

import * as fc from 'fast-check';

// Mock types for testing
interface MockDataItem {
  id: string;
  entityType: 'todos' | 'expenses' | 'calendar_events';
  data: Record<string, unknown>;
  updatedAt: Date;
  syncedAt: Date | null;
}

interface MockSyncResult {
  itemsSynced: number;
  lastSyncTime: Date;
  itemsTransferred: string[]; // IDs of items that were transferred
}

/**
 * Mock Sync Engine with incremental sync
 */
class MockIncrementalSyncEngine {
  private localData: Map<string, MockDataItem> = new Map();
  private remoteData: Map<string, MockDataItem> = new Map();
  private lastSyncTime: Date | null = null;
  private syncHistory: Array<{ timestamp: Date; itemCount: number }> = [];

  /**
   * Add item to local storage
   */
  addLocalItem(item: Omit<MockDataItem, 'syncedAt'>): void {
    this.localData.set(item.id, {
      ...item,
      syncedAt: null,
    });
  }

  /**
   * Add item to remote storage
   */
  addRemoteItem(item: MockDataItem): void {
    this.remoteData.set(item.id, item);
  }

  /**
   * Update local item
   */
  updateLocalItem(id: string, data: Record<string, unknown>, updatedAt: Date): void {
    const item = this.localData.get(id);
    if (item) {
      item.data = data;
      item.updatedAt = updatedAt;
      item.syncedAt = null; // Mark as unsynced
    }
  }

  /**
   * Perform incremental sync
   * Only syncs items changed since last sync
   */
  async sync(): Promise<MockSyncResult> {
    const syncTime = new Date();
    const itemsTransferred: string[] = [];

    // Determine which items need to be synced
    const itemsToSync = Array.from(this.localData.values()).filter((item) => {
      // Item needs sync if:
      // 1. Never synced before (syncedAt is null)
      // 2. Updated after last sync (updatedAt > lastSyncTime)
      if (!item.syncedAt) return true;
      if (!this.lastSyncTime) return true;
      return item.updatedAt > this.lastSyncTime;
    });

    // Transfer items to remote
    for (const item of itemsToSync) {
      this.remoteData.set(item.id, {
        ...item,
        syncedAt: syncTime,
      });
      
      // Update local item's syncedAt
      const localItem = this.localData.get(item.id);
      if (localItem) {
        localItem.syncedAt = syncTime;
      }

      itemsTransferred.push(item.id);
    }

    // Update last sync time
    this.lastSyncTime = syncTime;

    // Record sync in history
    this.syncHistory.push({
      timestamp: syncTime,
      itemCount: itemsToSync.length,
    });

    return {
      itemsSynced: itemsToSync.length,
      lastSyncTime: syncTime,
      itemsTransferred,
    };
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Get sync history
   */
  getSyncHistory(): Array<{ timestamp: Date; itemCount: number }> {
    return this.syncHistory;
  }

  /**
   * Get all local items
   */
  getLocalItems(): MockDataItem[] {
    return Array.from(this.localData.values());
  }

  /**
   * Get all remote items
   */
  getRemoteItems(): MockDataItem[] {
    return Array.from(this.remoteData.values());
  }

  /**
   * Get items that need sync
   */
  getUnsyncedItems(): MockDataItem[] {
    return Array.from(this.localData.values()).filter((item) => {
      if (!item.syncedAt) return true;
      if (!this.lastSyncTime) return true;
      return item.updatedAt > this.lastSyncTime;
    });
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.localData.clear();
    this.remoteData.clear();
    this.lastSyncTime = null;
    this.syncHistory = [];
  }
}

describe('Incremental Sync Property Tests', () => {
  /**
   * Property 32: Incremental sync
   * For any sync operation, only changes since last sync should be transferred
   */
  describe('Property 32: Only sync changes since last sync', () => {
    it('should only transfer items changed since last sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 2000000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (items) => {
            const engine = new MockIncrementalSyncEngine();

            // Add all items to local storage
            items.forEach((item) => engine.addLocalItem(item));

            // First sync - should sync all items
            const firstSync = await engine.sync();
            expect(firstSync.itemsSynced).toBe(items.length);
            expect(firstSync.itemsTransferred.length).toBe(items.length);

            // Second sync without changes - should sync nothing
            const secondSync = await engine.sync();
            expect(secondSync.itemsSynced).toBe(0);
            expect(secondSync.itemsTransferred.length).toBe(0);

            // All items should be synced
            const unsyncedItems = engine.getUnsyncedItems();
            expect(unsyncedItems.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sync only updated items after initial sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 1500000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 5 }), // indices to update
          async (items, indicesToUpdate) => {
            const engine = new MockIncrementalSyncEngine();

            // Add all items
            items.forEach((item) => engine.addLocalItem(item));

            // First sync
            await engine.sync();

            // Wait a bit and update some items
            const updateTime = new Date(Date.now() + 1000);
            const uniqueIndices = [...new Set(indicesToUpdate)].filter((i) => i < items.length);
            
            uniqueIndices.forEach((index) => {
              const item = items[index];
              engine.updateLocalItem(item.id, { ...item.data, updated: true }, updateTime);
            });

            // Second sync - should only sync updated items
            const secondSync = await engine.sync();
            expect(secondSync.itemsSynced).toBe(uniqueIndices.length);

            // Verify only updated items were transferred
            uniqueIndices.forEach((index) => {
              expect(secondSync.itemsTransferred).toContain(items[index].id);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not transfer items that were already synced and unchanged', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 1500000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (items) => {
            const engine = new MockIncrementalSyncEngine();

            // Add items
            items.forEach((item) => engine.addLocalItem(item));

            // First sync
            const firstSync = await engine.sync();
            const firstSyncIds = new Set(firstSync.itemsTransferred);

            // Second sync without any changes
            const secondSync = await engine.sync();

            // No items should be transferred in second sync
            expect(secondSync.itemsSynced).toBe(0);
            expect(secondSync.itemsTransferred.length).toBe(0);

            // Verify no overlap between first and second sync
            secondSync.itemsTransferred.forEach((id) => {
              expect(firstSyncIds.has(id)).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple sync cycles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 1500000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 5, maxLength: 15 }
          ),
          fc.integer({ min: 2, max: 5 }), // number of sync cycles
          async (items, syncCycles) => {
            const engine = new MockIncrementalSyncEngine();

            // Add items
            items.forEach((item) => engine.addLocalItem(item));

            let totalItemsSynced = 0;

            // Perform multiple sync cycles
            for (let i = 0; i < syncCycles; i++) {
              const result = await engine.sync();
              totalItemsSynced += result.itemsSynced;

              // After first sync, subsequent syncs should transfer nothing
              if (i > 0) {
                expect(result.itemsSynced).toBe(0);
              }
            }

            // Total synced should equal items count (only first sync transfers)
            expect(totalItemsSynced).toBe(items.length);

            // Verify sync history
            const history = engine.getSyncHistory();
            expect(history.length).toBe(syncCycles);
            expect(history[0].itemCount).toBe(items.length);
            
            // All subsequent syncs should have 0 items
            for (let i = 1; i < syncCycles; i++) {
              expect(history[i].itemCount).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 35: Sync timestamp update
   * For any completed sync, the last sync timestamp should be updated
   */
  describe('Property 35: Update sync timestamp on completion', () => {
    it('should update last sync time after every sync', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 2000000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (items) => {
            const engine = new MockIncrementalSyncEngine();

            // Initially no last sync time
            expect(engine.getLastSyncTime()).toBeNull();

            // Add items
            items.forEach((item) => engine.addLocalItem(item));

            // Perform sync
            const beforeSync = new Date();
            const result = await engine.sync();
            const afterSync = new Date();

            // Last sync time should be updated
            const lastSyncTime = engine.getLastSyncTime();
            expect(lastSyncTime).not.toBeNull();
            expect(lastSyncTime).toEqual(result.lastSyncTime);

            // Timestamp should be between before and after
            expect(lastSyncTime!.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
            expect(lastSyncTime!.getTime()).toBeLessThanOrEqual(afterSync.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update timestamp even when no items are synced', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 2000000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (items) => {
            const engine = new MockIncrementalSyncEngine();

            // Add and sync items
            items.forEach((item) => engine.addLocalItem(item));
            await engine.sync();

            const firstSyncTime = engine.getLastSyncTime();
            expect(firstSyncTime).not.toBeNull();

            // Wait a bit
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Sync again with no changes
            const secondResult = await engine.sync();
            const secondSyncTime = engine.getLastSyncTime();

            // Timestamp should be updated even though no items were synced
            expect(secondResult.itemsSynced).toBe(0);
            expect(secondSyncTime).not.toBeNull();
            expect(secondSyncTime!.getTime()).toBeGreaterThan(firstSyncTime!.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have monotonically increasing sync timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 2000000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 2, max: 5 }), // number of syncs
          async (items, numSyncs) => {
            const engine = new MockIncrementalSyncEngine();

            // Add items
            items.forEach((item) => engine.addLocalItem(item));

            const timestamps: Date[] = [];

            // Perform multiple syncs
            for (let i = 0; i < numSyncs; i++) {
              await new Promise((resolve) => setTimeout(resolve, 5)); // Small delay
              const result = await engine.sync();
              timestamps.push(result.lastSyncTime);
            }

            // Verify timestamps are monotonically increasing
            for (let i = 1; i < timestamps.length; i++) {
              expect(timestamps[i].getTime()).toBeGreaterThan(timestamps[i - 1].getTime());
            }

            // Last sync time should match the last timestamp
            const lastSyncTime = engine.getLastSyncTime();
            expect(lastSyncTime).toEqual(timestamps[timestamps.length - 1]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect sync timestamp in sync result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              entityType: fc.constantFrom('todos', 'expenses', 'calendar_events'),
              data: fc.dictionary(fc.string(), fc.anything()),
              updatedAt: fc.integer({ min: 1000000, max: 2000000 }).map((ts) => new Date(ts)),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (items) => {
            const engine = new MockIncrementalSyncEngine();

            // Add items
            items.forEach((item) => engine.addLocalItem(item));

            // Perform sync
            const result = await engine.sync();

            // Result should contain the sync timestamp
            expect(result.lastSyncTime).toBeDefined();
            expect(result.lastSyncTime).toBeInstanceOf(Date);

            // Timestamp in result should match stored last sync time
            const storedTime = engine.getLastSyncTime();
            expect(result.lastSyncTime).toEqual(storedTime);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
