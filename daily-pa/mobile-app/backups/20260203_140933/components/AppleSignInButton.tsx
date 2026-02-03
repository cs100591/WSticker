/**
 * Apple Sign In Button Component
 * Displays Sign in with Apple button (iOS only)
 */

import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, View, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { appleAuthService } from '@/services/appleAuthService';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await appleAuthService.isAvailable();
    setIsAvailable(available);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await appleAuthService.signIn();

      if (result.success) {
        onSuccess?.();
      } else {
        const errorMessage = result.error || 'Sign in with Apple failed';
        onError?.(errorMessage);
        
        // Only show alert if not cancelled
        if (!errorMessage.includes('cancelled')) {
          Alert.alert('Sign In Failed', errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render on Android or if not available
  if (Platform.OS !== 'ios' || !isAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={[styles.button, isLoading && { opacity: 0.5 }]}
        onPress={isLoading ? () => {} : handleSignIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 50,
  },
});
