/**
 * Action confirmation dialog
 * Shows AI-suggested action details and allows user to confirm or cancel
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIAction } from '@/services/aiService';

interface ActionConfirmationProps {
  action: AIAction;
  onConfirm: (action: AIAction) => void;
  onCancel: () => void;
}

export const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  action,
  onConfirm,
  onCancel,
}) => {
  const renderTodoDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <Ionicons name="checkbox-outline" size={20} color="#666" />
        <Text style={styles.detailLabel}>Title:</Text>
        <Text style={styles.detailValue}>{action.data.title || 'Untitled'}</Text>
      </View>

      {action.data.priority && (
        <View style={styles.detailRow}>
          <Ionicons name="flag-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Priority:</Text>
          <Text style={styles.detailValue}>{action.data.priority}</Text>
        </View>
      )}

      {action.data.dueDate && (
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{action.data.dueDate}</Text>
        </View>
      )}

      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence:</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${action.confidence * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>{Math.round(action.confidence * 100)}%</Text>
      </View>
    </View>
  );

  const renderExpenseDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <Ionicons name="cash-outline" size={20} color="#666" />
        <Text style={styles.detailLabel}>Amount:</Text>
        <Text style={styles.detailValue}>${action.data.amount?.toFixed(2) || '0.00'}</Text>
      </View>

      {action.data.category && (
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{action.data.category}</Text>
        </View>
      )}

      {action.data.description && (
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>{action.data.description}</Text>
        </View>
      )}

      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceLabel}>Confidence:</Text>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${action.confidence * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.confidenceValue}>{Math.round(action.confidence * 100)}%</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons
              name={action.type === 'create_todo' ? 'checkbox' : 'wallet'}
              size={32}
              color="#007AFF"
            />
            <Text style={styles.title}>
              {action.type === 'create_todo' ? 'Create Todo' : 'Record Expense'}
            </Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              I've extracted the following information. Would you like me to proceed?
            </Text>

            {action.type === 'create_todo' ? renderTodoDetails() : renderExpenseDetails()}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={() => onConfirm(action)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
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
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    color: '#000',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  confidenceContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
