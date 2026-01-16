/**
 * Todos Screen - Tiimo-inspired design
 * With emoji selection, notes, and calendar features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Todo, TodoPriority, useLocalStore } from '@/models';
import { todoService } from '@/services/TodoService';
import { useLanguageStore, translations } from '@/store/languageStore';

const TASK_EMOJIS = ['📝', '🛒', '💼', '🏃', '📞', '✉️', '🎯', '⭐', '🍽️', '💊', '🚗', '📚'];

export const TodosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const lang = useLanguageStore((state) => state.getEffectiveLanguage());
  const t = translations[lang];

  const todos = useLocalStore((state) => state.todos);
  const setTodos = useLocalStore((state) => state.setTodos);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TodoPriority>('medium');
  const [selectedEmoji, setSelectedEmoji] = useState('📝');

  // Notes Modal
  const [notesModal, setNotesModal] = useState<{ id: string; title: string; notes: string } | null>(null);
  const [notesText, setNotesText] = useState('');

  // Calendar Modal
  const [calendarModal, setCalendarModal] = useState<{ id: string; title: string } | null>(null);
  const [dateValue, setDateValue] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const [expandedSections, setExpandedSections] = useState({ high: true, medium: true, low: true, completed: false });
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const userId = 'mock-user-id';

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [])
  );

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await todoService.getTodos({ userId, sortBy: 'createdAt', sortOrder: 'desc' });
      setTodos(data);
    } catch { Alert.alert('Error', 'Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  };

  const handleToggle = async (id: string) => {
    try {
      await todoService.toggleTodoStatus(id);
      await loadTodos();
    } catch { Alert.alert('Error', 'Failed to update'); }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return Alert.alert('Error', 'Enter a task title');
    try {
      await todoService.createTodo({
        title: newTitle.trim(),
        priority: newPriority,
        userId,
        emoji: selectedEmoji,
      });
      setNewTitle('');
      setNewPriority('medium');
      setSelectedEmoji('📝');
      setShowAddModal(false);
      await loadTodos();
    } catch { Alert.alert('Error', 'Failed to add task'); }
  };

  const handleSaveNotes = async () => {
    if (!notesModal) return;
    try {
      await todoService.updateTodo(notesModal.id, { description: notesText });
      if (notesText.trim()) setExpandedNotes(prev => new Set(prev).add(notesModal.id));
      setNotesModal(null);
      await loadTodos();
    } catch { Alert.alert('Error', 'Failed to save notes'); }
  };

  const handleAddToCalendar = () => {
    if (!calendarModal) return;
    const dateStr = dateValue.toISOString().split('T')[0];
    const timeStr = dateValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    Alert.alert('Success', `Added "${calendarModal.title}" to calendar at ${dateStr} ${timeStr}`);
    setCalendarModal(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // On Android, dismissing the picker returns event.type === 'dismissed'
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDateValue(selectedDate);
    }
  };

  const showDatePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const showTimePicker = () => {
    setPickerMode('time');
    setShowPicker(true);
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const active = todos.filter(t => t.status === 'active');
  const completed = todos.filter(t => t.status === 'completed');
  const byPriority = {
    high: active.filter(t => t.priority === 'high'),
    medium: active.filter(t => t.priority === 'medium'),
    low: active.filter(t => t.priority === 'low'),
  };

  const priorityConfig = {
    high: { indicator: '▲', color: '#EF4444', bg: '#FEF2F2', label: t.high },
    medium: { indicator: '●', color: '#F59E0B', bg: '#FFFBEB', label: t.medium },
    low: { indicator: '▼', color: '#3B82F6', bg: '#EFF6FF', label: t.low },
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  }

  const renderTask = (todo: Todo, config: typeof priorityConfig.high) => {
    const hasNotes = todo.description && todo.description.trim().length > 0;
    const isExpanded = expandedNotes.has(todo.id);

    return (
      <View key={todo.id}>
        <View style={[styles.taskCard, { backgroundColor: config.bg }]}>
          {/* Expand button for notes */}
          {hasNotes && (
            <TouchableOpacity style={styles.expandBtn} onPress={() => toggleNotes(todo.id)}>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
          )}

          {/* Emoji */}
          <View style={styles.taskEmoji}>
            <Text style={styles.emojiText}>{todo.emoji || '📝'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.taskTitle} numberOfLines={1}>{todo.title}</Text>

          {/* Notes indicator */}
          {hasNotes && !isExpanded && <Ionicons name="document-text-outline" size={16} color="#9CA3AF" style={{ marginRight: 4 }} />}

          {/* Action buttons */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setNotesModal({ id: todo.id, title: todo.title, notes: todo.description || '' });
              setNotesText(todo.description || '');
            }}
          >
            <Ionicons name="create-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setCalendarModal({ id: todo.id, title: todo.title });
              setDateValue(new Date());
              setShowPicker(false);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Checkbox */}
          <TouchableOpacity style={styles.checkbox} onPress={() => handleToggle(todo.id)}>
            <View style={styles.checkboxInner} />
          </TouchableOpacity>
        </View>

        {/* Expanded notes */}
        {isExpanded && hasNotes && (
          <View style={styles.notesExpanded}>
            <Text style={styles.notesExpandedText}>{todo.description}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.progressText}>🎯 {completed.length}/{todos.length}</Text>
        </View>
        <Text style={styles.headerTitle}>{t.tasks}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Priority Sections */}
        {(['high', 'medium', 'low'] as TodoPriority[]).map(priority => {
          const config = priorityConfig[priority];
          const items = byPriority[priority];
          if (items.length === 0) return null;

          return (
            <View key={priority} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(priority)}>
                <View style={styles.sectionLeft}>
                  <Text style={[styles.indicator, { color: config.color }]}>{config.indicator}</Text>
                  <Text style={[styles.sectionLabel, { color: config.color }]}>
                    {config.label} ({items.length})
                  </Text>
                </View>
                <Text style={styles.chevron}>{expandedSections[priority] ? '∧' : '∨'}</Text>
              </TouchableOpacity>

              {expandedSections[priority] && items.map(todo => renderTask(todo, config))}
            </View>
          );
        })}

        {/* Completed Section */}
        {completed.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('completed')}>
              <Text style={styles.completedLabel}>{t.completed} ({completed.length})</Text>
              <Text style={styles.chevron}>{expandedSections.completed ? '∧' : '∨'}</Text>
            </TouchableOpacity>

            {expandedSections.completed && completed.map(todo => (
              <TouchableOpacity
                key={todo.id}
                style={[styles.taskCard, styles.completedCard]}
                onPress={() => handleToggle(todo.id)}
              >
                <View style={[styles.taskEmoji, styles.completedEmoji]}>
                  <Text style={styles.emojiText}>✓</Text>
                </View>
                <Text style={[styles.taskTitle, styles.completedTitle]}>{todo.title}</Text>
                <View style={[styles.checkbox, styles.checkboxDone]}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {todos.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>{t.noTasks}</Text>
            <Text style={styles.emptySubtext}>{t.tapToAdd}</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add-outline" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t.newTask}</Text>

              {/* Emoji Picker */}
              <Text style={styles.modalLabel}>{t.icon}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiPicker}>
                {TASK_EMOJIS.map((emoji, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.emojiOption, selectedEmoji === emoji && styles.emojiSelected]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>{t.task}</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder={t.whatToDo}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.modalLabel}>{t.priority}</Text>
              <View style={styles.priorityRow}>
                {(['high', 'medium', 'low'] as TodoPriority[]).map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, newPriority === p && { backgroundColor: priorityConfig[p].bg, borderColor: priorityConfig[p].color }]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text style={[styles.priorityIndicator, { color: priorityConfig[p].color }]}>{priorityConfig[p].indicator}</Text>
                    <Text style={[styles.priorityText, { color: priorityConfig[p].color }]}>{priorityConfig[p].label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                  <Text style={styles.saveText}>{t.addTask}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={!!notesModal} transparent animationType="fade" onRequestClose={() => setNotesModal(null)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.addNotes}</Text>
            <View style={styles.taskPreview}>
              <Text style={styles.taskPreviewText}>{notesModal?.title}</Text>
            </View>
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              value={notesText}
              onChangeText={setNotesText}
              placeholder={t.enterNotes}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNotesModal(null)}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNotes}>
                <Text style={styles.saveText}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={!!calendarModal} transparent animationType="fade" onRequestClose={() => setCalendarModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.addToCalendar}</Text>
            <View style={styles.taskPreview}>
              <Text style={styles.taskPreviewText}>{calendarModal?.title}</Text>
            </View>

            <Text style={styles.modalLabel}>{t.date}</Text>
            <TouchableOpacity style={styles.modalInput} onPress={showDatePicker}>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>
                {dateValue.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>{t.time}</Text>
            <TouchableOpacity style={styles.modalInput} onPress={showTimePicker}>
              <Text style={{ fontSize: 16, color: '#1F2937' }}>
                {dateValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {/* Date Picker (Inline for iOS, specific logic for consistency) */}
            {showPicker && Platform.OS === 'ios' && (
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <DateTimePicker
                  value={dateValue}
                  mode={pickerMode}
                  display="spinner"
                  onChange={onDateChange}
                  textColor="#000"
                />
                <TouchableOpacity
                  style={{ padding: 10, alignSelf: 'flex-end' }}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={{ color: '#8B5CF6', fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Android Picker is imperative, handled by state + conditional render below */}
            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={dateValue}
                mode={pickerMode}
                display="default"
                onChange={onDateChange}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCalendarModal(null)}>
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddToCalendar}>
                <Text style={styles.saveText}>{t.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.tabSpacer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  headerLeft: { width: 70 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { fontSize: 13, color: '#6B7280' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 18 },
  addHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  addHeaderBtnText: { fontSize: 24, color: '#6B7280', marginTop: -2 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 160 },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  indicator: { fontSize: 12, marginRight: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 14, color: '#9CA3AF' },
  completedLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', flex: 1 },
  taskCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 16 },
  completedCard: { backgroundColor: '#F9FAFB' },
  expandBtn: { padding: 4, marginRight: 4 },
  expandIcon: { fontSize: 10, color: '#9CA3AF' },
  taskEmoji: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  completedEmoji: { backgroundColor: '#E5E7EB' },
  emojiText: { fontSize: 20 },
  taskTitle: { flex: 1, fontSize: 15, color: '#1F2937', fontWeight: '500' },
  completedTitle: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  notesIndicator: { fontSize: 14, marginRight: 4 },
  actionBtn: { padding: 6 },
  actionIcon: { fontSize: 18, opacity: 0.5 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  checkboxInner: {},
  checkboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  notesExpanded: { marginHorizontal: 16, marginBottom: 8, marginLeft: 78, padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  notesExpandedText: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabIcon: { fontSize: 28, color: '#FFF', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 8 },
  taskPreview: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 12 },
  taskPreviewText: { fontSize: 14, color: '#6B7280' },
  emojiPicker: { marginBottom: 8 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  emojiSelected: { backgroundColor: '#EDE9FE', borderWidth: 2, borderColor: '#8B5CF6' },
  emojiOptionText: { fontSize: 22 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  notesInput: { minHeight: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priorityOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB' },
  priorityIndicator: { fontSize: 12, marginRight: 6 },
  priorityText: { fontSize: 13, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  tabSpacer: { height: 80 },
});
