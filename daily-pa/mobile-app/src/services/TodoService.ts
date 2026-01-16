/**
 * Todo Service
 * Business logic layer for todo management
 * Uses Zustand local store (no WatermelonDB/rxjs)
 */

import { Todo, TodoStatus, TodoColor, TodoPriority, useLocalStore } from '@/models';
import { TodoRepository, CreateTodoData, UpdateTodoData } from '@/services/repositories/TodoRepository';
import { syncManager } from '@/services/sync/SyncManager';
import { calendarService } from '@/services/CalendarService';
import { notificationService } from '@/services/notificationService';

export type SortField = 'title' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface TodoServiceFilters {
  status?: TodoStatus;
  color?: TodoColor;
  userId?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  searchQuery?: string;
}

export interface TodoStatistics {
  total: number;
  active: number;
  completed: number;
  byColor: Record<TodoColor, number>;
  byPriority: Record<TodoPriority, number>;
  overdue: number;
  dueToday: number;
  dueSoon: number;
}

class TodoService {
  /**
   * Get all todos with filtering and sorting
   */
  async getTodos(filters?: TodoServiceFilters): Promise<Todo[]> {
    let todos: Todo[];
    
    if (filters?.userId) {
      todos = await TodoRepository.findByUserId(filters.userId);
    } else {
      todos = await TodoRepository.findAll();
    }

    // Apply status filter
    if (filters?.status) {
      todos = todos.filter((t) => t.status === filters.status);
    }

    // Apply color filter
    if (filters?.color) {
      todos = todos.filter((t) => t.color === filters.color);
    }

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      todos = todos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description?.toLowerCase().includes(query) ||
          todo.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (filters?.sortBy) {
      todos = this.sortTodos(todos, filters.sortBy, filters.sortOrder || 'asc');
    }

    return todos;
  }

  /**
   * Get todo by ID
   */
  async getTodoById(id: string): Promise<Todo | null> {
    return await TodoRepository.findById(id);
  }

