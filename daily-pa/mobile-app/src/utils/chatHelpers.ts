/**
 * Chat Helper Utilities
 * Common functions for AI chat functionality
 */

/**
 * Get local date string in YYYY-MM-DD format
 */
export const getLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get local time string in HH:MM format
 */
export const getLocalTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Add hours to a time string
 */
export const addHoursToTime = (time: string, hours: number = 1): string => {
  const [h, m] = time.split(':').map(Number);
  const newHour = (h + hours) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Parse relative date strings to YYYY-MM-DD
 */
export const parseRelativeDate = (text: string, lang: 'en' | 'zh' = 'en'): string => {
  const today = new Date();
  const lowerText = text.toLowerCase();
  
  // Tomorrow
  if (lowerText.includes('tomorrow') || text.includes('明天')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return formatDate(tomorrow);
  }
  
  // Day after tomorrow
  if (lowerText.includes('day after tomorrow') || text.includes('后天')) {
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    return formatDate(dayAfter);
  }
  
  // Next week
  if (lowerText.includes('next week') || text.includes('下周')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return formatDate(nextWeek);
  }
  
  // Default to today
  return formatDate(today);
};

/**
 * Format Date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time for display (12-hour format)
 */
export const formatTimeDisplay = (time: string, lang: 'en' | 'zh' = 'en'): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? (lang === 'zh' ? '下午' : 'PM') : (lang === 'zh' ? '上午' : 'AM');
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Detect language from text
 */
export const detectLanguage = (text: string): 'en' | 'zh' => {
  const chinesePattern = /[\u4e00-\u9fff]/;
  return chinesePattern.test(text) ? 'zh' : 'en';
};

/**
 * Generate unique ID for actions/messages
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Parse amount from text (handles both $ and ¥)
 */
export const parseAmount = (text: string): number => {
  const match = text.match(/[¥$]?\s*(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Get action icon name
 */
export const getActionIconName = (type: string): string => {
  switch (type) {
    case 'task':
    case 'todo':
      return 'list';
    case 'expense':
      return 'card';
    case 'calendar':
      return 'calendar';
    default:
      return 'help-circle';
  }
};

/**
 * Priority configuration
 */
export const PRIORITIES = [
  { key: 'high', color: '#EF4444', label: 'High', labelZh: '高', emoji: '🔴' },
  { key: 'medium', color: '#3B82F6', label: 'Medium', labelZh: '中', emoji: '🔵' },
  { key: 'low', color: '#9CA3AF', label: 'Low', labelZh: '低', emoji: '⚪️' },
] as const;

/**
 * Expense categories
 */
export const EXPENSE_CATEGORIES = [
  { key: 'food', labelEn: 'Food', labelZh: '餐饮', icon: 'pizza' },
  { key: 'transport', labelEn: 'Transport', labelZh: '交通', icon: 'car' },
  { key: 'shopping', labelEn: 'Shopping', labelZh: '购物', icon: 'basket' },
  { key: 'entertainment', labelEn: 'Entertainment', labelZh: '娱乐', icon: 'game-controller' },
  { key: 'bills', labelEn: 'Bills', labelZh: '账单', icon: 'document' },
  { key: 'health', labelEn: 'Health', labelZh: '医疗', icon: 'medkit' },
  { key: 'education', labelEn: 'Education', labelZh: '教育', icon: 'school' },
  { key: 'other', labelEn: 'Other', labelZh: '其他', icon: 'ellipsis-horizontal' },
] as const;

/**
 * Todo color options
 */
export const TODO_COLORS = [
  { value: 'yellow', emoji: '🟡' },
  { value: 'blue', emoji: '🔵' },
  { value: 'pink', emoji: '🩷' },
  { value: 'green', emoji: '🟢' },
  { value: 'purple', emoji: '🟣' },
] as const;

/**
 * Task icon options
 */
export const TASK_ICONS = [
  'document-text-outline',
  'cart-outline',
  'briefcase-outline',
  'walk-outline',
  'call-outline',
  'mail-outline',
  'flag-outline',
  'star-outline',
  'restaurant-outline',
  'medkit-outline',
  'car-outline',
  'book-outline',
] as const;

/**
 * Time slots for calendar
 */
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
] as const;

/**
 * Get upcoming dates for date picker
 */
export const getUpcomingDates = (days: number = 7, lang: 'en' | 'zh' = 'en') => {
  const dates = [];
  const today = new Date();
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdaysZh = ['日', '一', '二', '三', '四', '五', '六'];
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      full: formatDate(d),
      day: d.getDate(),
      weekday: lang === 'zh' ? weekdaysZh[d.getDay()] : weekdaysEn[d.getDay()],
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return dates;
};
