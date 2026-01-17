
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WeatherData } from '@/services/weatherService';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore, translations, useEffectiveLanguage } from '@/store/languageStore';

interface WeatherHeaderProps {
    weather: WeatherData | null;
    greeting: string;
    emoji: string;
    children?: React.ReactNode;
}

export const WeatherHeader: React.FC<WeatherHeaderProps> = ({ weather, greeting, emoji, children }) => {
    const lang = useEffectiveLanguage();
    const t = translations[lang];
    // Animation for "breathing" effect
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false, // color interpolation doesn't support native driver
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const getGradientColors = (): readonly [string, string, ...string[]] => {
        if (!weather) return ['#3B82F6', '#2563EB', '#1D4ED8']; // Default Blue

        const { weatherCode, isDay } = weather;

        // Night time override
        if (!isDay) return ['#0f2027', '#203a43', '#2c5364']; // Deep space

        // Weather based
        if (weatherCode === 0) return ['#2980B9', '#6DD5FA', '#FFFFFF']; // Clear Sky (Blue -> White)
        if (weatherCode >= 1 && weatherCode <= 3) return ['#83a4d4', '#b6fbff']; // Cloudy (Soft Blue)
        if (weatherCode >= 51 && weatherCode <= 67) return ['#373B44', '#4286f4']; // Rainy (Dark Grey -> Blue)
        if (weatherCode >= 71 && weatherCode <= 77) return ['#E6DADA', '#274046']; // Snow (White -> Cold Grey)
        if (weatherCode >= 80) return ['#232526', '#414345']; // Storm (Darkness)

        // Hot
        if (weather.temperature > 30) return ['#FF512F', '#DD2476']; // Burning Orange

        return ['#3B82F6', '#60A5FA']; // Default
    };

    const getOverlayColor = () => {
        if (!weather || !weather.isDay) return 'rgba(0,0,0,0.3)';
        if (weather.weatherCode === 0) return 'rgba(255,255,255,0.2)'; // Sun glimmer
        return 'rgba(255,255,255,0.0)';
    };

    const currentGradient = getGradientColors();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={currentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Animated Overlay for "Live" effect */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        backgroundColor: getOverlayColor(),
                        opacity: pulseAnim
                    }
                ]}
            />

            {/* Cloud/Sun Decoration (Simple circles/shapes could be added here) */}

            <View style={styles.content}>
                <View>
                    <Text style={styles.greeting}>{greeting} {emoji}</Text>
                    <Text style={styles.subtitle}>{t.productivityOverview}</Text>
                </View>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30, // Curved bottom for modern look
        borderBottomRightRadius: 30,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 10,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
