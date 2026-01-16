/**
 * Local Store using Zustand + AsyncStorage
 * Simple, reliable offline-first data storage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed';
export type TodoColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other';
export type EventSource = 'local' | 'google' | 'apple';

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
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => Todo;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  getTodos: () => Todo[];
  setTodos: (todos: Todo[]) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenses: () => Expense[];
  setExpenses: (expenses: Expense[]) => void;

  // Calendar event actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  getCalendarEvents: () => CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // Utility
  clearAll: () => void;
  setHydrated: (state: boolean) => void;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ todos: [...state.todos, todo] }));
        return todo;
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t
          ),
        }));
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id ? { ...t, isDeleted: true, updatedAt: now() } : t
          ),
        }));
      },

      getTodos: () => get().todos.filter((t) => !t.isDeleted),
      setTodos: (todos) => set({ todos }),

      // Expense actions
      addExpense: (expenseData) => {
        const expense: Expense = {
          ...expenseData,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ expenses: [...state.expenses, expense] }));
        return expense;
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now() } : e
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: now() } : e
          ),
        }));
      },

      getExpenses: () => get().expenses.filter((e) => !e.isDeleted),
      setExpenses: (expenses) => set({ expenses }),

      // Calendar event actions
      addCalendarEvent: (eventData) => {
        const event: CalendarEvent = {
          ...eventData,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({ calendarEvents: [...state.calendarEvents, event] }));
        return event;
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: now() } : e
          ),
        }));
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, isDeleted: true, updatedAt: now() } : e
          ),
        }));
      },

      getCalendarEvents: () => get().calendarEvents.filter((e) => !e.isDeleted),
      setCalendarEvents: (events) => set({ calendarEvents: events }),

      // Utility
      clearAll: () => set({ todos: [], expenses: [], calendarEvents: [] }),
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
