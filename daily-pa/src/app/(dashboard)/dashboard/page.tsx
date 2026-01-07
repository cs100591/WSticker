'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useI18n } from '@/lib/i18n';
import { CheckSquare, Calendar, DollarSign, TrendingUp, Clock, ArrowRight, Circle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  title: string;
  status: 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  expenseDate: string;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const displayName = 'User';
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch todos
        const todosRes = await fetch('/api/todos');
        if (todosRes.ok) {
          const todosData = await todosRes.json();
          setTodos(todosData.todos || []);
        }

        // Fetch today's calendar events
        const today = new Date().toISOString().split('T')[0];
        const calendarRes = await fetch(`/api/calendar?start=${today}&end=${today}`);
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          setEvents(calendarData.events || []);
        }

        // Fetch this month's expenses
        const now = new Date();
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        const expensesRes = await fetch(`/api/expenses?startDate=${monthStart}&endDate=${monthEnd}`);
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          setExpenses(expensesData.expenses || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const activeTodos = todos.filter(t => t.status === 'active');
  const completedTodos = todos.filter(t => t.status === 'completed');
  const todayEvents = events.length;
  const monthlySpending = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Toggle todo status
  const handleToggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newStatus = todo.status === 'active' ? 'completed' : 'active';
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.nav.home} showHomeButton={false} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {t.dashboard.hello}, {displayName}! 👋
            </h2>
            <p className="text-gray-500 mt-1">{t.dashboard.welcomeMessage}</p>
          </div>
        </div>

        {/* Quick Stats - Outline Icons */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/todos" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.todaysTasks}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{activeTodos.length}</p>
                    <p className="text-sm text-gray-400 mt-1">{completedTodos.length} {t.dashboard.completed}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-blue-500 flex items-center justify-center">
                    <CheckSquare className="w-7 h-7 text-blue-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/calendar" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.todaysEvents}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{todayEvents}</p>
                    <p className="text-sm text-gray-400 mt-1">{todayEvents === 0 ? t.dashboard.noUpcomingEvents : `${todayEvents} events today`}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-green-500 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-green-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/expenses" className="group">
            <GlassCard className="h-full group-hover:scale-[1.02] transition-transform duration-200">
              <GlassCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t.dashboard.monthlySpending}</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">${monthlySpending.toFixed(0)}</p>
                    <p className="text-sm text-gray-400 mt-1">{expenses.length} transactions</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl border-2 border-orange-500 flex items-center justify-center">
                    <DollarSign className="w-7 h-7 text-orange-500" strokeWidth={1.5} />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                {t.dashboard.recentTasks}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : todos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                    <CheckSquare className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 mb-4">{t.dashboard.noTasksYet}</p>
                  <Link href="/todos">
                    <Button variant="outline" className="rounded-xl">
                      {t.dashboard.addTask}
                      <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {todos.slice(0, 5).map((todo) => (
                    <div
                      key={todo.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all',
                        todo.status === 'completed' ? 'bg-gray-50/50' : 'bg-white/50 hover:bg-white/80'
                      )}
                    >
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {todo.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 hover:text-blue-500" strokeWidth={1.5} />
                        )}
                      </button>
                      <span className={cn(
                        'flex-1 text-sm truncate',
                        todo.status === 'completed' && 'line-through text-gray-400'
                      )}>
                        {todo.title}
                      </span>
                    </div>
                  ))}
                  {todos.length > 5 && (
                    <Link href="/todos" className="block text-center text-sm text-blue-500 hover:underline pt-2">
                      View all {todos.length} tasks →
                    </Link>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" strokeWidth={1.5} />
                Today&apos;s Events
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {isLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-gray-500 mb-4">No events today</p>
                  <Link href="/calendar">
                    <Button variant="outline" className="rounded-xl">
                      Add Event
                      <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all"
                    >
                      <div className="w-1 h-8 rounded-full border-2 border-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">
                          {event.allDay ? 'All day' : `${event.startTime.slice(11, 16)} - ${event.endTime.slice(11, 16)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  {events.length > 5 && (
                    <Link href="/calendar" className="block text-center text-sm text-green-500 hover:underline pt-2">
                      View all {events.length} events →
                    </Link>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Recent Expenses */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
              {t.dashboard.recentExpenses}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-gray-200 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-gray-500 mb-4">{t.dashboard.noExpensesYet}</p>
                <Link href="/expenses">
                  <Button variant="outline" className="rounded-xl">
                    {t.dashboard.addExpense}
                    <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.5} />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border-2 border-orange-500 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.category}</p>
                        <p className="text-xs text-gray-400">{expense.expenseDate}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                  </div>
                ))}
                {expenses.length > 5 && (
                  <Link href="/expenses" className="block text-center text-sm text-orange-500 hover:underline pt-2">
                    View all {expenses.length} expenses →
                  </Link>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
