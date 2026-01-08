'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoPriority } from '@/types/todo';

const priorityConfig = {
  high: { badge: '🔴', label: '高', bgLight: 'bg-red-100', textColor: 'text-red-700' },
  medium: { badge: '🟠', label: '中', bgLight: 'bg-orange-100', textColor: 'text-orange-700' },
  low: { badge: '🔵', label: '低', bgLight: 'bg-blue-100', textColor: 'text-blue-700' },
};

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
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { todos, isLoading, createTodo, toggleTodo } = useTodos({});

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      await createTodo({ 
        title: newTodo.trim(), 
        priority: selectedPriority,
        color: 'yellow'
      });
      setNewTodo('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group todos by priority and status
  const activeTodos = todos.filter(t => t.status === 'active');
  const completedTodos = todos.filter(t => t.status === 'completed');
  
  const todosByPriority = {
    high: activeTodos.filter(t => t.priority === 'high'),
    medium: activeTodos.filter(t => t.priority === 'medium'),
    low: activeTodos.filter(t => t.priority === 'low'),
  };

  const totalActive = activeTodos.length;
  const totalCompleted = completedTodos.length;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Mobile Header - Only on mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700">
          <span>📋</span>
          <span>{totalActive}/{totalActive + totalCompleted}</span>
        </div>
        <button 
          onClick={() => inputRef.current?.focus()}
          className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg"
        >
          +
        </button>
      </div>

      {/* Desktop Header - Only on desktop */}
      <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">{locale === 'zh' ? '待办事项' : 'Todos'}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-700">
            <span>📋</span>
            <span>{totalActive}/{totalActive + totalCompleted}</span>
          </div>
        </div>
      </div>

      {/* Title - Mobile only */}
      <div className="md:hidden text-center py-4 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">{locale === 'zh' ? '待办事项' : 'Todos'}</h1>
      </div>

      {/* Desktop Add Form - Only on desktop */}
      <form onSubmit={handleAddTodo} className="hidden md:block px-8 py-4 border-b border-gray-100 bg-white space-y-3">
        <div className="flex gap-3 max-w-2xl">
          <Input
            ref={inputRef}
            placeholder={t.todos.addPlaceholder}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-sm"
          />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="high">{priorityConfig.high.label}</option>
            <option value="medium">{priorityConfig.medium.label}</option>
            <option value="low">{priorityConfig.low.label}</option>
          </select>
          <Button 
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="md:max-w-4xl md:mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">⏳</div>
            </div>
          ) : (
            <div className="space-y-0">
              {/* High Priority */}
              {todosByPriority.high.length > 0 && (
                <PriorityGroup
                  priority="high"
                  todos={todosByPriority.high}
                  isExpanded={expandedGroups.high ?? true}
                  onToggleExpand={() => toggleGroup('high')}
                  onToggleTodo={handleToggle}
                />
              )}

              {/* Medium Priority */}
              {todosByPriority.medium.length > 0 && (
                <PriorityGroup
                  priority="medium"
                  todos={todosByPriority.medium}
                  isExpanded={expandedGroups.medium ?? true}
                  onToggleExpand={() => toggleGroup('medium')}
                  onToggleTodo={handleToggle}
                />
              )}

              {/* Low Priority */}
              {todosByPriority.low.length > 0 && (
                <PriorityGroup
                  priority="low"
                  todos={todosByPriority.low}
                  isExpanded={expandedGroups.low ?? true}
                  onToggleExpand={() => toggleGroup('low')}
                  onToggleTodo={handleToggle}
                />
              )}

              {/* Completed Section */}
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
                        <TodoItemRow key={todo.id} todo={todo} onToggle={handleToggle} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {totalActive === 0 && totalCompleted === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>{t.todos.noTasks}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Add Todo Form - Fixed at bottom, mobile only */}
      <form onSubmit={handleAddTodo} className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={t.todos.addPlaceholder}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-gray-300 text-sm"
          />
          <Button 
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="high">{priorityConfig.high.label}</option>
            <option value="medium">{priorityConfig.medium.label}</option>
            <option value="low">{priorityConfig.low.label}</option>
          </select>
        </div>
      </form>
    </div>
  );
}

function PriorityGroup({ 
  priority, 
  todos, 
  isExpanded, 
  onToggleExpand, 
  onToggleTodo 
}: { 
  priority: TodoPriority; 
  todos: any[]; 
  isExpanded: boolean; 
  onToggleExpand: () => void; 
  onToggleTodo: (id: string) => void;
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
          <span className="text-xs opacity-60">+</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="space-y-0 border-t border-gray-100">
          {todos.map(todo => (
            <TodoItemRow key={todo.id} todo={todo} onToggle={onToggleTodo} />
          ))}
        </div>
      )}
    </div>
  );
}

function TodoItemRow({ 
  todo, 
  onToggle 
}: { 
  todo: any; 
  onToggle: (id: string) => void;
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
      
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
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
  );
}
