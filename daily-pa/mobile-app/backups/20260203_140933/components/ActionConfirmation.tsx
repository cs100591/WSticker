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
  const isTask = action.type === 'task' || action.type === 'todo';
  const isExpense = action.type === 'expense';
  const isCalendar = action.type === 'calendar';

  const renderTaskDetails = () => (
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
    </View>
  );

  const renderExpenseDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <Ionicons name="cash-outline" size={20} color="#666" />
        <Text style={styles.detailLabel}>Amount:</Text>
        <Text style={styles.detailValue}>¥{action.data.amount?.toFixed(2) || '0.00'}</Text>
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
    </View>
  );

  const renderCalendarDetails = () => (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={20} color="#666" />
        <Text style={styles.detailLabel}>Event:</Text>
        <Text style={styles.detailValue}>{action.data.title || 'Untitled Event'}</Text>
      </View>

      {action.data.date && (
        <View style={styles.detailRow}>
          <Ionicons name="today-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{action.data.date}</Text>
        </View>
      )}

      {action.data.startTime && (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>
            {action.data.startTime}{action.data.endTime ? ` - ${action.data.endTime}` : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const getIcon = () => {
    if (isTask) return 'checkbox';
    if (isExpense) return 'wallet';
    if (isCalendar) return 'calendar';
    return 'help-circle';
  };

  const getTitle = () => {
    if (isTask) return 'Create Task';
    if (isExpense) return 'Record Expense';
    if (isCalendar) return 'Add Event';
    return 'Action';
  };

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
              name={getIcon()}
              size={32}
              color="#007AFF"
            />
            <Text style={styles.title}>{getTitle()}</Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.subtitle}>
              I've extracted the following information. Would you like me to proceed?
            </Text>

            {isTask && renderTaskDetails()}
            {isExpense && renderExpenseDetails()}
            {isCalendar && renderCalendarDetails()}
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
