/**
 * Expenses Screen
 * Matches web app layout with monthly spending card, category breakdown, and transaction history
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useLanguageStore, translations } from '@/store/languageStore';
import { useCurrencyStore } from '@/store/currencyStore';

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
  const lang = useLanguageStore((state) => state.getEffectiveLanguage());
  const t = translations[lang];
  const currencySymbol = useCurrencyStore((state) => state.getSymbol());

  const expenses = useLocalStore((state) => state.expenses);
  const setExpenses = useLocalStore((state) => state.setExpenses);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState<string>('mock-user-id');

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

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  useEffect(() => {
    // Calculate summary from expenses whenever expenses change
    if (expenses.length > 0) {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
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

      expenses.forEach(e => {
        categoryTotals[e.category] += e.amount;
      });

      const amounts = expenses.map(e => e.amount);
      setSummary({
        total,
        count: expenses.length,
        average: total / expenses.length,
        highest: Math.max(...amounts),
        lowest: Math.min(...amounts),
        currency: 'USD',
        byCategory: categoryTotals,
      });
    }
  }, [expenses]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const fetchedExpenses = await expenseService.getExpenses({
        userId,
        sortBy: 'expenseDate',
        sortOrder: 'desc',
      });

      // If no expenses, add mock data for preview
      if (fetchedExpenses.length === 0) {
        const mockExpenses = [
          {
            id: 'mock-1',
            userId,
            amount: 45.50,
            category: 'food' as ExpenseCategory,
            description: 'Lunch at cafe',
            expenseDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currency: 'USD',
            tags: [],
            isDeleted: false,
          },
          {
            id: 'mock-2',
            userId,
            amount: 120.00,
            category: 'shopping' as ExpenseCategory,
            description: 'New shoes',
            expenseDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currency: 'USD',
            tags: [],
            isDeleted: false,
          },
          {
            id: 'mock-3',
            userId,
            amount: 25.00,
            category: 'transport' as ExpenseCategory,
            description: 'Taxi ride',
            expenseDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currency: 'USD',
            tags: [],
            isDeleted: false,
          },
          {
            id: 'mock-4',
            userId,
            amount: 80.00,
            category: 'entertainment' as ExpenseCategory,
            description: 'Movie tickets',
            expenseDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currency: 'USD',
            tags: [],
            isDeleted: false,
          },
        ] as Expense[];
        setExpenses(mockExpenses);
      } else {
        setExpenses(fetchedExpenses);
      }
    } catch (error) {
      // On error, show mock data for preview
      console.log('Using mock data for preview');
      const mockExpenses = [
        {
          id: 'mock-1',
          userId,
          amount: 45.50,
          category: 'food' as ExpenseCategory,
          description: 'Lunch at cafe',
          expenseDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currency: 'USD',
          tags: [],
          isDeleted: false,
        },
        {
          id: 'mock-2',
          userId,
          amount: 120.00,
          category: 'shopping' as ExpenseCategory,
          description: 'New shoes',
          expenseDate: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currency: 'USD',
          tags: [],
          isDeleted: false,
        },
        {
          id: 'mock-3',
          userId,
          amount: 25.00,
          category: 'transport' as ExpenseCategory,
          description: 'Taxi ride',
          expenseDate: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currency: 'USD',
          tags: [],
          isDeleted: false,
        },
        {
          id: 'mock-4',
          userId,
          amount: 80.00,
          category: 'entertainment' as ExpenseCategory,
          description: 'Movie tickets',
          expenseDate: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currency: 'USD',
          tags: [],
          isDeleted: false,
        },
      ] as Expense[];
      setExpenses(mockExpenses);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleDelete = async (expenseId: string) => {
    Alert.alert(t.delete, t.confirmDelete, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseService.deleteExpense(expenseId);
            await loadExpenses();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
            console.error('Error deleting expense:', error);
          }
        },
      },
    ]);
  };

  const handleAddExpense = async (data: any) => {
    try {
      await expenseService.createExpense({
        userId,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        description: data.description,
        expenseDate: data.expenseDate,
      });
      setShowAddModal(false);
      await loadExpenses();
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      // Add to local state for preview mode
      const newExpense = {
        id: `local-${Date.now()}`,
        userId,
        amount: data.amount,
        category: data.category,
        description: data.description || 'No description',
        expenseDate: typeof data.expenseDate === 'string' ? data.expenseDate : new Date(data.expenseDate).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currency: data.currency || 'USD',
        tags: [],
        isDeleted: false,
      } as Expense;
      setExpenses([newExpense, ...expenses]);
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added locally (preview mode)');
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

    expenses.forEach(expense => {
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

    expenses.forEach(expense => {
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Home Button */}
      <ScreenHeader
        title={t.expenses}
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
        {/* Monthly Spending Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.monthlySpend}</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(summary?.total || 0)}
          </Text>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>↓ 12%</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.byCategory}</Text>
            <View style={styles.categoryGrid}>
              {categoryStats.map(stat => {
                const colors = categoryColors[stat.category];
                return (
                  <View key={stat.category} style={styles.categoryCard}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name={categoryIconNames[stat.category]} size={26} color={colors.text} />
                    </View>
                    <Text style={styles.categoryLabel}>
                      {(t as any)[stat.category]}
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
          <Text style={styles.sectionTitle}>{t.transactionHistory}</Text>
          {groupedExpenses.length > 0 ? (
            groupedExpenses.map(([date, dateExpenses]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{date}</Text>
                {dateExpenses.map(expense => {
                  const colors = categoryColors[expense.category];
                  return (
                    <View key={expense.id} style={styles.expenseItem}>
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
                          {expense.description || 'No description'}
                        </Text>
                        <Text style={styles.expenseCategory}>
                          {(t as any)[expense.category]}
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
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noExpenses}</Text>
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
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close-outline" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ExpenseForm
            onSubmit={handleAddExpense}
            onCancel={() => setShowAddModal(false)}
            submitLabel="Add Expense"
          />
        </View>
      </Modal>
    </View>
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
});
