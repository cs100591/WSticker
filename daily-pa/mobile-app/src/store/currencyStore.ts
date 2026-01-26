import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CurrencyStore {
    currency: string;
    setCurrency: (currency: string) => void;
    getSymbol: () => string;
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥', // or 元
    CAD: 'C$',
    AUD: 'A$',
    MYR: 'RM',
    SGD: 'S$',
    IDR: 'Rp',
    THB: '฿',
    VND: '₫',
    PHP: '₱',
    INR: '₹',
    KRW: '₩',
};

export const useCurrencyStore = create<CurrencyStore>()(
    persist(
        (set, get) => ({
            currency: 'USD',
            setCurrency: (currency) => set({ currency }),
            getSymbol: () => currencySymbols[get().currency] || get().currency,
        }),
        {
            name: 'daily-pa-currency',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
