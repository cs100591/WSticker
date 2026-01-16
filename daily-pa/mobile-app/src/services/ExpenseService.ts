/**
 * Expense Service
 * Business logic layer for expense management
 * Uses Zustand local store (no WatermelonDB/rxjs)
 */

import { Expense, ExpenseCategory, useLocalStore } from '@/models';
import { ExpenseRepository, CreateExpenseData, UpdateExpenseData } from '@/services/repositories/ExpenseRepository';
import { syncManager } from '@/services/sync/SyncManager';

export type SortField = 'amount' | 'expenseDate' | 'category' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ExpenseServiceFilters {
  category?: ExpenseCategory;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  searchQuery?: string;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: Record<ExpenseCategory, number>;
  average: number;
  highest: number;
  lowest: number;
  currency: string;
}

class ExpenseService {
  /**
   * Get all expenses with filtering and sorting
   */
  async getExpenses(filters?: ExpenseServiceFilters): Promise<Expense[]> {
    let expenses: Expense[];
    
    if (filters?.userId) {
      expenses = await ExpenseRepository.findByUserId(filters.userId);
    } else {
      expenses = await ExpenseRepository.findAll();
    }

    // Apply category filter
    if (filters?.category) {
      expenses = expenses.filter((e) => e.category === filters.category);
    }

    // Apply date range filter
    if (filters?.dateFrom || filters?.dateTo) {
      expenses = expenses.filter((expense) => {
        const date = new Date(expense.expenseDate);
        if (filters.dateFrom && date < filters.dateFrom) return false;
        if (filters.dateTo && date > filters.dateTo) return false;
        return true;
      });
    }

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      expenses = expenses.filter(
        (expense) =>
          expense.description?.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query) ||
          expense.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (filters?.sortBy) {
      expenses = this.sortExpenses(expenses, filters.sortBy, filters.sortOrder || 'desc');
    } else {
      expenses = this.sortExpenses(expenses, 'expenseDate', 'desc');
    }

    return expenses;
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense | null> {
    return await ExpenseRepository.findById(id);
  }

  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const expense = await ExpenseRepository.create(data);

    // Queue for sync
    try {
      await syncManager.queueChange('expenses', expense.id, 'create', {
        id: expense.id,
        user_id: expense.userId,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        expense_date: expense.expenseDate,
        receipt_url: expense.receiptUrl,
        tags: expense.tags,
        created_at: expense.createdAt,
        updated_at: expense.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    return expense;
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId: string, data: UpdateExpenseData): Promise<Expense> {
    const expense = await ExpenseRepository.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    await ExpenseRepository.update(expenseId, data);
    const updatedExpense = await ExpenseRepository.findById(expenseId);
    if (!updatedExpense) {
      throw new Error('Failed to get updated expense');
    }

    // Queue for sync
    try {
      await syncManager.queueChange('expenses', updatedExpense.id, 'update', {
        id: updatedExpense.id,
        user_id: updatedExpense.userId,
        amount: updatedExpense.amount,
        currency: updatedExpense.currency,
        category: updatedExpense.category,
        description: updatedExpense.description,
        expense_date: updatedExpense.expenseDate,
        receipt_url: updatedExpense.receiptUrl,
        tags: updatedExpense.tags,
        updated_at: updatedExpense.updatedAt,
      });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }

    return updatedExpense;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const expense = await ExpenseRepository.findById(expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    await ExpenseRepository.delete(expenseId);

    // Queue for sync
    try {
      await syncManager.queueChange('expenses', expense.id, 'delete', { id: expense.id });
    } catch (e) {
      console.log('Sync queue failed (offline mode):', e);
    }
  }

  /**
   * Get expense summary with statistics
   */
  async getSummary(userId: string, filters?: { dateFrom?: Date; dateTo?: Date }): Promise<ExpenseSummary> {
    const expenses = await this.getExpenses({ userId, ...filters });

    if (expenses.length === 0) {
      return {
        total: 0,
        count: 0,
        byCategory: {
          food: 0, transport: 0, shopping: 0, entertainment: 0,
          bills: 0, health: 0, education: 0, other: 0,
        },
        average: 0,
        highest: 0,
        lowest: 0,
        currency: 'USD',
      };
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<ExpenseCategory, number> = {
      food: 0, transport: 0, shopping: 0, entertainment: 0,
      bills: 0, health: 0, education: 0, other: 0,
    };

    expenses.forEach((expense) => {
      byCategory[expense.category] += expense.amount;
    });

    const amounts = expenses.map((e) => e.amount);
    const average = total / expenses.length;
    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);
    const currency = expenses[0]?.currency || 'USD';

    return { total, count: expenses.length, byCategory, average, highest, lowest, currency };
  }

  /**
   * Sort expenses by field
   */
  private sortExpenses(expenses: Expense[], field: SortField, order: SortOrder): Expense[] {
    return [...expenses].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'expenseDate':
          aValue = new Date(a.expenseDate).getTime();
          bValue = new Date(b.expenseDate).getTime();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  async getExpensesByCategory(userId: string, category: ExpenseCategory): Promise<Expense[]> {
    return await this.getExpenses({ userId, category });
  }

  async getExpensesByDateRange(userId: string, dateFrom: Date, dateTo: Date): Promise<Expense[]> {
    return await this.getExpenses({ userId, dateFrom, dateTo });
  }

  async getExpensesThisMonth(userId: string): Promise<Expense[]> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return await this.getExpensesByDateRange(userId, firstDay, lastDay);
  }

  async getExpensesThisYear(userId: string): Promise<Expense[]> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return await this.getExpensesByDateRange(userId, firstDay, lastDay);
  }

  async searchExpenses(userId: string, query: string): Promise<Expense[]> {
    return await this.getExpenses({ userId, searchQuery: query });
  }

  async getMonthlySummary(userId: string, year: number, month: number): Promise<ExpenseSummary> {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59);
    return await this.getSummary(userId, { dateFrom: firstDay, dateTo: lastDay });
  }

  async getYearlySummary(userId: string, year: number): Promise<ExpenseSummary> {
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31, 23, 59, 59);
    return await this.getSummary(userId, { dateFrom: firstDay, dateTo: lastDay });
  }
}

export const expenseService = new ExpenseService();
