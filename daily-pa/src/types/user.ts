/**
 * 用户相关类型定义
 */

import type { Tables } from './database.types';

// 数据库行类型
export type ProfileRow = Tables<'profiles'>;
export type NotificationSettingsRow = Tables<'notification_settings'>;
export type GoogleCalendarConnectionRow = Tables<'google_calendar_connections'>;

// 业务层类型
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  role: 'user' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  currency: string;
  timezone: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  reminderBeforeMinutes: number;
}

export interface GoogleCalendarConnection {
  id: string;
  userId: string;
  calendarId: string | null;
  lastSyncAt: Date | null;
  isConnected: boolean;
}

// 输入类型
export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateNotificationSettingsInput {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  dailySummary?: boolean;
  weeklySummary?: boolean;
  reminderBeforeMinutes?: number;
}

// 转换函数类型
export function profileRowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    googleId: row.google_id,
    role: row.role,
    preferences: row.preferences as UserPreferences,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
