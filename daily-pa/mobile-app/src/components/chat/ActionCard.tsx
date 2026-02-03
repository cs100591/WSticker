/**
 * Modern Action Card Component
 * Beautiful cards for AI action suggestions with full editing capabilities
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionCardProps {
  type: 'task' | 'calendar' | 'expense';
  title: string;
  subtitle?: string;
  data: Record<string, any>;
  onConfirm: (data: Record<string, any>) => void;
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

// Priority options for tasks
const priorities = [
  { key: 'high', color: '#EF4444', label: 'High', icon: 'arrow-up' },
  { key: 'medium', color: '#F59E0B', label: 'Medium', icon: 'ellipse' },
  { key: 'low', color: '#3B82F6', label: 'Low', icon: 'arrow-down' },
];

// Task colors
const taskColors = [
  { key: 'yellow', color: '#F59E0B', label: 'Yellow' },
  { key: 'blue', color: '#3B82F6', label: 'Blue' },
  { key: 'pink', color: '#EC4899', label: 'Pink' },
  { key: 'green', color: '#10B981', label: 'Green' },
  { key: 'purple', color: '#8B5CF6', label: 'Purple' },
  { key: 'orange', color: '#F97316', label: 'Orange' },
];

// Task icons
const taskIcons = [
  { key: 'document-text-outline', label: 'Task' },
  { key: 'cart-outline', label: 'Shopping' },
  { key: 'briefcase-outline', label: 'Work' },
  { key: 'walk-outline', label: 'Walk' },
  { key: 'call-outline', label: 'Call' },
  { key: 'mail-outline', label: 'Email' },
  { key: 'flag-outline', label: 'Flag' },
  { key: 'star-outline', label: 'Star' },
];

// Calendar colors
const calendarColors = [
  { key: '#3B82F6', label: 'Blue' },
  { key: '#10B981', label: 'Green' },
  { key: '#F59E0B', label: 'Orange' },
  { key: '#EF4444', label: 'Red' },
  { key: '#8B5CF6', label: 'Purple' },
  { key: '#EC4899', label: 'Pink' },
  { key: '#06B6D4', label: 'Cyan' },
  { key: '#84CC16', label: 'Lime' },
];

// Expense categories
const expenseCategories = [
  { key: 'food', icon: 'fast-food-outline', label: 'Food', color: '#F97316' },
  { key: 'transport', icon: 'car-outline', label: 'Transport', color: '#3B82F6' },
  { key: 'shopping', icon: 'bag-outline', label: 'Shopping', color: '#EC4899' },
  { key: 'entertainment', icon: 'game-controller-outline', label: 'Fun', color: '#8B5CF6' },
  { key: 'bills', icon: 'document-text-outline', label: 'Bills', color: '#F59E0B' },
  { key: 'other', icon: 'cube-outline', label: 'Other', color: '#6B7280' },
];

// Time options
const timeOptions = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
];

export const ActionCard: React.FC<ActionCardProps> = ({
  type,
  title,
  subtitle,
  data: initialData,
  onConfirm,
  onCancel,
  status = 'pending',
}) => {
  const config = typeConfig[type];
  const [data, setData] = useState(initialData);
  
  // Get upcoming dates
  const getUpcomingDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push({
        full: `${year}-${month}-${day}`,
        day: d.getDate(),
        weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
      });
    }
    return dates;
  };
  const upcomingDates = getUpcomingDates();
  
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
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Editing options based on type */}
      {type === 'task' && (
        <>
          {/* Priority */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.priorityBtn,
                    data.priority === p.key && { 
                      backgroundColor: p.color + '15',
                      borderColor: p.color 
                    }
                  ]}
                  onPress={() => setData({ ...data, priority: p.key })}
                >
                  <Ionicons 
                    name={p.icon as any} 
                    size={14} 
                    color={data.priority === p.key ? p.color : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.priorityLabel,
                    data.priority === p.key && { color: p.color }
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.iconRow}>
                {taskIcons.map(icon => (
                  <TouchableOpacity
                    key={icon.key}
                    style={[
                      styles.iconBtn,
                      data.emoji === icon.key && { 
                        backgroundColor: '#3B82F6' + '15',
                        borderColor: '#3B82F6' 
                      }
                    ]}
                    onPress={() => setData({ ...data, emoji: icon.key })}
                  >
                    <Ionicons 
                      name={icon.key as any} 
                      size={22} 
                      color={data.emoji === icon.key ? '#3B82F6' : '#64748B'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      {type === 'expense' && (
        <View style={styles.optionsSection}>
          <Text style={styles.optionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {expenseCategories.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryBtn,
                    data.category === cat.key && { 
                      backgroundColor: cat.color + '15',
                      borderColor: cat.color 
                    }
                  ]}
                  onPress={() => setData({ ...data, category: cat.key })}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={18} 
                    color={data.category === cat.key ? cat.color : '#64748B'} 
                  />
                  <Text style={[
                    styles.categoryLabel,
                    data.category === cat.key && { color: cat.color }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {type === 'calendar' && (
        <>
          {/* Color */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorRow}>
                {calendarColors.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c.key },
                      data.color === c.key && styles.colorCircleSelected
                    ]}
                    onPress={() => setData({ ...data, color: c.key })}
                  >
                    {data.color === c.key && (
                      <Ionicons name="checkmark" size={18} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Date */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dateRow}>
                {upcomingDates.map((d, i) => (
                  <TouchableOpacity
                    key={d.full}
                    style={[
                      styles.dateBtn,
                      data.date === d.full && { backgroundColor: '#3B82F6', borderColor: '#3B82F6' }
                    ]}
                    onPress={() => setData({ ...data, date: d.full })}
                  >
                    <Text style={[
                      styles.dateWeekday,
                      data.date === d.full && { color: '#FFF' }
                    ]}>
                      {i === 0 ? 'Today' : d.weekday}
                    </Text>
                    <Text style={[
                      styles.dateNum,
                      data.date === d.full && { color: '#FFF' }
                    ]}>
                      {d.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Time - Picker Box Style */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionLabel}>Time</Text>
            <View style={styles.timePickerBox}>
              <TouchableOpacity 
                style={styles.timePickerField}
                onPress={() => {
                  // Show time picker modal or native picker
                  const currentIndex = timeOptions.indexOf(data.startTime || '09:00');
                  const nextIndex = (currentIndex + 1) % timeOptions.length;
                  const newTime = timeOptions[nextIndex];
                  const [h, m] = newTime.split(':').map(Number);
                  const endH = (h + 1) % 24;
                  setData({ 
                    ...data, 
                    startTime: newTime,
                    endTime: `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                  });
                }}
              >
                <Ionicons name="time-outline" size={20} color="#64748B" />
                <Text style={styles.timePickerText}>
                  {data.startTime || '09:00'} - {data.endTime || '10:00'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </>
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
          onPress={() => onConfirm(data)}
        >
          <Ionicons name="checkmark" size={18} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.confirmText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelledContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  optionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#1E293B',
    transform: [{ scale: 1.1 }],
  },
  timePickerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timePickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timePickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginLeft: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  categoryBtn: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 60,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  dateBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 50,
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
  content: {
    flex: 1,
  },
});
