/**
 * Modern Action Card Component
 * Beautiful cards for AI action suggestions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionCardProps {
  type: 'task' | 'calendar' | 'expense';
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  onConfirm: () => void;
  onCancel: () => void;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

const typeConfig = {
  task: {
    icon: 'checkbox-outline',
    color: '#10B981',
    bgColor: '#D1FAE5',
    label: 'Task',
  },
  calendar: {
    icon: 'calendar-outline',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    label: 'Event',
  },
  expense: {
    icon: 'wallet-outline',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: 'Expense',
  },
};

export const ActionCard: React.FC<ActionCardProps> = ({
  type,
  title,
  subtitle,
  onConfirm,
  onCancel,
  status = 'pending',
}) => {
  const config = typeConfig[type];
  
  if (status === 'confirmed') {
    return (
      <View style={[styles.container, styles.confirmedContainer]}>
        <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
        <View style={styles.content}>
          <Text style={styles.confirmedTitle}>{title}</Text>
          <Text style={styles.confirmedSubtitle}>Added successfully ✓</Text>
        </View>
      </View>
    );
  }
  
  if (status === 'cancelled') {
    return (
      <View style={[styles.container, styles.cancelledContainer]}>
        <Text style={styles.cancelledText}>Cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon as any} size={24} color={config.color} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        
        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton, { backgroundColor: config.color }]}
            onPress={onConfirm}
          >
            <Ionicons name="checkmark" size={18} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.confirmText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  confirmedContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cancelledContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 6,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  confirmedSubtitle: {
    fontSize: 13,
    color: '#22C55E',
    marginTop: 2,
  },
  cancelledText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
