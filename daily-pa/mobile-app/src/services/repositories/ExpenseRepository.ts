/**
 * Expense Repository
 * Uses Zustand local store for data persistence
 */

import { useLocalStore, Expense, ExpenseCategory } from '@/models';

export interface CreateExpenseData {
  userId: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate?: string;
  receiptUrl?: string;
  tags?: string[];
}

export interface UpdateExpenseData {
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  expenseDate?: string;
  receiptUrl?: string;
  tags?: string[];
}

class ExpenseRepositoryClass {
  async create(data: CreateExpenseData): Promise<Expense> {
    const store = useLocalStore.getState();
    return store.addExpense({
      userId: data.userId,
      amount: data.amount,
      currency: data.currency || 'USD',
      category: data.category,
      description: data.description,
      expenseDate: data.expenseDate || new Date().toISOString(),
      receiptUrl: data.receiptUrl,
      tags: data.tags || [],
      isDeleted: false,
    });
  }

  async findById(id: string): Promise<Expense | null> {
    const store = useLocalStore.getState();
    const expenses = store.getExpenses();
    return expenses.find((e) => e.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    const store = useLocalStore.getState();
    return store.getExpenses().filter((e) => e.userId === userId);
  }

  async findAll(): Promise<Expense[]> {
    const store = useLocalStore.getState();
    return store.getExpenses();
  }

  async update(id: string, data: UpdateExpenseData): Promise<void> {
    const store = useLocalStore.getState();
    store.updateExpense(id, data);
  }

  async delete(id: string): Promise<void> {
    const store = useLocalStore.getState();
    store.deleteExpense(id);
  }

  async findByCategory(userId: string, category: ExpenseCategory): Promise<Expense[]> {
    const store = useLocalStore.getState();
    return store.getExpenses().filter((e) => e.userId === userId && e.category === category);
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
    const store = useLocalStore.getState();
    return store.getExpenses().filter((e) => {
      if (e.userId !== userId) return false;
      const date = new Date(e.expenseDate);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }

  async getTotalByCategory(userId: string): Promise<Record<ExpenseCategory, number>> {
    const store = useLocalStore.getState();
    const expenses = store.getExpenses().filter((e) => e.userId === userId);
    
    const totals: Record<ExpenseCategory, number> = {
      food: 0,
      transport: 0,
      shopping: 0,
      entertainment: 0,
      bills: 0,
      health: 0,
      education: 0,
      other: 0,
    };
    
    expenses.forEach((e) => {
      totals[e.category] += e.amount;
    });
    
    return totals;
  }

  async count(userId: string): Promise<number> {
    const store = useLocalStore.getState();
    return store.getExpenses().filter((e) => e.userId === userId).length;
  }
}

export const ExpenseRepository = new ExpenseRepositoryClass();
