/**
 * 日历事件相关类型定义
 */

import type { Tables, InsertTables, UpdateTables } from './database.types';

// 数据库行类型
export type CalendarEventRow = Tables<'calendar_events'>;
export type CalendarEventInsert = InsertTables<'calendar_events'>;
export type CalendarEventUpdate = UpdateTables<'calendar_events'>;

// 事件来源类型
export type EventSource = 'manual' | 'todo' | 'google';

// 业务层类型
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  source: EventSource;
  googleEventId: string | null;
  todoId: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 输入类型
export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  allDay?: boolean;
  source?: EventSource;
  todoId?: string;
  color?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  startTime?: Date | string;
  endTime?: Date | string;
  allDay?: boolean;
  color?: string | null;
}


// 日历视图类型
export type CalendarViewType = 'month' | 'week' | 'day';

// 过滤类型
export interface CalendarEventFilters {
  source?: EventSource | 'all';
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

// 列表响应类型
export interface CalendarEventListResponse {
  events: CalendarEvent[];
  total: number;
}

// 转换函数
export function calendarEventRowToEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startTime: new Date(row.start_time),
    endTime: new Date(row.end_time),
    allDay: row.all_day,
    source: row.source as EventSource,
    googleEventId: row.google_event_id,
    todoId: row.todo_id,
    color: row.color,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createCalendarEventInputToInsert(
  input: CreateCalendarEventInput,
  userId: string
): CalendarEventInsert {
  return {
    user_id: userId,
    title: input.title,
    description: input.description,
    start_time:
      typeof input.startTime === 'string'
        ? input.startTime
        : input.startTime.toISOString(),
    end_time:
      typeof input.endTime === 'string'
        ? input.endTime
        : input.endTime.toISOString(),
    all_day: input.allDay ?? false,
    source: input.source ?? 'manual',
    todo_id: input.todoId,
    color: input.color,
  };
}

// 事件来源显示名称
export const EVENT_SOURCE_LABELS: Record<EventSource, string> = {
  manual: '手动创建',
  todo: '待办事项',
  google: 'Google 日历',
};

// 检查事件是否在指定日期范围内
export function isEventInRange(
  event: CalendarEvent,
  start: Date,
  end: Date
): boolean {
  return event.startTime <= end && event.endTime >= start;
}

// 按日期分组事件
export function groupEventsByDate(
  events: CalendarEvent[]
): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dateKey = event.startTime.toISOString().split('T')[0] as string;
    const existing = grouped.get(dateKey) ?? [];
    existing.push(event);
    grouped.set(dateKey, existing);
  }

  return grouped;
}
