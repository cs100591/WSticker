/**
 * Authentication Error Alert Component
 * Displays user-friendly authentication error messages with guidance
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AuthErrorAlertProps {
  error: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({
  error,
  onDismiss,
  onRetry,
}) => {
  const getGuidance = (errorMessage: string): string => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('invalid') || lowerError.includes('incorrect')) {
      return 'Please check your email and password and try again.';
    }
    
    if (lowerError.includes('not found') || lowerError.includes('does not exist')) {
      return 'This account does not exist. Please check your email or sign up for a new account.';
    }
    
    if (lowerError.includes('expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'Please check your internet connection and try again.';
    }
    
    if (lowerError.includes('too many')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    
    return 'Please try again or contact support if the problem persists.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Authentication Error</Text>
        <Text style={styles.message}>{error}</Text>
        <Text style={styles.guidance}>{getGuidance(error)}</Text>
        <View style={styles.buttons}>
          {onDismiss && (
            <TouchableOpacity
              style={[styles.button, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          )}
          {onRetry && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={onRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    padding: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  guidance: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#f0f0f0',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
