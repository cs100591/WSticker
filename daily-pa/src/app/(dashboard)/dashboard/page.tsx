'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  Plus,
  Bell,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-provider';
import { motion } from 'framer-motion';

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
  useTheme();
  const [displayName, setDisplayName] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, todosRes, calendarRes, expensesRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/todos'),
          fetch(`/api/calendar?start=${new Date().toISOString().split('T')[0]}&end=${new Date().toISOString().split('T')[0]}`),
          fetch(`/api/expenses?startDate=${new Date().toISOString().slice(0, 7)}-01&endDate=${new Date().toISOString().slice(0, 7)}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`)
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setDisplayName(profileData.fullName || profileData.email?.split('@')[0] || 'User');
        }
        if (todosRes.ok) setTodos((await todosRes.json()).todos || []);
        if (calendarRes.ok) setEvents((await calendarRes.json()).events || []);
        if (expensesRes.ok) setExpenses((await expensesRes.json()).expenses || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => ({
    activeTasks: todos.filter(t => t.status === 'active').length,
    completionRate: todos.length > 0 ? Math.round((todos.filter(t => t.status === 'completed').length / todos.length) * 100) : 0,
    monthlySpend: expenses.reduce((sum, e) => sum + e.amount, 0),
    eventsToday: events.length
  }), [todos, expenses, events]);

  const priorityTodos = useMemo(() => 
    todos.filter(t => t.status === 'active').slice(0, 5),
  [todos]);

  const formatTime = (dateString: string) => 
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-color)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg-color)' }}>
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Good day, {displayName}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Here&apos;s what&apos;s happening today
            </p>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="icon" className="rounded-full theme-card">
              <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 space-y-4">
        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="theme-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.activeTasks}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Active Tasks</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="theme-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--status-success)' }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.completionRate}%
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Completion</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="theme-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                <DollarSign className="w-5 h-5" style={{ color: 'var(--status-warning)' }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${stats.monthlySpend.toFixed(0)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>This Month</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="theme-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                <Calendar className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.eventsToday}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Events Today</p>
          </motion.div>
        </div>

        {/* Today's Schedule */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Today&apos;s Schedule</h2>
            <Link href="/calendar" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className="w-12 text-right">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {event.allDay ? 'All Day' : formatTime(event.startTime)}
                    </p>
                  </div>
                  <div className="flex-1 pb-3 border-l-2 pl-3" style={{ borderColor: 'var(--border-default)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
                    {!event.allDay && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events today</p>
            </div>
          )}
        </motion.div>

        {/* Priority Tasks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="theme-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Priority Tasks</h2>
            <Link href="/todos" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {priorityTodos.length > 0 ? (
            <div className="space-y-3">
              {priorityTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--border-light)' }}>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(todo.priority)}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{todo.title}</p>
                    {todo.dueDate && (
                      <p className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" />
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active tasks</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link href="/todos">
            <Button className="w-full h-14 rounded-xl theme-button">
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          </Link>
          <Link href="/expenses">
            <Button className="w-full h-14 rounded-xl theme-button">
              <DollarSign className="w-5 h-5 mr-2" />
              Log Expense
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
