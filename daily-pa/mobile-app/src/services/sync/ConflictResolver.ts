/**
 * Conflict Resolver
 * Handles sync conflicts using last-write-wins strategy based on server timestamps
 */

import { Alert } from 'react-native';
import { SyncEntityType } from './types';

export interface ConflictResolution {
  winner: 'local' | 'remote';
  reason: string;
}

export interface Conflict {
  entityType: SyncEntityType;
  entityId: string;
  localData: any;
  remoteData: any;
  localTimestamp: Date;
  remoteTimestamp: Date;
}

interface ConflictNotificationOptions {
  showNotification?: boolean;
  onConflict?: (conflict: Conflict, resolution: ConflictResolution) => void;
}

class ConflictResolver {
  private conflictCount = 0;
  private notificationOptions: ConflictNotificationOptions = {
    showNotification: true,
  };

  /**
   * Configure conflict notification options
   */
  configure(options: ConflictNotificationOptions): void {
    this.notificationOptions = { ...this.notificationOptions, ...options };
  }

  /**
   * Resolve conflict using last-write-wins strategy
   * The change with the latest server timestamp wins
   */
  resolve(conflict: Conflict): ConflictResolution {
    const localTime = conflict.localTimestamp.getTime();
    const remoteTime = conflict.remoteTimestamp.getTime();

    // Log conflict for debugging
    this.logConflict(conflict);

    // Last-write-wins: compare server timestamps
    let resolution: ConflictResolution;
    
    if (remoteTime > localTime) {
      resolution = {
        winner: 'remote',
        reason: `Remote change is newer (${conflict.remoteTimestamp.toISOString()} > ${conflict.localTimestamp.toISOString()})`,
      };
    } else if (localTime > remoteTime) {
      resolution = {
        winner: 'local',
        reason: `Local change is newer (${conflict.localTimestamp.toISOString()} > ${conflict.remoteTimestamp.toISOString()})`,
      };
    } else {
      // Timestamps are equal - prefer remote to ensure consistency across devices
      resolution = {
        winner: 'remote',
        reason: 'Timestamps equal - preferring remote for consistency',
      };
    }

    // Notify about conflict
    this.notifyConflict(conflict, resolution);

    return resolution;
  }

  /**
   * Detect if there's a conflict between local and remote data
   */
  detectConflict(
    entityType: SyncEntityType,
    entityId: string,
    localData: any,
    remoteData: any
  ): Conflict | null {
    // No conflict if local data doesn't exist
    if (!localData) {
      return null;
    }

    // No conflict if remote data doesn't exist
    if (!remoteData) {
      return null;
    }

    // Get timestamps
    const localTimestamp = localData.updated_at || localData.updatedAt;
    const remoteTimestamp = remoteData.updated_at || remoteData.updatedAt;

    if (!localTimestamp || !remoteTimestamp) {
      return null;
    }

    // Convert to Date objects if needed
    const localDate =
      localTimestamp instanceof Date ? localTimestamp : new Date(localTimestamp);
    const remoteDate =
      remoteTimestamp instanceof Date ? remoteTimestamp : new Date(remoteTimestamp);

    // Check if both have been modified (potential conflict)
    // A conflict exists if:
    // 1. Both local and remote have been updated
    // 2. The timestamps are different
    // 3. Local has not been synced yet (synced_at is null or older than updated_at)
    const localSyncedAt = localData.synced_at || localData.syncedAt;
    const isLocalUnsynced =
      !localSyncedAt ||
      (localSyncedAt instanceof Date
        ? localSyncedAt < localDate
        : new Date(localSyncedAt) < localDate);

    if (isLocalUnsynced && localDate.getTime() !== remoteDate.getTime()) {
      return {
        entityType,
        entityId,
        localData,
        remoteData,
        localTimestamp: localDate,
        remoteTimestamp: remoteDate,
      };
    }

    return null;
  }

  /**
   * Log conflict for debugging
   */
  private logConflict(conflict: Conflict): void {
    console.log('[ConflictResolver] Conflict detected:', {
      entityType: conflict.entityType,
      entityId: conflict.entityId,
      localTimestamp: conflict.localTimestamp.toISOString(),
      remoteTimestamp: conflict.remoteTimestamp.toISOString(),
      localData: this.sanitizeForLogging(conflict.localData),
      remoteData: this.sanitizeForLogging(conflict.remoteData),
    });
  }

  /**
   * Notify user about conflict
   */
  private notifyConflict(conflict: Conflict, resolution: ConflictResolution): void {
    this.conflictCount++;

    // Call custom handler if provided
    if (this.notificationOptions.onConflict) {
      this.notificationOptions.onConflict(conflict, resolution);
    }

    // Show notification if enabled and this is the first conflict in this batch
    // Skip in test environment
    if (
      this.notificationOptions.showNotification &&
      this.conflictCount === 1 &&
      process.env.NODE_ENV !== 'test'
    ) {
      // Use setTimeout to avoid showing alert during sync
      setTimeout(() => {
        const entityName = this.getEntityDisplayName(conflict.entityType);
        const winner = resolution.winner === 'local' ? 'your device' : 'the server';
        
        Alert.alert(
          'Sync Conflict Resolved',
          `A conflict was detected while syncing ${entityName}. The version from ${winner} was kept as it was more recent.`,
          [{ text: 'OK' }]
        );
      }, 100);
    }
  }

  /**
   * Get user-friendly entity name
   */
  private getEntityDisplayName(entityType: SyncEntityType): string {
    switch (entityType) {
      case 'todos':
        return 'a todo';
      case 'expenses':
        return 'an expense';
      case 'calendar_events':
        return 'a calendar event';
      default:
        return 'an item';
    }
  }

  /**
   * Reset conflict count (call after sync batch completes)
   */
  resetConflictCount(): void {
    this.conflictCount = 0;
  }

  /**
   * Get current conflict count
   */
  getConflictCount(): number {
    return this.conflictCount;
  }

  /**
   * Sanitize data for logging (remove sensitive fields)
   */
  private sanitizeForLogging(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    
    // Remove potentially sensitive fields
    delete sanitized.user_id;
    delete sanitized.userId;
    
    return sanitized;
  }
}

export const conflictResolver = new ConflictResolver();
