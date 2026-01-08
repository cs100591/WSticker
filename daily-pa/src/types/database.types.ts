/**
 * Supabase 数据库类型定义
 * 此文件应由 Supabase CLI 自动生成，但这里提供手动定义版本
 * 运行: npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          google_id: string | null;
          role: 'user' | 'admin';
          preferences: UserPreferencesJson;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          google_id?: string | null;
          role?: 'user' | 'admin';
          preferences?: UserPreferencesJson;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          google_id?: string | null;
          role?: 'user' | 'admin';
          preferences?: UserPreferencesJson;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          priority: 'low' | 'medium' | 'high';
          status: 'active' | 'completed';
          tags: string[];
          color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
          calendar_event_id: string | null;
          google_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'active' | 'completed';
          tags?: string[];
          color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
          calendar_event_id?: string | null;
          google_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          priority?: 'low' | 'medium' | 'high';
          status?: 'active' | 'completed';
          tags?: string[];
          color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
          calendar_event_id?: string | null;
          google_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'todos_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_todos_calendar_event';
            columns: ['calendar_event_id'];
            referencedRelation: 'calendar_events';
            referencedColumns: ['id'];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          category: ExpenseCategoryType;
          description: string | null;
          expense_date: string;
          receipt_url: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          category: ExpenseCategoryType;
          description?: string | null;
          expense_date: string;
          receipt_url?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          category?: ExpenseCategoryType;
          description?: string | null;
          expense_date?: string;
          receipt_url?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          all_day: boolean;
          source: 'manual' | 'todo' | 'google';
          google_event_id: string | null;
          todo_id: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          all_day?: boolean;
          source?: 'manual' | 'todo' | 'google';
          google_event_id?: string | null;
          todo_id?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          all_day?: boolean;
          source?: 'manual' | 'todo' | 'google';
          google_event_id?: string | null;
          todo_id?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_events_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_events_todo_id_fkey';
            columns: ['todo_id'];
            referencedRelation: 'todos';
            referencedColumns: ['id'];
          }
        ];
      };
      monthly_reports: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          report_data: ReportDataJson;
          generated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          month: number;
          report_data: ReportDataJson;
          generated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          month?: number;
          report_data?: ReportDataJson;
          generated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'monthly_reports_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          push_enabled: boolean;
          daily_summary: boolean;
          weekly_summary: boolean;
          reminder_before_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          push_enabled?: boolean;
          daily_summary?: boolean;
          weekly_summary?: boolean;
          reminder_before_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_enabled?: boolean;
          push_enabled?: boolean;
          daily_summary?: boolean;
          weekly_summary?: boolean;
          reminder_before_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      google_calendar_connections: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_id: string | null;
          last_sync_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_id?: string | null;
          last_sync_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          calendar_id?: string | null;
          last_sync_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'google_calendar_connections_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      share_links: {
        Row: {
          id: string;
          user_id: string;
          resource_type: 'todo_list' | 'expense_report';
          resource_id: string | null;
          token: string;
          password_hash: string | null;
          expires_at: string | null;
          access_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: 'todo_list' | 'expense_report';
          resource_id?: string | null;
          token: string;
          password_hash?: string | null;
          expires_at?: string | null;
          access_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_type?: 'todo_list' | 'expense_report';
          resource_id?: string | null;
          token?: string;
          password_hash?: string | null;
          expires_at?: string | null;
          access_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'share_links_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// JSON 类型定义
export type UserPreferencesJson = {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  currency: string;
  timezone: string;
};

export type ReportDataJson = {
  todos: {
    total: number;
    completed: number;
    completionRate: number;
    byPriority: Record<string, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    dailyAverage: number;
    topCategories: Array<{ category: string; amount: number }>;
  };
  insights: string[];
};

export type ExpenseCategoryType =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

// 便捷类型别名
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
