/**
import { FONTS } from '@/theme/fonts';
 * Button Component
 * Matches web mobile view button styling
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors, borderRadius, spacing, typography, buttonStyles } from '../../theme/webMobileTheme';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  children, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  loading = false,
  style,
  textStyle 
}: ButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'text':
        return styles.textButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'outline':
        return styles.outlineText;
      case 'text':
        return styles.textText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target
  },
  primaryButton: {
    ...buttonStyles.primary,
  },
  outlineButton: {
    ...buttonStyles.outline,
  },
  textButton: {
    ...buttonStyles.text,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontFamily: FONTS.semiBold,
  },
  outlineText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontFamily: FONTS.semiBold,
  },
  textText: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontFamily: FONTS.medium,
  },
  disabled: {
    opacity: 0.5,
  },
});
