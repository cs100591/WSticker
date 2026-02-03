/**
 * Card Component
 * Matches web mobile view card styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows, cardStyles } from '../../theme/webMobileTheme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'stat';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'stat' ? styles.statCard : styles.defaultCard,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  defaultCard: {
    padding: spacing.xl,
    ...shadows.card,
  },
  statCard: {
    padding: spacing.lg,
    ...shadows.card,
  },
});
