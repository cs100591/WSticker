'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  Plus,
  Zap,
  ArrowUpRight,
  MoreHorizontal,
  Search,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

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
  const { } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const profileRes = await fetch('/api/user/profile');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setDisplayName(profileData.fullName || profileData.email?.split('@')[0] || 'User');
        }

        // Fetch todos
        const todosRes = await fetch('/api/todos');
        if (todosRes.ok) {
          const todosData = await todosRes.json();
          setTodos(todosData.todos || []);
        }

        // Fetch calendar
        const today = new Date().toISOString().split('T')[0];
        const calendarRes = await fetch(`/api/calendar?start=${today}&end=${today}`);
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          setEvents(calendarData.events || []);
        }

        // Fetch expenses
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Good day, {displayName}</h1>
            <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening with your productivity today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-0 transition-all w-64"
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full border-slate-200 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
            </Button>
            <Link href="/todos">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Tasks', value: activeTodos.length, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Monthly Spend', value: `$${monthlySpending.toFixed(0)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Events Today', value: events.length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Priority Tasks</h2>
                <Link href="/todos" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-50">
                {activeTodos.length > 0 ? (
                  activeTodos.slice(0, 5).map((todo) => (
                    <div key={todo.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                      <button className="flex-shrink-0">
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{todo.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {todo.dueDate && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            todo.priority === 'high' ? 'bg-rose-50 text-rose-600' : 
                            todo.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {todo.priority}
                          </span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">No active tasks. Take a break or create a new one!</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity / Insights */}
            <section className="bg-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-blue-200" />
                  <h2 className="font-bold">Productivity Insight</h2>
                </div>
                <p className="text-blue-100 leading-relaxed">
                  You&apos;ve completed <span className="font-bold text-white">{completedTodos.length} tasks</span> this week. That&apos;s 15% more than last week! Keep up the momentum to reach your monthly goals.
                </p>
                <Button className="mt-6 bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs px-6">
                  View Full Report
                </Button>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
            </section>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            {/* Calendar Widget */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Today&apos;s Schedule</h2>
              </div>
              <div className="p-6">
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex-1 pb-4 border-l-2 border-blue-100 pl-4 relative">
                          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-600"></div>
                          <p className="text-sm font-bold text-slate-900">{event.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {event.allDay ? 'All Day' : `${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No events scheduled for today.</p>
                  </div>
                )}
                <Link href="/calendar">
                  <Button variant="outline" className="w-full mt-4 text-xs font-bold border-slate-200">
                    Open Calendar
                  </Button>
                </Link>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-slate-900 rounded-xl p-6 text-white shadow-xl">
              <h2 className="font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-center transition-colors">
                  <Plus className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Add Task</span>
                </button>
                <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-center transition-colors">
                  <DollarSign className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Log Spend</span>
                </button>
                <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-center transition-colors">
                  <Calendar className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Schedule</span>
                </button>
                <button className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg text-center transition-colors">
                  <Target className="w-5 h-5 mx-auto mb-2 text-rose-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Set Goal</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
