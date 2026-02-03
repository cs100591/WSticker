/**
 * Font configuration for Daily PA Mobile App
 * Using Poppins font family
 */

const FONTS_CONSTANTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const FONTS = FONTS_CONSTANTS;
export default FONTS_CONSTANTS;

// Common text styles with Poppins font
export const TYPOGRAPHY = {
  // Headers
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  h4: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Labels and buttons
  label: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Special
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  overline: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};
