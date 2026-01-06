/**
 * 月度报告相关类型定义
 */

import type { Tables, InsertTables } from './database.types';
import type { ExpenseCategory } from './expense';

// 数据库行类型
export type MonthlyReportRow = Tables<'monthly_reports'>;
export type MonthlyReportInsert = InsertTables<'monthly_reports'>;

// 报告数据结构
export interface TodoReportData {
  total: number;
  completed: number;
  completionRate: number;
  byPriority: Record<string, number>;
}

export interface ExpenseReportData {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  dailyAverage: number;
  topCategories: Array<{ category: ExpenseCategory; amount: number }>;
}

export interface ReportData {
  todos: TodoReportData;
  expenses: ExpenseReportData;
  insights: string[];
}

// 业务层类型
export interface MonthlyReport {
  id: string;
  userId: string;
  year: number;
  month: number;
  reportData: ReportData;
  generatedAt: Date;
}

// 报告查询参数
export interface ReportQueryParams {
  year: number;
  month: number;
}

export interface CustomReportParams {
  startDate: Date | string;
  endDate: Date | string;
  includeExpenses?: boolean;
  includeTodos?: boolean;
}


// 转换函数
export function monthlyReportRowToReport(row: MonthlyReportRow): MonthlyReport {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year,
    month: row.month,
    reportData: row.report_data as unknown as ReportData,
    generatedAt: new Date(row.generated_at),
  };
}

// 计算完成率
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// 获取月份显示名称
export function getMonthDisplayName(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
}

// 生成空报告数据
export function createEmptyReportData(): ReportData {
  return {
    todos: {
      total: 0,
      completed: 0,
      completionRate: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
    },
    expenses: {
      total: 0,
      byCategory: {
        food: 0,
        transport: 0,
        shopping: 0,
        entertainment: 0,
        bills: 0,
        health: 0,
        education: 0,
        other: 0,
      },
      dailyAverage: 0,
      topCategories: [],
    },
    insights: [],
  };
}
