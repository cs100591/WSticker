/**
 * Property-Based Tests for Pull Sync
 * Tests Property 31: Pull and display remote changes
 */

import * as fc from 'fast-check';

/**
 * Mock Remote Storage (simulates Supabase)
 */
class MockRemoteStorage {
  private todos: Map<string, any> = new Map();
  private expenses: Map<string, any> = new Map();
  private lastSyncTime: Date | null = null;

  setLastSyncTime(time: Date | null): void {
    this.lastSyncTime = time;
  }

  // Add remote changes
  addTodo(todo: any): void {
    const updated_at = todo.updated_at || new Date();
    this.todos.set(todo.id, { ...todo, updated_at });
  }

  addExpense(expense: any): void {
    const updated_at = expense.updated_at || new Date();
    this.expenses.set(expense.id, { ...expense, updated_at });
  }

  updateTodo(id: string, updates: Partial<any>): void {
    const todo = this.todos.get(id);
    if (todo) {
      // Ensure updated_at is later than original
      const updatedAt = new Date(todo.updated_at.getTime() + 1000);
      this.todos.set(id, { ...todo, ...updates, updated_at: updatedAt });
    }
  }

  updateExpense(id: string, updates: Partial<any>): void {
    const expense = this.expenses.get(id);
    if (expense) {
      // Ensure updated_at is later than original
      const updatedAt = new Date(expense.updated_at.getTime() + 1000);
      this.expenses.set(id, { ...expense, ...updates, updated_at: updatedAt });
    }
  }

  deleteTodo(id: string): void {
    const todo = this.todos.get(id);
    if (todo) {
      // Ensure updated_at is later than original
      const updatedAt = new Date(todo.updated_at.getTime() + 1000);
      this.todos.set(id, { ...todo, is_deleted: true, updated_at: updatedAt });
    }
  }

  deleteExpense(id: string): void {
    const expense = this.expenses.get(id);
    if (expense) {
      // Ensure updated_at is later than original
      const updatedAt = new Date(expense.updated_at.getTime() + 1000);
      this.expenses.set(id, { ...expense, is_deleted: true, updated_at: updatedAt });
    }
  }

  // Simulate pull operation
  pullChanges(): { todos: any[]; expenses: any[] } {
    const todos = Array.from(this.todos.values()).filter(
      (todo) => !this.lastSyncTime || todo.updated_at > this.lastSyncTime
    );
    const expenses = Array.from(this.expenses.values()).filter(
      (expense) => !this.lastSyncTime || expense.updated_at > this.lastSyncTime
    );
    return { todos, expenses };
  }

  getTodo(id: string): any | undefined {
    return this.todos.get(id);
  }

  getExpense(id: string): any | undefined {
    return this.expenses.get(id);
  }
}

/**
 * Mock Local Storage (simulates WatermelonDB)
 */
class MockLocalStorage {
  private todos: Map<string, any> = new Map();
  private expenses: Map<string, any> = new Map();

  applyRemoteChanges(remoteChanges: { todos: any[]; expenses: any[] }): void {
    // Apply todos
    for (const remoteTodo of remoteChanges.todos) {
      this.todos.set(remoteTodo.id, { ...remoteTodo, synced_at: new Date() });
    }

    // Apply expenses
    for (const remoteExpense of remoteChanges.expenses) {
      this.expenses.set(remoteExpense.id, { ...remoteExpense, synced_at: new Date() });
    }
  }

  getTodo(id: string): any | undefined {
    return this.todos.get(id);
  }

  getExpense(id: string): any | undefined {
    return this.expenses.get(id);
  }

  getAllTodos(): any[] {
    return Array.from(this.todos.values());
  }

  getAllExpenses(): any[] {
    return Array.from(this.expenses.values());
  }
}

