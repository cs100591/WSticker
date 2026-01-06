/**
 * 开发模式内存存储
 * 用于在 DEV_SKIP_AUTH 模式下存储模拟数据
 * 注意：服务器重启后数据会丢失
 */

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  createdAt: string;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  expenseDate: string;
  receiptUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 内存存储
const devStore = {
  calendarEvents: [] as CalendarEvent[],
  todos: [] as Todo[],
  expenses: [] as Expense[],
};

export function getDevCalendarEvents(start?: string, end?: string): CalendarEvent[] {
  let events = [...devStore.calendarEvents];
  
  if (start) {
    events = events.filter(e => e.startTime >= `${start}T00:00:00`);
  }
  if (end) {
    events = events.filter(e => e.startTime <= `${end}T23:59:59`);
  }
  
  return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function addDevCalendarEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent {
  const newEvent: CalendarEvent = {
    ...event,
    id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    createdAt: new Date().toISOString(),
  };
  devStore.calendarEvents.push(newEvent);
  console.log('[DEV STORE] Calendar event added:', newEvent.title);
  return newEvent;
}

export function getDevTodos(): Todo[] {
  return [...devStore.todos].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addDevTodo(todo: Partial<Todo>): Todo {
  const newTodo: Todo = {
    id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    title: todo.title || '',
    description: todo.description || null,
    dueDate: todo.dueDate || null,
    priority: todo.priority || 'medium',
    status: 'active',
    tags: todo.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  devStore.todos.push(newTodo);
  console.log('[DEV STORE] Todo added:', newTodo.title);
  return newTodo;
}

export function getDevExpenses(): Expense[] {
  return [...devStore.expenses].sort((a, b) => 
    new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  );
}

export function addDevExpense(expense: Partial<Expense>): Expense {
  const today = new Date().toISOString().split('T')[0];
  const newExpense: Expense = {
    id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    amount: expense.amount ?? 0,
    currency: expense.currency ?? 'CNY',
    category: expense.category ?? 'other',
    description: expense.description ?? null,
    expenseDate: String(expense.expenseDate ?? today),
    receiptUrl: expense.receiptUrl ?? null,
    tags: expense.tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  devStore.expenses.push(newExpense);
  console.log('[DEV STORE] Expense added:', newExpense.amount, newExpense.category);
  return newExpense;
}

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === 'true';
}
