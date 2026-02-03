/**
 * Push Sync
 * Handles pushing local changes to remote (Supabase)
 * Uses Zustand instead of WatermelonDB
 */

import { useLocalStore, Todo, Expense, CalendarEvent, Note } from '@/models';
import { supabase } from '../supabase';
import { SyncEntityType, SyncError } from './types';

export interface PushSyncResult {
  pushed: number;
  errors: SyncError[];
}

class PushSync {
  /**
   * Detect local changes since last sync
   * For now, we push all non-deleted items (simple approach)
   */
  async detectChanges(lastSyncTime: Date | null, forceFullSync: boolean = false, userId: string): Promise<{
    todos: any[];
    expenses: any[];
    calendarEvents: any[];
    notes: any[];
  }> {
    const store = useLocalStore.getState();

    // Get all items that have been updated since last sync
    const filterByTime = (item: { updatedAt: string }) => {
      if (forceFullSync) return true;
      if (!lastSyncTime) return true;
      return new Date(item.updatedAt) > lastSyncTime;
    };

    return {
      todos: store.todos.filter(filterByTime).map((t) => this.serializeTodo(t, userId)),
      expenses: store.expenses.filter(filterByTime).map((e) => this.serializeExpense(e, userId)),
      // CRITICAL: Exclude 'device' source events from push sync
      // Device calendar events should stay local only. Pushing them creates duplicates when:
      // 1. Device event (source: 'device') → pushed to Supabase as 'manual'
      // 2. Pull sync → creates new local event (source: 'manual')
      // 3. syncWithDevice "clean slate" only deletes 'device' events, leaving 'manual' duplicates
      calendarEvents: store.calendarEvents
        .filter(filterByTime)
        .filter((e) => e.source !== 'device') // Don't push device events to cloud
        .map((e) => this.serializeCalendarEvent(e, userId)),
      notes: store.notes.filter(filterByTime).map((n) => this.serializeNote(n, userId)),
    };
  }

