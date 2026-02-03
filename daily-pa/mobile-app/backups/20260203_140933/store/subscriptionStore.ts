/**
 * Subscription Store - Zustand state management for subscription status
 */

import { create } from 'zustand';
import { CustomerInfo } from 'react-native-purchases';
import { subscriptionService, ENTITLEMENT_ID, ProStatusSource } from '@/services/SubscriptionService';

interface SubscriptionState {
    // State
    isPro: boolean;
    proSource: ProStatusSource;
    remainingGraceDays: number;
    isLoading: boolean;
    customerInfo: CustomerInfo | null;
    error: string | null;

    // Actions
    initialize: (userId?: string) => Promise<void>;
    checkSubscription: () => Promise<boolean>;
    refreshCustomerInfo: () => Promise<void>;
    restorePurchases: () => Promise<boolean>;
    reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    // Initial state
    isPro: false,
    proSource: 'none',
    remainingGraceDays: 0,
    isLoading: false,
    customerInfo: null,
    error: null,

    // Initialize subscription service
    initialize: async (userId?: string) => {
        set({ isLoading: true, error: null });
        try {
            await subscriptionService.initialize(userId);
            await get().checkSubscription();
        } catch (error) {
            set({ error: 'Failed to initialize subscription service' });
        } finally {
            set({ isLoading: false });
        }
    },

    // Check if user has CLASP Pro
    checkSubscription: async () => {
        try {
            // Check pro status (subscription OR grace period)
            const { isPro, source } = await subscriptionService.checkProStatus();
            const customerInfo = await subscriptionService.getCustomerInfo();
            const remainingGraceDays = await subscriptionService.getGracePeriodDaysRemaining();

            set({
                isPro,
                proSource: source,
                customerInfo,
                remainingGraceDays
            });
            return isPro;
        } catch (error) {
            set({ error: 'Failed to check subscription status' });
            return false;
        }
    },

    // Refresh customer info
    refreshCustomerInfo: async () => {
        set({ isLoading: true });
        try {
            await get().checkSubscription();
        } finally {
            set({ isLoading: false });
        }
    },

    // Restore purchases
    restorePurchases: async () => {
        set({ isLoading: true, error: null });
        try {
            const customerInfo = await subscriptionService.restorePurchases();
            if (!customerInfo) {
                set({ isLoading: false, error: 'No purchases to restore' });
                return false;
            }

            // Re-check status after restore
            return await get().checkSubscription();
        } catch (error) {
            set({ isLoading: false, error: 'Failed to restore purchases' });
            return false;
        }
    },

    // Reset state (on logout)
    reset: () => {
        set({
            isPro: false,
            proSource: 'none',
            remainingGraceDays: 0,
            isLoading: false,
            customerInfo: null,
            error: null,
        });
    },
}));
