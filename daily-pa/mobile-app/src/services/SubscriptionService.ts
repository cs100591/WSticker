/**
 * RevenueCat Subscription Service
 * Handles all subscription-related operations for CLASP Pro
 * Includes 10-day free grace period logic
 */

import Purchases, {
    CustomerInfo,
    PurchasesPackage,
    PurchasesOffering,
    LOG_LEVEL,
    PURCHASES_ERROR_CODE,
    PurchasesError,
} from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// RevenueCat API key
const API_KEY = 'test_lzRwqmkMrzXRpBGBWDVyKUrRRuO';

// Entitlement identifier
export const ENTITLEMENT_ID = 'CLASP Pro';

// Storage keys
const STORAGE_KEY_FIRST_INSTALL = 'clasp_first_install_date';

// Configuration
const GRACE_PERIOD_DAYS = 10;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export const PRODUCT_IDS = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime',
} as const;

export type ProStatusSource = 'subscription' | 'grace_period' | 'none';

class SubscriptionService {
    private isInitialized = false;

    /**
     * Initialize RevenueCat SDK
     */
    async initialize(userId?: string): Promise<void> {
        if (this.isInitialized) return;

        // Temporary disable for testing
        console.log('[SubscriptionService] RevenueCat disabled for testing');
        return;

        /*
        try {
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            await Purchases.configure({
                apiKey: API_KEY,
                appUserID: userId || null,
            });

            // Initialize grace period if needed
            await this.checkFirstInstall();

            this.isInitialized = true;
            console.log('[SubscriptionService] Initialized successfully');
        } catch (error) {
            console.error('[SubscriptionService] Initialization error:', error);
            // Don't throw, let app continue with partial functionality
            // this.isInitialized remains false, so subsequent calls will check/retry or fail gracefully
        }
        */
    }

    /**
     * Initialize first install date for grace period
     */
    private async checkFirstInstall() {
        try {
            const existingDate = await AsyncStorage.getItem(STORAGE_KEY_FIRST_INSTALL);
            if (!existingDate) {
                const now = new Date().toISOString();
                await AsyncStorage.setItem(STORAGE_KEY_FIRST_INSTALL, now);
                console.log('[SubscriptionService] First install date set:', now);
            }
        } catch (error) {
            console.error('[SubscriptionService] Error checking first install:', error);
        }
    }

    /**
     * Check if user is within the 10-day grace period
     */
    async isInGracePeriod(): Promise<boolean> {
        try {
            const dateStr = await AsyncStorage.getItem(STORAGE_KEY_FIRST_INSTALL);
            if (!dateStr) return true; // Assume true if we can't read date (fail open)

            const firstInstallDate = new Date(dateStr).getTime();
            const now = new Date().getTime();
            const diff = now - firstInstallDate;

            return diff < GRACE_PERIOD_MS;
        } catch (error) {
            console.error('[SubscriptionService] Error checking grace period:', error);
            return false; // Fail closed on error to encourage purchase
        }
    }

    /**
     * Get remaining days in grace period
     */
    async getGracePeriodDaysRemaining(): Promise<number> {
        try {
            const dateStr = await AsyncStorage.getItem(STORAGE_KEY_FIRST_INSTALL);
            if (!dateStr) return 0;

            const firstInstallDate = new Date(dateStr).getTime();
            const now = new Date().getTime();
            const diff = now - firstInstallDate;

            if (diff >= GRACE_PERIOD_MS) return 0;

            const remainingMs = GRACE_PERIOD_MS - diff;
            return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        } catch (error) {
            return 0;
        }
    }

    async identify(userId: string): Promise<CustomerInfo | null> {
        if (!this.isInitialized) {
            await this.initialize(userId);
            return this.getCustomerInfo();
        }
        try {
            const { customerInfo } = await Purchases.logIn(userId);
            return customerInfo;
        } catch (error) {
            console.error('[SubscriptionService] Error identifying user:', error);
            return null;
        }
    }

    async logout(): Promise<void> {
        if (!this.isInitialized) return;
        try {
            await Purchases.logOut();
        } catch (error) {
            console.error('[SubscriptionService] Error logging out:', error);
        }
    }

    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (!this.isInitialized) return null;
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('[SubscriptionService] Error getting customer info:', error);
            return null;
        }
    }

    /**
     * Check if user has CLASP Pro entitlement OR is in grace period
     */
    async checkProStatus(): Promise<{ isPro: boolean; source: ProStatusSource }> {
        try {
            // 1. Check active subscription
            const customerInfo = await this.getCustomerInfo();
            const hasSubscription = customerInfo && typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';

            if (hasSubscription) {
                return { isPro: true, source: 'subscription' };
            }

            // 2. Check grace period
            const inGracePeriod = await this.isInGracePeriod();
            if (inGracePeriod) {
                return { isPro: true, source: 'grace_period' };
            }

            return { isPro: false, source: 'none' };
        } catch (error) {
            console.error('[SubscriptionService] Error checking pro status:', error);
            return { isPro: false, source: 'none' };
        }
    }

    async getOfferings(): Promise<PurchasesOffering | null> {
        if (!this.isInitialized) return null;
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current || null;
        } catch (error) {
            console.error('[SubscriptionService] Error fetching offerings:', error);
            return null;
        }
    }

    async purchasePackage(pack: PurchasesPackage): Promise<{
        success: boolean;
        customerInfo?: CustomerInfo;
        error?: string;
        cancelled?: boolean;
    }> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
            return { success: isPro, customerInfo };
        } catch (error) {
            const purchaseError = error as PurchasesError;
            if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                return { success: false, cancelled: true };
            }
            if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
                const customerInfo = await this.restorePurchases();
                return {
                    success: customerInfo !== null,
                    customerInfo: customerInfo || undefined,
                    error: 'Already purchased. Purchases restored.',
                };
            }
            return { success: false, error: purchaseError.message || 'Purchase failed' };
        }
    }

    async restorePurchases(): Promise<CustomerInfo | null> {
        if (!this.isInitialized) return null;
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('[SubscriptionService] Error restoring purchases:', error);
            return null;
        }
    }
}

export const subscriptionService = new SubscriptionService();
