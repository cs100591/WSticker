/**
 * ScreenContainer Component
 * Provides consistent layout for all screens matching web mobile view
 */

import React from 'react';
import { View, ScrollView, Text, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme/webMobileTheme';
import { useThemeStore } from '@/store/themeStore';
import { LinearGradient } from 'expo-linear-gradient';

interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  title,
  subtitle,
  scrollable = true,
  style,
  contentContainerStyle
}: ScreenContainerProps) {
  const { mode, colors: themeColors } = useThemeStore();
  const isMinimal = mode === 'minimal';
  const isGlassy = !isMinimal;

  const content = (
    <View style={[styles.content, contentContainerStyle]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );



  if (isGlassy) {
    const gradient = [themeColors.gradient.start, themeColors.gradient.middle, themeColors.gradient.end];
    return (
      <LinearGradient
        colors={gradient as any}
        style={[styles.container, style]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {scrollable ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={[styles.container, style]} edges={['top']}>
      {scrollable ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom nav
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.pageTitle,
  },
  subtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
});
