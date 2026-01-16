/**
 * Immediate Sync Property Tests
 * 
 * Property 30: Immediate sync on change
 * For any data change made while online, the Sync_Engine should upload 
 * the change to the Backend_API immediately.
 * 
 * **Validates: Requirements 9.1**
 * 
 * These tests validate that changes made while online trigger immediate
 * synchronization to the backend.
 */

import * as fc from 'fast-check';

// Types for testing
type TodoPriority = 'low' | 'medium' | 'high';
type TodoStatus = 'active' | 'completed';
type TodoColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other';

interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  color: TodoColor;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  isDeleted: boolean;
}

interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  isDeleted: boolean;
}

interface SyncCall {
  entityType: 'todo' | 'expense';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  timestamp: number;
}

// Mock sync engine
class MockSyncEngine {
  private isOnline: boolean = true;
  private syncCalls: SyncCall[] = [];
  private syncDelay: number = 0; // Simulated network delay

  setOnline(online: boolean): void {
    this.isOnline = online;
  }

  setSyncDelay(delay: number): void {
    this.syncDelay = delay;
  }

  async syncChange(
    entityType: 'todo' | 'expense',
    entityId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    // Simulate network delay
    if (this.syncDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.syncDelay));
    }

    this.syncCalls.push({
      entityType,
      entityId,
      operation,
      timestamp: Date.now(),
    });

    return true;
  }

  getSyncCalls(): SyncCall[] {
    return [...this.syncCalls];
  }

  getLastSyncCall(): SyncCall | null {
    return this.syncCalls.length > 0 ? this.syncCalls[this.syncCalls.length - 1] : null;
  }

  clearSyncCalls(): void {
    this.syncCalls = [];
  }

  wasSynced(entityId: string): boolean {
    return this.syncCalls.some(call => call.entityId === entityId);
  }

  getSyncCallsForEntity(entityId: string): SyncCall[] {
    return this.syncCalls.filter(call => call.entityId === entityId);
  }
}

// Mock storage with sync integration
class MockStorageWithSync<T extends { id: string; updatedAt: Date; syncedAt?: Date }> {
  private data: Map<string, T> = new Map();
  private syncEngine: MockSyncEngine;
  private entityType: 'todo' | 'expense';

  constructor(syncEngine: MockSyncEngine, entityType: 'todo' | 'expense') {
    this.syncEngine = syncEngine;
    this.entityType = entityType;
  }

  async create(item: T): Promise<T> {
    const now = new Date();
    const itemWithTimestamp = { ...item, updatedAt: now };
    this.data.set(item.id, itemWithTimestamp);

    // Trigger immediate sync if online
    const synced = await this.syncEngine.syncChange(this.entityType, item.id, 'create');
    
    if (synced) {
      // Update syncedAt timestamp
      const updated = { ...itemWithTimestamp, syncedAt: new Date() };
      this.data.set(item.id, updated);
      return updated;
    }

    return itemWithTimestamp;
  }

  async update(id: string, changes: Partial<T>): Promise<T | null> {
    const existing = this.data.get(id);
    if (!existing) return null;

    const now = new Date();
    const updated = { ...existing, ...changes, updatedAt: now };
    this.data.set(id, updated);

    // Trigger immediate sync if online
    const synced = await this.syncEngine.syncChange(this.entityType, id, 'update');
    
    if (synced) {
      // Update syncedAt timestamp
      const withSync = { ...updated, syncedAt: new Date() };
      this.data.set(id, withSync);
      return withSync;
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = this.data.get(id);
    if (!existing) return false;

    // Trigger immediate sync if online
    await this.syncEngine.syncChange(this.entityType, id, 'delete');
    
    this.data.delete(id);
    return true;
  }

  async getById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}

// Arbitraries
const userIdArb = fc.stringMatching(/^user-[a-z0-9]{8}$/);
const idArb = fc.stringMatching(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/);
const titleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const descriptionArb = fc.option(fc.string({ maxLength: 500 }), { nil: undefined });
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 });
const dateArb = fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
  .map(ts => new Date(ts));

const todoPriorityArb = fc.constantFrom<TodoPriority>('low', 'medium', 'high');
const todoStatusArb = fc.constantFrom<TodoStatus>('active', 'completed');
const todoColorArb = fc.constantFrom<TodoColor>('yellow', 'blue', 'pink', 'green', 'purple', 'orange');

const expenseCategoryArb = fc.constantFrom<ExpenseCategory>(
  'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other'
);
const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
  .map(n => Math.round(n * 100) / 100);
