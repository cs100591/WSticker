/**
 * AnimatedCard Component
 * Unified card with press animation and theme support
 */

import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useThemeColors } from '@/store/themeStore';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  // Animation options
  scaleOnPress?: number;      // Default: 0.98
  animationSpeed?: number;    // Default: 150ms
  // Card variants
  variant?: 'default' | 'compact' | 'flat';
  // Highlight border (for selected state)
  highlighted?: boolean;
}

export function AnimatedCard({
  children,
  onPress,
  style,
  disabled = false,
  scaleOnPress = 0.98,
  animationSpeed = 150,
  variant = 'default',
  highlighted = false,
}: AnimatedCardProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || !onPress) return;
    Animated.spring(scaleAnim, {
      toValue: scaleOnPress,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.background.card,
    borderRadius: variant === 'compact' ? 12 : 16,
    borderWidth: 1,
    borderColor: highlighted ? colors.primary[500] : colors.border.card,
    // Shadow
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: variant === 'flat' ? 1 : 4 },
    shadowOpacity: colors.shadow.cardOpacity,
    shadowRadius: variant === 'flat' ? 2 : 12,
    elevation: variant === 'flat' ? 1 : 4,
  };

  const paddingStyle: ViewStyle = {
    padding: variant === 'compact' ? 12 : variant === 'flat' ? 16 : 20,
  };

  // If no onPress, render without Pressable
  if (!onPress) {
    return (
      <Animated.View
        style={[
          cardStyle,
          paddingStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          cardStyle,
          paddingStyle,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * AnimatedButton Component
 * Primary action button with animation
 */
interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

export function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
  variant = 'primary',
}: AnimatedButtonProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const buttonStyle: ViewStyle = {
    backgroundColor:
      variant === 'primary'
        ? colors.primary[500]
        : variant === 'outline'
        ? 'transparent'
        : 'transparent',
    borderRadius: 12,
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: variant === 'outline' ? colors.primary[500] : undefined,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for primary
    ...(variant === 'primary' && {
      shadowColor: colors.primary[500],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    }),
    // Disabled state
    ...(disabled && {
      opacity: 0.5,
    }),
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          buttonStyle,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * AnimatedIconButton Component
 * Small icon button with bounce animation
 */
interface AnimatedIconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export function AnimatedIconButton({
  children,
  onPress,
  size = 44,
  style,
  backgroundColor,
}: AnimatedIconButtonProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor || colors.primary[500],
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadow.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: colors.shadow.fabOpacity,
            shadowRadius: 4,
            elevation: 3,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
