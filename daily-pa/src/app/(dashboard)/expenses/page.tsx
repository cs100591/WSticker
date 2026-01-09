'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { Plus, Trash2, ShoppingBag, Utensils, Car, Gamepad2, MoreHorizontal, ArrowDownRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/expense';

const categoryIcons = {
  food: Utensils,
  shopping: ShoppingBag,
  transport: Car,
  entertainment: Gamepad2,
  bills: MoreHorizontal,
  health: MoreHorizontal,
  education: MoreHorizontal,
  other: MoreHorizontal,
};

const categoryGradients = {
  food: 'from-orange-500 to-red-500',
  shopping: 'from-pink-500 to-rose-500',
  transport: 'from-blue-500 to-cyan-500',
  entertainment: 'from-purple-500 to-violet-500',
  bills: 'from-amber-500 to-yellow-500',
  health: 'from-red-500 to-pink-500',
  education: 'from-indigo-500 to-blue-500',
  other: 'from-gray-500 to-slate-500',
};

export default function ExpensesPage() {
  const { t } = useI18n();
  const { expenses, isLoading, createExpense, deleteExpense } = useExpenses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'food' as ExpenseCategory, description: '' });

  const categories = [
    { id: 'food' as ExpenseCategory, label: t.expenses.categories.food },
    { id: 'shopping' as ExpenseCategory, label: t.expenses.categories.shopping },
    { id: 'transport' as ExpenseCategory, label: t.expenses.categories.transport },
    { id: 'entertainment' as ExpenseCategory, label: t.expenses.categories.entertainment },
    { id: 'other' as ExpenseCategory, label: t.expenses.categories.other },
  ];

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryStats = categories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat.id);
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { ...cat, total, count: catExpenses.length };
  }).filter((c) => c.total > 0);

  const getCategoryInfo = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return {
      label: cat?.label || t.expenses.categories.other,
      Icon: categoryIcons[categoryId as keyof typeof categoryIcons] || MoreHorizontal,
      gradient: categoryGradients[categoryId as keyof typeof categoryGradients] || 'from-gray-500 to-slate-500',
    };
  };

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await createExpense({
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description,
        expenseDate: today as string,
      });
      setNewExpense({ amount: '', category: 'food', description: '' });
      setShowAddForm(false);
    } catch {
      // Error handled in hook
    }
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toISOString().split('T')[0] ?? '';
  };

  const groupedExpenses = expenses.reduce((groups, expense) => {
    const date = formatDate(expense.expenseDate);
    if (!groups[date]) groups[date] = [];
    groups[date]?.push(expense);
    return groups;
  }, {} as Record<string, typeof expenses>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.expenses.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Summary Card */}
        <GlassCard className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/20" />
          <GlassCardContent className="relative">
            <p className="text-sm font-medium text-gray-600">{t.expenses.monthlySpending}</p>
            <p className="text-5xl font-bold text-gray-900 mt-2">${totalAmount.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                <ArrowDownRight className="w-3 h-3" />
                12% {t.expenses.lessThanLastMonth}
              </span>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Category Stats */}
        {categoryStats.length > 0 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.expenses.byCategory}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-3 gap-3">
                {categoryStats.map((cat) => {
                  const Icon = categoryIcons[cat.id as keyof typeof categoryIcons];
                  const getBorderColor = (id: string) => {
                    switch (id) {
                      case 'food': return 'border-orange-500';
                      case 'shopping': return 'border-pink-500';
                      case 'transport': return 'border-blue-500';
                      case 'entertainment': return 'border-purple-500';
                      default: return 'border-gray-400';
                    }
                  };
                  const getTextColor = (id: string) => {
                    switch (id) {
                      case 'food': return 'text-orange-500';
                      case 'shopping': return 'text-pink-500';
                      case 'transport': return 'text-blue-500';
                      case 'entertainment': return 'text-purple-500';
                      default: return 'text-gray-400';
                    }
                  };
                  return (
                    <div key={cat.id} className="flex flex-col items-center p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors">
                      <div className={cn('w-12 h-12 rounded-xl border-2 flex items-center justify-center', getBorderColor(cat.id))}>
                        <Icon className={cn('w-6 h-6', getTextColor(cat.id))} strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{cat.label}</p>
                      <p className="font-bold text-gray-900">${cat.total}</p>
                    </div>
                  );
                })}
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Add Button */}
        {!showAddForm && (
          <Button 
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.expenses.addExpense}
          </Button>
        )}

        {/* Add Form */}
        {showAddForm && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>{t.expenses.addExpense}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t.expenses.amount}</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="text-3xl font-bold h-16 rounded-xl bg-white/50 border-white/30"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t.expenses.category}</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const Icon = categoryIcons[cat.id as keyof typeof categoryIcons];
                    const isSelected = newExpense.category === cat.id;
                    const getBorderColor = (id: string) => {
                      switch (id) {
                        case 'food': return 'border-orange-500';
                        case 'shopping': return 'border-pink-500';
                        case 'transport': return 'border-blue-500';
                        case 'entertainment': return 'border-purple-500';
                        default: return 'border-gray-400';
                      }
                    };
                    const getTextColor = (id: string) => {
                      switch (id) {
                        case 'food': return 'text-orange-500';
                        case 'shopping': return 'text-pink-500';
                        case 'transport': return 'text-blue-500';
                        case 'entertainment': return 'text-purple-500';
                        default: return 'text-gray-400';
                      }
                    };
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                        className={cn(
                          'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200',
                          isSelected ? 'border-blue-500 bg-blue-50 scale-105' : 'border-white/30 bg-white/30 hover:bg-white/50'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-xl border-2 flex items-center justify-center', getBorderColor(cat.id))}>
                          <Icon className={cn('w-5 h-5', getTextColor(cat.id))} strokeWidth={1.5} />
                        </div>
                        <span className="text-xs mt-2 font-medium">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t.expenses.description}</label>
                <Input
                  placeholder={t.expenses.descriptionPlaceholder}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="h-12 rounded-xl bg-white/50 border-white/30"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setShowAddForm(false)}>
                  {t.expenses.cancel}
                </Button>
                <Button className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500" onClick={handleAddExpense}>
                  {t.expenses.save}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Expense List */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.expenses.transactionHistory}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No expenses yet</p>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date}>
                  <p className="text-sm font-medium text-gray-400 mb-2">{date}</p>
                  <div className="space-y-2">
                    {(groupedExpenses[date] ?? []).map((expense) => {
                      const { label, Icon } = getCategoryInfo(expense.category);
                      const getBorderColor = (cat: string) => {
                        switch (cat) {
                          case 'food': return 'border-orange-500';
                          case 'shopping': return 'border-pink-500';
                          case 'transport': return 'border-blue-500';
                          case 'entertainment': return 'border-purple-500';
                          default: return 'border-gray-400';
                        }
                      };
                      const getTextColor = (cat: string) => {
                        switch (cat) {
                          case 'food': return 'text-orange-500';
                          case 'shopping': return 'text-pink-500';
                          case 'transport': return 'text-blue-500';
                          case 'entertainment': return 'text-purple-500';
                          default: return 'text-gray-400';
                        }
                      };
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200"
                        >
                          <div className={cn('w-12 h-12 rounded-xl border-2 flex items-center justify-center', getBorderColor(expense.category))}>
                            <Icon className={cn('w-6 h-6', getTextColor(expense.category))} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                          </div>
                          <p className="font-bold text-red-500">-${expense.amount}</p>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
