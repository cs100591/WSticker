/**
 * Local Store using Zustand + AsyncStorage
 * Simple, reliable offline-first data storage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { widgetService } from '@/services/widgetService';

// Types
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed';
export type TodoColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other';
export type EventSource = 'local' | 'google' | 'apple' | 'device';

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TodoPriority;
  status: TodoStatus;
  tags: string[];
  color: TodoColor;
  emoji?: string;
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  merchant?: string;
  expenseDate: string;
  receiptUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  source: EventSource;
  todoId?: string;
  color?: string;
  appleEventId?: string;
  googleEventId?: string;
  externalCalendarId?: string; // ID of the external calendar (e.g. Device Calendar ID)
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

interface LocalStore {
  // Data
  todos: Todo[];
  expenses: Expense[];
  calendarEvents: CalendarEvent[];
  isHydrated: boolean; // Tracking hydration state

  // Todo actions
  addTodo: (todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string; updatedAt?: string }) => Todo;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  getTodos: () => Todo[];
  setTodos: (todos: Todo[]) => void;

  // Expense actions
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string; updatedAt?: string }) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenses: () => Expense[];
  setExpenses: (expenses: Expense[]) => void;

  // Calendar event actions
  addCalendarEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string; updatedAt?: string }) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  getCalendarEvents: () => CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // Utility
  clearAll: () => void;
  setHydrated: (state: boolean) => void;
}

import * as Crypto from 'expo-crypto';

const generateId = () => Crypto.randomUUID();
const now = () => new Date().toISOString();

export const useLocalStore = create<LocalStore>()(
  persist(
    (set, get) => ({
      todos: [],
      expenses: [],
      calendarEvents: [],
      isHydrated: false,

      // Todo actions
      addTodo: (todoData) => {
        const todo: Todo = {
          ...todoData,
          id: todoData.id || generateId(),
          createdAt: todoData.createdAt || now(),
          updatedAt: todoData.updatedAt || now(),
        };
        set((state) => {
          const newTodos = [...state.todos, todo];
          widgetService.updateWidgetData({ todos: newTodos.filter(t => !t.isDeleted && t.status === 'active').slice(0, 3) });
          return { todos: newTodos };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
        return todo;
      },

      updateTodo: (id, updates) => {
        set((state) => {
          const updatedTodos = state.todos.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: updates.updatedAt || now() } : t
          );
          widgetService.updateWidgetData({ todos: updatedTodos.filter(t => !t.isDeleted && t.status === 'active').slice(0, 3) });
          return { todos: updatedTodos };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      deleteTodo: (id) => {
        set((state) => {
          const updatedTodos = state.todos.map((t) =>
            t.id === id ? { ...t, isDeleted: true, updatedAt: now() } : t
          );
          widgetService.updateWidgetData({ todos: updatedTodos.filter(t => !t.isDeleted && t.status === 'active').slice(0, 3) });
          return { todos: updatedTodos };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      getTodos: () => get().todos.filter((t) => !t.isDeleted),
      setTodos: (todos) => {
        set({ todos });
        widgetService.updateWidgetData({ todos: todos.filter(t => !t.isDeleted && t.status === 'active').slice(0, 3) });
      },

      // Expense actions
      addExpense: (expenseData) => {
        const expense: Expense = {
          ...expenseData,
          id: expenseData.id || generateId(),
          createdAt: expenseData.createdAt || now(),
          updatedAt: expenseData.updatedAt || now(),
        };
        set((state) => {
          const newExpenses = [...state.expenses, expense];
          widgetService.updateWidgetData({ expenses: newExpenses.filter(e => !e.isDeleted).slice(0, 3) });
          return { expenses: newExpenses };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
        return expense;
      },

      updateExpense: (id, updates) => {
        set((state) => {
          const updatedExpenses = state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: updates.updatedAt || now() } : e
          );
          widgetService.updateWidgetData({ expenses: updatedExpenses.filter(e => !e.isDeleted).slice(0, 3) });
          return { expenses: updatedExpenses };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      deleteExpense: (id) => {
        set((state) => {
          const updatedExpenses = state.expenses.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: now() } : e
          );
          widgetService.updateWidgetData({ expenses: updatedExpenses.filter(e => !e.isDeleted).slice(0, 3) });
          return { expenses: updatedExpenses };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      getExpenses: () => get().expenses.filter((e) => !e.isDeleted),
      setExpenses: (expenses) => {
        set({ expenses });
        widgetService.updateWidgetData({ expenses: expenses.filter(e => !e.isDeleted).slice(0, 3) });
      },

      // Calendar event actions
      addCalendarEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: eventData.id || generateId(),
          createdAt: eventData.createdAt || now(),
          updatedAt: eventData.updatedAt || now(),
        };
        set((state) => {
          const newEvents = [newEvent, ...state.calendarEvents];
          // Filter valid events for widget

          const activeEvents = newEvents.filter(e => !e.isDeleted)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          widgetService.updateWidgetData({ calendarEvents: activeEvents });
          return { calendarEvents: newEvents };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
        return newEvent;
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => {
          const updatedEvents = state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: updates.updatedAt || now() } : e
          );


          const activeEvents = updatedEvents.filter(e => !e.isDeleted)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          widgetService.updateWidgetData({ calendarEvents: activeEvents });
          return { calendarEvents: updatedEvents };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      deleteCalendarEvent: (id) => {
        set((state) => {
          const updatedEvents = state.calendarEvents.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: now() } : e
          );
          const activeEvents = updatedEvents.filter(e => !e.isDeleted)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          widgetService.updateWidgetData({ calendarEvents: activeEvents });
          return { calendarEvents: updatedEvents };
        });
        import('@/services/sync/SyncManager').then(({ syncManager }) => syncManager.sync().catch(console.error));
      },

      getCalendarEvents: () => get().calendarEvents.filter((e) => !e.isDeleted),
      setCalendarEvents: (events) => {
        set({ calendarEvents: events });
        widgetService.updateWidgetData({ calendarEvents: events.filter(e => !e.isDeleted) });
      },

      // Utility
      clearAll: () => {
        set({ todos: [], expenses: [], calendarEvents: [] });
        widgetService.updateWidgetData({ todos: [], expenses: [], calendarEvents: [] });
      },
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: 'daily-pa-local-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
