/**
 * Property-Based Tests for Conflict Resolution
 * Tests Property 27: Conflict resolution with last-write-wins
 * Tests Property 34: Conflict resolution by server timestamp
 */

import * as fc from 'fast-check';
import { conflictResolver } from '../ConflictResolver';
import type { Conflict } from '../ConflictResolver';

/**
 * Mock storage for testing conflict resolution
 */
class MockConflictStorage {
  private data: Map<string, any> = new Map();

  set(id: string, data: any): void {
    this.data.set(id, data);
  }

  get(id: string): any | undefined {
    return this.data.get(id);
  }

  applyResolution(conflict: Conflict): void {
    const resolution = conflictResolver.resolve(conflict);
    
    if (resolution.winner === 'remote') {
      this.set(conflict.entityId, conflict.remoteData);
    } else {
      this.set(conflict.entityId, conflict.localData);
    }
  }
}

describe('Property 27 & 34: Conflict Resolution with Last-Write-Wins', () => {
  describe('Timestamp-based conflict resolution', () => {
    it('should resolve conflicts by choosing the change with the latest timestamp', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }), // Offset to ensure different timestamps
          (id, localTitle, remoteTitle, baseTime, offset) => {
            fc.pre(localTitle !== remoteTitle);

            const storage = new MockConflictStorage();
            
            // Create conflict with remote being newer
            const conflict: Conflict = {
              entityType: 'todos',
              entityId: id,
              localData: {
                id,
                title: localTitle,
                updated_at: new Date(baseTime),
                synced_at: null,
              },
              remoteData: {
                id,
                title: remoteTitle,
                updated_at: new Date(baseTime + offset),
              },
              localTimestamp: new Date(baseTime),
              remoteTimestamp: new Date(baseTime + offset),
            };

            // Apply resolution
            storage.applyResolution(conflict);

            // Verify remote wins (newer timestamp)
            const result = storage.get(id);
            expect(result.title).toBe(remoteTitle);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should choose local when local timestamp is newer', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }), // Offset to ensure different timestamps
          (id, localTitle, remoteTitle, baseTime, offset) => {
            fc.pre(localTitle !== remoteTitle);

            const storage = new MockConflictStorage();
            
            // Create conflict with local being newer
            const conflict: Conflict = {
              entityType: 'todos',
              entityId: id,
              localData: {
                id,
                title: localTitle,
                updated_at: new Date(baseTime + offset),
                synced_at: null,
              },
              remoteData: {
                id,
                title: remoteTitle,
                updated_at: new Date(baseTime),
              },
              localTimestamp: new Date(baseTime + offset),
              remoteTimestamp: new Date(baseTime),
            };

            // Apply resolution
            storage.applyResolution(conflict);

            // Verify local wins (newer timestamp)
            const result = storage.get(id);
            expect(result.title).toBe(localTitle);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prefer remote when timestamps are equal', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          (id, localTitle, remoteTitle, timestamp) => {
            fc.pre(localTitle !== remoteTitle);

            const storage = new MockConflictStorage();
            
            // Create conflict with equal timestamps
            const conflict: Conflict = {
              entityType: 'todos',
              entityId: id,
              localData: {
                id,
                title: localTitle,
                updated_at: new Date(timestamp),
                synced_at: null,
              },
              remoteData: {
                id,
                title: remoteTitle,
                updated_at: new Date(timestamp),
              },
              localTimestamp: new Date(timestamp),
              remoteTimestamp: new Date(timestamp),
            };

            // Apply resolution
            storage.applyResolution(conflict);

            // Verify remote wins (consistency preference)
            const result = storage.get(id);
            expect(result.title).toBe(remoteTitle);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Conflict detection', () => {
    it('should detect conflicts when both local and remote have unsynced changes', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }),
          (id, localTitle, remoteTitle, baseTime, offset) => {
            fc.pre(localTitle !== remoteTitle);

            const localData = {
              id,
              title: localTitle,
              updated_at: new Date(baseTime),
              synced_at: null, // Not synced
            };

            const remoteData = {
              id,
              title: remoteTitle,
              updated_at: new Date(baseTime + offset),
            };

            const conflict = conflictResolver.detectConflict(
              'todos',
              id,
              localData,
              remoteData
            );

            // Should detect conflict
            expect(conflict).not.toBeNull();
            if (conflict) {
              expect(conflict.entityId).toBe(id);
              expect(conflict.localData).toBe(localData);
              expect(conflict.remoteData).toBe(remoteData);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect conflict when local data does not exist', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          (id, title, timestamp) => {
            const remoteData = {
              id,
              title,
              updated_at: new Date(timestamp),
            };

            const conflict = conflictResolver.detectConflict(
              'todos',
              id,
              null,
              remoteData
            );

            // Should not detect conflict
            expect(conflict).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not detect conflict when local is already synced', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          (id, title, timestamp) => {
            const localData = {
              id,
              title,
              updated_at: new Date(timestamp),
              synced_at: new Date(timestamp + 1000), // Synced after update
            };

            const remoteData = {
              id,
              title,
              updated_at: new Date(timestamp),
            };

            const conflict = conflictResolver.detectConflict(
              'todos',
              id,
              localData,
              remoteData
            );

            // Should not detect conflict (already synced)
            expect(conflict).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cross-entity conflict resolution', () => {
    it('should resolve conflicts for todos', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('pending', 'in_progress', 'completed'),
          fc.constantFrom('pending', 'in_progress', 'completed'),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }),
          (id, localStatus, remoteStatus, baseTime, offset) => {
            fc.pre(localStatus !== remoteStatus);

            const conflict: Conflict = {
              entityType: 'todos',
              entityId: id,
              localData: { id, status: localStatus, updated_at: new Date(baseTime) },
              remoteData: { id, status: remoteStatus, updated_at: new Date(baseTime + offset) },
              localTimestamp: new Date(baseTime),
              remoteTimestamp: new Date(baseTime + offset),
            };

            const resolution = conflictResolver.resolve(conflict);

            // Remote should win (newer)
            expect(resolution.winner).toBe('remote');
            expect(resolution.reason).toContain('newer');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should resolve conflicts for expenses', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 10000 }).map((n) => Math.fround(n / 100)),
          fc.integer({ min: 1, max: 10000 }).map((n) => Math.fround(n / 100)),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }),
          (id, localAmount, remoteAmount, baseTime, offset) => {
            fc.pre(localAmount !== remoteAmount);

            const conflict: Conflict = {
              entityType: 'expenses',
              entityId: id,
              localData: { id, amount: localAmount, updated_at: new Date(baseTime) },
              remoteData: { id, amount: remoteAmount, updated_at: new Date(baseTime + offset) },
              localTimestamp: new Date(baseTime),
              remoteTimestamp: new Date(baseTime + offset),
            };

            const resolution = conflictResolver.resolve(conflict);

            // Remote should win (newer)
            expect(resolution.winner).toBe('remote');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should resolve conflicts for calendar events', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }),
          (id, localTitle, remoteTitle, baseTime, offset) => {
            fc.pre(localTitle !== remoteTitle);

            const conflict: Conflict = {
              entityType: 'calendar_events',
              entityId: id,
              localData: { id, title: localTitle, updated_at: new Date(baseTime) },
              remoteData: { id, title: remoteTitle, updated_at: new Date(baseTime + offset) },
              localTimestamp: new Date(baseTime),
              remoteTimestamp: new Date(baseTime + offset),
            };

            const resolution = conflictResolver.resolve(conflict);

            // Remote should win (newer)
            expect(resolution.winner).toBe('remote');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Conflict resolution consistency', () => {
    it('should always produce the same resolution for the same conflict', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 1, max: 1000 }),
          (id, localTitle, remoteTitle, baseTime, offset) => {
            fc.pre(localTitle !== remoteTitle);

            const conflict: Conflict = {
              entityType: 'todos',
              entityId: id,
              localData: { id, title: localTitle, updated_at: new Date(baseTime) },
              remoteData: { id, title: remoteTitle, updated_at: new Date(baseTime + offset) },
              localTimestamp: new Date(baseTime),
              remoteTimestamp: new Date(baseTime + offset),
            };

            // Resolve multiple times
            const resolution1 = conflictResolver.resolve(conflict);
            const resolution2 = conflictResolver.resolve(conflict);
            const resolution3 = conflictResolver.resolve(conflict);

            // All resolutions should be identical
            expect(resolution1.winner).toBe(resolution2.winner);
            expect(resolution2.winner).toBe(resolution3.winner);
            expect(resolution1.reason).toBe(resolution2.reason);
            expect(resolution2.reason).toBe(resolution3.reason);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