describe('Property 31: Pull and Display Remote Changes', () => {
  describe('Todo Pull Sync', () => {
    it('should pull new todos from remote', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.string({ maxLength: 500 }),
              status: fc.constantFrom('pending', 'in_progress', 'completed'),
              priority: fc.constantFrom('low', 'medium', 'high'),
              is_deleted: fc.constant(false),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (todos) => {
            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add todos to remote
            for (const todo of todos) {
              remote.addTodo(todo);
            }

            // Pull changes
            const changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify all todos are in local storage
            for (const todo of todos) {
              const localTodo = local.getTodo(todo.id);
              expect(localTodo).toBeDefined();
              expect(localTodo.title).toBe(todo.title);
              expect(localTodo.status).toBe(todo.status);
              expect(localTodo.synced_at).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should pull updated todos from remote', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (id, originalTitle, updatedTitle) => {
            fc.pre(originalTitle !== updatedTitle);

            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add original todo
            const originalTodo = {
              id,
              title: originalTitle,
              description: 'Test',
              status: 'pending',
              priority: 'medium',
              is_deleted: false,
            };
            remote.addTodo(originalTodo);

            // First sync
            let changes = remote.pullChanges();
            local.applyRemoteChanges(changes);
            remote.setLastSyncTime(new Date());

            // Update todo on remote
            remote.updateTodo(id, { title: updatedTitle });

            // Second sync
            changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify update was pulled
            const localTodo = local.getTodo(id);
            expect(localTodo).toBeDefined();
            expect(localTodo.title).toBe(updatedTitle);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should pull deleted todos from remote', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (id, title) => {
            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add todo
            const todo = {
              id,
              title,
              description: 'Test',
              status: 'pending',
              priority: 'medium',
              is_deleted: false,
            };
            remote.addTodo(todo);

            // First sync
            let changes = remote.pullChanges();
            local.applyRemoteChanges(changes);
            remote.setLastSyncTime(new Date());

            // Delete todo on remote
            remote.deleteTodo(id);

            // Second sync
            changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify deletion was pulled
            const localTodo = local.getTodo(id);
            expect(localTodo).toBeDefined();
            expect(localTodo.is_deleted).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Expense Pull Sync', () => {
    it('should pull new expenses from remote', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              amount: fc.integer({ min: 1, max: 100000 }).map((n) => Math.fround(n / 100)),
              currency: fc.constantFrom('USD', 'EUR', 'GBP'),
              category: fc.constantFrom('food', 'transport', 'entertainment'),
              description: fc.string({ maxLength: 200 }),
              is_deleted: fc.constant(false),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (expenses) => {
            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add expenses to remote
            for (const expense of expenses) {
              remote.addExpense(expense);
            }

            // Pull changes
            const changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify all expenses are in local storage
            for (const expense of expenses) {
              const localExpense = local.getExpense(expense.id);
              expect(localExpense).toBeDefined();
              expect(localExpense.amount).toBe(expense.amount);
              expect(localExpense.category).toBe(expense.category);
              expect(localExpense.synced_at).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should pull updated expenses from remote', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 1, max: 10000 }).map((n) => Math.fround(n / 100)),
          fc.integer({ min: 1, max: 10000 }).map((n) => Math.fround(n / 100)),
          (id, originalAmount, updatedAmount) => {
            fc.pre(originalAmount !== updatedAmount);

            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add original expense
            const originalExpense = {
              id,
              amount: originalAmount,
              currency: 'USD',
              category: 'food',
              description: 'Test',
              is_deleted: false,
            };
            remote.addExpense(originalExpense);

            // First sync
            let changes = remote.pullChanges();
            local.applyRemoteChanges(changes);
            remote.setLastSyncTime(new Date());

            // Update expense on remote
            remote.updateExpense(id, { amount: updatedAmount });

            // Second sync
            changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify update was pulled
            const localExpense = local.getExpense(id);
            expect(localExpense).toBeDefined();
            expect(localExpense.amount).toBe(updatedAmount);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Incremental Sync', () => {
    it('should only pull changes since last sync', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }).map((arr) => [...new Set(arr)]), // Remove duplicates
          fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }).map((arr) => [...new Set(arr)]), // Remove duplicates
          (initialIds, newIds) => {
            // Ensure no overlap between initial and new IDs
            const uniqueNewIds = newIds.filter((id) => !initialIds.includes(id));
            fc.pre(uniqueNewIds.length > 0);

            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add initial todos with early timestamps
            const baseTime = Date.now();
            for (const id of initialIds) {
              const todo = {
                id,
                title: `Initial ${id}`,
                description: 'Test',
                status: 'pending',
                priority: 'medium',
                is_deleted: false,
                updated_at: new Date(baseTime),
              };
              remote.addTodo(todo);
            }

            // First sync
            let changes = remote.pullChanges();
            local.applyRemoteChanges(changes);
            const firstSyncCount = changes.todos.length;
            
            // Set last sync time to after initial todos
            const lastSyncTime = new Date(baseTime + 1000);
            remote.setLastSyncTime(lastSyncTime);

            // Add new todos after sync with later timestamps
            for (const id of uniqueNewIds) {
              const todo = {
                id,
                title: `New ${id}`,
                description: 'Test',
                status: 'pending',
                priority: 'medium',
                is_deleted: false,
                updated_at: new Date(baseTime + 2000),
              };
              remote.addTodo(todo);
            }

            // Second sync (incremental)
            changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify only new changes were pulled
            expect(changes.todos.length).toBe(uniqueNewIds.length);
            expect(firstSyncCount).toBe(initialIds.length);

            // Verify all todos are in local storage
            expect(local.getAllTodos().length).toBe(initialIds.length + uniqueNewIds.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Cross-Entity Pull Sync', () => {
    it('should pull todos and expenses independently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
          (todoIds, expenseIds) => {
            const remote = new MockRemoteStorage();
            const local = new MockLocalStorage();

            // Add todos
            for (const id of todoIds) {
              remote.addTodo({
                id,
                title: `Todo ${id}`,
                description: 'Test',
                status: 'pending',
                priority: 'medium',
                is_deleted: false,
              });
            }

            // Add expenses
            for (const id of expenseIds) {
              remote.addExpense({
                id,
                amount: Math.fround(100.50),
                currency: 'USD',
                category: 'food',
                description: 'Test',
                is_deleted: false,
              });
            }

            // Pull changes
            const changes = remote.pullChanges();
            local.applyRemoteChanges(changes);

            // Verify todos and expenses are independent
            expect(local.getAllTodos().length).toBe(todoIds.length);
            expect(local.getAllExpenses().length).toBe(expenseIds.length);

            // Verify no cross-contamination
            for (const id of todoIds) {
              expect(local.getTodo(id)).toBeDefined();
              expect(local.getExpense(id)).toBeUndefined();
            }

            for (const id of expenseIds) {
              expect(local.getExpense(id)).toBeDefined();
              expect(local.getTodo(id)).toBeUndefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
