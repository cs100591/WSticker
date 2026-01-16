/**
 * Network Monitor
 * Monitors network connectivity status
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { NetworkStatus } from './types';

type NetworkStatusListener = (status: NetworkStatus) => void;

class NetworkMonitor {
  private listeners: Set<NetworkStatusListener> = new Set();
  private currentStatus: NetworkStatus = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
  };
  private subscription: NetInfoSubscription | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the network monitor
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Get initial state
    const state = await NetInfo.fetch();
    this.updateStatus(state);

    // Subscribe to changes
    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      this.updateStatus(state);
    });

    this.initialized = true;
  }

  /**
   * Update the current status and notify listeners
   */
  private updateStatus(state: NetInfoState): void {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };

    const hasChanged =
      this.currentStatus.isConnected !== newStatus.isConnected ||
      this.currentStatus.isInternetReachable !== newStatus.isInternetReachable;

    this.currentStatus = newStatus;

    if (hasChanged) {
      this.notifyListeners();
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isConnected && this.currentStatus.isInternetReachable !== false;
  }

  /**
   * Add a listener for network status changes
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a listener
   */
  removeListener(listener: NetworkStatusListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Wait for network to become available
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline()) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addListener((status) => {
        if (status.isConnected && status.isInternetReachable !== false) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

export const networkMonitor = new NetworkMonitor();
