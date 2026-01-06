/**
 * 消费记录属性测试
 * Property 9: 消费记录 CRUD 往返一致性
 * Property 13: 消费汇总聚合正确性
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  type Expense,
  type ExpenseCategory,
  type CreateExpenseInput,
  type ExpenseRow,
  expenseRowToExpense,
  createExpenseInputToInsert,
  aggregateByCategory,
  calculateTotal,
  EXPENSE_CATEGORY_LABELS,
} from '../../src/types/expense';

// 所有有效的消费类别
const allCategories: ExpenseCategory[] = [
  'food', 'transport', 'shopping', 'entertainment',
  'bills', 'health', 'education', 'other'
];

// 生成有效的消费类别
const categoryArb = fc.constantFrom<ExpenseCategory>(...allCategories);

// 生成有效的 UUID
const uuidArb = fc.uuid();

// 生成有效的金额（正数，最多2位小数）
const amountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
  .map(n => Math.round(n * 100) / 100);

// 生成有效的货币代码
const currencyArb = fc.constantFrom('CNY', 'USD', 'EUR', 'JPY', 'GBP');

// 生成有效的描述
const descriptionArb = fc.option(fc.string({ maxLength: 500 }), { nil: null });

// 生成有效的标签数组
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 });

// 生成有效的日期字符串
const dateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString().split('T')[0]);

const isoDateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString());

// 生成 ExpenseRow 数据
const expenseRowArb = fc.record({
  id: uuidArb,
  user_id: uuidArb,
  amount: amountArb.map(n => n.toString()),
  currency: currencyArb,
  category: categoryArb,
  description: descriptionArb,
  expense_date: dateStringArb,
  receipt_url: fc.option(fc.webUrl(), { nil: null }),
  tags: tagsArb,
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
}) as fc.Arbitrary<ExpenseRow>;

// 生成 CreateExpenseInput 数据
const createExpenseInputArb = fc.record({
  amount: amountArb,
  currency: fc.option(currencyArb, { nil: undefined }),
  category: categoryArb,
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  expenseDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  receiptUrl: fc.option(fc.webUrl(), { nil: undefined }),
  tags: fc.option(tagsArb, { nil: undefined }),
});

// 生成 Expense 数据
const expenseArb = fc.record({
  id: uuidArb,
  userId: uuidArb,
  amount: amountArb,
  currency: currencyArb,
  category: categoryArb,
  description: descriptionArb,
  expenseDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  receiptUrl: fc.option(fc.webUrl(), { nil: null }),
  tags: tagsArb,
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Expense>;


describe('Expense Property Tests', () => {
  describe('Property 9: 消费记录 CRUD 往返一致性', () => {
    it('expenseRowToExpense 应保留所有字段值', () => {
      fc.assert(
        fc.property(expenseRowArb, (row) => {
          const expense = expenseRowToExpense(row);

          // 验证所有字段正确转换
          expect(expense.id).toBe(row.id);
          expect(expense.userId).toBe(row.user_id);
          expect(expense.amount).toBe(Number(row.amount));
          expect(expense.currency).toBe(row.currency);
          expect(expense.category).toBe(row.category);
          expect(expense.description).toBe(row.description);
          expect(expense.receiptUrl).toBe(row.receipt_url);
          expect(expense.tags).toEqual(row.tags);

          // 验证日期转换
          expect(expense.expenseDate).toBeInstanceOf(Date);
          expect(expense.createdAt).toBeInstanceOf(Date);
          expect(expense.updatedAt).toBeInstanceOf(Date);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('createExpenseInputToInsert 应正确转换输入为数据库格式', () => {
      fc.assert(
        fc.property(createExpenseInputArb, uuidArb, (input, userId) => {
          const insert = createExpenseInputToInsert(input as CreateExpenseInput, userId);

          // 验证必填字段
          expect(insert.user_id).toBe(userId);
          expect(insert.amount).toBe(input.amount);
          expect(insert.category).toBe(input.category);

          // 验证可选字段
          expect(insert.currency).toBe(input.currency ?? 'CNY');
          expect(insert.description).toBe(input.description);
          expect(insert.receipt_url).toBe(input.receiptUrl);
          expect(insert.tags).toEqual(input.tags ?? []);

          // 验证日期格式
          expect(insert.expense_date).toBeDefined();

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('金额转换应保持精度', () => {
      fc.assert(
        fc.property(amountArb, (amount) => {
          const row: ExpenseRow = {
            id: 'test-id',
            user_id: 'test-user',
            amount: amount.toString(),
            currency: 'CNY',
            category: 'food',
            description: null,
            expense_date: '2024-01-01',
            receipt_url: null,
            tags: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const expense = expenseRowToExpense(row);

          // 验证金额精度保持
          expect(expense.amount).toBeCloseTo(amount, 2);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: 消费汇总聚合正确性', () => {
    it('aggregateByCategory 应正确按类别汇总', () => {
      fc.assert(
        fc.property(
          fc.array(expenseArb, { maxLength: 100 }),
          (expenses) => {
            const summary = aggregateByCategory(expenses);

            // 验证每个类别的总和
            for (const category of allCategories) {
              const expected = expenses
                .filter(e => e.category === category)
                .reduce((sum, e) => sum + e.amount, 0);

              expect(summary[category]).toBeCloseTo(expected, 2);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('aggregateByCategory 总和应等于所有类别之和', () => {
      fc.assert(
        fc.property(
          fc.array(expenseArb, { maxLength: 100 }),
          (expenses) => {
            const summary = aggregateByCategory(expenses);

            // 计算汇总中所有类别的总和
            const summaryTotal = Object.values(summary).reduce((a, b) => a + b, 0);

            // 计算原始数据的总和
            const expectedTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

            expect(summaryTotal).toBeCloseTo(expectedTotal, 2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('calculateTotal 应正确计算总额', () => {
      fc.assert(
        fc.property(
          fc.array(expenseArb, { maxLength: 100 }),
          (expenses) => {
            const total = calculateTotal(expenses);

            // 手动计算期望值
            const expected = expenses.reduce((sum, e) => sum + e.amount, 0);

            expect(total).toBeCloseTo(expected, 2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('空数组的汇总应全为零', () => {
      const summary = aggregateByCategory([]);

      for (const category of allCategories) {
        expect(summary[category]).toBe(0);
      }

      expect(calculateTotal([])).toBe(0);
    });

    it('单个消费的汇总应只在对应类别有值', () => {
      fc.assert(
        fc.property(expenseArb, (expense) => {
          const summary = aggregateByCategory([expense]);

          // 验证只有对应类别有值
          for (const category of allCategories) {
            if (category === expense.category) {
              expect(summary[category]).toBeCloseTo(expense.amount, 2);
            } else {
              expect(summary[category]).toBe(0);
            }
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('EXPENSE_CATEGORY_LABELS 应包含所有类别', () => {
      for (const category of allCategories) {
        expect(EXPENSE_CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof EXPENSE_CATEGORY_LABELS[category]).toBe('string');
      }
    });
  });
});