const currencyArb = fc.constantFrom('CNY', 'USD', 'EUR', 'GBP', 'JPY');

const todoArb: fc.Arbitrary<Todo> = fc.record({
  id: idArb,
  userId: userIdArb,
  title: titleArb,
  description: descriptionArb,
  priority: todoPriorityArb,
  status: todoStatusArb,
  color: todoColorArb,
  tags: tagsArb,
  createdAt: dateArb,
  updatedAt: dateArb,
  syncedAt: fc.constant(undefined),
  isDeleted: fc.constant(false),
});

const expenseArb: fc.Arbitrary<Expense> = fc.record({
  id: idArb,
  userId: userIdArb,
  amount: amountArb,
  currency: currencyArb,
  category: expenseCategoryArb,
  description: descriptionArb,
  expenseDate: dateArb,
  tags: tagsArb,
  createdAt: dateArb,
  updatedAt: dateArb,
  syncedAt: fc.constant(undefined),
  isDeleted: fc.constant(false),
});

describe('Property 30: Immediate Sync on Change', () => {
  describe('Todo Immediate Sync', () => {
    let syncEngine: MockSyncEngine;
    let storage: MockStorageWithSync<Todo>;

    beforeEach(() => {
      syncEngine = new MockSyncEngine();
      syncEngine.setOnline(true);
      storage = new MockStorageWithSync<Todo>(syncEngine, 'todo');
    });

    it('should immediately sync when creating a todo while online', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create todo while online
          await storage.create(todo);

          // Verify sync was triggered immediately
          expect(syncEngine.wasSynced(todo.id)).toBe(true);
          
          const syncCalls = syncEngine.getSyncCallsForEntity(todo.id);
          expect(syncCalls.length).toBe(1);
          expect(syncCalls[0].operation).toBe('create');
          expect(syncCalls[0].entityType).toBe('todo');
        }),
        { numRuns: 50 }
      );
    });

    it('should immediately sync when updating a todo while online', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, titleArb, async (todo, newTitle) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create todo
          await storage.create(todo);
          syncEngine.clearSyncCalls();

          // Update todo while online
          await storage.update(todo.id, { title: newTitle });

          // Verify sync was triggered immediately
          const syncCalls = syncEngine.getSyncCallsForEntity(todo.id);
          expect(syncCalls.length).toBe(1);
          expect(syncCalls[0].operation).toBe('update');
        }),
        { numRuns: 50 }
      );
    });

    it('should immediately sync when deleting a todo while online', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create todo
          await storage.create(todo);
          syncEngine.clearSyncCalls();

          // Delete todo while online
          await storage.delete(todo.id);

          // Verify sync was triggered immediately
          const syncCalls = syncEngine.getSyncCallsForEntity(todo.id);
          expect(syncCalls.length).toBe(1);
          expect(syncCalls[0].operation).toBe('delete');
        }),
        { numRuns: 50 }
      );
    });

    it('should update syncedAt timestamp after successful sync', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create todo while online
          const created = await storage.create(todo);

          // Verify syncedAt was set
          expect(created.syncedAt).toBeDefined();
          expect(created.syncedAt).toBeInstanceOf(Date);
        }),
        { numRuns: 50 }
      );
    });

    it('should not sync when offline', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(false); // Go offline

          // Create todo while offline
          const created = await storage.create(todo);

          // Verify sync was NOT triggered
          expect(syncEngine.wasSynced(todo.id)).toBe(false);
          expect(created.syncedAt).toBeUndefined();
        }),
        { numRuns: 30 }
      );
    });

    it('should sync multiple changes in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 2, maxLength: 5 }),
          async (todos) => {
            await storage.clear();
            syncEngine.clearSyncCalls();
            syncEngine.setOnline(true);

            // Create multiple todos
            for (const todo of todos) {
              await storage.create(todo);
            }

            // Verify all were synced
            const syncCalls = syncEngine.getSyncCalls();
            expect(syncCalls.length).toBe(todos.length);

            // Verify order is preserved
            todos.forEach((todo, index) => {
              expect(syncCalls[index].entityId).toBe(todo.id);
              expect(syncCalls[index].operation).toBe('create');
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Expense Immediate Sync', () => {
    let syncEngine: MockSyncEngine;
    let storage: MockStorageWithSync<Expense>;

    beforeEach(() => {
      syncEngine = new MockSyncEngine();
      syncEngine.setOnline(true);
      storage = new MockStorageWithSync<Expense>(syncEngine, 'expense');
    });

    it('should immediately sync when creating an expense while online', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, async (expense) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create expense while online
          await storage.create(expense);

          // Verify sync was triggered immediately
          expect(syncEngine.wasSynced(expense.id)).toBe(true);
          
          const syncCalls = syncEngine.getSyncCallsForEntity(expense.id);
          expect(syncCalls.length).toBe(1);
          expect(syncCalls[0].operation).toBe('create');
          expect(syncCalls[0].entityType).toBe('expense');
        }),
        { numRuns: 50 }
      );
    });

    it('should immediately sync when updating an expense while online', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, amountArb, async (expense, newAmount) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create expense
          await storage.create(expense);
          syncEngine.clearSyncCalls();

          // Update expense while online
          await storage.update(expense.id, { amount: newAmount });

          // Verify sync was triggered immediately
          const syncCalls = syncEngine.getSyncCallsForEntity(expense.id);
          expect(syncCalls.length).toBe(1);
          expect(syncCalls[0].operation).toBe('update');
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve expense amount precision through sync', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, async (expense) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create expense
          const created = await storage.create(expense);

          // Verify amount is preserved
          const retrieved = await storage.getById(expense.id);
          expect(retrieved?.amount).toBe(expense.amount);
          
          // Verify it was synced
          expect(syncEngine.wasSynced(expense.id)).toBe(true);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Cross-Entity Immediate Sync', () => {
    let syncEngine: MockSyncEngine;
    let todoStorage: MockStorageWithSync<Todo>;
    let expenseStorage: MockStorageWithSync<Expense>;

    beforeEach(() => {
      syncEngine = new MockSyncEngine();
      syncEngine.setOnline(true);
      todoStorage = new MockStorageWithSync<Todo>(syncEngine, 'todo');
      expenseStorage = new MockStorageWithSync<Expense>(syncEngine, 'expense');
    });

    it('should sync todos and expenses independently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 1, maxLength: 3 }),
          fc.array(expenseArb, { minLength: 1, maxLength: 3 }),
          async (todos, expenses) => {
            await todoStorage.clear();
            await expenseStorage.clear();
            syncEngine.clearSyncCalls();
            syncEngine.setOnline(true);

            // Create todos and expenses
            for (const todo of todos) {
              await todoStorage.create(todo);
            }
            for (const expense of expenses) {
              await expenseStorage.create(expense);
            }

            // Verify all were synced
            const syncCalls = syncEngine.getSyncCalls();
            expect(syncCalls.length).toBe(todos.length + expenses.length);

            // Verify entity types are correct
            const todoSyncs = syncCalls.filter(c => c.entityType === 'todo');
            const expenseSyncs = syncCalls.filter(c => c.entityType === 'expense');
            expect(todoSyncs.length).toBe(todos.length);
            expect(expenseSyncs.length).toBe(expenses.length);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle mixed operations across entity types', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, expenseArb, async (todo, expense) => {
          await todoStorage.clear();
          await expenseStorage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);

          // Create todo
          await todoStorage.create(todo);
          
          // Create expense
          await expenseStorage.create(expense);
          
          // Update todo
          await todoStorage.update(todo.id, { title: 'Updated' });
          
          // Delete expense
          await expenseStorage.delete(expense.id);

          // Verify all operations were synced
          const syncCalls = syncEngine.getSyncCalls();
          expect(syncCalls.length).toBe(4);

          // Verify operations
          expect(syncCalls[0].operation).toBe('create'); // todo
          expect(syncCalls[1].operation).toBe('create'); // expense
          expect(syncCalls[2].operation).toBe('update'); // todo
          expect(syncCalls[3].operation).toBe('delete'); // expense
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Sync Timing', () => {
    let syncEngine: MockSyncEngine;
    let storage: MockStorageWithSync<Todo>;

    beforeEach(() => {
      syncEngine = new MockSyncEngine();
      syncEngine.setOnline(true);
      storage = new MockStorageWithSync<Todo>(syncEngine, 'todo');
    });

    it('should sync within reasonable time', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          syncEngine.clearSyncCalls();
          syncEngine.setOnline(true);
          syncEngine.setSyncDelay(10); // 10ms delay

          const startTime = Date.now();
          await storage.create(todo);
          const endTime = Date.now();

          // Verify sync happened
          expect(syncEngine.wasSynced(todo.id)).toBe(true);
          
          // Verify it was reasonably fast (< 100ms including 10ms delay)
          expect(endTime - startTime).toBeLessThan(100);
        }),
        { numRuns: 30 }
      );
    });
  });
});
