/**
 * Color independence utilities for accessibility
 * Ensures information is not conveyed by color alone
 */

import { TodoColor, TodoStatus, ExpenseCategory } from '@/models';

/**
 * Get icon for todo color
 * Provides visual indicator beyond color
 */
export const getTodoColorIcon = (color: TodoColor): string => {
  const icons: Record<TodoColor, string> = {
    blue: '🔵',
    green: '🟢',
    yellow: '🟡',
    purple: '🟣',
    orange: '🟠',
    pink: '🌸',
  };
  return icons[color];
};

/**
 * Get text label for todo color
 * Provides text alternative to color
 */
export const getTodoColorLabel = (color: TodoColor): string => {
  const labels: Record<TodoColor, string> = {
    blue: 'Blue (Work)',
    green: 'Green (Personal)',
    yellow: 'Yellow (Important)',
    purple: 'Purple (Creative)',
    orange: 'Orange (Social)',
    pink: 'Pink (Health)',
  };
  return labels[color];
};

/**
 * Get icon for todo status
 * Provides visual indicator beyond color
 */
export const getTodoStatusIcon = (status: TodoStatus): string => {
  const icons: Record<TodoStatus, string> = {
    active: '○', // Empty circle
    completed: '✓', // Checkmark
  };
  return icons[status];
};

/**
 * Get text label for todo status
 * Provides text alternative to status
 */
export const getTodoStatusLabel = (status: TodoStatus): string => {
  const labels: Record<TodoStatus, string> = {
    active: 'Active',
    completed: 'Completed',
  };
  return labels[status];
};

/**
 * Get icon for expense category
 * Provides visual indicator beyond color
 */
export const getExpenseCategoryIcon = (category: ExpenseCategory): string => {
  const icons: Record<ExpenseCategory, string> = {
    food: '🍽️',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎬',
    bills: '💡',
    health: '🏥',
    education: '📚',
    other: '📦',
  };
  return icons[category];
};

/**
 * Get text label for expense category
 * Provides text alternative to category
 */
export const getExpenseCategoryLabel = (category: ExpenseCategory): string => {
  const labels: Record<ExpenseCategory, string> = {
    food: 'Food & Dining',
    transport: 'Transportation',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills & Utilities',
    health: 'Health & Medical',
    education: 'Education',
    other: 'Other',
  };
  return labels[category];
};

/**
 * Get icon for priority level
 * Provides visual indicator beyond color
 */
export const getPriorityIcon = (priority: 'low' | 'medium' | 'high'): string => {
  const icons = {
    low: '↓', // Down arrow
    medium: '→', // Right arrow
    high: '↑', // Up arrow
  };
  return icons[priority];
};

/**
 * Get text label for priority level
 * Provides text alternative to priority
 */
export const getPriorityLabel = (priority: 'low' | 'medium' | 'high'): string => {
  const labels = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
  };
  return labels[priority];
};

/**
 * Get icon for sync status
 * Provides visual indicator beyond color
 */
export const getSyncStatusIcon = (synced: boolean): string => {
  return synced ? '✓' : '⟳'; // Checkmark or sync icon
};

/**
 * Get text label for sync status
 * Provides text alternative to sync status
 */
export const getSyncStatusLabel = (synced: boolean): string => {
  return synced ? 'Synced' : 'Pending sync';
};

/**
 * Get icon for error state
 * Provides visual indicator beyond color
 */
export const getErrorIcon = (): string => {
  return '⚠️'; // Warning triangle
};

/**
 * Get icon for success state
 * Provides visual indicator beyond color
 */
export const getSuccessIcon = (): string => {
  return '✓'; // Checkmark
};

/**
 * Get icon for info state
 * Provides visual indicator beyond color
 */
export const getInfoIcon = (): string => {
  return 'ℹ️'; // Info icon
};

/**
 * Get icon for warning state
 * Provides visual indicator beyond color
 */
export const getWarningIcon = (): string => {
  return '⚠️'; // Warning triangle
};

/**
 * Get pattern/texture for color (for grayscale mode)
 * Returns CSS pattern or React Native style
 */
