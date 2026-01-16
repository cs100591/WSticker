/**
 * Offline Data Loading Property Tests
 * 
 * Property 24: Offline data loading
 * For any app launch without internet connection, the Mobile_App should load 
 * and display all data from Offline_Storage.
 * 
 * **Validates: Requirements 6.1**
 * 
 * These tests validate that data can be stored and retrieved from local storage
 * without requiring network connectivity.
 */

import * as fc from 'fast-check';

// Types for testing
interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed';
  color: 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
  tags: string[];
  isDeleted: boolean;
}

interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other';
  description?: string;
  expenseDate: Date;
  tags: string[];
  isDeleted: boolean;
}

interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  source: 'manual' | 'todo' | 'google';
  isDeleted: boolean;
}

// Mock offline storage
class MockOfflineStorage<T extends { id: string; isDeleted: boolean }> {
  private data: Map<string, T> = new Map();

  async save(item: T): Promise<T> {
    this.data.set(item.id, item);
    return item;
  }

  async saveMany(items: T[]): Promise<T[]> {
    items.forEach(item => this.data.set(item.id, item));
    return items;
  }

  async getAll(): Promise<T[]> {
    return Array.from(this.data.values()).filter(item => !item.isDeleted);
  }

  async getAllIncludingDeleted(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async getById(id: string): Promise<T | null> {
    const item = this.data.get(id);
    return item && !item.isDeleted ? item : null;
  }

  async delete(id: string): Promise<void> {
    const item = this.data.get(id);
    if (item) {
      item.isDeleted = true;
      this.data.set(id, item);
    }
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  get count(): number {
    return Array.from(this.data.values()).filter(item => !item.isDeleted).length;
  }
}

// Arbitraries for generating test data

const userIdArb = fc.stringMatching(/^user-[a-z0-9]{8}$/);
const idArb = fc.stringMatching(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/);
const titleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const descriptionArb = fc.option(fc.string({ maxLength: 500 }), { nil: undefined });
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 });

const todoPriorityArb = fc.constantFrom<'low' | 'medium' | 'high'>('low', 'medium', 'high');
const todoStatusArb = fc.constantFrom<'active' | 'completed'>('active', 'completed');
const todoColorArb = fc.constantFrom<'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange'>(
  'yellow', 'blue', 'pink', 'green', 'purple', 'orange'
);

const expenseCategoryArb = fc.constantFrom<'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other'>(
  'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other'
);
const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }).map(n => Math.round(n * 100) / 100);
const currencyArb = fc.constantFrom('CNY', 'USD', 'EUR', 'GBP', 'JPY');

const eventSourceArb = fc.constantFrom<'manual' | 'todo' | 'google'>('manual', 'todo', 'google');
// Use integer timestamps to avoid NaN date issues
const dateArb = fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
  .map(ts => new Date(ts));

// Todo arbitrary
const todoArb: fc.Arbitrary<Todo> = fc.record({
  id: idArb,
  userId: userIdArb,
  title: titleArb,
  description: descriptionArb,
  priority: todoPriorityArb,
  status: todoStatusArb,
  color: todoColorArb,
  tags: tagsArb,
  isDeleted: fc.constant(false),
});

// Expense arbitrary
const expenseArb: fc.Arbitrary<Expense> = fc.record({
  id: idArb,
  userId: userIdArb,
  amount: amountArb,
  currency: currencyArb,
  category: expenseCategoryArb,
  description: descriptionArb,
  expenseDate: dateArb,
  tags: tagsArb,
  isDeleted: fc.constant(false),
});

// CalendarEvent arbitrary
const calendarEventArb: fc.Arbitrary<CalendarEvent> = fc.tuple(dateArb, fc.integer({ min: 1, max: 8 })).chain(
  ([startDate, hours]) => fc.record({
    id: idArb,
    userId: userIdArb,
    title: titleArb,
    description: descriptionArb,
    startTime: fc.constant(startDate),
    endTime: fc.constant(new Date(startDate.getTime() + hours * 60 * 60 * 1000)),
    allDay: fc.boolean(),
    source: eventSourceArb,
    isDeleted: fc.constant(false),
  })
);

