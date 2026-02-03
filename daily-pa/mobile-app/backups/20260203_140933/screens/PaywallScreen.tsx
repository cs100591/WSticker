/**
 * Paywall Screen - Displays subscription options using RevenueCat UI
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export const PaywallScreen = () => {
    const navigation = useNavigation();
    const { checkSubscription } = useSubscriptionStore();

    const handleDismiss = async () => {
        // Refresh status when dismissed (in case of purchase)
        await checkSubscription();
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleRestoreCompleted = async (customerInfo: any) => {
        await checkSubscription();
        Alert.alert('Restored', 'Your purchases have been restored.');
    };

    return (
        <View style={styles.container}>
            <RevenueCatUI.Paywall
                onDismiss={handleDismiss}
                onRestoreCompleted={handleRestoreCompleted}
                onPurchaseCompleted={async ({ customerInfo }: { customerInfo: any }) => {
                    await checkSubscription();
                    handleDismiss();
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
