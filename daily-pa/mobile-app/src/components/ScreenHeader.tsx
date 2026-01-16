/**
 * Screen Header Component
 * Shared header with settings button for all screens
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

interface ScreenHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, rightContent }) => {
  const navigation = useNavigation();

  const handleSettingsPress = () => {
    try {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Settings',
        })
      );
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRight}>
        {rightContent}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          accessible={true}
          accessibilityLabel="Go to settings"
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
