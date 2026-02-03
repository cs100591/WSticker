/**
 * Language Store using Zustand + AsyncStorage
 * Manages app language preference
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { useMemo } from 'react';

export type AppLanguage = 'en' | 'zh' | 'ms' | 'ta' | 'ja' | 'ko' | 'id' | 'es' | 'fr' | 'de' | 'th' | 'vi' | 'system';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const;

// Get device system language
const getDeviceLanguage = (): Exclude<AppLanguage, 'system'> => {
  try {
    const locale = Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en'
      : NativeModules.I18nManager?.localeIdentifier || 'en';

    const code = locale.split('_')[0].split('-')[0];
    const supported = LANGUAGES.find(l => l.code === code);
    return (supported ? supported.code : 'en') as any;
  } catch {
    return 'en';
  }
};

interface LanguageStore {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  getEffectiveLanguage: () => Exclude<AppLanguage, 'system'>;
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
        return language as Exclude<AppLanguage, 'system'>;
      },
    }),
    {
      name: 'daily-pa-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Base English Translations
const en = {
  // Tab Bar
  home: 'Home',
  tasks: 'Tasks',
  calendar: 'Calendar',
  notes: 'Notes',
  expenses: 'Expenses',

  // Common
  cancel: 'Cancel',
  save: 'Save',
  add: 'Add',
  delete: 'Delete',
  edit: 'Edit',
  done: 'Done',

  // Settings Headers
  settings: 'Settings',
  profile: 'Profile',
  security: 'Security',
  notifications: 'Notifications',
  preferences: 'Preferences',

  // Settings Items
  editProfile: 'Edit Profile',
  biometricAuth: 'Biometric Authentication',
  biometricDesc: 'Use Face ID or Touch ID to unlock',
  autoLock: 'Auto-Lock',
  autoLockDesc: 'Lock app after inactivity',
  autoLockTimeout: 'Auto-Lock Timeout',
  changePassword: 'Change Password',
  deleteAccount: 'Delete Account',
  pushNotifications: 'Push Notifications',
  pushNotificationsDesc: 'Receive notifications for todos and events',
  language: 'Language',
  languageDesc: 'App display language',
  followSystem: 'Follow System',
  defaultCurrency: 'Default Currency',
  calendarSync: 'Calendar Sync',
  signOut: 'Sign Out',
  resetData: 'Reset App Data',
  version: 'Version',

  // Calendar Screen
  calendarTitle: 'Calendar',
  eventsOn: 'Events on',
  today: 'Today',
  month: 'Month',
  week: 'Week',
  day: 'Day',
  newEvent: 'New Event',
  editEvent: 'Edit Event',

  // Event Form
  eventTitleLabel: 'Title',
  eventTitlePlaceholder: 'Event title',
  eventDescLabel: 'Description',
  eventDescPlaceholder: 'Event description',
  allDay: 'All Day Event',
  startDate: 'Start Date',
  startTime: 'Start Time',
  endDate: 'End Date',
  endTime: 'End Time',
  color: 'Color',
  confirmDeleteTitle: 'Delete Event',
  confirmDeleteMsg: 'Are you sure you want to delete this event?',
  saving: 'Saving...',

  // Notes Screen
  voiceNotes: 'Voice Notes',
  tapToRecord: 'Tap to Record',
  play: 'Play',
  linkTask: 'Link',
  input: 'Input',
  output: 'Output',
  associated: 'Associated',

  // Expenses Screen
  monthlySpendTitle: 'Monthly Spend',
  expenseItem: 'Expense',
  transactionHistory: 'Transaction History',
  byCategory: 'By Category',
  noExpenses: 'No expenses recorded',
  budget: 'Budget',
  setBudget: 'Set Budget',

  // Dashboard
  todaysSchedule: "Today's Schedule",
  priorityTasks: 'Priority Tasks',
  expensesThisMonth: 'Expenses This Month',
  totalSpentMsg: 'Total spent this month',
  activeTasks: 'Active Tasks',
  completionRate: 'Completion',
  monthlySpend: 'Monthly Spend',
  eventsToday: 'Events Today',
  viewAll: 'View all',
  openCalendar: 'Open Calendar',

  // Expenses Categories
  food: 'Food',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',

  // Weather & Greetings
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  goodDay: 'Good day',
  weatherHot: "It's a hot one!",
  weatherCold: "Brrr, it's cold!",
  weatherSunshine: "Sunshine today!",
  weatherCloudy: "Nice & cloudy",
  weatherRain: "Don't forget an umbrella!",
  weatherSnow: "Snow day!",
  weatherStorm: "Stormy weather!",

  // Chatbot
  chatbotGreeting: "Hi! I'm your smart assistant ✨",
  chatbotHelp: "I can help you:",
  chatbotTask: "📝 Create tasks (say 'add task...')",
  chatbotEvent: "📅 Add events (say 'create meeting...')",
  chatbotExpense: "💰 Track expenses (say 'spent $50...')",
  chatbotReceipt: "📷 Scan receipts",
  chatbotAsk: "What can I help you with today?",
  aiAssistant: 'Smart Assistant',
  thinking: 'Thinking...',
  typeMessage: 'Type message...',

  // Chatbot Actions
  priority: 'Priority',
  category: 'Category',
  date: 'Date',
  time: 'Time',
  addToCalendar: 'Add to Calendar',
  skip: 'Skip',
  chooseColor: 'Choose Color',
  actionSuccess: 'Action completed!',
  actionFailed: 'Action failed',

  // Others (Fallback)
  noEventsToday: 'No events scheduled for today',
  // Todos Screen Extras
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  completed: 'Completed',
  noTasks: 'No tasks',
  tapToAdd: 'Tap + to add a new task',
  newTask: 'New Task',
  icon: 'Icon',
  whatToDo: 'What needs to be done?',
  addTask: 'Add Task',
  addNotes: 'Add Notes',
  enterNotes: 'Enter notes...',
  task: 'Task',
};

// Translations Map
export const translations: Record<Exclude<AppLanguage, 'system'>, typeof en> = {
  en,
  zh: {
    ...en,
    home: '首页', tasks: '待办', calendar: '日历', notes: '笔记', expenses: '支出',
    cancel: '取消', save: '保存', add: '添加', delete: '删除', edit: '编辑', done: '完成',
    settings: '设置', profile: '个人资料', security: '安全', notifications: '通知', preferences: '偏好设置',
    editProfile: '编辑资料', biometricAuth: '生物识别', biometricDesc: '使用 Face ID 或指纹解锁',
    autoLock: '自动锁定', autoLockDesc: '应用闲置时锁定', autoLockTimeout: '锁定超时',
    changePassword: '修改密码', deleteAccount: '删除账户',
    pushNotifications: '推送通知', pushNotificationsDesc: '接收任务和事件通知',
    language: '语言', languageDesc: '应用显示语言', followSystem: '跟随系统', defaultCurrency: '默认货币',
    calendarSync: '日历同步', signOut: '退出登录', resetData: '重置应用数据', version: '版本',
    calendarTitle: '日历', eventsOn: '事件', today: '今天', month: '月', week: '周', day: '日',
    newEvent: '新建事件', editEvent: '编辑事件',
    eventTitleLabel: '标题', eventTitlePlaceholder: '事件标题', eventDescLabel: '描述', eventDescPlaceholder: '事件描述',
    allDay: '全天事件', startDate: '开始日期', startTime: '开始时间', endDate: '结束日期', endTime: '结束时间', color: '颜色',
    confirmDeleteTitle: '删除事件', confirmDeleteMsg: '确定要删除此事件吗？', saving: '保存中...',
    voiceNotes: '语音笔记', tapToRecord: '点击录音', play: '播放', linkTask: '关联', input: '输入', output: '输出', associated: '已关联',
    monthlySpendTitle: '月度支出', expenseItem: '支出', transactionHistory: '交易记录', byCategory: '按类别', noExpenses: '暂无支出',
    budget: '预算', setBudget: '设置预算',
    todaysSchedule: '今日日程', priorityTasks: '重要任务', expensesThisMonth: '本月支出', totalSpentMsg: '本月总支出',
    activeTasks: '进行中', completionRate: '完成率', monthlySpend: '月支出', eventsToday: '今日事件', viewAll: '查看全部', openCalendar: '打开日历',
    noEventsToday: '今日暂无日程',
    food: '餐饮', transport: '交通', shopping: '购物', entertainment: '娱乐',
    goodMorning: '早上好', goodAfternoon: '下午好', goodEvening: '晚上好', goodDay: '你好',
    weatherHot: '今天很热！', weatherCold: '天气很冷！', weatherSunshine: '今天阳光明媚！', weatherCloudy: '多云天气', weatherRain: '别忘了带伞！', weatherSnow: '下雪啦！', weatherStorm: '暴风雨来了！',
    chatbotGreeting: '你好！我是智能助手 ✨', chatbotHelp: '我可以帮你：',
    chatbotTask: '📝 创建任务（说"添加任务..."）', chatbotEvent: '📅 添加日程（说"创建会议..."）',
    chatbotExpense: '💰 记录支出（说"支出50元..."）', chatbotReceipt: '📷 扫描收据',
    chatbotAsk: '请告诉我你需要什么帮助！',
    aiAssistant: '智能助手', thinking: '思考中...', typeMessage: '输入消息...',
    priority: '优先级', category: '分类', date: '日期', time: '时间',
    addToCalendar: '添加到日历', skip: '跳过', chooseColor: '选择颜色',
    actionSuccess: '操作成功！', actionFailed: '操作失败',
  },
  ms: {
    ...en,
    home: 'Utama', tasks: 'Tugasan', calendar: 'Kalendar', notes: 'Nota', expenses: 'Perbelanjaan',
    cancel: 'Batal', save: 'Simpan', add: 'Tambah', delete: 'Padam', edit: 'Sunting', done: 'Selesai',
    settings: 'Tetapan', profile: 'Profil', security: 'Keselamatan', notifications: 'Pemberitahuan', preferences: 'Keutamaan',
    editProfile: 'Sunting Profil', biometricAuth: 'Pengesahan Biometrik', biometricDesc: 'Guna Face ID atau Touch ID',
    autoLock: 'Kunci Automatik', autoLockDesc: 'Kunci apl selepas tidak aktif', autoLockTimeout: 'Masa Tamat Kunci',
    changePassword: 'Tukar Kata Laluan', deleteAccount: 'Padam Akaun',
    pushNotifications: 'Pemberitahuan Teras', pushNotificationsDesc: 'Terima pemberitahuan tugasan & acara',
    language: 'Bahasa', languageDesc: 'Bahasa paparan aplikasi', followSystem: 'Ikut Sistem', defaultCurrency: 'Mata Wang Lalai',
    calendarSync: 'Segerakkan Kalendar', signOut: 'Log Keluar', version: 'Versi',
    calendarTitle: 'Kalendar', eventsOn: 'Acara pada', today: 'Hari Ini', month: 'Bulan', week: 'Minggu', day: 'Hari',
    newEvent: 'Acara Baru', editEvent: 'Sunting Acara',
    eventTitleLabel: 'Tajuk', eventTitlePlaceholder: 'Tajuk acara', eventDescLabel: 'Penerangan', eventDescPlaceholder: 'Penerangan acara',
    allDay: 'Sepanjang Hari', startDate: 'Tarikh Mula', startTime: 'Masa Mula', endDate: 'Tarikh Tamat', endTime: 'Masa Tamat', color: 'Warna',
    confirmDeleteTitle: 'Padam Acara', confirmDeleteMsg: 'Adakah anda pasti mahu memadam acara ini?', saving: 'Menyimpan...',
    voiceNotes: 'Nota Suara', tapToRecord: 'Tekan untuk Rakam', play: 'Main', linkTask: 'Pautkan', input: 'Input', output: 'Output', associated: 'Dipautkan',
    monthlySpendTitle: 'Belanja Bulanan', expenseItem: 'Perbelanjaan', transactionHistory: 'Sejarah Transaksi', byCategory: 'Mengikut Kategori', noExpenses: 'Tiada perbelanjaan direkodkan',
    budget: 'Bajet', setBudget: 'Tetapkan Bajet',
    todaysSchedule: 'Jadual Hari Ini', priorityTasks: 'Tugasan Utama', expensesThisMonth: 'Perbelanjaan Bulan Ini', totalSpentMsg: 'Jumlah belanja bulan ini',
    activeTasks: 'Tugasan Aktif', completionRate: 'Kadar Siap', monthlySpend: 'Belanja Bulanan', eventsToday: 'Acara Hari Ini', viewAll: 'Lihat semua', openCalendar: 'Buka Kalendar',
    noEventsToday: 'Tiada acara hari ini',
    food: 'Makanan', transport: 'Pengangkutan', shopping: 'Beli-belah', entertainment: 'Hiburan',
    goodMorning: 'Selamat Pagi', goodAfternoon: 'Selamat Tengahari', goodEvening: 'Selamat Petang', goodDay: 'Selamat Sejahtera',
    weatherHot: 'Cuaca panas hari ini!', weatherCold: 'Sejuknya!', weatherSunshine: 'Cerah hari ini!', weatherCloudy: 'Mendung', weatherRain: 'Jangan lupa payung!', weatherSnow: 'Hari bersalji!', weatherStorm: 'Cuaca ribut!',
    chatbotGreeting: 'Hai! Saya pembantu pintar anda ✨', chatbotHelp: 'Saya boleh bantu anda:',
    chatbotTask: '📝 Buat tugasan (sebut "tambah tugasan...")', chatbotEvent: '📅 Tambah acara (sebut "buat mesyuarat...")',
    chatbotExpense: '💰 Jejak belanja (sebut "belanja $50...")', chatbotReceipt: '📷 Imbas resit',
    chatbotAsk: 'Apa yang boleh saya bantu hari ini?',
    aiAssistant: 'Pembantu Pintar', thinking: 'Berfikir...', typeMessage: 'Taip mesej...',
    priority: 'Keutamaan', category: 'Kategori', date: 'Tarikh', time: 'Masa',
    addToCalendar: 'Tambah ke Kalendar', skip: 'Langkau', chooseColor: 'Pilih Warna',
    actionSuccess: 'Tindakan berjaya!', actionFailed: 'Tindakan gagal',
  },
  ta: {
    ...en,
    home: 'முகப்பு', tasks: 'பணிகள்', calendar: 'நாட்காட்டி', notes: 'குறிப்புகள்', expenses: 'செலவுகள்',
    cancel: 'ரத்து', save: 'சேமி', add: 'சேர்', delete: 'நீக்கு', edit: 'திருத்து', done: 'முடிந்தது',
    settings: 'அமைப்புகள்', profile: 'சுயவிவரம்', security: 'பாதுகாப்பு', notifications: 'அறிவிப்புகள்', preferences: 'விருப்பங்கள்',
    editProfile: 'சுயவிவரத்தைத் திருத்து', biometricAuth: 'உயிரியல் அங்கீகாரம்', biometricDesc: 'Face ID அல்லது Touch ID பயன்படுத்தவும்',
    autoLock: 'தானியங்கி பூட்டு', autoLockDesc: 'செயலற்ற நிலையில் பூட்டவும்', autoLockTimeout: 'பூட்டு நேரம்',
    changePassword: 'கடவுச்சொல்லை மாற்று', deleteAccount: 'கணக்கை நீக்கு',
    pushNotifications: 'தள்ளு அறிவிப்புகள்', pushNotificationsDesc: 'பணிகள் மற்றும் நிகழ்வுகளுக்கான அறிவிப்புகளைப் பெறுங்கள்',
    language: 'மொழி', languageDesc: 'செயலி மொழி', followSystem: 'கணினியைப் பின்தொடர்', defaultCurrency: 'இயல்புநிலை நாணயம்',
    calendarSync: 'நாட்காட்டி ஒத்திசைவு', signOut: 'வெளியேறு', version: 'பதிப்பு',
    calendarTitle: 'நாட்காட்டி', eventsOn: 'நிகழ்வுகள்', today: 'இன்று', month: 'மாதம்', week: 'வாரம்', day: 'நாள்',
    newEvent: 'புதிய நிகழ்வு', editEvent: 'நிகழ்வை திருத்து',
    eventTitleLabel: 'தலைப்பு', eventTitlePlaceholder: 'நிகழ்வு தலைப்பு', eventDescLabel: 'விளக்கம்', eventDescPlaceholder: 'நிகழ்வு விளக்கம்',
    allDay: 'நாள் முழுவதும்', startDate: 'தொடக்க தேதி', startTime: 'தொடக்க நேரம்', endDate: 'முடிவு தேதி', endTime: 'முடிவு நேரம்', color: 'நிறம்',
    confirmDeleteTitle: 'நிகழ்வை நீக்கு', confirmDeleteMsg: 'இந்த நிகழ்வை நிச்சயமாக நீக்க விரும்புகிறீர்களா?', saving: 'சேமிக்கிறது...',
    voiceNotes: 'குரல் குறிப்புகள்', tapToRecord: 'பதிவு செய்ய தட்டவும்', play: 'இயக்கு', linkTask: 'இணைக்க', input: 'உள்ளீடு', output: 'வெளியீடு', associated: 'இணைக்கப்பட்டது',
    monthlySpendTitle: 'மாதாந்திர செலவு', expenseItem: 'செலவு', transactionHistory: 'பரிவர்த்தனை வரலாறு', byCategory: 'வகை வாரியாக', noExpenses: 'செலவுகள் இல்லை',
    todaysSchedule: 'இன்றைய அட்டவணை', priorityTasks: 'முக்கிய பணிகள்', expensesThisMonth: 'இந்த மாத செலவுகள்', totalSpentMsg: 'இந்த மாத மொத்த செலவு',
    activeTasks: 'செயலில் உள்ள பணிகள்', completionRate: 'முடிப்பு விகிதம்', monthlySpend: 'மாதாந்திர செலவு', eventsToday: 'இன்றைய நிகழ்வுகள்', viewAll: 'எல்லாவற்றையும் பார்', openCalendar: 'நாட்காட்டியை திற',
    noEventsToday: 'இன்று நிகழ்வுகள் இல்லை',
    food: 'உணவு', transport: 'போக்குவரத்து', shopping: 'ஷாப்பிங்', entertainment: 'பொழுதுபோக்கு',
    goodMorning: 'காலை வணக்கம்', goodAfternoon: 'மதிய வணக்கம்', goodEvening: 'மாலை வணக்கம்', goodDay: 'வணக்கம்',
    weatherHot: 'வெயில் அதிகம்!', weatherCold: 'குளிராக இருக்கிறது!', weatherSunshine: 'இன்று வெயிலாக உள்ளது!', weatherCloudy: 'மேகமூட்டம்', weatherRain: 'குடையை மறக்காதீர்கள்!', weatherSnow: 'பனி பெய்கிறது!', weatherStorm: 'புயல்!',
    chatbotGreeting: 'வணக்கம்! நான் உங்கள் ஸ்மார்ட் உதவியாளர் ✨', chatbotHelp: 'நான் உங்களுக்கு உதவ முடியும்:',
    chatbotTask: '📝 பணிகளை உருவாக்குங்கள்', chatbotEvent: '📅 நிகழ்வுகளைச் சேர்க்கவும்',
    chatbotExpense: '💰 செலவுகளைக் கண்காணிக்கவும்', chatbotReceipt: '📷 ரசீதுகளை ஸ்கேன் செய்யவும்',
    chatbotAsk: 'இன்று நான் உங்களுக்கு என்ன உதவ வேண்டும்?',
    aiAssistant: 'ஸ்மார்ட் உதவியாளர்', thinking: 'சிந்திக்கிறது...', typeMessage: 'செய்தியைத் தட்டச்சு செய்க...',
    priority: 'முன்னுரிமை', category: 'வகை', date: 'தேதி', time: 'நேரம்',
    addToCalendar: 'நாட்காட்டியில் சேர்', skip: 'தவிர்', chooseColor: 'நிறத்தைத் தேர்ந்தெடு',
    actionSuccess: 'செயல் முடிந்தது!', actionFailed: 'செயல் தோல்வியடைந்தது',
  },
  ja: {
    ...en,
    home: 'ホーム', tasks: 'タスク', calendar: 'カレンダー', notes: 'メモ', expenses: '経費',
    cancel: 'キャンセル', save: '保存', add: '追加', delete: '削除', edit: '編集', done: '完了',
    settings: '設定', profile: 'プロフィール', security: 'セキュリティ', notifications: '通知', preferences: '環境設定',
    editProfile: 'プロフィール編集', biometricAuth: '生体認証', biometricDesc: 'Face IDまたはTouch IDを使用',
    autoLock: '自動ロック', autoLockDesc: '非アクティブ時にロック', autoLockTimeout: 'ロックタイムアウト',
    changePassword: 'パスワード変更', deleteAccount: 'アカウント削除',
    pushNotifications: 'プッシュ通知', pushNotificationsDesc: 'タスクとイベントの通知を受信',
    language: '言語', languageDesc: 'アプリの言語', followSystem: 'システムに従う', defaultCurrency: 'デフォルト通貨',
    calendarSync: 'カレンダー同期', signOut: 'サインアウト', version: 'バージョン',
    calendarTitle: 'カレンダー', eventsOn: 'イベント', today: '今日', month: '月', week: '週', day: '日',
    newEvent: '新規イベント', editEvent: 'イベント編集',
    eventTitleLabel: 'タイトル', eventTitlePlaceholder: 'イベント名', eventDescLabel: '説明', eventDescPlaceholder: 'イベントの説明',
    allDay: '終日', startDate: '開始日', startTime: '開始時刻', endDate: '終了日', endTime: '終了時刻', color: '色',
    confirmDeleteTitle: 'イベント削除', confirmDeleteMsg: 'このイベントを削除してもよろしいですか？', saving: '保存中...',
    voiceNotes: 'ボイスメモ', tapToRecord: 'タップして録音', play: '再生', linkTask: 'リンク', input: '入力', output: '出力', associated: '関連付け済み',
    monthlySpendTitle: '月間支出', expenseItem: '支出', transactionHistory: '取引履歴', byCategory: 'カテゴリ別', noExpenses: '支出なし',
    todaysSchedule: '今日のスケジュール', priorityTasks: '優先タスク', expensesThisMonth: '今月の経費', totalSpentMsg: '今月の総支出',
    activeTasks: '進行中タスク', completionRate: '完了率', monthlySpend: '月間支出', eventsToday: '今日のイベント', viewAll: 'すべて表示', openCalendar: 'カレンダーを開く',
    noEventsToday: '今日の予定はありません',
    food: '食事', transport: '交通費', shopping: '買い物', entertainment: '娯楽',
    goodMorning: 'おはようございます', goodAfternoon: 'こんにちは', goodEvening: 'こんばんは', goodDay: 'こんにちは',
    weatherHot: '今日は暑いです！', weatherCold: '寒いです！', weatherSunshine: '今日は晴れです！', weatherCloudy: '曇りです', weatherRain: '傘を忘れずに！', weatherSnow: '雪の日！', weatherStorm: '嵐です！',
    chatbotGreeting: 'こんにちは！私はあなたのスマートアシスタントです ✨', chatbotHelp: 'お手伝いできること：',
    chatbotTask: '📝 タスクの作成（「タスク追加...」と言う）', chatbotEvent: '📅 イベントの追加（「会議を作成...」と言う）',
    chatbotExpense: '💰 経費の記録（「50ドル使った...」と言う）', chatbotReceipt: '📷 レシートをスキャン',
    chatbotAsk: '今日はどのようなお手伝いをしましょうか？',
    aiAssistant: 'スマートアシスタント', thinking: '考え中...', typeMessage: 'メッセージを入力...',
    priority: '優先度', category: 'カテゴリ', date: '日付', time: '時間',
    addToCalendar: 'カレンダーに追加', skip: 'スキップ', chooseColor: '色を選択',
    actionSuccess: 'アクション完了！', actionFailed: 'アクション失敗',
  },
  ko: {
    ...en,
    home: '홈', tasks: '할 일', calendar: '달력', notes: '메모', expenses: '지출',
    cancel: '취소', save: '저장', add: '추가', delete: '삭제', edit: '편집', done: '완료',
    settings: '설정', profile: '프로필', security: '보안', notifications: '알림', preferences: '환경 설정',
    editProfile: '프로필 편집', biometricAuth: '생체 인증', biometricDesc: 'Face ID 또는 Touch ID 사용',
    autoLock: '자동 잠금', autoLockDesc: '비활성 시 잠금', autoLockTimeout: '잠금 시간 초과',
    changePassword: '비밀번호 변경', deleteAccount: '계정 삭제',
    pushNotifications: '푸시 알림', pushNotificationsDesc: '할 일 및 일정 알림 받기',
    language: '언어', languageDesc: '앱 표시 언어', followSystem: '시스템 설정 따름', defaultCurrency: '기본 통화',
    calendarSync: '달력 동기화', signOut: '로그아웃', version: '버전',
    calendarTitle: '달력', eventsOn: '일정', today: '오늘', month: '월', week: '주', day: '일',
    newEvent: '새 이벤트', editEvent: '이벤트 편집',
    eventTitleLabel: '제목', eventTitlePlaceholder: '이벤트 제목', eventDescLabel: '설명', eventDescPlaceholder: '이벤트 설명',
    allDay: '종일', startDate: '시작 날짜', startTime: '시작 시간', endDate: '종료 날짜', endTime: '종료 시간', color: '색상',
    confirmDeleteTitle: '이벤트 삭제', confirmDeleteMsg: '이 이벤트를 삭제하시겠습니까?', saving: '저장 중...',
    voiceNotes: '음성 메모', tapToRecord: '녹음하려면 탭하세요', play: '재생', linkTask: '연결', input: '입력', output: '출력', associated: '연결됨',
    monthlySpendTitle: '월간 지출', expenseItem: '지출', transactionHistory: '거래 내역', byCategory: '카테고리별', noExpenses: '지출 내역 없음',
    todaysSchedule: '오늘의 일정', priorityTasks: '우선 과제', expensesThisMonth: '이번 달 지출', totalSpentMsg: '이번 달 총 지출',
    activeTasks: '진행 중인 과제', completionRate: '완료율', monthlySpend: '월간 지출', eventsToday: '오늘의 이벤트', viewAll: '모두 보기', openCalendar: '달력 열기',
    noEventsToday: '오늘 일정이 없습니다',
    food: '식비', transport: '교통비', shopping: '쇼핑', entertainment: '문화생활',
    goodMorning: '좋은 아침입니다', goodAfternoon: '좋은 오후입니다', goodEvening: '좋은 저녁입니다', goodDay: '안녕하세요',
    weatherHot: '더운 날씨네요!', weatherCold: '춥네요!', weatherSunshine: '화창한 날씨!', weatherCloudy: '구름이 많아요', weatherRain: '우산을 챙기세요!', weatherSnow: '눈이 옵니다!', weatherStorm: '폭풍우 조심하세요!',
    chatbotGreeting: '안녕하세요! 스마트 어시스턴트입니다 ✨', chatbotHelp: '도와드릴 수 있는 일:',
    chatbotTask: '📝 할 일 만들기', chatbotEvent: '📅 일정 추가',
    chatbotExpense: '💰 지출 기록', chatbotReceipt: '📷 영수증 스캔',
    chatbotAsk: '무엇을 도와드릴까요?',
    aiAssistant: '스마트 어시스턴트', thinking: '생각 중...', typeMessage: '메시지를 입력하세요...',
    priority: '우선순위', category: '카테고리', date: '날짜', time: '시간',
    addToCalendar: '달력에 추가', skip: '건너뛰기', chooseColor: '색상 선택',
    actionSuccess: '작업 완료!', actionFailed: '작업 실패',
  },
  id: {
    ...en,
    home: 'Beranda', tasks: 'Tugas', calendar: 'Kalender', notes: 'Catatan', expenses: 'Pengeluaran',
    cancel: 'Batal', save: 'Simpan', add: 'Tambah', delete: 'Hapus', edit: 'Ubah', done: 'Selesai',
    settings: 'Pengaturan', profile: 'Profil', security: 'Keamanan', notifications: 'Notifikasi', preferences: 'Preferensi',
    editProfile: 'Ubah Profil', biometricAuth: 'Autentikasi Biometrik', biometricDesc: 'Gunakan Face ID atau Touch ID',
    autoLock: 'Kunci Otomatis', autoLockDesc: 'Kunci aplikasi setelah tidak aktif', autoLockTimeout: 'Batas Waktu',
    changePassword: 'Ganti Kata Sandi', deleteAccount: 'Hapus Akun',
    pushNotifications: 'Notifikasi Push', pushNotificationsDesc: 'Terima notifikasi tugas & acara',
    language: 'Bahasa', languageDesc: 'Bahasa aplikasi', followSystem: 'Ikuti Sistem', defaultCurrency: 'Mata Uang',
    calendarSync: 'Sinkronisasi Kalender', signOut: 'Keluar', version: 'Versi',
    calendarTitle: 'Kalender', eventsOn: 'Acara pada', today: 'Hari Ini', month: 'Bulan', week: 'Minggu', day: 'Hari',
    newEvent: 'Acara Baru', editEvent: 'Ubah Acara',
    eventTitleLabel: 'Judul', eventTitlePlaceholder: 'Judul acara', eventDescLabel: 'Deskripsi', eventDescPlaceholder: 'Deskripsi acara',
    allDay: 'Sepanjang Hari', startDate: 'Tanggal Mulai', startTime: 'Waktu Mulai', endDate: 'Tanggal Selesai', endTime: 'Waktu Selesai', color: 'Warna',
    confirmDeleteTitle: 'Hapus Acara', confirmDeleteMsg: 'Apakah Anda yakin ingin menghapus acara ini?', saving: 'Menyimpan...',
    voiceNotes: 'Catatan Suara', tapToRecord: 'Ketuk untuk Rekam', play: 'Putar', linkTask: 'Tautkan', input: 'Masukan', output: 'Keluaran', associated: 'Tertaud',
    monthlySpendTitle: 'Pengeluaran Bulanan', expenseItem: 'Pengeluaran', transactionHistory: 'Riwayat Transaksi', byCategory: 'Berdasarkan Kategori', noExpenses: 'Tidak ada pengeluaran',
    todaysSchedule: 'Jadwal Hari Ini', priorityTasks: 'Tugas Prioritas', expensesThisMonth: 'Pengeluaran Bulan Ini', totalSpentMsg: 'Total pengeluaran bulan ini',
    activeTasks: 'Tugas Aktif', completionRate: 'Tingkat Penyelesaian', monthlySpend: 'Pengeluaran Bulanan', eventsToday: 'Acara Hari Ini', viewAll: 'Lihat semua', openCalendar: 'Buka Kalender',
    noEventsToday: 'Tidak ada acara hari ini',
    food: 'Makanan', transport: 'Transportasi', shopping: 'Belanja', entertainment: 'Hiburan',
    goodMorning: 'Selamat Pagi', goodAfternoon: 'Selamat Siang', goodEvening: 'Selamat Malam', goodDay: 'Halo',
    weatherHot: 'Cuaca panas!', weatherCold: 'Dingin sekali!', weatherSunshine: 'Cerah hari ini!', weatherCloudy: 'Berawan', weatherRain: 'Jangan lupa payung!', weatherSnow: 'Turun salju!', weatherStorm: 'Badai!',
    chatbotGreeting: 'Hai! Saya asisten pintar Anda ✨', chatbotHelp: 'Saya bisa membantu Anda:',
    chatbotTask: '📝 Buat tugas', chatbotEvent: '📅 Tambah acara',
    chatbotExpense: '💰 Lacak pengeluaran', chatbotReceipt: '📷 Pindai struk',
    chatbotAsk: 'Apa yang bisa saya bantu hari ini?',
    aiAssistant: 'Asisten Pintar', thinking: 'Sedang berpikir...', typeMessage: 'Ketik pesan...',
    priority: 'Prioritas', category: 'Kategori', date: 'Tanggal', time: 'Waktu',
    addToCalendar: 'Tambah ke Kalendar', skip: 'Lewati', chooseColor: 'Pilih Warna',
    actionSuccess: 'Tindakan berhasil!', actionFailed: 'Tindakan gagal',
  },
  es: {
    ...en,
    home: 'Inicio', tasks: 'Tareas', calendar: 'Calendario', notes: 'Notas', expenses: 'Gastos',
    cancel: 'Cancelar', save: 'Guardar', add: 'Añadir', delete: 'Eliminar', edit: 'Editar', done: 'Hecho',
    settings: 'Ajustes', profile: 'Perfil', security: 'Seguridad', notifications: 'Notificaciones', preferences: 'Preferencias',
    editProfile: 'Editar Perfil', biometricAuth: 'Autenticación Biométrica', biometricDesc: 'Usar Face ID o Touch ID',
    autoLock: 'Bloqueo Automático', autoLockDesc: 'Bloquear al estar inactivo', autoLockTimeout: 'Tiempo de espera',
    changePassword: 'Cambiar Contraseña', deleteAccount: 'Eliminar Cuenta',
    pushNotifications: 'Notificaciones Push', pushNotificationsDesc: 'Recibir alertas de tareas y eventos',
    language: 'Idioma', languageDesc: 'Idioma de la aplicación', followSystem: 'Seguir sistema', defaultCurrency: 'Moneda por defecto',
    calendarSync: 'Sincronizar Calendario', signOut: 'Cerrar sesión', version: 'Versión',
    calendarTitle: 'Calendario', eventsOn: 'Eventos el', today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día',
    newEvent: 'Nuevo Evento', editEvent: 'Editar Evento',
    eventTitleLabel: 'Título', eventTitlePlaceholder: 'Título del evento', eventDescLabel: 'Descripción', eventDescPlaceholder: 'Descripción del evento',
    allDay: 'Todo el día', startDate: 'Fecha de inicio', startTime: 'Hora de inicio', endDate: 'Fecha de fin', endTime: 'Hora de fin', color: 'Color',
    confirmDeleteTitle: 'Eliminar Evento', confirmDeleteMsg: '¿Estás seguro de que quieres eliminar este evento?', saving: 'Guardando...',
    voiceNotes: 'Notas de Voz', tapToRecord: 'Tocar para Grabar', play: 'Reproducir', linkTask: 'Vincular', input: 'Entrada', output: 'Salida', associated: 'Vinculado',
    monthlySpendTitle: 'Gasto Mensual', expenseItem: 'Gasto', transactionHistory: 'Historial de Transacciones', byCategory: 'Por Categoría', noExpenses: 'Sin gastos registrados',
    todaysSchedule: 'Horario de hoy', priorityTasks: 'Tareas prioritarias', expensesThisMonth: 'Gastos este mes', totalSpentMsg: 'Total gastado este mes',
    activeTasks: 'Tareas activas', completionRate: 'Tasa de finalización', monthlySpend: 'Gasto mensual', eventsToday: 'Eventos hoy', viewAll: 'Ver todo', openCalendar: 'Abrir calendario',
    noEventsToday: 'No hay eventos hoy',
    food: 'Comida', transport: 'Transporte', shopping: 'Compras', entertainment: 'Entretenimiento',
    goodMorning: 'Buenos días', goodAfternoon: 'Buenas tardes', goodEvening: 'Buenas noches', goodDay: 'Hola',
    weatherHot: '¡Hace calor!', weatherCold: '¡Qué frío!', weatherSunshine: '¡Día soleado!', weatherCloudy: 'Nublado', weatherRain: '¡No olvides el paraguas!', weatherSnow: '¡Día de nieve!', weatherStorm: '¡Tormenta!',
    chatbotGreeting: '¡Hola! Soy tu asistente inteligente ✨', chatbotHelp: 'Puedo ayudarte:',
    chatbotTask: '📝 Crear tareas', chatbotEvent: '📅 Añadir eventos',
    chatbotExpense: '💰 Rastrear gastos', chatbotReceipt: '📷 Escanear recibos',
    chatbotAsk: '¿En qué puedo ayudarte hoy?',
    aiAssistant: 'Asistente IA', thinking: 'Pensando...', typeMessage: 'Escribe un mensaje...',
    priority: 'Prioridad', category: 'Categoría', date: 'Fecha', time: 'Hora',
    addToCalendar: 'Añadir al Calendario', skip: 'Omitir', chooseColor: 'Elegir Color',
    actionSuccess: '¡Acción completada!', actionFailed: 'Acción fallida',
  },
  fr: {
    ...en,
    home: 'Accueil', tasks: 'Tâches', calendar: 'Calendrier', notes: 'Notes', expenses: 'Dépenses',
    cancel: 'Annuler', save: 'Enregistrer', add: 'Ajouter', delete: 'Supprimer', edit: 'Modifier', done: 'Terminé',
    settings: 'Paramètres', profile: 'Profil', security: 'Sécurité', notifications: 'Notifications', preferences: 'Préférences',
    editProfile: 'Modifier le profil', biometricAuth: 'Authentification biométrique', biometricDesc: 'Utiliser Face ID ou Touch ID',
    autoLock: 'Verrouillage auto', autoLockDesc: "Verrouiller après inactivité", autoLockTimeout: 'Délai de verrouillage',
    changePassword: 'Changer le mot de passe', deleteAccount: 'Supprimer le compte',
    pushNotifications: 'Notifications Push', pushNotificationsDesc: 'Recevoir des alertes',
    language: 'Langue', languageDesc: "Langue de l'application", followSystem: 'Suivre le système', defaultCurrency: 'Devise par défaut',
    calendarSync: 'Synchro Calendrier', signOut: 'Se déconnecter', version: 'Version',
    calendarTitle: 'Calendrier', eventsOn: 'Événements le', today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour',
    newEvent: 'Nouvel événement', editEvent: "Modifier l'événement",
    eventTitleLabel: 'Titre', eventTitlePlaceholder: "Titre de l'événement", eventDescLabel: 'Description', eventDescPlaceholder: "Description de l'événement",
    allDay: 'Toute la journée', startDate: 'Date de début', startTime: 'Heure de début', endDate: 'Date de fin', endTime: 'Heure de fin', color: 'Couleur',
    confirmDeleteTitle: "Supprimer l'événement", confirmDeleteMsg: 'Êtes-vous sûr de vouloir supprimer cet événement ?', saving: 'Enregistrement...',
    voiceNotes: 'Notes Vocales', tapToRecord: 'Appuyer pour enregistrer', play: 'Lire', linkTask: 'Lier', input: 'Entrée', output: 'Sortie', associated: 'Lié',
    monthlySpendTitle: 'Dépenses Mensuelles', expenseItem: 'Dépense', transactionHistory: 'Historique des transactions', byCategory: 'Par Catégorie', noExpenses: 'Aucune dépense',
    todaysSchedule: "L'emploi du temps", priorityTasks: 'Tâches prioritaires', expensesThisMonth: 'Dépenses ce mois-ci', totalSpentMsg: 'Total dépensé ce mois-ci',
    activeTasks: 'Tâches actives', completionRate: "Taux d'achèvement", monthlySpend: 'Dépenses mensuelles', eventsToday: "Événements d'aujourd'hui", viewAll: 'Voir tout', openCalendar: 'Ouvrir calendrier',
    noEventsToday: "Aucun événement aujourd'hui",
    food: 'Nourriture', transport: 'Transport', shopping: 'Shopping', entertainment: 'Divertissement',
    goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir', goodDay: 'Bonjour',
    weatherHot: 'Il fait chaud !', weatherCold: 'Il fait froid !', weatherSunshine: 'Grand soleil !', weatherCloudy: 'Nuageux', weatherRain: "N'oubliez pas le parapluie !", weatherSnow: 'Il neige !', weatherStorm: 'Orageux !',
    chatbotGreeting: 'Salut! Je suis votre assistant intelligent ✨', chatbotHelp: 'Je peux vous aider:',
    chatbotTask: '📝 Créer des tâches', chatbotEvent: '📅 Ajouter des événements',
    chatbotExpense: '💰 Suivre les dépenses', chatbotReceipt: '📷 Scanner des reçus',
    chatbotAsk: "En quoi puis-je vous aider aujourd'hui?",
    aiAssistant: 'Assistant IA', thinking: 'Réfléchit...', typeMessage: 'Écrire un message...',
    priority: 'Priorité', category: 'Catégorie', date: 'Date', time: 'Heure',
    addToCalendar: 'Ajouter au Calendario', skip: 'Passer', chooseColor: 'Choisir Couleur',
    actionSuccess: 'Action terminée !', actionFailed: 'Action échouée',
  },
  de: {
    ...en,
    home: 'Start', tasks: 'Aufgaben', calendar: 'Kalender', notes: 'Notizen', expenses: 'Ausgaben',
    cancel: 'Abbrechen', save: 'Speichern', add: 'Hinzufügen', delete: 'Löschen', edit: 'Bearbeiten', done: 'Fertig',
    settings: 'Einstellungen', profile: 'Profil', security: 'Sicherheit', notifications: 'Benachrichtigungen', preferences: 'Einstellungen',
    editProfile: 'Profil bearbeiten', biometricAuth: 'Biometrische Authentifizierung', biometricDesc: 'Face ID oder Touch ID verwenden',
    autoLock: 'Automatische Sperre', autoLockDesc: 'Bei Inaktivität sperren', autoLockTimeout: 'Sperrzeit',
    changePassword: 'Passwort ändern', deleteAccount: 'Konto löschen',
    pushNotifications: 'Push-Benachrichtigungen', pushNotificationsDesc: 'Benachrichtigungen für Aufgaben & Events',
    language: 'Sprache', languageDesc: 'App-Sprache', followSystem: 'System folgen', defaultCurrency: 'Standardwährung',
    calendarSync: 'Kalender synchronisieren', signOut: 'Abmelden', version: 'Version',
    calendarTitle: 'Kalender', eventsOn: 'Ereignisse am', today: 'Heute', month: 'Monat', week: 'Woche', day: 'Tag',
    newEvent: 'Neues Ereignis', editEvent: 'Ereignis bearbeiten',
    eventTitleLabel: 'Titel', eventTitlePlaceholder: 'Ereignistitel', eventDescLabel: 'Beschreibung', eventDescPlaceholder: 'Ereignisbeschreibung',
    allDay: 'Ganztägig', startDate: 'Startdatum', startTime: 'Startzeit', endDate: 'Enddatum', endTime: 'Endzeit', color: 'Farbe',
    confirmDeleteTitle: 'Ereignis löschen', confirmDeleteMsg: 'Möchten Sie dieses Ereignis wirklich löschen?', saving: 'Speichern...',
    voiceNotes: 'Sprachnotizen', tapToRecord: 'Zum Aufnehmen tippen', play: 'Abspielen', linkTask: 'Verknüpfen', input: 'Eingabe', output: 'Ausgabe', associated: 'Verknüpft',
    monthlySpendTitle: 'Monatliche Ausgaben', expenseItem: 'Ausgabe', transactionHistory: 'Transaktionsverlauf', byCategory: 'Nach Kategorie', noExpenses: 'Keine Ausgaben',
    todaysSchedule: 'Heutiger Zeitplan', priorityTasks: 'Prioritätsaufgaben', expensesThisMonth: 'Ausgaben diesen Monat', totalSpentMsg: 'Gesamtausgaben diesen Monat',
    activeTasks: 'Aktive Aufgaben', completionRate: 'Abschlussrate', monthlySpend: 'Monatliche Ausgaben', eventsToday: 'Heutige Ereignisse', viewAll: 'Alle ansehen', openCalendar: 'Kalender öffnen',
    noEventsToday: 'Keine Ereignisse heute',
    food: 'Essen', transport: 'Transport', shopping: 'Einkaufen', entertainment: 'Unterhaltung',
    goodMorning: 'Guten Morgen', goodAfternoon: 'Guten Tag', goodEvening: 'Guten Abend', goodDay: 'Hallo',
    weatherHot: 'Es ist heiß!', weatherCold: 'Es ist kalt!', weatherSunshine: 'Sonnenschein!', weatherCloudy: 'Bewölkt', weatherRain: 'Regenschirm nicht vergessen!', weatherSnow: 'Schneetag!', weatherStorm: 'Stürmisch!',
    chatbotGreeting: 'Hallo! Ich bin dein intelligenter Assistent ✨', chatbotHelp: 'Ich kann dir helfen:',
    chatbotTask: '📝 Aufgaben erstellen', chatbotEvent: '📅 Ereignisse hinzufügen',
    chatbotExpense: '💰 Ausgaben verfolgen', chatbotReceipt: '📷 Quittungen scannen',
    chatbotAsk: 'Wie kann ich dir heute helfen?',
    aiAssistant: 'KI Assistent', thinking: 'Nachdenken...', typeMessage: 'Nachricht eingeben...',
    priority: 'Priorität', category: 'Kategorie', date: 'Datum', time: 'Zeit',
    addToCalendar: 'Zum Kalender hinzufügen', skip: 'Überspringen', chooseColor: 'Farbe wählen',
    actionSuccess: 'Aktion abgeschlossen!', actionFailed: 'Aktion fehlgeschlagen',
  },
  th: {
    ...en,
    home: 'หน้าแรก', tasks: 'งาน', calendar: 'ปฏิทิน', notes: 'บันทึก', expenses: 'ค่าใช้จ่าย',
    cancel: 'ยกเลิก', save: 'บันทึก', add: 'เพิ่ม', delete: 'ลบ', edit: 'แก้ไข', done: 'เสร็จสิ้น',
    settings: 'การตั้งค่า', profile: 'โปรไฟล์', security: 'ความปลอดภัย', notifications: 'การแจ้งเตือน', preferences: 'การตั้งค่า',
    editProfile: 'แก้ไขโปรไฟล์', biometricAuth: 'การยืนยันตัวตนทางชีวภาพ', biometricDesc: 'ใช้ Face ID หรือ Touch ID',
    autoLock: 'ล็อคอัตโนมัติ', autoLockDesc: 'ล็อคแอปเมื่อไม่ได้ใช้งาน', autoLockTimeout: 'หมดเวลาล็อค',
    changePassword: 'เปลี่ยนรหัสผ่าน', deleteAccount: 'ลบบัญชี',
    pushNotifications: 'การแจ้งเตือนแบบพุช', pushNotificationsDesc: 'รับการแจ้งเตือนสำหรับงานและกิจกรรม',
    language: 'ภาษา', languageDesc: 'ภาษาของแอป', followSystem: 'ตามระบบ', defaultCurrency: 'สกุลเงินหลัก',
    calendarSync: 'ซิงค์ปฏิทิน', signOut: 'ออกจากระบบ', version: 'เวอร์ชัน',
    calendarTitle: 'ปฏิทิน', eventsOn: 'กิจกรรมเมื่อ', today: 'วันนี้', month: 'เดือน', week: 'สัปดาห', day: 'วัน',
    newEvent: 'กิจกรรมใหม่', editEvent: 'แก้ไขกิจกรรม',
    eventTitleLabel: 'ชื่อกิจกรรม', eventTitlePlaceholder: 'ชื่อกิจกรรม', eventDescLabel: 'รายละเอียด', eventDescPlaceholder: 'รายละเอียดกิจกรรม',
    allDay: 'ทั้งวัน', startDate: 'วันที่เริ่ม', startTime: 'เวลาเริ่ม', endDate: 'วันที่สิ้นสุด', endTime: 'เวลาสิ้นสุด', color: 'สี',
    confirmDeleteTitle: 'ลบกิจกรรม', confirmDeleteMsg: 'คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมนี้?', saving: 'กำลังบันทึก...',
    voiceNotes: 'บันทึกเสียง', tapToRecord: 'แตะเพื่อบันทึก', play: 'เล่น', linkTask: 'เชื่อมโยง', input: 'นำเข้า', output: 'นำออก', associated: 'เชื่อมโยงแล้ว',
    monthlySpendTitle: 'รายจ่ายรายเดือน', expenseItem: 'ค่าใช้จ่าย', transactionHistory: 'ประวัติการทำธุรกรรม', byCategory: 'ตามหมวดหมู่', noExpenses: 'ไม่มีค่าใช้จ่าย',
    todaysSchedule: 'ตารางวันนี้', priorityTasks: 'งานสำคัญ', expensesThisMonth: 'ค่าใช้จ่ายเดือนนี้', totalSpentMsg: 'ยอดใช้จ่ายเดือนนี้',
    activeTasks: 'งานที่ทำอยู่', completionRate: 'อัตราความสำเร็จ', monthlySpend: 'รายจ่ายรายเดือน', eventsToday: 'กิจกรรมวันนี้', viewAll: 'ดูทั้งหมด', openCalendar: 'เปิดปฏิทิน',
    noEventsToday: 'ไม่มีกิจกรรมวันนี้',
    food: 'อาหาร', transport: 'เดินทาง', shopping: 'ช้อปปิ้ง', entertainment: 'บันเทิง',
    goodMorning: 'สวัสดีตอนเช้า', goodAfternoon: 'สวัสดีตอนบ่าย', goodEvening: 'สวัสดีตอนเย็น', goodDay: 'สวัสดี',
    weatherHot: 'อากาศร้อน!', weatherCold: 'หนาวจัง!', weatherSunshine: 'แดดจัด!', weatherCloudy: 'มีเมฆมาก', weatherRain: 'อย่าลืมร่ม!', weatherSnow: 'หิมะตก!', weatherStorm: 'พายุเข้า!',
    chatbotGreeting: 'สวัสดี! ฉันเป็นผู้ช่วยอัจฉริยะของคุณ ✨', chatbotHelp: 'ฉันสามารถช่วยคุณ:',
    chatbotTask: '📝 สร้างงาน', chatbotEvent: '📅 เพิ่มกิจกรรม',
    chatbotExpense: '💰 ติดตามค่าใช้จ่าย', chatbotReceipt: '📷 สแกนใบเสร็จ',
    chatbotAsk: 'ให้ฉันช่วยอะไรคุณดีวันนี้?',
    aiAssistant: 'ผู้ช่วย AI', thinking: 'กำลังคิด...', typeMessage: 'พิมพ์ข้อความ...',
    priority: 'ความสำคัญ', category: 'หมวดหมู่', date: 'วันที่', time: 'เวลา',
    addToCalendar: 'เพิ่มลงในปฏิทิน', skip: 'ข้าม', chooseColor: 'เลือกสี',
    actionSuccess: 'ดำเนินการสำเร็จ!', actionFailed: 'ดำเนินการล้มเหลว',
  },
  vi: {
    ...en,
    home: 'Trang chủ',
    tasks: 'Nhiệm vụ',
    calendar: 'Lịch',
    notes: 'Ghi chú',
    expenses: 'Chi phí',
    cancel: 'Hủy', save: 'Lưu', add: 'Thêm', delete: 'Xóa', edit: 'Sửa', done: 'Xong',

    // Settings
    settings: 'Cài đặt', profile: 'Hồ sơ', security: 'Bảo mật', notifications: 'Thông báo', preferences: 'Tùy chọn',
    editProfile: 'Chỉnh sửa hồ sơ', biometricAuth: 'Xác thực sinh trắc học', biometricDesc: 'Dùng Face/Touch ID để mở khóa',
    autoLock: 'Tự động khóa', autoLockDesc: 'Khóa ứng dụng khi không dùng', autoLockTimeout: 'Thời gian chờ khóa',
    changePassword: 'Đổi mật khẩu', deleteAccount: 'Xóa tài khoản',
    pushNotifications: 'Thông báo đẩy', pushNotificationsDesc: 'Nhận thông báo công việc & sự kiện',
    language: 'Ngôn ngữ', languageDesc: 'Ngôn ngữ ứng dụng', followSystem: 'Theo hệ thống', defaultCurrency: 'Tiền tệ',
    calendarSync: 'Đồng bộ lịch', signOut: 'Đăng xuất', version: 'Phiên bản',

    // Calendar
    calendarTitle: 'Lịch', eventsOn: 'Sự kiện vào', today: 'Hôm nay', month: 'Tháng', week: 'Tuần', day: 'Ngày',
    newEvent: 'Sự kiện mới', editEvent: 'Sửa sự kiện',
    eventTitleLabel: 'Tiêu đề', eventTitlePlaceholder: 'Tên sự kiện', eventDescLabel: 'Mô tả', eventDescPlaceholder: 'Mô tả sự kiện',
    allDay: 'Cả ngày', startDate: 'Ngày bắt đầu', startTime: 'Thời gian bắt đầu', endDate: 'Ngày kết thúc', endTime: 'Thời gian kết thúc', color: 'Màu sắc',
    confirmDeleteTitle: 'Xóa sự kiện', confirmDeleteMsg: 'Bạn có chắc chắn muốn xóa sự kiện này?', saving: 'Đang lưu...',

    // Notes
    voiceNotes: 'Ghi chú giọng nói', tapToRecord: 'Chạm để thu âm', play: 'Phát', linkTask: 'Liên kết',
    input: 'Đầu vào', output: 'Đầu ra', associated: 'Đã liên kết',

    // Expenses
    monthlySpendTitle: 'Chi tiêu tháng', expenseItem: 'Chi phí', monthlySpend: 'Chi tiêu tháng',
    transactionHistory: 'Lịch sử giao dịch', byCategory: 'Theo danh mục', noExpenses: 'Chưa có chi phí nào',

    todaysSchedule: 'Lịch trình hôm nay', priorityTasks: 'Nhiệm vụ ưu tiên', expensesThisMonth: 'Chi phí tháng này',
    viewAll: 'Xem tất cả', openCalendar: 'Mở lịch', totalSpentMsg: 'Đã chi tháng này', noEventsToday: 'Không có sự kiện hôm nay',
    activeTasks: 'Nhiệm vụ', completionRate: 'Hoàn thành', eventsToday: 'Sự kiện hôm nay',
    food: 'Ẩm thực', transport: 'Di chuyển', shopping: 'Mua sắm', entertainment: 'Giải trí',
    goodMorning: 'Chào buổi sáng', goodAfternoon: 'Chào buổi chiều', goodEvening: 'Chào buổi tối', goodDay: 'Xin chào',
    weatherHot: 'Trời nóng quá!', weatherCold: 'Trời lạnh quá!', weatherSunshine: 'Nắng đẹp hôm nay!', weatherCloudy: 'Trời nhiều mây', weatherRain: 'Nhớ mang ô nhé!', weatherSnow: 'Tuyết rơi!', weatherStorm: 'Trời có bão!',

    // Chatbot
    chatbotGreeting: 'Xin chào! Tôi là trợ lý thông minh của bạn ✨', chatbotHelp: 'Tôi có thể giúp bạn:',
    chatbotTask: '📝 Tạo công việc (nói "thêm công việc...")', chatbotEvent: '📅 Thêm sự kiện (nói "tạo cuộc họp...")',
    chatbotExpense: '💰 Theo dõi chi tiêu (nói "chi tiêu 50k...")', chatbotReceipt: '📷 Quét biên lai',
    chatbotAsk: 'Tôi có thể giúp gì cho bạn hôm nay?',
    aiAssistant: 'Trợ lý AI', thinking: 'Đang suy nghĩ...', typeMessage: 'Nhập tin nhắn...',
    priority: 'Ưu tiên', category: 'Danh mục', date: 'Ngày', time: 'Thời gian',
    addToCalendar: 'Thêm vào lịch', skip: 'Bỏ qua', chooseColor: 'Chọn màu',
    actionSuccess: 'Thao tác thành công!', actionFailed: 'Thao tác thất bại',
  },
};

// Helper hook to get translations
export const useTranslations = () => {
  const language = useLanguageStore((state) => state.language);
  const lang = useMemo(() => {
    if (language === 'system') {
      return useLanguageStore.getState().getEffectiveLanguage();
    }
    return language as Exclude<AppLanguage, 'system'>;
  }, [language]);
  return translations[lang];
};

export const useEffectiveLanguage = (): Exclude<AppLanguage, 'system'> => {
  const language = useLanguageStore((state) => state.language);
  return useMemo(() => {
    if (language === 'system') {
      return useLanguageStore.getState().getEffectiveLanguage();
    }
    return language as Exclude<AppLanguage, 'system'>;
  }, [language]);
};
