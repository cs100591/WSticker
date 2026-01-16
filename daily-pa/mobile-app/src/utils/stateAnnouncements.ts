/**
 * State announcement utilities for accessibility
 * Announces loading, error, and success states to screen readers
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * Announce a message to screen readers
 * Works with VoiceOver (iOS) and TalkBack (Android)
 */
export const announceForAccessibility = (message: string) => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    AccessibilityInfo.announceForAccessibility(message);
  } else if (Platform.OS === 'web') {
    // For web, use ARIA live regions
    announceForWeb(message);
  }
};

/**
 * Announce message for web using ARIA live region
 */
const announceForWeb = (message: string) => {
  // Create or get existing live region
  let liveRegion = document.getElementById('aria-live-region');
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }

  // Clear and set new message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
};

/**
 * Hook to announce loading state changes
 */
export const useLoadingAnnouncement = (
  isLoading: boolean,
  loadingMessage: string = 'Loading',
  loadedMessage: string = 'Content loaded'
) => {
  const previousLoading = useRef(isLoading);

  useEffect(() => {
    if (isLoading && !previousLoading.current) {
      // Started loading
      announceForAccessibility(loadingMessage);
    } else if (!isLoading && previousLoading.current) {
      // Finished loading
      announceForAccessibility(loadedMessage);
    }
    previousLoading.current = isLoading;
  }, [isLoading, loadingMessage, loadedMessage]);
};

/**
 * Hook to announce error state changes
 */
export const useErrorAnnouncement = (
  error: Error | string | null,
  errorPrefix: string = 'Error'
) => {
  const previousError = useRef(error);

  useEffect(() => {
    if (error && error !== previousError.current) {
      const errorMessage = typeof error === 'string' ? error : error.message;
      announceForAccessibility(`${errorPrefix}: ${errorMessage}`);
    }
    previousError.current = error;
  }, [error, errorPrefix]);
};

/**
 * Hook to announce success state changes
 */
export const useSuccessAnnouncement = (
  success: boolean,
  successMessage: string = 'Action completed successfully'
) => {
  const previousSuccess = useRef(success);

  useEffect(() => {
    if (success && !previousSuccess.current) {
      announceForAccessibility(successMessage);
    }
    previousSuccess.current = success;
  }, [success, successMessage]);
};

/**
 * Hook to announce data changes (e.g., list updates)
 */
export const useDataChangeAnnouncement = <T>(
  data: T[],
  getMessage: (count: number) => string
) => {
  const previousCount = useRef(data.length);

  useEffect(() => {
    if (data.length !== previousCount.current) {
      announceForAccessibility(getMessage(data.length));
    }
    previousCount.current = data.length;
  }, [data, getMessage]);
};

/**
 * Announce action completion
 */
export const announceActionComplete = (action: string, success: boolean = true) => {
  const message = success
    ? `${action} completed successfully`
    : `${action} failed`;
  announceForAccessibility(message);
};

/**
 * Announce navigation change
 */
export const announceNavigation = (screenName: string) => {
  announceForAccessibility(`Navigated to ${screenName}`);
};

/**
 * Announce form validation errors
 */
export const announceFormErrors = (errors: Record<string, string>) => {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) {
    return;
  }

  const message = errorCount === 1
    ? `1 form error: ${Object.values(errors)[0]}`
    : `${errorCount} form errors found`;
  
  announceForAccessibility(message);
};

/**
 * Announce filter/search results
 */
export const announceSearchResults = (count: number, query?: string) => {
  const message = query
    ? `${count} results found for "${query}"`
    : `${count} items displayed`;
  announceForAccessibility(message);
};

/**
 * Announce sync status
 */
export const announceSyncStatus = (status: 'syncing' | 'synced' | 'error', error?: string) => {
  const messages = {
    syncing: 'Syncing data',
    synced: 'Data synced successfully',
    error: error ? `Sync failed: ${error}` : 'Sync failed',
  };
  announceForAccessibility(messages[status]);
};

/**
 * Announce item count changes
 */
export const announceItemCount = (count: number, itemType: string) => {
  const message = count === 0
    ? `No ${itemType}s`
    : count === 1
    ? `1 ${itemType}`
    : `${count} ${itemType}s`;
  announceForAccessibility(message);
};

/**
 * Announce progress updates
 */
export const announceProgress = (current: number, total: number, action: string) => {
  const percentage = Math.round((current / total) * 100);
  announceForAccessibility(`${action}: ${percentage}% complete`);
};

/**
 * State announcement types for common scenarios
 */
export const StateAnnouncements = {
  // Loading states
  LOADING_TODOS: 'Loading todos',
  LOADING_EXPENSES: 'Loading expenses',
  LOADING_EVENTS: 'Loading calendar events',
  LOADING_PROFILE: 'Loading profile',
  
  // Loaded states
  TODOS_LOADED: 'Todos loaded',
  EXPENSES_LOADED: 'Expenses loaded',
  EVENTS_LOADED: 'Calendar events loaded',
  PROFILE_LOADED: 'Profile loaded',
  
  // Action states
  TODO_CREATED: 'Todo created',
  TODO_UPDATED: 'Todo updated',
  TODO_DELETED: 'Todo deleted',
  TODO_COMPLETED: 'Todo marked as complete',
  TODO_UNCOMPLETED: 'Todo marked as active',
  
  EXPENSE_CREATED: 'Expense created',
  EXPENSE_UPDATED: 'Expense updated',
  EXPENSE_DELETED: 'Expense deleted',
  
  EVENT_CREATED: 'Calendar event created',
  EVENT_UPDATED: 'Calendar event updated',
  EVENT_DELETED: 'Calendar event deleted',
  
  // Sync states
  SYNC_STARTED: 'Syncing data',
  SYNC_COMPLETED: 'Data synced successfully',
  SYNC_FAILED: 'Sync failed',
  
  // Error states
  NETWORK_ERROR: 'Network error. Please check your connection',
  AUTH_ERROR: 'Authentication error. Please sign in again',
  VALIDATION_ERROR: 'Please correct the form errors',
  
  // Success states
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  SETTINGS_SAVED: 'Settings saved',
  
  // Filter/Search states
  FILTERS_APPLIED: 'Filters applied',
  FILTERS_CLEARED: 'Filters cleared',
  SEARCH_COMPLETED: 'Search completed',
} as const;

/**
 * Debounce announcements to avoid overwhelming screen readers
 */
let announcementTimeout: NodeJS.Timeout | null = null;

export const announceDebounced = (message: string, delay: number = 500) => {
  if (announcementTimeout) {
    clearTimeout(announcementTimeout);
  }
  
  announcementTimeout = setTimeout(() => {
    announceForAccessibility(message);
    announcementTimeout = null;
  }, delay);
};
