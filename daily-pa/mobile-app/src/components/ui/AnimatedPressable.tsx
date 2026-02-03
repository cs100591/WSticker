/**
 * AnimatedPressable - Universal press animation wrapper
 * Provides scale feedback on press for any touchable element
 */

import React, { useRef, ReactNode } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;           // Scale on press (default: 0.95)
  duration?: number;        // Animation duration (default: 100ms)
}

export function AnimatedPressable({
  children,
  style,
  scale = 0.95,
  duration = 100,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

/**
 * RippleButton - Button with ripple effect on Android
 */
export function RippleButton({
  children,
  style,
  ...props
}: AnimatedPressableProps) {
  return (
    <AnimatedPressable
      scale={0.97}
      style={style}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
