/**
 * Glass Bottom Navigation Component
 * Matches web mobile view exactly with glass morphism effect
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows } from '../../theme/webMobileTheme';

export interface NavItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSpecial?: boolean; // For the AI button in center
}

interface GlassBottomNavProps {
  currentRoute: string;
  onNavigate: (routeName: string) => void;
  onChatbotPress?: () => void;
  isChatbotOpen?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Home', label: 'Home', icon: 'home-outline' },
  { name: 'Todos', label: 'Tasks', icon: 'checkbox-outline' },
  { name: 'AI', label: 'AI', icon: 'sparkles-outline', isSpecial: true },
  { name: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
  { name: 'Expenses', label: 'Expenses', icon: 'wallet-outline' },
];

export function GlassBottomNav({ 
  currentRoute, 
  onNavigate, 
  onChatbotPress,
  isChatbotOpen = false 
}: GlassBottomNavProps) {
  
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

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
          <View style={styles.content}>
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={isActive(item.name)}
                onPress={() => handlePress(item)}
              />
            ))}
          </View>
        </BlurView>
      ) : (
        // Android fallback without blur
        <View style={[styles.blurContainer, styles.androidContainer]}>
          <View style={styles.content}>
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={isActive(item.name)}
                onPress={() => handlePress(item)}
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
}

function NavButton({ item, isActive, onPress }: NavButtonProps) {
  // AI button (center) - special outline style
  if (item.isSpecial) {
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[
          styles.aiIconContainer,
          isActive ? styles.aiIconContainerActive : styles.aiIconContainerInactive
        ]}>
          <Ionicons
            name={item.icon}
            size={24}
            color={isActive ? '#FFFFFF' : colors.primary}
          />
        </View>
      </TouchableOpacity>
    );
  }

  // Regular nav items
  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.regularIconContainer}>
        <Ionicons
          name={item.icon}
          size={24}
          color={isActive ? colors.primary : colors.textSecondary}
        />
      </View>
      <Text style={[
        styles.label,
        isActive ? styles.labelActive : styles.labelInactive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
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
    borderTopColor: colors.border,
  },
  androidContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 80,
    paddingHorizontal: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  // Regular nav items
  regularIconContainer: {
    padding: spacing.sm,
    borderRadius: 12,
  },
  // AI button (special center button)
  aiIconContainer: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
  },
  aiIconContainerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  aiIconContainerInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  // Labels
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight as any,
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
  },
  labelInactive: {
    color: colors.textSecondary,
  },
});
