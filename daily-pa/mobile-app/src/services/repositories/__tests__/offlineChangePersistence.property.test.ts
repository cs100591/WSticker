/**
 * Offline Change Persistence Property Tests
 * 
 * Property 25: Offline change persistence
 * For any data creation or modification while offline, the Offline_Storage should 
 * save the changes locally and queue them for sync.
 * 
 * **Validates: Requirements 6.2**
 * 
 * These tests validate that changes made while offline are persisted locally
 * and properly queued for synchronization when connectivity returns.
 */

import * as fc from 'fast-check';

// Types for testing
type TodoPriority = 'low' | 'medium' | 'high';
type TodoStatus = 'active' | 'completed';
type TodoColor = 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other';
type ChangeOperation = 'create' | 'update' | 'delete';

interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  color: TodoColor;
  tags: string[];
  isDeleted: boolean;
  updatedAt: Date;
  syncedAt?: Date;
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
  isDeleted: boolean;
  updatedAt: Date;
  syncedAt?: Date;
}

interface SyncQueueItem {
  id: string;
  entityType: 'todo' | 'expense' | 'calendar_event';
  entityId: string;
  operation: ChangeOperation;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

// Mock offline storage with sync queue
class MockOfflineStorageWithSync<T extends { id: string; isDeleted: boolean; updatedAt: Date; syncedAt?: Date }> {
  private data: Map<string, T> = new Map();
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = false;
  private entityType: 'todo' | 'expense' | 'calendar_event';

  constructor(entityType: 'todo' | 'expense' | 'calendar_event') {
    this.entityType = entityType;
  }

  setOnline(online: boolean): void {
    this.isOnline = online;
  }

  async create(item: T): Promise<T> {
    const now = new Date();
    const itemWithTimestamp = { ...item, updatedAt: now };
    this.data.set(item.id, itemWithTimestamp);
    
    // Queue for sync if offline
    if (!this.isOnline) {
      this.queueChange('create', item.id, itemWithTimestamp);
    }
    
    return itemWithTimestamp;
  }

  async update(id: string, changes: Partial<T>): Promise<T | null> {
    const existing = this.data.get(id);
    if (!existing || existing.isDeleted) return null;
    
    const now = new Date();
    const updated = { ...existing, ...changes, updatedAt: now };
    this.data.set(id, updated);
    
    // Queue for sync if offline
    if (!this.isOnline) {
      this.queueChange('update', id, updated);
    }
    
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = this.data.get(id);
    if (!existing) return false;
    
    const now = new Date();
    const deleted = { ...existing, isDeleted: true, updatedAt: now };
    this.data.set(id, deleted);
    
    // Queue for sync if offline
    if (!this.isOnline) {
      this.queueChange('delete', id, deleted);
    }
    
    return true;
  }

  async getById(id: string): Promise<T | null> {
    const item = this.data.get(id);
    return item && !item.isDeleted ? item : null;
  }

  async getAll(): Promise<T[]> {
    return Array.from(this.data.values()).filter(item => !item.isDeleted);
  }

  private queueChange(operation: ChangeOperation, entityId: string, data: unknown): void {
    // Remove any existing queue item for the same entity
    this.syncQueue = this.syncQueue.filter(item => item.entityId !== entityId);
    
    this.syncQueue.push({
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType: this.entityType,
      entityId,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  getSyncQueue(): SyncQueueItem[] {
    return [...this.syncQueue];
  }

  getPendingChanges(): SyncQueueItem[] {
    return this.syncQueue.filter(item => !this.isOnline || item.retryCount > 0);
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
  }

  async clear(): Promise<void> {
    this.data.clear();
    this.syncQueue = [];
  }

  get pendingCount(): number {
    return this.syncQueue.length;
  }
}

// Arbitraries for generating test data
const userIdArb = fc.stringMatching(/^user-[a-z0-9]{8}$/);
const idArb = fc.stringMatching(/^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/);
const titleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const descriptionArb = fc.option(fc.string({ maxLength: 500 }), { nil: undefined });
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 });
const dateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') });

const todoPriorityArb = fc.constantFrom<TodoPriority>('low', 'medium', 'high');
const todoStatusArb = fc.constantFrom<TodoStatus>('active', 'completed');
const todoColorArb = fc.constantFrom<TodoColor>('yellow', 'blue', 'pink', 'green', 'purple', 'orange');

const expenseCategoryArb = fc.constantFrom<ExpenseCategory>(
  'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other'
);
const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
  .map(n => Math.round(n * 100) / 100);
const currencyArb = fc.constantFrom('CNY', 'USD', 'EUR', 'GBP', 'JPY');

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
  updatedAt: dateArb,
  syncedAt: fc.constant(undefined),
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
  updatedAt: dateArb,
  syncedAt: fc.constant(undefined),
});