export const getColorPattern = (color: TodoColor): {
  pattern: string;
  description: string;
} => {
  const patterns: Record<TodoColor, { pattern: string; description: string }> = {
    blue: { pattern: 'dots', description: 'Dots pattern' },
    green: { pattern: 'horizontal-lines', description: 'Horizontal lines pattern' },
    yellow: { pattern: 'vertical-lines', description: 'Vertical lines pattern' },
    purple: { pattern: 'grid', description: 'Grid pattern' },
    orange: { pattern: 'waves', description: 'Waves pattern' },
    pink: { pattern: 'circles', description: 'Circles pattern' },
  };
  return patterns[color];
};

/**
 * Get accessible color combination
 * Returns foreground and background colors that meet WCAG AA
 */
export const getAccessibleColors = (
  color: TodoColor
): { foreground: string; background: string; border: string } => {
  const colors: Record<
    TodoColor,
    { foreground: string; background: string; border: string }
  > = {
    blue: { foreground: '#1E40AF', background: '#DBEAFE', border: '#3B82F6' },
    green: { foreground: '#166534', background: '#DCFCE7', border: '#22C55E' },
    yellow: { foreground: '#854D0E', background: '#FEF3C7', border: '#EAB308' },
    purple: { foreground: '#6B21A8', background: '#F3E8FF', border: '#A855F7' },
    orange: { foreground: '#9A3412', background: '#FFEDD5', border: '#F97316' },
    pink: { foreground: '#9F1239', background: '#FCE7F3', border: '#EC4899' },
  };
  return colors[color];
};

/**
 * Format date with visual separator
 * Provides structure beyond color
 */
export const formatDateWithSeparator = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year} • ${month} • ${day}`;
};

/**
 * Format currency with symbol
 * Provides context beyond color
 */
export const formatCurrencyWithSymbol = (amount: number, currency: string = 'CNY'): string => {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Get status badge with icon and text
 * Combines multiple indicators
 */
export const getStatusBadge = (
  status: 'success' | 'error' | 'warning' | 'info'
): {
  icon: string;
  text: string;
  color: string;
  backgroundColor: string;
} => {
  const badges = {
    success: {
      icon: '✓',
      text: 'Success',
      color: '#166534',
      backgroundColor: '#DCFCE7',
    },
    error: {
      icon: '✗',
      text: 'Error',
      color: '#991B1B',
      backgroundColor: '#FEE2E2',
    },
    warning: {
      icon: '⚠',
      text: 'Warning',
      color: '#854D0E',
      backgroundColor: '#FEF3C7',
    },
    info: {
      icon: 'ℹ',
      text: 'Info',
      color: '#1E40AF',
      backgroundColor: '#DBEAFE',
    },
  };
  return badges[status];
};

/**
 * Get due date indicator with icon and text
 * Provides multiple indicators for urgency
 */
export const getDueDateIndicator = (dueDate: Date | null): {
  icon: string;
  text: string;
  color: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
} => {
  if (!dueDate) {
    return {
      icon: '',
      text: 'No due date',
      color: '#6B7280',
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      icon: '⚠️',
      text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
      color: '#991B1B',
      isOverdue: true,
      isDueToday: false,
      isDueSoon: false,
    };
  } else if (diffDays === 0) {
    return {
      icon: '📅',
      text: 'Due today',
      color: '#854D0E',
      isOverdue: false,
      isDueToday: true,
      isDueSoon: false,
    };
  } else if (diffDays <= 3) {
    return {
      icon: '⏰',
      text: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      color: '#9A3412',
      isOverdue: false,
      isDueToday: false,
      isDueSoon: true,
    };
  } else {
    return {
      icon: '📆',
      text: `Due in ${diffDays} days`,
      color: '#1E40AF',
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
    };
  }
};

/**
 * Get filter indicator with count
 * Shows active filters with text and count
 */
export const getFilterIndicator = (activeFilters: number): {
  icon: string;
  text: string;
  show: boolean;
} => {
  return {
    icon: '🔍',
    text: `${activeFilters} filter${activeFilters !== 1 ? 's' : ''} active`,
    show: activeFilters > 0,
  };
};

/**
 * Color independence best practices
 */
export const ColorIndependenceBestPractices = {
  // Always combine color with:
  // 1. Icons/symbols
  // 2. Text labels
  // 3. Patterns/textures
  // 4. Position/layout
  // 5. Size/weight

  // Examples:
  // ✅ Red text + warning icon + "Error" label
  // ✅ Green background + checkmark + "Success" text
  // ✅ Blue border + info icon + "Note" label
  // ❌ Red text alone
  // ❌ Green background alone
  // ❌ Blue border alone
} as const;
