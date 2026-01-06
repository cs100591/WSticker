'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Expense, CreateExpenseInput, UpdateExpenseInput, ExpenseFilters, ExpenseSummary } from '@/types/expense';

interface UseExpensesOptions {
  filters?: ExpenseFilters;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.filters?.category && options.filters.category !== 'all') {
        params.set('category', options.filters.category);
      }
      const dateFromValue = options.filters?.dateFrom;
      if (dateFromValue) {
        const dateStr = typeof dateFromValue === 'string' 
          ? dateFromValue 
          : dateFromValue.toISOString().split('T')[0] ?? '';
        params.set('dateFrom', dateStr);
      }
      const dateToValue = options.filters?.dateTo;
      if (dateToValue) {
        const dateStr = typeof dateToValue === 'string' 
          ? dateToValue 
          : dateToValue.toISOString().split('T')[0] ?? '';
        params.set('dateTo', dateStr);
      }
      if (options.filters?.search) {
        params.set('search', options.filters.search);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [options.filters?.category, options.filters?.dateFrom, options.filters?.dateTo, options.filters?.search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = useCallback(async (input: CreateExpenseInput) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to create expense');
      
      const newExpense = await res.json();
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const updateExpense = useCallback(async (id: string, input: UpdateExpenseInput) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Failed to update expense');
      
      const updated = await res.json();
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const prevExpenses = expenses;
    
    // 乐观更新
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setExpenses(prevExpenses);
        throw new Error('Failed to delete expense');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [expenses]);

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

export function useExpenseSummary(dateFrom?: string, dateTo?: string) {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/expenses/summary?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary };
}
