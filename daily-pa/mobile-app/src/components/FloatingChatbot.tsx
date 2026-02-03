/**
 * Smart AI Chatbot - Enhanced with Category & Time Pickers
 * Features:
 * - Color picker for todos (like web)
 * - Category picker for expenses
 * - Time picker for calendar events
 * - Inline confirm/cancel buttons
 * - Real API integration
 */

import React, { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { useLocalStore } from '@/store/localStore';
import { supabase } from '@/services/supabase';
import { todoService } from '@/services/TodoService';
import { expenseService } from '@/services/ExpenseService';
import { calendarService } from '@/services/CalendarService';
import { InputAccessory } from './InputAccessory';
import { ChatBubble } from './chat/ChatBubble';
import { ActionCard } from './chat/ActionCard';

import { ENV } from '@/config/env';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = `${ENV.SUPABASE_URL}/functions/v1/api`;

const TASK_ICONS = [
  'document-text-outline', 'cart-outline', 'briefcase-outline',
  'walk-outline', 'call-outline', 'mail-outline',
  'flag-outline', 'star-outline', 'restaurant-outline',
  'medkit-outline', 'car-outline', 'book-outline'
];

interface ParsedAction {
  id: string;
  type: 'task' | 'calendar' | 'expense' | 'todo';
  title: string;
  data: Record<string, unknown>;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  actions?: ParsedAction[];
  followUp?: {
    type: 'todo-calendar-color';
    todoId: string;
    todoTitle: string;
  };
  image?: string;
}

interface FloatingChatbotProps {
  visible: boolean;
  onClose: () => void;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ visible, onClose }) => {
  const lang = useEffectiveLanguage();
  const t = translations[lang];

  // Helper to map app language to standard locale for DateTimePicker
  const getLocaleIdentifier = (l: string) => {
    switch (l) {
      case 'zh': return 'zh-Hans';
      case 'ms': return 'ms-MY';
      case 'ta': return 'ta-IN';
      case 'ja': return 'ja-JP';
      case 'ko': return 'ko-KR';
      case 'id': return 'id-ID';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'de': return 'de-DE';
      case 'th': return 'th-TH';
      case 'vi': return 'vi-VN';
      default: return 'en-US';
    }
  };
  const pickerLocale = getLocaleIdentifier(lang);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [pickerConfig, setPickerConfig] = useState<{
    messageId: string;
    actionId: string;
    type: 'time' | 'date';
    value: Date;
  } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Welcome message on open - simplified
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeMsg = lang === 'zh'
        ? '👋 你好！我可以帮你：\n• 添加待办事项\n• 记录支出\n• 创建日程\n\n直接告诉我你想做什么！'
        : '👋 Hi! I can help you:\n• Add todos\n• Track expenses\n• Create events\n\nJust tell me what you need!';
      setMessages([{ id: 'welcome', text: welcomeMsg, isUser: false }]);
    }
  }, [visible, lang]);

  // Keyboard height tracking for Android
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Helper to get local date string YYYY-MM-DD
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Execute action via API calls (like web version)
  const executeAction = async (action: ParsedAction): Promise<{ success: boolean; error?: string; todoId?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { type, data } = action;
      if (type === 'task' || type === 'todo') {
        const userId = session?.user?.id || 'offline-user-device';
        console.log('ExecuteAction: Creating task with userId:', userId);
        const createdTodo = await todoService.createTodo({
          title: data.title as string,
          priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
          dueDate: data.dueDate as string | undefined, // Ensure this maps correctly if string
          color: (data.color as any) || 'yellow',
          userId,
          emoji: (data.emoji as string) || (data.category as string) || 'document-text-outline',
          status: 'active',
          tags: []
        });

        return { success: true, todoId: createdTodo.id };
      } else if (type === 'expense') {
        const userId = session?.user?.id || 'offline-user-device';
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount as number;

        await expenseService.createExpense({
          userId,
          amount,
          currency: 'CNY',
          category: (data.category as any) || 'other',
          description: data.description as string || '',
          merchant: data.merchant as string || '',
          expenseDate: (data.date as string) || getLocalDate(),
          tags: []
        });
      } else if (type === 'calendar') {
        const userId = session?.user?.id || 'offline-user-device';
        console.log('ExecuteAction: Creating calendar event with userId:', userId, 'Date:', data.date);

        const eventDate = data.date as string || getLocalDate();
        const startTime = data.startTime as string || '09:00';
        const endTime = data.endTime as string || '10:00';

        // Parse date components to create proper local Date objects
        const [year, month, day] = eventDate.split('-').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        // Create Date objects in local timezone
        const startDateTime = new Date(year, month - 1, day, startHour, startMin, 0);
        const endDateTime = new Date(year, month - 1, day, endHour, endMin, 0);

        await calendarService.createEvent({
          userId,
          title: data.title as string,
          description: data.description as string || '',
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          allDay: !!data.allDay,
          color: '#3B82F6',
          source: 'local'
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Handle action confirmation (like web version)
  const handleAction = async (messageId: string, actionId: string, confirm: boolean) => {
    if (!confirm) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return { ...m, actions: m.actions.map(a => a.id === actionId ? { ...a, status: 'cancelled' as const } : a) };
      }));
      return;
    }

    const message = messages.find(m => m.id === messageId);
    const action = message?.actions?.find(a => a.id === actionId);
    if (!action) return;

    // Execute the action via API
    const result = await executeAction(action);

    // Update action status
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a =>
          a.id === actionId
            ? { ...a, status: result.success ? 'confirmed' : 'pending' as const, todoId: result.todoId }
            : a
        )
      };
    }));

    // If it's a todo and successfully created, offer calendar integration
    if (result.success && action.type === 'task' && result.todoId) {
      const todoId = result.todoId;
      const todoTitle = action.data.title as string;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          isUser: false,
          text: lang === 'zh'
            ? `✓ 待办已创建！`
            : `✓ Todo created!`,
          followUp: {
            type: 'todo-calendar-color',
            todoId,
            todoTitle,
          },
        }]);
      }, 300);
    }

    // Show success/error message
    if (result.success) {
      Alert.alert('✅', t.actionSuccess);
    } else {
      Alert.alert('❌', `${t.actionFailed}: ${result.error}`);
    }
  };

  // Handle add to calendar for todos
  const handleAddToCalendar = async (todoId: string, todoTitle: string, messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const today = new Date().toISOString().split('T')[0];
      await fetch(`${API_URL}/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: todoTitle,
          startTime: `${today}T09:00:00`,
          endTime: `${today}T10:00:00`,
          allDay: false,
          color: '#3B82F6',
        }),
      });

      // Update the message to remove followUp
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, followUp: undefined } : m
      ));

      Alert.alert('✅', t.actionSuccess);
    } catch (error) {
      Alert.alert('❌', t.actionFailed);
    }
  };

  // Handle category selection for expenses
  const handleCategorySelection = (messageId: string, actionId: string, category: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => a.id === actionId ? { ...a, data: { ...a.data, category } } : a)
      };
    }));
  };

  // Handle time selection for calendar events
  const handleTimeSelection = (messageId: string, actionId: string, time: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => a.id === actionId ? { ...a, data: { ...a.data, startTime: time, endTime: addHour(time) } } : a)
      };
    }));
  };

  const handleIconSelection = (messageId: string, actionId: string, icon: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => a.id === actionId ? { ...a, data: { ...a.data, emoji: icon, category: icon } } : a)
      };
    }));
  };

  // Helper function to add 1 hour to time
  const addHour = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Get action icon (like web version)
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'task': case 'todo': return 'list';
      case 'expense': return 'card';
      case 'calendar': return 'calendar';
      default: return 'help-circle';
    }
  };

  // Get action summary (like web version)
  const getActionSummary = (action: ParsedAction) => {
    const { type, data } = action;
    if (type === 'task' || type === 'todo') return String(data.title || '');
    if (type === 'expense') {
      const currency = lang === 'zh' ? '¥' : '$';
      const catKey = String(data.category || 'other');
      const catLabel = expenseCategories.find(c => c.key === catKey)?.label || catKey;
      return `${currency}${data.amount || 0} • ${catLabel}`;
    }
    if (type === 'calendar') return `${data.title || ''}${data.startTime ? ' • ' + data.startTime : ''}`;
    return '';
  };

  // Common time slots for calendar events
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Expense categories
  const expenseCategories = [
    { key: 'food', label: lang === 'zh' ? '餐饮' : 'Food', icon: 'pizza' },
    { key: 'transport', label: lang === 'zh' ? '交通' : 'Transport', icon: 'car' },
    { key: 'shopping', label: lang === 'zh' ? '购物' : 'Shopping', icon: 'basket' },
    { key: 'entertainment', label: lang === 'zh' ? '娱乐' : 'Entertainment', icon: 'game-controller' },
    { key: 'bills', label: lang === 'zh' ? '账单' : 'Bills', icon: 'document' },
    { key: 'health', label: lang === 'zh' ? '医疗' : 'Health', icon: 'medkit' },
    { key: 'education', label: lang === 'zh' ? '教育' : 'Education', icon: 'school' },
    { key: 'other', label: lang === 'zh' ? '其他' : 'Other', icon: 'more' },
  ];

  // Render action card (EXACTLY like web version with additional pickers)
  const renderActionCard = (action: ParsedAction, messageId: string) => {
    const isTodo = action.type === 'task' || action.type === 'todo';
    const isExpense = action.type === 'expense';
    const isCalendar = action.type === 'calendar';

    // Priority colors for tasks
    const priorities = [
      { key: 'high', color: '#EF4444', label: 'High', emoji: '🔴' }, // Red
      { key: 'medium', color: '#3B82F6', label: 'Medium', emoji: '🔵' }, // Blue
      { key: 'low', color: '#9CA3AF', label: 'Low', emoji: '⚪️' }, // Gray
    ];

    // Generate upcoming dates for calendar
    const getUpcomingDates = () => {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Use local date string YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const full = `${year}-${month}-${day}`;

        dates.push({
          full,
          day: d.getDate(),
          weekday: lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'][d.getDay()] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
        });
      }
      return dates;
    };
    const upcomingDates = getUpcomingDates();

    return (
      <View
        key={action.id}
        style={[
          styles.actionCard,
          action.status === 'confirmed' && styles.confirmedCard,
          action.status === 'cancelled' && styles.cancelledCard,
          action.status === 'pending' && styles.pendingCard,
        ]}
      >
        {/* Main action row - EXACTLY like web version */}
        <View style={[
          styles.actionRow,
          action.status === 'confirmed' && styles.confirmedRow,
          action.status === 'cancelled' && styles.cancelledRow,
          action.status === 'pending' && styles.pendingRow,
        ]}>
          <View style={[
            styles.actionIcon,
            action.status === 'confirmed' && styles.confirmedIcon,
            action.status === 'cancelled' && styles.cancelledIcon,
            action.status === 'pending' && styles.pendingIcon,
          ]}>
            <Ionicons name={getActionIcon(action.type)} size={14} />
          </View>

          <Text style={[
            styles.actionSummary,
            action.status === 'confirmed' && styles.confirmedText,
            action.status === 'cancelled' && styles.cancelledText,
            action.status === 'pending' && styles.pendingText,
          ]} numberOfLines={1}>
            {getActionSummary(action)}
          </Text>

          {/* Inline buttons - EXACTLY like web version */}
          {action.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleAction(messageId, action.id, false)}
              >
                <Ionicons name="close" size={14} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleAction(messageId, action.id, true)}
              >
                <Ionicons name="checkmark" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}

          {/* Confirmed status */}
          {action.status === 'confirmed' && (
            <Ionicons name="checkmark" size={14} color="#10B981" />
          )}
        </View>

        {/* Additional pickers based on action type */}
        {action.status === 'pending' && (
          <>
            {/* Priority/Color picker for todos */}
            {isTodo && (
              <View style={styles.colorPicker}>
                <Text style={styles.colorLabel}>{t.priority}:</Text>
                <View style={styles.colorOptions}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p.key}
                      style={[
                        styles.colorBtn,
                        action.data.priority === p.key && { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }
                      ]}
                      onPress={() => {
                        // Update priority
                        const updatedAction = { ...action, data: { ...action.data, priority: p.key } };
                        setMessages(prev => prev.map(m => {
                          if (m.id !== messageId || !m.actions) return m;
                          return {
                            ...m,
                            actions: m.actions.map(a => a.id === action.id ? updatedAction : a)
                          };
                        }));
                      }}
                    >
                      <Text style={styles.colorEmoji}>{p.emoji}</Text>
                      <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Task Icon/Category Picker */}
            {isTodo && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Category:</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={TASK_ICONS}
                  keyExtractor={item => item}
                  renderItem={({ item: icon }) => (
                    <TouchableOpacity
                      onPress={() => handleIconSelection(messageId, action.id, icon)}
                      style={[
                        styles.chip,
                        { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0, marginRight: 8, borderRadius: 12, backgroundColor: '#F3F4F6' },
                        (action.data.emoji === icon || (!action.data.emoji && icon === 'document-text-outline')) && { backgroundColor: '#8B5CF6' }
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={20}
                        color={(action.data.emoji === icon || (!action.data.emoji && icon === 'document-text-outline')) ? '#FFF' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  )}
                  style={{ marginBottom: 8 }}
                />
              </View>
            )}


            {/* Category picker for expenses */}
            {isExpense && (
              <>
                <View style={styles.colorPicker}>
                  <Text style={styles.pickerLabel}>Date:</Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                      const currentDateStr = (action.data.date as string) || getLocalDate();
                      const d = new Date(currentDateStr);
                      setPickerConfig({
                        messageId,
                        actionId: action.id,
                        type: 'date',
                        value: !isNaN(d.getTime()) ? d : new Date(),
                      });
                    }}
                  >
                    <Text style={{ fontSize: 13, color: '#374151', marginRight: 8 }}>
                      {action.data.date as string || getLocalDate()}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.colorPicker}>
                  <Text style={styles.pickerLabel}>Shop:</Text>
                  <TextInput
                    style={{ flex: 1, height: 28, fontSize: 13, color: '#374151', padding: 0 }}
                    value={action.data.merchant as string || ''}
                    placeholder="Enter shop name..."
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(text) => {
                      setMessages(prev => prev.map(m => {
                        if (m.id !== messageId || !m.actions) return m;
                        return {
                          ...m,
                          actions: m.actions.map(a => a.id === action.id ? { ...a, data: { ...a.data, merchant: text } } : a)
                        };
                      }));
                    }}
                  />
                </View>
                <View style={styles.categoryPicker}>
                  <Text style={styles.pickerLabel}>{t.category}:</Text>
                  <View style={styles.categoryGrid}>
                    {expenseCategories.map((category) => (
                      <TouchableOpacity
                        key={category.key}
                        style={[
                          styles.categoryBtn,
                          action.data.category === category.key && styles.categorySelected
                        ]}
                        onPress={() => handleCategorySelection(messageId, action.id, category.key)}
                      >
                        <Ionicons name={category.icon as any} size={16} color={action.data.category === category.key ? "#FFF" : "#6B7280"} />
                        <Text style={[
                          styles.categoryLabel,
                          action.data.category === category.key && styles.categoryLabelSelected
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Date & Time picker for calendar events */}
            {isCalendar && (
              <View>
                {/* Date Picker */}
                <View style={styles.timePicker}>
                  <Text style={styles.pickerLabel}>{t.date}:</Text>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={upcomingDates}
                    keyExtractor={item => item.full}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dateBtn,
                          (action.data.date === item.full || (!action.data.date && item.full === getLocalDate())) && styles.timeSelected
                        ]}
                        onPress={() => {
                          const updatedAction = { ...action, data: { ...action.data, date: item.full } };
                          setMessages(prev => prev.map(m => {
                            if (m.id !== messageId || !m.actions) return m;
                            return { ...m, actions: m.actions.map(a => a.id === action.id ? updatedAction : a) };
                          }));
                        }}
                      >
                        <Text style={[styles.dateDay, (action.data.date === item.full || (!action.data.date && item.full === getLocalDate())) && styles.timeLabelSelected]}>{item.weekday}</Text>
                        <Text style={[styles.dateNum, (action.data.date === item.full || (!action.data.date && item.full === getLocalDate())) && styles.timeLabelSelected]}>{item.day}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ marginBottom: 8 }}
                  />
                </View>

                {/* Time Picker */}
                {/* Time Picker */}
                <View style={[styles.timePicker, { borderTopWidth: 0, paddingTop: 0 }]}>
                  <Text style={styles.pickerLabel}>{t.time}:</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => {
                      const startTime = typeof action.data.startTime === 'string' ? action.data.startTime : '09:00';
                      const [h, m] = startTime.split(':').map(Number);
                      const date = new Date(); date.setHours(h || 9); date.setMinutes(m || 0);
                      setPickerConfig({ messageId, actionId: action.id, type: 'time', value: date });
                    }}
                  >
                    <Text style={styles.timeLabel}>{String(action.data.startTime || '09:00')}</Text>
                    <Ionicons name="time-outline" size={16} color="#666" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )
        }
      </View >
    );
  };

  // Voice interaction
  const handleVoiceInteraction = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      // 1. Clean up any existing recording first
      if (recording) {
        try { await recording.stopAndUnloadAsync(); } catch (e) { }
        setRecording(null);
      }

      // 2. Request permissions
      const permission = await Audio.requestPermissionsAsync();

      if (permission.status === 'granted') {
        try {
          // 3. Set audio mode (Simplest possible config for iOS Simulator)
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          // 4. Create recording with standard options
          // Using HIGH_QUALITY preset is generally safer than manual config on Expo 50+
          const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );

          setRecording(newRecording);
          setIsRecording(true);
        } catch (err) {
          console.error('Recording failed:', err);
          // Last resort fallback
          try {
            await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
            const { recording: fallbackRec } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.LOW_QUALITY
            );
            setRecording(fallbackRec);
            setIsRecording(true);
          } catch (finalErr) {
            Alert.alert(lang === 'zh' ? '录音失败' : 'Recording Failed', 'Simulator microphone issue?');
          }
        }
      } else {
        Alert.alert(lang === 'zh' ? '需要麦克风权限' : 'Microphone permission needed');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert(lang === 'zh' ? '录音启动失败' : 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI');

      // Check for Client-side OpenAI Key first
      // PRIORITIZE process.env which is injected by our build scripts
      const openAIKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || Constants.expoConfig?.extra?.openaiApiKey;

      if (openAIKey && !openAIKey.startsWith('sk-')) {
        console.warn('OpenAI Key might be invalid (missing sk- prefix)', openAIKey?.substring(0, 5));
      }

      // Check if key is valid (not a template literal placeholder and starts with sk-)
      const isValidKey = openAIKey && openAIKey.startsWith('sk-') && !openAIKey.startsWith('$');

      if (isValidKey) {
        console.log('Using direct client-side OpenAI transcription');
        try {
          // Use m4a for both platforms as we configured it explicitly above
          const formData = new FormData();
          formData.append('file', {
            uri,
            type: 'audio/m4a',
            name: 'audio.m4a',
          } as any);
          formData.append('model', 'whisper-1');
          formData.append('language', lang);

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
              'Content-Type': 'multipart/form-data',
            },
            body: formData,
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error('OpenAI Transcribe Error:', response.status, errText);
            throw new Error(`OpenAI API Error: ${response.status}`);
          }


          const data = await response.json();
          if (data.text) {
            sendMessage(data.text);
          } else {
            throw new Error('No text in response');
          }
          return; // Success!
        } catch (error) {
          console.warn('Direct transcription failed:', error);
          // Fall through to backend/demo
        }
      }

      // Fallback: Use Backend API
      console.log('Reading audio file from:', uri);
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      try {
        const response = await fetch(`${API_URL}?route=/voice/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : 'Bearer guest-user',
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: lang,
          })
        });

        if (!response.ok) {
          // Try to get the actual error message
          let errorMessage = 'API request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          console.warn('Transcription API error:', errorMessage);

          // Graceful fallback for API errors (e.g. Forbidden/Quota)
          // Instead of showing a technical error, encourage using the keyboard microphone which is reliable.
          Alert.alert(
            lang === 'zh' ? '语音服务暂时不可用' : 'Voice Service Unavailable',
            lang === 'zh'
              ? '抱歉，无法连接到语音服务。请通过键盘输入或使用键盘上的麦克风按钮。'
              : 'Sorry, voice transcription is currently unavailable. Please type your message or use the microphone button on your keyboard.',
            [{ text: 'OK' }]
          );
          return;
        }

        const data = await response.json();
        if (data.text) {
          sendMessage(data.text);
        } else {
          Alert.alert(lang === 'zh' ? '未能识别语音' : 'Could not recognize speech');
        }
      } catch (fetchError) {
        console.warn('Network request failed details:', fetchError);
        Alert.alert(
          lang === 'zh' ? '网络错误' : 'Network Error',
          lang === 'zh' ? '无法连接到语音服务' : 'Could not connect to voice service'
        );
      }

    } catch (error) {
      console.warn('Voice processing error:', error);
    }
  };

  // Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert(lang === 'zh' ? '需要相机权限' : 'Camera permission needed');
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
      if (!result.canceled && result.assets[0]) processReceipt(result.assets[0].uri);
    } catch (e) { }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert(lang === 'zh' ? '需要相册权限' : 'Photo library permission needed');
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
      if (!result.canceled && result.assets[0]) processReceipt(result.assets[0].uri);
    } catch (e) { }
  };

  const processReceipt = async (uri: string) => {
    setMessages(prev => [...prev, { id: `user_${Date.now()}`, text: '📷 Receipt', isUser: true, image: uri }]);
    setIsLoading(true);

    const apiKey = Constants.expoConfig?.extra?.googleCloudApiKey || process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      // Fallback to simulation with alert
      Alert.alert(
        lang === 'zh' ? 'Google Cloud API Key 未配置' : 'Google Cloud API Key Missing',
        lang === 'zh'
          ? '请在 .env 中设置 EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY 以使用 Google Vision。'
          : 'Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in .env to use Google Vision.'
      );

      setTimeout(() => {
        const amount = Math.floor(Math.random() * 80) + 20;
        const categories = ['food', 'shopping', 'transport', 'other'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          text: lang === 'zh' ? `识别到收据：¥${amount} (${category})\n确认添加这笔支出吗？` : `Receipt detected: $${amount} (${category})\nAdd this expense?`,
          isUser: false,
          actions: [{ id: `${Date.now()}_receipt`, type: 'expense', title: 'Receipt', data: { amount, category, date: getLocalDate() }, status: 'pending' }],
        }]);
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      const base64Image = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      if (!base64Image) throw new Error('Failed to read image');

      // Call Google Cloud Vision API
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      });

      const data = await response.json();
      console.log('Google Vision Response:', JSON.stringify(data));
      if (data.error) throw new Error(data.error.message || 'Google Vision API Error');
      if (!data.responses || !data.responses[0]) throw new Error('Invalid response from Google Vision');

      const fullText = data.responses[0]?.fullTextAnnotation?.text || '';
      console.log('Google Vision parsed:', fullText);

      if (!fullText) throw new Error('No text found in receipt');

      // 1. Text Analysis - Extract Amount (Largest number formatting as price)
      const priceRegex = /\d+\.\d{2}/g;
      const prices = fullText.match(priceRegex)?.map((p: string) => parseFloat(p)) || [];
      const amount = prices.length > 0 ? Math.max(...prices) : 0;

      // 2. Text Analysis - Categorize based on keywords
      const lowerText = fullText.toLowerCase();
      let category = 'other';
      if (['food', 'restaurant', 'cafe', 'coffee', 'burger', 'pizza', 'lunch', 'dinner', 'delicious'].some(w => lowerText.includes(w))) category = 'food';
      else if (['uber', 'grab', 'taxi', 'gas', 'fuel', 'station', 'parking', 'transport', 'train'].some(w => lowerText.includes(w))) category = 'transport';
      else if (['mart', 'mall', 'store', 'market', 'shop', 'fashion', 'clothes'].some(w => lowerText.includes(w))) category = 'shopping';
      else if (['cinema', 'movie', 'game', 'entertainment'].some(w => lowerText.includes(w))) category = 'entertainment';

      // 3. Extract Merchant Name/Description (First line usually)
      const desc = fullText.split('\n')[0].substring(0, 30) || 'Receipt';

      // 4. Extract Date
      // Matches YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD
      const dateRegex = /(\d{4}[-/]\d{2}[-/]\d{2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/;
      const dateMatch = fullText.match(dateRegex);
      let detectedDate = getLocalDate();

      if (dateMatch) {
        try {
          const dateStr = dateMatch[0];
          // Determine format
          let year, month, day;

          if (dateStr.match(/^\d{4}[-/]/)) {
            // YYYY-MM-DD or YYYY/MM/DD
            const parts = dateStr.split(/[-/]/);
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
          } else {
            // DD-MM-YYYY or DD/MM/YYYY (Assuming day first if ambiguous like 01/02, but receipt convention is usually DD/MM)
            const parts = dateStr.split(/[-/]/);
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            year = parseInt(parts[2]);
          }

          if (year && month && day) {
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              detectedDate = `${y}-${m}-${dd}`;
            }
          }
        } catch (e) {
          console.log('Date parse error', e);
        }
      }

      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        text: lang === 'zh' ? `识别到收据：¥${amount} (${category})\n${desc}\n确认添加这笔支出吗？` : `Receipt detected: ${amount} (${category})\n${desc}\nAdd this expense?`,
        isUser: false,
        actions: [{ id: `${Date.now()}_receipt`, type: 'expense', title: desc, data: { amount, category, description: 'Receipt Scan', merchant: desc, date: detectedDate }, status: 'pending' }],
      }]);

    } catch (error) {
      console.error('Receipt Scan Error:', error);
      Alert.alert(lang === 'zh' ? '扫描失败' : 'Scan Failed', String(error));
    }
    setIsLoading(false);
  };

  // Enhanced send message with offline fallback
  const sendMessage = async (manualText?: string) => {
    const text = typeof manualText === 'string' ? manualText.trim() : inputText.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { id: `user_${Date.now()}`, text, isUser: true }]);
    const userMessage = text;
    const detectedLang = lang;

    // Get local date in YYYY-MM-DD format
    const localDate = getLocalDate();

    setInputText('');
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // Use Supabase Edge Function for AI chat
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_URL}?route=/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ENV.SUPABASE_ANON_KEY}`,
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: userMessage,
          language: detectedLang,
          date: localDate,
          history: messages.slice(-6).map(m => {
            let content = m.text;
            if (!m.isUser && m.actions && m.actions.length > 0) {
              content += " [System: Actions in this message are already processed/presented. Do not re-suggest them.]";
            }
            return { role: m.isUser ? 'user' : 'assistant', content };
          }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      let actions: ParsedAction[] | undefined;
      if (data.actions && Array.isArray(data.actions)) {
        actions = data.actions.map((a: any, index: number) => ({
          ...a,
          id: `${Date.now()}_${index}`,
          status: 'pending',
        }));
      } else if (data.action && data.action.type) {
        actions = [{ ...data.action, id: `${Date.now()}_0`, status: 'pending' }];
      }

      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        text: data.message || (detectedLang === 'zh' ? '好的！' : 'Got it!'),
        isUser: false,
        actions,
      }]);
    } catch (error: any) {
      console.error('Chat API error:', error);
      alert(`API Error: ${error.message}\nURL: ${API_URL}`);

      // OFFLINE FALLBACK: Local intent detection
      const lowerText = userMessage.toLowerCase();
      let responseText = '';
      let actions: ParsedAction[] | undefined;

      // Detect task/todo intent
      if (lowerText.includes('task') || lowerText.includes('todo') || lowerText.includes('待办') || lowerText.includes('任务')) {
        const title = userMessage.replace(/add|create|new|task|todo|待办|任务|添加|创建/gi, '').trim() || 'New Task';
        responseText = detectedLang === 'zh'
          ? `我帮你创建任务："${title}"`
          : `I'll create a task: "${title}"`;
        actions = [{
          id: `${Date.now()}_0`,
          type: 'task',
          title: 'Create Task',
          data: { title, priority: 'medium' },
          status: 'pending',
        }];
      }
      // Detect expense intent
      else if (lowerText.includes('expense') || lowerText.includes('spent') || lowerText.includes('支出') || lowerText.includes('花费') || lowerText.includes('¥') || lowerText.includes('$')) {
        const amountMatch = userMessage.match(/(\d+\.?\d*)/);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        responseText = detectedLang === 'zh'
          ? `我帮你记录支出：¥${amount}`
          : `I'll record an expense: $${amount}`;
        actions = [{
          id: `${Date.now()}_0`,
          type: 'expense',
          title: 'Add Expense',
          data: { amount, category: 'other', date: localDate },
          status: 'pending',
        }];
      }
      // Detect calendar/meeting intent
      else if (lowerText.includes('meeting') || lowerText.includes('event') || lowerText.includes('calendar') || lowerText.includes('会议') || lowerText.includes('日程') || lowerText.includes('活动')) {
        const title = userMessage.replace(/add|create|new|meeting|event|calendar|会议|日程|活动|添加|创建/gi, '').trim() || 'New Event';
        responseText = detectedLang === 'zh'
          ? `我帮你创建日程："${title}"`
          : `I'll create an event: "${title}"`;
        actions = [{
          id: `${Date.now()}_0`,
          type: 'calendar',
          title: 'Create Event',
          data: { title, date: localDate, startTime: '09:00', endTime: '10:00' },
          status: 'pending',
        }];
      }
      // Default response
      else {
        responseText = detectedLang === 'zh'
          ? '抱歉，AI 服务暂时无法连接。不过我可以帮你完成基本操作：\n📝 创建任务（说"添加任务..."）\n💰 记录支出（说"支出50元..."）\n📅 添加日程（说"创建会议..."）'
          : "Sorry, AI service is temporarily unavailable. But I can still help with basic actions:\n📝 Create tasks (say 'add task...')\n💰 Track expenses (say 'spent $50...')\n📅 Add events (say 'create meeting...')";
      }

      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        text: responseText,
        isUser: false,
        actions,
      }]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFirst = index === 0 || messages[index - 1]?.isUser !== item.isUser;
    const isLast = index === messages.length - 1 || messages[index + 1]?.isUser !== item.isUser;
    
    return (
      <View>
        {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
        
        {/* Modern Chat Bubble */}
        <ChatBubble 
          text={item.text} 
          isUser={item.isUser}
          isFirst={isFirst}
          isLast={isLast}
        />

        {/* Modern Action Cards */}
        {item.actions && item.actions.map((action) => (
          <ActionCard
            key={action.id}
            type={action.type}
            title={action.title}
            subtitle={action.data.description as string || action.data.date as string}
            onConfirm={() => handleConfirmAction(action, item.id)}
            onCancel={() => handleCancelAction(action.id, item.id)}
            status={action.status}
          />
        ))}

        {/* Follow-up UI for todo calendar integration */}
        {item.followUp && item.followUp.type === 'todo-calendar-color' && (
          <View style={styles.followUp}>
            <View style={styles.calendarOptions}>
              <TouchableOpacity
                style={styles.calendarBtn}
                onPress={() => handleAddToCalendar(item.followUp!.todoId, item.followUp!.todoTitle, item.id)}
              >
                <Text style={styles.calendarText}>📅 {t.addToCalendar}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => setMessages(prev => prev.map(m =>
                  m.id === item.id ? { ...m, followUp: undefined } : m
                ))}
              >
                <Text style={styles.skipText}>{t.skip}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, Platform.OS === 'android' && keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.aiAssistant} ✨</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close-outline" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={i => i.id}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.list, { flexGrow: 1 }]}
            keyboardShouldPersistTaps="handled"
          />

          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator color="#8B5CF6" />
              <Text style={styles.loadText}>{t.thinking}</Text>
            </View>
          )}

          <View style={styles.inputArea}>
            <View style={styles.mediaRow}>
              <TouchableOpacity style={styles.mediaBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mediaBtn, isRecording && styles.recordingBtn]} onPress={handleVoiceInteraction}>
                <Ionicons name={isRecording ? "stop-circle-outline" : "mic-outline"} size={22} color={isRecording ? "#EF4444" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t.typeMessage}
                placeholderTextColor="#9CA3AF"
                multiline
                onSubmitEditing={() => sendMessage()}
                inputAccessoryViewID="chatInput"
              />
              <InputAccessory id="chatInput" />
              <TouchableOpacity style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendDisabled]} onPress={() => sendMessage()} disabled={!inputText.trim() || isLoading}>
                <Ionicons name="send-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {pickerConfig && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible={true} onRequestClose={() => setPickerConfig(null)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerConfig(null)} />
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                  <TouchableOpacity onPress={() => setPickerConfig(null)}>
                    <Text style={{ fontSize: 16, color: '#6B7280' }}>{t.cancel || 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    const timeStr = pickerConfig.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (pickerConfig.type === 'time') {
                      handleTimeSelection(pickerConfig.messageId, pickerConfig.actionId, timeStr);
                    }
                    setPickerConfig(null);
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#3B82F6' }}>{t.done || 'Done'}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pickerConfig.value}
                  mode={pickerConfig.type}
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setPickerConfig(prev => prev ? { ...prev, value: selectedDate } : null);
                    }
                  }}
                  style={{ height: 200 }}
                  textColor="#000000"
                  locale={pickerLocale}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={pickerConfig.value}
            mode={pickerConfig.type}
            is24Hour={true}
            display="default"
            locale={pickerLocale}
            onChange={(event, selectedDate) => {
              const currentConfig = pickerConfig;
              setPickerConfig(null);
              if (selectedDate && event.type !== 'dismissed') {
                const timeStr = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                handleTimeSelection(currentConfig.messageId, currentConfig.actionId, timeStr);
              }
            }}
          />
        )
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'flex-end' 
  },
  container: { 
    height: SCREEN_HEIGHT * 0.75, 
    backgroundColor: '#F8FAFC', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  list: { 
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  msgImage: { 
    width: 200, 
    height: 140, 
    borderRadius: 16, 
    marginBottom: 12, 
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Action cards - Modern styling
  actionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confirmedCard: { backgroundColor: '#F0FDF4' },
  cancelledCard: { backgroundColor: '#F9FAFB' },
  pendingCard: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#8B5CF6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },

  // Main action row - EXACTLY like web version
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  confirmedRow: {},
  cancelledRow: {},
  pendingRow: {},

  actionIcon: {},
  confirmedIcon: {},
  cancelledIcon: { opacity: 0.3 },
  pendingIcon: { opacity: 0.4 },

  actionSummary: {
    flex: 1,
    fontSize: 14,
  },
  confirmedText: { color: '#065F46' },
  cancelledText: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  pendingText: { color: '#374151' },

  // Inline buttons - EXACTLY like web version
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Color picker for todos
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  colorLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  colorBtn: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  colorEmoji: {
    fontSize: 14,
  },

  // Category picker for expenses
  categoryPicker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categorySelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: '#FFF',
  },

  // Time picker for calendar events
  timePicker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeLabelSelected: {
    color: '#FFF',
  },
  dateBtn: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateDay: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Follow-up UI
  followUp: {
    marginLeft: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  colorOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  calendarOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },

  loading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  loadText: { color: '#6B7280', fontSize: 14 },
  inputArea: { 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    padding: 14, 
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  mediaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  mediaBtn: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordingBtn: { 
    backgroundColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOpacity: 0.1,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    gap: 12,
    paddingHorizontal: 4,
  },
  input: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 26, 
    paddingHorizontal: 18, 
    paddingVertical: 14, 
    fontSize: 16, 
    maxHeight: 120, 
    minHeight: 52, 
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#3B82F6', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendDisabled: { 
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Chip styles for Icon Picker
  chip: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderRadius: 12, backgroundColor: '#F3F4F6' },
  chipSelected: { backgroundColor: '#8B5CF6' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextSelected: { fontSize: 12, color: '#FFF' },
});

export default FloatingChatbot;