// Todo update arbitrary
const todoUpdateArb = fc.record({
  title: fc.option(titleArb, { nil: undefined }),
  description: descriptionArb,
  priority: fc.option(todoPriorityArb, { nil: undefined }),
  status: fc.option(todoStatusArb, { nil: undefined }),
  color: fc.option(todoColorArb, { nil: undefined }),
}).filter(update => Object.values(update).some(v => v !== undefined));

// Expense update arbitrary
const expenseUpdateArb = fc.record({
  amount: fc.option(amountArb, { nil: undefined }),
  currency: fc.option(currencyArb, { nil: undefined }),
  category: fc.option(expenseCategoryArb, { nil: undefined }),
  description: descriptionArb,
}).filter(update => Object.values(update).some(v => v !== undefined));

describe('Property 25: Offline Change Persistence', () => {
  describe('Todo Offline Changes', () => {
    let storage: MockOfflineStorageWithSync<Todo>;

    beforeEach(() => {
      storage = new MockOfflineStorageWithSync<Todo>('todo');
      storage.setOnline(false); // Start offline
    });

    it('should persist created todos locally when offline', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          storage.setOnline(false);
          
          // Create todo while offline
          const created = await storage.create(todo);
          
          // Verify todo is persisted locally
          const retrieved = await storage.getById(todo.id);
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(todo.id);
          expect(retrieved?.title).toBe(todo.title);
          
          // Verify change is queued for sync
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].entityId).toBe(todo.id);
          expect(queue[0].operation).toBe('create');
        }),
        { numRuns: 50 }
      );
    });

    it('should persist updated todos locally when offline', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, todoUpdateArb, async (todo, updates) => {
          await storage.clear();
          
          // Create todo while online
          storage.setOnline(true);
          await storage.create(todo);
          storage.clearSyncQueue();
          
          // Go offline and update
          storage.setOnline(false);
          const updated = await storage.update(todo.id, updates);
          
          // Verify update is persisted locally
          expect(updated).not.toBeNull();
          const retrieved = await storage.getById(todo.id);
          
          if (updates.title !== undefined) {
            expect(retrieved?.title).toBe(updates.title);
          }
          if (updates.status !== undefined) {
            expect(retrieved?.status).toBe(updates.status);
          }
          if (updates.color !== undefined) {
            expect(retrieved?.color).toBe(updates.color);
          }
          
          // Verify change is queued for sync
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].entityId).toBe(todo.id);
          expect(queue[0].operation).toBe('update');
        }),
        { numRuns: 50 }
      );
    });

    it('should persist deleted todos locally when offline', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          
          // Create todo while online
          storage.setOnline(true);
          await storage.create(todo);
          storage.clearSyncQueue();
          
          // Go offline and delete
          storage.setOnline(false);
          const deleted = await storage.delete(todo.id);
          
          // Verify deletion is persisted locally (soft delete)
          expect(deleted).toBe(true);
          const retrieved = await storage.getById(todo.id);
          expect(retrieved).toBeNull(); // Should not be returned (soft deleted)
          
          // Verify change is queued for sync
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].entityId).toBe(todo.id);
          expect(queue[0].operation).toBe('delete');
        }),
        { numRuns: 50 }
      );
    });

    it('should queue multiple changes for different todos', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 2, maxLength: 10 }),
          async (todos) => {
            await storage.clear();
            storage.setOnline(false);
            
            // Create multiple todos while offline
            for (const todo of todos) {
              await storage.create(todo);
            }
            
            // Verify all todos are persisted
            const allTodos = await storage.getAll();
            expect(allTodos.length).toBe(todos.length);
            
            // Verify all changes are queued
            const queue = storage.getSyncQueue();
            expect(queue.length).toBe(todos.length);
            
            // Verify each todo has a queue entry
            todos.forEach(todo => {
              const queueItem = queue.find(q => q.entityId === todo.id);
              expect(queueItem).toBeDefined();
              expect(queueItem?.operation).toBe('create');
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should consolidate multiple updates to same todo in queue', async () => {
      await fc.assert(
        fc.asyncProperty(
          todoArb,
          fc.array(todoUpdateArb, { minLength: 2, maxLength: 5 }),
          async (todo, updates) => {
            await storage.clear();
            
            // Create todo while online
            storage.setOnline(true);
            await storage.create(todo);
            storage.clearSyncQueue();
            
            // Go offline and apply multiple updates
            storage.setOnline(false);
            for (const update of updates) {
              await storage.update(todo.id, update);
            }
            
            // Verify only one queue entry exists (consolidated)
            const queue = storage.getSyncQueue();
            expect(queue.length).toBe(1);
            expect(queue[0].entityId).toBe(todo.id);
            expect(queue[0].operation).toBe('update');
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Expense Offline Changes', () => {
    let storage: MockOfflineStorageWithSync<Expense>;

    beforeEach(() => {
      storage = new MockOfflineStorageWithSync<Expense>('expense');
      storage.setOnline(false);
    });

    it('should persist created expenses locally when offline', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, async (expense) => {
          await storage.clear();
          storage.setOnline(false);
          
          // Create expense while offline
          await storage.create(expense);
          
          // Verify expense is persisted locally
          const retrieved = await storage.getById(expense.id);
          expect(retrieved).not.toBeNull();
          expect(retrieved?.id).toBe(expense.id);
          expect(retrieved?.amount).toBe(expense.amount);
          expect(retrieved?.category).toBe(expense.category);
          
          // Verify change is queued for sync
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].entityId).toBe(expense.id);
          expect(queue[0].operation).toBe('create');
        }),
        { numRuns: 50 }
      );
    });

    it('should persist updated expenses locally when offline', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, expenseUpdateArb, async (expense, updates) => {
          await storage.clear();
          
          // Create expense while online
          storage.setOnline(true);
          await storage.create(expense);
          storage.clearSyncQueue();
          
          // Go offline and update
          storage.setOnline(false);
          const updated = await storage.update(expense.id, updates);
          
          // Verify update is persisted locally
          expect(updated).not.toBeNull();
          const retrieved = await storage.getById(expense.id);
          
          if (updates.amount !== undefined) {
            expect(retrieved?.amount).toBe(updates.amount);
          }
          if (updates.category !== undefined) {
            expect(retrieved?.category).toBe(updates.category);
          }
          if (updates.currency !== undefined) {
            expect(retrieved?.currency).toBe(updates.currency);
          }
          
          // Verify change is queued for sync
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].entityId).toBe(expense.id);
          expect(queue[0].operation).toBe('update');
        }),
        { numRuns: 50 }
      );
    });

    it('should preserve expense amount precision through offline changes', async () => {
      await fc.assert(
        fc.asyncProperty(expenseArb, amountArb, async (expense, newAmount) => {
          await storage.clear();
          
          // Create expense while online
          storage.setOnline(true);
          await storage.create(expense);
          storage.clearSyncQueue();
          
          // Go offline and update amount
          storage.setOnline(false);
          await storage.update(expense.id, { amount: newAmount });
          
          // Verify amount precision is preserved
          const retrieved = await storage.getById(expense.id);
          expect(retrieved?.amount).toBe(newAmount);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Sync Queue Management', () => {
    let todoStorage: MockOfflineStorageWithSync<Todo>;
    let expenseStorage: MockOfflineStorageWithSync<Expense>;

    beforeEach(() => {
      todoStorage = new MockOfflineStorageWithSync<Todo>('todo');
      expenseStorage = new MockOfflineStorageWithSync<Expense>('expense');
    });

    it('should maintain separate queues for different entity types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 1, maxLength: 5 }),
          fc.array(expenseArb, { minLength: 1, maxLength: 5 }),
          async (todos, expenses) => {
            await todoStorage.clear();
            await expenseStorage.clear();
            
            todoStorage.setOnline(false);
            expenseStorage.setOnline(false);
            
            // Create todos and expenses while offline
            for (const todo of todos) {
              await todoStorage.create(todo);
            }
            for (const expense of expenses) {
              await expenseStorage.create(expense);
            }
            
            // Verify separate queues
            const todoQueue = todoStorage.getSyncQueue();
            const expenseQueue = expenseStorage.getSyncQueue();
            
            expect(todoQueue.length).toBe(todos.length);
            expect(expenseQueue.length).toBe(expenses.length);
            
            // Verify entity types are correct
            todoQueue.forEach(item => expect(item.entityType).toBe('todo'));
            expenseQueue.forEach(item => expect(item.entityType).toBe('expense'));
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should include timestamp in queued changes', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await todoStorage.clear();
          todoStorage.setOnline(false);
          
          const beforeCreate = Date.now();
          await todoStorage.create(todo);
          const afterCreate = Date.now();
          
          const queue = todoStorage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].timestamp).toBeGreaterThanOrEqual(beforeCreate);
          expect(queue[0].timestamp).toBeLessThanOrEqual(afterCreate);
        }),
        { numRuns: 30 }
      );
    });

    it('should preserve queue order by timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 3, maxLength: 10 }),
          async (todos) => {
            await todoStorage.clear();
            todoStorage.setOnline(false);
            
            // Create todos sequentially
            for (const todo of todos) {
              await todoStorage.create(todo);
            }
            
            const queue = todoStorage.getSyncQueue();
            
            // Verify timestamps are in order
            for (let i = 1; i < queue.length; i++) {
              expect(queue[i].timestamp).toBeGreaterThanOrEqual(queue[i - 1].timestamp);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not queue changes when online', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await todoStorage.clear();
          todoStorage.setOnline(true); // Online
          
          // Create todo while online
          await todoStorage.create(todo);
          
          // Verify no queue entry (would sync immediately)
          const queue = todoStorage.getSyncQueue();
          expect(queue.length).toBe(0);
        }),
        { numRuns: 30 }
      );
    });

    it('should update queue entry when same entity is modified multiple times', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await todoStorage.clear();
          todoStorage.setOnline(false);
          
          // Create todo
          await todoStorage.create(todo);
          
          // Update multiple times
          await todoStorage.update(todo.id, { title: 'Updated 1' });
          await todoStorage.update(todo.id, { title: 'Updated 2' });
          await todoStorage.update(todo.id, { title: 'Updated 3' });
          
          // Should only have one queue entry (latest)
          const queue = todoStorage.getSyncQueue();
          expect(queue.length).toBe(1);
          
          // The data should reflect the latest state
          const queueData = queue[0].data as Todo;
          expect(queueData.title).toBe('Updated 3');
        }),
        { numRuns: 30 }
      );
    });
  });

  describe('Data Integrity During Offline Operations', () => {
    let storage: MockOfflineStorageWithSync<Todo>;

    beforeEach(() => {
      storage = new MockOfflineStorageWithSync<Todo>('todo');
    });

    it('should maintain data consistency across create-update-delete cycle offline', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, todoUpdateArb, async (todo, updates) => {
          await storage.clear();
          storage.setOnline(false);
          
          // Create
          await storage.create(todo);
          let retrieved = await storage.getById(todo.id);
          expect(retrieved).not.toBeNull();
          
          // Update
          await storage.update(todo.id, updates);
          retrieved = await storage.getById(todo.id);
          expect(retrieved).not.toBeNull();
          
          // Delete
          await storage.delete(todo.id);
          retrieved = await storage.getById(todo.id);
          expect(retrieved).toBeNull();
          
          // Final queue should have delete operation
          const queue = storage.getSyncQueue();
          expect(queue.length).toBe(1);
          expect(queue[0].operation).toBe('delete');
        }),
        { numRuns: 30 }
      );
    });

    it('should handle concurrent offline operations on different entities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(todoArb, { minLength: 5, maxLength: 15 }),
          async (todos) => {
            await storage.clear();
            storage.setOnline(false);
            
            // Perform mixed operations
            const operations: Promise<unknown>[] = [];
            
            for (let i = 0; i < todos.length; i++) {
              if (i % 3 === 0) {
                operations.push(storage.create(todos[i]));
              } else if (i % 3 === 1 && i > 0) {
                operations.push(
                  storage.create(todos[i]).then(() => 
                    storage.update(todos[i].id, { title: 'Updated' })
                  )
                );
              } else {
                operations.push(
                  storage.create(todos[i]).then(() => 
                    storage.delete(todos[i].id)
                  )
                );
              }
            }
            
            await Promise.all(operations);
            
            // Verify queue has entries for all entities
            const queue = storage.getSyncQueue();
            expect(queue.length).toBe(todos.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve all fields through offline storage cycle', async () => {
      await fc.assert(
        fc.asyncProperty(todoArb, async (todo) => {
          await storage.clear();
          storage.setOnline(false);
          
          // Create and retrieve
          await storage.create(todo);
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
          expect(retrieved?.isDeleted).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });
});
