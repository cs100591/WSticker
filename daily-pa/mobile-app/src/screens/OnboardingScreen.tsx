
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ScrollView,
    Alert,
    Image,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { calendarService } from '@/services/CalendarService';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
    onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [usage, setUsage] = useState<string[]>([]);
    const [calPermission, setCalPermission] = useState(false);
    const { mode, setMode } = useThemeStore();

    const handleNext = () => {
        if (step === 1 && !name.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (step < 4) {
            setStep(step + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const toggleUsage = (item: string) => {
        if (usage.includes(item)) {
            setUsage(usage.filter(i => i !== item));
        } else {
            setUsage([...usage, item]);
        }
    };

    const requestCalendar = async () => {
        const { status, canAskAgain } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            await calendarService.syncWithDevice(mode === 'minimal' ? 'offline-user-device' : 'offline-user-device');
            setCalPermission(true);
            Alert.alert('Success', 'Calendar synced!');
        } else {
            if (!canAskAgain) {
                Alert.alert(
                    'Permission Required',
                    'Calendar access was refused. Please enable it in system settings to use this feature.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
            } else {
                Alert.alert('Permission needed', 'Please enable calendar permissions to sync your events.');
            }
        }
    };

    const finishOnboarding = async () => {
        try {
            // Save profile locally
            const profile = { name, usage, role: 'user' };
            await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

            // Default theme is already System, user can change later.
            // Or we can ask theme here? Let's skip to keep it simple as per request.

            onComplete();
        } catch (e) {
            console.error(e);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Let's set up your profile.</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>What should we call you?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                />
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Usage</Text>
            <Text style={styles.subtitle}>How do you plan to use this app?</Text>

            <View style={styles.optionsContainer}>
                {['Personal Productivity', 'Work / Business', 'Studies', 'Health & Fitness', 'Financial Tracking'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.optionBtn, usage.includes(item) && styles.optionBtnSelected]}
                        onPress={() => toggleUsage(item)}
                    >
                        <Text style={[styles.optionText, usage.includes(item) && styles.optionTextSelected]}>{item}</Text>
                        {usage.includes(item) && <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>Sync Calendar</Text>
            <Text style={styles.subtitle}>Connect your device calendar to see all your events in one place.</Text>

            <View style={styles.centerContent}>
                <TouchableOpacity
                    style={[styles.calendarBtn, calPermission && { backgroundColor: '#10B981' }]}
                    onPress={requestCalendar}
                    disabled={calPermission}
                >
                    <Ionicons name={calPermission ? "checkmark" : "calendar"} size={48} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.statusText}>{calPermission ? 'Synced!' : 'Tap to Sync'}</Text>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>All Set!</Text>
            <Text style={styles.subtitle}>You are ready to go.</Text>
            <View style={styles.centerContent}>
                <Ionicons name="rocket-outline" size={80} color="#3B82F6" />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </ScrollView>

            <View style={styles.footer}>
                {step > 1 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: 60 }} />}

                <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                    <Text style={styles.nextText}>{step === 4 ? 'Get Started' : 'Next'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    progressContainer: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 20, marginTop: 20, borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: 4, backgroundColor: '#3B82F6' },
    scrollContent: { padding: 24, flexGrow: 1 },
    stepContainer: { flex: 1 },
    title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 32 },

    inputGroup: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827' },

    optionsContainer: { gap: 12 },
    optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    optionBtnSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    optionText: { fontSize: 16, color: '#374151', fontWeight: '500' },
    optionTextSelected: { color: '#FFF' },

    centerContent: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    calendarBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
    statusText: { fontSize: 18, fontWeight: '600', color: '#374151' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFF' },
    backBtn: { padding: 12 },
    backText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
    nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
    nextText: { fontSize: 16, color: '#FFF', fontWeight: '600' }
});
