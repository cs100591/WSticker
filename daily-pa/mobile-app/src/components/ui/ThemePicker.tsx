/**
import { FONTS } from '@/theme/fonts';
 * ThemePicker Component
 * Animated theme selector with preview
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useThemeStore,
  useThemeColors,
  ThemeMode,
  themeInfo,
} from '@/store/themeStore';

interface ThemePickerProps {
  onThemeChange?: (theme: ThemeMode) => void;
}

export function ThemePicker({ onThemeChange }: ThemePickerProps) {
  const { mode, setMode } = useThemeStore();
  const colors = useThemeColors();
  const themes: ThemeMode[] = ['ocean', 'sage', 'sunset', 'minimal'];

  const handleSelect = (theme: ThemeMode) => {
    setMode(theme);
    onThemeChange?.(theme);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Choose Theme
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {themes.map((theme) => (
          <ThemeCard
            key={theme}
            theme={theme}
            isActive={mode === theme}
            onPress={() => handleSelect(theme)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ThemeCardProps {
  theme: ThemeMode;
  isActive: boolean;
  onPress: () => void;
}

function ThemeCard({ theme, isActive, onPress }: ThemeCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const info = themeInfo[theme];

  // Get theme preview colors
  const previewColors = getThemePreviewColors(theme);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
          styles.themeCard,
          {
            borderWidth: isActive ? 3 : 1,
            borderColor: isActive ? previewColors.primary : '#E5E5E5',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Gradient Preview */}
        <LinearGradient
          colors={[previewColors.gradientStart, previewColors.gradientEnd]}
          style={styles.gradientPreview}
        >
          {/* Mini card preview */}
          <View style={[styles.miniCard, { backgroundColor: previewColors.card }]}>
            <View
              style={[
                styles.miniButton,
                { backgroundColor: previewColors.primary },
              ]}
            />
          </View>
        </LinearGradient>

        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <Text style={styles.themeEmoji}>{info.emoji}</Text>
          <Text style={styles.themeName}>{info.name}</Text>
        </View>

        {/* Active indicator */}
        {isActive && (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: previewColors.primary },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Get preview colors for each theme
function getThemePreviewColors(theme: ThemeMode) {
  const colors = {
    ocean: {
      primary: '#0EA5E9',
      gradientStart: '#0EA5E9',
      gradientEnd: '#F0F9FF',
      card: 'rgba(255,255,255,0.9)',
    },
    sage: {
      primary: '#10B981',
      gradientStart: '#C3E0D8',
      gradientEnd: '#F9F6F0',
      card: 'rgba(255,255,255,0.9)',
    },
    sunset: {
      primary: '#F43F5E',
      gradientStart: '#FECDD3',
      gradientEnd: '#FFF5F5',
      card: 'rgba(255,255,255,0.9)',
    },
    minimal: {
      primary: '#171717',
      gradientStart: '#FAFAFA',
      gradientEnd: '#FFFFFF',
      card: '#FFFFFF',
    },
  };
  return colors[theme];
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  themeCard: {
    width: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientPreview: {
    height: 80,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCard: {
    width: 50,
    height: 35,
    borderRadius: 6,
    padding: 6,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  miniButton: {
    width: 20,
    height: 8,
    borderRadius: 4,
  },
  themeInfo: {
    padding: 10,
    alignItems: 'center',
  },
  themeEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#374151',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
});
