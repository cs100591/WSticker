'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoPriority } from '@/types/todo';

const priorityConfig = {
  high: { badge: '🔴', label: '高', bgLight: 'bg-red-100', textColor: 'text-red-700' },
  medium: { badge: '🟠', label: '中', bgLight: 'bg-orange-100', textColor: 'text-orange-700' },
  low: { badge: '🔵', label: '低', bgLight: 'bg-blue-100', textColor: 'text-blue-700' },
};

interface CalendarModalProps {
  todo: { id: string; title: string };
  onClose: () => void;
  onConfirm: (todoId: string, date: string, time: string) => void;
  locale: string;
}

function AddToCalendarModal({ todo, onClose, onConfirm, locale }: CalendarModalProps) {
  const today = new Date().toISOString().split('T')[0] || '';
  const now = new Date().toTimeString().slice(0, 5);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(now);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onConfirm(todo.id, date, time);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {locale === 'zh' ? '添加到日历' : 'Add to Calendar'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{todo.title}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'zh' ? '日期' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {locale === 'zh' ? '时间' : 'Time'}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? '...' : (locale === 'zh' ? '确认' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TodosPage() {
  const { t, locale } = useI18n();
  const [newTodo, setNewTodo] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>('medium');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    high: true,
    medium: true,
    low: true,
    completed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarModal, setCalendarModal] = useState<{ id: string; title: string } | null>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  
  const { todos, isLoading, createTodo, toggleTodo } = useTodos({});

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createTodo({ 
        title: newTodo.trim(), 
        priority: selectedPriority,
        color: 'yellow'
      });
      setNewTodo('');
      desktopInputRef.current?.focus();
      mobileInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleAddToCalendar = (todo: { id: string; title: string }) => {
    setCalendarModal(todo);
  };

  const handleCalendarConfirm = async (todoId: string, date: string, time: string) => {
    try {
      const startTime = `${date}T${time}:00`;
      const endDate = new Date(`${date}T${time}:00`);
      endDate.setHours(endDate.getHours() + 1);
      const endTime = endDate.toISOString().slice(0, 19);
      
      const todo = todos.find(t => t.id === todoId);
      
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: todo?.title || 'Todo Reminder',
          description: `Reminder for: ${todo?.title}`,
          startTime,
          endTime,
          allDay: false,
          color: '#3B82F6',
        }),
      });
      
      setCalendarModal(null);
    } catch (error) {
      console.error('Failed to add to calendar:', error);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const activeTodos = todos.filter(t => t.status === 'active');
  const completedTodos = todos.filter(t => t.status === 'completed');
  
  const todosByPriority = {
    high: activeTodos.filter(t => t.priority === 'high'),
    medium: activeTodos.filter(t => t.priority === 'medium'),
    low: activeTodos.filter(t => t.priority === 'low'),
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-bold text-gray-900">{locale === 'zh' ? '待办事项' : 'Todos'}</h1>
        <button 
          type="button"
          onClick={() => mobileInputRef.current?.focus()}
          className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg"
        >
          +
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{locale === 'zh' ? '待办事项' : 'Todos'}</h1>
      </div>

      {/* Desktop Add Form */}
      <form onSubmit={handleAddTodo} className="hidden md:block px-8 py-4 border-b border-gray-100 bg-white">
        <div className="flex gap-3 max-w-2xl">
          <Input
            ref={desktopInputRef}
            placeholder={t.todos.addPlaceholder}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-sm"
            disabled={isSubmitting}
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            disabled={isSubmitting}
          >
            <option value="high">{priorityConfig.high.label}</option>
            <option value="medium">{priorityConfig.medium.label}</option>
            <option value="low">{priorityConfig.low.label}</option>
          </select>
          <Button 
            type="submit"
            size="icon"
            disabled={isSubmitting || !newTodo.trim()}
            className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? '...' : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">⏳</div>
            </div>
          ) : (
            <div className="space-y-0">
              {todosByPriority.high.length > 0 && (
                <PriorityGroup
                  priority="high"
                  todos={todosByPriority.high}
                  isExpanded={expandedGroups.high ?? true}
                  onToggleExpand={() => toggleGroup('high')}
                  onToggleTodo={handleToggle}
                  onAddToCalendar={handleAddToCalendar}
                />
              )}

              {todosByPriority.medium.length > 0 && (
                <PriorityGroup
                  priority="medium"
                  todos={todosByPriority.medium}
                  isExpanded={expandedGroups.medium ?? true}
                  onToggleExpand={() => toggleGroup('medium')}
                  onToggleTodo={handleToggle}
                  onAddToCalendar={handleAddToCalendar}
                />
              )}

              {todosByPriority.low.length > 0 && (
                <PriorityGroup
                  priority="low"
                  todos={todosByPriority.low}
                  isExpanded={expandedGroups.low ?? true}
                  onToggleExpand={() => toggleGroup('low')}
                  onToggleTodo={handleToggle}
                  onAddToCalendar={handleAddToCalendar}
                />
              )}

              {completedTodos.length > 0 && (
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleGroup('completed')}
                    className="w-full px-4 md:px-8 py-3 flex items-center justify-between text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100"
                  >
                    <span>{locale === 'zh' ? '已完成' : 'Completed'} ({completedTodos.length})</span>
                    {expandedGroups.completed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroups.completed && (
                    <div className="space-y-0 border-t border-gray-100">
                      {completedTodos.map(todo => (
                        <TodoItemRow 
                          key={todo.id} 
                          todo={todo} 
                          onToggle={handleToggle}
                          onAddToCalendar={handleAddToCalendar}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTodos.length === 0 && completedTodos.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>{t.todos.noTasks}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Add Form */}
      <form onSubmit={handleAddTodo} className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            ref={mobileInputRef}
            placeholder={t.todos.addPlaceholder}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-sm"
            disabled={isSubmitting}
          />
          <Button 
            type="submit"
            size="icon"
            disabled={isSubmitting || !newTodo.trim()}
            className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? '...' : <Plus className="w-4 h-4" />}
          </Button>
        </div>
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          disabled={isSubmitting}
        >
          <option value="high">{priorityConfig.high.label}</option>
          <option value="medium">{priorityConfig.medium.label}</option>
          <option value="low">{priorityConfig.low.label}</option>
        </select>
      </form>

      {/* Calendar Modal */}
      {calendarModal && (
        <AddToCalendarModal
          todo={calendarModal}
          onClose={() => setCalendarModal(null)}
          onConfirm={handleCalendarConfirm}
          locale={locale}
        />
      )}
    </div>
  );
}


function PriorityGroup({ 
  priority, 
  todos, 
  isExpanded, 
  onToggleExpand, 
  onToggleTodo,
  onAddToCalendar,
}: { 
  priority: TodoPriority; 
  todos: any[]; 
  isExpanded: boolean; 
  onToggleExpand: () => void; 
  onToggleTodo: (id: string) => void;
  onAddToCalendar: (todo: { id: string; title: string }) => void;
}) {
  const config = priorityConfig[priority];
  
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggleExpand}
        className={cn(
          'w-full px-4 md:px-8 py-3 flex items-center justify-between text-sm font-semibold',
          config.bgLight,
          config.textColor
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.badge}</span>
          <span>{config.label} ({todos.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-0 border-t border-gray-100">
          {todos.map(todo => (
            <TodoItemRow 
              key={todo.id} 
              todo={todo} 
              onToggle={onToggleTodo}
              onAddToCalendar={onAddToCalendar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TodoItemRow({ 
  todo, 
  onToggle,
  onAddToCalendar,
}: { 
  todo: any; 
  onToggle: (id: string) => void;
  onAddToCalendar: (todo: { id: string; title: string }) => void;
}) {
  return (
    <div className="px-4 md:px-8 py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
        )}>
          {todo.title}
        </p>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {/* Add to Calendar Button */}
        {todo.status !== 'completed' && (
          <button
            onClick={() => onAddToCalendar({ id: todo.id, title: todo.title })}
            className="p-1.5 hover:bg-blue-100 rounded-full transition-colors"
            title="Add to calendar"
          >
            <Calendar className="w-4 h-4 text-blue-500" />
          </button>
        )}
        
        {/* Toggle Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold',
            todo.status === 'completed' 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300'
          )}>
            {todo.status === 'completed' && '✓'}
          </div>
        </button>
      </div>
    </div>
  );
}
