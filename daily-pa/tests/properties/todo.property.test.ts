/**
 * 待办事项属性测试
 * Property 3: 待办事项 CRUD 往返一致性
 * Property 7: 待办事项优先级排序
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  type Todo,
  type TodoPriority,
  type CreateTodoInput,
  todoRowToTodo,
  createTodoInputToInsert,
  sortByPriority,
  PRIORITY_WEIGHT,
} from '../../src/types/todo';
import type { TodoRow } from '../../src/types/todo';

// 生成有效的 Todo 优先级
const priorityArb = fc.constantFrom<TodoPriority>('low', 'medium', 'high');

// 生成有效的 Todo 状态
const statusArb = fc.constantFrom<'active' | 'completed'>('active', 'completed');

// 生成有效的 UUID
const uuidArb = fc.uuid();

// 生成有效的标题（非空，最大255字符）
const titleArb = fc.string({ minLength: 1, maxLength: 255 });

// 生成有效的描述（可选，最大1000字符）
const descriptionArb = fc.option(fc.string({ maxLength: 1000 }), { nil: null });

// 生成有效的标签数组
const tagsArb = fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 });

// 生成有效的日期字符串
const dateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map(d => d.toISOString());

// 生成 TodoRow 数据
const todoRowArb = fc.record({
  id: uuidArb,
  user_id: uuidArb,
  title: titleArb,
  description: descriptionArb,
  due_date: fc.option(dateStringArb, { nil: null }),
  priority: priorityArb,
  status: statusArb,
  tags: tagsArb,
  calendar_event_id: fc.option(uuidArb, { nil: null }),
  google_event_id: fc.option(fc.string(), { nil: null }),
  created_at: dateStringArb,
  updated_at: dateStringArb,
}) as fc.Arbitrary<TodoRow>;

// 生成 CreateTodoInput 数据
const createTodoInputArb = fc.record({
  title: titleArb,
  description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
  dueDate: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: undefined }),
  priority: fc.option(priorityArb, { nil: undefined }),
  tags: fc.option(tagsArb, { nil: undefined }),
});

// 生成带优先级的 Todo 列表
const todoWithPriorityArb = fc.record({
  id: uuidArb,
  userId: uuidArb,
  title: titleArb,
  description: descriptionArb,
  dueDate: fc.option(fc.date(), { nil: null }),
  priority: priorityArb,
  status: statusArb,
  tags: tagsArb,
  calendarEventId: fc.option(uuidArb, { nil: null }),
  googleEventId: fc.option(fc.string(), { nil: null }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<Todo>;

describe('Todo Property Tests', () => {
  describe('Property 3: Todo CRUD 往返一致性', () => {
    it('todoRowToTodo 应保留所有字段值', () => {
      fc.assert(
        fc.property(todoRowArb, (row) => {
          const todo = todoRowToTodo(row);

          // 验证所有字段正确转换
          expect(todo.id).toBe(row.id);
          expect(todo.userId).toBe(row.user_id);
          expect(todo.title).toBe(row.title);
          expect(todo.description).toBe(row.description);
          expect(todo.priority).toBe(row.priority);
          expect(todo.status).toBe(row.status);
          expect(todo.tags).toEqual(row.tags);
          expect(todo.calendarEventId).toBe(row.calendar_event_id);
          expect(todo.googleEventId).toBe(row.google_event_id);

          // 验证日期转换
          if (row.due_date) {
            expect(todo.dueDate).toBeInstanceOf(Date);
            expect(todo.dueDate?.toISOString()).toBe(row.due_date);
          } else {
            expect(todo.dueDate).toBeNull();
          }

          expect(todo.createdAt).toBeInstanceOf(Date);
          expect(todo.updatedAt).toBeInstanceOf(Date);

          return true;
        }),
        { numRuns: 100 }
      );
    });


    it('createTodoInputToInsert 应正确转换输入为数据库格式', () => {
      fc.assert(
        fc.property(createTodoInputArb, uuidArb, (input, userId) => {
          const insert = createTodoInputToInsert(input as CreateTodoInput, userId);

          // 验证必填字段
          expect(insert.user_id).toBe(userId);
          expect(insert.title).toBe(input.title);

          // 验证可选字段
          expect(insert.description).toBe(input.description);
          expect(insert.priority).toBe(input.priority ?? 'medium');
          expect(insert.tags).toEqual(input.tags ?? []);

          // 验证日期转换
          if (input.dueDate) {
            expect(insert.due_date).toBeDefined();
          }

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('往返转换应保持数据一致性', () => {
      fc.assert(
        fc.property(todoRowArb, (originalRow) => {
          // Row -> Todo -> 验证关键字段
          const todo = todoRowToTodo(originalRow);

          // 验证转换后的 Todo 可以正确表示原始数据
          expect(todo.id).toBe(originalRow.id);
          expect(todo.title).toBe(originalRow.title);
          expect(todo.priority).toBe(originalRow.priority);
          expect(todo.status).toBe(originalRow.status);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: 待办事项优先级排序', () => {
    it('sortByPriority 应按优先级正确排序（升序：high > medium > low）', () => {
      fc.assert(
        fc.property(
          fc.array(todoWithPriorityArb, { minLength: 1, maxLength: 100 }),
          (todos) => {
            const sorted = sortByPriority(todos, 'asc');

            // 验证排序结果
            for (let i = 1; i < sorted.length; i++) {
              const prevWeight = PRIORITY_WEIGHT[sorted[i - 1].priority];
              const currWeight = PRIORITY_WEIGHT[sorted[i].priority];
              expect(prevWeight).toBeLessThanOrEqual(currWeight);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sortByPriority 应按优先级正确排序（降序：low > medium > high）', () => {
      fc.assert(
        fc.property(
          fc.array(todoWithPriorityArb, { minLength: 1, maxLength: 100 }),
          (todos) => {
            const sorted = sortByPriority(todos, 'desc');

            // 验证排序结果
            for (let i = 1; i < sorted.length; i++) {
              const prevWeight = PRIORITY_WEIGHT[sorted[i - 1].priority];
              const currWeight = PRIORITY_WEIGHT[sorted[i].priority];
              expect(prevWeight).toBeGreaterThanOrEqual(currWeight);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sortByPriority 应保持原数组不变（不可变性）', () => {
      fc.assert(
        fc.property(
          fc.array(todoWithPriorityArb, { minLength: 1, maxLength: 50 }),
          (todos) => {
            const originalIds = todos.map(t => t.id);
            const sorted = sortByPriority(todos);

            // 验证原数组未被修改
            expect(todos.map(t => t.id)).toEqual(originalIds);

            // 验证排序后的数组是新数组
            expect(sorted).not.toBe(todos);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sortByPriority 应保持相同优先级元素的相对顺序（稳定排序）', () => {
      fc.assert(
        fc.property(
          fc.array(todoWithPriorityArb, { minLength: 2, maxLength: 50 }),
          (todos) => {
            const sorted = sortByPriority(todos);

            // 对于相同优先级的元素，检查它们在原数组中的相对顺序是否保持
            const priorityGroups = new Map<TodoPriority, string[]>();

            for (const todo of todos) {
              const group = priorityGroups.get(todo.priority) ?? [];
              group.push(todo.id);
              priorityGroups.set(todo.priority, group);
            }

            const sortedPriorityGroups = new Map<TodoPriority, string[]>();
            for (const todo of sorted) {
              const group = sortedPriorityGroups.get(todo.priority) ?? [];
              group.push(todo.id);
              sortedPriorityGroups.set(todo.priority, group);
            }

            // 验证每个优先级组内的顺序保持不变
            for (const [priority, originalOrder] of priorityGroups) {
              const sortedOrder = sortedPriorityGroups.get(priority) ?? [];
              expect(sortedOrder).toEqual(originalOrder);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sortByPriority 应保持元素数量不变', () => {
      fc.assert(
        fc.property(
          fc.array(todoWithPriorityArb, { maxLength: 100 }),
          (todos) => {
            const sorted = sortByPriority(todos);
            expect(sorted.length).toBe(todos.length);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
