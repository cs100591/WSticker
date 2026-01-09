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
  Lightbulb,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Zap
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="flex-1 p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {getGreeting(locale)}{displayName ? `, ${displayName}` : ''} 👋
            </h1>
            <p className="text-gray-600 mt-2">
              {locale === 'zh' 
                ? `今天有 ${activeTodos.length} 个待办事项和 ${events.length} 个日程`
                : `You have ${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} and ${events.length} event${events.length !== 1 ? 's' : ''} today`
              }
            </p>
          </div>
          <Link href="/todos">
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/30">
              <Plus className="w-4 h-4 mr-2" />
              {locale === 'zh' ? '新建任务' : 'New Task'}
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Active Tasks */}
          <Link href="/todos">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{locale === 'zh' ? '活跃任务' : 'Active Tasks'}</p>
                    <p className="text-3xl font-bold text-gray-900">{activeTodos.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          {/* Completion Rate */}
          <GlassCard>
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{locale === 'zh' ? '完成率' : 'Completion'}</p>
                  <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Monthly Spending */}
          <Link href="/expenses">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{locale === 'zh' ? '本月消费' : 'Monthly Spend'}</p>
                    <p className="text-3xl font-bold text-gray-900">${monthlySpending.toFixed(0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          {/* Events Today */}
          <Link href="/calendar">
            <GlassCard className="h-full hover:scale-[1.02] transition-transform cursor-pointer">
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{locale === 'zh' ? '今日日程' : 'Today Events'}</p>
                    <p className="text-3xl font-bold text-gray-900">{events.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        </div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <GlassCard variant="premium">
            <GlassCardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span className="text-lg font-semibold text-gray-900">
                  {locale === 'zh' ? '智能建议' : 'Smart Suggestions'}
                </span>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/50 to-blue-50/30 hover:from-white/70 hover:to-blue-50/50 transition-all">
                    <div className="flex items-center gap-3">
                      {rec.icon}
                      <span className="text-sm text-gray-700">{rec.text}</span>
                    </div>
                    {rec.href && (
                      <Link href={rec.href}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8 px-3">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Todos */}
          <div className="lg:col-span-2">
            <GlassCard>
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {locale === 'zh' ? '最近任务' : 'Recent Tasks'}
                  </h2>
                  <Link href="/todos">
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      {locale === 'zh' ? '查看全部' : 'View All'} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {activeTodos.slice(0, 5).map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className="flex-shrink-0"
                      >
                        <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{todo.title}</p>
                        {todo.dueDate && (
                          <p className="text-xs text-gray-500">{new Date(todo.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {priorityLabel(todo.priority)}
                      </span>
                    </div>
                  ))}
                  {activeTodos.length === 0 && (
                    <div className="text-center py-8">
                      <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        {locale === 'zh' ? '没有待办事项' : 'No tasks yet'}
                      </p>
                    </div>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <GlassCard>
              <GlassCardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {locale === 'zh' ? '快速操作' : 'Quick Actions'}
                </h3>
                <div className="space-y-3">
                  <Link href="/todos" className="block">
                    <Button variant="outline" className="w-full justify-start h-10">
                      <Plus className="w-4 h-4 mr-2" />
                      {locale === 'zh' ? '新建任务' : 'New Task'}
                    </Button>
                  </Link>
                  <Link href="/expenses" className="block">
                    <Button variant="outline" className="w-full justify-start h-10">
                      <Plus className="w-4 h-4 mr-2" />
                      {locale === 'zh' ? '记录消费' : 'Log Expense'}
                    </Button>
                  </Link>
                  <Link href="/calendar" className="block">
                    <Button variant="outline" className="w-full justify-start h-10">
                      <Plus className="w-4 h-4 mr-2" />
                      {locale === 'zh' ? '新建日程' : 'New Event'}
                    </Button>
                  </Link>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Stats Card */}
            <GlassCard>
              <GlassCardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {locale === 'zh' ? '本周统计' : 'Weekly Stats'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{locale === 'zh' ? '完成任务' : 'Completed'}</span>
                    <span className="text-lg font-semibold text-green-600">{completedTodos.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{locale === 'zh' ? '待处理' : 'Pending'}</span>
                    <span className="text-lg font-semibold text-orange-600">{activeTodos.length}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">{locale === 'zh' ? '完成率' : 'Rate'}</span>
                    <span className="text-lg font-semibold text-blue-600">{completionRate}%</span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
