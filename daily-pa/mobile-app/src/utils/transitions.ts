/**
 * ScreenTransitions - Page transition animations
 * Fade, slide, and modal transitions for React Navigation
 */

import { Animated } from 'react-native';

export const ScreenTransitions = {
  // Fade in from bottom (default)
  fadeFromBottom: {
    cardStyleInterpolator: ({ current, layouts }: any) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height * 0.1, 0],
            }),
          },
        ],
      },
    }),
  },

  // Slide from right (iOS style)
  slideFromRight: {
    cardStyleInterpolator: ({ current, layouts }: any) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
  },

  // Scale up (modal style)
  scaleUp: {
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        opacity: current.progress,
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      },
    }),
  },

  // Shared element transition base
  sharedElement: {
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  },
};

// Fade transition for screen components (using React Native Animated)
export function useFadeTransition(visible: boolean, duration: number = 300) {
  const opacity = new Animated.Value(visible ? 1 : 0);
  
  Animated.timing(opacity, {
    toValue: visible ? 1 : 0,
    duration,
    useNativeDriver: true,
  }).start();
  
  return { opacity };
}
