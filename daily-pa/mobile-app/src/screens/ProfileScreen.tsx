/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/themeStore';
import { LinearGradient } from 'expo-linear-gradient';



export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { mode: themeMode } = useThemeStore();
  const isGlassy = themeMode !== 'minimal';
  const gradient = React.useMemo(() => {
    switch (themeMode) {
      case 'sage': return ['#C3E0D8', '#D6E8E2', '#F9F6F0'];
      case 'sunset': return ['#FECDD3', '#FFE4E6', '#FFF5F5'];
      case 'ocean': return ['#BAE6FD', '#E0F2FE', '#F0F9FF'];
      default: return ['#E0F2FE', '#DBEAFE', '#EFF6FF'];
    }
  }, [themeMode]);

  return (
    <View style={[styles.container, isGlassy && { backgroundColor: 'transparent' }]}>
      {isGlassy && (
        <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]}>
          <LinearGradient
            colors={gradient as any}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <Text style={styles.title}>Profile</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
          {user.user_metadata?.full_name && (
            <>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{user.user_metadata.full_name}</Text>
            </>
          )}
        </View>
      )}
      <Button title="Sign Out" onPress={signOut} style={styles.signOutButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  signOutButton: {
    marginTop: 'auto',
  },
});
