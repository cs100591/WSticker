import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calendarService } from '@/services/CalendarService';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const WelcomeScreen = () => {
    const navigation = useNavigation<any>();
    const [isLoading, setIsLoading] = useState(false);
    const lang = useEffectiveLanguage();
    const t = translations[lang];

    // Additional translations for this screen
    const strings = {
        zh: {
            title: '欢迎使用 Daily PA',
            subtitle: '您的智能日程助理',
            permissionTitle: '连接您的日历',
            permissionDesc: '我们需要访问您的本地日历，以便为您提供统一的日程管理体验。',
            connectBtn: '授权访问日历',
            skipBtn: '稍后设置',
            privacy: '您的日历数据仅保存在本地设备上。',
        },
        en: {
            title: 'Welcome to Daily PA',
            subtitle: 'Your Intelligent Schedule Assistant',
            permissionTitle: 'Connect Your Calendar',
            permissionDesc: 'We need access to your local calendar to provide a unified scheduling experience.',
            connectBtn: 'Authorize Access',
            skipBtn: 'Set up later',
            privacy: 'Your calendar data stays local on your device.',
        }
    };

    const text = strings[lang === 'zh' ? 'zh' : 'en'];

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            // Use a mock user ID for offline mode since we removed login
            const offlineUserId = 'offline-user-device';

            // Request permissions and sync
            await calendarService.syncWithDevice(offlineUserId);

            Alert.alert(
                lang === 'zh' ? '连接成功' : 'Connected Successfully',
                lang === 'zh' ? '您的本地日历已同步。' : 'Your local calendar has been synced.',
                [{
                    text: 'OK', onPress: async () => {
                        await AsyncStorage.setItem('hasLaunched', 'true');
                        navigation.replace('MainTabs');
                    }
                }]
            );
        } catch (error) {
            console.error('Permission Error:', error);
            Alert.alert(
                lang === 'zh' ? '授权失败' : 'Authorization Failed',
                lang === 'zh' ? '请在设置中允许访问日历，或者点击“稍后设置”进入。' : 'Please allow calendar access in settings, or tap "Set up later".'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasLaunched', 'true');
        navigation.replace('MainTabs');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#EFF6FF', '#FFFFFF']}
                style={styles.background}
            />

            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>PA</Text>
                    </View>
                    <Text style={styles.title}>{text.title}</Text>
                    <Text style={styles.subtitle}>{text.subtitle}</Text>
                </View>

                <View style={styles.illustration}>
                    <Ionicons name="calendar" size={120} color="#3B82F6" />
                    <View style={styles.badge}>
                        <Ionicons name="checkmark" size={24} color="#fff" />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{text.permissionTitle}</Text>
                    <Text style={styles.cardDesc}>{text.permissionDesc}</Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleConnect}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>{text.connectBtn}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleSkip}
                        disabled={isLoading}
                    >
                        <Text style={styles.secondaryButtonText}>{text.skipBtn}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>{text.privacy}</Text>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    logoText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    illustration: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 40,
    },
    badge: {
        position: 'absolute',
        bottom: 0,
        right: 80,
        backgroundColor: '#10B981',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#64748B',
        fontSize: 15,
        fontWeight: '600',
    },
    footerText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 16,
    },
});
