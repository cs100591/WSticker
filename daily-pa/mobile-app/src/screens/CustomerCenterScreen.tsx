/**
 * Customer Center Screen - Self-service subscription management
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import { useNavigation } from '@react-navigation/native';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export const CustomerCenterScreen = () => {
    const navigation = useNavigation();
    const { checkSubscription } = useSubscriptionStore();

    const handleDismiss = async () => {
        await checkSubscription();
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <RevenueCatUI.CustomerCenter
                onDismiss={handleDismiss}
                onRestoreCompleted={async () => {
                    await checkSubscription();
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
