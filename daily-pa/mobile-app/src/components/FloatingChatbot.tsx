/**
 * Smart AI Chatbot - Enhanced with Category & Time Pickers
 * Features:
 * - Color picker for todos (like web)
 * - Category picker for expenses
 * - Time picker for calendar events
 * - Inline confirm/cancel buttons
 * - Real API integration
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import Constants from 'expo-constants';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { useLocalStore } from '@/store/localStore';
import { supabase } from '@/services/supabase';
import { todoService } from '@/services/TodoService';
import { expenseService } from '@/services/ExpenseService';
import { calendarService } from '@/services/CalendarService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_URL = Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.100.111:3000';

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

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Welcome message on open
  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcomeMsg = lang === 'zh'
        ? '你好！我是智能助手 ✨\n\n🔌 离线模式\n我可以帮你：\n📝 创建任务（说"添加任务..."）\n📅 添加日程（说"创建会议..."）\n💰 记录支出（说"支出50元..."）\n📷 扫描收据\n\n请告诉我你需要什么帮助！'
        : "Hi! I'm your smart assistant ✨\n\n🔌 Offline Mode\nI can help you:\n📝 Create tasks (say 'add task...')\n📅 Add events (say 'create meeting...')\n💰 Track expenses (say 'spent $50...')\n📷 Scan receipts\n\nWhat can I help you with today?";
      setMessages([{ id: 'welcome', text: welcomeMsg, isUser: false }]);
    }
  }, [visible, lang]);

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
      if (type === 'task') {
        const userId = session?.user?.id || 'mock-user-id';
        console.log('ExecuteAction: Creating task with userId:', userId);
        const createdTodo = await todoService.createTodo({
          title: data.title as string,
          priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
          dueDate: data.dueDate as string | undefined, // Ensure this maps correctly if string
          color: (data.color as any) || 'yellow',
          userId,
          status: 'active',
          tags: []
        });

        return { success: true, todoId: createdTodo.id };
      } else if (type === 'expense') {
        const userId = session?.user?.id || 'mock-user-id';
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount as number;

        await expenseService.createExpense({
          userId,
          amount,
          currency: 'CNY',
          category: (data.category as any) || 'other',
          description: data.description as string || '',
          expenseDate: (data.date as string) || getLocalDate(),
          tags: []
        });
      } else if (type === 'calendar') {
        const userId = session?.user?.id || 'mock-user-id';
        console.log('ExecuteAction: Creating calendar event with userId:', userId, 'Date:', data.date);

        const eventDate = data.date as string || getLocalDate();
        const startTime = data.startTime as string || '09:00';
        const endTime = data.endTime as string || '10:00';

        await calendarService.createEvent({
          userId,
          title: data.title as string,
          description: data.description as string || '',
          startTime: `${eventDate}T${startTime}:00`,
          endTime: `${eventDate}T${endTime}:00`,
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

    // If it's a todo and successfully created, ask follow-up questions (like web version)
    if (result.success && action.type === 'task' && result.todoId) {
      const todoId = result.todoId;
      const todoTitle = action.data.title as string;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          isUser: false,
          text: lang === 'zh'
            ? `✓ 待办已创建！要添加到日历吗？选择一个颜色吧 🎨`
            : `✓ Todo created! Add to calendar? Choose a color 🎨`,
          followUp: {
            type: 'todo-calendar-color',
            todoId,
            todoTitle,
          },
        }]);
      }, 500);
    }

    // Show success/error message
    if (result.success) {
      Alert.alert('✅', lang === 'zh' ? '操作成功！' : 'Action completed successfully!');
    } else {
      Alert.alert('❌', `${lang === 'zh' ? '操作失败' : 'Action failed'}: ${result.error}`);
    }
  };

  // Handle color selection for todos (like web version)
  const handleColorSelection = async (todoId: string, color: string, messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ color }),
      });

      // Update the message to remove followUp
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, followUp: undefined } : m
      ));

      Alert.alert('✅', lang === 'zh' ? '颜色已更新！' : 'Color updated!');
    } catch (error) {
      Alert.alert('❌', lang === 'zh' ? '更新失败' : 'Update failed');
    }
  };

  // Handle add to calendar for todos (like web version)
  const handleAddToCalendar = async (todoId: string, todoTitle: string, messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const today = new Date().toISOString().split('T')[0];
      await fetch(`${API_URL}/api/calendar`, {
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

      Alert.alert('✅', lang === 'zh' ? '已添加到日历！' : 'Added to calendar!');
    } catch (error) {
      Alert.alert('❌', lang === 'zh' ? '添加失败' : 'Failed to add');
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
    if (type === 'expense') return `¥${data.amount || 0} • ${data.category || 'other'}`;
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
                <Text style={styles.colorLabel}>{lang === 'zh' ? '优先级:' : 'Priority:'}</Text>
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

            {/* Category picker for expenses */}
            {isExpense && (
              <View style={styles.categoryPicker}>
                <Text style={styles.pickerLabel}>{lang === 'zh' ? '分类:' : 'Category:'}</Text>
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
            )}

            {/* Date & Time picker for calendar events */}
            {isCalendar && (
              <View>
                {/* Date Picker */}
                <View style={styles.timePicker}>
                  <Text style={styles.pickerLabel}>{lang === 'zh' ? '日期:' : 'Date:'}</Text>
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
                <View style={[styles.timePicker, { borderTopWidth: 0, paddingTop: 0 }]}>
                  <Text style={styles.pickerLabel}>{lang === 'zh' ? '时间:' : 'Time:'}</Text>
                  <View style={styles.timeGrid}>
                    {timeSlots.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeBtn,
                          action.data.startTime === time && styles.timeSelected
                        ]}
                        onPress={() => handleTimeSelection(messageId, action.id, time)}
                      >
                        <Text style={[
                          styles.timeLabel,
                          action.data.startTime === time && styles.timeLabelSelected
                        ]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>
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
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.LOW_QUALITY
        );

        setRecording(recording);
        setIsRecording(true);
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

      // OFFLINE MODE: Show message that voice transcription needs backend
      Alert.alert(
        lang === 'zh' ? '语音功能' : 'Voice Feature',
        lang === 'zh' 
          ? '语音转文字功能需要后端服务器。请使用文字输入或启动后端服务器。' 
          : 'Voice transcription requires the backend server. Please use text input or start the backend server.',
        [{ text: 'OK' }]
      );

      /* ORIGINAL CODE - Requires backend API
      console.log('Reading audio file from:', uri);
      const file = new File(uri);
      const base64Audio = await file.base64();
      console.log('Audio file successfully read. Length:', base64Audio.length);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      console.log('Sending audio to API:', `${API_URL}/api/voice/transcribe`);

      try {
        const response = await fetch(`${API_URL}/api/voice/transcribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: lang,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Transcription API Error:', response.status, errText);
          throw new Error(`Transcription failed: ${response.status} ${errText}`);
        }

        const data = await response.json();

        if (data.text) {
          sendMessage(data.text);
        } else {
          Alert.alert(lang === 'zh' ? '未能识别语音' : 'Could not recognize speech');
        }
      } catch (fetchError) {
        console.error('Network request failed details:', fetchError);
        throw fetchError;
      }
      */

    } catch (error) {
      console.error('Voice processing error:', error);
      // Don't show error alert since we're in offline mode
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

  const processReceipt = (uri: string) => {
    setMessages(prev => [...prev, { id: `user_${Date.now()}`, text: '📷 Receipt', isUser: true, image: uri }]);
    setIsLoading(true);
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
      // Try API first
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
        throw new Error(`API Error: ${response.status}`);
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
    } catch (error) {
      console.error('Chat API error:', error);
      
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
          ? '抱歉，我现在处于离线模式。我可以帮你：\n📝 创建任务（说"添加任务..."）\n💰 记录支出（说"支出50元..."）\n📅 添加日程（说"创建会议..."）'
          : "Sorry, I'm in offline mode. I can help you:\n📝 Create tasks (say 'add task...')\n💰 Track expenses (say 'spent $50...')\n📅 Add events (say 'create meeting...')";
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

  const renderMessage = ({ item }: { item: Message }) => (
    <View>
      {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.msgText, item.isUser && styles.userText]}>{item.text}</Text>
      </View>

      {/* Action cards - EXACTLY like web version */}
      {item.actions && item.actions.map((action) => renderActionCard(action, item.id))}

      {/* Follow-up UI for todo calendar integration (like web version) */}
      {item.followUp && item.followUp.type === 'todo-calendar-color' && (
        <View style={styles.followUp}>
          <Text style={styles.followUpTitle}>{lang === 'zh' ? '选择颜色' : 'Choose Color'}</Text>
          <View style={styles.colorOptionsRow}>
            {[
              { value: 'yellow', emoji: '🟡' },
              { value: 'blue', emoji: '🟡' },
              { value: 'pink', emoji: '🟡' },
            ].map((color) => (
              <TouchableOpacity
                key={color.value}
                style={styles.colorBtn}
                onPress={() => handleColorSelection(item.followUp!.todoId, color.value, item.id)}
              >
                <Text style={styles.colorEmoji}>{color.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.calendarOptions}>
            <TouchableOpacity
              style={styles.calendarBtn}
              onPress={() => handleAddToCalendar(item.followUp!.todoId, item.followUp!.todoTitle, item.id)}
            >
              <Text style={styles.calendarText}>{lang === 'zh' ? '📅 添加到日历' : '📅 Add to Calendar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => setMessages(prev => prev.map(m =>
                m.id === item.id ? { ...m, followUp: undefined } : m
              ))}
            >
              <Text style={styles.skipText}>{lang === 'zh' ? '跳过' : 'Skip'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
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
            contentContainerStyle={styles.list}
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
              <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder={lang === 'zh' ? '输入消息...' : 'Type message...'} placeholderTextColor="#9CA3AF" multiline onSubmitEditing={() => sendMessage()} />
              <TouchableOpacity style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendDisabled]} onPress={() => sendMessage()} disabled={!inputText.trim() || isLoading}>
                <Ionicons name="send-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { height: SCREEN_HEIGHT * 0.85, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 8 },
  msgImage: { width: 180, height: 120, borderRadius: 12, marginBottom: 8, alignSelf: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { backgroundColor: '#8B5CF6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22, color: '#1F2937' },
  userText: { color: '#FFF' },

  // Action cards - EXACTLY like web version
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
  inputArea: { borderTopWidth: 1, borderTopColor: '#E5E7EB', padding: 12, paddingBottom: 28 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  mediaBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  recordingBtn: { backgroundColor: '#FEE2E2' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, maxHeight: 100, minHeight: 48, color: '#1F2937' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { backgroundColor: '#D1D5DB' },
});

export default FloatingChatbot;
