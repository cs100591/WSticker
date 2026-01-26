/**
 * Expenses Screen
 * Matches web app layout with monthly spending card, category breakdown, and transaction history
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, ExpenseCategory } from '@/models';
import { expenseService, ExpenseSummary } from '@/services/ExpenseService';
import { ExpenseForm } from '@/components/ExpenseForm';
import { supabase } from '@/services/supabase';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLocalStore } from '@/store/localStore';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useBudgetStore } from '@/store/budgetStore';
import { TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';

const categoryIconNames: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food-outline',
  transport: 'car-outline',
  shopping: 'bag-outline',
  entertainment: 'game-controller-outline',
  bills: 'document-text-outline',
  health: 'medical-outline',
  education: 'school-outline',
  other: 'cube-outline',
};

const categoryColors: Record<ExpenseCategory, { border: string; text: string }> = {
  food: { border: '#F97316', text: '#EA580C' },
  shopping: { border: '#EC4899', text: '#DB2777' },
  transport: { border: '#3B82F6', text: '#2563EB' },
  entertainment: { border: '#A855F7', text: '#9333EA' },
  bills: { border: '#F59E0B', text: '#D97706' },
  health: { border: '#EF4444', text: '#DC2626' },
  education: { border: '#6366F1', text: '#4F46E5' },
  other: { border: '#6B7280', text: '#4B5563' },
};

export const ExpensesScreen: React.FC = React.memo(() => {
  const lang = useEffectiveLanguage();
  const t = translations[lang];
  const currencySymbol = useCurrencyStore((state) => state.getSymbol());
  const { mode } = useThemeStore();
  const isSage = mode === 'sage';
  const isBlueSage = mode === 'system';
  const isGlassy = mode !== 'minimal';
  const gradient = useMemo(() => {
    switch (mode) {
      case 'sage': return ['#C3E0D8', '#D6E8E2', '#F9F6F0'];
      case 'sunset': return ['#FECDD3', '#FFE4E6', '#FFF5F5'];
      case 'ocean': return ['#BAE6FD', '#E0F2FE', '#F0F9FF'];
      default: return ['#E0F2FE', '#DBEAFE', '#EFF6FF'];
    }
  }, [mode]);

  // Read directly from Zustand store for reactive updates
  const expenses = useLocalStore((state) => state.expenses);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Current month view

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (e.isDeleted) return false;
      const eDate = new Date(e.expenseDate);
      return eDate.getMonth() === selectedDate.getMonth() &&
        eDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [expenses, selectedDate]);

  const isHydrated = useLocalStore((state) => state.isHydrated);

  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [userId, setUserId] = useState<string>('offline-user-device');

  const { budgets, setBudget, getBudget } = useBudgetStore();
  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const currentBudget = getBudget(monthKey);

  // Get actual user ID from Supabase session
  useEffect(() => {
    const getUserId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.log('Using mock user ID');
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    // Calculate summary from filtered expenses
    if (filteredExpenses.length >= 0) {
      const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      const categoryTotals: Record<ExpenseCategory, number> = {
        food: 0,
        transport: 0,
        shopping: 0,
        entertainment: 0,
        bills: 0,
        health: 0,
        education: 0,
        other: 0,
      };

      filteredExpenses.forEach(e => {
        categoryTotals[e.category] += e.amount;
      });

      const amounts = filteredExpenses.map(e => e.amount);
      setSummary({
        total,
        count: filteredExpenses.length,
        average: filteredExpenses.length > 0 ? total / filteredExpenses.length : 0,
        highest: amounts.length > 0 ? Math.max(...amounts) : 0,
        lowest: amounts.length > 0 ? Math.min(...amounts) : 0,
        currency: 'USD',
        byCategory: categoryTotals,
      });
    }
  }, [filteredExpenses]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Just trigger a re-render since we're reading from store
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleDelete = async (expenseId: string) => {
    Alert.alert(t.delete, t.confirmDeleteMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseService.deleteExpense(expenseId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
            console.error('Error deleting expense:', error);
          }
        },
      },
    ]);
  };

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleCreateOrUpdateExpense = async (data: any) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, {
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          description: data.description,
          merchant: data.merchant,
          expenseDate: data.expenseDate,
        });
        Alert.alert('Success', 'Expense updated successfully!');
      } else {
        await expenseService.createExpense({
          userId,
          amount: data.amount,
          currency: data.currency,
          category: data.category,
          description: data.description,
          merchant: data.merchant,
          expenseDate: data.expenseDate,
        });
        Alert.alert('Success', 'Expense added successfully!');
      }
      setShowAddModal(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toFixed(0)}`;
  };

  const getCategoryStats = () => {
    const stats: Record<ExpenseCategory, { total: number; count: number }> = {
      food: { total: 0, count: 0 },
      transport: { total: 0, count: 0 },
      shopping: { total: 0, count: 0 },
      entertainment: { total: 0, count: 0 },
      bills: { total: 0, count: 0 },
      health: { total: 0, count: 0 },
      education: { total: 0, count: 0 },
      other: { total: 0, count: 0 },
    };

    filteredExpenses.forEach(expense => {
      stats[expense.category].total += expense.amount;
      stats[expense.category].count += 1;
    });

    return Object.entries(stats)
      .filter(([_, data]) => data.total > 0)
      .map(([category, data]) => ({
        category: category as ExpenseCategory,
        ...data,
      }));
  };

  const groupExpensesByDate = () => {
    const groups: Record<string, Expense[]> = {};

    filteredExpenses.forEach(expense => {
      const date = new Date(expense.expenseDate).toISOString().split('T')[0] || '';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date]?.push(expense);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  const categoryStats = getCategoryStats();
  const groupedExpenses = groupExpensesByDate();

  if (!isHydrated) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const Container = isGlassy ? LinearGradient : View;
  // @ts-ignore - LinearGradient props vs View props type mismatch is handled by runtime check or we cast
  const containerProps = isGlassy ? {
    colors: gradient as any,
    style: styles.container
  } : {
    style: styles.container
  };

  return (
    <Container {...(containerProps as any)}>
      {/* Header with Home Button */}
      <ScreenHeader
        title={t.expenses}
        style={isGlassy ? { backgroundColor: 'transparent', borderBottomWidth: 0, paddingTop: 60 } : undefined}
        rightContent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ {t.add}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setSelectedDate(newDate);
          }}>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>

          <TouchableOpacity onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setSelectedDate(newDate);
          }}>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Monthly Spending & Budget Card */}
        <View style={[
          styles.summaryCard,
          isGlassy && {
            borderRadius: 24,
            shadowColor: 'rgba(0,0,0,0.05)',
            shadowOpacity: 1,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 10 },
            borderWidth: 0,
            backgroundColor: '#FFF' // Ensure white bg
          }
        ]}>
          <Text style={styles.summaryLabel}>{t.monthlySpend}</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(summary?.total || 0)}
          </Text>

          {/* Budget Section */}
          <View style={styles.budgetContainer}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>
                {t.budget}: {currentBudget > 0 ? formatCurrency(currentBudget) : t.setBudget || 'Set Budget'}
              </Text>
              <TouchableOpacity onPress={() => {
                setNewBudget(currentBudget > 0 ? currentBudget.toString() : '');
                setShowBudgetModal(true);
              }}>
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {currentBudget > 0 && (
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(((summary?.total || 0) / currentBudget) * 100, 100)}%`,
                      backgroundColor: (summary?.total || 0) > currentBudget ? '#EF4444' : '#10B981'
                    }
                  ]}
                />
              </View>
            )}
            {currentBudget > 0 && (
              <Text style={[styles.budgetStatus, { color: (summary?.total || 0) > currentBudget ? '#EF4444' : '#64748B' }]}>
                {(summary?.total || 0) > currentBudget ? 'Over Budget' : `${Math.round(((summary?.total || 0) / currentBudget) * 100)}% Used`}
              </Text>
            )}
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.byCategory || 'By Category'}</Text>
            <View style={styles.categoryGrid}>
              {categoryStats.map(stat => {
                const colors = categoryColors[stat.category];
                return (
                  <View key={stat.category} style={[
                    styles.categoryCard,
                    isGlassy && { borderRadius: 20, borderWidth: 0, shadowColor: 'rgba(0,0,0,0.03)', shadowOpacity: 1, shadowRadius: 10 }
                  ]}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name={categoryIconNames[stat.category]} size={26} color={colors.text} />
                    </View>
                    <Text style={styles.categoryLabel}>
                      {(t as any)[stat.category] || stat.category}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(stat.total)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.transactionHistory || 'Transaction History'}</Text>
          {groupedExpenses.length > 0 ? (
            groupedExpenses.map(([date, dateExpenses]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{date}</Text>
                {dateExpenses.map(expense => {
                  const colors = categoryColors[expense.category];
                  return (
                    <TouchableOpacity key={expense.id} onPress={() => handleEditExpense(expense)}>
                      <View style={[
                        styles.expenseItem,
                        isGlassy && { borderRadius: 20, borderWidth: 0, shadowColor: 'rgba(0,0,0,0.03)', shadowOpacity: 1, shadowRadius: 10 }
                      ]}>
                        <View
                          style={[
                            styles.expenseIcon,
                            { borderColor: colors.border },
                          ]}
                        >
                          <Ionicons name={categoryIconNames[expense.category]} size={26} color={colors.text} />
                        </View>
                        <View style={styles.expenseDetails}>
                          <Text style={styles.expenseDescription}>
                            {expense.merchant || expense.description || 'No description'}
                          </Text>
                          {!!expense.merchant && !!expense.description && (
                            <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 2 }}>
                              {expense.description}
                            </Text>
                          )}
                          <Text style={styles.expenseCategory}>
                            {(t as any)[expense.category] || expense.category}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>
                          -{formatCurrency(expense.amount)}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(expense.id)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noExpenses || 'No expenses recorded'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.add} {t.expenseItem || 'Expense'}</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close-outline" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ExpenseForm
            initialData={editingExpense ? {
              amount: editingExpense.amount,
              currency: editingExpense.currency,
              category: editingExpense.category,
              description: editingExpense.description,
              merchant: editingExpense.merchant,
              expenseDate: new Date(editingExpense.expenseDate),
            } : undefined}
            onSubmit={handleCreateOrUpdateExpense}
            onCancel={() => {
              setShowAddModal(false);
              setEditingExpense(null);
            }}
            submitLabel={editingExpense ? t.save : t.add}
          />
        </View>
      </Modal>

      {/* Budget Edit Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.budgetModalOverlay}>
          <View style={styles.budgetModalContent}>
            <Text style={styles.budgetModalTitle}>{t.setBudget || 'Set Monthly Budget'}</Text>
            <Text style={styles.budgetModalSubtitle}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>

            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Enter amount"
              value={newBudget}
              onChangeText={setNewBudget}
              autoFocus
            />

            <View style={styles.budgetButtons}>
              <TouchableOpacity
                style={[styles.budgetBtn, styles.budgetBtnCancel]}
                onPress={() => setShowBudgetModal(false)}
              >
                <Text style={styles.budgetBtnTextCancel}>{t.cancel || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.budgetBtn, styles.budgetBtnSave]}
                onPress={() => {
                  const amount = parseFloat(newBudget);
                  if (!isNaN(amount)) {
                    setBudget(monthKey, amount);
                  }
                  setShowBudgetModal(false);
                }}
              >
                <Text style={styles.budgetBtnTextSave}>{t.save || 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Container>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 56,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  summaryBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 20,
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  categoryCard: {
    width: '30%',
    backgroundColor: '#fff',
    margin: '1.5%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconText: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 5,
  },
  categoryAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateGroup: {
    marginBottom: 18,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  expenseIconText: {
    fontSize: 26,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 5,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748B',
  },
  expenseAmount: {
    fontSize: 19,
    fontWeight: '700',
    color: '#EF4444',
    marginRight: 14,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 10,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#64748B',
    fontWeight: '300',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  budgetContainer: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'right',
  },
  budgetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  budgetModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  budgetModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  budgetModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  budgetInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  budgetButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  budgetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  budgetBtnSave: {
    backgroundColor: '#3B82F6',
  },
  budgetBtnTextCancel: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  budgetBtnTextSave: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