  /**
   * Create a new todo
   */
  async createTodo(data: CreateTodoData): Promise<Todo> {
    const todo = await TodoRepository.create(data);

    // Queue for sync (silently fail if offline)
    try {
      await syncManager.queueChange('todos', todo.id, 'create', {
        id: todo.id,
        user_id: todo.userId,
        title: todo.title,
        description: todo.description,
        due_date: todo.dueDate,
        priority: todo.priority,
        status: todo.status,
        tags: todo.tags,
        color: todo.color,
        created_at: todo.createdAt,
        updated_at: todo.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    // Automatically create calendar event if todo has due date
    if (todo.dueDate) {
      try {
        const event = await calendarService.createEventFromTodo(
          todo.id,
          todo.userId,
          todo.title,
          new Date(todo.dueDate),
          this.getColorHex(todo.color)
        );
        
        // Update todo with calendar event ID
        await TodoRepository.update(todo.id, { calendarEventId: event.id });
      } catch (error) {
        console.error('Failed to create calendar event for todo:', error);
      }

      // Schedule notification for due date
      try {
        await this.scheduleTodoNotification(todo);
      } catch (error) {
        console.error('Failed to schedule notification for todo:', error);
      }
    }

    return todo;
  }

  /**
   * Update a todo
   */
  async updateTodo(todoId: string, data: UpdateTodoData): Promise<Todo> {
    const todo = await TodoRepository.findById(todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    await TodoRepository.update(todoId, data);
    const updatedTodo = await TodoRepository.findById(todoId);
    if (!updatedTodo) {
      throw new Error('Failed to get updated todo');
    }

    // Queue for sync
    try {
      await syncManager.queueChange('todos', updatedTodo.id, 'update', {
        id: updatedTodo.id,
        user_id: updatedTodo.userId,
        title: updatedTodo.title,
        description: updatedTodo.description,
        due_date: updatedTodo.dueDate,
        priority: updatedTodo.priority,
        status: updatedTodo.status,
        tags: updatedTodo.tags,
        color: updatedTodo.color,
        updated_at: updatedTodo.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    // Reschedule notification if due date changed
    if (data.dueDate !== undefined) {
      try {
        if (todo.dueDate) {
          await this.cancelTodoNotification(todo.id);
        }
        if (updatedTodo.dueDate) {
          await this.scheduleTodoNotification(updatedTodo);
        }
      } catch (error) {
        console.error('Failed to update notification for todo:', error);
      }
    }

    return updatedTodo;
  }

  /**
   * Toggle todo status (active <-> completed)
   */
  async toggleTodoStatus(todoId: string): Promise<Todo> {
    const todo = await TodoRepository.findById(todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    const newStatus: TodoStatus = todo.status === 'completed' ? 'active' : 'completed';
    return await this.updateTodo(todoId, { status: newStatus });
  }

  /**
   * Delete a todo
   */
  async deleteTodo(todoId: string): Promise<void> {
    const todo = await TodoRepository.findById(todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    // Cancel notification if exists
    if (todo.dueDate) {
      try {
        await this.cancelTodoNotification(todo.id);
      } catch (error) {
        console.error('Failed to cancel notification for todo:', error);
      }
    }

    await TodoRepository.delete(todoId);

    // Queue for sync
    try {
      await syncManager.queueChange('todos', todo.id, 'delete', { id: todo.id });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }
  }

  /**
   * Get todo statistics
   */
  async getStatistics(userId: string): Promise<TodoStatistics> {
    const todos = await TodoRepository.findByUserId(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const active = todos.filter((t) => t.status === 'active').length;
    const completed = todos.filter((t) => t.status === 'completed').length;

    const byColor: Record<TodoColor, number> = {
      yellow: 0, blue: 0, pink: 0, green: 0, purple: 0, orange: 0,
    };
    todos.forEach((todo) => { byColor[todo.color]++; });

    const byPriority: Record<TodoPriority, number> = { low: 0, medium: 0, high: 0 };
    todos.forEach((todo) => { byPriority[todo.priority]++; });

    const overdue = todos.filter(
      (t) => t.status === 'active' && t.dueDate && new Date(t.dueDate) < now
    ).length;

    const dueToday = todos.filter((t) => {
      if (t.status !== 'active' || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= today && due < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length;

    const dueSoon = todos.filter((t) => {
      if (t.status !== 'active' || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= sevenDaysFromNow;
    }).length;

    return { total: todos.length, active, completed, byColor, byPriority, overdue, dueToday, dueSoon };
  }

  /**
   * Sort todos by field
   */
  private sortTodos(todos: Todo[], field: SortField, order: SortOrder): Todo[] {
    return [...todos].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  async getTodosByStatus(userId: string, status: TodoStatus): Promise<Todo[]> {
    return await this.getTodos({ userId, status });
  }

  async getTodosByColor(userId: string, color: TodoColor): Promise<Todo[]> {
    return await this.getTodos({ userId, color });
  }

  async getOverdueTodos(userId: string): Promise<Todo[]> {
    const todos = await this.getTodos({ userId, status: 'active' });
    const now = new Date();
    return todos.filter((todo) => todo.dueDate && new Date(todo.dueDate) < now);
  }

  async getTodosDueToday(userId: string): Promise<Todo[]> {
    const todos = await this.getTodos({ userId, status: 'active' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return todos.filter((todo) => {
      if (!todo.dueDate) return false;
      const due = new Date(todo.dueDate);
      return due >= today && due < tomorrow;
    });
  }

  async searchTodos(userId: string, query: string): Promise<Todo[]> {
    return await this.getTodos({ userId, searchQuery: query });
  }

  private getColorHex(color: TodoColor): string {
    const colorMap: Record<TodoColor, string> = {
      yellow: '#FFC107', blue: '#2196F3', pink: '#E91E63',
      green: '#4CAF50', purple: '#9C27B0', orange: '#FF9800',
    };
    return colorMap[color];
  }

  private async scheduleTodoNotification(todo: Todo): Promise<void> {
    if (!todo.dueDate || todo.status === 'completed') return;

    const now = new Date();
    const dueDate = new Date(todo.dueDate);
    const notificationTime = new Date(dueDate.getTime() - 60 * 60 * 1000);
    
    if (notificationTime > now) {
      await notificationService.scheduleNotification(
        'Todo Due Soon',
        `"${todo.title}" is due in 1 hour`,
        notificationTime,
        { type: 'todo', todoId: todo.id, notificationId: `todo-${todo.id}` }
      );
    }
  }

  private async cancelTodoNotification(todoId: string): Promise<void> {
    const notifications = await notificationService.getScheduledNotifications();
    const todoNotification = notifications.find((n) => n.content.data?.todoId === todoId);
    if (todoNotification) {
      await notificationService.cancelNotification(todoNotification.identifier);
    }
  }
}

export const todoService = new TodoService();
