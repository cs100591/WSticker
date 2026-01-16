/**
 * Auth Provider Component
 * Handles auto-authentication and auth state initialization
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const authState = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Sync loading state from store
  useEffect(() => {
    setIsLoading(authState.isLoading);
  }, [authState.isLoading]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize auth service (checks for existing session)
        await authService.initialize();
        
        // Setup auth state listener
        authService.setupAuthListener();
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Continue anyway - app can still work in offline mode
      } finally {
        setIsInitializing(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout - continuing anyway');
      setIsInitializing(false);
    }, 3000);

    initializeAuth().finally(() => clearTimeout(timeout));

    return () => clearTimeout(timeout);
  }, []);

  if (isInitializing || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