  /**
   * Push all local changes to remote
   */
  async pushChanges(lastSyncTime: Date | null, forceFullSync: boolean = false): Promise<PushSyncResult> {
    const result: PushSyncResult = { pushed: 0, errors: [] };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const changes = await this.detectChanges(lastSyncTime, forceFullSync, user.id);

      const todosResult = await this.pushTodos(changes.todos);
      result.pushed += todosResult.pushed;
      result.errors.push(...todosResult.errors);

      const expensesResult = await this.pushExpenses(changes.expenses);
      result.pushed += expensesResult.pushed;
      result.errors.push(...expensesResult.errors);

      const eventsResult = await this.pushCalendarEvents(changes.calendarEvents);
      result.pushed += eventsResult.pushed;
      result.errors.push(...eventsResult.errors);

      const notesResult = await this.pushNotes(changes.notes);
      result.pushed += notesResult.pushed;
      result.errors.push(...notesResult.errors);
    } catch (error) {
      result.errors.push({
        entityType: 'todos',
        entityId: '',
        operation: 'create',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return result;
  }

  /**
   * Push todos to remote
   */
  /**
   * Push todos to remote
   */
  private async pushTodos(todos: any[]): Promise<PushSyncResult> {
    const result: PushSyncResult = { pushed: 0, errors: [] };

    for (const todo of todos) {
      try {
        if (todo.is_deleted) {
          const { error } = await supabase
            .from('todos')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
              user_id: todo.user_id
            })
            .eq('id', todo.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('todos').upsert(todo, { onConflict: 'id' });
          if (error) throw error;
        }
        result.pushed++;
      } catch (error) {
        console.error('Push Todo Error:', error);
        result.errors.push({
          entityType: 'todos',
          entityId: todo.id,
          operation: todo.is_deleted ? 'delete' : 'update',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Push expenses to remote
   */
  private async pushExpenses(expenses: any[]): Promise<PushSyncResult> {
    const result: PushSyncResult = { pushed: 0, errors: [] };

    for (const expense of expenses) {
      try {
        if (expense.is_deleted) {
          const { error } = await supabase
            .from('expenses')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
              user_id: expense.user_id
            })
            .eq('id', expense.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('expenses').upsert(expense, { onConflict: 'id' });
          if (error) throw error;
        }
        result.pushed++;
      } catch (error) {
        console.error('Push Expense Error:', error);
        result.errors.push({
          entityType: 'expenses',
          entityId: expense.id,
          operation: expense.is_deleted ? 'delete' : 'update',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Push calendar events to remote
   */
  private async pushCalendarEvents(events: any[]): Promise<PushSyncResult> {
    const result: PushSyncResult = { pushed: 0, errors: [] };

    for (const event of events) {
      try {
        if (event.is_deleted) {
          const { error } = await supabase
            .from('calendar_events')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
              user_id: event.user_id
            })
            .eq('id', event.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('calendar_events').upsert(event, { onConflict: 'id' });
          if (error) throw error;
        }
        result.pushed++;
      } catch (error) {
        console.error('Push Calendar Error:', error);
        result.errors.push({
          entityType: 'calendar_events',
          entityId: event.id,
          operation: event.is_deleted ? 'delete' : 'update',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Push notes to remote
   */
  private async pushNotes(notes: any[]): Promise<PushSyncResult> {
    const result: PushSyncResult = { pushed: 0, errors: [] };

    for (const note of notes) {
      try {
        if (note.is_deleted) {
          const { error } = await supabase
            .from('notes')
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
              user_id: note.user_id
            })
            .eq('id', note.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('notes').upsert(note, { onConflict: 'id' });
          if (error) throw error;
        }
        result.pushed++;
      } catch (error) {
        console.error('Push Note Error:', error);
        result.errors.push({
          entityType: 'notes',
          entityId: note.id,
          operation: note.is_deleted ? 'delete' : 'update',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Serialize todo for remote storage
   */
  private serializeTodo(todo: Todo, userId: string): any {
    return {
      id: todo.id,
      user_id: userId,
      title: todo.title,
      description: todo.description,
      due_date: todo.dueDate,
      priority: todo.priority,
      status: todo.status,
      tags: todo.tags,
      color: todo.color,
      calendar_event_id: todo.calendarEventId,
      created_at: todo.createdAt,
      updated_at: todo.updatedAt,
      is_deleted: todo.isDeleted,
    };
  }

  /**
   * Serialize expense for remote storage
   */
  private serializeExpense(expense: Expense, userId: string): any {
    return {
      id: expense.id,
      user_id: userId,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      expense_date: expense.expenseDate,
      receipt_url: expense.receiptUrl,
      tags: expense.tags,
      created_at: expense.createdAt,
      updated_at: expense.updatedAt,
      is_deleted: expense.isDeleted,
    };
  }

  /**
   * Serialize calendar event for remote storage
   */
  private serializeCalendarEvent(event: CalendarEvent, userId: string): any {
    // Map local source types to database allowed values ('manual', 'todo', 'google')
    let source: string = event.source;
    if (source === 'device' || source === 'local' || !['manual', 'todo', 'google'].includes(source)) {
      source = 'manual';
    }

    return {
      id: event.id,
      user_id: userId,
      title: event.title,
      description: event.description,
      start_time: event.startTime,
      end_time: event.endTime,
      all_day: event.allDay,
      source: source,
      todo_id: event.todoId,
      color: event.color,
      created_at: event.createdAt,
      updated_at: event.updatedAt,
      is_deleted: event.isDeleted,
    };
  }

  /**
   * Serialize note for remote storage
   */
  private serializeNote(note: Note, userId: string): any {
    return {
      id: note.id,
      user_id: userId,
      text: note.text,
      input_lang: note.inputLang,
      output_lang: note.outputLang,
      linked_task_id: note.linkedTaskId || null,
      linked_task_title: note.linkedTaskTitle || null,
      extra_notes: note.extraNotes || null,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
      is_deleted: note.isDeleted,
    };
  }
}

export const pushSync = new PushSync();
