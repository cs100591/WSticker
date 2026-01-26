import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { subscriptionService } from '@/services/SubscriptionService';
import { PurchasesPackage } from 'react-native-purchases';

export const PaywallScreen = () => {
    const navigation = useNavigation();
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await subscriptionService.getOfferings();
            setPackages(offerings);
        } catch (e) {
            console.error('Failed to load offerings', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        setIsPurchasing(true);
        try {
            const success = await subscriptionService.purchase(pack);
            if (success) {
                Alert.alert('Success', 'Welcome to Pro!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (e) {
            // Error handling moved to service, but we can catch extra UI stuff here
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setIsPurchasing(true);
        const success = await subscriptionService.restorePurchases();
        setIsPurchasing(false);
        if (success) {
            Alert.alert('Restored', 'Your purchases have been restored.');
            navigation.goBack();
        } else {
            Alert.alert('Notice', 'No active subscriptions found to restore.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#EEF2FF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="diamond" size={48} color="#4F46E5" />
                    </View>
                    <Text style={styles.title}>Unlock Full Access</Text>
                    <Text style={styles.subtitle}>Supercharge your productivity with Daily PA Pro</Text>
                </View>

                <View style={styles.features}>
                    <FeatureItem icon="sync-outline" text="Unlimited Cloud Sync across all devices" />
                    <FeatureItem icon="infinite-outline" text="Unlimited Tasks & History" />
                    <FeatureItem icon="color-palette-outline" text="Premium Themes & Customization" />
                    <FeatureItem icon="analytics-outline" text="Advanced AI Analytics & Insights" />
                    <FeatureItem icon="lock-closed-outline" text="Biometric Lock & Security" />
                </View>

                <View style={styles.packages}>
                    {packages.length > 0 ? (
                        packages.map((pack) => (
                            <TouchableOpacity
                                key={pack.identifier}
                                style={styles.packageCard}
                                onPress={() => handlePurchase(pack)}
                                disabled={isPurchasing}
                            >
                                <View style={styles.packageInfo}>
                                    <Text style={styles.packageTitle}>{pack.product.title}</Text>
                                    <Text style={styles.packageDesc}>{pack.product.description}</Text>
                                </View>
                                <Text style={styles.packagePrice}>{pack.product.priceString}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>
                                No products configured. Please setup Google Play Console & RevenueCat.
                            </Text>
                            <Text style={styles.errorSubText}>
                                (This is expected if you haven't uploaded a build to Internal Testing yet)
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={handleRestore}
                    disabled={isPurchasing}
                >
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Recurring billing, cancel anytime. By continuing you agree to our Terms of Service and Privacy Policy.
                </Text>
            </ScrollView>

            {isPurchasing && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
};

const FeatureItem = ({ icon, text }: { icon: any, text: string }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
            <Ionicons name={icon} size={20} color="#4F46E5" />
        </View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 24, paddingBottom: 60 },
    closeBtn: { alignSelf: 'flex-end', padding: 8, marginTop: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    iconContainer: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0E7FF',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', maxWidth: '80%' },
    features: { marginBottom: 40 },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    featureIcon: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    featureText: { fontSize: 16, color: '#374151', fontWeight: '500' },
    packages: { gap: 16, marginBottom: 24 },
    packageCard: {
        backgroundColor: '#fff', borderRadius: 16, padding: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 2, borderColor: '#4F46E5',
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
        elevation: 4
    },
    packageInfo: { flex: 1, marginRight: 16 },
    packageTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    packageDesc: { fontSize: 14, color: '#6B7280' },
    packagePrice: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
    errorBox: { padding: 20, backgroundColor: '#FEF2F2', borderRadius: 12, alignItems: 'center' },
    errorText: { color: '#EF4444', fontWeight: '600', textAlign: 'center', marginBottom: 4 },
    errorSubText: { color: '#B91C1C', fontSize: 12, textAlign: 'center' },
    restoreBtn: { padding: 16, alignItems: 'center' },
    restoreText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
    disclaimer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center'
    }
});
