/**
 * 待办事项相关类型定义
 */

import type { Tables, InsertTables, UpdateTables } from './database.types';

// 数据库行类型
export type TodoRow = Tables<'todos'>;
export type TodoInsert = InsertTables<'todos'>;
export type TodoUpdate = UpdateTables<'todos'>;

// 优先级和状态类型
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed';

// 业务层类型
export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: TodoPriority;
  status: TodoStatus;
  tags: string[];
  calendarEventId: string | null;
  googleEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 输入类型
export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: Date | string;
  priority?: TodoPriority;
  tags?: string[];
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  dueDate?: Date | string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  tags?: string[];
}

// 过滤和排序类型
export interface TodoFilters {
  status?: TodoStatus | 'all';
  priority?: TodoPriority | 'all';
  tags?: string[];
  search?: string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
}

export type TodoSortField = 'createdAt' | 'dueDate' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface TodoSort {
  field: TodoSortField;
  order: SortOrder;
}

// 列表响应类型
export interface TodoListResponse {
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
}

// 转换函数
export function todoRowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    priority: row.priority,
    status: row.status,
    tags: row.tags,
    calendarEventId: row.calendar_event_id,
    googleEventId: row.google_event_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createTodoInputToInsert(
  input: CreateTodoInput,
  userId: string
): TodoInsert {
  return {
    user_id: userId,
    title: input.title,
    description: input.description,
    due_date: input.dueDate
      ? typeof input.dueDate === 'string'
        ? input.dueDate
        : input.dueDate.toISOString()
      : undefined,
    priority: input.priority ?? 'medium',
    tags: input.tags ?? [],
  };
}

// 优先级排序权重
export const PRIORITY_WEIGHT: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// 按优先级排序
export function sortByPriority<T extends { priority: TodoPriority }>(
  items: T[],
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    return order === 'asc' ? diff : -diff;
  });
}
