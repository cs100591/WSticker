/**
 * Validation Error Component
 * Displays validation errors with field highlighting
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ValidationErrorProps {
  error: string;
  visible?: boolean;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  visible = true,
}) => {
  if (!visible || !error) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{error}</Text>
    </View>
  );
};

interface FieldErrorProps {
  error?: string;
  touched?: boolean;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, touched }) => {
  if (!touched || !error) {
    return null;
  }

  return (
    <View style={styles.fieldErrorContainer}>
      <Text style={styles.fieldErrorText}>{error}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  fieldErrorContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
});
