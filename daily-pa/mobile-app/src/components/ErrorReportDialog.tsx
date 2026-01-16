/**
 * Error Report Dialog
 * Allows users to report errors with diagnostic information
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { crashLogger } from '@/services/crashLogger';
import { AppError } from '@/utils/errorHandling';

interface ErrorReportDialogProps {
  visible: boolean;
  error?: AppError;
  onClose: () => void;
}

export const ErrorReportDialog: React.FC<ErrorReportDialogProps> = ({
  visible,
  error,
  onClose,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe what happened');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get crash logs
      const crashLogs = await crashLogger.getCrashLogsFormatted();

      // In a real app, you would send this to your error reporting service
      // For now, we'll just log it
      const report = {
        description: description.trim(),
        error: error
          ? {
              type: error.type,
              message: error.message,
              timestamp: error.timestamp.toISOString(),
            }
          : null,
        crashLogs,
        timestamp: new Date().toISOString(),
      };

      console.log('[ErrorReport] Report submitted:', report);

      Alert.alert(
        'Thank You',
        'Your error report has been submitted. We will investigate the issue.',
        [
          {
            text: 'OK',
            onPress: () => {
              setDescription('');
              onClose();
            },
          },
        ]
      );
    } catch (err) {
      console.error('[ErrorReport] Failed to submit report:', err);
      Alert.alert('Error', 'Failed to submit error report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Report Error</Text>

          {error && (
            <View style={styles.errorInfo}>
              <Text style={styles.errorLabel}>Error Type:</Text>
              <Text style={styles.errorValue}>{error.type}</Text>
              <Text style={styles.errorLabel}>Message:</Text>
              <Text style={styles.errorValue}>{error.message}</Text>
            </View>
          )}

          <Text style={styles.label}>What happened?</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you were doing when the error occurred..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.note}>
            Diagnostic information including crash logs will be included with your report.
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  errorInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  errorValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
