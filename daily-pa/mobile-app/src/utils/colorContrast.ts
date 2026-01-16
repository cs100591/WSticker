/**
 * Color contrast utilities for accessibility
 * Ensures WCAG 2.1 Level AA compliance (4.5:1 for normal text, 3:1 for large text)
 */

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio (1-21)
 * @param isLargeText - Text is 18pt+ or 14pt+ bold
 */
export const meetsWCAG_AA = (ratio: number, isLargeText: boolean = false): boolean => {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Check if contrast ratio meets WCAG AAA standards
 * @param ratio - Contrast ratio (1-21)
 * @param isLargeText - Text is 18pt+ or 14pt+ bold
 */
export const meetsWCAG_AAA = (ratio: number, isLargeText: boolean = false): boolean => {
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
};

/**
 * Check if two colors have sufficient contrast
 */
export const hasGoodContrast = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return meetsWCAG_AA(ratio, isLargeText);
};

/**
 * App color palette with contrast ratios
 */
export const colors = {
  // Primary colors
  primary: '#007AFF', // iOS blue
  primaryDark: '#0051D5',
  primaryLight: '#4DA2FF',

  // Semantic colors
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#FF3B30', // Red
  info: '#2196F3', // Blue

  // Neutral colors
  black: '#000000',
  white: '#FFFFFF',
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',

  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#F9FAFB',

  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',
} as const;

/**
 * Verify color combinations meet WCAG AA
 */
export const verifyColorPalette = (): {
  combination: string;
  ratio: number;
  passes: boolean;
}[] => {
  const combinations = [
    // Primary text on backgrounds
    { fg: colors.textPrimary, bg: colors.background, name: 'Primary text on white' },
    { fg: colors.textSecondary, bg: colors.background, name: 'Secondary text on white' },
    { fg: colors.textTertiary, bg: colors.background, name: 'Tertiary text on white' },
    
    // Primary color combinations
    { fg: colors.white, bg: colors.primary, name: 'White on primary blue' },
    { fg: colors.white, bg: colors.error, name: 'White on error red' },
    { fg: colors.white, bg: colors.success, name: 'White on success green' },
    
    // Gray combinations
    { fg: colors.gray900, bg: colors.white, name: 'Gray 900 on white' },
    { fg: colors.gray700, bg: colors.white, name: 'Gray 700 on white' },
    { fg: colors.gray600, bg: colors.white, name: 'Gray 600 on white' },
  ];

  return combinations.map(({ fg, bg, name }) => {
    const ratio = getContrastRatio(fg, bg);
    return {
      combination: name,
      ratio: Math.round(ratio * 100) / 100,
      passes: meetsWCAG_AA(ratio),
    };
  });
};
