'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

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

// Smart greeting based on time of day
function getGreeting(locale: string): string {
  const hour = new Date().getHours();
  if (locale === 'zh') {
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Generate smart recommendations based on data
function getRecommendations(
  todos: Todo[], 
  events: CalendarEvent[], 
  expenses: Expense[],
  locale: string
): { icon: React.ReactNode; text: string; action?: string; href?: string }[] {
  const recommendations: { icon: React.ReactNode; text: string; action?: string; href?: string }[] = [];
  
  const highPriorityTodos = todos.filter(t => t.status === 'active' && t.priority === 'high');
  const activeTodos = todos.filter(t => t.status === 'active');
  const monthlySpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  if (locale === 'zh') {
    if (highPriorityTodos.length > 0) {
      recommendations.push({
        icon: <Target className="w-4 h-4 text-red-500" />,
        text: `你有 ${highPriorityTodos.length} 个高优先级任务待处理`,
        action: '查看',
        href: '/todos'
      });
    }
    
    if (events.length > 0) {
      recommendations.push({
        icon: <Clock className="w-4 h-4 text-green-500" />,
        text: `今天有 ${events.length} 个日程安排`,
        action: '查看',
        href: '/calendar'
      });
    }
    
    if (monthlySpending > 1000) {
      recommendations.push({
        icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
        text: `本月消费已达 $${monthlySpending.toFixed(0)}`,
        action: '分析',
        href: '/expenses'
      });
    }
    
    if (activeTodos.length === 0) {
      recommendations.push({
        icon: <Lightbulb className="w-4 h-4 text-blue-500" />,
        text: '没有待办事项，添加一个新任务吧',
        action: '添加',
        href: '/todos'
      });
    }
  } else {
    if (highPriorityTodos.length > 0) {
      recommendations.push({
        icon: <Target className="w-4 h-4 text-red-500" />,
        text: `${highPriorityTodos.length} high priority task${highPriorityTodos.length > 1 ? 's' : ''} need attention`,
        action: 'View',
        href: '/todos'
      });
    }
    
    if (events.length > 0) {
      recommendations.push({
        icon: <Clock className="w-4 h-4 text-green-500" />,
        text: `${events.length} event${events.length > 1 ? 's' : ''} scheduled for today`,
        action: 'View',
        href: '/calendar'
      });
    }
    
    if (monthlySpending > 1000) {
      recommendations.push({
        icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
        text: `Monthly spending reached $${monthlySpending.toFixed(0)}`,
        action: 'Analyze',
        href: '/expenses'
      });
    }
    
    if (activeTodos.length === 0) {
      recommendations.push({
        icon: <Lightbulb className="w-4 h-4 text-blue-500" />,
        text: 'No tasks yet. Start by adding one!',
        action: 'Add',
        href: '/todos'
      });
    }
  }
  
  return recommendations.slice(0, 3);
}

export default function DashboardPage() {
  const { locale } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.fullName || data.email?.split('@')[0] || '');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const todosRes = await fetch('/api/todos');
        if (todosRes.ok) {
          const todosData = await todosRes.json();
          setTodos(todosData.todos || []);
        }

        const today = new Date().toISOString().split('T')[0];
        const calendarRes = await fetch(`/api/calendar?start=${today}&end=${today}`);
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          setEvents(calendarData.events || []);
        }

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

  const activeTodos = todos.filter(t => t.status === 'active');
  const completedTodos = todos.filter(t => t.status === 'completed');
  const monthlySpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;
  const recommendations = getRecommendations(todos, events, expenses, locale);

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

  const priorityLabel = (p: string) => {
    if (locale === 'zh') {
      return p === 'high' ? '🔴 高' : p === 'medium' ? '🟠 中' : '🔵 低';
    }
    return p === 'high' ? '🔴 High' : p === 'medium' ? '🟠 Med' : '🔵 Low';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
        {/* AI Greeting Panel */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {getGreeting(locale)}{displayName ? `, ${displayName}` : ''} 👋
            </h1>
            
            <p className="text-blue-100 text-sm md:text-base">
              {locale === 'zh' 
                ? `今天有 ${activeTodos.length} 个待办事项和 ${events.length} 个日程`
                : `You have ${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} and ${events.length} event${events.length !== 1 ? 's' : ''} today`
              }
            </p>
          </div>
        </div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <GlassCard>
            <GlassCardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-700">
                  {locale === 'zh' ? '智能建议' : 'Suggestions'}
                </span>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {rec.icon}
                      <span className="text-sm text-gray-700">{rec.text}</span>
                    </div>
                    {rec.href && (
                      <Link href={rec.href}>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 h-7 px-2">
                          {rec.action} <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/todos">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform">
              <GlassCardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeTodos.length}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '待办' : 'Tasks'}</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/calendar">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform">
              <GlassCardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '日程' : 'Events'}</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link href="/expenses">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform">
              <GlassCardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-orange-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">${monthlySpending.toFixed(0)}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '本月' : 'This month'}</p>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        {/* Focus Section - Priority Tasks */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-800">
                  {locale === 'zh' ? '今日重点' : 'Focus Today'}
                </span>
              </div>
              <Link href="/todos">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 h-7 px-2">
                  {locale === 'zh' ? '全部' : 'All'} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-gray-400">
                {locale === 'zh' ? '加载中...' : 'Loading...'}
              </div>
            ) : activeTodos.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  {locale === 'zh' ? '暂无待办事项' : 'No tasks yet'}
                </p>
                <Link href="/todos">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    {locale === 'zh' ? '添加任务' : 'Add Task'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTodos.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all group"
                  >
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-500" strokeWidth={1.5} />
                    </button>
                    <span className="flex-1 text-sm text-gray-800 truncate">{todo.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {priorityLabel(todo.priority)}
                    </span>
                  </div>
                ))}
                {activeTodos.length > 5 && (
                  <Link href="/todos" className="block text-center text-sm text-blue-500 hover:underline pt-2">
                    {locale === 'zh' ? `查看全部 ${activeTodos.length} 个任务` : `View all ${activeTodos.length} tasks`} →
                  </Link>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Today's Schedule */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-800">
                  {locale === 'zh' ? '今日日程' : "Today's Schedule"}
                </span>
              </div>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500 h-7 px-2">
                  {locale === 'zh' ? '日历' : 'Calendar'} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-gray-400">
                {locale === 'zh' ? '加载中...' : 'Loading...'}
              </div>
            ) : events.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm">
                  {locale === 'zh' ? '今天没有日程安排' : 'No events today'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all"
                  >
                    <div className="w-1 h-10 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.allDay 
                          ? (locale === 'zh' ? '全天' : 'All day')
                          : `${event.startTime.slice(11, 16)} - ${event.endTime.slice(11, 16)}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Spending Overview */}
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-800">
                  {locale === 'zh' ? '消费概览' : 'Spending Overview'}
                </span>
              </div>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-orange-500 h-7 px-2">
                  {locale === 'zh' ? '详情' : 'Details'} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-gray-400">
                {locale === 'zh' ? '加载中...' : 'Loading...'}
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  {locale === 'zh' ? '本月暂无消费记录' : 'No expenses this month'}
                </p>
                <Link href="/expenses">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    {locale === 'zh' ? '记录消费' : 'Add Expense'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                {/* Spending Summary */}
                <div className="flex items-end justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">${monthlySpending.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {locale === 'zh' ? `${expenses.length} 笔交易` : `${expenses.length} transactions`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      {completionRate >= 50 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-orange-500" />
                      )}
                      <span className={completionRate >= 50 ? 'text-green-600' : 'text-orange-600'}>
                        {completionRate}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {locale === 'zh' ? '任务完成率' : 'Task completion'}
                    </p>
                  </div>
                </div>

                {/* Recent Expenses */}
                <div className="space-y-2">
                  {expenses.slice(0, 3).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{expense.category}</p>
                          <p className="text-xs text-gray-500">{expense.expenseDate}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