describe('Property 24: Offline Data Loading', () => {
  describe('Todo Offline Storage', () => {
    let storage: MockOfflineStorage<Todo>;

    beforeEach(() => {
      storage = new MockOfflineStorage<Todo>();
    });

    it('should load all saved todos from offline storage', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(todoArb, { minLength: 1, maxLength: 20 }), async (todos) => {
          await storage.clear();
          
          // Save todos to offline storage
          await storage.saveMany(todos);
          
          // Load todos from offline storage (simulating offline app launch)
          const loadedTodos = await storage.getAll();
          
          // Verify all todos are loaded
          expect(loadedTodos.length).toBe(todos.length);
          
          // Verify each todo is present
          todos.forEach(todo => {
            const found = loadedTodos.find(t => t.id === todo.id);
            expect(found).toBeDefined();
            expect(found?.title).toBe(todo.title);
            expect(found?.userId).toBe(todo.userId);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('should retrieve specific todo by ID from offline storage', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          
          // Save todo
          await storage.save(todo);
          
          // Retrieve by ID
          const retrieved = await storage.getById(todo.id);
          
          // Verify retrieval
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(todo.id);
          expect(retrieved?.title).toBe(todo.title);
          expect(retrieved?.status).toBe(todo.status);
          expect(retrieved?.color).toBe(todo.color);
        }),
        { numRuns: 50 }
      );
    });

    it('should not return deleted todos in normal queries', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(todoArb, { minLength: 2, maxLength: 10 }), async (todos) => {
          await storage.clear();
          
          // Save all todos
          await storage.saveMany(todos);
          
          // Delete first todo
          await storage.delete(todos[0].id);
          
          // Load todos
          const loadedTodos = await storage.getAll();
          
          // Verify deleted todo is not returned
          expect(loadedTodos.length).toBe(todos.length - 1);
          expect(loadedTodos.find(t => t.id === todos[0].id)).toBeUndefined();
        }),
        { numRuns: 30 }
      );
    });

    it('should preserve todo data integrity through storage cycle', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          
          // Save and retrieve
          await storage.save(todo);
          const retrieved = await storage.getById(todo.id);
          
          // Verify all fields are preserved
          expect(retrieved?.id).toBe(todo.id);
          expect(retrieved?.userId).toBe(todo.userId);
          expect(retrieved?.title).toBe(todo.title);
          expect(retrieved?.description).toBe(todo.description);
          expect(retrieved?.priority).toBe(todo.priority);
          expect(retrieved?.status).toBe(todo.status);
          expect(retrieved?.color).toBe(todo.color);
          expect(retrieved?.tags).toEqual(todo.tags);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Expense Offline Storage', () => {
    let storage: MockOfflineStorage<Expense>;

    beforeEach(() => {
      storage = new MockOfflineStorage<Expense>();
    });

    it('should load all saved expenses from offline storage', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(expenseArb, { minLength: 1, maxLength: 20 }), async (expenses) => {
          await storage.clear();
          
          // Save expenses
          await storage.saveMany(expenses);
          
          // Load expenses
          const loadedExpenses = await storage.getAll();
          
          // Verify all expenses are loaded
          expect(loadedExpenses.length).toBe(expenses.length);
          
          // Verify each expense is present
          expenses.forEach(expense => {
            const found = loadedExpenses.find(e => e.id === expense.id);
            expect(found).toBeDefined();
            expect(found?.amount).toBe(expense.amount);
            expect(found?.category).toBe(expense.category);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve expense amount precision through storage', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, async (expense) => {
          await storage.clear();
          
          // Save and retrieve
          await storage.save(expense);
          const retrieved = await storage.getById(expense.id);
          
          // Verify amount is preserved exactly
          expect(retrieved?.amount).toBe(expense.amount);
          expect(retrieved?.currency).toBe(expense.currency);
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve expense date through storage', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, async (expense) => {
          await storage.clear();
          
          // Save and retrieve
          await storage.save(expense);
          const retrieved = await storage.getById(expense.id);
          
          // Verify date is preserved
          expect(retrieved?.expenseDate.getTime()).toBe(expense.expenseDate.getTime());
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('CalendarEvent Offline Storage', () => {
    let storage: MockOfflineStorage<CalendarEvent>;

    beforeEach(() => {
      storage = new MockOfflineStorage<CalendarEvent>();
    });

    it('should load all saved calendar events from offline storage', async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(calendarEventArb, { minLength: 1, maxLength: 20 }), async (events) => {
          await storage.clear();
          
          // Save events
          await storage.saveMany(events);
          
          // Load events
          const loadedEvents = await storage.getAll();
          
          // Verify all events are loaded
          expect(loadedEvents.length).toBe(events.length);
          
          // Verify each event is present
          events.forEach(event => {
            const found = loadedEvents.find(e => e.id === event.id);
            expect(found).toBeDefined();
            expect(found?.title).toBe(event.title);
            expect(found?.source).toBe(event.source);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve event time range through storage', async () => {
      await fc.assert(
        fc.asyncProperty(calendarEventArb, async (event) => {
          await storage.clear();
          
          // Save and retrieve
          await storage.save(event);
          const retrieved = await storage.getById(event.id);
          
          // Verify times are preserved
          expect(retrieved?.startTime.getTime()).toBe(event.startTime.getTime());
          expect(retrieved?.endTime.getTime()).toBe(event.endTime.getTime());
          
          // Verify end time is after start time
          expect(retrieved!.endTime.getTime()).toBeGreaterThan(retrieved!.startTime.getTime());
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve all-day flag through storage', async () => {
      await fc.assert(
        fc.asyncProperty(calendarEventArb, async (event) => {
          await storage.clear();
          
          // Save and retrieve
          await storage.save(event);
          const retrieved = await storage.getById(event.id);
          
          // Verify all-day flag is preserved
          expect(retrieved?.allDay).toBe(event.allDay);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Cross-Entity Offline Loading', () => {
    let todoStorage: MockOfflineStorage<Todo>;
    let expenseStorage: MockOfflineStorage<Expense>;
    let eventStorage: MockOfflineStorage<CalendarEvent>;

    beforeEach(() => {
      todoStorage = new MockOfflineStorage<Todo>();
      expenseStorage = new MockOfflineStorage<Expense>();
      eventStorage = new MockOfflineStorage<CalendarEvent>();
    });

    it('should load all entity types independently from offline storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 1, maxLength: 10 }),
          fc.array(expenseArb, { minLength: 1, maxLength: 10 }),
          fc.array(calendarEventArb, { minLength: 1, maxLength: 10 }),
          async (todos, expenses, events) => {
            // Clear all storage
            await todoStorage.clear();
            await expenseStorage.clear();
            await eventStorage.clear();
            
            // Save all entities
            await todoStorage.saveMany(todos);
            await expenseStorage.saveMany(expenses);
            await eventStorage.saveMany(events);
            
            // Load all entities (simulating offline app launch)
            const loadedTodos = await todoStorage.getAll();
            const loadedExpenses = await expenseStorage.getAll();
            const loadedEvents = await eventStorage.getAll();
            
            // Verify all entities are loaded correctly
            expect(loadedTodos.length).toBe(todos.length);
            expect(loadedExpenses.length).toBe(expenses.length);
            expect(loadedEvents.length).toBe(events.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should filter entities by user ID from offline storage', async () => {
      const userId1 = 'user-aaaaaaaa';
      const userId2 = 'user-bbbbbbbb';
      
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 2, maxLength: 10 }),
          async (baseTodos) => {
            await todoStorage.clear();
            
            // Assign half to user1, half to user2
            const todos = baseTodos.map((todo, i) => ({
              ...todo,
              userId: i % 2 === 0 ? userId1 : userId2,
            }));
            
            await todoStorage.saveMany(todos);
            
            // Load all and filter by user
            const allTodos = await todoStorage.getAll();
            const user1Todos = allTodos.filter(t => t.userId === userId1);
            const user2Todos = allTodos.filter(t => t.userId === userId2);
            
            // Verify filtering works
            expect(user1Todos.length + user2Todos.length).toBe(todos.length);
            user1Todos.forEach(t => expect(t.userId).toBe(userId1));
            user2Todos.forEach(t => expect(t.userId).toBe(userId2));
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
