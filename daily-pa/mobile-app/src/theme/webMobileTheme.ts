/**
 * Theme matching web app mobile view
 * Based on web app's responsive mobile design
 */

export const colors = {
  // Navigation
  navActive: '#3B82F6',        // blue-500
  navInactive: '#9CA3AF',      // gray-400
  navBackground: 'rgba(255, 255, 255, 0.8)',
  navBorder: '#E2E8F0',
  
  // Backgrounds
  pageBackground: '#F8FAFC',   // slate-50
  cardBackground: '#FFFFFF',   // white
  
  // Borders
  border: '#E2E8F0',           // slate-200
  borderLight: '#F1F5F9',      // slate-100
  
  // Text
  textPrimary: '#0F172A',      // slate-900
  textSecondary: '#64748B',    // slate-500
  textMuted: '#94A3B8',        // slate-400
  textLight: '#CBD5E1',        // slate-300
  
  // Primary/Accent
  primary: '#2563EB',          // blue-600
  primaryLight: '#3B82F6',     // blue-500
  primaryDark: '#1D4ED8',      // blue-700
  
  // Status Colors
  success: '#10B981',          // emerald-500
  successLight: '#D1FAE5',     // emerald-50
  warning: '#F59E0B',          // amber-500
  warningLight: '#FEF3C7',     // amber-50
  error: '#EF4444',            // rose-500
  errorLight: '#FEE2E2',       // rose-50
  info: '#6366F1',             // indigo-500
  infoLight: '#E0E7FF',        // indigo-50
  
  // Priority Badge Colors
  priorityHigh: '#DC2626',     // red-600
  priorityHighBg: '#FEE2E2',   // red-50
  priorityMedium: '#F59E0B',   // amber-500
  priorityMediumBg: '#FEF3C7', // amber-50
  priorityLow: '#3B82F6',      // blue-500
  priorityLowBg: '#DBEAFE',    // blue-50
};

export const typography = {
  // Matching web mobile view
  pageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  label: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
};

export const cardStyles = {
  default: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card,
  },
  stat: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
};

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.button,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
};
