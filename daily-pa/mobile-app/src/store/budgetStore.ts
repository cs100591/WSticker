import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BudgetState {
    budgets: Record<string, number>; // Format: "YYYY-MM": amount
    setBudget: (monthKey: string, amount: number) => void;
    getBudget: (monthKey: string) => number;
}

export const useBudgetStore = create<BudgetState>()(
    persist(
        (set, get) => ({
            budgets: {},
            setBudget: (monthKey, amount) =>
                set((state) => ({
                    budgets: { ...state.budgets, [monthKey]: amount },
                })),
            getBudget: (monthKey) => get().budgets[monthKey] || 0,
        }),
        {
            name: 'budget-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
