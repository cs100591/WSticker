/**
 * Shimmer - Loading placeholder animation
 * Skeleton screen effect with animated gradient
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  colors?: string[];
}

export function Shimmer({
  width = '100%',
  height = 12,
  style,
  colors = ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
}: ShimmerProps) {
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 300,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  return (
    <View style={[{ width, height, overflow: 'hidden', backgroundColor: '#E5E7EB', borderRadius: 4 }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Pre-built shimmer layouts
export function ShimmerCard() {
  return (
    <View style={shimmerStyles.card}>
      <Shimmer width={40} height={40} style={{ borderRadius: 8 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Shimmer width="70%" height={16} style={{ marginBottom: 8 }} />
        <Shimmer width="40%" height={12} />
      </View>
    </View>
  );
}

export function ShimmerList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </>
  );
}

const shimmerStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
  },
});
