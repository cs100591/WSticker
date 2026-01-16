/**
 * Pull Sync
 * Handles pulling remote changes from Supabase to local store
 * Uses Zustand instead of WatermelonDB
 */

import { useLocalStore } from '@/models';
import { supabase } from '../supabase';
import { SyncEntityType, SyncError } from './types';
import { conflictResolver } from './ConflictResolver';

export interface PullSyncResult {
  pulled: number;
  conflicts: number;
  errors: SyncError[];
}

class PullSync {
  /**
   * Pull all remote changes since last sync
   */
  async pullChanges(lastSyncTime: Date | null): Promise<PullSyncResult> {
    const result: PullSyncResult = {
      pulled: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const todosResult = await this.pullTodos(lastSyncTime);
      result.pulled += todosResult.pulled;
      result.conflicts += todosResult.conflicts;
      result.errors.push(...todosResult.errors);

      const expensesResult = await this.pullExpenses(lastSyncTime);
      result.pulled += expensesResult.pulled;
      result.conflicts += expensesResult.conflicts;
      result.errors.push(...expensesResult.errors);

      const eventsResult = await this.pullCalendarEvents(lastSyncTime);
      result.pulled += eventsResult.pulled;
      result.conflicts += eventsResult.conflicts;
      result.errors.push(...eventsResult.errors);
    } catch (error) {
      result.errors.push({
        entityType: 'todos',
        entityId: '',
        operation: 'update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Pull todos from remote
   */
  private async pullTodos(lastSyncTime: Date | null): Promise<PullSyncResult> {
    const result: PullSyncResult = { pulled: 0, conflicts: 0, errors: [] };

    try {
      let query = supabase.from('todos').select('*');
      if (lastSyncTime) {
        query = query.gt('updated_at', lastSyncTime.toISOString());
      }

      const { data: remoteTodos, error } = await query;
      if (error) throw error;
      if (!remoteTodos || remoteTodos.length === 0) return result;

      const store = useLocalStore.getState();
      const localTodos = store.todos;

      for (const remoteTodo of remoteTodos) {
        try {
          const localTodo = localTodos.find((t) => t.id === remoteTodo.id);

          if (localTodo) {
            // Update existing
            store.updateTodo(remoteTodo.id, {
              userId: remoteTodo.user_id,
              title: remoteTodo.title,
              description: remoteTodo.description,
              dueDate: remoteTodo.due_date,
              priority: remoteTodo.priority,
              status: remoteTodo.status,
              tags: remoteTodo.tags || [],
              color: remoteTodo.color,
              calendarEventId: remoteTodo.calendar_event_id,
              isDeleted: remoteTodo.is_deleted || false,
            });
          } else {
            // Create new
            store.addTodo({
              userId: remoteTodo.user_id,
              title: remoteTodo.title,
              description: remoteTodo.description,
              dueDate: remoteTodo.due_date,
              priority: remoteTodo.priority || 'medium',
              status: remoteTodo.status || 'active',
              tags: remoteTodo.tags || [],
              color: remoteTodo.color || 'yellow',
              calendarEventId: remoteTodo.calendar_event_id,
              isDeleted: remoteTodo.is_deleted || false,
            });
          }
          result.pulled++;
        } catch (error) {
          result.errors.push({
            entityType: 'todos',
            entityId: remoteTodo.id,
            operation: 'update',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      result.errors.push({
        entityType: 'todos',
        entityId: '',
        operation: 'update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Pull expenses from remote
   */
  private async pullExpenses(lastSyncTime: Date | null): Promise<PullSyncResult> {
    const result: PullSyncResult = { pulled: 0, conflicts: 0, errors: [] };

    try {
      let query = supabase.from('expenses').select('*');
      if (lastSyncTime) {
        query = query.gt('updated_at', lastSyncTime.toISOString());
      }

      const { data: remoteExpenses, error } = await query;
      if (error) throw error;
      if (!remoteExpenses || remoteExpenses.length === 0) return result;

      const store = useLocalStore.getState();
      const localExpenses = store.expenses;

      for (const remoteExpense of remoteExpenses) {
        try {
          const localExpense = localExpenses.find((e) => e.id === remoteExpense.id);

          if (localExpense) {
            store.updateExpense(remoteExpense.id, {
              userId: remoteExpense.user_id,
              amount: remoteExpense.amount,
              currency: remoteExpense.currency,
              category: remoteExpense.category,
              description: remoteExpense.description,
              expenseDate: remoteExpense.expense_date,
              receiptUrl: remoteExpense.receipt_url,
              tags: remoteExpense.tags || [],
              isDeleted: remoteExpense.is_deleted || false,
            });
          } else {
            store.addExpense({
              userId: remoteExpense.user_id,
              amount: remoteExpense.amount,
              currency: remoteExpense.currency || 'USD',
              category: remoteExpense.category,
              description: remoteExpense.description,
              expenseDate: remoteExpense.expense_date,
              receiptUrl: remoteExpense.receipt_url,
              tags: remoteExpense.tags || [],
              isDeleted: remoteExpense.is_deleted || false,
            });
          }
          result.pulled++;
        } catch (error) {
          result.errors.push({
            entityType: 'expenses',
            entityId: remoteExpense.id,
            operation: 'update',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      result.errors.push({
        entityType: 'expenses',
        entityId: '',
        operation: 'update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Pull calendar events from remote
   */
  private async pullCalendarEvents(lastSyncTime: Date | null): Promise<PullSyncResult> {
    const result: PullSyncResult = { pulled: 0, conflicts: 0, errors: [] };

    try {
      let query = supabase.from('calendar_events').select('*');
      if (lastSyncTime) {
        query = query.gt('updated_at', lastSyncTime.toISOString());
      }

      const { data: remoteEvents, error } = await query;
      if (error) throw error;
      if (!remoteEvents || remoteEvents.length === 0) return result;

      const store = useLocalStore.getState();
      const localEvents = store.calendarEvents;

      for (const remoteEvent of remoteEvents) {
        try {
          const localEvent = localEvents.find((e) => e.id === remoteEvent.id);

          if (localEvent) {
            store.updateCalendarEvent(remoteEvent.id, {
              userId: remoteEvent.user_id,
              title: remoteEvent.title,
              description: remoteEvent.description,
              startTime: remoteEvent.start_time,
              endTime: remoteEvent.end_time,
              allDay: remoteEvent.all_day || false,
              source: remoteEvent.source || 'local',
              todoId: remoteEvent.todo_id,
              color: remoteEvent.color,
              isDeleted: remoteEvent.is_deleted || false,
            });
          } else {
            store.addCalendarEvent({
              userId: remoteEvent.user_id,
              title: remoteEvent.title,
              description: remoteEvent.description,
              startTime: remoteEvent.start_time,
              endTime: remoteEvent.end_time,
              allDay: remoteEvent.all_day || false,
              source: remoteEvent.source || 'local',
              todoId: remoteEvent.todo_id,
              color: remoteEvent.color,
              isDeleted: remoteEvent.is_deleted || false,
            });
          }
          result.pulled++;
        } catch (error) {
          result.errors.push({
            entityType: 'calendar_events',
            entityId: remoteEvent.id,
            operation: 'update',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      result.errors.push({
        entityType: 'calendar_events',
        entityId: '',
        operation: 'update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }
}

export const pullSync = new PullSync();
