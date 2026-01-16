/**
 * Todo Repository
 * Uses Zustand local store for data persistence
 */

import { useLocalStore, Todo, TodoPriority, TodoStatus, TodoColor } from '@/models';

export interface CreateTodoData {
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  tags?: string[];
  color?: TodoColor;
  emoji?: string;
  calendarEventId?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
  tags?: string[];
  color?: TodoColor;
  emoji?: string;
  calendarEventId?: string;
}

class TodoRepositoryClass {
  async create(data: CreateTodoData): Promise<Todo> {
    const store = useLocalStore.getState();
    return store.addTodo({
      userId: data.userId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      status: data.status || 'active',
      tags: data.tags || [],
      color: data.color || 'yellow',
      emoji: data.emoji || '📝',
      calendarEventId: data.calendarEventId,
      isDeleted: false,
    });
  }

  async findById(id: string): Promise<Todo | null> {
    const store = useLocalStore.getState();
    const todos = store.getTodos();
    return todos.find((t) => t.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Todo[]> {
    const store = useLocalStore.getState();
    return store.getTodos().filter((t) => t.userId === userId);
  }

  async findAll(): Promise<Todo[]> {
    const store = useLocalStore.getState();
    return store.getTodos();
  }

  async update(id: string, data: UpdateTodoData): Promise<void> {
    const store = useLocalStore.getState();
    store.updateTodo(id, data);
  }

  async delete(id: string): Promise<void> {
    const store = useLocalStore.getState();
    store.deleteTodo(id);
  }

  async toggleStatus(id: string): Promise<void> {
    const store = useLocalStore.getState();
    const todo = store.getTodos().find((t) => t.id === id);
    if (todo) {
      store.updateTodo(id, {
        status: todo.status === 'active' ? 'completed' : 'active',
      });
    }
  }

  async findByStatus(userId: string, status: TodoStatus): Promise<Todo[]> {
    const store = useLocalStore.getState();
    return store.getTodos().filter((t) => t.userId === userId && t.status === status);
  }

  async findByPriority(userId: string, priority: TodoPriority): Promise<Todo[]> {
    const store = useLocalStore.getState();
    return store.getTodos().filter((t) => t.userId === userId && t.priority === priority);
  }

  async count(userId: string): Promise<number> {
    const store = useLocalStore.getState();
    return store.getTodos().filter((t) => t.userId === userId).length;
  }
}

export const TodoRepository = new TodoRepositoryClass();
