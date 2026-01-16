/**
 * Keyboard navigation utilities for accessibility
 * Supports external keyboard navigation on tablets and devices
 */

import { useEffect, useRef } from 'react';
import { Platform, findNodeHandle } from 'react-native';

/**
 * Focus management hook for keyboard navigation
 * Automatically focuses the first focusable element when component mounts
 */
export const useAutoFocus = (shouldFocus: boolean = true) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        ref.current?.focus?.();
      }, 100);
    }
  }, [shouldFocus]);

  return ref;
};

/**
 * Keyboard event handler for custom keyboard shortcuts
 * @param key - Key to listen for (e.g., 'Enter', 'Escape')
 * @param callback - Function to call when key is pressed
 * @param modifiers - Optional modifiers (ctrl, shift, alt, meta)
 */
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  }
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const matchesKey = event.key === key;
      const matchesModifiers =
        (!modifiers?.ctrl || event.ctrlKey) &&
        (!modifiers?.shift || event.shiftKey) &&
        (!modifiers?.alt || event.altKey) &&
        (!modifiers?.meta || event.metaKey);

      if (matchesKey && matchesModifiers) {
        event.preventDefault();
        callback();
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyPress as any);
      return () => {
        document.removeEventListener('keydown', handleKeyPress as any);
      };
    }

    // Note: React Native doesn't have built-in keyboard event listeners
    // For iOS/Android, keyboard navigation is handled through accessibility
    // and hardware keyboard support is limited to text inputs
  }, [key, callback, modifiers]);
};

/**
 * Focus trap for modal dialogs
 * Keeps focus within a container when Tab is pressed
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || Platform.OS !== 'web') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown as any);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [isActive]);

  return containerRef;
};

/**
 * Get next focusable element in tab order
 */
export const getNextFocusable = (currentElement: any, direction: 'next' | 'previous' = 'next') => {
  if (Platform.OS !== 'web') {
    return null;
  }

  const focusableElements = Array.from(
    document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ) as HTMLElement[];

  const currentIndex = focusableElements.indexOf(currentElement);
  
  if (currentIndex === -1) {
    return focusableElements[0];
  }

  if (direction === 'next') {
    return focusableElements[currentIndex + 1] || focusableElements[0];
  } else {
    return focusableElements[currentIndex - 1] || focusableElements[focusableElements.length - 1];
  }
};

/**
 * Keyboard navigation configuration for React Native components
 * These props enable proper keyboard navigation on iOS/Android with external keyboards
 */
export const keyboardNavigationProps = {
  // Make element focusable with external keyboard
  focusable: true,
  
  // Enable tab navigation
  accessible: true,
  
  // Ensure proper tab order (default is 0)
  // Elements with tabIndex 0 are navigated in DOM order
  // Elements with tabIndex > 0 are navigated first, then tabIndex 0
  // Elements with tabIndex -1 are not in tab order but can be programmatically focused
};

/**
 * Get keyboard navigation props for a button
 */
export const getButtonKeyboardProps = (onPress: () => void) => ({
  ...keyboardNavigationProps,
  accessibilityRole: 'button' as const,
  onPress,
  // Support Enter/Space key activation on web
  ...(Platform.OS === 'web' && {
    onKeyPress: (event: any) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onPress();
      }
    },
  }),
});

/**
 * Get keyboard navigation props for a text input
 */
export const getInputKeyboardProps = (onSubmit?: () => void) => ({
  ...keyboardNavigationProps,
  accessibilityRole: 'text' as const,
  // Support Enter key submission
  ...(onSubmit && {
    onSubmitEditing: onSubmit,
    returnKeyType: 'done' as const,
  }),
});

/**
 * Get keyboard navigation props for a list item
 */
export const getListItemKeyboardProps = (onPress: () => void, index: number) => ({
  ...keyboardNavigationProps,
  accessibilityRole: 'button' as const,
  onPress,
  // Support Enter key activation on web
  ...(Platform.OS === 'web' && {
    onKeyPress: (event: any) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onPress();
      }
    },
    tabIndex: 0,
  }),
});

/**
 * Common keyboard shortcuts for the app
 */
export const KeyboardShortcuts = {
  // Navigation
  NEXT_TAB: { key: 'Tab' },
  PREVIOUS_TAB: { key: 'Tab', shift: true },
  
  // Actions
  SUBMIT: { key: 'Enter' },
  CANCEL: { key: 'Escape' },
  SAVE: { key: 's', ctrl: true },
  REFRESH: { key: 'r', ctrl: true },
  
  // Search
  SEARCH: { key: 'f', ctrl: true },
  
  // List navigation
  ARROW_UP: { key: 'ArrowUp' },
  ARROW_DOWN: { key: 'ArrowDown' },
  ARROW_LEFT: { key: 'ArrowLeft' },
  ARROW_RIGHT: { key: 'ArrowRight' },
} as const;
