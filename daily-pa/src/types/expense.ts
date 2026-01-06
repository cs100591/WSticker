/**
 * 消费记录相关类型定义
 */

import type { Tables, InsertTables, UpdateTables } from './database.types';

// 数据库行类型
export type ExpenseRow = Tables<'expenses'>;
export type ExpenseInsert = InsertTables<'expenses'>;
export type ExpenseUpdate = UpdateTables<'expenses'>;

// 消费类别类型
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

// 货币类型
export type Currency = 'CNY' | 'USD' | 'EUR' | 'JPY' | 'GBP';

// 业务层类型
export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string | null;
  expenseDate: Date;
  receiptUrl: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 输入类型
export interface CreateExpenseInput {
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  description?: string;
  expenseDate: Date | string;
  receiptUrl?: string;
  tags?: string[];
}

export interface UpdateExpenseInput {
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string | null;
  expenseDate?: Date | string;
  receiptUrl?: string | null;
  tags?: string[];
}


// 过滤类型
export interface ExpenseFilters {
  category?: ExpenseCategory | 'all';
  dateFrom?: Date | string;
  dateTo?: Date | string;
  amountMin?: number;
  amountMax?: number;
  tags?: string[];
  search?: string;
}

// 排序类型
export type ExpenseSortField = 'expenseDate' | 'amount' | 'category' | 'createdAt';

export interface ExpenseSort {
  field: ExpenseSortField;
  order: 'asc' | 'desc';
}

// 列表响应类型
export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
}

// 消费汇总类型
export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  count: number;
}

// 转换函数
export function expenseRowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category as ExpenseCategory,
    description: row.description,
    expenseDate: new Date(row.expense_date),
    receiptUrl: row.receipt_url,
    tags: row.tags,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function createExpenseInputToInsert(
  input: CreateExpenseInput,
  userId: string
): ExpenseInsert {
  const expenseDate =
    typeof input.expenseDate === 'string'
      ? input.expenseDate
      : input.expenseDate.toISOString().split('T')[0];

  return {
    user_id: userId,
    amount: input.amount,
    currency: input.currency ?? 'CNY',
    category: input.category,
    description: input.description,
    expense_date: expenseDate as string,
    receipt_url: input.receiptUrl,
    tags: input.tags ?? [],
  };
}

// 类别显示名称
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  entertainment: '娱乐',
  bills: '账单',
  health: '医疗',
  education: '教育',
  other: '其他',
};

// 类别图标
export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍔',
  transport: '🚗',
  shopping: '🛒',
  entertainment: '🎬',
  bills: '📄',
  health: '💊',
  education: '📚',
  other: '📦',
};

// 按类别聚合
export function aggregateByCategory(expenses: Expense[]): Record<ExpenseCategory, number> {
  const result: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    shopping: 0,
    entertainment: 0,
    bills: 0,
    health: 0,
    education: 0,
    other: 0,
  };

  for (const expense of expenses) {
    result[expense.category] += expense.amount;
  }

  return result;
}

// 计算总额
export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
