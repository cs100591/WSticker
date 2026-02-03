/**
 * Glass Bottom Navigation Component
 * Unified floating navigation with theme support and animations
 */

import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, useThemeColors } from '@/store/themeStore';

export interface NavItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  isSpecial?: boolean; // For the AI button in center
}

interface GlassBottomNavProps {
  currentRoute: string;
  onNavigate: (routeName: string) => void;
  onChatbotPress?: () => void;
  isChatbotOpen?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'Todos', label: 'Tasks', icon: 'checkbox-outline', activeIcon: 'checkbox' },
  { name: 'AI', label: 'AI', icon: 'sparkles-outline', activeIcon: 'sparkles', isSpecial: true },
  { name: 'Calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'Expenses', label: 'Expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
];

export function GlassBottomNav({
  currentRoute,
  onNavigate,
  onChatbotPress,
  isChatbotOpen = false
}: GlassBottomNavProps) {
  const colors = useThemeColors();

  const handlePress = (item: NavItem) => {
    if (item.isSpecial && onChatbotPress) {
      onChatbotPress();
    } else {
      onNavigate(item.name);
    }
  };

  const isActive = (itemName: string) => {
    if (itemName === 'AI') {
      return isChatbotOpen;
    }
    return currentRoute === itemName;
  };

  const containerStyle = {
    ...styles.blurContainer,
    borderTopColor: colors.border.light,
    backgroundColor: Platform.OS === 'android' ? colors.nav.background : undefined,
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={containerStyle}>
          <View style={styles.content}>
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={isActive(item.name)}
                onPress={() => handlePress(item)}
                colors={colors}
              />
            ))}
          </View>
        </BlurView>
      ) : (
        <View style={containerStyle}>
          <View style={styles.content}>
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={isActive(item.name)}
                onPress={() => handlePress(item)}
                colors={colors}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function NavButton({ item, isActive, onPress, colors }: NavButtonProps) {
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

  // AI button (center) - special prominent style
  if (item.isSpecial) {
    return (
      <Pressable
        style={styles.navItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.aiIconContainer,
            {
              backgroundColor: isActive ? colors.nav.aiButtonBg : 'transparent',
              borderColor: colors.nav.aiButtonBorder,
              borderWidth: 2,
              shadowColor: isActive ? colors.nav.aiButtonBg : 'transparent',
              shadowOffset: { width: 0, height: isActive ? 4 : 0 },
              shadowOpacity: isActive ? 0.3 : 0,
              shadowRadius: 8,
              elevation: isActive ? 4 : 0,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons
            name={isActive ? (item.activeIcon || item.icon) : item.icon}
            size={24}
            color={isActive ? colors.text.inverse : colors.nav.active}
          />
        </Animated.View>
      </Pressable>
    );
  }

  // Regular nav items
  const iconName = isActive ? (item.activeIcon || item.icon) : item.icon;

  return (
    <Pressable
      style={styles.navItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.regularIconContainer,
          {
            backgroundColor: isActive ? `${colors.nav.active}15` : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={24}
          color={isActive ? colors.nav.active : colors.nav.inactive}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.nav.active : colors.nav.inactive },
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  blurContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,200,200, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 80,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  regularIconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  aiIconContainer: {
    padding: 12,
    borderRadius: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
