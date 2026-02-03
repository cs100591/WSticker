/**
 * Sync Types
 * Type definitions for the sync engine
 */

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntityType = 'todos' | 'expenses' | 'calendar_events' | 'notes';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: SyncStatus;
}

export interface SyncResult {
  success: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: SyncError[];
  timestamp: Date;
}

export interface SyncError {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  message: string;
  code?: string;
}

export interface SyncConflict {
  entityType: SyncEntityType;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  localTimestamp: number;
  remoteTimestamp: number;
  resolution?: 'local' | 'remote';
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  networkStatus: NetworkStatus;
  errors: SyncError[];
}

export const DEFAULT_SYNC_STATE: SyncState = {
  isSyncing: false,
  lastSyncTime: null,
  pendingChanges: 0,
  networkStatus: {
    isConnected: false,
    isInternetReachable: null,
    type: null,
  },
  errors: [],
};
