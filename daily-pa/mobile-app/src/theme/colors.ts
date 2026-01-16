/**
 * Theme Colors - Matching Web App Design
 * Professional Productivity Palette
 */

export const colors = {
  // Primary - Blue (matching web app)
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main primary color
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Background
  background: {
    light: '#FAFBFC', // Light mode background
    dark: '#0F172A',  // Dark mode background
  },

  // Card
  card: {
    light: '#FFFFFF',
    dark: '#1E293B',
  },

  // Text
  text: {
    primary: {
      light: '#0F172A',
      dark: '#F8FAFC',
    },
    secondary: {
      light: '#64748B',
      dark: '#94A3B8',
    },
    muted: {
      light: '#94A3B8',
      dark: '#64748B',
    },
  },

  // Border
  border: {
    light: '#E2E8F0',
    dark: '#334155',
  },

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Todo priority colors (matching web)
  priority: {
    low: '#10B981',    // Green
    medium: '#F59E0B', // Orange
    high: '#EF4444',   // Red
  },

  // Expense category colors
  expense: {
    food: '#F59E0B',
    transport: '#3B82F6',
    shopping: '#EC4899',
    entertainment: '#8B5CF6',
    bills: '#EF4444',
    health: '#10B981',
    education: '#6366F1',
    other: '#6B7280',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};
