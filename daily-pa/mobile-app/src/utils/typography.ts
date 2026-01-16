/**
 * Typography utilities for responsive and accessible text sizing
 * Supports system text size settings for accessibility
 */

import { PixelRatio } from 'react-native';

/**
 * Scale font size based on device pixel ratio
 * This ensures consistent text sizing across different screen densities
 */
export const scaleFontSize = (size: number): number => {
  const scale = PixelRatio.getFontScale();
  return size * scale;
};

/**
 * Typography scale following Material Design type scale
 * These sizes will automatically scale with system text size settings
 */
export const typography = {
  // Display sizes
  displayLarge: 57,
  displayMedium: 45,
  displaySmall: 36,
  
  // Headline sizes
  headlineLarge: 32,
  headlineMedium: 28,
  headlineSmall: 24,
  
  // Title sizes
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  
  // Body sizes
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  
  // Label sizes
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
} as const;

/**
 * Get font size with optional scaling
 * @param size - Base font size from typography scale
 * @param scale - Whether to apply additional scaling (default: false)
 */
export const getFontSize = (size: number, scale: boolean = false): number => {
  return scale ? scaleFontSize(size) : size;
};

/**
 * Line height multiplier for better readability
 * Recommended: 1.5 for body text, 1.2 for headings
 */
export const getLineHeight = (fontSize: number, multiplier: number = 1.5): number => {
  return fontSize * multiplier;
};

/**
 * Check if text size is within accessible range
 * WCAG recommends minimum 16px for body text
 */
export const isAccessibleTextSize = (size: number): boolean => {
  const scale = PixelRatio.getFontScale();
  const scaledSize = size * scale;
  return scaledSize >= 16;
};
