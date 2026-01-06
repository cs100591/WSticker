'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters, TodoStatus } from '@/types/todo';

interface UseTodosOptions {
  filters?: TodoFilters;
}

export function useTodos(options: UseTodosOptions = {}) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.filters?.status && options.filters.status !== 'all') {
        params.set('status', options.filters.status);
      }
      if (options.filters?.priority && options.filters.priority !== 'all') {
        params.set('priority', options.filters.priority);
      }
      if (options.filters?.search) {
        params.set('search', options.filters.search);
      }

      const res = await fetch(`/api/todos?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch todos');
      
      const data = await res.json();
      setTodos(data.todos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options.filters?.status, options.filters?.priority, options.filters?.search]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = useCallback(async (input: CreateTodoInput) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create todo');
      
      const newTodo = await res.json();
      setTodos(prev => [newTodo, ...prev]);
      return newTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const updateTodo = useCallback(async (id: string, input: UpdateTodoInput) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      
      const updated = await res.json();
      setTodos(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newStatus: TodoStatus = todo.status === 'completed' ? 'active' : 'completed';
    
    // 乐观更新
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus } : t
    ));

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // 回滚
        setTodos(prev => prev.map(t => 
          t.id === id ? { ...t, status: todo.status } : t
        ));
        throw new Error('Failed to toggle todo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [todos]);

  const deleteTodo = useCallback(async (id: string) => {
    const prevTodos = todos;
    
    // 乐观更新
    setTodos(prev => prev.filter(t => t.id !== id));

    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setTodos(prevTodos);
        throw new Error('Failed to delete todo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [todos]);

  return {
    todos,
    isLoading,
    error,
    refetch: fetchTodos,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
  };
}
