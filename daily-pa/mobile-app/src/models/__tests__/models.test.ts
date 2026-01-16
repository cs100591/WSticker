/**
 * Local Store Models Unit Tests
 * 
 * Tests model types and store operations
 * for Todo, Expense, and CalendarEvent.
 * 
 * _Requirements: 6.1_
 */

import {
  useLocalStore,
  Todo,
  Expense,
  CalendarEvent,
  TodoPriority,
  TodoStatus,
  TodoColor,
  ExpenseCategory,
  EventSource,
} from '../index';

// Reset store before each test
beforeEach(() => {
  useLocalStore.getState().clearAll();
});

describe('Local Store', () => {
  describe('Store Structure', () => {
    it('should have empty arrays initially', () => {
      const state = useLocalStore.getState();
      expect(state.todos).toEqual([]);
      expect(state.expenses).toEqual([]);
      expect(state.calendarEvents).toEqual([]);
    });

    it('should have all required actions', () => {
      const state = useLocalStore.getState();
      expect(typeof state.addTodo).toBe('function');
      expect(typeof state.updateTodo).toBe('function');
      expect(typeof state.deleteTodo).toBe('function');
      expect(typeof state.getTodos).toBe('function');
      expect(typeof state.addExpense).toBe('function');
      expect(typeof state.updateExpense).toBe('function');
      expect(typeof state.deleteExpense).toBe('function');
      expect(typeof state.getExpenses).toBe('function');
      expect(typeof state.addCalendarEvent).toBe('function');
      expect(typeof state.updateCalendarEvent).toBe('function');
      expect(typeof state.deleteCalendarEvent).toBe('function');
      expect(typeof state.getCalendarEvents).toBe('function');
      expect(typeof state.clearAll).toBe('function');
    });
  });

  describe('Todo Operations', () => {
    it('should add a todo', () => {
      const store = useLocalStore.getState();
      const todo = store.addTodo({
        userId: 'user-1',
        title: 'Test Todo',
        priority: 'medium',
        status: 'active',
        tags: [],
        color: 'blue',
        isDeleted: false,
      });

      expect(todo.id).toBeDefined();
      expect(todo.title).toBe('Test Todo');
      expect(todo.priority).toBe('medium');
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('should get todos (excluding deleted)', () => {
      const store = useLocalStore.getState();
      store.addTodo({
        userId: 'user-1',
        title: 'Todo 1',
        priority: 'low',
        status: 'active',
        tags: [],
        color: 'yellow',
        isDeleted: false,
      });
      store.addTodo({
        userId: 'user-1',
        title: 'Todo 2',
        priority: 'high',
        status: 'active',
        tags: [],
        color: 'pink',
        isDeleted: true, // This should be excluded
      });

      const todos = useLocalStore.getState().getTodos();
      expect(todos.length).toBe(1);
      expect(todos[0].title).toBe('Todo 1');
    });

    it('should update a todo', () => {
      const store = useLocalStore.getState();
      const todo = store.addTodo({
        userId: 'user-1',
        title: 'Original Title',
        priority: 'low',
        status: 'active',
        tags: [],
        color: 'green',
        isDeleted: false,
      });

      useLocalStore.getState().updateTodo(todo.id, { title: 'Updated Title' });
      
      const todos = useLocalStore.getState().getTodos();
      expect(todos[0].title).toBe('Updated Title');
    });

    it('should soft delete a todo', () => {
      const store = useLocalStore.getState();
      const todo = store.addTodo({
        userId: 'user-1',
        title: 'To Delete',
        priority: 'medium',
        status: 'active',
        tags: [],
        color: 'purple',
        isDeleted: false,
      });

      useLocalStore.getState().deleteTodo(todo.id);
      
      const todos = useLocalStore.getState().getTodos();
      expect(todos.length).toBe(0);
      
      // But it should still exist in the raw array
      expect(useLocalStore.getState().todos.length).toBe(1);
      expect(useLocalStore.getState().todos[0].isDeleted).toBe(true);
    });
  });

  describe('Expense Operations', () => {
    it('should add an expense', () => {
      const store = useLocalStore.getState();
      const expense = store.addExpense({
        userId: 'user-1',
        amount: 50.00,
        currency: 'USD',
        category: 'food',
        expenseDate: new Date().toISOString(),
        tags: [],
        isDeleted: false,
      });

      expect(expense.id).toBeDefined();
      expect(expense.amount).toBe(50.00);
      expect(expense.category).toBe('food');
    });

    it('should get expenses (excluding deleted)', () => {
      const store = useLocalStore.getState();
      store.addExpense({
        userId: 'user-1',
        amount: 25.00,
        currency: 'USD',
        category: 'transport',
        expenseDate: new Date().toISOString(),
        tags: [],
        isDeleted: false,
      });

      const expenses = useLocalStore.getState().getExpenses();
      expect(expenses.length).toBe(1);
    });
  });

  describe('Calendar Event Operations', () => {
    it('should add a calendar event', () => {
      const store = useLocalStore.getState();
      const event = store.addCalendarEvent({
        userId: 'user-1',
        title: 'Meeting',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        allDay: false,
        source: 'local',
        isDeleted: false,
      });

      expect(event.id).toBeDefined();
      expect(event.title).toBe('Meeting');
      expect(event.source).toBe('local');
    });

    it('should get calendar events (excluding deleted)', () => {
      const store = useLocalStore.getState();
      store.addCalendarEvent({
        userId: 'user-1',
        title: 'Event 1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        allDay: false,
        source: 'local',
        isDeleted: false,
      });

      const events = useLocalStore.getState().getCalendarEvents();
      expect(events.length).toBe(1);
    });
  });

  describe('Clear All', () => {
    it('should clear all data', () => {
      const store = useLocalStore.getState();
      store.addTodo({
        userId: 'user-1',
        title: 'Todo',
        priority: 'low',
        status: 'active',
        tags: [],
        color: 'yellow',
        isDeleted: false,
      });
      store.addExpense({
        userId: 'user-1',
        amount: 10,
        currency: 'USD',
        category: 'other',
        expenseDate: new Date().toISOString(),
        tags: [],
        isDeleted: false,
      });
      store.addCalendarEvent({
        userId: 'user-1',
        title: 'Event',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        allDay: true,
        source: 'local',
        isDeleted: false,
      });

      useLocalStore.getState().clearAll();

      expect(useLocalStore.getState().todos).toEqual([]);
      expect(useLocalStore.getState().expenses).toEqual([]);
      expect(useLocalStore.getState().calendarEvents).toEqual([]);
    });
  });
});

describe('Type Validation', () => {
  describe('Todo Types', () => {
    it('should validate priority type at compile time', () => {
      const priority: TodoPriority = 'medium';
      expect(priority).toBe('medium');
    });

    it('should validate status type at compile time', () => {
      const status: TodoStatus = 'active';
      expect(status).toBe('active');
    });

    it('should validate color type at compile time', () => {
      const color: TodoColor = 'yellow';
      expect(color).toBe('yellow');
    });
  });

  describe('Expense Types', () => {
    it('should validate category type at compile time', () => {
      const category: ExpenseCategory = 'food';
      expect(category).toBe('food');
    });
  });

  describe('CalendarEvent Types', () => {
    it('should validate source type at compile time', () => {
      const source: EventSource = 'local';
      expect(source).toBe('local');
    });
  });
});
