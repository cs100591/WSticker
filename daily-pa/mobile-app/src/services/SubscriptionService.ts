// import Purchases, { PurchasesPackage, PurchasesOffering } from 'react-native-purchases';
// MOCK for Build (remove when re-enabling IAP)
const Purchases = {
    configure: () => { },
    logIn: async () => { },
    logOut: async () => { },
    getOfferings: async () => ({ current: { availablePackages: [] } }),
    purchasePackage: async () => ({ customerInfo: { entitlements: { active: {} } } }),
    getCustomerInfo: async () => ({ entitlements: { active: {} } }),
    restorePurchases: async () => ({ entitlements: { active: {} } }),
};
type PurchasesPackage = any;
type PurchasesOffering = any;
import { Platform } from 'react-native';

// Keys from RevenueCat Dashboard
const API_KEYS = {
    apple: 'appl_your_apple_key_here',
    google: 'goog_your_google_key_here',
};

class SubscriptionService {
    private isInitialized = false;

    async initialize(userId?: string) {
        if (this.isInitialized) return;

        if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: API_KEYS.apple, appUserID: userId });
        } else if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: API_KEYS.google, appUserID: userId });
        }

        this.isInitialized = true;
    }

    async identify(userId: string) {
        if (!this.isInitialized) return;
        try {
            await Purchases.logIn(userId);
        } catch (e) {
            console.error('Error identifying user:', e);
        }
    }

    async logout() {
        if (!this.isInitialized) return;
        try {
            await Purchases.logOut();
        } catch (e) {
            console.error('Error logging out:', e);
        }
    }

    /**
     * Get available subscription packages (e.g., Monthly, Yearly)
     */
    async getOfferings(): Promise<PurchasesPackage[]> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
        } catch (e) {
            console.error('Error fetching offerings:', e);
        }
        return [];
    }

    /**
     * Purchase a package
     */
    async purchase(pack: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return typeof customerInfo.entitlements.active['pro_access'] !== 'undefined';
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Purchase error:', e);
            }
            return false;
        }
    }

    /**
     * Check if user is currently pro/subscribed
     */
    async checkSubscriptionStatus(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            // 'pro_access' is the identifier you set in RevenueCat Entitlements
            return typeof customerInfo.entitlements.active['pro_access'] !== 'undefined';
        } catch (e) {
            return false;
        }
    }

    /**
     * Restore purchases (required by Apple/Google)
     */
    async restorePurchases(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return typeof customerInfo.entitlements.active['pro_access'] !== 'undefined';
        } catch (e) {
            return false;
        }
    }
}

export const subscriptionService = new SubscriptionService();
