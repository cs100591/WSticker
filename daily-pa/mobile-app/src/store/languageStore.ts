/**
 * Language Store using Zustand + AsyncStorage
 * Manages app language preference
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { useMemo } from 'react';

export type AppLanguage = 'en' | 'zh' | 'system';

// Get device system language
const getDeviceLanguage = (): 'en' | 'zh' => {
  try {
    const locale = Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en'
      : NativeModules.I18nManager?.localeIdentifier || 'en';
    return locale.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
};

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  getEffectiveLanguage: () => 'en' | 'zh';
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'system',

      setLanguage: (lang: AppLanguage) => {
        set({ language: lang });
      },

      getEffectiveLanguage: () => {
        const { language } = get();
        if (language === 'system') {
          return getDeviceLanguage();
        }
        return language;
      },
    }),
    {
      name: 'daily-pa-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Translations
export const translations = {
  en: {
    // Common
    cancel: 'Cancel',
    save: 'Save',
    add: 'Add',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',

    // Tasks
    tasks: 'Tasks',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    completed: 'Completed',
    newTask: 'New Task',
    icon: 'Icon',
    task: 'Task',
    priority: 'Priority',
    addTask: 'Add Task',
    addNotes: 'Add Notes',
    addToCalendar: 'Add to Calendar',
    date: 'Date',
    time: 'Time',
    noTasks: 'No tasks yet',
    tapToAdd: 'Tap + to add your first task',
    whatToDo: 'What needs to be done?',
    enterNotes: 'Enter notes...',

    // Settings
    settings: 'Settings',
    profile: 'Profile',
    editProfile: 'Edit Profile',
    security: 'Security',
    biometricAuth: 'Biometric Authentication',
    biometricDesc: 'Use Face ID or Touch ID to unlock',
    autoLock: 'Auto-Lock',
    autoLockDesc: 'Lock app after inactivity',
    autoLockTimeout: 'Auto-Lock Timeout',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    notifications: 'Notifications',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Receive notifications for todos and events',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    preferences: 'Preferences',
    defaultCurrency: 'Default Currency',
    calendarSync: 'Calendar Sync',
    language: 'Language',
    languageDesc: 'App display language',
    english: 'English',
    chinese: '中文',
    followSystem: 'Follow System',
    signOut: 'Sign Out',
    version: 'Version',

    // AI Chat
    aiAssistant: 'AI Assistant',
    typeMessage: 'Type your message...',
    send: 'Send',
    thinking: 'Thinking...',
    welcomeMessage: "Hi! I'm your AI assistant. How can I help you today? 👋",
    connectionError: 'Sorry, I could not connect. Please try again.',

    // Dashboard
    activeTasks: 'Active Tasks',
    completionRate: 'Completion',
    monthlySpend: 'Monthly Spend',
    eventsToday: 'Events Today',
    priorityTasks: 'Priority Tasks',
    viewAll: 'View all',
    todaysSchedule: "Today's Schedule",
    openCalendar: 'Open Calendar',
    expensesThisMonth: 'Expenses This Month',
    totalSpentMsg: 'Total spent this month',
    noEventsToday: 'No events scheduled for today',
    productivityOverview: "Here's your productivity overview",

    // Expenses
    expenses: 'Expenses',
    byCategory: 'By Category',
    transactionHistory: 'Transaction History',
    noExpenses: 'No expenses found',
    food: 'Food',
    transport: 'Transport',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills',
    health: 'Health',
    education: 'Education',
    other: 'Other',
    confirmDelete: 'Are you sure you want to delete this?',
  },
  zh: {
    // Common
    cancel: '取消',
    save: '保存',
    add: '添加',
    delete: '删除',
    edit: '编辑',
    done: '完成',

    // Tasks
    tasks: '待办事项',
    high: '高',
    medium: '中',
    low: '低',
    completed: '已完成',
    newTask: '新任务',
    icon: '图标',
    task: '任务',
    priority: '优先级',
    addTask: '添加任务',
    addNotes: '添加备注',
    addToCalendar: '添加到日历',
    date: '日期',
    time: '时间',
    noTasks: '暂无任务',
    tapToAdd: '点击 + 添加第一个任务',
    whatToDo: '需要做什么？',
    enterNotes: '输入备注...',

    // Settings
    settings: '设置',
    profile: '个人资料',
    editProfile: '编辑资料',
    security: '安全',
    biometricAuth: '生物识别认证',
    biometricDesc: '使用面容ID或触控ID解锁',
    autoLock: '自动锁定',
    autoLockDesc: '闲置后锁定应用',
    autoLockTimeout: '自动锁定时间',
    changePassword: '修改密码',
    deleteAccount: '删除账户',
    notifications: '通知',
    pushNotifications: '推送通知',
    pushNotificationsDesc: '接收待办和事件提醒',
    appearance: '外观',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
    preferences: '偏好设置',
    defaultCurrency: '默认货币',
    calendarSync: '日历同步',
    language: '语言',
    languageDesc: '应用显示语言',
    english: 'English',
    chinese: '中文',
    followSystem: '跟随系统',
    signOut: '退出登录',
    version: '版本',

    // AI Chat
    aiAssistant: 'AI助手',
    typeMessage: '输入消息...',
    send: '发送',
    thinking: '思考中...',
    welcomeMessage: '你好！我是你的AI助手，有什么可以帮你的吗？👋',
    connectionError: '抱歉，连接失败，请重试。',

    // Dashboard
    activeTasks: '进行中任务',
    completionRate: '完成率',
    monthlySpend: '本月支出',
    eventsToday: '今日日程',
    priorityTasks: '重要任务',
    viewAll: '查看全部',
    todaysSchedule: '今日时间表',
    openCalendar: '打开日历',
    expensesThisMonth: '本月账单',
    totalSpentMsg: '本月总支出',
    noEventsToday: '今日暂无日程',
    productivityOverview: '这是你的今日概览',

    // Expenses
    expenses: '支出',
    byCategory: '分类统计',
    transactionHistory: '交易记录',
    noExpenses: '暂无支出记录',
    food: '餐饮',
    transport: '交通',
    shopping: '购物',
    entertainment: '娱乐',
    bills: '账单',
    health: '医疗',
    education: '教育',
    other: '其他',
    confirmDelete: '确定要删除吗？',
  },
};

// Helper hook to get translations
export const useTranslations = () => {
  const language = useLanguageStore((state) => state.language);
  const lang = useMemo(() => {
    if (language === 'system') {
      return useLanguageStore.getState().getEffectiveLanguage();
    }
    return language;
  }, [language]);
  return translations[lang];
};

// Helper hook to get effective language (safe for selectors)
export const useEffectiveLanguage = (): 'en' | 'zh' => {
  const language = useLanguageStore((state) => state.language);
  return useMemo(() => {
    if (language === 'system') {
      return useLanguageStore.getState().getEffectiveLanguage();
    }
    return language;
  }, [language]);
};
